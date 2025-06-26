import React from 'react';

interface AuthFormToggleProps {
  isSignUp: boolean;
  onToggle: () => void;
}

export const AuthFormToggle: React.FC<AuthFormToggleProps> = ({ isSignUp, onToggle }) => {
  return (
    <div className="mt-6 text-center">
      <button
        type="button"
        onClick={onToggle}
        className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
      >
        {isSignUp 
          ? 'すでにアカウントをお持ちですか？ サインイン' 
          : 'アカウントをお持ちでないですか？ 新規登録'
        }
      </button>
    </div>
  );
};