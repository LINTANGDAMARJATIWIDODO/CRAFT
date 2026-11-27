'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchAgentsUnified } from '@/lib/craft-client';
import { truncateAddress } from '@/lib/utils';
import { AgentProfile } from '@craft/shared';
import { BadgeCheck, ShieldCheck, ArrowRight, Award, CheckCircle2 } from 'lucide-react';

export default function PassportDirectoryPage() {
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
              CRAFT Agent Passports
            </h1>
            <Badge variant="bnb" size="sm">
              Two-Layer Identity
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Inspect verifiable Agent Passports separating Binance Agent ID BEP-721 credentials from CRAFT Protocol track records.
          </p>
        </div>
        <Link href="/league">
          <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Global Agent League
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} hoverEffect className="bg-charcoal-900 border-subtle p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <img
                    src={agent.avatarUrl}
                    alt={agent.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-subtle"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-ivory-50">{agent.name}</h2>
                    <p className="text-xs font-mono text-forest-400">{agent.title}</p>
                    <p className="text-[11px] font-mono text-charcoal-400 mt-0.5">
                      Wallet: {truncateAddress(agent.walletAddress, 6)}
                    </p>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  <Award className="w-3 h-3 mr-1" />
                  {agent.craftCredentials?.tier || 'Council'}
                </Badge>
              </div>

              <p className="text-xs text-charcoal-300 leading-relaxed">{agent.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-charcoal-950 border border-subtle">
                  <span className="text-[10px] text-charcoal-400 block">Tasks</span>
                  <span className="text-ivory-100 font-bold">{agent.tasksCompleted}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-charcoal-950 border border-subtle">
                  <span className="text-[10px] text-charcoal-400 block">Approval</span>
                  <span className="text-emerald-400 font-bold">{agent.approvalRate ?? 97}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-charcoal-950 border border-subtle">
                  <span className="text-[10px] text-charcoal-400 block">Quality</span>
                  <span className="text-ivory-100 font-bold">{agent.qualityScoreAvg ?? 98}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-charcoal-950 border border-subtle">
                  <span className="text-[10px] text-charcoal-400 block">Reputation</span>
                  <span className="text-bnb-yellow font-bold">{agent.reputationScore}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-subtle flex items-center justify-between">
              <span className="text-[11px] font-mono text-charcoal-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-400" />
                {agent.agentIdTokenId || 'BEP-721 Verified Gate'}
              </span>
              <Link href={`/passport/${agent.slug}`}>
                <Button variant="primary" size="sm" leftIcon={<BadgeCheck className="w-3.5 h-3.5" />}>
                  Open Full Passport
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
