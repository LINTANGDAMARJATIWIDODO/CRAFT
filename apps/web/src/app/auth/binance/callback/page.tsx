'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

function BinanceCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam) {
      setStatus('error');
      setErrorMessage(errorDesc || `Binance authorization cancelled or failed (${errorParam}).`);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Missing authorization code or CSRF state parameter from callback.');
      return;
    }

    // Exchange code for session token via CRAFT backend
    fetch('http://localhost:4000/api/auth/binance/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Token exchange failed');
        }
        return data;
      })
      .then((data) => {
        if (data.sessionToken && data.user) {
          localStorage.setItem('craft_session_token', data.sessionToken);
          localStorage.setItem('craft_binance_user', JSON.stringify(data.user.binanceAccount));
          setStatus('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1800);
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to complete Binance authentication.');
      });
  }, [code, state, errorParam, errorDesc, router]);

  return (
    <Card className="w-full max-w-md bg-charcoal-900 border-refined p-8 shadow-elevated text-center space-y-5">
      {status === 'loading' && (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-forest-950 border border-forest-600/40 flex items-center justify-center text-forest-400 mx-auto">
            <Loader2 className="w-6 h-6 animate-spin text-forest-400" />
          </div>
          <h3 className="text-lg font-semibold text-ivory-50">
            Validating Binance Authorization
          </h3>
          <p className="text-xs text-charcoal-400">
            Exchanging authorization code and establishing secure session...
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-ivory-50">
            Binance Account Authorized
          </h3>
          <p className="text-xs text-emerald-300">
            Secure application session established. Redirecting to workspace...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-ivory-50">
            Authentication Notice
          </h3>
          <p className="text-xs text-charcoal-300 leading-relaxed">
            {errorMessage}
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="primary" size="md" className="w-full">
                Return to Login &amp; Web3 Options
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function BinanceCallbackPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <Card className="w-full max-w-md bg-charcoal-900 border-refined p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-400 mx-auto mb-2" />
            <p className="text-xs text-charcoal-400">Loading authorization...</p>
          </Card>
        }
      >
        <BinanceCallbackHandler />
      </Suspense>
    </div>
  );
}
