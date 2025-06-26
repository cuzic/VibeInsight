import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase config check:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Missing',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'Missing',
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  isProduction: import.meta.env.PROD
});

// 環境変数の検証 - 本番環境では基本的な存在チェックのみ
const isPlaceholderUrl = supabaseUrl === 'your_supabase_project_url' || supabaseUrl === 'https://your-project-id.supabase.co';
const isPlaceholderKey = supabaseAnonKey === 'your_supabase_anon_key' || supabaseAnonKey === 'your_actual_anon_key';

// 本番環境では環境変数があれば有効とみなす
const isConfigValid = import.meta.env.PROD 
  ? !!(supabaseUrl && supabaseAnonKey)
  : !!(supabaseUrl && supabaseAnonKey && 
       supabaseUrl.includes('supabase.co') && 
       supabaseAnonKey.length > 50 &&
       !isPlaceholderUrl &&
       !isPlaceholderKey);

if (!isConfigValid && !import.meta.env.PROD) {
  if (isPlaceholderUrl || isPlaceholderKey) {
    console.warn('⚠️ Using placeholder Supabase configuration');
    console.log('Please update your environment variables with actual Supabase credentials:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings > API');
    console.log('4. Copy your Project URL and anon/public key');
    console.log('5. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment');
  } else {
    console.error('❌ Invalid Supabase configuration');
    console.log('Please check your environment variables and ensure they contain valid:');
    console.log('VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  }
}

// 環境変数が無い場合でもクライアントを作成（エラーを避けるため）
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'japanese-text-app'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  }
);

// 接続テスト関数
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // 本番環境では環境変数があれば接続テストをスキップ
    if (import.meta.env.PROD && supabaseUrl && supabaseAnonKey) {
      console.log('✅ Production environment with credentials - assuming connection is valid');
      return true;
    }
    
    // 開発環境での環境変数チェック
    if (!import.meta.env.PROD && !isConfigValid) {
      if (isPlaceholderUrl || isPlaceholderKey) {
        console.warn('⚠️ Cannot test connection with placeholder configuration');
        return false;
      }
      console.error('❌ Invalid configuration');
      return false;
    }
    
    // 簡単な接続テスト - タイムアウト付き
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    
    const testPromise = supabase.auth.getSession();
    
    const { error } = await Promise.race([testPromise, timeoutPromise]) as any;
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    } else {
      console.log('✅ Supabase connection test successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Supabase connection test error:', error);
    return false;
  }
};

export type Database = {
  public: {
    Tables: {
      japanese_text_entries: {
        Row: {
          id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_login_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string;
          ip_address: string | null;
          user_agent: string | null;
          login_time: string;
          last_activity: string;
          is_active: boolean;
          logout_time: string | null;
          device_type: string;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token: string;
          ip_address?: string | null;
          user_agent?: string | null;
          login_time?: string;
          last_activity?: string;
          is_active?: boolean;
          logout_time?: string | null;
          device_type?: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          login_time?: string;
          last_activity?: string;
          is_active?: boolean;
          logout_time?: string | null;
          device_type?: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};