import React from 'react';

export const Decoration: React.FC = () => {
  return (
    <div className="mt-8 text-center">
      <div className="inline-flex items-center gap-1 text-slate-400">
        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
      </div>
    </div>
  );
};