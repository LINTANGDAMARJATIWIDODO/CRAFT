'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, TaskStateBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { CardSkeleton, ErrorState } from '@/components/ui/Skeleton';
import { fetchAgentPassport } from '@/lib/craft-client';
import { OFFICIAL_AGENT_ID_CONTRACT } from '@/lib/constants';
import { truncateAddress, formatTimestamp } from '@/lib/utils';
import { AgentProfile, BlockchainEventRecord, TaskRecord } from '@craft/shared';
import {
  ShieldCheck,
  ShieldAlert,
  Share2,
  ExternalLink,
  Award,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Clock,
  Activity,
} from 'lucide-react';

export default function AgentPassportDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const { notify } = useToast();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskRecord[]>([]);
  const [events, setEvents] = useState<BlockchainEventRecord[]>([]);
  const [rpcCheck, setRpcCheck] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingRpc, setCheckingRpc] = useState(false);

  const loadPassport = async (refreshRpc = false) => {
    if (refreshRpc) setCheckingRpc(true);
    else setLoading(true);
    const data = await fetchAgentPassport(slug, refreshRpc);
    setAgent(data.agent);
    setCompletedTasks(data.completedTasks);
    setEvents(data.events);
    if (data.onChainVerification) setRpcCheck(data.onChainVerification);
    setLoading(false);
    setCheckingRpc(false);
  };

  useEffect(() => {
    loadPassport(false);
  }, [slug]);

  const handleShareProfile = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      notify({
        title: 'Passport Link Copied',
        description: `Public profile URL copied for ${agent?.name || slug}.`,
        variant: 'success',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={4} />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <ErrorState
          title="Agent Passport Not Found"
          message={`No registered AI Agent matches '${slug}'.`}
          onRetry={() => loadPassport(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div className="flex items-center gap-4">
          <img
            src={agent.avatarUrl}
            alt={agent.name}
            className="w-16 h-16 rounded-2xl object-cover border border-refined"
          />
          <div>
            <div className="flex items-center gap-2">
              <Link href="/passport" className="text-xs font-mono text-charcoal-400 hover:text-ivory-100 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> All Passports
              </Link>
              <span className="text-charcoal-600">•</span>
              <span className="text-xs font-mono text-forest-400">{agent.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50 mt-0.5">
              {agent.name}
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-300">{agent.title}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
            onClick={handleShareProfile}
          >
            Share Public Passport
          </Button>
          <Link href="/tasks/create">
            <Button variant="primary" size="sm">
              Delegate Task to Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* Explicit Two-Layer Verification Separation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Layer 1: Binance Agent ID Verification */}
        <Card className="bg-charcoal-900 border-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-bnb-yellow" />
              <span className="text-sm font-semibold text-ivory-100">
                Layer 1: Binance Agent ID Credential
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              isLoading={checkingRpc}
              leftIcon={<RefreshCw className={`w-3 h-3 ${checkingRpc ? 'animate-spin' : ''}`} />}
              onClick={() => loadPassport(true)}
            >
              Query BSC RPC
            </Button>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-charcoal-950 border border-subtle">
              <span className="text-charcoal-400">Wallet Address:</span>
              <a
                href={`https://bscscan.com/address/${agent.walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest-400 hover:underline flex items-center gap-1"
              >
                {truncateAddress(agent.walletAddress, 6)} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-charcoal-950 border border-subtle">
              <span className="text-charcoal-400">Official Contract (BSC):</span>
              <span className="text-ivory-200">{truncateAddress(OFFICIAL_AGENT_ID_CONTRACT, 6)}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-charcoal-950 border border-subtle">
              <span className="text-charcoal-400">Token / Registry Slot:</span>
              <span className="text-ivory-200">{agent.agentIdTokenId || 'Checking RPC'}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-charcoal-950 border border-subtle">
              <span className="text-charcoal-400">On-Chain BEP-721 Status:</span>
              {agent.verifiedAgentId ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> HELD ON BSC MAINNET
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> {rpcCheck ? '0 BEP-721 Held (Click Refresh)' : 'Unchecked / Demo Slot'}
                </span>
              )}
            </div>
            {rpcCheck?.note && (
              <p className="text-[11px] text-charcoal-400 bg-charcoal-950 p-2.5 rounded border border-subtle">
                RPC Note: {rpcCheck.note}
              </p>
            )}
          </div>
        </Card>

        {/* Layer 2: CRAFT Reputation Credentials */}
        <Card className="bg-charcoal-900 border-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-ivory-100">
                Layer 2: CRAFT Protocol Reputation
              </span>
            </div>
            <Badge variant="success" size="sm">
              {agent.craftCredentials?.tier || 'Enterprise Council'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-charcoal-950 border border-subtle">
              <span className="text-[10px] text-charcoal-400 block">Completed Jobs</span>
              <span className="text-xl font-bold text-ivory-50 mt-1 block">{agent.tasksCompleted}</span>
            </div>
            <div className="p-3 rounded-xl bg-charcoal-950 border border-subtle">
              <span className="text-[10px] text-charcoal-400 block">Approval Rate</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{agent.approvalRate ?? 97}%</span>
            </div>
            <div className="p-3 rounded-xl bg-charcoal-950 border border-subtle">
              <span className="text-[10px] text-charcoal-400 block">Quality Avg</span>
              <span className="text-xl font-bold text-ivory-50 mt-1 block">{agent.qualityScoreAvg ?? 98}</span>
            </div>
            <div className="p-3 rounded-xl bg-charcoal-950 border border-subtle">
              <span className="text-[10px] text-charcoal-400 block">Avg Time</span>
              <span className="text-xl font-bold text-ivory-50 mt-1 block">{agent.avgExecutionTimeSec}s</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {agent.specialty.map((s) => (
              <Badge key={s} variant="outline" size="sm">
                {s}
              </Badge>
            ))}
          </div>
          {agent.craftCredentials?.badges && agent.craftCredentials.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {agent.craftCredentials.badges.map((b) => (
                <Badge key={b} variant="success" size="sm">
                  {b}
                </Badge>
              ))}
            </div>
          )}

          {agent.craftCredentials?.breakdown && (
            <div className="pt-3 border-t border-subtle space-y-2">
              <div className="text-[11px] font-mono text-charcoal-400 uppercase">
                6-Dimension Reputation Evidence ({agent.craftCredentials.breakdown.overallScore}/100)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                {[
                  { label: 'Reliability', val: agent.craftCredentials.breakdown.reliability },
                  { label: 'Quality', val: agent.craftCredentials.breakdown.quality },
                  { label: 'Completion', val: agent.craftCredentials.breakdown.completion },
                  { label: 'Expertise', val: agent.craftCredentials.breakdown.expertise },
                  { label: 'Client Trust', val: agent.craftCredentials.breakdown.clientTrust },
                  { label: 'Timeliness', val: agent.craftCredentials.breakdown.timeliness },
                ].map((dim) => (
                  <div key={dim.label} className="p-2 rounded bg-charcoal-950 border border-subtle">
                    <div className="flex justify-between">
                      <span className="text-charcoal-400">{dim.label}</span>
                      <span className="text-emerald-400 font-bold">{dim.val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Performance History & Verified Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 bg-charcoal-900 border-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-subtle">
            <h3 className="text-sm font-semibold text-ivory-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-forest-400" />
              Performance History
            </h3>
            {agent.isDemoSeed && (
              <Badge variant="outline" size="sm">
                Includes Seed Baseline + Live Approvals
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            {(agent.performanceHistory || []).map((pt) => (
              <div key={pt.period} className="p-3 rounded-xl bg-charcoal-950 border border-subtle space-y-2">
                <span className="text-charcoal-400 block">{pt.period}</span>
                <div className="text-lg font-bold text-ivory-50">{pt.tasksApproved} jobs</div>
                <div className="w-full bg-charcoal-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${pt.avgQualityScore}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-charcoal-400">
                  <span>Q: {pt.avgQualityScore}%</span>
                  <span>{pt.avgLatencySec}s</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5 bg-charcoal-900 border-subtle space-y-3">
          <h3 className="text-sm font-semibold text-ivory-100 flex items-center gap-2 pb-2 border-b border-subtle">
            <Award className="w-4 h-4 text-bnb-yellow" />
            Verified Achievements
          </h3>
          {(agent.achievements || []).length === 0 ? (
            <p className="text-xs text-charcoal-400 py-4">No threshold achievements unlocked yet.</p>
          ) : (
            <div className="space-y-2.5">
              {(agent.achievements || []).map((ach) => (
                <div key={ach.id} className="p-3 rounded-xl bg-charcoal-950 border border-subtle text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ivory-100">{ach.title}</span>
                    <Badge variant="bnb" size="sm">
                      {ach.minRecordsThreshold}+ Jobs
                    </Badge>
                  </div>
                  <p className="text-[11px] text-charcoal-400">{ach.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Task & Blockchain Event History */}
      <Card className="bg-charcoal-900 border-subtle space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-subtle">
          <h3 className="text-sm font-semibold text-ivory-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-forest-400" />
            Recorded Work Orders &amp; Blockchain Verifications ({completedTasks.length})
          </h3>
        </div>
        {completedTasks.length === 0 ? (
          <p className="text-xs text-charcoal-400 py-6 text-center">
            No individual work orders assigned yet in this session.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-charcoal-950 border-b border-subtle text-charcoal-400 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">TASK</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">PROOF DIGEST</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {completedTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-charcoal-850/40">
                    <td className="py-3 px-3">
                      <span className="font-sans font-medium text-ivory-100 block">{t.title}</span>
                      <span className="text-[10px] text-charcoal-400">{t.id} • {formatTimestamp(t.createdAt)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <TaskStateBadge state={t.status} />
                    </td>
                    <td className="py-3 px-3 text-forest-300">
                      {t.outputProofHash ? truncateAddress(t.outputProofHash, 8) : 'Pending'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link href={`/tasks/${t.id}`}>
                        <Button variant="outline" size="sm">
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
