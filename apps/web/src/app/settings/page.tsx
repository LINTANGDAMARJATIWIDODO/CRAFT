'use client';

import React from 'react';
import { useWallet } from '@/components/wallet/WalletContext';
import { OFFICIAL_AGENT_ID_CONTRACT, SUPPORTED_NETWORKS } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { truncateAddress } from '@/lib/utils';
import {
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Cpu,
  RefreshCw,
  ExternalLink,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    isConnected,
    address,
    chainId,
    isCorrectNetwork,
    hasAgentId,
    agentIdTokenId,
    agentIdBalance,
    isAuthenticated,
    isVerifyingAgentId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    verifyAgentIdOnChain,
    isDemoAgentIdOverride,
    toggleDemoAgentId,
  } = useWallet();

  const currentNet = SUPPORTED_NETWORKS.find((n) => n.id === chainId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-subtle">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
          Network &amp; Identity Configuration
        </h1>
        <p className="text-sm text-charcoal-400 mt-1">
          Diagnostics for Web3 connectivity, Binance Agent ID gate authentication, and smart contract RPCs.
        </p>
      </div>

      {/* Identity Card */}
      <Card className="bg-charcoal-900 border-subtle space-y-4">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base text-ivory-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-forest-400" />
            Binance Agent ID Token Gate
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => verifyAgentIdOnChain()}
            isLoading={isVerifyingAgentId}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isVerifyingAgentId ? 'animate-spin' : ''}`} />}
          >
            Re-query Contract
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-0 font-mono text-xs">
          <div className="p-4 rounded-xl bg-charcoal-950 border border-subtle space-y-2">
            <div className="flex justify-between text-charcoal-400">
              <span>Official Contract:</span>
              <a
                href={`https://bscscan.com/address/${OFFICIAL_AGENT_ID_CONTRACT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest-400 hover:underline flex items-center gap-1"
              >
                {OFFICIAL_AGENT_ID_CONTRACT} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between text-charcoal-400">
              <span>Standard:</span>
              <span className="text-ivory-100">BEP-721 (Non-Transferable NFT)</span>
            </div>
            <div className="flex justify-between text-charcoal-400">
              <span>Ownership Status:</span>
              {hasAgentId ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  VERIFIED ({agentIdTokenId || 'Active'})
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  NOT DETECTED (0 Tokens)
                </span>
              )}
            </div>
          </div>

          {/* Judge Demo Override Toggle */}
          <div className="p-4 rounded-xl bg-charcoal-950 border border-subtle flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-ivory-100 block">
                Hackathon Judge / Reviewer Demo Pass
              </span>
              <span className="text-xs text-charcoal-400">
                Simulate an authorized Binance Agent ID for reviewing the full workflow without an on-chain token.
              </span>
            </div>
            <button
              onClick={toggleDemoAgentId}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isDemoAgentIdOverride ? 'bg-forest-500' : 'bg-charcoal-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                  isDemoAgentIdOverride ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Network Switcher */}
      <Card className="bg-charcoal-900 border-subtle space-y-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-ivory-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-bnb-yellow" />
            Network Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SUPPORTED_NETWORKS.map((net) => {
              const isSelected = chainId === net.id;
              return (
                <div
                  key={net.id}
                  onClick={() => switchNetwork(net.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer font-mono text-xs transition-all ${
                    isSelected
                      ? 'bg-forest-950/40 border-forest-500/60 ring-1 ring-forest-500/40'
                      : 'bg-charcoal-950 border-subtle hover:border-refined'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-ivory-100">{net.name}</span>
                    {isSelected && <Badge variant="bnb" size="sm">Active</Badge>}
                  </div>
                  <span className="text-charcoal-400 text-[11px] block">Chain ID: {net.id}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
