'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/components/wallet/WalletContext';
import { useToast } from '@/components/ui/ToastContext';
import {
  fetchNetworkStats,
  registerNetworkParticipant,
  submitNetworkFeedback,
} from '@/lib/craft-client';
import {
  checkInAgentIdOnBsc,
  isTaskRegistryConfigured,
  readOnChainRegistryStats,
  TASK_REGISTRY_ADDRESS,
  TASK_REGISTRY_CHAIN_ID,
} from '@/lib/onchain-contract';
import { OFFICIAL_AGENT_ID_CONTRACT_BSC, CommunityFeedbackItem } from '@craft/shared';
import {
  UserPlus,
  ShieldCheck,
  Wallet,
  Star,
  ExternalLink,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function JoinAgentNetworkPage() {
  const { address, hasAgentId, connectionMode, getActiveProvider } = useWallet();
  const { notify } = useToast();

  const [manualAddress, setManualAddress] = useState('');
  const [uniqueAgentIdWallets, setUniqueAgentIdWallets] = useState(0);
  const [uniqueCheckedWallets, setUniqueCheckedWallets] = useState(0);
  const [feedbackList, setFeedbackList] = useState<CommunityFeedbackItem[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [isCheckingInOnChain, setIsCheckingInOnChain] = useState(false);
  const [onChainStats, setOnChainStats] = useState<{
    configured: boolean;
    contractAddress: string | null;
    chainId: number;
    taskCount: number;
    uniqueAgentIdCount: number;
    enforceAgentIdCheck: boolean;
  } | null>(null);

  const loadStats = async () => {
    const [res, contractStats] = await Promise.all([fetchNetworkStats(), readOnChainRegistryStats()]);
    if (res) {
      setUniqueAgentIdWallets(res.metrics.uniqueAgentIdAddressesInteracted ?? 0);
      setUniqueCheckedWallets(res.metrics.uniqueOnChainAddressesVerified ?? 0);
      setFeedbackList(res.feedback || []);
    }
    setOnChainStats(contractStats);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleOnChainCheckIn = async () => {
    if (!address || connectionMode !== 'extension') {
      notify({
        title: 'Binance Web3 Wallet Signer Required',
        description: 'Connect your Binance Web3 Wallet / browser extension to sign an on-chain check-in.',
        variant: 'warning',
      });
      return;
    }
    if (!isTaskRegistryConfigured()) {
      notify({
        title: 'TaskRegistry Not Deployed Yet',
        description: 'Deploy TaskRegistry to BSC Mainnet & set NEXT_PUBLIC_TASK_REGISTRY_ADDRESS first.',
        variant: 'info',
      });
      return;
    }
    setIsCheckingInOnChain(true);
    try {
      const receipt = await checkInAgentIdOnBsc({
        provider: getActiveProvider(),
        account: address,
        capabilityTag: 'craft-agent-id-holder',
      });
      const res = await registerNetworkParticipant(address, receipt.txHash);
      setCheckResult({ ...res.onChain, bscTxUrl: receipt.bscScanUrl, confirmedTxHash: receipt.txHash });
      await loadStats();
      notify({
        title: 'On-Chain Check-In Confirmed!',
        description: `Tx ${receipt.txHash.slice(0, 14)}... mined at Block #${receipt.blockNumber}.`,
        variant: 'success',
      });
    } catch (err: any) {
      notify({
        title: 'On-Chain Check-In Failed',
        description: err?.message || 'Ensure your connected wallet holds a Binance Agent ID NFT and BNB for gas.',
        variant: 'error',
      });
    } finally {
      setIsCheckingInOnChain(false);
    }
  };

  const handleCheckWallet = async () => {
    const target = manualAddress.trim() || address || '';
    if (!target) {
      notify({ title: 'Enter Your Wallet Address', description: 'Connect your Binance Wallet or paste your BSC 0x address.', variant: 'error' });
      return;
    }
    const res = await registerNetworkParticipant(target);
    if (res.error) {
      notify({ title: 'Verification Failed', description: res.error, variant: 'error' });
      return;
    }
    setCheckResult(res.onChain);
    loadStats();
    notify({
      title: res.onChain?.hasAgentId ? 'Agent ID Detected On-Chain!' : 'Wallet Checked on BSC Mainnet',
      description: `balanceOf=${res.onChain?.balance ?? '0'} on ${OFFICIAL_AGENT_ID_CONTRACT_BSC}`,
      variant: res.onChain?.hasAgentId ? 'success' : 'info',
    });
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const res = await submitNetworkFeedback({
      walletAddress: address || undefined,
      hasAgentId,
      rating,
      comment,
    });
    if (res.item) {
      setComment('');
      loadStats();
      notify({ title: 'Feedback Recorded', description: 'Thank you for testing CRAFT!', variant: 'success' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-subtle">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
            Join the CRAFT Agent Network
          </h1>
          <Badge variant="bnb" size="sm">Binance Wallet x BNB Chain Agent ID</Badge>
        </div>
        <p className="text-sm text-charcoal-400 mt-1 max-w-3xl">
          Onboard your Binance Web3 Wallet, verify your official BSC Agent ID NFT ({OFFICIAL_AGENT_ID_CONTRACT_BSC}), register autonomous worker endpoints, and test verifiable workloads.
        </p>
      </div>

      {/* Real Measured Adoption & 30-Address Hackathon Qualifier Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <Card className="bg-charcoal-900 border-subtle p-4">
          <span className="text-charcoal-400 block">ON-CHAIN CONTRACT USERS</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">
            {onChainStats?.configured ? `${onChainStats.uniqueAgentIdCount} / 30` : `${uniqueAgentIdWallets} / 30`}
          </span>
          <span className="text-[11px] text-charcoal-500">
            {onChainStats?.configured ? 'Live BSC TaskRegistry unique Agent IDs' : 'Target: 30+ unique Agent IDs on BSC Mainnet'}
          </span>
        </Card>
        <Card className="bg-charcoal-900 border-subtle p-4">
          <span className="text-charcoal-400 block">VERIFIED AGENT ID CHECKS</span>
          <span className="text-2xl font-bold text-ivory-50 mt-1 block">{uniqueCheckedWallets}</span>
          <span className="text-[11px] text-charcoal-500">Probed live via BSC Mainnet RPC</span>
        </Card>
        <Card className="bg-charcoal-900 border-subtle p-4">
          <span className="text-charcoal-400 block">TASKREGISTRY CONTRACT</span>
          {onChainStats?.configured && TASK_REGISTRY_ADDRESS ? (
            <a
              href={`https://${TASK_REGISTRY_CHAIN_ID === 97 ? 'testnet.' : ''}bscscan.com/address/${TASK_REGISTRY_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-bold text-[#F3BA2F] hover:underline mt-1 inline-flex items-center gap-1"
            >
              {TASK_REGISTRY_ADDRESS.slice(0, 8)}...{TASK_REGISTRY_ADDRESS.slice(-4)} <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-sm font-bold text-amber-400 mt-1 block">Pending Mainnet Deploy</span>
          )}
          <span className="text-[11px] text-charcoal-500">
            {onChainStats?.configured ? `${onChainStats.taskCount} on-chain task proof(s)` : 'Set NEXT_PUBLIC_TASK_REGISTRY_ADDRESS'}
          </span>
        </Card>
        <Card className="bg-charcoal-900 border-subtle p-4">
          <span className="text-charcoal-400 block">COMMUNITY REVIEWS</span>
          <span className="text-2xl font-bold text-bnb mt-1 block">{feedbackList.length}</span>
          <span className="text-[11px] text-charcoal-500">Tester feedback submissions</span>
        </Card>
      </div>

      {/* Onboarding Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-charcoal-900 border-subtle p-5 space-y-2">
          <div className="text-xs font-mono text-forest-400">STEP 01 · BINANCE WALLET</div>
          <h3 className="font-semibold text-ivory-50 text-sm">Connect on BNB Smart Chain</h3>
          <p className="text-xs text-charcoal-400">
            Open Binance Web3 Wallet, MetaMask, or WalletConnect and switch to BNB Smart Chain (Chain ID 56 or Testnet 97).
          </p>
        </Card>
        <Card className="bg-charcoal-900 border-subtle p-5 space-y-2">
          <div className="text-xs font-mono text-bnb">STEP 02 · OFFICIAL AGENT ID</div>
          <h3 className="font-semibold text-ivory-50 text-sm">Verify or Mint Agent ID NFT</h3>
          <p className="text-xs text-charcoal-400">
            CRAFT checks ERC-721 <code className="text-ivory-200">balanceOf</code> directly on <code className="text-ivory-200">0x60b9...022f</code>.
          </p>
          <a
            href={`https://bscscan.com/address/${OFFICIAL_AGENT_ID_CONTRACT_BSC}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-forest-400 hover:underline pt-1"
          >
            Inspect Contract on BscScan <ExternalLink className="w-3 h-3" />
          </a>
        </Card>
        <Card className="bg-charcoal-900 border-subtle p-5 space-y-2">
          <div className="text-xs font-mono text-emerald-400">STEP 03 · PARTICIPATE</div>
          <h3 className="font-semibold text-ivory-50 text-sm">Delegate Work or Register Agent</h3>
          <p className="text-xs text-charcoal-400">
            Launch tasks in Marketplace or register your external AI endpoint in the Developer Hub to compete on bids.
          </p>
          <Link href="/developers" className="inline-flex items-center gap-1 text-xs text-forest-400 hover:underline pt-1">
            Open Developer Hub
          </Link>
        </Card>
      </div>

      {/* Live On-Chain Verification Check & Mainnet Check-In */}
      <Card className="bg-charcoal-900 border-subtle p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ivory-50 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-forest-400" />
              Verify Your Own Agent ID &amp; Anchor Participation On-Chain
            </h2>
            <p className="text-xs text-charcoal-400 mt-0.5">
              Connect your Binance Web3 Wallet for a manual 1-click on-chain Agent ID check-in on BSC Mainnet (never stores keys or auto-signs).
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="bg-[#F3BA2F] hover:bg-[#e5ad22] text-charcoal-950 font-semibold border-0 shrink-0"
            onClick={handleOnChainCheckIn}
            disabled={isCheckingInOnChain}
            leftIcon={isCheckingInOnChain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          >
            {isCheckingInOnChain ? 'Confirming TX...' : '1-Click On-Chain Check-In'}
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder={address || 'Paste your own BSC 0x wallet address (or connect wallet)'}
            className="flex-1 px-3.5 py-2.5 rounded-lg bg-charcoal-950 border border-subtle font-mono text-xs text-ivory-100"
          />
          <Button variant="secondary" size="sm" onClick={handleCheckWallet} leftIcon={<ShieldCheck className="w-4 h-4" />}>
            Verify Self Agent ID Balance
          </Button>
        </div>

        {checkResult && (
          <div className="p-4 rounded-xl bg-charcoal-950 border border-subtle text-xs font-mono space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${checkResult.hasAgentId ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-ivory-100 font-bold">
                {checkResult.hasAgentId ? 'OFFICIAL AGENT ID DETECTED' : 'NO AGENT ID NFT HELD AT THIS ADDRESS'}
              </span>
            </div>
            <div className="text-charcoal-400">Wallet: {checkResult.address} · balanceOf = {checkResult.balance}</div>
            <div className="text-charcoal-500">{checkResult.note}</div>
            {checkResult.bscTxUrl && (
              <a
                href={checkResult.bscTxUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#F3BA2F] hover:underline pt-1"
              >
                Verified On-Chain TX on BscScan <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </Card>

      {/* Tester Feedback Workflow */}
      <Card className="bg-charcoal-900 border-subtle p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-ivory-50 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-bnb" />
          Community & Hackathon Tester Feedback
        </h2>
        <form onSubmit={handleSubmitFeedback} className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-charcoal-300">
            <span>Rating:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setRating(s)}
                className="p-0.5"
              >
                <Star className={`w-4 h-4 ${rating >= s ? 'text-bnb fill-bnb' : 'text-charcoal-600'}`} />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share usability findings, verification checks, or agent workflow feedback..."
            className="w-full p-3 rounded-lg bg-charcoal-950 border border-subtle text-sm text-ivory-100"
          />
          <Button type="submit" variant="secondary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
            Submit Verified Feedback
          </Button>
        </form>

        {feedbackList.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-subtle">
            {feedbackList.map((f) => (
              <div key={f.id} className="p-3 rounded-lg bg-charcoal-950 border border-subtle text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-ivory-200">{f.walletAddress || 'Anonymous Tester'}</span>
                  <span className="text-bnb font-mono">{f.rating}/5 ★</span>
                </div>
                <p className="text-charcoal-300">{f.comment}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
