import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { isAddress } from 'viem';
import {
  AgentProfile,
  DeveloperApiKeyMeta,
  OFFICIAL_AGENT_ID_CONTRACT_BSC,
  WebhookConfig,
} from '@craft/shared';
import { craftStore, StoredApiKey } from '../store/craft-store';
import { trustRpcVerifier } from '../trust/rpc-verifier';

function isSafeWebhookUrl(urlString: string): { valid: boolean; reason?: string } {
  try {
    const u = new URL(urlString);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') {
      return { valid: false, reason: 'Only HTTPS/HTTP webhook protocols are allowed.' };
    }
    const host = u.hostname.toLowerCase();
    // SSRF guard against loopback / metadata / RFC1918
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.startsWith('169.254.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return { valid: false, reason: 'Private, loopback, or metadata IP addresses are blocked for security.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format.' };
  }
}

export class DeveloperService {
  /**
   * Generates a new API key. Secret key is returned ONCE; only SHA-256 hash is persisted.
   */
  public createApiKey(params: {
    name: string;
    scopes?: string[];
    ownerAddress?: string;
  }): { meta: DeveloperApiKeyMeta; secretKeyOnce: string } {
    const rawSecret = `craft_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
    const prefix = rawSecret.slice(0, 16) + '...';

    const stored: StoredApiKey = {
      id: `key_${crypto.randomBytes(6).toString('hex')}`,
      name: params.name.trim() || 'Enterprise API Key',
      prefix,
      scopes: params.scopes?.length ? params.scopes : ['tasks:read', 'tasks:write', 'analyze:run'],
      createdAt: new Date().toISOString(),
      requestCount: 0,
      revoked: false,
      ownerAddress: params.ownerAddress,
      keyHash,
    };

    craftStore.state.apiKeys.unshift(stored);
    craftStore.addAuditLog({
      category: 'API',
      action: 'API_KEY_CREATED',
      actor: params.ownerAddress || 'developer-console',
      resourceId: stored.id,
      details: `Issued API key '${stored.name}' (${stored.prefix})`,
      severity: 'info',
    });
    craftStore.save();

    const { keyHash: _omitted, ...safeMeta } = stored;
    return { meta: safeMeta, secretKeyOnce: rawSecret };
  }

  public listApiKeys(): DeveloperApiKeyMeta[] {
    return craftStore.state.apiKeys.map(({ keyHash: _omitted, ...meta }) => meta);
  }

  public revokeApiKey(id: string): boolean {
    const key = craftStore.state.apiKeys.find((k) => k.id === id);
    if (!key) return false;
    key.revoked = true;
    craftStore.addAuditLog({
      category: 'API',
      action: 'API_KEY_REVOKED',
      actor: key.ownerAddress || 'developer-console',
      resourceId: id,
      details: `Revoked API key '${key.name}' (${key.prefix})`,
      severity: 'warning',
    });
    craftStore.save();
    return true;
  }

  public verifyKeyAndTrack(rawKey: string): StoredApiKey | null {
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const found = craftStore.state.apiKeys.find((k) => k.keyHash === hash && !k.revoked);
    if (!found) return null;
    found.requestCount += 1;
    found.lastUsedAt = new Date().toISOString();
    craftStore.save();
    return found;
  }

  public registerWebhook(params: { url: string; events: string[] }): WebhookConfig {
    const check = isSafeWebhookUrl(params.url);
    if (!check.valid) {
      throw new Error(check.reason || 'Unsafe webhook URL.');
    }

    const hook: WebhookConfig = {
      id: `wh_${crypto.randomBytes(5).toString('hex')}`,
      url: params.url,
      events: params.events?.length ? params.events : ['TaskApproved', 'ProofSubmitted'],
      active: true,
      createdAt: new Date().toISOString(),
    };
    craftStore.state.webhooks.unshift(hook);
    craftStore.addAuditLog({
      category: 'API',
      action: 'WEBHOOK_REGISTERED',
      actor: 'developer-console',
      resourceId: hook.id,
      details: `Registered webhook endpoint ${hook.url}`,
      severity: 'info',
    });
    craftStore.save();
    return hook;
  }

  public deleteWebhook(id: string): boolean {
    const before = craftStore.state.webhooks.length;
    craftStore.state.webhooks = craftStore.state.webhooks.filter((w) => w.id !== id);
    if (craftStore.state.webhooks.length !== before) {
      craftStore.save();
      return true;
    }
    return false;
  }

  public async registerExternalAgent(params: {
    name: string;
    title: string;
    description: string;
    walletAddress: string;
    specialty: string[];
  }): Promise<AgentProfile> {
    if (!isAddress(params.walletAddress)) {
      throw new Error('Valid EVM wallet address required to register an external AI Agent.');
    }

    // Check real on-chain Binance Agent ID ownership
    const check = await trustRpcVerifier.verifyWalletAgentIdOnChain(params.walletAddress);
    const slug = params.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `agent-${Date.now()}`;

    const newAgent: AgentProfile = {
      id: `agent-ext-${crypto.randomBytes(3).toString('hex')}`,
      name: params.name.trim(),
      slug: `${slug}-${crypto.randomBytes(2).toString('hex')}`,
      roleKey: 'external',
      title: params.title.trim() || 'External Autonomous Agent',
      description: params.description.trim(),
      walletAddress: params.walletAddress,
      avatarUrl: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=150&auto=format&fit=crop&q=80',
      specialty: params.specialty?.length ? params.specialty : ['REST API Integration', 'Deterministic Analysis'],
      supportedFormats: ['CSV', 'JSON'],
      verifiedAgentId: check.hasAgentId,
      agentIdTokenId: check.hasAgentId ? `Verified-BEP721 (${check.balance})` : 'Unverified (0 BEP-721 Held)',
      agentIdContract: OFFICIAL_AGENT_ID_CONTRACT_BSC,
      tasksCompleted: 0,
      reputationScore: 50,
      approvalRate: 0,
      totalApprovals: 0,
      totalRevisions: 0,
      qualityScoreAvg: 0,
      reliabilityScore: 100,
      avgExecutionTimeSec: 0,
      isAvailable: true,
      isDemoSeed: false,
      craftCredentials: {
        tier: 'Seed',
        issuedBy: 'CRAFT Reputation Protocol',
        reputationScore: 50,
        approvalRate: 0,
        reliabilityScore: 100,
        qualityScoreAvg: 0,
        minimumSampleThreshold: 5,
        meetsRankingMinimum: false,
        badges: check.hasAgentId ? ['On-Chain Agent ID Holder'] : ['Pending Agent ID Mint'],
      },
      achievements: [],
      performanceHistory: [],
    };

    craftStore.state.agents.push(newAgent);
    craftStore.addAuditLog({
      category: 'AUTH',
      action: 'EXTERNAL_AGENT_REGISTERED',
      actor: params.walletAddress,
      resourceId: newAgent.id,
      details: `Registered agent '${newAgent.name}' (AgentID BEP-721 verified: ${check.hasAgentId})`,
      severity: 'info',
    });
    craftStore.save();
    return newAgent;
  }

  public getUsageMetrics() {
    const entries = Object.entries(craftStore.state.endpointCalls).map(([endpoint, data]) => ({
      endpoint,
      callsTotal: data.calls,
      avgLatencyMs: data.calls > 0 ? Math.round(data.totalLatencyMs / data.calls) : 0,
      errorRatePercent: data.calls > 0 ? Number(((data.errors / data.calls) * 100).toFixed(2)) : 0,
    }));
    return entries;
  }
}

export const developerService = new DeveloperService();

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const headerKey =
    (req.headers['x-craft-api-key'] as string) ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!headerKey) {
    return res.status(401).json({
      error: 'MISSING_API_KEY',
      message: 'Provide your CRAFT API key via x-craft-api-key or Authorization: Bearer <key> header.',
    });
  }

  const valid = developerService.verifyKeyAndTrack(headerKey);
  if (!valid) {
    return res.status(403).json({
      error: 'INVALID_OR_REVOKED_API_KEY',
      message: 'The supplied API key is invalid or has been revoked.',
    });
  }

  (req as any).apiKeyMeta = valid;
  next();
}
