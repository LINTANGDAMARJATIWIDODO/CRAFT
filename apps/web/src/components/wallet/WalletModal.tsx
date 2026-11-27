'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from './WalletContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { truncateAddress } from '@/lib/utils';
import { OFFICIAL_AGENT_ID_CONTRACT, SUPPORTED_NETWORKS } from '@/lib/constants';
import {
  ShieldCheck,
  ShieldAlert,
  Wallet,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  LogOut,
  Key,
  X,
  Cpu,
  Link2,
  Info,
  ArrowRightLeft,
} from 'lucide-react';

export const WalletModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    isConnected,
    address,
    chainId,
    isCorrectNetwork,
    hasAgentId,
    agentIdBalance,
    agentIdTokenId,
    isAuthenticated,
    isVerifyingAgentId,
    connectWallet,
    disconnectWallet,
    switchAccount,
    switchNetwork,
    authenticateWithSignature,
    verifyAgentIdOnChain,
    isDemoAgentIdOverride,
    toggleDemoAgentId,
    isBinanceLoggedIn,
    binanceUser,
    linkCurrentWalletToBinance,
  } = useWallet();

  const [isSigning, setIsSigning] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSign = async () => {
    setIsSigning(true);
    await authenticateWithSignature();
    setIsSigning(false);
  };

  const handleLink = async () => {
    setIsLinking(true);
    setLinkMsg(null);
    const res = await linkCurrentWalletToBinance();
    setIsLinking(false);
    if (res.success) {
      setLinkMsg('Wallet linked to Binance identity!');
    } else {
      setLinkMsg(res.error || 'Linking failed.');
    }
  };

  const currentNetwork = SUPPORTED_NETWORKS.find((n) => n.id === chainId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-charcoal-900 border border-refined rounded-2xl p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-950 border border-forest-600/40 flex items-center justify-center text-forest-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ivory-50">Web3 Identity &amp; Agent ID</h3>
              <p className="text-xs text-charcoal-400">BNB Smart Chain Auth Gate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-charcoal-400 hover:text-ivory-100 hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4 space-y-4">
          {/* Binance Account Association Banner */}
          <div className="p-3 bg-charcoal-950/60 rounded-xl border border-subtle flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#F3BA2F]/10 border border-[#F3BA2F]/30 flex items-center justify-center text-[#F3BA2F] font-bold text-xs">
                B
              </div>
              <div>
                <span className="text-ivory-100 font-medium block">
                  {isBinanceLoggedIn && binanceUser
                    ? binanceUser.displayName || 'Binance User'
                    : 'Binance Account'}
                </span>
                <span className="text-[11px] text-charcoal-400">
                  {isBinanceLoggedIn ? 'OAuth Session Active' : 'OAuth (Partner Access Required)'}
                </span>
              </div>
            </div>
            <Link href="/login" onClick={onClose} className="text-forest-400 hover:underline text-[11px] font-mono">
              {isBinanceLoggedIn ? 'Manage' : 'Details'}
            </Link>
          </div>

          {!isConnected ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-charcoal-850 border border-subtle flex items-center justify-center text-forest-400">
                <Cpu className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-ivory-100">Connect Web3 Wallet</h4>
                <p className="text-xs text-charcoal-400 max-w-xs mx-auto">
                  Connect your Binance Web3 Wallet, Trust Wallet, or MetaMask to verify Agent ID ownership.
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  leftIcon={<Wallet className="w-4 h-4" />}
                  onClick={connectWallet}
                >
                  Connect Active Wallet
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  leftIcon={<ArrowRightLeft className="w-4 h-4" />}
                  onClick={switchAccount}
                >
                  Switch / Choose Different Account
                </Button>
              </div>
              <p className="text-[11px] text-charcoal-500">
                Switch accounts anytime or select a new wallet from your extension.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Account Card */}
              <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-400 font-mono">CONNECTED WALLET</span>
                  <span className="font-mono text-emerald-400 text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-ivory-100">
                    {truncateAddress(address || '', 6)}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => switchAccount()}
                      className="text-forest-400 hover:text-forest-300 flex items-center gap-1 font-mono text-[11px] hover:underline"
                      title="Switch account in your wallet extension"
                    >
                      <ArrowRightLeft className="w-3 h-3" /> Switch
                    </button>
                    <a
                      href={`https://bscscan.com/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forest-400 hover:text-forest-300 flex items-center gap-1 font-mono text-[11px]"
                    >
                      BscScan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Link Wallet to Binance Account */}
              {isBinanceLoggedIn && (
                <div className="p-3 bg-charcoal-950/60 rounded-xl border border-subtle flex items-center justify-between">
                  <div>
                    <span className="text-ivory-100 font-medium block">Link to Binance Identity</span>
                    <span className="text-[11px] text-charcoal-400">Cryptographically binds wallet</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Link2 className="w-3 h-3" />}
                    isLoading={isLinking}
                    onClick={handleLink}
                  >
                    Link Wallet
                  </Button>
                </div>
              )}

              {linkMsg && (
                <div className="p-2.5 rounded-lg bg-forest-950/60 border border-forest-600/40 text-[11px] text-forest-200">
                  {linkMsg}
                </div>
              )}

              {/* Network Status */}
              <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-subtle flex items-center justify-between">
                <div>
                  <span className="text-charcoal-400 font-mono block">CURRENT NETWORK</span>
                  <span className="font-medium text-ivory-100">
                    {currentNetwork ? currentNetwork.name : `Chain ID: ${chainId || 'Unknown'}`}
                  </span>
                </div>
                {!isCorrectNetwork ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => switchNetwork(56)}
                  >
                    Switch to BSC
                  </Button>
                ) : (
                  <Badge variant="bnb" size="sm">
                    Chain {chainId}
                  </Badge>
                )}
              </div>

              {/* Binance Agent ID Status */}
              <div className="p-4 bg-forest-950/30 rounded-xl border border-forest-600/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hasAgentId ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <h5 className="font-semibold text-ivory-100 text-xs">
                        {hasAgentId ? 'Binance Agent ID Verified' : 'Agent ID Not Detected'}
                      </h5>
                      <p className="text-[11px] text-charcoal-400">
                        Contract: {truncateAddress(OFFICIAL_AGENT_ID_CONTRACT, 4)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => verifyAgentIdOnChain()}
                    disabled={isVerifyingAgentId}
                    className="p-1 text-charcoal-400 hover:text-forest-300 transition-colors"
                    title="Re-verify on-chain"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingAgentId ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="text-[11px] text-charcoal-300 pt-1 border-t border-forest-800/30">
                  {hasAgentId ? (
                    <div className="flex items-center justify-between">
                      <span>Token ID: <span className="font-mono text-emerald-300">{agentIdTokenId || 'Active'}</span></span>
                      <span className="text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> BEP-721 Token Held ({agentIdBalance})
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-amber-300/90 mb-2">
                        No official Binance Agent ID NFT held at this address on BNB Chain.
                      </p>
                      <a
                        href="https://web3.binance.com/en/dev-docs/products/agentic-wallet/introduction"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-forest-400 underline hover:text-forest-300 inline-flex items-center gap-1"
                      >
                        Learn how to mint Agent ID <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Cryptographic Session Auth */}
              <div className="p-3 bg-charcoal-950/60 rounded-xl border border-subtle flex items-center justify-between">
                <div>
                  <span className="text-charcoal-400 font-mono block">SIGNATURE SESSION</span>
                  <span className="font-medium text-ivory-100">
                    {isAuthenticated ? 'Authenticated Session' : 'Pending Signature'}
                  </span>
                </div>
                {!isAuthenticated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Key className="w-3 h-3" />}
                    onClick={handleSign}
                    isLoading={isSigning}
                  >
                    Sign Nonce
                  </Button>
                ) : (
                  <Badge variant="success" size="sm">
                    Verified
                  </Badge>
                )}
              </div>

              {/* Judge / Reviewer Quick Testnet Simulation Toggle */}
              <div className="pt-2 border-t border-subtle">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-charcoal-850 border border-subtle text-[11px]">
                  <div>
                    <span className="text-ivory-200 font-medium block">Judge Demo Mode</span>
                    <span className="text-charcoal-400">Simulate verified Agent ID for testing</span>
                  </div>
                  <button
                    onClick={toggleDemoAgentId}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isDemoAgentIdOverride ? 'bg-forest-500' : 'bg-charcoal-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        isDemoAgentIdOverride ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons: Switch & Disconnect */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-subtle">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                  onClick={() => switchAccount()}
                >
                  Switch Account
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                  leftIcon={<LogOut className="w-4 h-4" />}
                  onClick={() => {
                    disconnectWallet();
                  }}
                >
                  Disconnect Wallet
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
