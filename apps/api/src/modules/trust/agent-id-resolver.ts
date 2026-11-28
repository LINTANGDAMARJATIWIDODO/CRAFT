import { OFFICIAL_AGENT_ID_CONTRACT_BSC } from '@craft/shared';
import { trustRpcVerifier } from './rpc-verifier';

export interface AgentIdResolveResult {
  query: string;
  inputType: 'domain' | 'address' | 'invalid';
  domainName: string | null;
  resolvedAddress: string | null;
  hasAgentId: boolean;
  balance: number;
  contractAddress: string;
  network: string;
  rpcReachable: boolean;
  bscScanUrl?: string;
  note: string;
}

const DOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(ai|bnb|eth)$/i;
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

async function fetchJsonSafe<T>(url: string, timeoutMs = 4500): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveAgentIdentity(rawQuery: string): Promise<AgentIdResolveResult> {
  const query = rawQuery.trim();
  if (!query) {
    return {
      query: '',
      inputType: 'invalid',
      domainName: null,
      resolvedAddress: null,
      hasAgentId: false,
      balance: 0,
      contractAddress: OFFICIAL_AGENT_ID_CONTRACT_BSC,
      network: 'BNB Smart Chain Mainnet (56)',
      rpcReachable: false,
      note: 'Provide a SPACE ID .ai/.bnb domain or a valid 0x wallet address.',
    };
  }

  let resolvedAddress: string | null = null;
  let domainName: string | null = null;
  let inputType: 'domain' | 'address' | 'invalid' = 'invalid';

  if (ADDRESS_REGEX.test(query)) {
    inputType = 'address';
    resolvedAddress = query;
    const rev = await fetchJsonSafe<{ code?: number; data?: { name?: string } }>(
      `https://nameapi.space.id/getName?chainid=56&address=${encodeURIComponent(query)}`
    );
    if (rev?.code === 0 && rev.data?.name) {
      domainName = rev.data.name;
    }
  } else if (DOMAIN_REGEX.test(query)) {
    inputType = 'domain';
    domainName = query.toLowerCase();
    const fwd = await fetchJsonSafe<{ code?: number; address?: string; msg?: string }>(
      `https://nameapi.space.id/getAddress?domain=${encodeURIComponent(domainName)}`
    );
    if (fwd?.code === 0 && fwd.address && ADDRESS_REGEX.test(fwd.address) && fwd.address !== '0x0000000000000000000000000000000000000000') {
      resolvedAddress = fwd.address;
    } else {
      return {
        query,
        inputType: 'domain',
        domainName,
        resolvedAddress: null,
        hasAgentId: false,
        balance: 0,
        contractAddress: OFFICIAL_AGENT_ID_CONTRACT_BSC,
        network: 'BNB Smart Chain Mainnet (56)',
        rpcReachable: true,
        note: `No primary wallet address resolved for '${domainName}' on SPACE ID / BNB Chain.`,
      };
    }
  } else {
    return {
      query,
      inputType: 'invalid',
      domainName: null,
      resolvedAddress: null,
      hasAgentId: false,
      balance: 0,
      contractAddress: OFFICIAL_AGENT_ID_CONTRACT_BSC,
      network: 'BNB Smart Chain Mainnet (56)',
      rpcReachable: false,
      note: 'Input must be a valid BSC wallet address (0x...) or domain name (e.g., agentname.ai or name.bnb).',
    };
  }

  const onChain = await trustRpcVerifier.verifyWalletAgentIdOnChain(resolvedAddress);

  return {
    query,
    inputType,
    domainName,
    resolvedAddress: onChain.address,
    hasAgentId: onChain.hasAgentId,
    balance: onChain.balance,
    contractAddress: onChain.contractAddress,
    network: onChain.network,
    rpcReachable: onChain.rpcReachable,
    bscScanUrl: onChain.bscScanUrl,
    note: domainName
      ? `${domainName} -> ${onChain.address}. ${onChain.note}`
      : onChain.note,
  };
}
