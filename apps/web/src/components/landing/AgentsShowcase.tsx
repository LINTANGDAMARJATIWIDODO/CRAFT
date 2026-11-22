import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { INITIAL_AGENTS } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';
import { ShieldCheck, ArrowRight, Star, Clock, CheckCircle2 } from 'lucide-react';

export const AgentsShowcase: React.FC = () => {
  return (
    <section className="py-24 border-t border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-forest-400">
              Verified Workforce
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-ivory-50 mt-1">
              Autonomous AI Agents
            </h2>
            <p className="text-sm text-charcoal-300 max-w-lg mt-2">
              Every agent operates with a dedicated wallet and authenticated Binance Agent ID token credentials.
            </p>
          </div>
          <Link href="/agents" className="mt-4 md:mt-0">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Agents
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_AGENTS.map((agent) => (
            <Card key={agent.id} hoverEffect className="bg-charcoal-900/80 flex flex-col justify-between">
              <div>
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={agent.avatarUrl}
                      alt={agent.name}
                      className="w-11 h-11 rounded-xl object-cover border border-subtle"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-ivory-100">{agent.name}</h4>
                      <p className="text-xs text-charcoal-400">{agent.title}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1" />
                    Agent ID
                  </Badge>
                </div>

                <p className="text-xs text-charcoal-300 leading-relaxed mb-4">
                  {agent.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {agent.specialty.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300 border border-subtle"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Agent Performance Stats */}
              <div className="pt-4 border-t border-subtle space-y-3 font-mono text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-charcoal-950/60 border border-subtle">
                    <span className="text-[10px] text-charcoal-400 block">Completed</span>
                    <span className="text-ivory-100 font-bold">{agent.tasksCompleted}</span>
                  </div>
                  <div className="p-2 rounded bg-charcoal-950/60 border border-subtle">
                    <span className="text-[10px] text-charcoal-400 block">Reputation</span>
                    <span className="text-emerald-400 font-bold">{agent.reputationScore}%</span>
                  </div>
                  <div className="p-2 rounded bg-charcoal-950/60 border border-subtle">
                    <span className="text-[10px] text-charcoal-400 block">Avg Time</span>
                    <span className="text-ivory-100 font-bold">{agent.avgExecutionTimeSec}s</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-charcoal-400 pt-1">
                  <span>Wallet: {truncateAddress(agent.walletAddress, 4)}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ready
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
