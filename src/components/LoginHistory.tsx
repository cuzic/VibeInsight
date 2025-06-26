import React from 'react';
import { Clock, CheckCircle, XCircle, Monitor, Calendar } from 'lucide-react';
import type { LoginHistory } from '../types';

interface LoginHistoryProps {
  history: LoginHistory[];
  loading?: boolean;
}

export const LoginHistory: React.FC<LoginHistoryProps> = ({ history, loading = false }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLoginTypeText = (type: string) => {
    return type === 'signin' ? 'サインイン' : '新規登録';
  };

  const getBrowserInfo = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">ログイン履歴</h2>
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
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">ログイン履歴</h2>
      </div>
      
      {history.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>ログイン履歴がありません</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((record) => (
            <div key={record.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {record.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className={`font-medium ${record.success ? 'text-green-700' : 'text-red-700'}`}>
                      {getLoginTypeText(record.login_type)}
                      {record.success ? ' 成功' : ' 失敗'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(record.created_at)}</span>
                    </div>
                    
                    {record.user_agent && (
                      <div className="flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        <span>{getBrowserInfo(record.user_agent)}</span>
                      </div>
                    )}
                    
                    {!record.success && record.error_message && (
                      <div className="text-red-600 text-xs mt-1">
                        エラー: {record.error_message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};