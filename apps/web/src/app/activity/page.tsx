'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchSortBar, PaginationBar } from '@/components/ui/DataControls';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchPlatformMetrics } from '@/lib/craft-client';
import { truncateAddress, formatTimestamp } from '@/lib/utils';
import { OFFICIAL_AGENT_ID_CONTRACT } from '@/lib/constants';
import { BlockchainEventRecord } from '@craft/shared';
import { Activity, ExternalLink, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ActivityPage() {
  const [events, setEvents] = useState<BlockchainEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const loadLedger = async () => {
    setLoading(true);
    const res = await fetchPlatformMetrics();
    setEvents(res.metrics.recentEvents || []);
    setLoading(false);
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const filtered = useMemo(() => {
    return events
      .filter((evt) => {
        const q = searchQuery.toLowerCase();
        const matchesQ =
          !q ||
          evt.taskId.toLowerCase().includes(q) ||
          evt.eventName.toLowerCase().includes(q) ||
          evt.wallet.toLowerCase().includes(q) ||
          (evt.proofHash && evt.proofHash.toLowerCase().includes(q)) ||
          (evt.txHash && evt.txHash.toLowerCase().includes(q));

        if (!matchesQ) return false;
        if (tierFilter === 'live') return evt.verificationTier !== 'demonstration_seed';
        if (tierFilter === 'demo') return evt.verificationTier === 'demonstration_seed';
        return true;
      })
      .sort((a, b) => {
        const tA = new Date(a.timestamp).getTime();
        const tB = new Date(b.timestamp).getTime();
        return sortBy === 'oldest' ? tA - tB : tB - tA;
      });
  }, [events, searchQuery, tierFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getEventBadge = (name: BlockchainEventRecord['eventName']) => {
    switch (name) {
      case 'TaskApproved':
        return <Badge variant="success" size="sm">TaskApproved</Badge>;
      case 'ProofSubmitted':
        return <Badge variant="bnb" size="sm">ProofSubmitted</Badge>;
      case 'TaskStarted':
        return <Badge variant="default" size="sm">TaskStarted</Badge>;
      case 'RevisionRequested':
        return <Badge variant="warning" size="sm">RevisionRequested</Badge>;
      default:
        return <Badge variant="outline" size="sm">{name}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              On-Chain &amp; Proof State Ledger
            </h1>
            <Badge variant="bnb" size="sm">
              BNB Chain (56 / 97)
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Chronological state transitions, SHA-256 commitments, and verified BNB Chain receipts (zero fabricated transactions).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadLedger}
          >
            Refresh
          </Button>
          <a
            href={`https://bscscan.com/address/${OFFICIAL_AGENT_ID_CONTRACT}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              Agent ID Contract
            </Button>
          </a>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <SearchSortBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        searchPlaceholder="Filter ledger by Task ID, wallet, proof hash, or tx hash..."
        sortBy={sortBy}
        sortOptions={[
          { label: 'Newest First', value: 'newest' },
          { label: 'Oldest First', value: 'oldest' },
        ]}
        onSortChange={setSortBy}
        rightSlot={
          <div className="flex items-center gap-1.5">
            {[
              { key: 'all', label: 'All Events' },
              { key: 'live', label: 'Live Verified' },
              { key: 'demo', label: 'Demo Seed' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setTierFilter(f.key);
                  setPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                  tierFilter === f.key
                    ? 'bg-forest-900 text-ivory-50 border-forest-600/40'
                    : 'bg-charcoal-900 text-charcoal-400 border-subtle hover:text-ivory-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      {paginated.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Ledger Events Match Filter"
          description="Try clearing your search filter or launch a CRAFT Live Mission to record real verification events."
        />
      ) : (
        <Card className="bg-charcoal-900 border-subtle overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-charcoal-950/80 border-b border-subtle text-charcoal-400 text-[11px]">
                <tr>
                  <th className="py-3 px-4">EVENT</th>
                  <th className="py-3 px-4">TASK ID</th>
                  <th className="py-3 px-4">ACTOR</th>
                  <th className="py-3 px-4">TIER</th>
                  <th className="py-3 px-4">TX HASH / PROOF DIGEST</th>
                  <th className="py-3 px-4 text-right">STATUS &amp; TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {paginated.map((evt) => (
                  <tr key={evt.id} className="hover:bg-charcoal-850/50 transition-colors">
                    <td className="py-3.5 px-4">{getEventBadge(evt.eventName)}</td>
                    <td className="py-3.5 px-4 text-ivory-200">
                      <Link href={`/tasks/${evt.taskId}`} className="hover:text-forest-400 hover:underline">
                        {evt.taskId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-300">{truncateAddress(evt.wallet, 4)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border ${
                          evt.verificationTier === 'demonstration_seed'
                            ? 'bg-charcoal-850 border-subtle text-charcoal-400'
                            : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                        }`}
                      >
                        {evt.verificationTier === 'demonstration_seed' ? 'SAMPLE SEED' : 'VERIFIED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
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
                        <Link
                          href={`/trust?q=${encodeURIComponent(evt.proofHash)}`}
                          className="text-forest-400 hover:underline"
                        >
                          Digest: {truncateAddress(evt.proofHash, 6)}
                        </Link>
                      ) : (
                        <span className="text-charcoal-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="text-emerald-400 inline-flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{evt.statusLabel}</span>
                      </div>
                      <div className="text-[10px] text-charcoal-500 mt-0.5">{formatTimestamp(evt.timestamp)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <PaginationBar page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} />
          </div>
        </Card>
      )}
    </div>
  );
}
