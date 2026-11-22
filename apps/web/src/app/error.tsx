'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-ivory-50">Something went wrong</h1>
          <p className="text-sm text-charcoal-300">
            {error.message || 'An unexpected error occurred while loading this view.'}
          </p>
        </div>
        <div>
          <Button variant="primary" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => reset()}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
