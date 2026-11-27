'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Bell } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  createdAt: string;
  read?: boolean;
}

interface ToastContextValue {
  toasts: ToastItem[];
  notifications: ToastItem[];
  unreadCount: number;
  notify: (toast: Omit<ToastItem, 'id' | 'createdAt' | 'read'>) => void;
  dismissToast: (id: string) => void;
  markAllRead: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<ToastItem[]>([
    {
      id: 'notif-boot-1',
      title: 'Binance Agent ID Contract Connected',
      description: 'Verification gate pointing to 0x60b9...022f on BNB Smart Chain.',
      variant: 'info',
      createdAt: new Date().toISOString(),
      read: true,
    },
  ]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (item: Omit<ToastItem, 'id' | 'createdAt' | 'read'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const full: ToastItem = {
        ...item,
        id,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setToasts((prev) => [full, ...prev].slice(0, 4));
      setNotifications((prev) => [full, ...prev].slice(0, 25));

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ToastContext.Provider value={{ toasts, notifications, unreadCount, notify, dismissToast, markAllRead }}>
      {children}
      {/* Floating Toast Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.variant === 'success'
              ? CheckCircle2
              : toast.variant === 'error' || toast.variant === 'warning'
              ? AlertTriangle
              : Info;

          const borderCls =
            toast.variant === 'success'
              ? 'border-emerald-700/50 bg-charcoal-900'
              : toast.variant === 'error'
              ? 'border-rose-700/50 bg-charcoal-900'
              : toast.variant === 'warning'
              ? 'border-amber-700/50 bg-charcoal-900'
              : 'border-forest-600/40 bg-charcoal-900';

          const iconColor =
            toast.variant === 'success'
              ? 'text-emerald-400'
              : toast.variant === 'error'
              ? 'text-rose-400'
              : toast.variant === 'warning'
              ? 'text-amber-400'
              : 'text-forest-400';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-xl border ${borderCls} p-3.5 shadow-elevated flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ivory-50">{toast.title}</p>
                {toast.description && (
                  <p className="text-[11px] text-charcoal-300 mt-0.5 leading-snug break-words">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-charcoal-400 hover:text-ivory-100 p-0.5 rounded"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toasts: [] as ToastItem[],
      notifications: [] as ToastItem[],
      unreadCount: 0,
      notify: () => {},
      dismissToast: () => {},
      markAllRead: () => {},
    };
  }
  return ctx;
};

export { Bell };
