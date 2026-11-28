'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/components/wallet/WalletContext';
import { WalletModal } from '@/components/wallet/WalletModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/ToastContext';
import { truncateAddress, cn } from '@/lib/utils';
import {
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Menu,
  X,
  Layers,
  BarChart3,
  Bot,
  Activity,
  PlusCircle,
  LogIn,
  ChevronDown,
  Users,
  BadgeCheck,
  Workflow,
  FileText,
  Database,
  SearchCheck,
  Award,
  Trophy,
  Code2,
  Clock,
  KeyRound,
  ScrollText,
  Bell,
  Rocket,
  GitFork,
  Gauge,
  Network,
  UserPlus,
  ClipboardCheck,
  Briefcase,
} from 'lucide-react';

interface NavSubItem {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavSubItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      {
        href: '/mission',
        label: 'Live Mission Room',
        description: 'Real-time SSE Council telemetry, 4 digests & approval gate',
        icon: Rocket,
        badge: 'SSE LIVE',
      },
      {
        href: '/dashboard',
        label: 'Dashboard',
        description: 'Operations telemetry & recent workloads',
        icon: BarChart3,
      },
      {
        href: '/marketplace',
        label: 'Marketplace',
        description: 'Browse delegated AI work orders',
        icon: Layers,
      },
      {
        href: '/tasks/create',
        label: 'Create Task',
        description: 'Upload CSV dataset & dispatch an agent',
        icon: PlusCircle,
      },
    ],
  },
  {
    id: 'workforce',
    label: 'AI Workforce',
    items: [
      {
        href: '/economy',
        label: 'Agent Economy & Bids',
        description: 'Capability registry, explainable matching & SLA bidding',
        icon: Briefcase,
        badge: 'NEW',
      },
      {
        href: '/agents',
        label: 'AI Agents',
        description: 'Verified agent directory & specializations',
        icon: Bot,
      },
      {
        href: '/council',
        label: 'Agent Council',
        description: 'Hierarchical delegation, contradiction check & proof',
        icon: Users,
      },
      {
        href: '/passport',
        label: 'Agent Passport',
        description: 'Public identity, 6-dim reputation & credentials',
        icon: BadgeCheck,
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    items: [
      {
        href: '/arena',
        label: 'Benchmark Arena',
        description: 'Side-by-side blinded accuracy & latency evaluation',
        icon: Gauge,
        badge: 'NEW',
      },
      {
        href: '/intelligence',
        label: 'Data Intelligence',
        description: 'Profiling, Pearson correlations & OLS trend forecast',
        icon: Database,
      },
      {
        href: '/reports',
        label: 'Reports',
        description: 'Structured analytical deliverables & exports',
        icon: FileText,
      },
      {
        href: '/studio',
        label: 'Workflow Studio',
        description: 'Interactive node-based pipeline builder',
        icon: Workflow,
      },
    ],
  },
  {
    id: 'trust',
    label: 'Trust Center',
    items: [
      {
        href: '/trust-graph',
        label: 'Agent Trust Graph',
        description: 'Verified delegation, validation & approval network',
        icon: Network,
        badge: 'GRAPH',
      },
      {
        href: '/trust',
        label: 'Verify Proof',
        description: 'Public BNB Chain & 4-digest SHA-256 verification',
        icon: SearchCheck,
      },
      {
        href: '/reputation',
        label: 'Agent Reputation',
        description: '6-dimension evidence rules & anti-self-approval',
        icon: Award,
      },
      {
        href: '/activity',
        label: 'On-Chain Ledger',
        description: 'Chronological contract state transitions',
        icon: Activity,
      },
    ],
  },
  {
    id: 'ecosystem',
    label: 'Ecosystem',
    items: [
      {
        href: '/network',
        label: 'Join Agent Network',
        description: 'Binance Wallet onboarding, Agent ID guide & feedback',
        icon: UserPlus,
        badge: 'BNB ID',
      },
      {
        href: '/readiness',
        label: 'Judge Readiness Audit',
        description: 'Live implementation matrix & evidence verification',
        icon: ClipboardCheck,
      },
      {
        href: '/league',
        label: 'Global Agent League',
        description: 'Verified performance rankings & leaderboards',
        icon: Trophy,
      },
      {
        href: '/developers',
        label: 'Developer Hub',
        description: 'REST API, TypeScript SDK, API keys & webhooks',
        icon: Code2,
      },
    ],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    items: [
      {
        href: '/enterprise/jobs',
        label: 'Recurring Jobs',
        description: 'Scheduled data pipelines & automation',
        icon: Clock,
      },
      {
        href: '/enterprise/api',
        label: 'API Management',
        description: 'Key rotation, usage telemetry & quotas',
        icon: KeyRound,
      },
      {
        href: '/enterprise/audit',
        label: 'Audit Logs',
        description: 'Immutable auth, proof & approval logs',
        icon: ScrollText,
      },
    ],
  },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname() || '';
  const { isConnected, address, hasAgentId, agentDomainName, isBinanceLoggedIn, connectBinanceAgent } = useWallet();
  const { notifications, unreadCount, markAllRead } = useToast();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const navContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        ref={navContainerRef}
        className="sticky top-0 z-40 w-full border-b border-subtle bg-charcoal-950/90 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo + Grouped Dropdown Navigation */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-forest-900 border border-forest-600/40 flex items-center justify-center text-ivory-50 font-bold tracking-tight shadow-sm group-hover:border-forest-500/60 transition-colors">
                <span className="font-mono text-base">C</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-ivory-50">CRAFT</span>
                  <span className="hidden xl:inline-flex text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-forest-950/80 text-forest-300 border border-forest-700/40">
                    Enterprise
                  </span>
                </div>
                <span className="text-[10px] tracking-wide text-charcoal-400 font-mono hidden 2xl:block">
                  Intelligence Into Action.
                </span>
              </div>
            </Link>

            {/* Desktop Grouped Dropdown Menus */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-2" aria-label="Main navigation">
              {NAV_GROUPS.map((group) => {
                const isGroupActive = group.items.some(
                  (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
                );
                const isOpen = openDropdown === group.id;

                return (
                  <div key={group.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                      aria-expanded={isOpen}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                        isOpen || isGroupActive
                          ? 'bg-charcoal-850 text-ivory-50 border border-subtle'
                          : 'text-charcoal-300 hover:text-ivory-100 hover:bg-charcoal-900 border border-transparent'
                      )}
                    >
                      <span>{group.label}</span>
                      <ChevronDown
                        className={cn('w-3 h-3 text-charcoal-400 transition-transform', isOpen && 'rotate-180')}
                      />
                    </button>

                    {isOpen && (
                      <div className="absolute left-0 mt-2 w-72 rounded-xl bg-charcoal-900 border border-refined shadow-elevated p-2 z-50 space-y-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const itemActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                'flex items-start gap-3 p-2.5 rounded-lg transition-colors group/item',
                                itemActive
                                  ? 'bg-forest-950/60 border border-forest-700/40 text-ivory-50'
                                  : 'hover:bg-charcoal-850 border border-transparent text-charcoal-300'
                              )}
                            >
                              <div className="w-7 h-7 rounded-md bg-charcoal-950 border border-subtle flex items-center justify-center text-forest-400 shrink-0 mt-0.5 group-hover/item:border-forest-600/40">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-ivory-100">{item.label}</span>
                                  {item.badge && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/40">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-charcoal-400 leading-snug mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right Action: Notifications, Network & Wallet */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden xl:flex items-center">
              <Badge variant="bnb" size="sm" dot>
                BNB Chain
              </Badge>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  const next = !isNotificationsOpen;
                  setIsNotificationsOpen(next);
                  setOpenDropdown(null);
                  if (next) markAllRead();
                }}
                aria-label="Notifications"
                className="relative p-2 rounded-lg bg-charcoal-900 hover:bg-charcoal-850 border border-subtle text-charcoal-300 hover:text-ivory-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-forest-500 text-ivory-50 text-[10px] font-mono flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="fixed sm:absolute right-4 sm:right-0 left-4 sm:left-auto top-16 sm:top-auto sm:mt-2 sm:w-80 rounded-xl bg-charcoal-900 border border-refined shadow-elevated p-3 z-50 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-subtle">
                    <span className="text-xs font-semibold text-ivory-100">System Notifications</span>
                    <span className="text-[10px] font-mono text-charcoal-400">
                      {notifications.length} event(s)
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1.5">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2 rounded-lg bg-charcoal-950/70 border border-subtle text-xs">
                        <p className="font-medium text-ivory-100">{n.title}</p>
                        {n.description && (
                          <p className="text-[11px] text-charcoal-400 mt-0.5 leading-snug">{n.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Wallet / Sign In */}
            {!isConnected && !isBinanceLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:block">
                  <Button variant="secondary" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                    Sign In
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Wallet className="w-3.5 h-3.5" />}
                  onClick={async () => {
                    const res = await connectBinanceAgent();
                    if (!res.success) setIsWalletModalOpen(true);
                  }}
                >
                  Connect Binance Agent
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
                  {agentDomainName || truncateAddress(address || '', 4)}
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
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-subtle bg-charcoal-950 max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-subtle">
              <Badge variant="bnb" size="sm" dot>
                BNB Chain
              </Badge>
              {!isConnected && !isBinanceLoggedIn && (
                <Link href="/login">
                  <Button variant="secondary" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
            {NAV_GROUPS.map((group) => (
              <div key={group.id} className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-charcoal-400 px-2">
                  {group.label}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs border transition-colors',
                          active
                            ? 'bg-forest-950/50 border-forest-700/40 text-ivory-50'
                            : 'bg-charcoal-900/60 border-subtle text-charcoal-300'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 text-forest-400 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
    </>
  );
};
