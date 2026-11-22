'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/components/wallet/WalletContext';
import { WalletModal } from '@/components/wallet/WalletModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { truncateAddress, cn } from '@/lib/utils';
import {
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Menu,
  X,
  Layers,
  Sparkles,
  BarChart3,
  Bot,
  Activity,
  PlusCircle,
  LogIn,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { isConnected, address, hasAgentId, isCorrectNetwork, isBinanceLoggedIn } = useWallet();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace', icon: Layers },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/tasks/create', label: 'Create Task', icon: PlusCircle },
    { href: '/agents', label: 'AI Agents', icon: Bot },
    { href: '/activity', label: 'On-Chain Ledger', icon: Activity },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-subtle bg-charcoal-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-forest-900 border border-forest-600/40 flex items-center justify-center text-ivory-50 font-bold tracking-tight shadow-sm group-hover:border-forest-500/60 transition-colors">
                <span className="font-mono text-base">C</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-ivory-50">CRAFT</span>
                  <span className="hidden sm:inline-flex text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-forest-950/80 text-forest-300 border border-forest-700/40">
                    Agent ID
                  </span>
                </div>
                <span className="text-[10px] tracking-wide text-charcoal-400 font-mono hidden md:block">
                  Intelligence Into Action.
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-charcoal-850 text-ivory-50 border border-subtle'
                        : 'text-charcoal-300 hover:text-ivory-100 hover:bg-charcoal-900'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action: Network & Wallet / Login */}
          <div className="flex items-center gap-2.5">
            {/* Network Pill */}
            <div className="hidden sm:flex items-center">
              <Badge variant="bnb" size="sm" dot>
                BNB Chain
              </Badge>
            </div>

            {/* Binance OAuth Badge if logged in */}
            {isBinanceLoggedIn && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-lg bg-[#F3BA2F]/10 text-[#F3BA2F] border border-[#F3BA2F]/30">
                Binance Linked
              </span>
            )}

            {/* Auth / Wallet Button */}
            {!isConnected && !isBinanceLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="secondary" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                    Sign In
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Wallet className="w-3.5 h-3.5" />}
                  onClick={() => setIsWalletModalOpen(true)}
                >
                  Connect Wallet
                </Button>
              </div>
            ) : isConnected ? (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-charcoal-850 hover:bg-charcoal-800 border border-subtle text-xs transition-colors"
              >
                {hasAgentId ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    <ShieldCheck className="w-3 h-3" />
                    Agent ID
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 font-mono text-[11px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                    <ShieldAlert className="w-3 h-3" />
                    No Agent ID
                  </span>
                )}
                <span className="font-mono font-medium text-ivory-100">
                  {truncateAddress(address || '', 4)}
                </span>
              </button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Wallet className="w-3.5 h-3.5" />}
                onClick={() => setIsWalletModalOpen(true)}
              >
                Associate Wallet
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-charcoal-400 hover:text-ivory-100 hover:bg-charcoal-850"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-b border-subtle bg-charcoal-900 px-4 pt-2 pb-4 space-y-1">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-ivory-100 bg-charcoal-800 mb-2"
            >
              <LogIn className="w-4 h-4 text-forest-400" />
              <span>Authentication (Binance &amp; Web3)</span>
            </Link>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-charcoal-800 text-ivory-50'
                      : 'text-charcoal-300 hover:text-ivory-100 hover:bg-charcoal-850'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Wallet Management Modal */}
      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
    </>
  );
};
