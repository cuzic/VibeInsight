import React from 'react';

interface AuthFormMessagesProps {
  error: string | null;
  success: string | null;
}

export const AuthFormMessages: React.FC<AuthFormMessagesProps> = ({ error, success }) => {
  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}
    </>
  );
};