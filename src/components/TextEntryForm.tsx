import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { TextInput } from './TextInput';
import { SubmitButton } from './SubmitButton';

interface TextEntryFormProps {
  onSubmit: (content: string) => Promise<void>;
  error: string | null;
}

export const TextEntryForm: React.FC<TextEntryFormProps> = ({ onSubmit, error }) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    console.log('📝 Submitting new entry');
    setIsSubmitting(true);
    try {
      await onSubmit(inputText.trim());
      setInputText('');
      console.log('✅ Entry submitted successfully');
    } catch (error) {
      console.error('❌ Failed to save entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            <p className="text-red-600 text-sm">エラー: {error}</p>
          </div>
        )}
        
        <SubmitButton isSubmitting={isSubmitting} />
      </form>
    </div>
  );
};