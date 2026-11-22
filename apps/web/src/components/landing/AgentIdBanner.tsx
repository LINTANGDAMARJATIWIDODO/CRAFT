import React from 'react';
import { OFFICIAL_AGENT_ID_CONTRACT } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Lock, ExternalLink, Key, CheckCircle } from 'lucide-react';

export const AgentIdBanner: React.FC = () => {
  return (
    <section className="py-20 border-t border-subtle bg-charcoal-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-forest-600/30 bg-gradient-to-b from-forest-950/60 to-charcoal-900 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-forest-600/10 blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900/80 border border-forest-500/40 text-forest-300 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-400" />
                <span>Binance Agent ID Integration</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-ivory-50 tracking-tight">
                Cryptographic Identity for AI Agents and Delegators
              </h2>

              <p className="text-sm text-charcoal-300 leading-relaxed max-w-xl">
                CRAFT integrates official Binance Agent ID BEP-721 token standards. Every protected contract interaction requires genuine on-chain ownership verification—not aesthetic frontend checkboxes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono text-charcoal-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>BEP-721 balanceOf &gt; 0 Gate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Signed Nonce Anti-Replay</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Assigned Agent State Machine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>On-Chain TaskRegistry Contract</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <a
                  href="https://web3.binance.com/en/dev-docs/products/agentic-wallet/introduction"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="primary" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Binance Agentic Wallet Docs
                  </Button>
                </a>
                <a
                  href={`https://bscscan.com/address/${OFFICIAL_AGENT_ID_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Inspect Contract on BscScan
                  </Button>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-5 rounded-2xl bg-charcoal-950/90 border border-subtle shadow-elevated font-mono text-xs space-y-3">
                <div className="flex items-center justify-between text-charcoal-400 pb-2 border-b border-subtle">
                  <span className="flex items-center gap-1.5 text-ivory-100 font-semibold">
                    <Key className="w-3.5 h-3.5 text-forest-400" />
                    Agent ID Verification Schema
                  </span>
                  <span className="text-emerald-400 text-[10px]">LIVE ON BSC</span>
                </div>

                <div className="space-y-1.5 text-charcoal-300 text-[11px]">
                  <p className="text-charcoal-400"># Target Contract:</p>
                  <p className="text-ivory-200 bg-charcoal-900 p-2 rounded border border-subtle break-all">
                    {OFFICIAL_AGENT_ID_CONTRACT}
                  </p>
                  <p className="text-charcoal-400 pt-1"># Solidity Interface Validation:</p>
                  <div className="bg-charcoal-900 p-2.5 rounded border border-subtle text-forest-300 space-y-1">
                    <code>require(agentIdToken.balanceOf(msg.sender) &gt; 0, &quot;AgentIDRequired&quot;);</code>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-charcoal-400 flex items-center justify-between">
                  <span>Standard: BEP-721 NFT</span>
                  <span>Network: BNB Smart Chain</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
