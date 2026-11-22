import React from 'react';
import { cn } from '@/lib/utils';
import { TaskState, TASK_STATE_LABELS, TASK_STATE_COLORS } from '@craft/shared';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'bnb';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
}) => {
  const base = 'inline-flex items-center font-mono font-medium rounded-full border transition-colors';

  const variants = {
    default: 'bg-charcoal-800 text-charcoal-300 border-subtle',
    success: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40',
    warning: 'bg-amber-950/50 text-amber-300 border-amber-800/40',
    error: 'bg-rose-950/50 text-rose-300 border-rose-800/40',
    outline: 'bg-transparent text-charcoal-300 border-subtle',
    bnb: 'bg-[#F3BA2F]/10 text-[#F3BA2F] border-[#F3BA2F]/30',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />}
      {children}
    </span>
  );
};

export const TaskStateBadge: React.FC<{ state: TaskState; className?: string }> = ({
  state,
  className,
}) => {
  const label = TASK_STATE_LABELS[state] || 'Unknown';
  const colors = TASK_STATE_COLORS[state] || {
    bg: 'bg-zinc-800',
    text: 'text-zinc-300',
    border: 'border-zinc-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border gap-1.5',
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {label}
    </span>
  );
};
