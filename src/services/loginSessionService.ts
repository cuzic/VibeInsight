import { supabase } from '../lib/supabase';
import type { LoginSession } from '../types';

export const loginSessionService = {
  // 新しいログインセッションを作成
  async createSession(
    userId: string,
    sessionToken: string,
    ipAddress?: string,
    userAgent?: string,
    deviceType: string = 'unknown',
    location?: string
  ): Promise<LoginSession> {
    console.log('🔐 Creating new login session for user:', userId);
    
    const { data, error } = await supabase
      .from('user_login_sessions')
      .insert([{
        user_id: userId,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        location: location,
        login_time: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating login session:', error);
      throw error;
    }

    console.log('✅ Login session created successfully:', data.id);
    return data;
  },

  // ユーザーのアクティブなセッションを取得
  async getActiveSessions(userId: string): Promise<LoginSession[]> {
    console.log('📋 Fetching active sessions for user:', userId);
    
    const { data, error } = await supabase
      .from('user_login_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('❌ Error fetching active sessions:', error);
      throw error;
    }

    console.log('✅ Active sessions fetched:', data?.length || 0, 'sessions');
    return data || [];
  },

  // ユーザーの全ログイン履歴を取得
  async getLoginHistory(userId: string, limit: number = 50): Promise<LoginSession[]> {
    console.log('📋 Fetching login history for user:', userId);
    
    const { data, error } = await supabase
      .from('user_login_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('login_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching login history:', error);
      throw error;
    }

    console.log('✅ Login history fetched:', data?.length || 0, 'records');
    return data || [];
  },

  // セッションの最終アクティビティ時刻を更新
  async updateLastActivity(sessionToken: string): Promise<void> {
    console.log('🔄 Updating last activity for session');
    
    const { error } = await supabase
      .from('user_login_sessions')
      .update({ 
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('session_token', sessionToken)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error updating last activity:', error);
      throw error;
    }

    console.log('✅ Last activity updated successfully');
  },

  // セッションを無効化（ログアウト）
  async deactivateSession(sessionToken: string, userId: string): Promise<void> {
    console.log('🚪 Deactivating session for user:', userId);
    
    const { error } = await supabase
      .from('user_login_sessions')
      .update({ 
        is_active: false,
        logout_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('session_token', sessionToken)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error deactivating session:', error);
      throw error;
    }

    console.log('✅ Session deactivated successfully');
  },

  // 特定のセッションを無効化
  async deactivateSessionById(sessionId: string, userId: string): Promise<void> {
    console.log('🚪 Deactivating session by ID:', sessionId);
    
    const { error } = await supabase
      .from('user_login_sessions')
      .update({ 
        is_active: false,
        logout_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error deactivating session by ID:', error);
      throw error;
    }

    console.log('✅ Session deactivated by ID successfully');
  },

  // ユーザーの全セッションを無効化
  async deactivateAllSessions(userId: string): Promise<void> {
    console.log('🚪 Deactivating all sessions for user:', userId);
    
    const { error } = await supabase
      .from('user_login_sessions')
      .update({ 
        is_active: false,
        logout_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error deactivating all sessions:', error);
      throw error;
    }

    console.log('✅ All sessions deactivated successfully');
  },

  // セッショントークンでセッション情報を取得
  async getSessionByToken(sessionToken: string): Promise<LoginSession | null> {
    console.log('🔍 Fetching session by token');
    
    const { data, error } = await supabase
      .from('user_login_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ Session not found or inactive');
        return null;
      }
      console.error('❌ Error fetching session by token:', error);
      throw error;
    }

    console.log('✅ Session found by token');
    return data;
  },

  // デバイスタイプを判定
  detectDeviceType(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  },

  // セッショントークンを生成
  generateSessionToken(): string {
    return crypto.randomUUID() + '-' + Date.now().toString(36);
  }
};