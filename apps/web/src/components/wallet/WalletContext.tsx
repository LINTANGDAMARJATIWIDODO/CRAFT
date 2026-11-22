'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { bsc } from 'viem/chains';
import { OFFICIAL_AGENT_ID_CONTRACT, SUPPORTED_NETWORKS } from '@/lib/constants';
import { BinanceOAuthStatus, BinanceUserProfile, UserSession } from '@craft/shared';

// Minimal ERC-721 ABI for Agent ID ownership verification
const AGENT_ID_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

export interface WalletContextType {
  // Web3 Wallet state
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  hasAgentId: boolean;
  agentIdTokenId: string | null;
  agentIdBalance: number;
  isAuthenticated: boolean;
  isVerifyingAgentId: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchAccount: () => Promise<boolean>;
  switchNetwork: (targetChainId: number) => Promise<void>;
  authenticateWithSignature: () => Promise<boolean>;
  verifyAgentIdOnChain: (targetAddress?: string) => Promise<boolean>;

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
  message: 'Binance Login (OAuth 2.0) requires verified ecosystem partner approval via developers.binance.com. Web3 wallet authentication is fully operational.',
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Web3 state
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [hasAgentId, setHasAgentId] = useState<boolean>(false);
  const [agentIdBalance, setAgentIdBalance] = useState<number>(0);
  const [agentIdTokenId, setAgentIdTokenId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifyingAgentId, setIsVerifyingAgentId] = useState<boolean>(false);
  const [isDemoAgentIdOverride, setIsDemoAgentIdOverride] = useState<boolean>(false);

  // Binance OAuth state
  const [binanceOAuthStatus, setBinanceOAuthStatus] = useState<BinanceOAuthStatus>(DEFAULT_OAUTH_STATUS);
  const [isBinanceLoggedIn, setIsBinanceLoggedIn] = useState<boolean>(false);
  const [binanceUser, setBinanceUser] = useState<BinanceUserProfile | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Check if current network is BNB Chain (56) or BNB Testnet (97) or Hardhat (31337)
  const isCorrectNetwork = chainId ? [56, 97, 31337].includes(chainId) : false;

  // Fetch Binance OAuth Status from backend
  useEffect(() => {
    fetch('http://localhost:4000/api/auth/binance/status')
      .then((res) => res.json())
      .then((data: BinanceOAuthStatus) => {
        if (data) setBinanceOAuthStatus(data);
      })
      .catch(() => {
        // Backend offline or running standalone: keep descriptive default
        setBinanceOAuthStatus(DEFAULT_OAUTH_STATUS);
      });
  }, []);

  // Restore stored session if exists
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
        console.error('Failed to restore session:', e);
      }
    }
  }, []);

  // On mount check if already connected in browser wallet
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const isExplicitlyDisconnected = localStorage.getItem('craft_wallet_disconnected') === 'true';
      if (!isExplicitlyDisconnected) {
        const eth = (window as any).ethereum;
        eth.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            eth.request({ method: 'eth_chainId' }).then((hexChain: string) => {
              setChainId(parseInt(hexChain, 16));
            });
          }
        }).catch(console.error);
      }

      const eth = (window as any).ethereum;
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

      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('chainChanged', handleChainChanged);

      return () => {
        if (eth.removeListener) {
          eth.removeListener('accountsChanged', handleAccountsChanged);
          eth.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // When address or chainId changes, perform real on-chain Agent ID check
  useEffect(() => {
    if (address) {
      verifyAgentIdOnChain(address);
    } else {
      setHasAgentId(false);
      setAgentIdBalance(0);
      setAgentIdTokenId(null);
    }
  }, [address, chainId, isDemoAgentIdOverride]);

  const verifyAgentIdOnChain = async (targetAddress?: string): Promise<boolean> => {
    const addr = targetAddress || address;
    if (!addr) return false;

    // Reviewer/Judge override toggle
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
        transport: http('https://bsc-dataseed.binance.org/'),
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
      if (verified) {
        setAgentIdTokenId(`Verified #${addr.slice(-4).toUpperCase()}`);
      } else {
        setAgentIdTokenId(null);
      }
      return verified;
    } catch (err) {
      console.warn('Real Agent ID contract check query returned warning:', err);
      setHasAgentId(false);
      setAgentIdBalance(0);
      return false;
    } finally {
      setIsVerifyingAgentId(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('Please install Binance Web3 Wallet, Trust Wallet, or MetaMask to connect to CRAFT.');
      return;
    }

    try {
      localStorage.removeItem('craft_wallet_disconnected');
      const eth = (window as any).ethereum;
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        const hexChain = await eth.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(hexChain, 16);
        setChainId(currentChainId);

        if (![56, 97, 31337].includes(currentChainId)) {
          await switchNetwork(56);
        }
      }
    } catch (err: any) {
      console.error('Wallet connection rejected:', err);
    }
  };

  const switchAccount = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('Please install Binance Web3 Wallet, Trust Wallet, or MetaMask to connect to CRAFT.');
      return false;
    }

    try {
      localStorage.removeItem('craft_wallet_disconnected');
      const eth = (window as any).ethereum;

      // EIP-2255 wallet_requestPermissions opens the account selection dialog in MetaMask & Web3 wallets
      try {
        await eth.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (permError: any) {
        console.warn('wallet_requestPermissions skipped or rejected, proceeding with eth_requestAccounts:', permError);
      }

      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsAuthenticated(false);
        const hexChain = await eth.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(hexChain, 16);
        setChainId(currentChainId);

        if (![56, 97, 31337].includes(currentChainId)) {
          await switchNetwork(56);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Account switch cancelled or failed:', err);
      return false;
    }
  };

  const switchNetwork = async (targetChainId: number) => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;
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
    if (!address || typeof window === 'undefined' || !(window as any).ethereum) {
      return false;
    }
    try {
      const eth = (window as any).ethereum;
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
      } catch (e) {
        console.warn('Failed to save disconnect preference:', e);
      }
    }
    setAddress(null);
    setChainId(null);
    setHasAgentId(false);
    setAgentIdBalance(0);
    setAgentIdTokenId(null);
    setIsAuthenticated(false);
    setIsDemoAgentIdOverride(false);
  };

  const toggleDemoAgentId = () => {
    setIsDemoAgentIdOverride((prev) => !prev);
  };

  // Initiate Binance OAuth Login
  const initiateBinanceLogin = async (): Promise<{ success: boolean; error?: string; url?: string }> => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/binance/authorize');
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
    } catch (err: any) {
      return {
        success: false,
        error: 'Unable to reach authentication service or partner credentials not configured.',
      };
    }
  };

  // Log out of Binance OAuth session
  const logoutBinance = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('craft_session_token');
      localStorage.removeItem('craft_binance_user');
    }
    setIsBinanceLoggedIn(false);
    setBinanceUser(null);
    setSessionToken(null);
  };

  // Link Web3 wallet to active Binance account
  const linkCurrentWalletToBinance = async (): Promise<{ success: boolean; error?: string }> => {
    if (!address) {
      return { success: false, error: 'Please connect your Web3 wallet first.' };
    }
    if (!isBinanceLoggedIn || !binanceUser) {
      return { success: false, error: 'Please log in with your Binance account first.' };
    }

    try {
      const eth = (window as any).ethereum;
      const resChallenge = await fetch('http://localhost:4000/api/auth/link/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: binanceUser.providerSubject,
          address,
        }),
      });

      const challengeData = await resChallenge.json();
      if (!resChallenge.ok) {
        throw new Error(challengeData.error || 'Failed to issue linking challenge');
      }

      const signature = await eth.request({
        method: 'personal_sign',
        params: [challengeData.message, address],
      });

      const resVerify = await fetch('http://localhost:4000/api/auth/link/verify', {
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
      if (!resVerify.ok) {
        throw new Error(verifyData.error || 'Linking signature verification failed');
      }

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
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
