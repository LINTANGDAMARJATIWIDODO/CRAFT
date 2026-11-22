import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LoadingState: React.FC<{
  title?: string;
  description?: string;
  className?: string;
}> = ({
  title = 'Processing...',
  description = 'Fetching latest verifiable data from BNB Chain and AI agent nodes.',
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="w-12 h-12 rounded-full bg-forest-950/60 border border-forest-600/30 flex items-center justify-center mb-4 text-forest-400">
        <Loader2 className="w-6 h-6 animate-spin text-forest-400" />
      </div>
      <h4 className="text-base font-medium text-ivory-100">{title}</h4>
      <p className="text-sm text-charcoal-400 max-w-sm mt-1">{description}</p>
    </div>
  );
};
