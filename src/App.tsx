import React, { useEffect, useState } from 'react';
import { AuthForm } from './components/AuthForm';
import { MainApp } from './components/MainApp';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, profile, loading, signOut } = useAuth();
  const [forceShowApp, setForceShowApp] = useState(false);

  console.log('🎯 App render state:', { 
    hasUser: !!user, 
    userId: user?.id,
    loading,
    forceShowApp,
    env: {
      hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      isProduction: import.meta.env.PROD
    }
  });

  // 環境変数チェック - 本番環境では緩い条件にする
  const hasValidConfig = import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  // プレースホルダー値のチェック（開発環境のみ）
  const isPlaceholderUrl = !import.meta.env.PROD && (
    import.meta.env.VITE_SUPABASE_URL === 'your_supabase_project_url' || 
    import.meta.env.VITE_SUPABASE_URL === 'https://your-project-id.supabase.co'
  );
  const isPlaceholderKey = !import.meta.env.PROD && (
    import.meta.env.VITE_SUPABASE_ANON_KEY === 'your_supabase_anon_key' || 
    import.meta.env.VITE_SUPABASE_ANON_KEY === 'your_actual_anon_key'
  );

  // 5秒後に強制的にアプリを表示
  useEffect(() => {
    const forceTimeout = setTimeout(() => {
      console.log('⏰ Force showing app after 5 seconds');
      setForceShowApp(true);
    }, 5000);

    return () => clearTimeout(forceTimeout);
  }, []);

  // 環境変数が設定されていない場合の表示（開発環境のみ）
  if (!import.meta.env.PROD && (!hasValidConfig || isPlaceholderUrl || isPlaceholderKey)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">設定が必要です</h1>
          <p className="text-gray-600 mb-6">
            このアプリケーションを使用するには、Supabaseの環境変数を設定する必要があります。
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
            <p className="font-medium text-gray-800 mb-2">必要な環境変数:</p>
            <ul className="space-y-1 text-gray-600">
              <li>• VITE_SUPABASE_URL</li>
              <li>• VITE_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            詳細な設定方法については、SETUP_GUIDE.mdを参照してください。
          </p>
        </div>
      </div>
    );
  }

  // ローディング中の表示（最大5秒）
  if (loading && !forceShowApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
          <p className="text-xs text-gray-400 mt-2">
            長時間読み込み中の場合は、ページを再読み込みしてください
          </p>
          <button 
            onClick={() => setForceShowApp(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            スキップ
          </button>
        </div>
      </div>
    );
  }

  // ユーザーがログインしていない場合はログインページを表示
  if (!user) {
    console.log('👤 No user found, showing auth form');
    return <AuthForm />;
  }

  console.log('✅ User authenticated, showing main app');

  // ログイン後のメインアプリケーション
  return (
    <MainApp 
      profile={profile}
      onSignOut={signOut}
    />
  );
}

export default App;