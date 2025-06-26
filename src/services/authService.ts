import { supabase } from '../lib/supabase';
import type { Profile, LoginHistory } from '../types';

export const authService = {
  async fetchProfile(userId: string): Promise<Profile | null> {
    console.log('👤 Fetching profile for user:', userId);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.log('⚠️ Profile fetch error:', error);
      
      if (error.code === 'PGRST116') {
        console.log('ℹ️ Profile not found, this is normal for new users');
      } else {
        console.error('❌ Unexpected error fetching profile:', error);
      }
      return null;
    }

    console.log('✅ Profile fetched successfully:', data);
    return data;
  },

  async fetchLoginHistory(userId: string): Promise<LoginHistory[]> {
    console.log('📋 Fetching login history for user:', userId);
    
    const { data, error } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50); // 最新50件まで

    if (error) {
      console.error('❌ Error fetching login history:', error);
      return [];
    }

    console.log('✅ Login history fetched successfully:', data?.length || 0, 'records');
    return data || [];
  },

  async recordLoginAttempt(
    email: string, 
    loginType: 'signin' | 'signup', 
    success: boolean, 
    userId?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      console.log('📝 Recording login attempt:', { email, loginType, success });
      
      // ブラウザ情報を取得
      const userAgent = navigator.userAgent;
      
      const loginRecord = {
        user_id: userId || null,
        email,
        login_type: loginType,
        user_agent: userAgent,
        success,
        error_message: errorMessage || null,
      };

      const { error } = await supabase
        .from('login_history')
        .insert([loginRecord]);

      if (error) {
        console.error('❌ Error recording login attempt:', error);
      } else {
        console.log('✅ Login attempt recorded successfully');
      }
    } catch (error) {
      console.error('❌ Error in recordLoginAttempt:', error);
    }
  },

  async signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      console.log('📝 Sign up result:', error ? 'Error' : 'Success', error?.message);
      
      // ログイン履歴を記録
      await this.recordLoginAttempt(
        email, 
        'signup', 
        !error, 
        data.user?.id,
        error?.message
      );
      
      return { data, error };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      
      // エラーの場合もログイン履歴を記録
      await this.recordLoginAttempt(
        email, 
        'signup', 
        false, 
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      return { data: null, error };
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('🔑 Sign in result:', error ? 'Error' : 'Success', error?.message);
      
      // ログイン履歴を記録
      await this.recordLoginAttempt(
        email, 
        'signin', 
        !error, 
        data.user?.id,
        error?.message
      );
      
      return { data, error };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      
      // エラーの場合もログイン履歴を記録
      await this.recordLoginAttempt(
        email, 
        'signin', 
        false, 
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      return { data: null, error };
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      console.log('🚪 Sign out result:', error ? 'Error' : 'Success', error?.message);
      return { error };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { error };
    }
  }
};