import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">
        {title}
      </h1>
      {subtitle && (
        <p className="text-slate-600 text-sm">
          {subtitle}
        </p>
      )}
    </div>
  );
};