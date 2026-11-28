import { verifyMessage, createPublicClient, fallback, http } from 'viem';
import { bsc } from 'viem/chains';
import { OFFICIAL_AGENT_ID_ABI, OFFICIAL_AGENT_ID_CONTRACT_BSC, SUPPORTED_CHAINS } from '@craft/shared';

const AGENT_ID_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const;

export interface LinkChallenge {
  userId: string;
  address: string;
  nonce: number;
  message: string;
  createdAt: number;
}

export class AccountLinkingService {
  // Store pending challenges with 5 minute expiration
  private pendingChallenges: Map<string, LinkChallenge> = new Map();

  /**
   * Creates a challenge nonce to bind a Web3 wallet to a CRAFT user account
   */
  public createChallenge(userId: string, address: string): { nonce: number; message: string } {
    const nonce = Math.floor(Math.random() * 900000) + 100000;
    const timestamp = new Date().toISOString();
    const key = `${userId}:${address.toLowerCase()}`;

    const message = `CRAFT Account Linking Verification\n\nI authorize linking this Web3 wallet to my CRAFT identity.\nUser ID: ${userId}\nWallet Address: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

    this.pendingChallenges.set(key, {
      userId,
      address: address.toLowerCase(),
      nonce,
      message,
      createdAt: Date.now(),
    });

    return { nonce, message };
  }

  /**
   * Cryptographically verifies the wallet signature and queries Binance Agent ID on-chain
   */
  public async verifyAndLink(
    userId: string,
    address: string,
    signature: string
  ): Promise<{
    success: boolean;
    address: string;
    hasAgentId: boolean;
    agentIdBalance: number;
    verifiedAt: string;
  }> {
    const key = `${userId}:${address.toLowerCase()}`;
    const challenge = this.pendingChallenges.get(key);

    if (!challenge) {
      throw new Error('No active link challenge found. Please request a new nonce.');
    }

    // Single-use: remove challenge to prevent replay
    this.pendingChallenges.delete(key);

    // Expiration check (5 minutes)
    if (Date.now() - challenge.createdAt > 5 * 60 * 1000) {
      throw new Error('Challenge expired. Please generate a new signature.');
    }

    // Cryptographic signature verification with viem
    const isValidSignature = await verifyMessage({
      address: address as `0x${string}`,
      message: challenge.message,
      signature: signature as `0x${string}`,
    });

    if (!isValidSignature) {
      throw new Error('Invalid signature. Wallet ownership verification failed.');
    }

    // Real on-chain Binance Agent ID ownership check
    let hasAgentId = false;
    let agentIdBalance = 0;

    try {
      const client = createPublicClient({
        chain: bsc,
        transport: fallback([
          http(SUPPORTED_CHAINS.BSC_MAINNET.rpcUrl, { timeout: 3500, retryCount: 0 }),
          http(SUPPORTED_CHAINS.BSC_MAINNET.fallbackRpcUrl, { timeout: 2500, retryCount: 0 }),
        ]),
      });

      const balance = await client.readContract({
        address: OFFICIAL_AGENT_ID_CONTRACT_BSC as `0x${string}`,
        abi: OFFICIAL_AGENT_ID_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      agentIdBalance = Number(balance);
      hasAgentId = agentIdBalance > 0;
    } catch (rpcErr) {
      console.warn('RPC check on Binance Agent ID failed or timed out:', rpcErr);
      // Fallback: remains false unless confirmed on-chain
      hasAgentId = false;
    }

    return {
      success: true,
      address,
      hasAgentId,
      agentIdBalance,
      verifiedAt: new Date().toISOString(),
    };
  }
}

export const accountLinkingService = new AccountLinkingService();
