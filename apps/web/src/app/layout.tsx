import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/components/wallet/WalletContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'CRAFT — Autonomous AI Work Network',
  description: 'Intelligence Into Action. Delegate meaningful work to AI Agents, monitor execution, inspect structured outputs, and verify completion on BNB Chain with Binance Agent ID.',
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
        <WalletProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
