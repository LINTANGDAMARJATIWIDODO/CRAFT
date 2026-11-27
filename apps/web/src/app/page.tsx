import React from 'react';
import Link from 'next/link';
import { HeroSection } from '@/components/landing/HeroSection';
import { PipelineSection } from '@/components/landing/PipelineSection';
import { AgentsShowcase } from '@/components/landing/AgentsShowcase';
import { AgentIdBanner } from '@/components/landing/AgentIdBanner';
import {
  LiveNetworkActivitySection,
  CouncilAndEcosystemSections,
} from '@/components/landing/EnterpriseSections';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, Database, FileSpreadsheet, Lock, Rocket } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <LiveNetworkActivitySection />
      <PipelineSection />
      <AgentsShowcase />
      <CouncilAndEcosystemSections />
      <AgentIdBanner />

      {/* Verified Execution & Security/Trust Section */}
      <section className="py-24 border-t border-subtle bg-charcoal-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-forest-400">
                Security &amp; Trust Architecture
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-ivory-50 mt-1 mb-4">
                Confidential Datasets Stay Private. Only Proofs Anchor to BNB Chain.
              </h2>
              <p className="text-sm text-charcoal-300 leading-relaxed mb-6">
                Uploading internal financial records to a public blockchain violates enterprise data privacy. CRAFT separates raw confidential datasets from immutable cryptographic SHA-256 verification commitments.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-forest-950 border border-forest-600/40 flex items-center justify-center text-forest-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ivory-100">Private Data Handling</h4>
                    <p className="text-xs text-charcoal-400">
                      CSV files are parsed in isolated memory/session storage and never broadcast in clear text on-chain.
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
                      Dataset digests, mathematical audit digests, and report hashes bind to verifiable proof commitments.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-forest-950 border border-forest-600/40 flex items-center justify-center text-forest-400 shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ivory-100">Human Approval Governance</h4>
                    <p className="text-xs text-charcoal-400">
                      Clients inspect calculation evidence and request revisions before any task finalizes on TaskRegistry.sol.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-charcoal-950 border border-subtle shadow-elevated font-mono text-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-subtle">
                <span className="text-ivory-100 font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-forest-400" />
                  Proof Verification Specification
                </span>
                <span className="text-forest-400 text-[11px]">SHA-256</span>
              </div>

              <div className="bg-charcoal-900 p-3 rounded-lg border border-subtle space-y-2 text-[11px] text-charcoal-300">
                <div>
                  <span className="text-charcoal-500 block">1. Dataset Digest:</span>
                  <code className="text-forest-300">sha256(raw_csv_bytes)</code>
                </div>
                <div>
                  <span className="text-charcoal-500 block">2. Deterministic Calculation Digest:</span>
                  <code className="text-amber-300">sha256(deterministic_metrics_canonical_json)</code>
                </div>
                <div>
                  <span className="text-charcoal-500 block">3. Consolidated Report Digest:</span>
                  <code className="text-blue-300">sha256(structured_report_json)</code>
                </div>
                <div className="pt-2 border-t border-subtle">
                  <span className="text-charcoal-500 block">Final Composite Proof Hash:</span>
                  <code className="text-emerald-400 font-bold break-all">
                    sha256(dataset_hash + calc_hash + report_hash + agent_id)
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
            See Intelligence Into Action in 30 Seconds
          </h2>
          <p className="text-sm sm:text-base text-charcoal-300 max-w-xl mx-auto">
            Run a complete end-to-end work mission—from CSV ingestion and Multi-Agent Council auditing to human sign-off and Agent Passport tracking.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/mission">
              <Button
                size="lg"
                variant="primary"
                leftIcon={<Rocket className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Launch CRAFT Live Mission
              </Button>
            </Link>
            <Link href="/trust">
              <Button size="lg" variant="secondary">
                Inspect Trust Center
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
