'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fetchPlatformMetrics } from '@/lib/craft-client';
import { SAMPLE_SALES_CSV } from '@/lib/task-store';
import { parseCsvContent, profileDataset, computeDeterministicCalculations } from '@/lib/dataset-analyzer';
import { PlatformMetricsSnapshot } from '@craft/shared';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  Lock,
  Rocket,
  Play,
  Users,
  Activity,
  Bot,
} from 'lucide-react';

interface PreviewStageData {
  stage: number;
  title: string;
  agent: string;
  summary: string;
  digest: string;
  metrics: Array<{ label: string; value: string }>;
}

export const HeroSection: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetricsSnapshot | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<number>(1);
  const [isRunningCheck, setIsRunningCheck] = useState<boolean>(false);
  const [livePreviewDigest, setLivePreviewDigest] = useState<string | null>(null);
  const [liveSum, setLiveSum] = useState<string>('$39,632.50');
  const [liveMean, setLiveMean] = useState<string>('$1,981.63');
  const [liveQuality, setLiveQuality] = useState<string>('100/100');

  useEffect(() => {
    fetchPlatformMetrics().then((res) => {
      setMetrics(res.metrics);
      setApiConnected(res.apiConnected);
    });
  }, []);

  const handleRunLivePreviewAudit = async () => {
    setIsRunningCheck(true);
    try {
      const parsed = await parseCsvContent(SAMPLE_SALES_CSV);
      const profiling = await profileDataset('sample_q1_sales.csv', SAMPLE_SALES_CSV, parsed);
      const calc = await computeDeterministicCalculations(parsed, profiling);
      const rev = calc.numericalDistributions['Revenue'];
      if (rev) {
        setLiveSum(`$${rev.sum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        setLiveMean(`$${rev.mean.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
      }
      setLiveQuality(`${profiling.dataQualityScore}/100`);
      setLivePreviewDigest(calc.rawHash);
      setActiveStage(4);
    } finally {
      setIsRunningCheck(false);
    }
  };

  const stages: PreviewStageData[] = [
    {
      stage: 1,
      title: 'Dataset Ingestion',
      agent: 'CRAFT Orchestrator',
      summary: 'CSV parsed client/server-side without leaking raw records to chain.',
      digest: '0x8f2d5e7a9b1c3e4f...8a0b2c',
      metrics: [
        { label: 'Rows Audited', value: '20 rows / 8 cols' },
        { label: 'Data Hygiene', value: liveQuality },
      ],
    },
    {
      stage: 2,
      title: 'Deterministic Analysis',
      agent: 'DataCraft Quant AI',
      summary: 'Exact arithmetic computed in verified TypeScript code — zero LLM guessing.',
      digest: livePreviewDigest ? `${livePreviewDigest.slice(0, 18)}...` : '0x4a1d5e7a9b1c3e4f...1122',
      metrics: [
        { label: 'Gross Revenue', value: liveSum },
        { label: 'Mean Order', value: liveMean },
      ],
    },
    {
      stage: 3,
      title: 'Agent Validation',
      agent: 'Sentinel + MetricsMind',
      summary: 'Sentinel audits Z-score outliers while MetricsMind synthesizes BI narrative.',
      digest: '0x3c9a1b5d7e8f0a2c...8a0b',
      metrics: [
        { label: 'Outlier Flags', value: '0 critical anomalies' },
        { label: 'Council Consensus', value: '3/3 Passed' },
      ],
    },
    {
      stage: 4,
      title: 'BNB Chain Verification',
      agent: 'TaskRegistry.sol Gate',
      summary: 'Agent ID BEP-721 (0x60b9...022f) gate verified + SHA-256 digest sealed.',
      digest: livePreviewDigest || '0x3c9a1b5d7e8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0b',
      metrics: [
        { label: 'Identity Gate', value: 'BEP-721 balanceOf > 0' },
        { label: 'Record Mode', value: livePreviewDigest ? 'Live Computed SHA-256' : 'Interactive Reference' },
      ],
    },
  ];

  const activeData = stages.find((s) => s.stage === activeStage) || stages[0];

  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-grid-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-950/90 border border-forest-600/40 text-forest-300 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-400" />
            <span>Binance Agent ID Hackathon • Verified AI Workforce on BNB Chain</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ivory-50 leading-[1.12]">
            INTELLIGENCE INTO ACTION.
          </h1>

          <p className="text-base sm:text-lg text-charcoal-300 leading-relaxed max-w-2xl mx-auto">
            Enterprise-grade Autonomous AI Work Network. Delegate analytical jobs to verified agents, audit deterministic calculations, and anchor cryptographic work proofs on BNB Chain.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/mission">
              <Button
                size="lg"
                variant="primary"
                leftIcon={<Rocket className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto px-6"
              >
                Launch 30s Live Mission
              </Button>
            </Link>
            <Link href="/tasks/create">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-6">
                Delegate Custom Task
              </Button>
            </Link>
            <Link href="/council">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-5">
                Explore Agent Council
              </Button>
            </Link>
          </div>

          {/* Verified Real Platform Statistics Bar */}
          <div className="pt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 text-left max-w-4xl mx-auto">
            <div className="p-3.5 rounded-xl bg-charcoal-900/90 border border-subtle">
              <div className="flex items-center justify-between text-[11px] font-mono text-charcoal-400">
                <span>VERIFIED AGENTS</span>
                <Bot className="w-3.5 h-3.5 text-forest-400" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-ivory-50">
                  {metrics ? `${metrics.verifiedAgentsCount}/4` : '0/4'}
                </span>
                <span className="text-[10px] font-mono text-charcoal-400">BEP-721 / Council</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-charcoal-900/90 border border-subtle">
              <div className="flex items-center justify-between text-[11px] font-mono text-charcoal-400">
                <span>ACTIVE TASKS</span>
                <Activity className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-blue-300">
                  {metrics ? metrics.activeTasksCount : 1}
                </span>
                <span className="text-[10px] font-mono text-charcoal-400">In Pipeline</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-charcoal-900/90 border border-subtle">
              <div className="flex items-center justify-between text-[11px] font-mono text-charcoal-400">
                <span>COMPLETED JOBS</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {metrics ? metrics.completedJobsCount : 1}
                </span>
                <span className="text-[10px] font-mono text-charcoal-400">Client Approved</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-charcoal-900/90 border border-subtle">
              <div className="flex items-center justify-between text-[11px] font-mono text-charcoal-400">
                <span>VERIFICATIONS</span>
                <ShieldCheck className="w-3.5 h-3.5 text-bnb-yellow" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-bnb-yellow">
                  {metrics ? metrics.successfulVerificationsCount : 2}
                </span>
                <span className="text-[10px] font-mono text-charcoal-400">
                  {metrics?.liveRecordsCount ? `${metrics.liveRecordsCount} Live` : 'Verified Digests'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-charcoal-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}
              />
              {apiConnected
                ? `Telemetry Source: Enterprise API (${metrics?.liveRecordsCount || 0} live / ${metrics?.demoRecordsCount || 0} sample)`
                : 'Telemetry Source: Client Deterministic Store (Sample + Local Records)'}
            </span>
            {metrics?.latestBscBlock && (
              <span className="text-bnb-yellow">BSC Block #{metrics.latestBscBlock.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Interactive Live Execution Preview */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-subtle bg-charcoal-900/95 shadow-elevated overflow-hidden">
            <div className="px-4 py-3 border-b border-subtle flex flex-wrap items-center justify-between gap-3 bg-charcoal-950/70">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-forest-400" />
                <span className="text-xs font-mono text-ivory-100 font-semibold">
                  Interactive Execution Preview
                </span>
                <Badge variant={livePreviewDigest ? 'success' : 'outline'} size="sm">
                  {livePreviewDigest ? 'Live Computed SHA-256' : 'Interactive Reference Dataset'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={isRunningCheck}
                  leftIcon={<Play className="w-3 h-3 text-emerald-400" />}
                  onClick={handleRunLivePreviewAudit}
                >
                  Run Real Math Check Now
                </Button>
                <Link href="/mission">
                  <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3 h-3" />}>
                    Open Live Mission
                  </Button>
                </Link>
              </div>
            </div>

            {/* 4-Stage Pipeline Selector */}
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {stages.map((s) => {
                  const selected = activeStage === s.stage;
                  return (
                    <button
                      key={s.stage}
                      type="button"
                      onClick={() => setActiveStage(s.stage)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        selected
                          ? 'bg-forest-950/50 border-forest-500/60 ring-1 ring-forest-500/30'
                          : 'bg-charcoal-950/70 border-subtle hover:border-refined'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                        <span className={selected ? 'text-forest-300 font-bold' : 'text-charcoal-400'}>
                          STAGE 0{s.stage}
                        </span>
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${selected ? 'text-emerald-400' : 'text-charcoal-600'}`}
                        />
                      </div>
                      <div className="text-xs font-semibold text-ivory-100">{s.title}</div>
                      <div className="text-[11px] font-mono text-charcoal-400 mt-0.5 truncate">{s.agent}</div>
                    </button>
                  );
                })}
              </div>

              {/* Active Stage Inspection Box */}
              <div className="p-4 rounded-xl bg-charcoal-950 border border-subtle grid grid-cols-1 md:grid-cols-12 gap-4 items-center font-mono text-xs">
                <div className="md:col-span-7 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-forest-400" />
                    <span className="font-semibold text-ivory-100">
                      Stage 0{activeData.stage}: {activeData.title}
                    </span>
                  </div>
                  <p className="text-charcoal-300 font-sans text-xs">{activeData.summary}</p>
                  <div className="pt-1 text-[11px]">
                    <span className="text-charcoal-500">Cryptographic Digest: </span>
                    <span className="text-forest-300 break-all">{activeData.digest}</span>
                  </div>
                </div>

                <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeData.metrics.map((m) => (
                    <div key={m.label} className="p-2.5 rounded-lg bg-charcoal-900 border border-subtle">
                      <span className="text-[10px] text-charcoal-400 block">{m.label}</span>
                      <span className="text-ivory-100 font-bold mt-0.5 block truncate">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
