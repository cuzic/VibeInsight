import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "ここに日本語を入力してください...",
  label = "メッセージ"
}) => {
  return (
    <div>
      <label htmlFor="japanese-text" className="block text-sm font-medium text-slate-700 mb-3">
        {label}
      </label>
      <textarea
        id="japanese-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-32 px-4 py-3 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder-slate-400"
        style={{ fontFamily: '"Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif' }}
      />
    </div>
  );
};