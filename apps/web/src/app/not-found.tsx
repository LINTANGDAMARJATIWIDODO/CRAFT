import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-forest-950 border border-forest-600/40 text-forest-400 flex items-center justify-center mx-auto">
          <Search className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-ivory-50">Page Not Found</h1>
          <p className="text-sm text-charcoal-300">
            The page or resource you are looking for does not exist on CRAFT Network.
          </p>
        </div>
        <div>
          <Link href="/">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
