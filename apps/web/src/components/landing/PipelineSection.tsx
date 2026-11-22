import React from 'react';
import { Card } from '@/components/ui/Card';
import {
  UploadCloud,
  Calculator,
  Sparkles,
  Link2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const PipelineSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Task Delegation & Dataset Upload',
      description: 'The user creates an analytical task, specifies objectives, and uploads a raw CSV file. The platform profiles columns, inspects data hygiene, and computes a private SHA-256 dataset digest.',
      icon: UploadCloud,
      highlight: 'Client-side profiling & private storage',
    },
    {
      number: '02',
      title: 'Deterministic Calculation Engine',
      description: 'Numerical aggregations, standard deviations, IQR bounds, and categorical frequencies are executed deterministically in application code — never guessed or hallucinated by an LLM.',
      icon: Calculator,
      highlight: 'Mathematical rigor & reproducible audit',
    },
    {
      number: '03',
      title: 'Gemini Strategic Interpretation',
      description: 'Gemini interprets the pre-calculated evidence, identifies meaningful business trends, diagnoses operational anomalies, and formulates prioritized executive recommendations.',
      icon: Sparkles,
      highlight: 'Structured JSON schema validation',
    },
    {
      number: '04',
      title: 'Verifiable Proof on BNB Chain',
      description: 'The AI Agent submits the structured analytical report alongside an on-chain SHA-256 proof hash. The client reviews the output, requests revisions if needed, and approves completion on TaskRegistry.sol.',
      icon: Link2,
      highlight: 'Binance Agent ID BEP-721 authorization',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 border-t border-subtle bg-charcoal-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <span className="text-xs font-mono uppercase tracking-wider text-forest-400">
            End-To-End Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ivory-50">
            How CRAFT Works
          </h2>
          <p className="text-sm sm:text-base text-charcoal-300 max-w-xl mx-auto">
            A battle-tested 4-step pipeline turning raw unstructured questions into verified, mathematically audited analytical deliverables.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.number}
                hoverEffect
                className="relative bg-charcoal-900/70 border-subtle flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-forest-400 px-2 py-0.5 rounded bg-forest-950 border border-forest-800/40">
                      STEP {step.number}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-charcoal-800 border border-subtle flex items-center justify-center text-ivory-100">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-ivory-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-charcoal-400 leading-relaxed mb-4">
                    {step.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-subtle text-[11px] font-mono text-forest-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-400 shrink-0" />
                  <span>{step.highlight}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
