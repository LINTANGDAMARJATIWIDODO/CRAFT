'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/components/wallet/WalletContext';
import { getStoredTasks } from '@/lib/task-store';
import { TaskRecord, TaskState } from '@craft/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, TaskStateBadge } from '@/components/ui/Badge';
import { truncateAddress, formatTimestamp } from '@/lib/utils';
import { INITIAL_AGENTS } from '@/lib/constants';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Activity,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const { isConnected, address, hasAgentId, agentIdTokenId } = useWallet();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    setIsLoading(true);
    const data = getStoredTasks();
    setTasks(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute real statistics from actual stored tasks
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(
    (t) => t.status === TaskState.Created || t.status === TaskState.Accepted || t.status === TaskState.InProgress
  ).length;
  const awaitingReview = tasks.filter(
    (t) => t.status === TaskState.Submitted || t.status === TaskState.RevisionRequested
  ).length;
  const completedTasks = tasks.filter((t) => t.status === TaskState.Approved).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              Operations Dashboard
            </h1>
            <Badge variant="bnb" size="sm">
              BNB Chain Live
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Real-time telemetry on delegated AI workloads, proof verification, and on-chain status transitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadData}
          >
            Refresh
          </Button>
          <Link href="/tasks/create">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            >
              New Analysis Task
            </Button>
          </Link>
        </div>
      </div>

      {/* Identity & Gate Warning if Wallet Not Connected or No Agent ID */}
      {(!isConnected || !hasAgentId) && (
        <div className="p-4 rounded-xl border border-amber-800/40 bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-ivory-100 block">
                {!isConnected ? 'Wallet Not Connected' : 'Binance Agent ID Token Required'}
              </span>
              <span className="text-charcoal-400">
                {!isConnected
                  ? 'Connect your Web3 wallet to authorize protected smart contract actions.'
                  : 'An official Binance Agent ID BEP-721 token is required to create and approve tasks.'}
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
        {/* Total Tasks */}
        <Card className="bg-charcoal-900/70 border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-charcoal-400 uppercase">Total Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-charcoal-800 flex items-center justify-center text-charcoal-300">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-ivory-50">{totalTasks}</span>
            <span className="text-xs text-charcoal-400 ml-2">recorded</span>
          </div>
        </Card>

        {/* Active Tasks */}
        <Card className="bg-charcoal-900/70 border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-charcoal-400 uppercase">Active / In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-blue-300">{activeTasks}</span>
            <span className="text-xs text-charcoal-400 ml-2">processing</span>
          </div>
        </Card>

        {/* Awaiting Review */}
        <Card className="bg-charcoal-900/70 border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-charcoal-400 uppercase">Awaiting Review</span>
            <div className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-purple-300">{awaitingReview}</span>
            <span className="text-xs text-charcoal-400 ml-2">need approval</span>
          </div>
        </Card>

        {/* Completed */}
        <Card className="bg-charcoal-900/70 border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-charcoal-400 uppercase">Finalized &amp; Approved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-400">{completedTasks}</span>
            <span className="text-xs text-charcoal-400 ml-2">on-chain</span>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: Recent Tasks & Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Tasks Table (8 cols) */}
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
                    <th className="py-3 px-4">TASK & OBJECTIVE</th>
                    <th className="py-3 px-4">DATASET</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {tasks.slice(0, 5).map((task) => (
                    <tr key={task.id} className="hover:bg-charcoal-850/50 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-ivory-100 truncate">{task.title}</div>
                        <div className="text-[11px] text-charcoal-400 font-mono mt-0.5">
                          ID: {task.id} • {formatTimestamp(task.createdAt)}
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

        {/* Side Panel: Agent Workforce & On-Chain Ledger (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Verified Agents */}
          <Card className="bg-charcoal-900 border-subtle">
            <CardHeader className="pb-3 border-b border-subtle">
              <CardTitle className="text-sm font-semibold text-ivory-100 flex items-center gap-2">
                <Bot className="w-4 h-4 text-forest-400" />
                Active Agent Workforce
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {INITIAL_AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3 rounded-lg bg-charcoal-950/60 border border-subtle flex items-center justify-between text-xs"
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
                </div>
              ))}
            </CardContent>
          </Card>

          {/* On-Chain Smart Contract Status */}
          <Card className="bg-charcoal-900 border-subtle">
            <CardHeader className="pb-3 border-b border-subtle">
              <CardTitle className="text-sm font-semibold text-ivory-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-bnb-yellow" />
                TaskRegistry.sol On-Chain
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-charcoal-400">
                <span>Contract Network:</span>
                <span className="text-ivory-200">BNB Smart Chain (56)</span>
              </div>
              <div className="flex justify-between text-charcoal-400">
                <span>Agent ID Contract:</span>
                <span className="text-forest-400 truncate max-w-[150px]">0x60b9...022f</span>
              </div>
              <div className="flex justify-between text-charcoal-400">
                <span>State Transitions:</span>
                <span className="text-emerald-400 font-bold">7 Contract Events</span>
              </div>
              <div className="pt-3 border-t border-subtle">
                <Link href="/activity" className="text-xs text-forest-400 hover:text-forest-300 flex items-center justify-between">
                  <span>View On-Chain Ledger</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
