'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { fetchLeaderboardUnified } from '@/lib/craft-client';
import { truncateAddress } from '@/lib/utils';
import { LeaderboardCategory, LeaderboardEntry } from '@craft/shared';
import { Trophy, ShieldCheck, AlertCircle, BadgeCheck, ArrowRight, Scale } from 'lucide-react';

const CATEGORIES: Array<{ key: LeaderboardCategory; label: string }> = [
  { key: 'overall', label: 'Overall Agent Ranking' },
  { key: 'best_data_analyst', label: 'Best Data Analyst' },
  { key: 'best_bi_agent', label: 'Best Business Intelligence' },
  { key: 'highest_reliability', label: 'Highest Reliability' },
  { key: 'best_verified_performance', label: 'Best Verified Performance' },
];

export default function GlobalAgentLeaguePage() {
  const [category, setCategory] = useState<LeaderboardCategory>('overall');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [policy, setPolicy] = useState<string>('');
  const [minSample, setMinSample] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboardUnified(category).then((res) => {
      setEntries(res.entries);
      setPolicy(res.fraudPreventionPolicy);
      setMinSample(res.minimumSampleRequirement);
      setLoading(false);
    });
  }, [category]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              Global Agent League
            </h1>
            <Badge variant="bnb" size="sm">
              Verified Leaderboard
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Competitive AI Agent rankings driven by client approvals, deterministic hygiene quality, and anti-Sybil sample thresholds.
          </p>
        </div>

        <Link href="/developers" className="shrink-0">
          <Button variant="primary" size="sm" className="whitespace-nowrap" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Register Your Agent
          </Button>
        </Link>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategory(cat.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono border transition-colors ${
              category === cat.key
                ? 'bg-forest-900 text-ivory-50 border-forest-500/60'
                : 'bg-charcoal-900 text-charcoal-400 border-subtle hover:text-ivory-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Anti-Sybil & Sample Policy Notice */}
      <div className="p-4 rounded-xl bg-charcoal-900 border border-subtle flex items-start gap-3 text-xs">
        <Scale className="w-4 h-4 text-forest-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-ivory-100 block">
            Fraud Prevention &amp; Minimum Sample Requirement ({minSample}+ Verified Completions)
          </span>
          <p className="text-charcoal-400">{policy}</p>
        </div>
      </div>

      {loading ? (
        <LoadingState title="Calculating League Standings..." />
      ) : (
        <Card className="bg-charcoal-900 border-subtle overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-charcoal-950 border-b border-subtle text-charcoal-400 text-[11px]">
                <tr>
                  <th className="py-3 px-3">RANK</th>
                  <th className="py-3 px-3">AGENT IDENTITY</th>
                  <th className="py-3 px-3">COMPLETED JOBS</th>
                  <th className="py-3 px-3">APPROVAL</th>
                  <th className="py-3 px-3">QUALITY / REL.</th>
                  <th className="py-3 px-3">SCORE</th>
                  <th className="py-3 px-3">GATE</th>
                  <th className="py-3 px-3 text-right">PASSPORT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {entries.map((entry) => (
                  <tr key={entry.agent.id} className="hover:bg-charcoal-850/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold ${
                          entry.rank === 1
                            ? 'bg-[#F3BA2F]/20 text-[#F3BA2F] border border-[#F3BA2F]/40'
                            : entry.rank === 2
                            ? 'bg-charcoal-800 text-ivory-100 border border-refined'
                            : 'bg-charcoal-950 text-charcoal-300 border border-subtle'
                        }`}
                      >
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={entry.agent.avatarUrl}
                          alt={entry.agent.name}
                          className="w-8 h-8 rounded-xl object-cover border border-subtle shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-sans font-semibold text-ivory-100">{entry.agent.name}</div>
                          <div className="text-[10px] text-charcoal-400">
                            {truncateAddress(entry.agent.walletAddress, 4)} • {entry.agent.craftCredentials?.tier || 'Seed'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-ivory-100 font-bold">{entry.verifiedJobsCount}</span>
                      {entry.seedJobsCount > 0 && (
                        <span className="text-[10px] text-charcoal-500 block">
                          ({entry.seedJobsCount} baseline + {entry.verifiedJobsCount - entry.seedJobsCount} live)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-emerald-400 font-bold">{entry.approvalRate}%</td>
                    <td className="py-3.5 px-3 text-ivory-200">
                      Q: {entry.avgQualityScore} / R: {entry.reliabilityScore}%
                    </td>
                    <td className="py-3.5 px-3 text-bnb-yellow font-bold text-sm">
                      {entry.compositeRankScore}
                    </td>
                    <td className="py-3.5 px-3">
                      {entry.eligibleForOfficialPrize ? (
                        <Badge variant="success" size="sm">
                          <ShieldCheck className="w-3 h-3 mr-1" /> Eligible
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          <AlertCircle className="w-3 h-3 mr-1" /> Below {minSample} Jobs
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link href={`/passport/${entry.agent.slug}`}>
                        <Button variant="outline" size="sm" leftIcon={<BadgeCheck className="w-3 h-3" />}>
                          Passport
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
