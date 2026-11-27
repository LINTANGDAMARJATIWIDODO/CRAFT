import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-md bg-charcoal-800/80 border border-subtle/40', className)} />
);

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="bg-charcoal-900 border border-subtle rounded-xl p-5 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="h-6 w-3/4" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-3 w-full" />
    ))}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({ title = 'Unable to load data', message, onRetry, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center border border-rose-800/40 rounded-xl bg-rose-950/15',
      className
    )}
  >
    <div className="w-11 h-11 rounded-xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center mb-3 text-rose-400">
      <AlertTriangle className="w-5 h-5" />
    </div>
    <h4 className="text-sm font-semibold text-ivory-100">{title}</h4>
    <p className="text-xs text-charcoal-400 max-w-md mt-1 mb-4">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
);
