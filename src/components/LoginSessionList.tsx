import React from 'react';
import { Monitor, Smartphone, Tablet, MapPin, Clock, LogOut, Shield } from 'lucide-react';
import type { LoginSession } from '../types';

interface LoginSessionListProps {
  sessions: LoginSession[];
  onDeactivateSession: (sessionId: string) => void;
  loading?: boolean;
}

export const LoginSessionList: React.FC<LoginSessionListProps> = ({ 
  sessions, 
  onDeactivateSession, 
  loading = false 
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

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
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
        <h2 className="text-xl font-semibold text-gray-800 mb-6">ログインセッション</h2>
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
        <div className="p-2 bg-green-100 rounded-lg">
          <Shield className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">ログインセッション</h2>
      </div>
      
      {sessions.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>アクティブなセッションがありません</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sessions.map((session) => (
            <div key={session.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getDeviceIcon(session.device_type)}
                    <span className="font-medium text-slate-800">
                      {getBrowserInfo(session.user_agent)} - {session.device_type}
                    </span>
                    {session.is_active && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        アクティブ
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>ログイン: {formatDate(session.login_time)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>最終アクティビティ: {formatDate(session.last_activity)}</span>
                    </div>
                    
                    {session.ip_address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>IP: {session.ip_address}</span>
                      </div>
                    )}
                    
                    {session.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>場所: {session.location}</span>
                      </div>
                    )}
                    
                    {!session.is_active && session.logout_time && (
                      <div className="flex items-center gap-1">
                        <LogOut className="w-3 h-3" />
                        <span>ログアウト: {formatDate(session.logout_time)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {session.is_active && (
                  <button
                    onClick={() => onDeactivateSession(session.id)}
                    className="flex-shrink-0 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};