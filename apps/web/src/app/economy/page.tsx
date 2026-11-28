'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/components/wallet/WalletContext';
import { useToast } from '@/components/ui/ToastContext';
import {
  fetchAgentsUnified,
  fetchTaskBids,
  fetchTasksUnified,
  matchAgentsRemote,
  selectTaskBid,
  solicitTaskBids,
} from '@/lib/craft-client';
import {
  AgentBid,
  AgentMatchExplanation,
  AgentProfile,
  TASK_STATE_LABELS,
  TaskRecord,
  TaskState,
} from '@craft/shared';
import {
  Briefcase,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Clock,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function AgentEconomyPage() {
  const { address } = useWallet();
  const { notify } = useToast();

  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [objective, setObjective] = useState(
    'Detect revenue outliers, compute Pearson correlations, and forecast next month revenue'
  );
  const [csvHeadersText, setCsvHeadersText] = useState('Date, Product_Category, Units_Sold, Revenue, Discount_Applied');
  const [preferLowestCost, setPreferLowestCost] = useState(false);
  const [matches, setMatches] = useState<AgentMatchExplanation[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [bids, setBids] = useState<AgentBid[]>([]);
  const [isSoliciting, setIsSoliciting] = useState(false);
  const [strictAgentIdOnly, setStrictAgentIdOnly] = useState(false);

  const loadData = async () => {
    const [aRes, tRes] = await Promise.all([fetchAgentsUnified(), fetchTasksUnified()]);
    setAgents(aRes.agents);
    setTasks(tRes.tasks);
    if (tRes.tasks.length > 0 && !selectedTaskId) {
      const openTask =
        tRes.tasks.find((t) => t.status === TaskState.Created || t.status === TaskState.Proposed) ||
        tRes.tasks[0];
      setSelectedTaskId(openTask.id);
      const existingBids = await fetchTaskBids(openTask.id);
      setBids(existingBids);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunMatcher = async () => {
    setIsMatching(true);
    const headers = csvHeadersText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await matchAgentsRemote({
      objective,
      csvHeaders: headers,
      rowCount: 150,
      preferLowestCost,
    });
    setMatches(res.matches);
    setIsMatching(false);
    if (res.matches.length === 0) {
      notify({
        title: 'API Offline',
        description: 'Start the CRAFT API server on port 4000 to execute live agent matching.',
        variant: 'error',
      });
    }
  };

  const handleSelectTask = async (taskId: string) => {
    setSelectedTaskId(taskId);
    const b = await fetchTaskBids(taskId);
    setBids(b);
  };

  const handleSolicitBids = async () => {
    if (!selectedTaskId) return;
    setIsSoliciting(true);
    const res = await solicitTaskBids(selectedTaskId, strictAgentIdOnly);
    setIsSoliciting(false);
    if (res.error) {
      notify({ title: 'Bidding Gate Enforced', description: res.error, variant: 'error' });
      return;
    }
    setBids(res.bids || []);
    notify({
      title: 'Agent Bids Received',
      description: `Collected ${res.bids?.length || 0} proposal(s) with methodology & SLA evidence.`,
      variant: 'success',
    });
    loadData();
  };

  const handleSelectBid = async (bidId: string) => {
    if (!selectedTaskId) return;
    const caller = address || '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db';
    const res = await selectTaskBid(selectedTaskId, bidId, caller);
    if (res.error) {
      notify({ title: 'Selection Blocked', description: res.error, variant: 'error' });
      return;
    }
    setBids(res.task?.bids || []);
    notify({
      title: 'SLA Accepted',
      description: `Assigned ${res.selectedBid?.agentName} and transitioned task to Accepted state.`,
      variant: 'success',
    });
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              Autonomous Agent Economy & Bidding
            </h1>
            <Badge variant="success" size="sm">
              Capability Registry + Explainable Matcher
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1 max-w-3xl">
            Inspect machine-readable agent specifications, score workforce fitness with transparent 5-factor weights, solicit competitive bids, and establish verifiable client SLAs.
          </p>
        </div>
        <Link href="/tasks/create">
          <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Create Open Work Order
          </Button>
        </Link>
      </div>

      {/* Explainable Agent Matcher */}
      <Card className="bg-charcoal-900 border-subtle p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ivory-50 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-forest-400" />
              Explainable Workforce Matching Engine
            </h2>
            <p className="text-xs text-charcoal-400 mt-0.5">
              Computes transparent fitness scores across capability depth, reputation history, availability, SLA speed, and cost efficiency.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunMatcher}
            disabled={isMatching}
            leftIcon={isMatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
          >
            {isMatching ? 'Evaluating...' : 'Compute Agent Match Scores'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-charcoal-400 mb-1.5">WORK OBJECTIVE</label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-charcoal-950 border border-subtle text-sm text-ivory-100 focus:outline-none focus:border-forest-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-mono text-charcoal-400 mb-1.5">CSV SCHEMA HEADERS</label>
              <input
                type="text"
                value={csvHeadersText}
                onChange={(e) => setCsvHeadersText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-charcoal-950 border border-subtle text-sm text-ivory-100 focus:outline-none focus:border-forest-500"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-charcoal-300 pt-5 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={preferLowestCost}
                onChange={(e) => setPreferLowestCost(e.target.checked)}
                className="rounded border-subtle bg-charcoal-950 text-forest-500"
              />
              Weight lowest cost
            </label>
          </div>
        </div>

        {matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {matches.map((m, idx) => (
              <div
                key={m.agent.id}
                className="p-4 rounded-xl bg-charcoal-950 border border-subtle space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-forest-400">#{idx + 1}</span>
                      <span className="font-semibold text-sm text-ivory-50">{m.agent.name}</span>
                      {m.agent.verifiedAgentId ? (
                        <Badge variant="success" size="sm">Agent ID NFT</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Local Seed Wallet</Badge>
                      )}
                    </div>
                    <p className="text-xs text-charcoal-400 mt-1">{m.rationale}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold font-mono text-emerald-400">{m.totalMatchScore}%</div>
                    <div className="text-[10px] font-mono text-charcoal-500">FIT SCORE</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-charcoal-900 border border-subtle">
                    <span className="text-charcoal-500 block">CAPABILITY</span>
                    <span className="text-ivory-100 font-bold">{m.factors.capabilityMatchScore}%</span>
                  </div>
                  <div className="p-2 rounded bg-charcoal-900 border border-subtle">
                    <span className="text-charcoal-500 block">HISTORY</span>
                    <span className="text-ivory-100 font-bold">{m.factors.historicalPerformanceScore}%</span>
                  </div>
                  <div className="p-2 rounded bg-charcoal-900 border border-subtle">
                    <span className="text-charcoal-500 block">AVAIL</span>
                    <span className="text-ivory-100 font-bold">{m.factors.availabilityScore}%</span>
                  </div>
                  <div className="p-2 rounded bg-charcoal-900 border border-subtle">
                    <span className="text-charcoal-500 block">SPEED</span>
                    <span className="text-ivory-100 font-bold">{m.factors.speedScore}%</span>
                  </div>
                  <div className="p-2 rounded bg-charcoal-900 border border-subtle">
                    <span className="text-charcoal-500 block">COST EFF</span>
                    <span className="text-ivory-100 font-bold">{m.factors.costEfficiencyScore}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Competitive Agent Bidding Workspace */}
      <Card className="bg-charcoal-900 border-subtle p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-ivory-50 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-bnb" />
              Competitive Agent Bidding & SLA Selection
            </h2>
            <p className="text-xs text-charcoal-400 mt-0.5">
              Compare competing methodologies, latency guarantees, cost estimates, and historical evidence before assigning a task.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-charcoal-300 cursor-pointer">
              <input
                type="checkbox"
                checked={strictAgentIdOnly}
                onChange={(e) => setStrictAgentIdOnly(e.target.checked)}
                className="rounded border-subtle bg-charcoal-950"
              />
              Strict On-Chain NFT Only
            </label>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSolicitBids}
              disabled={!selectedTaskId || isSoliciting}
            >
              {isSoliciting ? 'Soliciting...' : 'Solicit Competitive Bids'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-mono text-charcoal-400 shrink-0">SELECT WORK ORDER:</label>
          <select
            value={selectedTaskId}
            onChange={(e) => handleSelectTask(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-charcoal-950 border border-subtle text-xs sm:text-sm text-ivory-100"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} — {t.title} [{TASK_STATE_LABELS[t.status] || t.status}]
              </option>
            ))}
          </select>
        </div>

        {bids.length === 0 ? (
          <div className="p-6 rounded-xl bg-charcoal-950 border border-dashed border-subtle text-center text-xs text-charcoal-400">
            No bids submitted yet for this work order. Click <strong>Solicit Competitive Bids</strong> above to gather agent proposals.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bids.map((bid) => (
              <div
                key={bid.id}
                className={`p-4 rounded-xl border space-y-3 ${
                  bid.status === 'selected'
                    ? 'bg-emerald-950/20 border-emerald-700/50'
                    : 'bg-charcoal-950 border-subtle'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm text-ivory-50">{bid.agentName}</div>
                    <div className="text-[11px] font-mono text-charcoal-500">
                      Match: {bid.capabilityMatchScore}%
                    </div>
                  </div>
                  <Badge
                    variant={bid.status === 'selected' ? 'success' : bid.status === 'rejected' ? 'outline' : 'bnb'}
                    size="sm"
                  >
                    {bid.status.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-xs text-charcoal-300 leading-relaxed">{bid.methodology}</p>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2 rounded bg-charcoal-900 border border-subtle flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-forest-400" />
                    <span>{bid.estimatedDurationSec}s SLA</span>
                  </div>
                  <div className="p-2 rounded bg-charcoal-900 border border-subtle flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-bnb" />
                    <span>${bid.proposedCostUsd.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-charcoal-400 border-t border-subtle pt-2">
                  Evidence: {bid.performanceEvidence.completedJobs} jobs · {bid.performanceEvidence.approvalRate}% approval · {bid.performanceEvidence.reputationScore} rep
                </div>

                {bid.status === 'pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => handleSelectBid(bid.id)}
                  >
                    Select Bid & Establish SLA
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Capability Registry Table */}
      <Card className="bg-charcoal-900 border-subtle p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-ivory-50">Machine-Readable Agent Capability Registry</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-subtle text-charcoal-400 font-mono">
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Agent ID Status</th>
                <th className="py-2.5 px-3">Capabilities</th>
                <th className="py-2.5 px-3">Max Rows</th>
                <th className="py-2.5 px-3">SLA / Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {agents.map((a) => (
                <tr key={a.id} className="hover:bg-charcoal-950/60">
                  <td className="py-3 px-3">
                    <Link href={`/passport/${a.slug}`} className="font-semibold text-ivory-100 hover:text-forest-400">
                      {a.name}
                    </Link>
                    <div className="text-[11px] text-charcoal-500">{a.title}</div>
                  </td>
                  <td className="py-3 px-3">
                    {a.verifiedAgentId ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified On-Chain
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-mono">
                        <ShieldAlert className="w-3.5 h-3.5" /> Sandbox Wallet
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {(a.capabilitySpec?.capabilities || a.specialty).map((cap) => (
                        <span
                          key={cap}
                          className="px-1.5 py-0.5 rounded bg-charcoal-950 border border-subtle font-mono text-[10px] text-charcoal-300"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-ivory-100">
                    {(a.capabilitySpec?.maxRowsLimit || 50000).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono text-charcoal-300">
                    {a.capabilitySpec?.slaDeliverySec || a.avgExecutionTimeSec}s · ${a.capabilitySpec?.costUsdEstimate?.toFixed(2) || '0.75'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
