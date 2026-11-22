import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden bg-grid-pattern">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-forest-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-950/80 border border-forest-600/40 text-forest-300 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-400" />
            <span>Binance Agent ID Hackathon • BNB Chain</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ivory-50 leading-[1.15]">
            Intelligence Into Action.
          </h1>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-charcoal-300 leading-relaxed max-w-2xl mx-auto">
            Delegate meaningful work to AI Agents. Review every result. Build trust through verifiable execution on BNB Chain.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/tasks/create">
              <Button
                size="lg"
                variant="primary"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto px-6"
              >
                Start Working
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto px-6"
              >
                Explore How It Works
              </Button>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-charcoal-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Deterministic Math Engine
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Binance Agent ID Gated
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Zero Dataset Leaks
            </span>
          </div>
        </div>

        {/* Real Product Interactive Component Preview */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-subtle bg-charcoal-900/90 shadow-elevated overflow-hidden backdrop-blur-md">
            {/* Window bar */}
            <div className="px-4 py-3 border-b border-subtle flex items-center justify-between bg-charcoal-950/60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-charcoal-400">
                  task_worker://agent-datacraft-01 • task-craft-001
                </span>
              </div>
              <Badge variant="bnb" size="sm">
                BNB Chain #38491024
              </Badge>
            </div>

            {/* Live Terminal & Analysis Simulation */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              {/* Col 1: Dataset Profile */}
              <div className="p-4 rounded-xl bg-charcoal-950/80 border border-subtle space-y-3">
                <div className="flex items-center justify-between text-charcoal-400">
                  <span className="flex items-center gap-1.5 text-ivory-100 font-semibold">
                    <FileSpreadsheet className="w-4 h-4 text-forest-400" />
                    Dataset Ingestion
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px]">Valid</span>
                </div>
                <div className="space-y-1.5 text-charcoal-300">
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">File:</span>
                    <span className="text-ivory-200">revenue_audit.csv</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">Rows / Cols:</span>
                    <span className="text-ivory-200">20 rows / 8 cols</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">Missing Rate:</span>
                    <span className="text-emerald-400">0.0% (Clean)</span>
                  </div>
                  <div className="pt-2 border-t border-subtle">
                    <span className="text-[10px] text-charcoal-400 block">SHA-256 Digest:</span>
                    <span className="text-[10px] text-forest-300 truncate block">
                      0x8f2d5e7a9b1c3e4f6a8b0c2d4e6f...
                    </span>
                  </div>
                </div>
              </div>

              {/* Col 2: Deterministic Calculation */}
              <div className="p-4 rounded-xl bg-charcoal-950/80 border border-subtle space-y-3">
                <div className="flex items-center justify-between text-charcoal-400">
                  <span className="flex items-center gap-1.5 text-ivory-100 font-semibold">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    Math Engine
                  </span>
                  <span className="text-amber-300 text-[11px]">Computed</span>
                </div>
                <div className="space-y-1.5 text-charcoal-300">
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">Gross Sum:</span>
                    <span className="text-emerald-400 font-bold">$39,632.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">Mean Order:</span>
                    <span className="text-ivory-200">$1,981.62</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">Std Deviation:</span>
                    <span className="text-ivory-200">$984.12</span>
                  </div>
                  <div className="pt-2 border-t border-subtle">
                    <span className="text-[10px] text-charcoal-400 block">Calculation Evidence Hash:</span>
                    <span className="text-[10px] text-amber-300 truncate block">
                      0x3c9a1b5d7e8f0a2c4e6b8d0f2a4c...
                    </span>
                  </div>
                </div>
              </div>

              {/* Col 3: Gemini Synthesis & Proof */}
              <div className="p-4 rounded-xl bg-charcoal-950/80 border border-subtle space-y-3">
                <div className="flex items-center justify-between text-charcoal-400">
                  <span className="flex items-center gap-1.5 text-ivory-100 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-bnb-yellow" />
                    BNB Chain Anchor
                  </span>
                  <span className="text-bnb-yellow text-[11px]">Finalized</span>
                </div>
                <div className="space-y-1.5 text-charcoal-300">
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">State:</span>
                    <span className="text-emerald-400">TaskState.Approved</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">Agent ID:</span>
                    <span className="text-ivory-200">#10482 (BEP-721)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-400">Gas Used:</span>
                    <span className="text-ivory-200">62,810 (0.00018 BNB)</span>
                  </div>
                  <div className="pt-2 border-t border-subtle">
                    <span className="text-[10px] text-charcoal-400 block">BscScan Tx:</span>
                    <span className="text-[10px] text-bnb-yellow truncate block">
                      0x9d4e5f6a7b8c9d0e1f2a3b4c5d6e...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
