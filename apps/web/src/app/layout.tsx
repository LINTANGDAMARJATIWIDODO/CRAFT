import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/components/wallet/WalletContext';
import { ToastProvider } from '@/components/ui/ToastContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'CRAFT — Enterprise AI Agent Work Network',
  description:
    'Intelligence Into Action. Delegate verifiable work to autonomous AI Agents, collaborate via Multi-Agent Council, inspect deterministic math proofs, and verify completion on BNB Chain.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-charcoal-950 text-ivory-50 selection:bg-forest-600/30 selection:text-ivory-50">
        <ToastProvider>
          <WalletProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
