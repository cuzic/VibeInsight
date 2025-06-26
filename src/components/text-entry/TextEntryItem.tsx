import React from 'react';
import { Trash2, Calendar } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';
import type { TextEntry } from '../../types';

interface TextEntryItemProps {
  entry: TextEntry;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const TextEntryItem: React.FC<TextEntryItemProps> = ({ 
  entry, 
  onDelete, 
  isDeleting 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 break-words whitespace-pre-wrap">
            {entry.content}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(entry.created_at)}</span>
          </div>
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          disabled={isDeleting}
          className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="削除"
        >
          {isDeleting ? (
            <LoadingSpinner />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};