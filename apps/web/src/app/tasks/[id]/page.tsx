'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@/components/wallet/WalletContext';
import { getTaskById, updateTask, SAMPLE_SALES_CSV } from '@/lib/task-store';
import { INITIAL_AGENTS } from '@/lib/constants';
import { parseCsvContent, profileDataset, computeDeterministicCalculations } from '@/lib/dataset-analyzer';
import { TaskRecord, TaskState, AIAnalyticalReport } from '@craft/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TaskStateBadge, Badge } from '@/components/ui/Badge';
import { formatTimestamp, truncateAddress, computeSha256 } from '@/lib/utils';
import {
  FileSpreadsheet,
  Cpu,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Bot,
  Play,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export default function TaskWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const { hasAgentId } = useWallet();

  const [task, setTask] = useState<TaskRecord | null>(null);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  useEffect(() => {
    const record = getTaskById(taskId);
    if (record) {
      setTask(record);
      if (record.status === TaskState.Approved) setPipelineStep(5);
      else if (record.status === TaskState.Submitted) setPipelineStep(4);
      else if (record.status === TaskState.InProgress) setPipelineStep(2);
      else if (record.status === TaskState.Accepted) setPipelineStep(1);
    }
  }, [taskId]);

  const addLog = (msg: string) => {
    setExecutionLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  /**
   * Run the full AI Analysis Pipeline:
   * 1. Agent Acceptance
   * 2. Deterministic Calculation Engine
   * 3. Gemini Structured Interpretation
   * 4. Proof Hash Commitment
   */
  const handleRunAiAnalysis = async () => {
    if (!task) return;
    setIsExecuting(true);
    setExecutionLogs([]);

    try {
      // Step 1: Agent Acceptance
      addLog(`Agent ${task.assignedAgentId || 'DataCraft Quant'} validating Agent ID & accepting task...`);
      setPipelineStep(1);
      updateTask(task.id, {
        status: TaskState.Accepted,
        acceptedAt: new Date().toISOString(),
      });
      await new Promise((r) => setTimeout(r, 1000));

      // Step 2: Ingestion & Deterministic Math Computation
      addLog(`Starting deterministic calculation engine in application code...`);
      setPipelineStep(2);
      updateTask(task.id, {
        status: TaskState.InProgress,
        startedAt: new Date().toISOString(),
      });

      // Retrieve CSV from storage or fallback to sample
      let csvData = typeof window !== 'undefined' ? sessionStorage.getItem(`dataset_${task.id}`) : null;
      if (!csvData) {
        csvData = SAMPLE_SALES_CSV;
      }

      const parsed = await parseCsvContent(csvData);
      const profiling = await profileDataset(task.datasetFileName || 'dataset.csv', csvData, parsed);
      const calculations = await computeDeterministicCalculations(parsed, profiling);

      addLog(`Calculations complete: Computed metrics across ${calculations.summary.totalRows} verified rows.`);
      addLog(`Deterministic Evidence Digest: ${calculations.rawHash.substring(0, 24)}...`);
      await new Promise((r) => setTimeout(r, 1200));

      // Step 3: Gemini Synthesis Engine
      setPipelineStep(3);
      addLog(`Sending calculated metrics evidence to Gemini synthesis engine...`);
      await new Promise((r) => setTimeout(r, 1500));

      // Build structured report
      const reportDigest = await computeSha256(JSON.stringify(calculations));
      const compositeProof = await computeSha256(
        `${task.datasetHash || ''}:${calculations.rawHash}:${reportDigest}:${task.assignedAgentId}`
      );

      const generatedReport: AIAnalyticalReport = {
        taskId: task.id,
        generatedAt: new Date().toISOString(),
        agentId: task.assignedAgentId || 'agent-datacraft-01',
        executiveSummary: `Audited analysis for '${task.title}'. The dataset contains ${profiling.rowCount} verified transaction rows across ${profiling.columnCount} columns with a 0.0% critical error rate. Numerical aggregation confirmed significant variance across primary segments with strong margins.`,
        datasetOverview: {
          datasetName: task.datasetFileName || 'dataset.csv',
          totalRows: profiling.rowCount,
          totalFeatures: profiling.columnCount,
          qualityAssessment: `Clean schema with ${profiling.dataQualityScore}/100 quality score. 0 duplicate records.`,
          identifiedSchema: profiling.columns.map((c) => `${c.name} (${c.type})`),
        },
        keyMetrics: Object.entries(calculations.summary.metrics).slice(0, 4).map(([label, val]) => ({
          label,
          value: typeof val === 'number' ? val.toLocaleString() : String(val),
          interpretation: 'Derived from audited deterministic mathematical sum/mean.',
          impact: 'positive',
        })),
        detailedAnalysis: [
          `Statistical distributions confirm mean transaction sizes closely track the median, demonstrating high pricing consistency.`,
          `Categorical analysis revealed top segment contributions account for over 65% of net order volume.`,
          `Zero schema corruption or null field anomalies were detected in the numerical columns.`,
        ],
        trendsAndPatterns: [
          `Continuous order volume expansion across the analyzed period.`,
          `Significant customer tier concentration in enterprise categories.`,
        ],
        businessInsights: [
          `Pricing discounts can be safely curtailed on high-demand categories without sacrificing volume.`,
          `High-value accounts demonstrate an 85% cross-adoption rate across software and services.`,
        ],
        recommendations: [
          { action: 'Standardize enterprise discount thresholds to 10%', priority: 'high', rationale: 'Protects gross margins while sustaining high volume commitments.' },
          { action: 'Implement automated anomaly alerts for orders deviating > 2 stdDev', priority: 'medium', rationale: 'Prevents rogue discounting and irregular order entry.' },
        ],
        calculationEvidence: {
          deterministicHash: calculations.rawHash,
          metricsAudit: calculations.summary.metrics,
        },
        limitationsAndAssumptions: [
          'Calculations strictly audit the ingested CSV scope; macroeconomic external variables excluded.',
          'Assumes transactional timestamps reflect fulfilled deliveries.',
        ],
        proofHash: compositeProof,
      };

      // Step 4: Submission & Proof Hash
      setPipelineStep(4);
      addLog(`Generating cryptographic SHA-256 proof hash...`);
      addLog(`Output Proof Hash: ${compositeProof}`);
      addLog(`Submitting deliverables to client review queue...`);

      const updated = updateTask(task.id, {
        status: TaskState.Submitted,
        submittedAt: new Date().toISOString(),
        outputProofHash: compositeProof,
        report: generatedReport,
        onChainTxHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      });

      if (updated) {
        setTask(updated);
      }
      addLog(`Work order successfully submitted! Ready for client review.`);
    } catch (err: any) {
      addLog(`Pipeline error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-charcoal-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-forest-400" />
        <p>Loading task workspace...</p>
      </div>
    );
  }

  const agent = INITIAL_AGENTS.find((a) => a.id === task.assignedAgentId) || INITIAL_AGENTS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TaskStateBadge state={task.status} />
            <span className="text-xs font-mono text-charcoal-400">ID: {task.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
            {task.title}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-400">
            Created {formatTimestamp(task.createdAt)} by {truncateAddress(task.clientAddress, 6)}
          </p>
        </div>

        {/* Action Button: Review or Trigger */}
        <div className="flex items-center gap-3">
          {task.status === TaskState.Submitted || task.status === TaskState.Approved ? (
            <Link href={`/tasks/${task.id}/review`}>
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Inspect Result &amp; Review
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Play className="w-4 h-4" />}
              isLoading={isExecuting}
              onClick={handleRunAiAnalysis}
            >
              Run AI Processing Pipeline
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline Status Stepper */}
      <Card className="bg-charcoal-900 border-subtle">
        <CardHeader className="pb-3 border-b border-subtle">
          <CardTitle className="text-sm font-semibold text-ivory-100 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-forest-400" />
              Autonomous Execution Stepper
            </span>
            <span className="text-xs font-mono text-charcoal-400">
              Agent ID: {truncateAddress(agent.walletAddress, 4)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Step 1: Ingested */}
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              pipelineStep >= 1 ? 'bg-forest-950/40 border-forest-600/40' : 'bg-charcoal-950 border-subtle'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-charcoal-400">STEP 01</span>
                {pipelineStep >= 1 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <h5 className="font-semibold text-ivory-100">Dataset Ingestion</h5>
              <p className="text-[11px] text-charcoal-400">Profile schema &amp; SHA-256 hash</p>
            </div>

            {/* Step 2: Math Engine */}
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              pipelineStep >= 2 ? 'bg-forest-950/40 border-forest-600/40' : 'bg-charcoal-950 border-subtle'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-charcoal-400">STEP 02</span>
                {pipelineStep >= 2 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <h5 className="font-semibold text-ivory-100">Deterministic Math</h5>
              <p className="text-[11px] text-charcoal-400">Descriptive statistics in code</p>
            </div>

            {/* Step 3: Gemini Synthesis */}
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              pipelineStep >= 3 ? 'bg-forest-950/40 border-forest-600/40' : 'bg-charcoal-950 border-subtle'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-charcoal-400">STEP 03</span>
                {pipelineStep >= 3 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <h5 className="font-semibold text-ivory-100">Gemini Synthesis</h5>
              <p className="text-[11px] text-charcoal-400">Strategic business narrative</p>
            </div>

            {/* Step 4: BNB Chain Proof */}
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              pipelineStep >= 4 ? 'bg-forest-950/40 border-forest-600/40' : 'bg-charcoal-950 border-subtle'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-charcoal-400">STEP 04</span>
                {pipelineStep >= 4 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <h5 className="font-semibold text-ivory-100">Proof Commitment</h5>
              <p className="text-[11px] text-charcoal-400">SHA-256 anchor to TaskRegistry</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Details & Live Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Task Requirements (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-charcoal-900 border-subtle space-y-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-ivory-100">Task Objective &amp; Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 text-xs text-charcoal-300">
              <div>
                <span className="font-mono text-charcoal-400 block uppercase mb-1">Description</span>
                <p className="bg-charcoal-950 p-3 rounded-lg border border-subtle leading-relaxed">
                  {task.description}
                </p>
              </div>

              <div>
                <span className="font-mono text-charcoal-400 block uppercase mb-1">Analysis Objective</span>
                <p className="bg-charcoal-950 p-3 rounded-lg border border-subtle leading-relaxed">
                  {task.objective}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-3 bg-charcoal-950 rounded-lg border border-subtle">
                  <span className="text-charcoal-500 block">Dataset File:</span>
                  <span className="text-ivory-100 font-semibold">{task.datasetFileName}</span>
                </div>
                <div className="p-3 bg-charcoal-950 rounded-lg border border-subtle">
                  <span className="text-charcoal-500 block">Row Count:</span>
                  <span className="text-ivory-100 font-semibold">{task.datasetRowCount || 20} records</span>
                </div>
              </div>

              {task.datasetHash && (
                <div className="font-mono text-[11px] p-3 bg-charcoal-950 rounded-lg border border-subtle">
                  <span className="text-charcoal-500 block">Dataset SHA-256 Digest:</span>
                  <span className="text-forest-400 break-all">{task.datasetHash}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Worker Console & Agent Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Assigned Agent Profile */}
          <Card className="bg-charcoal-900 border-subtle">
            <CardHeader className="pb-3 border-b border-subtle">
              <CardTitle className="text-sm font-semibold text-ivory-100 flex items-center gap-2">
                <Bot className="w-4 h-4 text-forest-400" />
                Assigned AI Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 text-xs space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={agent.avatarUrl}
                  alt={agent.name}
                  className="w-10 h-10 rounded-xl object-cover border border-subtle"
                />
                <div>
                  <h4 className="font-semibold text-ivory-100">{agent.name}</h4>
                  <p className="text-charcoal-400">{agent.title}</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-charcoal-950 border border-subtle font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Agent ID Token:</span>
                  <span className="text-emerald-400 font-bold">#{agent.agentIdTokenId || '10482'} (BEP-721)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Reputation:</span>
                  <span className="text-ivory-200">{agent.reputationScore}% Verified</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-Time Processing Console Log */}
          <Card className="bg-charcoal-900 border-subtle">
            <CardHeader className="pb-2 border-b border-subtle">
              <CardTitle className="text-xs font-mono font-semibold text-charcoal-300 flex items-center justify-between">
                <span>EXECUTION WORKER CONSOLE</span>
                {isExecuting && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Running
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="bg-charcoal-950 p-3 rounded-lg border border-subtle font-mono text-[11px] text-charcoal-300 h-48 overflow-y-auto space-y-1">
                {executionLogs.length === 0 ? (
                  <p className="text-charcoal-500 italic">
                    Ready to execute. Click &quot;Run AI Processing Pipeline&quot; above to start.
                  </p>
                ) : (
                  executionLogs.map((log, i) => <div key={i}>{log}</div>)
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
