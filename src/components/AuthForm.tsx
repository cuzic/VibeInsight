import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, LogIn, Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { testSupabaseConnection } from '../lib/supabase';

export const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [connectionChecked, setConnectionChecked] = useState(false);
  const { signUp, signIn } = useAuth();

  // 初回マウント時に接続チェック
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    console.log('🔍 Checking Supabase connection...');
    setConnectionChecked(false);
    
    try {
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      setConnectionChecked(true);
      
      if (!isConnected) {
        setError('Supabaseへの接続に失敗しました。環境変数を確認してください。');
      } else {
        setError(null);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
      setConnectionChecked(true);
      setError('接続テストに失敗しました。');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // 接続チェック（まだチェックされていない場合）
    if (!connectionChecked) {
      await checkConnection();
    }
    
    if (connectionStatus === 'disconnected') {
      setLoading(false);
      return;
    }

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        console.error('Auth error:', error);
        
        // エラーメッセージの改善
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          setError('ネットワーク接続またはSupabaseサーバーへの接続に問題があります。');
        } else if (isSignUp && error.message.includes('User already registered')) {
          setError('このメールアドレスはすでに登録されています。サインインしてください。');
        } else if (error.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません。');
        } else if (error.message.includes('Email not confirmed')) {
          setError('メールアドレスが確認されていません。確認メールをチェックしてください。');
        } else {
          setError(`エラー: ${error.message}`);
        }
      } else if (isSignUp) {
        setSuccess('アカウントが作成されました。サインインしてください。');
        setIsSignUp(false);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('予期しないエラーが発生しました。ページを再読み込みしてください。');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            {isSignUp ? (
              <UserPlus className="w-8 h-8 text-indigo-600" />
            ) : (
              <LogIn className="w-8 h-8 text-indigo-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isSignUp ? '新規登録' : 'ログイン'}
          </h1>
          <p className="text-gray-600">
            {isSignUp ? 'アカウントを作成してください' : 'サインインしてください'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="メールアドレスを入力"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="パスワードを入力"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-600 text-sm">{error}</p>
                  {error.includes('環境変数') && (
                    <div className="mt-2 text-xs text-red-500">
                      <p>以下を確認してください：</p>
                      <ul className="list-disc list-inside mt-1">
                        <li>VITE_SUPABASE_URL が設定されているか</li>
                        <li>VITE_SUPABASE_ANON_KEY が設定されているか</li>
                        <li>Supabaseプロジェクトが有効か</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || connectionStatus === 'disconnected'}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isSignUp ? 'アカウント作成中...' : 'サインイン中...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {isSignUp ? (
                  <UserPlus className="w-5 h-5 mr-2" />
                ) : (
                  <User className="w-5 h-5 mr-2" />
                )}
                {isSignUp ? 'アカウント作成' : 'サインイン'}
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
              setEmail('');
              setPassword('');
            }}
            className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            {isSignUp 
              ? 'すでにアカウントをお持ちですか？ サインイン' 
              : '新規登録'
            }
          </button>
        </div>
      </div>
    </div>
  );
};