import { createPublicClient, fallback, http, isAddress } from 'viem';
import { bsc, bscTestnet } from 'viem/chains';
import { OFFICIAL_AGENT_ID_ABI, OFFICIAL_AGENT_ID_CONTRACT_BSC, SUPPORTED_CHAINS } from '@craft/shared';
import { craftStore } from '../store/craft-store';

const mainnetClient = createPublicClient({
  chain: bsc,
  transport: fallback([
    http(SUPPORTED_CHAINS.BSC_MAINNET.rpcUrl, { timeout: 4500, retryCount: 0 }),
    http(SUPPORTED_CHAINS.BSC_MAINNET.fallbackRpcUrl, { timeout: 3000, retryCount: 0 }),
  ]),
});

const testnetClient = createPublicClient({
  chain: bscTestnet,
  transport: fallback([
    http(SUPPORTED_CHAINS.BSC_TESTNET.rpcUrl, { timeout: 4500, retryCount: 0 }),
    http(SUPPORTED_CHAINS.BSC_TESTNET.fallbackRpcUrl, { timeout: 3000, retryCount: 0 }),
  ]),
});

export class TrustRpcVerifier {
  public async getLatestBlockNumber(): Promise<number | null> {
    try {
      const bn = await mainnetClient.getBlockNumber();
      return Number(bn);
    } catch {
      return null;
    }
  }

  public async verifyWalletAgentIdOnChain(address: string): Promise<{
    address: string;
    isValidAddress: boolean;
    hasAgentId: boolean;
    balance: number;
    contractAddress: string;
    network: string;
    rpcReachable: boolean;
    bscScanUrl: string;
    note: string;
  }> {
    if (!isAddress(address)) {
      return {
        address,
        isValidAddress: false,
        hasAgentId: false,
        balance: 0,
        contractAddress: OFFICIAL_AGENT_ID_CONTRACT_BSC,
        network: 'BNB Smart Chain (56)',
        rpcReachable: false,
        bscScanUrl: '',
        note: 'Invalid EVM wallet address format.',
      };
    }

    try {
      const [balanceBig, contractName, contractSymbol] = await Promise.all([
        mainnetClient.readContract({
          address: OFFICIAL_AGENT_ID_CONTRACT_BSC as `0x${string}`,
          abi: OFFICIAL_AGENT_ID_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        }),
        mainnetClient.readContract({
          address: OFFICIAL_AGENT_ID_CONTRACT_BSC as `0x${string}`,
          abi: OFFICIAL_AGENT_ID_ABI,
          functionName: 'name',
        }).catch(() => 'SPACE ID Agent ID'),
        mainnetClient.readContract({
          address: OFFICIAL_AGENT_ID_CONTRACT_BSC as `0x${string}`,
          abi: OFFICIAL_AGENT_ID_ABI,
          functionName: 'symbol',
        }).catch(() => 'AI'),
      ]);
      const balance = Number(balanceBig);
      return {
        address,
        isValidAddress: true,
        hasAgentId: balance > 0,
        balance,
        contractAddress: OFFICIAL_AGENT_ID_CONTRACT_BSC,
        network: `BNB Smart Chain Mainnet (56) • ${contractName} (${contractSymbol})`,
        rpcReachable: true,
        bscScanUrl: `https://bscscan.com/address/${address}`,
        note:
          balance > 0
            ? `Verified on-chain (${contractName}): Wallet holds ${balance} official Agent ID token(s).`
            : `RPC check succeeded (${contractName}): 0 Agent ID tokens held at this address on BSC Mainnet.`,
      };
    } catch (err: any) {
      return {
        address,
        isValidAddress: true,
        hasAgentId: false,
        balance: 0,
        contractAddress: OFFICIAL_AGENT_ID_CONTRACT_BSC,
        network: 'BNB Smart Chain Mainnet (56)',
        rpcReachable: false,
        bscScanUrl: `https://bscscan.com/address/${address}`,
        note: `BSC Mainnet RPC unreachable or timed out (${err.message}). No synthetic verification assumed.`,
      };
    }
  }

  public async inspectTxOnBsc(txHash: string): Promise<{
    txHash: string;
    found: boolean;
    network?: 'BSC Mainnet (56)' | 'BSC Testnet (97)';
    status?: 'CONFIRMED' | 'REVERTED' | 'NOT_FOUND';
    blockNumber?: number;
    from?: string;
    to?: string | null;
    gasUsed?: string;
    bscScanUrl?: string;
    note: string;
  }> {
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return {
        txHash,
        found: false,
        status: 'NOT_FOUND',
        note: 'Invalid 32-byte EVM transaction hash format.',
      };
    }

    // Try BSC Mainnet first, then Testnet
    try {
      const receipt = await mainnetClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
      return {
        txHash,
        found: true,
        network: 'BSC Mainnet (56)',
        status: receipt.status === 'success' ? 'CONFIRMED' : 'REVERTED',
        blockNumber: Number(receipt.blockNumber),
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed.toString(),
        bscScanUrl: `https://bscscan.com/tx/${txHash}`,
        note: `Live receipt verified on BNB Smart Chain Mainnet block #${receipt.blockNumber}.`,
      };
    } catch {
      // Check Testnet
      try {
        const receipt = await testnetClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
        return {
          txHash,
          found: true,
          network: 'BSC Testnet (97)',
          status: receipt.status === 'success' ? 'CONFIRMED' : 'REVERTED',
          blockNumber: Number(receipt.blockNumber),
          from: receipt.from,
          to: receipt.to,
          gasUsed: receipt.gasUsed.toString(),
          bscScanUrl: `https://testnet.bscscan.com/tx/${txHash}`,
          note: `Live receipt verified on BNB Smart Chain Testnet block #${receipt.blockNumber}.`,
        };
      } catch {
        return {
          txHash,
          found: false,
          status: 'NOT_FOUND',
          note: 'Transaction hash was not found on BNB Smart Chain Mainnet or Testnet RPC nodes.',
        };
      }
    }
  }

  public async searchTrustExplorer(queryRaw: string) {
    const q = queryRaw.trim();
    const qLower = q.toLowerCase();

    // Match local/API recorded tasks by ID, datasetHash, proofHash, reportHash, clientAddress, or txHash
    const matchedTasks = craftStore.state.tasks.filter(
      (t) =>
        t.id.toLowerCase().includes(qLower) ||
        (t.datasetHash && t.datasetHash.toLowerCase() === qLower) ||
        (t.outputProofHash && t.outputProofHash.toLowerCase() === qLower) ||
        (t.reportHash && t.reportHash.toLowerCase() === qLower) ||
        (t.calculationsHash && t.calculationsHash.toLowerCase() === qLower) ||
        (t.onChainTxHash && t.onChainTxHash.toLowerCase() === qLower) ||
        t.clientAddress.toLowerCase() === qLower
    );

    const matchedAgents = craftStore.state.agents.filter(
      (a) =>
        a.id.toLowerCase().includes(qLower) ||
        a.slug.toLowerCase().includes(qLower) ||
        a.walletAddress.toLowerCase() === qLower ||
        (a.agentIdTokenId && a.agentIdTokenId.toLowerCase().includes(qLower))
    );

    const matchedEvents = craftStore.state.events.filter(
      (e) =>
        e.taskId.toLowerCase().includes(qLower) ||
        (e.txHash && e.txHash.toLowerCase() === qLower) ||
        (e.proofHash && e.proofHash.toLowerCase() === qLower) ||
        e.wallet.toLowerCase() === qLower
    );

    let onChainWalletCheck = null;
    if (isAddress(q)) {
      onChainWalletCheck = await this.verifyWalletAgentIdOnChain(q);
    }

    let onChainTxCheck = null;
    if (/^0x[a-fA-F0-9]{64}$/.test(q) && matchedTasks.length === 0) {
      onChainTxCheck = await this.inspectTxOnBsc(q);
    }

    return {
      query: q,
      contractAddress: OFFICIAL_AGENT_ID_CONTRACT_BSC,
      matchedTasks,
      matchedAgents,
      matchedEvents,
      onChainWalletCheck,
      onChainTxCheck,
      verifiedAt: new Date().toISOString(),
    };
  }
}

export const trustRpcVerifier = new TrustRpcVerifier();
