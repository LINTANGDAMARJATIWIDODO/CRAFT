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
  Link2,
  ArrowRightLeft,
  Sparkles,
  Download,
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
    agentDomainName,
    connectionMode,
    activeWalletLabel,
    isAuthenticated,
    isVerifyingAgentId,
    discoveredWallets,
    binanceWalletDetected,
    lastConnectionError,
    clearConnectionError,
    connectBinanceAgent,
    connectWallet,
    connectWithAgentIdDirect,
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
  const [agentIdInput, setAgentIdInput] = useState('');
  const [isConnectingDirect, setIsConnectingDirect] = useState(false);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);

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
    setLinkMsg(res.success ? 'Wallet linked to Binance identity!' : res.error || 'Linking failed.');
  };

  const handleDirectAgentConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnectingDirect(true);
    await connectWithAgentIdDirect(agentIdInput);
    setIsConnectingDirect(false);
  };

  const currentNetwork = SUPPORTED_NETWORKS.find((n) => n.id === chainId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-charcoal-900 border border-refined rounded-2xl p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F3BA2F]/15 border border-[#F3BA2F]/40 flex items-center justify-center text-[#F3BA2F] font-bold text-sm">
              B
            </div>
            <div>
              <h3 className="text-base font-semibold text-ivory-50">Connect Binance Agent &amp; Wallet</h3>
              <p className="text-xs text-charcoal-400">Binance Web3 Wallet • SPACE ID Agent ID</p>
            </div>
          </div>
          <button
            onClick={() => {
              clearConnectionError();
              onClose();
            }}
            className="p-1 rounded-lg text-charcoal-400 hover:text-ivory-100 hover:bg-charcoal-800 transition-colors"
            aria-label="Close wallet dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4">
          {!isConnected ? (
            <div className="space-y-4">
              {/* Primary 1-Click Direct Binance Web3 Wallet */}
              <div className="p-4 rounded-xl bg-[#F3BA2F]/5 border border-[#F3BA2F]/30 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-ivory-100">
                    Binance Web3 Wallet / Agentic Wallet
                  </span>
                  <Badge variant={binanceWalletDetected ? 'success' : 'bnb'} size="sm">
                    {binanceWalletDetected ? 'Detected' : 'Primary Auth'}
                  </Badge>
                </div>
                <p className="text-[11px] text-charcoal-400 leading-relaxed">
                  No partner approval needed. Connects directly via <code className="text-ivory-200">window.binancew3w</code> or EIP-6963, switches to BNB Chain (56), and verifies Agent ID NFT <code className="text-ivory-200">0x60b9...022f</code>.
                </p>
                <Button
                  variant="primary"
                  className="w-full bg-[#F3BA2F] hover:bg-[#e5ad22] text-charcoal-950 font-semibold border-0"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  onClick={() => connectBinanceAgent()}
                >
                  Connect Binance Web3 Wallet Directly
                </Button>
              </div>

              {/* Error / Extension Not Installed / Mobile Browser Guidance */}
              {lastConnectionError && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 space-y-2.5">
                  <p>
                    {lastConnectionError === 'BINANCE_EXTENSION_NOT_FOUND'
                      ? 'Binance Web3 Wallet was not injected in this browser tab. On mobile, open this URL inside Binance App -> Wallets -> Web3 -> Discover, enter your .ai / 0x address below, or install the browser extension:'
                      : lastConnectionError}
                  </p>
                  {lastConnectionError === 'BINANCE_EXTENSION_NOT_FOUND' && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            navigator.clipboard?.writeText(window.location.origin);
                            setCopiedAppUrl(true);
                            setTimeout(() => setCopiedAppUrl(false), 3000);
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3BA2F]/15 border border-[#F3BA2F]/40 text-[#F3BA2F] font-mono text-[11px] hover:bg-[#F3BA2F]/25 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {copiedAppUrl ? 'URL Copied! Paste in Binance App' : 'Copy URL for Binance App'}
                      </button>
                      <a
                        href="https://www.binance.com/en/web3wallet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-ivory-200 hover:underline font-mono text-[11px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Get Binance Wallet <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Direct Agent ID (.ai) or Binance Agentic Wallet Address Connect */}
              <form
                onSubmit={handleDirectAgentConnect}
                className="p-4 rounded-xl bg-charcoal-950 border border-subtle space-y-2.5"
              >
                <label className="block text-xs font-medium text-ivory-100">
                  Connect Directly with Agent ID (<code className="text-emerald-400">.ai</code>) or Agentic Address
                </label>
                <p className="text-[11px] text-charcoal-400">
                  Created an Agentic Wallet inside the Binance App? Enter its <code className="text-ivory-300">name.ai</code> identity or <code className="text-ivory-300">0x...</code> address to resolve via SPACE ID &amp; verify on BNB Chain.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={agentIdInput}
                    onChange={(e) => setAgentIdInput(e.target.value)}
                    placeholder="e.g. myagent.ai or 0x..."
                    className="flex-1 px-3 py-2 rounded-lg bg-charcoal-900 border border-subtle font-mono text-xs text-ivory-100 focus:outline-none focus:border-forest-500"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    isLoading={isConnectingDirect}
                  >
                    Connect Agent
                  </Button>
                </div>
              </form>

              {/* Discovered EIP-6963 Browser Wallets */}
              {discoveredWallets.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-charcoal-400 uppercase">
                    Detected Browser Wallets ({discoveredWallets.length})
                  </div>
                  <div className="space-y-1.5">
                    {discoveredWallets.map((w) => (
                      <button
                        key={w.uuid}
                        type="button"
                        onClick={() => connectWallet(w.uuid)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-charcoal-950 hover:bg-charcoal-850 border border-subtle hover:border-forest-600/50 text-xs transition-colors"
                      >
                        <span className="flex items-center gap-2 font-medium text-ivory-100">
                          {w.icon ? (
                            <img src={w.icon} alt={w.name} className="w-4 h-4 rounded-sm" />
                          ) : (
                            <Wallet className="w-4 h-4 text-forest-400" />
                          )}
                          {w.name}
                        </span>
                        <Badge variant={w.isBinance ? 'bnb' : 'outline'} size="sm">
                          {w.isBinance ? 'Binance Agentic' : 'Connect'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary Optional Binance OAuth Partner Layer */}
              <div className="p-3 bg-charcoal-950/60 rounded-xl border border-subtle flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#F3BA2F]/10 border border-[#F3BA2F]/30 flex items-center justify-center text-[#F3BA2F] font-bold text-xs shrink-0">
                    B
                  </div>
                  <div>
                    <span className="text-ivory-100 font-medium block">
                      {isBinanceLoggedIn && binanceUser
                        ? binanceUser.displayName || 'Binance User'
                        : 'Binance Account (OAuth 2.0)'}
                    </span>
                    <span className="text-[11px] text-charcoal-400">
                      {isBinanceLoggedIn ? 'OAuth Session Active' : 'Close Ecosystem Partners Only'}
                    </span>
                  </div>
                </div>
                <Link href="/login" onClick={onClose} className="text-forest-400 hover:underline text-[11px] font-mono shrink-0">
                  {isBinanceLoggedIn ? 'Manage' : 'Partner Info'}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Connected Account Card */}
              <div className="p-3.5 bg-charcoal-950/60 rounded-xl border border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-400 font-mono">
                    {activeWalletLabel || 'CONNECTED WALLET'}
                  </span>
                  <span className="font-mono text-emerald-400 text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {connectionMode === 'agent_id_direct' ? 'Agent Identity Session' : 'Live Extension'}
                  </span>
                </div>
                {agentDomainName && (
                  <div className="text-xs font-mono text-[#F3BA2F] font-semibold">
                    Identity Handle: {agentDomainName}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-ivory-100">
                    {truncateAddress(address || '', 6)}
                  </span>
                  <div className="flex items-center gap-3">
                    {connectionMode === 'extension' && (
                      <button
                        onClick={() => switchAccount()}
                        className="text-forest-400 hover:text-forest-300 flex items-center gap-1 font-mono text-[11px] hover:underline"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Switch
                      </button>
                    )}
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

              {/* Link Wallet to Binance OAuth */}
              {isBinanceLoggedIn && connectionMode === 'extension' && (
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
                    {currentNetwork ? currentNetwork.name : `Chain ID: ${chainId || 56}`}
                  </span>
                </div>
                {!isCorrectNetwork ? (
                  <Button variant="danger" size="sm" onClick={() => switchNetwork(56)}>
                    Switch to BSC
                  </Button>
                ) : (
                  <Badge variant="bnb" size="sm">
                    Chain {chainId}
                  </Badge>
                )}
              </div>

              {/* Official Binance Agent ID On-Chain Verification */}
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
                      <span>
                        Token: <span className="font-mono text-emerald-300">{agentDomainName || agentIdTokenId || 'Active'}</span>
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> Held ({agentIdBalance})
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
                        Mint Agent ID in Binance App <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Auth */}
              {connectionMode === 'extension' && (
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
              )}

              {/* Judge Demo Pass */}
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

              {/* Switch / Disconnect */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-subtle">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                  onClick={() => switchAccount()}
                >
                  Switch Extension
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                  leftIcon={<LogOut className="w-4 h-4" />}
                  onClick={() => disconnectWallet()}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
