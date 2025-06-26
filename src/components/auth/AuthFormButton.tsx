import React from 'react';
import { User, UserPlus } from 'lucide-react';

interface AuthFormButtonProps {
  isSignUp: boolean;
  loading: boolean;
}

export const AuthFormButton: React.FC<AuthFormButtonProps> = ({ isSignUp, loading }) => {
  return (
    <button
      type="submit"
      disabled={loading}
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
  );
};