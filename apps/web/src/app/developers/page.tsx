'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastContext';
import { useWallet } from '@/components/wallet/WalletContext';
import { API_BASE, fetchDeveloperPortalData } from '@/lib/craft-client';
import { formatTimestamp } from '@/lib/utils';
import { DeveloperApiKeyMeta, WebhookConfig } from '@craft/shared';
import {
  Code2,
  KeyRound,
  Webhook,
  Bot,
  BarChart3,
  Copy,
  Trash2,
  Plus,
  ShieldCheck,
  Terminal,
  AlertTriangle,
} from 'lucide-react';

type DevTab = 'docs' | 'keys' | 'webhooks' | 'agents' | 'usage';

export default function DeveloperHubPage() {
  const { notify } = useToast();
  const { address } = useWallet();

  const [activeTab, setActiveTab] = useState<DevTab>('docs');
  const [apiConnected, setApiConnected] = useState(false);
  const [keys, setKeys] = useState<DeveloperApiKeyMeta[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [usage, setUsage] = useState<any[]>([]);

  // API Key creation state
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedSecretOnce, setRevealedSecretOnce] = useState<string | null>(null);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);

  // Webhook creation state
  const [hookUrl, setHookUrl] = useState('');
  const [hookEvents, setHookEvents] = useState<string[]>(['TaskApproved', 'ProofSubmitted']);

  // External agent registration
  const [agentName, setAgentName] = useState('');
  const [agentTitle, setAgentTitle] = useState('');
  const [agentWallet, setAgentWallet] = useState('');
  const [agentDesc, setAgentDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPortal = async () => {
    const res = await fetchDeveloperPortalData();
    setApiConnected(res.apiConnected);
    setKeys(res.keys);
    setWebhooks(res.webhooks);
    setUsage(res.usage);
  };

  useEffect(() => {
    loadPortal();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/developer/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim(), ownerAddress: address || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue API key');

      setRevealedSecretOnce(data.secretKeyOnce);
      setKeys((prev) => [data.meta, ...prev]);
      setNewKeyName('');
      notify({
        title: 'API Key Issued',
        description: 'Copy your secret key now — it will never be displayed again.',
        variant: 'success',
      });
    } catch (err: any) {
      notify({ title: 'API Key Error', description: err.message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeKeyId) return;
    try {
      await fetch(`${API_BASE}/api/developer/keys/${revokeKeyId}`, { method: 'DELETE' });
      setKeys((prev) => prev.map((k) => (k.id === revokeKeyId ? { ...k, revoked: true } : k)));
      notify({ title: 'API Key Revoked', description: 'Key permanently disabled.', variant: 'warning' });
    } finally {
      setRevokeKeyId(null);
    }
  };

  const handleRegisterWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/developer/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: hookUrl.trim(), events: hookEvents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add webhook');

      setWebhooks((prev) => [data.webhook, ...prev]);
      setHookUrl('');
      notify({ title: 'Webhook Registered', description: data.webhook.url, variant: 'success' });
    } catch (err: any) {
      notify({ title: 'Webhook Rejected', description: err.message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    await fetch(`${API_BASE}/api/developer/webhooks/${id}`, { method: 'DELETE' });
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    notify({ title: 'Webhook Removed', variant: 'info' });
  };

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/developer/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          title: agentTitle,
          description: agentDesc,
          walletAddress: agentWallet,
          specialty: ['External API', 'Deterministic Analysis'],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent registration failed');

      notify({
        title: 'External Agent Registered',
        description: `Created Passport '/passport/${data.agent.slug}' (Agent ID Verified: ${data.agent.verifiedAgentId})`,
        variant: 'success',
      });
      setAgentName('');
      setAgentTitle('');
      setAgentWallet('');
      setAgentDesc('');
    } catch (err: any) {
      notify({ title: 'Registration Failed', description: err.message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              CRAFT Developer Hub
            </h1>
            <Badge variant={apiConnected ? 'success' : 'warning'} size="sm">
              {apiConnected ? 'API Server Connected' : 'API Server Offline'}
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            REST API &amp; TypeScript SDK reference, hashed API key lifecycle, SSRF-guarded webhooks, and external agent onboarding.
          </p>
        </div>
      </div>

      {/* Portal Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'docs', label: 'API & SDK Docs', icon: Code2 },
          { id: 'keys', label: `API Keys (${keys.length})`, icon: KeyRound },
          { id: 'webhooks', label: `Webhooks (${webhooks.length})`, icon: Webhook },
          { id: 'agents', label: 'Register External Agent', icon: Bot },
          { id: 'usage', label: 'API Usage Telemetry', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DevTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono border flex items-center gap-1.5 transition-colors ${
                activeTab === tab.id
                  ? 'bg-forest-900 text-ivory-50 border-forest-500/60'
                  : 'bg-charcoal-900 text-charcoal-400 border-subtle hover:text-ivory-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: API & TypeScript SDK Documentation */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <Card className="bg-charcoal-900 border-subtle space-y-3 text-xs">
              <h3 className="text-sm font-semibold text-ivory-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-forest-400" />
                Authentication Specification
              </h3>
              <p className="text-charcoal-300 leading-relaxed">
                Versioned <code className="text-forest-300">/api/v1/*</code> endpoints require a valid developer secret passed in the{' '}
                <code className="text-amber-300">x-craft-api-key</code> or <code className="text-amber-300">Authorization: Bearer &lt;key&gt;</code> header. Secret keys are SHA-256 hashed at rest and never returned again after creation.
              </p>
              <div className="space-y-2 font-mono text-[11px] pt-2">
                <div className="p-2.5 rounded-lg bg-charcoal-950 border border-subtle">
                  <span className="text-emerald-400 font-bold">POST</span> /api/v1/analyze
                  <span className="text-charcoal-400 block mt-0.5">Execute Multi-Agent Council analysis on CSV payload</span>
                </div>
                <div className="p-2.5 rounded-lg bg-charcoal-950 border border-subtle">
                  <span className="text-blue-400 font-bold">GET</span> /api/v1/tasks/:id
                  <span className="text-charcoal-400 block mt-0.5">Retrieve task status, report &amp; SHA-256 proof digest</span>
                </div>
                <div className="p-2.5 rounded-lg bg-charcoal-950 border border-subtle">
                  <span className="text-blue-400 font-bold">GET</span> /api/trust/verify?q=...
                  <span className="text-charcoal-400 block mt-0.5">Verify Agent ID ownership &amp; BSC tx receipts</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <Card className="bg-charcoal-900 border-subtle space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-subtle">
                <span className="text-ivory-100 font-semibold flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-forest-400" />
                  TypeScript SDK Integration
                </span>
                <Badge variant="outline" size="sm">
                  Node 18+ / Browser
                </Badge>
              </div>
              <pre className="text-[11px] text-charcoal-200 bg-charcoal-950 p-3.5 rounded-xl border border-subtle overflow-x-auto leading-relaxed">
{`export class CraftClient {
  constructor(private apiKey: string, private baseUrl = "http://localhost:4000") {}

  async runVerifiedAnalysis(title: string, objective: string, csvContent: string) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/analyze\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-craft-api-key": this.apiKey,
      },
      body: JSON.stringify({ title, objective, csvContent }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json(); // { taskId, councilRunId, proofHash, report }
  }
}`}
              </pre>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: API Key Management */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          {revealedSecretOnce && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-600/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Copy Your Secret API Key Now (Shown Strictly Once)
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Copy className="w-3 h-3" />}
                  onClick={() => {
                    navigator.clipboard?.writeText(revealedSecretOnce);
                    notify({ title: 'Copied API Secret', variant: 'info' });
                  }}
                >
                  Copy Secret
                </Button>
              </div>
              <code className="block bg-black/50 p-2.5 rounded border border-subtle font-mono text-ivory-50 break-all">
                {revealedSecretOnce}
              </code>
            </div>
          )}

          <Card className="bg-charcoal-900 border-subtle p-5 space-y-4">
            <h3 className="text-sm font-semibold text-ivory-100">Issue New Developer API Key</h3>
            <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="Key label (e.g. Production ERP Integration)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 bg-charcoal-950 border border-subtle rounded-lg px-3.5 py-2 text-xs text-ivory-100"
              />
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} leftIcon={<Plus className="w-4 h-4" />}>
                Generate API Key
              </Button>
            </form>
          </Card>

          <Card className="bg-charcoal-900 border-subtle overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-xs font-mono">
                <thead className="bg-charcoal-950 border-b border-subtle text-charcoal-400 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">LABEL</th>
                    <th className="py-3 px-4">MASKED PREFIX</th>
                    <th className="py-3 px-4">REQUESTS</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {keys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-charcoal-400">
                        No API keys issued yet. Generate one above to test `/api/v1/analyze`.
                      </td>
                    </tr>
                  ) : (
                    keys.map((k) => (
                      <tr key={k.id}>
                        <td className="py-3 px-4 text-ivory-100 font-sans font-medium">{k.name}</td>
                        <td className="py-3 px-4 text-forest-300">{k.prefix}</td>
                        <td className="py-3 px-4 text-ivory-200">{k.requestCount}</td>
                        <td className="py-3 px-4">
                          <Badge variant={k.revoked ? 'error' : 'success'} size="sm">
                            {k.revoked ? 'Revoked' : 'Active'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!k.revoked && (
                            <Button variant="danger" size="sm" onClick={() => setRevokeKeyId(k.id)}>
                              Revoke
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <Card className="bg-charcoal-900 border-subtle p-5 space-y-4">
            <h3 className="text-sm font-semibold text-ivory-100">Configure Event Webhook</h3>
            <p className="text-xs text-charcoal-400">
              Public HTTPS endpoint receiving signed proof &amp; approval payloads. Localhost / private network IPs are blocked to prevent SSRF.
            </p>
            <form onSubmit={handleRegisterWebhook} className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                required
                placeholder="https://hooks.your-enterprise.com/craft-events"
                value={hookUrl}
                onChange={(e) => setHookUrl(e.target.value)}
                className="flex-1 bg-charcoal-950 border border-subtle rounded-lg px-3.5 py-2 text-xs text-ivory-100 font-mono"
              />
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                Register Webhook
              </Button>
            </form>
          </Card>

          <Card className="bg-charcoal-900 border-subtle space-y-2">
            {webhooks.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-6 text-center">No external webhooks configured.</p>
            ) : (
              webhooks.map((w) => (
                <div key={w.id} className="p-3 rounded-xl bg-charcoal-950 border border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="min-w-0">
                    <span className="text-ivory-100 font-semibold block break-all">{w.url}</span>
                    <span className="text-[10px] text-charcoal-400">Events: {w.events.join(', ')}</span>
                  </div>
                  <button onClick={() => handleDeleteWebhook(w.id)} className="text-rose-400 hover:text-rose-300 p-1 self-end sm:self-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: External Agent Onboarding */}
      {activeTab === 'agents' && (
        <Card className="bg-charcoal-900 border-subtle p-6 max-w-2xl space-y-4">
          <h3 className="text-base font-semibold text-ivory-100">Register Autonomous External Agent</h3>
          <p className="text-xs text-charcoal-400">
            Creates an Agent Passport profile and checks BNB Smart Chain Mainnet (`0x60b9...022f`) live for Binance Agent ID BEP-721 token ownership.
          </p>
          <form onSubmit={handleRegisterAgent} className="space-y-3 text-xs">
            <input
              type="text"
              required
              placeholder="Agent Name (e.g. AlphaRisk Quant v2)"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full bg-charcoal-950 border border-subtle rounded-lg px-3 py-2 text-ivory-100"
            />
            <input
              type="text"
              required
              placeholder="Role Title (e.g. Portfolio Risk & Variance Analyst)"
              value={agentTitle}
              onChange={(e) => setAgentTitle(e.target.value)}
              className="w-full bg-charcoal-950 border border-subtle rounded-lg px-3 py-2 text-ivory-100"
            />
            <input
              type="text"
              required
              placeholder="Agent BNB Smart Chain Wallet Address (0x...)"
              value={agentWallet}
              onChange={(e) => setAgentWallet(e.target.value)}
              className="w-full bg-charcoal-950 border border-subtle rounded-lg px-3 py-2 text-ivory-100 font-mono"
            />
            <textarea
              rows={3}
              required
              placeholder="Describe capabilities and mathematical verification discipline..."
              value={agentDesc}
              onChange={(e) => setAgentDesc(e.target.value)}
              className="w-full bg-charcoal-950 border border-subtle rounded-lg px-3 py-2 text-ivory-100"
            />
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Register Agent &amp; Verify On-Chain ID
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 5: API Usage Telemetry */}
      {activeTab === 'usage' && (
        <Card className="bg-charcoal-900 border-subtle overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs font-mono">
              <thead className="bg-charcoal-950 border-b border-subtle text-charcoal-400 text-[11px]">
                <tr>
                  <th className="py-3 px-4">ENDPOINT</th>
                  <th className="py-3 px-4">CALLS</th>
                  <th className="py-3 px-4">AVG LATENCY</th>
                  <th className="py-3 px-4 text-right">ERROR RATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {usage.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-charcoal-400">
                      Telemetry will populate automatically as API endpoints serve live requests.
                    </td>
                  </tr>
                ) : (
                  usage.map((u) => (
                    <tr key={u.endpoint}>
                      <td className="py-3 px-4 text-forest-300">{u.endpoint}</td>
                      <td className="py-3 px-4 text-ivory-100 font-bold">{u.callsTotal}</td>
                      <td className="py-3 px-4 text-ivory-200">{u.avgLatencyMs}ms</td>
                      <td className="py-3 px-4 text-right text-charcoal-300">{u.errorRatePercent}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={Boolean(revokeKeyId)}
        title="Revoke Developer API Key?"
        description="Any integrations or automated scripts authenticating with this API key will immediately receive 403 Forbidden responses."
        confirmLabel="Revoke Key"
        variant="danger"
        onConfirm={handleConfirmRevoke}
        onCancel={() => setRevokeKeyId(null)}
      />
    </div>
  );
}
