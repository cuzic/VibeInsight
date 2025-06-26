import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick?: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 group bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-gray-300"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
      <span className="text-sm font-medium">戻る</span>
    </button>
  );
};