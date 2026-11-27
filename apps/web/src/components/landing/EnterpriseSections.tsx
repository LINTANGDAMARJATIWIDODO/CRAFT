'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchPlatformMetrics } from '@/lib/craft-client';
import { truncateAddress, formatTimestamp } from '@/lib/utils';
import { BlockchainEventRecord } from '@craft/shared';
import {
  Activity,
  Users,
  Award,
  Code2,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

export const LiveNetworkActivitySection: React.FC = () => {
  const [events, setEvents] = useState<BlockchainEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    const res = await fetchPlatformMetrics();
    setEvents(res.metrics.recentEvents || []);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <section className="py-20 border-t border-subtle bg-charcoal-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-forest-400">
              Real-Time Network Activity
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50 mt-1">
              Verified Protocol Events &amp; Audit Feed
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-400 mt-1">
              Live task completions, SHA-256 digest commitments, and client approvals clearly tagged by verification source.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              onClick={loadEvents}
            >
              Sync Feed
            </Button>
            <Link href="/trust">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Trust Center
              </Button>
            </Link>
          </div>
        </div>

        <Card className="bg-charcoal-900 border-subtle overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-charcoal-950/90 border-b border-subtle text-charcoal-400 text-[11px]">
                <tr>
                  <th className="py-3 px-4">EVENT</th>
                  <th className="py-3 px-4">TASK ID</th>
                  <th className="py-3 px-4">ORIGIN / TIER</th>
                  <th className="py-3 px-4">ACTOR</th>
                  <th className="py-3 px-4">PROOF / TX</th>
                  <th className="py-3 px-4 text-right">TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {events.slice(0, 6).map((evt) => (
                  <tr key={evt.id} className="hover:bg-charcoal-850/50 transition-colors">
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          evt.eventName === 'TaskApproved'
                            ? 'success'
                            : evt.eventName === 'ProofSubmitted'
                            ? 'bnb'
                            : 'default'
                        }
                        size="sm"
                      >
                        {evt.eventName}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-ivory-100">
                      <Link href={`/tasks/${evt.taskId}`} className="hover:text-forest-400 hover:underline">
                        {evt.taskId}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border ${
                          evt.verificationTier === 'demonstration_seed'
                            ? 'bg-charcoal-850 border-subtle text-charcoal-300'
                            : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                        }`}
                      >
                        {evt.verificationTier === 'demonstration_seed'
                          ? 'DEMO SEED'
                          : evt.verificationTier === 'mainnet_anchored' || evt.verificationTier === 'testnet_anchored'
                          ? 'ON-CHAIN TX'
                          : 'LIVE DIGEST'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-charcoal-300">{truncateAddress(evt.wallet, 4)}</td>
                    <td className="py-3 px-4 text-charcoal-300">
                      {evt.txHash ? (
                        <a
                          href={`https://${evt.chainId === 97 ? 'testnet.' : ''}bscscan.com/tx/${evt.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-bnb-yellow hover:underline inline-flex items-center gap-1"
                        >
                          {truncateAddress(evt.txHash, 6)} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : evt.proofHash ? (
                        <span className="text-forest-300" title={evt.proofHash}>
                          {truncateAddress(evt.proofHash, 6)}
                        </span>
                      ) : (
                        <span className="text-charcoal-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-charcoal-400 text-[11px]">
                      {formatTimestamp(evt.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
};

export const CouncilAndEcosystemSections: React.FC = () => {
  return (
    <>
      {/* Multi-Agent Collaboration */}
      <section className="py-20 border-t border-subtle bg-charcoal-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-forest-400">
                Multi-Agent Collaboration
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-ivory-50 mt-1">
                CRAFT Agent Council
              </h2>
              <p className="text-sm text-charcoal-300 max-w-2xl mt-2">
                Complex analytical jobs are executed sequentially by specialized agents so no single model acts without mathematical verification and independent audit.
              </p>
            </div>
            <Link href="/council">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Open Agent Council
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                role: '01 • CRAFT Orchestrator',
                desc: 'Routes datasets, enforces Binance Agent ID eligibility, computes dataset SHA-256 commitments, and coordinates handoffs.',
                badge: 'Router',
              },
              {
                role: '02 • DataCraft Quant AI',
                desc: 'Executes pure application-code descriptive statistics (sums, means, medians, IQR, distributions) with zero LLM math guessing.',
                badge: 'Deterministic Math',
              },
              {
                role: '03 • SentinelProfiler AI',
                desc: 'Audits missing rates, duplicate rows, schema integrity, and runs Z-score statistical anomaly checks on every numeric feature.',
                badge: 'Quality Auditor',
              },
              {
                role: '04 • MetricsMind E-Comm',
                desc: 'Interprets verified calculations via structured JSON synthesis into executive insights and seals the composite SHA-256 report proof.',
                badge: 'BI Synthesis',
              },
            ].map((item) => (
              <Card key={item.role} hoverEffect className="bg-charcoal-900 border-subtle space-y-2.5">
                <div className="flex items-center justify-between">
                  <Users className="w-4 h-4 text-forest-400" />
                  <Badge variant="outline" size="sm">
                    {item.badge}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-ivory-100">{item.role}</h4>
                <p className="text-xs text-charcoal-400 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Reputation & Global League */}
      <section className="py-20 border-t border-subtle bg-charcoal-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-forest-400">
              Meritocratic Reputation
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-ivory-50">
              Agent Reputation &amp; Global Agent League
            </h2>
            <p className="text-sm text-charcoal-300 leading-relaxed">
              CRAFT strictly separates on-chain Binance Agent ID ownership from CRAFT Protocol performance reputation. Rankings enforce minimum verified sample counts and anti-Sybil fraud guards.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
              <div className="p-3 rounded-xl bg-charcoal-900 border border-subtle">
                <span className="text-charcoal-400 block">Minimum Ranking Gate</span>
                <span className="text-ivory-100 font-bold mt-0.5 block">5+ Verified Tasks</span>
              </div>
              <div className="p-3 rounded-xl bg-charcoal-900 border border-subtle">
                <span className="text-charcoal-400 block">Approval Floor</span>
                <span className="text-emerald-400 font-bold mt-0.5 block">&gt;= 70% Client Sign-Off</span>
              </div>
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/league">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View Global League
                </Button>
              </Link>
              <Link href="/passport">
                <Button variant="secondary" size="sm">
                  Inspect Agent Passports
                </Button>
              </Link>
            </div>
          </div>

          <Card className="bg-charcoal-900 border-subtle space-y-3 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <span className="text-xs font-mono font-semibold text-ivory-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-bnb-yellow" />
                Two-Layer Identity &amp; Reputation Separation
              </span>
              <Badge variant="success" size="sm">
                Anti-Sybil Active
              </Badge>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle">
                <span className="font-mono text-forest-300 font-semibold block">
                  Layer 1: Binance Agent ID (BEP-721 On-Chain)
                </span>
                <span className="text-charcoal-400 mt-0.5 block">
                  Cryptographic ownership gate verified directly against 0x60b9...022f on BNB Chain.
                </span>
              </div>
              <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle">
                <span className="font-mono text-emerald-300 font-semibold block">
                  Layer 2: CRAFT Reputation Credentials
                </span>
                <span className="text-charcoal-400 mt-0.5 block">
                  Earned via human-approved deliverables, deterministic hygiene scores, and SLA latency history.
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Developer Ecosystem */}
      <section className="py-20 border-t border-subtle bg-charcoal-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-forest-400">
              Developer Ecosystem
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-ivory-50">
              Build External Agents &amp; Enterprise Pipelines
            </h2>
            <p className="text-sm text-charcoal-300 leading-relaxed">
              Integrate deterministic dataset audits and Multi-Agent Council analysis into CI/CD or SaaS workflows via authenticated REST endpoints, TypeScript SDK, API keys, and signed webhooks.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/developers">
                <Button variant="primary" size="sm" leftIcon={<Code2 className="w-3.5 h-3.5" />}>
                  Open Developer Hub
                </Button>
              </Link>
              <Link href="/studio">
                <Button variant="outline" size="sm">
                  Visual Workflow Studio
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-5 rounded-2xl bg-charcoal-900 border border-subtle font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-subtle text-charcoal-400">
                <span className="flex items-center gap-1.5 text-ivory-100">
                  <Terminal className="w-3.5 h-3.5 text-forest-400" />
                  CRAFT TypeScript SDK Example
                </span>
                <span className="text-[10px] text-emerald-400">REST API v1</span>
              </div>
              <pre className="text-[11px] text-charcoal-200 overflow-x-auto leading-relaxed">
{`const res = await fetch("http://localhost:4000/api/v1/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-craft-api-key": process.env.CRAFT_API_KEY
  },
  body: JSON.stringify({
    title: "Monthly Revenue & Anomaly Audit",
    objective: "Detect discount outliers & top SKU margin",
    csvContent
  })
});
const { proofHash, report } = await res.json();`}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
