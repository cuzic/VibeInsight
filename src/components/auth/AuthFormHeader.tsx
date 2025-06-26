import React from 'react';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthFormHeaderProps {
  isSignUp: boolean;
}

export const AuthFormHeader: React.FC<AuthFormHeaderProps> = ({ isSignUp }) => {
  return (
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
  );
};