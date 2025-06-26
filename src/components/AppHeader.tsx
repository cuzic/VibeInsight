import React from 'react';
import { LogOut, User } from 'lucide-react';
import type { Profile } from '../types';

interface AppHeaderProps {
  profile: Profile | null;
  onSignOut: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ profile, onSignOut }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">日本語テキスト入力ページ</h1>
        {profile && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 px-3 py-1 rounded-lg">
            <User className="w-4 h-4" />
            <span>{profile.email}</span>
          </div>
        )}
      </div>
      <button
        onClick={onSignOut}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        サインアウト
      </button>
    </div>
  );
};