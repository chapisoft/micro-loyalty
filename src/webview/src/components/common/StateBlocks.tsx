import React from 'react';
import { Inbox, RefreshCw } from 'lucide-react';

export const SkeletonLine: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
);

export const SkeletonCard: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => (
  <div className={`bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-xs ${className}`}>
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3.5 w-2/3" />
        <SkeletonLine className="h-2.5 w-1/2" />
      </div>
    </div>
    {Array.from({ length: Math.max(0, rows - 1) }).map((_, idx) => (
      <SkeletonLine key={idx} className={idx % 2 === 0 ? 'h-3 w-full' : 'h-3 w-4/5'} />
    ))}
  </div>
);

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}> = ({ icon, title, description, actionLabel, onAction, className = '' }) => (
  <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 text-center space-y-2.5 shadow-xs ${className}`}>
    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
      {icon || <Inbox className="w-6 h-6" />}
    </div>
    <h4 className="text-sm font-bold text-slate-800">{title}</h4>
    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <div className="pt-1">
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      </div>
    )}
  </div>
);
