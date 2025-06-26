import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile, AuthHookReturn } from '../types';

export const useAuth = (): AuthHookReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;

    // 強制的に5秒後にローディングを終了
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ Force ending loading after 5 seconds');
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 5000);

    const initializeAuth = async () => {
      try {
        console.log('🔍 Starting auth initialization...');
        
        // 簡単なセッション取得
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted || !mountedRef.current) return;
        
        console.log('📋 Session result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          error: error?.message 
        });

        if (session?.user) {
          setUser(session.user);
          // プロファイル取得は非同期で行い、ローディングをブロックしない
          fetchProfile(session.user.id).catch(console.error);
        } else {
          setUser(null);
          setProfile(null);
        }
        
        // 初期化完了 - ローディング終了
        console.log('✅ Auth initialization complete');
        setLoading(false);
        
        // タイムアウトをクリア
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted && mountedRef.current) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          
          // タイムアウトをクリア
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      }
    };

    // 認証状態変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || !mountedRef.current) return;
        
        console.log('🔄 Auth state changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id).catch(console.error);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    // 初期化実行
    initializeAuth();

    return () => {
      mounted = false;
      mountedRef.current = false;
      subscription.unsubscribe();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('👤 Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!mountedRef.current) return;

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Profile not found, this is normal for new users');
        } else {
          console.error('❌ Error fetching profile:', error);
        }
        setProfile(null);
      } else {
        console.log('✅ Profile fetched successfully');
        setProfile(data);
      }
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error);
      if (mountedRef.current) {
        setProfile(null);
      }
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log('📝 Attempting sign up for:', email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      console.log('📝 Sign up result:', error ? 'Error' : 'Success');
      return { data, error };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Attempting sign in for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('🔑 Sign in result:', error ? 'Error' : 'Success');
      return { data, error };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    console.log('🚪 Attempting sign out');
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setProfile(null);
        setUser(null);
      }
      console.log('🚪 Sign out result:', error ? 'Error' : 'Success');
      return { error };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { error };
    }
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };
};