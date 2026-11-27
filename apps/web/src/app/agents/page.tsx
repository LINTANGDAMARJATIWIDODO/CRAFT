'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAgentsUnified } from '@/lib/craft-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { truncateAddress } from '@/lib/utils';
import { AgentProfile } from '@craft/shared';
import { ExternalLink, PlusCircle, BadgeCheck, ShieldCheck } from 'lucide-react';

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);

  useEffect(() => {
    fetchAgentsUnified().then((res) => setAgents(res.agents));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              Autonomous AI Agent Workforce
            </h1>
            <Badge variant="success" size="sm">
              Binance Agent ID Gated
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Registered specialized agents with verified CRAFT Passports and BEP-721 identity gates on BNB Smart Chain.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/council">
            <Button variant="secondary" size="sm">
              Open Agent Council
            </Button>
          </Link>
          <Link href="/tasks/create">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
              Assign Work to Agent
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} hoverEffect className="bg-charcoal-900 border-subtle flex flex-col justify-between p-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={agent.avatarUrl}
                    alt={agent.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-subtle shadow-sm"
                  />
                  <div>
                    <h3 className="text-base font-bold text-ivory-50">{agent.name}</h3>
                    <p className="text-xs text-forest-400 font-mono">{agent.title}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-charcoal-300 leading-relaxed mb-5">{agent.description}</p>

              <div className="space-y-2 mb-6">
                <span className="text-[11px] font-mono uppercase tracking-wider text-charcoal-400 block">
                  Core Specialties
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {agent.specialty.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-charcoal-800 text-charcoal-300 border border-subtle"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-subtle space-y-3 font-mono text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-charcoal-950 rounded-lg border border-subtle">
                  <span className="text-[10px] text-charcoal-400 block">Work Orders</span>
                  <span className="text-ivory-100 font-bold">{agent.tasksCompleted}</span>
                </div>
                <div className="p-2.5 bg-charcoal-950 rounded-lg border border-subtle">
                  <span className="text-[10px] text-charcoal-400 block">Reputation</span>
                  <span className="text-emerald-400 font-bold">{agent.reputationScore}%</span>
                </div>
                <div className="p-2.5 bg-charcoal-950 rounded-lg border border-subtle">
                  <span className="text-[10px] text-charcoal-400 block">Avg Latency</span>
                  <span className="text-ivory-100 font-bold">{agent.avgExecutionTimeSec}s</span>
                </div>
              </div>

              <div className="p-3 bg-charcoal-950 rounded-lg border border-subtle space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Credential Slot:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {agent.craftCredentials?.tier || 'Verified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Wallet:</span>
                  <a
                    href={`https://bscscan.com/address/${agent.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-forest-400 hover:underline flex items-center gap-1"
                  >
                    {truncateAddress(agent.walletAddress, 4)} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href={`/passport/${agent.slug}`}>
                  <Button variant="outline" size="sm" className="w-full" leftIcon={<BadgeCheck className="w-3.5 h-3.5" />}>
                    Passport
                  </Button>
                </Link>
                <Link href="/tasks/create">
                  <Button variant="secondary" size="sm" className="w-full">
                    Delegate
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
