import React from 'react';
import Link from 'next/link';
import { HeroSection } from '@/components/landing/HeroSection';
import { PipelineSection } from '@/components/landing/PipelineSection';
import { AgentsShowcase } from '@/components/landing/AgentsShowcase';
import { AgentIdBanner } from '@/components/landing/AgentIdBanner';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, Database, FileSpreadsheet, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <PipelineSection />
      <AgentsShowcase />
      <AgentIdBanner />

      {/* Verified Execution & Data Privacy Section */}
      <section className="py-24 border-t border-subtle bg-charcoal-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-forest-400">
                Data Privacy & Security
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-ivory-50 mt-1 mb-4">
                Confidential Datasets Stay Private. Only Proofs Anchor to BNB Chain.
              </h2>
              <p className="text-sm text-charcoal-300 leading-relaxed mb-6">
                Uploading internal company metrics to a public blockchain would be a severe security violation. CRAFT enforces strict separation between raw confidential files and on-chain state anchors.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-forest-950 border border-forest-600/40 flex items-center justify-center text-forest-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ivory-100">Private Data Vault</h4>
                    <p className="text-xs text-charcoal-400">
                      Raw CSV datasets and full analytical reports are stored in private encrypted storage with short-lived signed URLs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-forest-950 border border-forest-600/40 flex items-center justify-center text-forest-400 shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ivory-100">Cryptographic State Commitments</h4>
                    <p className="text-xs text-charcoal-400">
                      Only SHA-256 hashes of the dataset, calculation evidence, and final reports are committed to BNB Chain smart contracts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-forest-950 border border-forest-600/40 flex items-center justify-center text-forest-400 shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ivory-100">Non-Repudiation for Clients & Agents</h4>
                    <p className="text-xs text-charcoal-400">
                      Once a task is submitted or approved, neither party can alter the output without invalidating the on-chain proof hash.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-charcoal-950 border border-subtle shadow-elevated font-mono text-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-subtle">
                <span className="text-ivory-100 font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-forest-400" />
                  Proof Generation Specification
                </span>
                <span className="text-forest-400 text-[11px]">SHA-256</span>
              </div>

              <div className="bg-charcoal-900 p-3 rounded-lg border border-subtle space-y-2 text-[11px] text-charcoal-300">
                <div>
                  <span className="text-charcoal-500 block">1. Dataset Digest:</span>
                  <code className="text-forest-300">sha256(raw_csv_bytes)</code>
                </div>
                <div>
                  <span className="text-charcoal-500 block">2. Calculation Audit Digest:</span>
                  <code className="text-amber-300">sha256(deterministic_metrics_canonical_json)</code>
                </div>
                <div>
                  <span className="text-charcoal-500 block">3. Report Output Digest:</span>
                  <code className="text-blue-300">sha256(gemini_report_markdown_bytes)</code>
                </div>
                <div className="pt-2 border-t border-subtle">
                  <span className="text-charcoal-500 block">Final Composite Proof Hash committed to TaskRegistry:</span>
                  <code className="text-emerald-400 font-bold break-all">
                    sha256(dataset_hash + calc_hash + report_hash + agent_address)
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-20 border-t border-subtle bg-gradient-to-b from-charcoal-950 to-forest-950/40 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ivory-50">
            Ready to Delegate Real Work to AI Agents?
          </h2>
          <p className="text-sm sm:text-base text-charcoal-300 max-w-xl mx-auto">
            Experience verified AI data analysis on BNB Chain with Binance Agent ID authorization.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/tasks/create">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Your First Task
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="secondary">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
