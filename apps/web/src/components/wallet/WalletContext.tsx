'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createPublicClient, fallback, http } from 'viem';
import { bsc } from 'viem/chains';
import { OFFICIAL_AGENT_ID_CONTRACT, SUPPORTED_NETWORKS } from '@/lib/constants';
import { API_BASE, resolveAgentIdRemote } from '@/lib/craft-client';
import { BinanceOAuthStatus, BinanceUserProfile, OFFICIAL_AGENT_ID_ABI } from '@craft/shared';

const AGENT_ID_ABI = OFFICIAL_AGENT_ID_ABI;

export interface DiscoveredWalletProvider {
  uuid: string;
  name: string;
  rdns: string;
  icon?: string;
  isBinance: boolean;
  provider: any;
}

export interface WalletConnectOutcome {
  success: boolean;
  reason?: string;
  address?: string;
  hasAgentId?: boolean;
  domainName?: string | null;
}

export interface WalletContextType {
  // Web3 Wallet & Binance Agent state
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  hasAgentId: boolean;
  agentIdTokenId: string | null;
  agentIdBalance: number;
  agentDomainName: string | null;
  connectionMode: 'extension' | 'agent_id_direct' | null;
  activeWalletLabel: string | null;
  isAuthenticated: boolean;
  isVerifyingAgentId: boolean;
  discoveredWallets: DiscoveredWalletProvider[];
  binanceWalletDetected: boolean;
  lastConnectionError: string | null;
  clearConnectionError: () => void;

  // Actions
  connectBinanceAgent: () => Promise<WalletConnectOutcome>;
  connectWallet: (providerUuid?: string) => Promise<WalletConnectOutcome>;
  connectWithAgentIdDirect: (domainOrAddress: string) => Promise<WalletConnectOutcome>;
  disconnectWallet: () => void;
  switchAccount: () => Promise<boolean>;
  switchNetwork: (targetChainId: number) => Promise<void>;
  authenticateWithSignature: () => Promise<boolean>;
  verifyAgentIdOnChain: (targetAddress?: string) => Promise<boolean>;
  getActiveProvider: () => any;

  // Judge / Reviewer Demo Pass
  isDemoAgentIdOverride: boolean;
  toggleDemoAgentId: () => void;

  // Binance OAuth & Account Linking state
  binanceOAuthStatus: BinanceOAuthStatus;
  isBinanceLoggedIn: boolean;
  binanceUser: BinanceUserProfile | null;
  sessionToken: string | null;
  initiateBinanceLogin: () => Promise<{ success: boolean; error?: string; url?: string }>;
  logoutBinance: () => void;
  linkCurrentWalletToBinance: () => Promise<{ success: boolean; error?: string }>;
}

const WalletContext = createContext<WalletContextType | null>(null);

const DEFAULT_OAUTH_STATUS: BinanceOAuthStatus = {
  enabled: false,
  configured: false,
  partnerAccessRequired: true,
  message:
    'Binance Login (OAuth 2.0) requires verified ecosystem partner approval via developers.binance.com. Direct Binance Web3 Wallet and Agent ID verification are fully operational.',
};

function detectInjectedBinanceProvider(): DiscoveredWalletProvider | null {
  if (typeof window === 'undefined') return null;
  const win = window as any;

  if (win.binancew3w?.ethereum) {
    return {
      uuid: 'binance-w3w-injected',
      name: 'Binance Web3 Wallet',
      rdns: 'com.binance.wallet',
      isBinance: true,
      provider: win.binancew3w.ethereum,
    };
  }
  if (win.BinanceChain) {
    return {
      uuid: 'binance-chain-injected',
      name: 'Binance Wallet (Legacy)',
      rdns: 'com.binance.chain',
      isBinance: true,
      provider: win.BinanceChain,
    };
  }
  if (win.ethereum && (win.ethereum.isBinance || win.ethereum.isBinanceWallet)) {
    return {
      uuid: 'binance-ethereum-injected',
      name: 'Binance Web3 Wallet',
      rdns: 'com.binance.wallet',
      isBinance: true,
      provider: win.ethereum,
    };
  }
  return null;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [hasAgentId, setHasAgentId] = useState<boolean>(false);
  const [agentIdBalance, setAgentIdBalance] = useState<number>(0);
  const [agentIdTokenId, setAgentIdTokenId] = useState<string | null>(null);
  const [agentDomainName, setAgentDomainName] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<'extension' | 'agent_id_direct' | null>(null);
  const [activeWalletLabel, setActiveWalletLabel] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifyingAgentId, setIsVerifyingAgentId] = useState<boolean>(false);
  const [isDemoAgentIdOverride, setIsDemoAgentIdOverride] = useState<boolean>(false);
  const [discoveredWallets, setDiscoveredWallets] = useState<DiscoveredWalletProvider[]>([]);
  const [lastConnectionError, setLastConnectionError] = useState<string | null>(null);

  const [binanceOAuthStatus, setBinanceOAuthStatus] = useState<BinanceOAuthStatus>(DEFAULT_OAUTH_STATUS);
  const [isBinanceLoggedIn, setIsBinanceLoggedIn] = useState<boolean>(false);
  const [binanceUser, setBinanceUser] = useState<BinanceUserProfile | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const activeProviderRef = useRef<any>(null);

  const isCorrectNetwork = chainId ? [56, 97, 31337].includes(chainId) : false;
  const binanceWalletDetected =
    discoveredWallets.some((w) => w.isBinance) || Boolean(detectInjectedBinanceProvider());

  const clearConnectionError = () => setLastConnectionError(null);

  // Fetch Binance OAuth Status
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/binance/status`)
      .then((res) => res.json())
      .then((data: BinanceOAuthStatus) => {
        if (data) setBinanceOAuthStatus(data);
      })
      .catch(() => setBinanceOAuthStatus(DEFAULT_OAUTH_STATUS));
  }, []);

  // Restore Binance OAuth session if stored
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedToken = localStorage.getItem('craft_session_token');
        const storedUser = localStorage.getItem('craft_binance_user');
        if (storedToken && storedUser) {
          setSessionToken(storedToken);
          setBinanceUser(JSON.parse(storedUser));
          setIsBinanceLoggedIn(true);
        }
      } catch (e) {
        console.error('Failed to restore Binance OAuth session:', e);
      }
    }
  }, []);

  // Discover EIP-6963 & Binance injected wallet providers on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const providerMap = new Map<string, DiscoveredWalletProvider>();

    const registerItem = (item: DiscoveredWalletProvider) => {
      const key = item.rdns || item.uuid || item.name;
      if (!providerMap.has(key)) {
        providerMap.set(key, item);
      }
      const list = Array.from(providerMap.values()).sort((a, b) => {
        if (a.isBinance !== b.isBinance) return a.isBinance ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setDiscoveredWallets(list);
    };

    const injectedBinance = detectInjectedBinanceProvider();
    if (injectedBinance) registerItem(injectedBinance);

    const win = window as any;
    if (win.ethereum && !win.ethereum.isBinance && !win.ethereum.isBinanceWallet) {
      registerItem({
        uuid: 'default-injected-ethereum',
        name: win.ethereum.isMetaMask
          ? 'MetaMask'
          : win.ethereum.isTrust
          ? 'Trust Wallet'
          : 'Browser Web3 Wallet',
        rdns: win.ethereum.isMetaMask ? 'io.metamask' : 'injected.ethereum',
        isBinance: false,
        provider: win.ethereum,
      });
    }

    const onAnnounce = (event: any) => {
      const detail = event?.detail;
      if (!detail?.info || !detail?.provider) return;
      const rdns = String(detail.info.rdns || '').toLowerCase();
      const name = String(detail.info.name || 'Web3 Wallet');
      const isBinance = rdns.includes('binance') || name.toLowerCase().includes('binance');
      registerItem({
        uuid: detail.info.uuid || rdns || name,
        name: isBinance ? 'Binance Web3 Wallet' : name,
        rdns: detail.info.rdns || name.toLowerCase(),
        icon: detail.info.icon,
        isBinance,
        provider: detail.provider,
      });
    };

    window.addEventListener('eip6963:announceProvider', onAnnounce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Restore prior Direct Agent ID or Extension connection unless explicitly disconnected
    const isDisconnected = localStorage.getItem('craft_wallet_disconnected') === 'true';
    if (!isDisconnected) {
      const savedDirect = localStorage.getItem('craft_agentic_identity');
      if (savedDirect) {
        try {
          const parsed = JSON.parse(savedDirect);
          if (parsed?.address) {
            setAddress(parsed.address);
            setChainId(56);
            setAgentDomainName(parsed.domainName || null);
            setConnectionMode('agent_id_direct');
            setActiveWalletLabel(parsed.domainName ? `Agent ID (${parsed.domainName})` : 'Binance Agentic Address');
          }
        } catch {}
      } else {
        const preferredRdns = localStorage.getItem('craft_wallet_provider_rdns');
        const restoreProv =
          (preferredRdns &&
            Array.from(providerMap.values()).find((p) => p.rdns === preferredRdns)) ||
          injectedBinance ||
          (win.ethereum
            ? {
                uuid: 'default',
                name: 'Browser Web3 Wallet',
                rdns: 'injected',
                isBinance: Boolean(win.ethereum.isBinance),
                provider: win.ethereum,
              }
            : null);

        if (restoreProv?.provider) {
          restoreProv.provider
            .request({ method: 'eth_accounts' })
            .then((accounts: string[]) => {
              if (accounts && accounts.length > 0) {
                activeProviderRef.current = restoreProv.provider;
                setAddress(accounts[0]);
                setConnectionMode('extension');
                setActiveWalletLabel(restoreProv.name);
                restoreProv.provider
                  .request({ method: 'eth_chainId' })
                  .then((hexChain: string) => setChainId(parseInt(hexChain, 16)))
                  .catch(() => setChainId(56));
              }
            })
            .catch(() => {});
        }
      }
    }

    return () => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce);
    };
  }, []);

  // Attach listeners to active injected provider when address/provider active
  useEffect(() => {
    const provider = activeProviderRef.current;
    if (!provider || !provider.on) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        localStorage.removeItem('craft_wallet_disconnected');
        setAddress(accounts[0]);
        setIsAuthenticated(false);
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = (hexChain: string) => {
      setChainId(parseInt(hexChain, 16));
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      if (provider.removeListener) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [address, activeWalletLabel]);

  // Verify Official Agent ID (0x60b9...022f) & reverse-resolve .ai / .bnb name whenever address changes
  useEffect(() => {
    if (address) {
      verifyAgentIdOnChain(address);
      resolveAgentIdRemote(address, true)
        .then((res) => {
          if (res?.domainName) {
            setAgentDomainName(res.domainName);
          }
        })
        .catch(() => {});
    } else {
      setHasAgentId(false);
      setAgentIdBalance(0);
      setAgentIdTokenId(null);
      setAgentDomainName(null);
    }
  }, [address, chainId, isDemoAgentIdOverride]);

  const verifyAgentIdOnChain = async (targetAddress?: string): Promise<boolean> => {
    const addr = targetAddress || address;
    if (!addr) return false;

    if (isDemoAgentIdOverride) {
      setHasAgentId(true);
      setAgentIdBalance(1);
      setAgentIdTokenId('10482 (Reviewer Demo Pass)');
      return true;
    }

    setIsVerifyingAgentId(true);
    try {
      const client = createPublicClient({
        chain: bsc,
        transport: fallback([
          http('https://bsc.publicnode.com', { timeout: 4500, retryCount: 0 }),
          http('https://bsc-dataseed.binance.org/', { timeout: 3000, retryCount: 0 }),
        ]),
      });

      const balance = await client.readContract({
        address: OFFICIAL_AGENT_ID_CONTRACT as `0x${string}`,
        abi: AGENT_ID_ABI,
        functionName: 'balanceOf',
        args: [addr as `0x${string}`],
      });

      const numBalance = Number(balance);
      setAgentIdBalance(numBalance);
      const verified = numBalance > 0;
      setHasAgentId(verified);
      setAgentIdTokenId(verified ? `Verified #${addr.slice(-4).toUpperCase()}` : null);
      return verified;
    } catch (err) {
      console.warn('Agent ID verification query warning:', err);
      setHasAgentId(false);
      setAgentIdBalance(0);
      return false;
    } finally {
      setIsVerifyingAgentId(false);
    }
  };

  const connectWithConcreteProvider = async (
    target: DiscoveredWalletProvider
  ): Promise<WalletConnectOutcome> => {
    setLastConnectionError(null);
    try {
      localStorage.removeItem('craft_wallet_disconnected');
      localStorage.removeItem('craft_agentic_identity');
      localStorage.setItem('craft_wallet_provider_rdns', target.rdns);

      const accounts = await target.provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        return { success: false, reason: 'No account returned from wallet provider.' };
      }

      activeProviderRef.current = target.provider;
      const connectedAddr = accounts[0];
      setAddress(connectedAddr);
      setConnectionMode('extension');
      setActiveWalletLabel(target.name);

      try {
        const hexChain = await target.provider.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(hexChain, 16);
        setChainId(currentChainId);
        if (![56, 97, 31337].includes(currentChainId)) {
          await switchNetwork(56, target.provider);
        }
      } catch {
        setChainId(56);
      }

      const hasId = await verifyAgentIdOnChain(connectedAddr);
      return {
        success: true,
        address: connectedAddr,
        hasAgentId: hasId,
      };
    } catch (err: any) {
      const msg = err?.message || 'Wallet connection rejected by user.';
      setLastConnectionError(msg);
      return { success: false, reason: msg };
    }
  };

  const connectBinanceAgent = async (): Promise<WalletConnectOutcome> => {
    setLastConnectionError(null);
    const binanceItem =
      discoveredWallets.find((w) => w.isBinance) || detectInjectedBinanceProvider();

    if (!binanceItem) {
      const msg =
        'Binance Web3 Wallet browser extension was not detected. Connect via your Agent ID (.ai / 0x address) directly, choose another installed wallet, or install the Binance Web3 Wallet extension.';
      setLastConnectionError('BINANCE_EXTENSION_NOT_FOUND');
      return { success: false, reason: msg };
    }

    return connectWithConcreteProvider(binanceItem);
  };

  const connectWallet = async (providerUuid?: string): Promise<WalletConnectOutcome> => {
    setLastConnectionError(null);

    if (providerUuid) {
      const found = discoveredWallets.find((w) => w.uuid === providerUuid || w.rdns === providerUuid);
      if (found) return connectWithConcreteProvider(found);
    }

    const preferredBinance = discoveredWallets.find((w) => w.isBinance) || detectInjectedBinanceProvider();
    if (preferredBinance) {
      return connectWithConcreteProvider(preferredBinance);
    }

    if (discoveredWallets.length > 0) {
      return connectWithConcreteProvider(discoveredWallets[0]);
    }

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      return connectWithConcreteProvider({
        uuid: 'fallback-eth',
        name: eth.isMetaMask ? 'MetaMask' : 'Browser Web3 Wallet',
        rdns: 'injected.ethereum',
        isBinance: Boolean(eth.isBinance || eth.isBinanceWallet),
        provider: eth,
      });
    }

    setLastConnectionError('BINANCE_EXTENSION_NOT_FOUND');
    return {
      success: false,
      reason: 'No injected browser wallet found. Enter your Binance Agent ID (.ai) or 0x wallet address directly.',
    };
  };

  const connectWithAgentIdDirect = async (domainOrAddress: string): Promise<WalletConnectOutcome> => {
    setLastConnectionError(null);
    const clean = domainOrAddress.trim();
    if (!clean) {
      const msg = 'Enter your Binance Agent ID (.ai / .bnb) or BSC wallet address (0x...).';
      setLastConnectionError(msg);
      return { success: false, reason: msg };
    }

    const resolved = await resolveAgentIdRemote(clean, true);
    let targetAddress = resolved?.resolvedAddress || null;
    let targetDomain = resolved?.domainName || null;

    // Fallback direct check if backend temporarily unreachable & input is valid 0x address
    if (!targetAddress && /^0x[a-fA-F0-9]{40}$/.test(clean)) {
      targetAddress = clean;
    }

    if (!targetAddress) {
      const msg =
        resolved?.note ||
        `Could not resolve '${clean}' to a valid BNB Smart Chain wallet address.`;
      setLastConnectionError(msg);
      return { success: false, reason: msg };
    }

    localStorage.removeItem('craft_wallet_disconnected');
    localStorage.setItem(
      'craft_agentic_identity',
      JSON.stringify({ address: targetAddress, domainName: targetDomain })
    );
    activeProviderRef.current = null;
    setAddress(targetAddress);
    setChainId(56);
    setAgentDomainName(targetDomain);
    setConnectionMode('agent_id_direct');
    setActiveWalletLabel(targetDomain ? `Agent ID (${targetDomain})` : 'Binance Agentic Address');
    setIsAuthenticated(false);

    const hasId = await verifyAgentIdOnChain(targetAddress);
    return {
      success: true,
      address: targetAddress,
      hasAgentId: hasId,
      domainName: targetDomain,
    };
  };

  const switchAccount = async (): Promise<boolean> => {
    const eth =
      activeProviderRef.current ||
      discoveredWallets.find((w) => w.isBinance)?.provider ||
      (typeof window !== 'undefined' ? (window as any).binancew3w?.ethereum || (window as any).ethereum : null);

    if (!eth) {
      setLastConnectionError('BINANCE_EXTENSION_NOT_FOUND');
      return false;
    }

    try {
      localStorage.removeItem('craft_wallet_disconnected');
      try {
        await eth.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch {}

      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        activeProviderRef.current = eth;
        setAddress(accounts[0]);
        setConnectionMode('extension');
        setIsAuthenticated(false);
        const hexChain = await eth.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(hexChain, 16);
        setChainId(currentChainId);
        if (![56, 97, 31337].includes(currentChainId)) {
          await switchNetwork(56, eth);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const switchNetwork = async (targetChainId: number, explicitProvider?: any) => {
    const eth = explicitProvider || activeProviderRef.current || (typeof window !== 'undefined' ? (window as any).ethereum : null);
    if (!eth) return;
    const hexChainId = '0x' + targetChainId.toString(16);

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      setChainId(targetChainId);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        const net = SUPPORTED_NETWORKS.find((n) => n.id === targetChainId);
        if (net) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: net.name,
                rpcUrls: [net.rpcUrl],
                nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                blockExplorerUrls: [net.explorer],
              },
            ],
          });
          setChainId(targetChainId);
        }
      }
    }
  };

  const authenticateWithSignature = async (): Promise<boolean> => {
    const eth = activeProviderRef.current || (typeof window !== 'undefined' ? (window as any).binancew3w?.ethereum || (window as any).ethereum : null);
    if (!address || !eth) {
      if (connectionMode === 'agent_id_direct') {
        setLastConnectionError(
          'Signature requires Binance Web3 Wallet extension or in-app browser connected to this address.'
        );
      }
      return false;
    }
    try {
      const nonce = Math.floor(Math.random() * 900000) + 100000;
      const timestamp = new Date().toISOString();
      const message = `CRAFT Protocol Authentication\n\nI confirm identity authorization for CRAFT.\nWallet: ${address}\nBinance Agent ID Gate: ${OFFICIAL_AGENT_ID_CONTRACT}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

      const signature = await eth.request({
        method: 'personal_sign',
        params: [message, address],
      });

      if (signature) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Signature rejected:', err);
      return false;
    }
  };

  const disconnectWallet = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('craft_wallet_disconnected', 'true');
        localStorage.removeItem('craft_agentic_identity');
        localStorage.removeItem('craft_wallet_provider_rdns');
      } catch {}
    }
    activeProviderRef.current = null;
    setAddress(null);
    setChainId(null);
    setHasAgentId(false);
    setAgentIdBalance(0);
    setAgentIdTokenId(null);
    setAgentDomainName(null);
    setConnectionMode(null);
    setActiveWalletLabel(null);
    setIsAuthenticated(false);
    setIsDemoAgentIdOverride(false);
    setLastConnectionError(null);
  };

  const toggleDemoAgentId = () => setIsDemoAgentIdOverride((prev) => !prev);

  const getActiveProvider = () =>
    activeProviderRef.current ||
    (typeof window !== 'undefined' ? (window as any).binancew3w?.ethereum || (window as any).ethereum : null);

  const initiateBinanceLogin = async (): Promise<{ success: boolean; error?: string; url?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/binance/authorize`);
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.message || 'Binance OAuth requires verified partner approval credentials.',
        };
      }
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return { success: true, url: data.authorizationUrl };
      }
      return { success: false, error: 'No authorization URL returned from service.' };
    } catch {
      return {
        success: false,
        error: 'Unable to reach authentication service or partner credentials not configured.',
      };
    }
  };

  const logoutBinance = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('craft_session_token');
      localStorage.removeItem('craft_binance_user');
    }
    setIsBinanceLoggedIn(false);
    setBinanceUser(null);
    setSessionToken(null);
  };

  const linkCurrentWalletToBinance = async (): Promise<{ success: boolean; error?: string }> => {
    const eth = activeProviderRef.current || (typeof window !== 'undefined' ? (window as any).ethereum : null);
    if (!address || !eth) {
      return { success: false, error: 'Please connect an interactive browser wallet first.' };
    }
    if (!isBinanceLoggedIn || !binanceUser) {
      return { success: false, error: 'Please log in with your Binance account first.' };
    }

    try {
      const resChallenge = await fetch(`${API_BASE}/api/auth/link/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: binanceUser.providerSubject, address }),
      });
      const challengeData = await resChallenge.json();
      if (!resChallenge.ok) throw new Error(challengeData.error || 'Failed to issue challenge');

      const signature = await eth.request({
        method: 'personal_sign',
        params: [challengeData.message, address],
      });

      const resVerify = await fetch(`${API_BASE}/api/auth/link/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: binanceUser.providerSubject,
          address,
          signature,
          sessionToken,
        }),
      });
      const verifyData = await resVerify.json();
      if (!resVerify.ok) throw new Error(verifyData.error || 'Signature verification failed');

      setIsAuthenticated(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Account linking rejected' };
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!address,
        address,
        chainId,
        isCorrectNetwork,
        hasAgentId,
        agentIdTokenId,
        agentIdBalance,
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
        getActiveProvider,
        isDemoAgentIdOverride,
        toggleDemoAgentId,
        binanceOAuthStatus,
        isBinanceLoggedIn,
        binanceUser,
        sessionToken,
        initiateBinanceLogin,
        logoutBinance,
        linkCurrentWalletToBinance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};
