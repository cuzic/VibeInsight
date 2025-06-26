import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Save } from 'lucide-react';

interface SubmitButtonProps {
  isSubmitting: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ isSubmitting }) => {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isSubmitting ? (
        <>
          <LoadingSpinner />
          <span>保存中...</span>
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          <span>保存</span>
        </>
      )}
    </button>
  );
};