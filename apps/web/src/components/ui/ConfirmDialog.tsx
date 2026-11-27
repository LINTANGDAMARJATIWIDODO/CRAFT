'use client';

import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-charcoal-900 border border-refined rounded-2xl p-6 shadow-elevated space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                variant === 'danger'
                  ? 'bg-rose-950/50 border-rose-800/40 text-rose-400'
                  : 'bg-forest-950 border-forest-600/40 text-forest-400'
              }`}
            >
              {variant === 'danger' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-base font-semibold text-ivory-50">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-charcoal-400 hover:text-ivory-100 p-1 rounded-lg"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-charcoal-300 leading-relaxed">{description}</p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-subtle">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
