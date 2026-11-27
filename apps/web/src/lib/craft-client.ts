import {
  AgentProfile,
  AuditLogEntry,
  BlockchainEventRecord,
  CouncilExecutionRun,
  DeveloperApiKeyMeta,
  LeaderboardCategory,
  LeaderboardEntry,
  OFFICIAL_AGENT_ID_CONTRACT_BSC,
  PlatformMetricsSnapshot,
  RecurringJobConfig,
  TaskRecord,
  TaskState,
  WebhookConfig,
  WorkflowDefinition,
  WorkflowExecutionRecord,
} from '@craft/shared';
import { INITIAL_AGENTS } from './constants';
import { getStoredTasks, saveStoredTasks } from './task-store';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const LOCAL_COUNCIL_KEY = 'craft_council_runs_v1';
const LOCAL_WORKFLOWS_KEY = 'craft_workflows_v1';
const LOCAL_WF_EXEC_KEY = 'craft_wf_executions_v1';

async function fetchJsonWithTimeout<T>(url: string, init?: RequestInit, timeoutMs = 4500): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function getLocalFallbackMetrics(): PlatformMetricsSnapshot {
  const tasks = getStoredTasks();
  const activeTasksCount = tasks.filter(
    (t) =>
      t.status === TaskState.Created ||
      t.status === TaskState.Accepted ||
      t.status === TaskState.InProgress ||
      t.status === TaskState.Submitted
  ).length;
  const completedJobsCount = tasks.filter((t) => t.status === TaskState.Approved).length;
  const verificationsCount = tasks.filter((t) => Boolean(t.outputProofHash)).length;

  const recentEvents: BlockchainEventRecord[] = tasks.slice(0, 6).map((t, i) => ({
    id: `local-evt-${t.id}-${i}`,
    eventName:
      t.status === TaskState.Approved
        ? 'TaskApproved'
        : t.status === TaskState.Submitted
        ? 'ProofSubmitted'
        : t.status === TaskState.InProgress
        ? 'TaskStarted'
        : 'TaskCreated',
    taskId: t.id,
    txHash: t.onChainTxHash,
    chainId: 56,
    wallet: t.clientAddress,
    proofHash: t.outputProofHash || t.datasetHash,
    timestamp: t.approvedAt || t.submittedAt || t.createdAt,
    verificationTier: t.verificationTier || (t.isDemo ? 'demonstration_seed' : 'local_verified_digest'),
    statusLabel: t.isDemo
      ? 'Sample Seed Reference'
      : t.onChainTxHash
      ? 'Anchored On-Chain'
      : 'Local SHA-256 Verified Digest',
  }));

  return {
    verifiedAgentsCount: INITIAL_AGENTS.filter((a) => a.verifiedAgentId).length,
    activeTasksCount,
    completedJobsCount,
    successfulVerificationsCount: verificationsCount,
    liveRecordsCount: tasks.filter((t) => !t.isDemo).length,
    demoRecordsCount: tasks.filter((t) => t.isDemo).length,
    officialAgentIdContract: OFFICIAL_AGENT_ID_CONTRACT_BSC,
    latestBscBlock: null,
    recentEvents,
    generatedAt: new Date().toISOString(),
  };
}

export async function fetchPlatformMetrics(): Promise<{
  metrics: PlatformMetricsSnapshot;
  apiConnected: boolean;
}> {
  const remote = await fetchJsonWithTimeout<PlatformMetricsSnapshot>(`${API_BASE}/api/metrics`, undefined, 3000);
  if (remote) {
    return { metrics: remote, apiConnected: true };
  }
  return { metrics: getLocalFallbackMetrics(), apiConnected: false };
}

export async function fetchTasksUnified(): Promise<{ tasks: TaskRecord[]; apiConnected: boolean }> {
  const remote = await fetchJsonWithTimeout<{ tasks: TaskRecord[] }>(`${API_BASE}/api/tasks`, undefined, 3000);
  if (remote?.tasks) {
    // Merge live tasks seamlessly with any local browser records
    const local = getStoredTasks();
    const byId = new Map<string, TaskRecord>();
    for (const t of local) byId.set(t.id, t);
    for (const t of remote.tasks) byId.set(t.id, t);
    const merged = Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    saveStoredTasks(merged);
    return { tasks: merged, apiConnected: true };
  }
  return { tasks: getStoredTasks(), apiConnected: false };
}

export async function fetchAgentsUnified(): Promise<{ agents: AgentProfile[]; apiConnected: boolean }> {
  const remote = await fetchJsonWithTimeout<{ agents: AgentProfile[] }>(`${API_BASE}/api/agents`, undefined, 3000);
  if (remote?.agents) {
    return { agents: remote.agents, apiConnected: true };
  }
  return { agents: INITIAL_AGENTS, apiConnected: false };
}

export async function fetchAgentPassport(
  slug: string,
  refreshRpc = false
): Promise<{
  agent: AgentProfile | null;
  onChainVerification: any;
  completedTasks: TaskRecord[];
  events: BlockchainEventRecord[];
  apiConnected: boolean;
}> {
  const remote = await fetchJsonWithTimeout<{
    agent: AgentProfile;
    onChainVerification: any;
    completedTasks: TaskRecord[];
    events: BlockchainEventRecord[];
  }>(`${API_BASE}/api/agents/${encodeURIComponent(slug)}/passport${refreshRpc ? '?refreshRpc=true' : ''}`, undefined, 5000);

  if (remote?.agent) {
    return { ...remote, apiConnected: true };
  }

  const localAgent = INITIAL_AGENTS.find((a) => a.slug === slug || a.id === slug) || null;
  const tasks = getStoredTasks().filter((t) => localAgent && t.assignedAgentId === localAgent.id);
  return {
    agent: localAgent,
    onChainVerification: null,
    completedTasks: tasks,
    events: [],
    apiConnected: false,
  };
}

export async function fetchCouncilRuns(): Promise<{ runs: CouncilExecutionRun[]; apiConnected: boolean }> {
  const remote = await fetchJsonWithTimeout<{ runs: CouncilExecutionRun[] }>(`${API_BASE}/api/council/runs`);
  if (remote?.runs) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_COUNCIL_KEY, JSON.stringify(remote.runs));
    }
    return { runs: remote.runs, apiConnected: true };
  }
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_COUNCIL_KEY);
    if (raw) {
      try {
        return { runs: JSON.parse(raw), apiConnected: false };
      } catch {}
    }
  }
  return { runs: [], apiConnected: false };
}

export function saveLocalCouncilRun(run: CouncilExecutionRun): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_COUNCIL_KEY);
    const list: CouncilExecutionRun[] = raw ? JSON.parse(raw) : [];
    list.unshift(run);
    localStorage.setItem(LOCAL_COUNCIL_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {}
}

export async function fetchWorkflowsUnified(): Promise<{
  workflows: WorkflowDefinition[];
  executions: WorkflowExecutionRecord[];
  apiConnected: boolean;
}> {
  const remote = await fetchJsonWithTimeout<{
    workflows: WorkflowDefinition[];
    executions: WorkflowExecutionRecord[];
  }>(`${API_BASE}/api/workflows`);

  if (remote?.workflows) {
    return { ...remote, apiConnected: true };
  }

  let localWf: WorkflowDefinition[] = [];
  let localExec: WorkflowExecutionRecord[] = [];
  if (typeof window !== 'undefined') {
    try {
      localWf = JSON.parse(localStorage.getItem(LOCAL_WORKFLOWS_KEY) || '[]');
      localExec = JSON.parse(localStorage.getItem(LOCAL_WF_EXEC_KEY) || '[]');
    } catch {}
  }

  if (localWf.length === 0) {
    localWf = [
      {
        id: 'wf-template-council-audit',
        name: 'Full Multi-Agent Enterprise Audit Pipeline',
        description:
          'Standard end-to-end deterministic workflow: Dataset Upload -> Cleaning -> Validation -> Statistical Analysis -> Anomaly Detection -> AI Interpretation -> Proof Verification.',
        isTemplate: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [
          { id: 'n1', type: 'dataset_upload', position: { x: 40, y: 60 }, config: { label: 'CSV Dataset Upload' } },
          { id: 'n2', type: 'data_cleaning', position: { x: 260, y: 60 }, config: { label: 'Hygiene Cleaning', handleMissingStrategy: 'flag_only' } },
          { id: 'n3', type: 'data_validation', position: { x: 480, y: 60 }, config: { label: 'Schema Validation' } },
          { id: 'n4', type: 'statistical_analysis', position: { x: 700, y: 60 }, config: { label: 'DataCraft Math Engine', assignedAgentId: 'agent-datacraft-01' } },
          { id: 'n5', type: 'anomaly_detection', position: { x: 140, y: 220 }, config: { label: 'Sentinel Z-Score Audit', assignedAgentId: 'agent-sentinel-02', zScoreThreshold: 2.0 } },
          { id: 'n6', type: 'ai_interpretation', position: { x: 380, y: 220 }, config: { label: 'MetricsMind BI Synthesis', assignedAgentId: 'agent-metricsmind-03' } },
          { id: 'n7', type: 'report_generation', position: { x: 620, y: 220 }, config: { label: 'Canonical Report Builder' } },
          { id: 'n8', type: 'proof_verification', position: { x: 860, y: 220 }, config: { label: 'SHA-256 Proof Digest', requireProofHash: true } },
        ],
        edges: [
          { id: 'e1-2', source: 'n1', target: 'n2' },
          { id: 'e2-3', source: 'n2', target: 'n3' },
          { id: 'e3-4', source: 'n3', target: 'n4' },
          { id: 'e4-5', source: 'n4', target: 'n5' },
          { id: 'e5-6', source: 'n5', target: 'n6' },
          { id: 'e6-7', source: 'n6', target: 'n7' },
          { id: 'e7-8', source: 'n7', target: 'n8' },
        ],
      },
    ];
  }

  return { workflows: localWf, executions: localExec, apiConnected: false };
}

export async function fetchLeaderboardUnified(category: LeaderboardCategory): Promise<{
  entries: LeaderboardEntry[];
  minimumSampleRequirement: number;
  fraudPreventionPolicy: string;
  apiConnected: boolean;
}> {
  const remote = await fetchJsonWithTimeout<{
    entries: LeaderboardEntry[];
    minimumSampleRequirement: number;
    fraudPreventionPolicy: string;
  }>(`${API_BASE}/api/leaderboard?category=${encodeURIComponent(category)}`);

  if (remote?.entries) {
    return { ...remote, apiConnected: true };
  }

  const entries: LeaderboardEntry[] = INITIAL_AGENTS.map((agent, idx) => ({
    rank: idx + 1,
    agent,
    verifiedJobsCount: agent.tasksCompleted,
    seedJobsCount: agent.tasksCompleted,
    approvalRate: agent.approvalRate || 97,
    avgQualityScore: agent.qualityScoreAvg || 98,
    reliabilityScore: agent.reliabilityScore || 98,
    compositeRankScore: agent.reputationScore,
    eligibleForOfficialPrize: agent.tasksCompleted >= 5,
    eligibilityNote: 'Meets minimum 5+ verified tasks requirement',
  })).sort((a, b) => b.compositeRankScore - a.compositeRankScore).map((e, i) => ({ ...e, rank: i + 1 }));

  return {
    entries,
    minimumSampleRequirement: 5,
    fraudPreventionPolicy:
      'Agents require >= 5 completed tasks and >= 70% client approval rate to qualify for official League ranking.',
    apiConnected: false,
  };
}

export async function fetchTrustSearch(query: string) {
  return fetchJsonWithTimeout<{
    query: string;
    contractAddress: string;
    matchedTasks: TaskRecord[];
    matchedAgents: AgentProfile[];
    matchedEvents: BlockchainEventRecord[];
    onChainWalletCheck: any;
    onChainTxCheck: any;
    verifiedAt: string;
  }>(`${API_BASE}/api/trust/verify?q=${encodeURIComponent(query)}`, undefined, 6000);
}

export async function fetchDeveloperPortalData() {
  const [keysRes, hooksRes, usageRes] = await Promise.all([
    fetchJsonWithTimeout<{ keys: DeveloperApiKeyMeta[] }>(`${API_BASE}/api/developer/keys`),
    fetchJsonWithTimeout<{ webhooks: WebhookConfig[] }>(`${API_BASE}/api/developer/webhooks`),
    fetchJsonWithTimeout<{ metrics: any[] }>(`${API_BASE}/api/developer/usage`),
  ]);

  return {
    apiConnected: Boolean(keysRes || hooksRes),
    keys: keysRes?.keys || [],
    webhooks: hooksRes?.webhooks || [],
    usage: usageRes?.metrics || [],
  };
}

export async function fetchEnterpriseLogsAndJobs(): Promise<{
  logs: AuditLogEntry[];
  jobs: RecurringJobConfig[];
  apiConnected: boolean;
}> {
  const [logsRes, jobsRes] = await Promise.all([
    fetchJsonWithTimeout<{ logs: AuditLogEntry[] }>(`${API_BASE}/api/enterprise/audit-logs`),
    fetchJsonWithTimeout<{ jobs: RecurringJobConfig[] }>(`${API_BASE}/api/enterprise/recurring-jobs`),
  ]);

  return {
    apiConnected: Boolean(logsRes || jobsRes),
    logs: logsRes?.logs || [],
    jobs: jobsRes?.jobs || [],
  };
}
