import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-subtle rounded-xl bg-charcoal-900/40', className)}>
      <div className="w-12 h-12 rounded-xl bg-charcoal-800 border border-subtle flex items-center justify-center mb-4 text-charcoal-400">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-ivory-100">{title}</h4>
      <p className="text-sm text-charcoal-400 max-w-sm mt-1 mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
