'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/components/wallet/WalletContext';
import { fetchTasksUnified, fetchAgentsUnified } from '@/lib/craft-client';
import { TaskRecord, TaskState, AgentProfile } from '@craft/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, TaskStateBadge } from '@/components/ui/Badge';
import { truncateAddress, formatTimestamp } from '@/lib/utils';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  Bot,
  Activity,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Rocket,
} from 'lucide-react';

export default function DashboardPage() {
  const { isConnected, hasAgentId } = useWallet();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [tRes, aRes] = await Promise.all([fetchTasksUnified(), fetchAgentsUnified()]);
    setTasks(tRes.tasks);
    setAgents(aRes.agents);
    setApiConnected(tRes.apiConnected);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(
    (t) =>
      t.status === TaskState.Created ||
      t.status === TaskState.Proposed ||
      t.status === TaskState.Accepted ||
      t.status === TaskState.InProgress
  ).length;
  const awaitingReview = tasks.filter(
    (t) =>
      t.status === TaskState.Submitted ||
      t.status === TaskState.Verified ||
      t.status === TaskState.RevisionRequested
  ).length;
  const completedTasks = tasks.filter((t) => t.status === TaskState.Approved).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              Operations Dashboard
            </h1>
            <Badge variant={apiConnected ? 'success' : 'bnb'} size="sm">
              {apiConnected ? 'Enterprise API Synced' : 'Local Deterministic Store'}
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Real-time telemetry on delegated AI workloads, proof digests, and Agent Passport status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadData}
          >
            Refresh
          </Button>
          <Link href="/mission">
            <Button variant="secondary" size="sm" leftIcon={<Rocket className="w-3.5 h-3.5 text-emerald-400" />}>
              30s Live Mission
            </Button>
          </Link>
          <Link href="/tasks/create">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
              New Analysis Task
            </Button>
          </Link>
        </div>
      </div>

      {(!isConnected || !hasAgentId) && (
        <div className="p-4 rounded-xl border border-amber-800/40 bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-ivory-100 block">
                {!isConnected ? 'Wallet Not Connected' : 'Binance Agent ID Token Required for Protected Contract Ops'}
              </span>
              <span className="text-charcoal-400">
                {!isConnected
                  ? 'Connect your Web3 wallet to authorize cryptographic client sign-offs.'
                  : 'An official Binance Agent ID BEP-721 token is required for protected on-chain TaskRegistry transitions.'}
              </span>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              Check Agent ID Status
            </Button>
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-charcoal-900/70 border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-charcoal-400 uppercase">Total Tasks</span>
            <Layers className="w-4 h-4 text-charcoal-300" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-ivory-50">{totalTasks}</span>
            <span className="text-xs text-charcoal-400 ml-2">
              ({tasks.filter((t) => !t.isDemo).length} live)
            </span>
          </div>
        </Card>

        <Card className="bg-charcoal-900/70 border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-charcoal-400 uppercase">Active / In Progress</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-blue-300">{activeTasks}</span>
            <span className="text-xs text-charcoal-400 ml-2">processing</span>
          </div>
        </Card>

        <Card className="bg-charcoal-900/70 border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-charcoal-400 uppercase">Awaiting Review</span>
            <AlertCircle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-purple-300">{awaitingReview}</span>
            <span className="text-xs text-charcoal-400 ml-2">need approval</span>
          </div>
        </Card>

        <Card className="bg-charcoal-900/70 border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-charcoal-400 uppercase">Finalized &amp; Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-400">{completedTasks}</span>
            <span className="text-xs text-charcoal-400 ml-2">approved</span>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ivory-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-forest-400" />
              Recent Work Orders
            </h3>
            <Link href="/marketplace" className="text-xs text-forest-400 hover:text-forest-300 flex items-center gap-1 font-mono">
              View all tasks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-charcoal-900 border border-subtle rounded-xl overflow-hidden shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-charcoal-950/80 border-b border-subtle text-charcoal-400 font-mono">
                  <tr>
                    <th className="py-3 px-4">TASK &amp; ORIGIN</th>
                    <th className="py-3 px-4">DATASET</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {tasks.slice(0, 6).map((task) => (
                    <tr key={task.id} className="hover:bg-charcoal-850/50 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-ivory-100 truncate">{task.title}</span>
                          {task.isDemo && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-charcoal-800 text-charcoal-400 border border-subtle shrink-0">
                              SAMPLE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-charcoal-400 font-mono mt-0.5">
                          {task.id} • {formatTimestamp(task.createdAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-charcoal-300">
                        {task.datasetFileName || 'Manual payload'}
                        <span className="text-charcoal-500 block">
                          {task.datasetRowCount ? `${task.datasetRowCount} rows` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <TaskStateBadge state={task.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/tasks/${task.id}`}>
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
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-charcoal-900 border-subtle">
            <CardHeader className="pb-3 border-b border-subtle">
              <CardTitle className="text-sm font-semibold text-ivory-100 flex items-center gap-2">
                <Bot className="w-4 h-4 text-forest-400" />
                Active Agent Workforce
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/passport/${agent.slug}`}
                  className="p-3 rounded-lg bg-charcoal-950/60 border border-subtle hover:border-forest-600/40 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={agent.avatarUrl}
                      alt={agent.name}
                      className="w-8 h-8 rounded-lg object-cover border border-subtle"
                    />
                    <div>
                      <span className="font-semibold text-ivory-100 block">{agent.name}</span>
                      <span className="text-[11px] text-charcoal-400 font-mono">
                        {truncateAddress(agent.walletAddress, 4)}
                      </span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    {agent.reputationScore}% Rep
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-charcoal-900 border-subtle">
            <CardHeader className="pb-3 border-b border-subtle">
              <CardTitle className="text-sm font-semibold text-ivory-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-bnb-yellow" />
                Trust &amp; Contract Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-charcoal-400">
                <span>Network:</span>
                <span className="text-ivory-200">BNB Smart Chain (56)</span>
              </div>
              <div className="flex justify-between text-charcoal-400">
                <span>Agent ID Contract:</span>
                <span className="text-forest-400">0x60b9...022f</span>
              </div>
              <div className="pt-3 border-t border-subtle flex justify-between">
                <Link href="/trust" className="text-xs text-forest-400 hover:underline flex items-center gap-1">
                  Trust Center <ExternalLink className="w-3 h-3" />
                </Link>
                <Link href="/activity" className="text-xs text-charcoal-300 hover:underline flex items-center gap-1">
                  Ledger <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
