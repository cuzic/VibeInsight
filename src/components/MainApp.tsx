import React, { useState } from 'react';
import { FileText, LogOut, User, AlertCircle, RefreshCw } from 'lucide-react';
import { TextInput } from './TextInput';
import { SubmitButton } from './SubmitButton';
import { TextEntryList } from './TextEntryList';
import { PageHeader } from './PageHeader';
import { Decoration } from './Decoration';
import { useTextEntries } from '../hooks/useTextEntries';
import type { Profile } from '../types';

interface MainAppProps {
  profile: Profile | null;
  onSignOut: () => void;
}

export const MainApp: React.FC<MainAppProps> = ({ profile, onSignOut }) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { entries, loading, error, deleteLoading, saveEntry, deleteEntry, refetch } = useTextEntries();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    console.log('📝 Submitting new entry');
    setIsSubmitting(true);
    try {
      await saveEntry(inputText.trim());
      setInputText('');
      console.log('✅ Entry submitted successfully');
    } catch (error) {
      console.error('❌ Failed to save entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    console.log('🚪 Signing out');
    await onSignOut();
  };

  const handleRetry = () => {
    console.log('🔄 Retrying data fetch');
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <PageHeader title="日本語テキスト入力ページ" />
            {profile && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 px-3 py-1 rounded-lg">
                <User className="w-4 h-4" />
                <span>{profile.email}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            サインアウト
          </button>
        </div>
        
        <Decoration />
        
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">新しいエントリーを追加</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              value={inputText}
              onChange={setInputText}
              placeholder="ここにテキストを入力してください..."
            />
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-red-600 text-sm">エラー: {error}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-2 flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  再試行
                </button>
              </div>
            )}
            
            <SubmitButton isSubmitting={isSubmitting} />
          </form>
        </div>

        <TextEntryList 
          entries={entries} 
          loading={loading} 
          deleteLoading={deleteLoading}
          onDelete={deleteEntry}
        />
      </div>
    </div>
  );
};