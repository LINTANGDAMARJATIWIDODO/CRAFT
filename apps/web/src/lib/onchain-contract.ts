import { createPublicClient, encodeFunctionData, fallback, http, keccak256, stringToHex } from 'viem';
import { bsc, bscTestnet } from 'viem/chains';
import { SUPPORTED_NETWORKS } from './constants';

export const TASK_REGISTRY_ADDRESS =
  (process.env.NEXT_PUBLIC_TASK_REGISTRY_ADDRESS || '').trim();

export const TASK_REGISTRY_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_TASK_REGISTRY_CHAIN_ID || '56'
);

export const TASK_REGISTRY_ABI = [
  {
    name: 'verifyAndCheckInAgentId',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'capabilityTag', type: 'string' }],
    outputs: [],
  },
  {
    name: 'commitVerifiedWork',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'datasetHash', type: 'bytes32' },
      { name: 'configHash', type: 'bytes32' },
      { name: 'evidenceHash', type: 'bytes32' },
      { name: 'proofHash', type: 'bytes32' },
      { name: 'objectiveURI', type: 'string' },
    ],
    outputs: [{ name: 'taskId', type: 'uint256' }],
  },
  {
    name: 'taskCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'uniqueAgentIdCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'uniqueInteractingAgentIds',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'enforceAgentIdCheck',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export function isTaskRegistryConfigured(): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(TASK_REGISTRY_ADDRESS);
}

export function normalizeBytes32(value?: string): `0x${string}` {
  if (value && /^0x[a-fA-F0-9]{64}$/.test(value.trim())) {
    return value.trim().toLowerCase() as `0x${string}`;
  }
  return keccak256(stringToHex(value || 'craft-digest'));
}

function getBscClient(chainId = TASK_REGISTRY_CHAIN_ID) {
  const isTestnet = chainId === 97;
  return createPublicClient({
    chain: isTestnet ? bscTestnet : bsc,
    transport: isTestnet
      ? fallback([
          http('https://bsc-testnet-rpc.publicnode.com', { timeout: 5000, retryCount: 0 }),
          http('https://data-seed-prebsc-1-s1.binance.org:8545/', { timeout: 4000, retryCount: 0 }),
        ])
      : fallback([
          http('https://bsc.publicnode.com', { timeout: 5000, retryCount: 0 }),
          http('https://bsc-dataseed.binance.org/', { timeout: 4000, retryCount: 0 }),
        ]),
  });
}

async function ensureTargetChain(provider: any, targetChainId: number): Promise<void> {
  const hexChainId = '0x' + targetChainId.toString(16);
  const currentHex = await provider.request({ method: 'eth_chainId' }).catch(() => null);
  const currentId = currentHex ? parseInt(currentHex, 16) : null;
  if (currentId === targetChainId) return;

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      const net = SUPPORTED_NETWORKS.find((n) => n.id === targetChainId);
      if (net) {
        await provider.request({
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
      }
    } else {
      throw err;
    }
  }
}

export interface OnChainTxReceiptInfo {
  txHash: string;
  blockNumber: number;
  chainId: number;
  contractAddress: string;
  bscScanUrl: string;
}

export async function commitWorkOnBsc(params: {
  provider: any;
  account: string;
  datasetHash?: string;
  configHash?: string;
  evidenceHash?: string;
  proofHash?: string;
  objective: string;
}): Promise<OnChainTxReceiptInfo> {
  if (!isTaskRegistryConfigured()) {
    throw new Error('NEXT_PUBLIC_TASK_REGISTRY_ADDRESS is not configured for Mainnet/Testnet anchoring yet.');
  }
  if (!params.provider || !params.account) {
    throw new Error('Connected Binance Web3 Wallet / browser wallet signer is required for on-chain confirmation.');
  }

  await ensureTargetChain(params.provider, TASK_REGISTRY_CHAIN_ID);

  const data = encodeFunctionData({
    abi: TASK_REGISTRY_ABI,
    functionName: 'commitVerifiedWork',
    args: [
      normalizeBytes32(params.datasetHash),
      normalizeBytes32(params.configHash),
      normalizeBytes32(params.evidenceHash),
      normalizeBytes32(params.proofHash),
      params.objective.slice(0, 140),
    ],
  });

  // Always sends tx through user wallet for explicit manual confirmation (Binance security compliance)
  const txHash = (await params.provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: params.account,
        to: TASK_REGISTRY_ADDRESS,
        data,
      },
    ],
  })) as `0x${string}`;

  const client = getBscClient(TASK_REGISTRY_CHAIN_ID);
  const receipt = await client.waitForTransactionReceipt({ hash: txHash, timeout: 45_000 });

  const explorerBase = TASK_REGISTRY_CHAIN_ID === 97 ? 'https://testnet.bscscan.com' : 'https://bscscan.com';
  return {
    txHash,
    blockNumber: Number(receipt.blockNumber),
    chainId: TASK_REGISTRY_CHAIN_ID,
    contractAddress: TASK_REGISTRY_ADDRESS,
    bscScanUrl: `${explorerBase}/tx/${txHash}`,
  };
}

export async function checkInAgentIdOnBsc(params: {
  provider: any;
  account: string;
  capabilityTag: string;
}): Promise<OnChainTxReceiptInfo> {
  if (!isTaskRegistryConfigured()) {
    throw new Error('NEXT_PUBLIC_TASK_REGISTRY_ADDRESS is not configured for Mainnet/Testnet check-in yet.');
  }
  if (!params.provider || !params.account) {
    throw new Error('Connected Binance Web3 Wallet / browser wallet signer is required.');
  }

  await ensureTargetChain(params.provider, TASK_REGISTRY_CHAIN_ID);

  const data = encodeFunctionData({
    abi: TASK_REGISTRY_ABI,
    functionName: 'verifyAndCheckInAgentId',
    args: [params.capabilityTag.slice(0, 64) || 'craft-agent-id-holder'],
  });

  const txHash = (await params.provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: params.account,
        to: TASK_REGISTRY_ADDRESS,
        data,
      },
    ],
  })) as `0x${string}`;

  const client = getBscClient(TASK_REGISTRY_CHAIN_ID);
  const receipt = await client.waitForTransactionReceipt({ hash: txHash, timeout: 45_000 });
  const explorerBase = TASK_REGISTRY_CHAIN_ID === 97 ? 'https://testnet.bscscan.com' : 'https://bscscan.com';

  return {
    txHash,
    blockNumber: Number(receipt.blockNumber),
    chainId: TASK_REGISTRY_CHAIN_ID,
    contractAddress: TASK_REGISTRY_ADDRESS,
    bscScanUrl: `${explorerBase}/tx/${txHash}`,
  };
}

export async function readOnChainRegistryStats(): Promise<{
  configured: boolean;
  contractAddress: string | null;
  chainId: number;
  taskCount: number;
  uniqueAgentIdCount: number;
  enforceAgentIdCheck: boolean;
}> {
  if (!isTaskRegistryConfigured()) {
    return {
      configured: false,
      contractAddress: null,
      chainId: TASK_REGISTRY_CHAIN_ID,
      taskCount: 0,
      uniqueAgentIdCount: 0,
      enforceAgentIdCheck: true,
    };
  }

  try {
    const client = getBscClient(TASK_REGISTRY_CHAIN_ID);
    const [tasksNum, uniqueNum, enforced] = await Promise.all([
      client.readContract({
        address: TASK_REGISTRY_ADDRESS as `0x${string}`,
        abi: TASK_REGISTRY_ABI,
        functionName: 'taskCount',
      }),
      client.readContract({
        address: TASK_REGISTRY_ADDRESS as `0x${string}`,
        abi: TASK_REGISTRY_ABI,
        functionName: 'uniqueAgentIdCount',
      }),
      client.readContract({
        address: TASK_REGISTRY_ADDRESS as `0x${string}`,
        abi: TASK_REGISTRY_ABI,
        functionName: 'enforceAgentIdCheck',
      }),
    ]);

    return {
      configured: true,
      contractAddress: TASK_REGISTRY_ADDRESS,
      chainId: TASK_REGISTRY_CHAIN_ID,
      taskCount: Number(tasksNum),
      uniqueAgentIdCount: Number(uniqueNum),
      enforceAgentIdCheck: Boolean(enforced),
    };
  } catch {
    return {
      configured: true,
      contractAddress: TASK_REGISTRY_ADDRESS,
      chainId: TASK_REGISTRY_CHAIN_ID,
      taskCount: 0,
      uniqueAgentIdCount: 0,
      enforceAgentIdCheck: true,
    };
  }
}
