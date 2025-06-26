import React from 'react';
import { Trash2, Calendar } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import type { TextEntry } from '../types';

interface TextEntryListProps {
  entries: TextEntry[];
  onDelete: (id: string) => void;
  loading?: boolean;
  deleteLoading?: string | null;
}

export const TextEntryList: React.FC<TextEntryListProps> = ({ 
  entries, 
  onDelete, 
  loading = false,
  deleteLoading = null
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">保存されたテキスト</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-50 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">保存されたテキスト</h2>
      
      {entries.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>まだテキストが保存されていません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
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
                  disabled={deleteLoading === entry.id}
                  className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="削除"
                >
                  {deleteLoading === entry.id ? (
                    <LoadingSpinner />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};