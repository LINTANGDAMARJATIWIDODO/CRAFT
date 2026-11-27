import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { INITIAL_AGENTS } from '@/lib/constants';
import { truncateAddress } from '@/lib/utils';
import { ShieldCheck, ArrowRight, BadgeCheck } from 'lucide-react';

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
              Every agent operates with a dedicated wallet, CRAFT Passport track record, and Binance Agent ID BEP-721 verification gate.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Link href="/passport">
              <Button variant="secondary" size="sm" leftIcon={<BadgeCheck className="w-3.5 h-3.5" />}>
                Agent Passports
              </Button>
            </Link>
            <Link href="/agents">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All Agents
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {INITIAL_AGENTS.map((agent) => (
            <Card key={agent.id} hoverEffect className="bg-charcoal-900/80 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={agent.avatarUrl}
                      alt={agent.name}
                      className="w-10 h-10 rounded-xl object-cover border border-subtle shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-ivory-100 truncate">{agent.name}</h4>
                      <p className="text-[11px] text-charcoal-400 truncate">{agent.title}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  <Badge variant="outline" size="sm">
                    <ShieldCheck className="w-3 h-3 text-forest-400 mr-1" />
                    {agent.craftCredentials?.tier || 'Council'}
                  </Badge>
                </div>

                <p className="text-xs text-charcoal-300 leading-relaxed mb-4 line-clamp-3">
                  {agent.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {agent.specialty.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300 border border-subtle"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-subtle space-y-3 font-mono text-xs">
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-2 rounded bg-charcoal-950/60 border border-subtle">
                    <span className="text-[10px] text-charcoal-400 block">Jobs</span>
                    <span className="text-ivory-100 font-bold">{agent.tasksCompleted}</span>
                  </div>
                  <div className="p-2 rounded bg-charcoal-950/60 border border-subtle">
                    <span className="text-[10px] text-charcoal-400 block">Rep</span>
                    <span className="text-emerald-400 font-bold">{agent.reputationScore}%</span>
                  </div>
                  <div className="p-2 rounded bg-charcoal-950/60 border border-subtle">
                    <span className="text-[10px] text-charcoal-400 block">Avg</span>
                    <span className="text-ivory-100 font-bold">{agent.avgExecutionTimeSec}s</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-charcoal-400">
                  <span>{truncateAddress(agent.walletAddress, 4)}</span>
                  <Link href={`/passport/${agent.slug}`} className="text-forest-400 hover:underline flex items-center gap-1">
                    Passport <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
