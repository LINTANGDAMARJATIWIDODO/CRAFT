'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge, TaskStateBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { OFFICIAL_AGENT_ID_CONTRACT } from '@/lib/constants';
import { fetchTrustSearch, fetchAgentsUnified } from '@/lib/craft-client';
import { getStoredTasks } from '@/lib/task-store';
import { truncateAddress, formatTimestamp } from '@/lib/utils';
import { AgentProfile, BlockchainEventRecord, TaskRecord } from '@craft/shared';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  FileCheck2,
  Cpu,
  ArrowRight,
  SearchCheck,
} from 'lucide-react';

function TrustCenterContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));
  const [matchedTasks, setMatchedTasks] = useState<TaskRecord[]>([]);
  const [matchedAgents, setMatchedAgents] = useState<AgentProfile[]>([]);
  const [matchedEvents, setMatchedEvents] = useState<BlockchainEventRecord[]>([]);
  const [walletCheck, setWalletCheck] = useState<any>(null);
  const [txCheck, setTxCheck] = useState<any>(null);

  const runSearch = async (targetQuery: string) => {
    const trimmed = targetQuery.trim();
    setIsSearching(true);
    setHasSearched(true);

    try {
      const remote = await fetchTrustSearch(trimmed);
      if (remote) {
        setMatchedTasks(remote.matchedTasks || []);
        setMatchedAgents(remote.matchedAgents || []);
        setMatchedEvents(remote.matchedEvents || []);
        setWalletCheck(remote.onChainWalletCheck || null);
        setTxCheck(remote.onChainTxCheck || null);
        setIsSearching(false);
        return;
      }

      // Offline browser search across stored tasks & agents
      const qLower = trimmed.toLowerCase();
      const localTasks = getStoredTasks().filter(
        (t) =>
          !qLower ||
          t.id.toLowerCase().includes(qLower) ||
          (t.datasetHash && t.datasetHash.toLowerCase() === qLower) ||
          (t.outputProofHash && t.outputProofHash.toLowerCase() === qLower) ||
          t.clientAddress.toLowerCase() === qLower
      );
      const agentsRes = await fetchAgentsUnified();
      const localAgents = agentsRes.agents.filter(
        (a) =>
          a.id.toLowerCase().includes(qLower) ||
          a.slug.toLowerCase().includes(qLower) ||
          a.walletAddress.toLowerCase() === qLower ||
          (a.agentIdTokenId && a.agentIdTokenId.toLowerCase().includes(qLower))
      );

      setMatchedTasks(localTasks);
      setMatchedAgents(localAgents);
      setMatchedEvents([]);
      setWalletCheck(null);
      setTxCheck(null);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    runSearch(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              Trust &amp; Verification Center
            </h1>
            <Badge variant="bnb" size="sm">
              Public Explorer
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Inspect Task IDs, Dataset Commitments, Report Hashes, Agent Wallets, and live BNB Chain BEP-721 proofs.
          </p>
        </div>
        <a
          href={`https://bscscan.com/address/${OFFICIAL_AGENT_ID_CONTRACT}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
            Agent ID Contract on BscScan
          </Button>
        </a>
      </div>

      {/* Verification Search Bar */}
      <Card className="bg-charcoal-900 border-subtle p-5 space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Task ID, Tx Hash (0x...), Wallet Address, Agent ID, Dataset Hash, or Proof Hash..."
              className="w-full bg-charcoal-950 border border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-ivory-100 placeholder:text-charcoal-500 focus:outline-none focus:border-forest-500/60"
            />
          </div>
          <Button type="submit" variant="primary" size="md" isLoading={isSearching} leftIcon={<SearchCheck className="w-4 h-4" />}>
            Verify Record
          </Button>
        </form>

        {/* Quick sample lookup pills */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-charcoal-400">
          <span>Quick Check:</span>
          {[
            { label: 'Sample Task (task-craft-001)', q: 'task-craft-001' },
            { label: 'DataCraft Wallet', q: '0x1A29c54C4c1fF7a79e60241b3127C5d7e57c6643' },
            { label: 'Official Agent ID Contract', q: OFFICIAL_AGENT_ID_CONTRACT },
          ].map((preset) => (
            <button
              key={preset.q}
              type="button"
              onClick={() => {
                setQuery(preset.q);
                runSearch(preset.q);
              }}
              className="px-2.5 py-1 rounded-lg bg-charcoal-950 border border-subtle hover:border-forest-600/50 text-charcoal-300 hover:text-ivory-100 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Live Contract Reference Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <Card className="bg-charcoal-900 border-subtle p-4">
          <span className="text-[10px] text-charcoal-400 uppercase block">Binance Agent ID Gate (BSC)</span>
          <span className="text-ivory-100 font-semibold block mt-1 break-all text-[11px]">
            {OFFICIAL_AGENT_ID_CONTRACT}
          </span>
        </Card>
        <Card className="bg-charcoal-900 border-subtle p-4">
          <span className="text-[10px] text-charcoal-400 uppercase block">Proof Standard</span>
          <span className="text-emerald-400 font-semibold block mt-1">
            SHA-256 (Dataset + Calc + Report)
          </span>
        </Card>
        <Card className="bg-charcoal-900 border-subtle p-4">
          <span className="text-[10px] text-charcoal-400 uppercase block">Integrity Policy</span>
          <span className="text-bnb-yellow font-semibold block mt-1">
            No Fabricated BscScan Tx Hashes
          </span>
        </Card>
      </div>

      {isSearching && <LoadingState title="Querying Verification Records & BNB Chain RPC..." />}

      {/* Live On-Chain Wallet Verification Card */}
      {!isSearching && walletCheck && (
        <Card className="bg-charcoal-900 border-forest-600/40 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-subtle">
            <span className="text-sm font-semibold font-sans text-ivory-100 flex items-center gap-2">
              {walletCheck.hasAgentId ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              )}
              Live BNB Smart Chain Wallet Inspection
            </span>
            <Badge variant={walletCheck.rpcReachable ? 'bnb' : 'warning'} size="sm">
              {walletCheck.rpcReachable ? walletCheck.network : 'RPC Unreachable'}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle">
              <span className="text-[10px] text-charcoal-400 block">WALLET ADDRESS</span>
              <span className="text-ivory-100 break-all">{walletCheck.address}</span>
            </div>
            <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle">
              <span className="text-[10px] text-charcoal-400 block">AGENT ID BEP-721 BALANCE</span>
              <span className={walletCheck.hasAgentId ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                {walletCheck.balance} Token(s)
              </span>
            </div>
            <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] text-charcoal-400 block">EXPLORER</span>
                <span className="text-ivory-200">BSC Mainnet</span>
              </div>
              <a
                href={walletCheck.bscScanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest-400 hover:underline flex items-center gap-1"
              >
                BscScan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <p className="text-[11px] text-charcoal-300">{walletCheck.note}</p>
        </Card>
      )}

      {/* Live Transaction Receipt Inspection */}
      {!isSearching && txCheck && (
        <Card className="bg-charcoal-900 border-subtle space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-subtle">
            <span className="text-sm font-semibold font-sans text-ivory-100">
              BNB Chain Transaction Receipt Lookup
            </span>
            <Badge variant={txCheck.found ? 'success' : 'warning'} size="sm">
              {txCheck.status}
            </Badge>
          </div>
          <p className="text-charcoal-300">{txCheck.note}</p>
          {txCheck.found && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded bg-charcoal-950 border border-subtle">
                <span className="text-[10px] text-charcoal-400 block">NETWORK</span>
                <span className="text-ivory-100">{txCheck.network}</span>
              </div>
              <div className="p-2.5 rounded bg-charcoal-950 border border-subtle">
                <span className="text-[10px] text-charcoal-400 block">BLOCK</span>
                <span className="text-ivory-100">#{txCheck.blockNumber}</span>
              </div>
              <div className="p-2.5 rounded bg-charcoal-950 border border-subtle">
                <span className="text-[10px] text-charcoal-400 block">GAS USED</span>
                <span className="text-ivory-100">{txCheck.gasUsed}</span>
              </div>
              <div className="p-2.5 rounded bg-charcoal-950 border border-subtle">
                <a
                  href={txCheck.bscScanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bnb-yellow hover:underline flex items-center gap-1"
                >
                  Open on BscScan <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Matched Tasks & Proof Verification */}
      {!isSearching && matchedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-mono uppercase tracking-wider text-charcoal-300">
            Verified Work Order Records ({matchedTasks.length})
          </h3>
          {matchedTasks.map((t) => (
            <Card key={t.id} className="bg-charcoal-900 border-subtle space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-subtle">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <TaskStateBadge state={t.status} />
                    <Badge variant={t.isDemo ? 'outline' : 'success'} size="sm">
                      {t.isDemo ? 'Sample Seed Reference' : t.onChainTxHash ? 'On-Chain Anchored' : 'Verified Local Digest'}
                    </Badge>
                    <span className="text-xs font-mono text-charcoal-400">{t.id}</span>
                  </div>
                  <h4 className="text-base font-semibold text-ivory-100">{t.title}</h4>
                </div>
                <Link href={`/tasks/${t.id}/review`}>
                  <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Inspect Deliverable
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle">
                  <span className="text-charcoal-400 block mb-1">DATASET SHA-256 DIGEST</span>
                  <span className="text-forest-300 break-all">{t.datasetHash || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle">
                  <span className="text-charcoal-400 block mb-1">COMPOSITE PROOF HASH</span>
                  <span className="text-emerald-400 break-all">{t.outputProofHash || 'Pending Submission'}</span>
                </div>
                <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle">
                  <span className="text-charcoal-400 block mb-1">BLOCKCHAIN ANCHOR</span>
                  {t.onChainTxHash ? (
                    <a
                      href={`https://${t.onChainChainId === 97 ? 'testnet.' : ''}bscscan.com/tx/${t.onChainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-bnb-yellow hover:underline inline-flex items-center gap-1 break-all"
                    >
                      {truncateAddress(t.onChainTxHash, 8)} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-charcoal-300">
                      Off-Chain Digest Verified (No fabricated tx hash)
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Matched Agents */}
      {!isSearching && matchedAgents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-mono uppercase tracking-wider text-charcoal-300">
            Matched Agent Identities ({matchedAgents.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedAgents.map((a) => (
              <Card key={a.id} className="bg-charcoal-900 border-subtle flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <img src={a.avatarUrl} alt={a.name} className="w-10 h-10 rounded-xl object-cover border border-subtle" />
                  <div>
                    <div className="text-sm font-semibold text-ivory-100">{a.name}</div>
                    <div className="text-[11px] font-mono text-charcoal-400">
                      {truncateAddress(a.walletAddress, 6)} • {a.reputationScore}% Rep
                    </div>
                  </div>
                </div>
                <Link href={`/passport/${a.slug}`}>
                  <Button variant="outline" size="sm">
                    Open Passport
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isSearching &&
        hasSearched &&
        matchedTasks.length === 0 &&
        matchedAgents.length === 0 &&
        !walletCheck &&
        (!txCheck || !txCheck.found) && (
          <EmptyState
            icon={FileCheck2}
            title="No Matching Verification Record Found"
            description="No local task, agent, or confirmed BNB Chain receipt matched your query. Try a valid Task ID, Agent wallet, or real BSC transaction hash."
          />
        )}
    </div>
  );
}

export default function TrustCenterPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading Trust & Verification Center..." />}>
      <TrustCenterContent />
    </Suspense>
  );
}
