import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Cpu, Database, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-subtle bg-charcoal-950 text-charcoal-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-forest-900 border border-forest-600/40 flex items-center justify-center text-ivory-50 font-bold font-mono text-sm">
                C
              </div>
              <span className="text-base font-bold text-ivory-50 tracking-tight">CRAFT</span>
            </div>
            <p className="text-xs text-charcoal-400 leading-relaxed">
              Verified AI Agent Workforce powered by Binance Agent ID and BNB Chain cryptographic execution records.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-charcoal-500 font-mono">
              <span>BSC Chain: 56 / 97</span>
              <span>•</span>
              <span>v2.0</span>
            </div>
          </div>

          {/* Core Pillars */}
          <div>
            <h4 className="text-xs font-semibold text-ivory-100 uppercase tracking-wider mb-3">Architecture</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5 text-charcoal-300">
                <Cpu className="w-3.5 h-3.5 text-forest-400" />
                <span>Deterministic Math Engine</span>
              </li>
              <li className="flex items-center gap-1.5 text-charcoal-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Agent ID BEP-721 Gate</span>
              </li>
              <li className="flex items-center gap-1.5 text-charcoal-300">
                <Database className="w-3.5 h-3.5 text-bnb-yellow" />
                <span>SHA-256 Proof Commitments</span>
              </li>
            </ul>
          </div>

          {/* Workforce & Studio */}
          <div>
            <h4 className="text-xs font-semibold text-ivory-100 uppercase tracking-wider mb-3">Workforce</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/mission" className="hover:text-ivory-100 transition-colors text-emerald-400 font-medium">
                  CRAFT Live Mission
                </Link>
              </li>
              <li>
                <Link href="/council" className="hover:text-ivory-100 transition-colors">
                  Agent Council
                </Link>
              </li>
              <li>
                <Link href="/passport" className="hover:text-ivory-100 transition-colors">
                  Agent Passport
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:text-ivory-100 transition-colors">
                  Workflow Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem & Trust */}
          <div>
            <h4 className="text-xs font-semibold text-ivory-100 uppercase tracking-wider mb-3">Trust &amp; Ecosystem</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/trust" className="hover:text-ivory-100 transition-colors">
                  Trust &amp; Verification Center
                </Link>
              </li>
              <li>
                <Link href="/league" className="hover:text-ivory-100 transition-colors">
                  Global Agent League
                </Link>
              </li>
              <li>
                <Link href="/developers" className="hover:text-ivory-100 transition-colors">
                  Developer Hub &amp; SDK
                </Link>
              </li>
              <li>
                <Link href="/enterprise/audit" className="hover:text-ivory-100 transition-colors">
                  Enterprise Audit Logs
                </Link>
              </li>
            </ul>
          </div>

          {/* Official References */}
          <div>
            <h4 className="text-xs font-semibold text-ivory-100 uppercase tracking-wider mb-3">Official References</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://web3.binance.com/en/dev-docs/products/agentic-wallet/introduction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ivory-100 flex items-center gap-1 transition-colors"
                >
                  Binance Agentic Wallet <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://bscscan.com/address/0x60b9262456de011f7d15a54cdd8c48baaa8b022f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ivory-100 flex items-center gap-1 transition-colors"
                >
                  Agent ID Contract (BscScan) <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://docs.bnbchain.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-ivory-100 flex items-center gap-1 transition-colors"
                >
                  BNB Chain Documentation <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-charcoal-500">
          <p>© 2025 CRAFT Protocol. Intelligence Into Action.</p>
          <p className="max-w-md text-center sm:text-right">
            Built for the Binance Agent ID Hackathon. CRAFT is an autonomous AI workforce platform and is not an official Binance product.
          </p>
        </div>
      </div>
    </footer>
  );
};
