/**
 * CRAFT - Shared Types, Enums and Constants
 * Autonomous Agent Economy & Verified Work Protocol
 * Intelligence Into Action
 */

export enum TaskState {
  Created = 0,
  Proposed = 1,
  Accepted = 2,
  InProgress = 3,
  Submitted = 4,
  Verified = 5,
  Approved = 6,
  RevisionRequested = 7,
  Cancelled = 8,
}

export const TASK_STATE_LABELS: Record<TaskState, string> = {
  [TaskState.Created]: 'Created',
  [TaskState.Proposed]: 'Bids Proposed',
  [TaskState.Accepted]: 'Accepted',
  [TaskState.InProgress]: 'In Progress',
  [TaskState.Submitted]: 'Submitted',
  [TaskState.Verified]: 'Council Verified',
  [TaskState.Approved]: 'Approved & Finalized',
  [TaskState.RevisionRequested]: 'Revision Requested',
  [TaskState.Cancelled]: 'Cancelled',
};

export const TASK_STATE_COLORS: Record<TaskState, { bg: string; text: string; border: string }> = {
  [TaskState.Created]: { bg: 'bg-zinc-800/80', text: 'text-zinc-300', border: 'border-zinc-700' },
  [TaskState.Proposed]: { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/50' },
  [TaskState.Accepted]: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/50' },
  [TaskState.InProgress]: { bg: 'bg-blue-950/40', text: 'text-blue-300', border: 'border-blue-800/50' },
  [TaskState.Submitted]: { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/50' },
  [TaskState.Verified]: { bg: 'bg-teal-950/40', text: 'text-teal-300', border: 'border-teal-800/50' },
  [TaskState.Approved]: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/50' },
  [TaskState.RevisionRequested]: { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-800/50' },
  [TaskState.Cancelled]: { bg: 'bg-red-950/40', text: 'text-red-400', border: 'border-red-900/50' },
};

// Verified Official Binance / SPACE ID Agent ID Contract on BNB Smart Chain Mainnet (56)
// Verified via live BSC RPC: name()="SPACE ID Agent ID", symbol()="AI", ERC-165 ERC721 (0x80ac58cd)=true, ERC721Metadata (0x5b5e139f)=true
export const OFFICIAL_AGENT_ID_CONTRACT_BSC = '0x60b9262456de011f7d15a54cdd8c48baaa8b022f';

export const OFFICIAL_AGENT_ID_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
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
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'supportsInterface',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export const BINANCE_OAUTH_ENDPOINTS = {
  AUTHORIZE: 'https://accounts.binance.com/en/oauth/authorize',
  TOKEN: 'https://api.binance.com/v1/oauth/token',
  USER_INFO: 'https://api.binance.com/v1/oauth/user/info',
};

// Resilient PublicNode + Official BNB Chain RPC URLs
export const SUPPORTED_CHAINS = {
  BSC_MAINNET: {
    id: 56,
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc.publicnode.com',
    fallbackRpcUrl: 'https://bsc-dataseed.binance.org/',
    blockExplorerUrl: 'https://bscscan.com',
    agentIdContract: OFFICIAL_AGENT_ID_CONTRACT_BSC,
  },
  BSC_TESTNET: {
    id: 97,
    name: 'BNB Smart Chain Testnet',
    rpcUrl: 'https://bsc-testnet-rpc.publicnode.com',
    fallbackRpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorerUrl: 'https://testnet.bscscan.com',
    agentIdContract: OFFICIAL_AGENT_ID_CONTRACT_BSC,
  },
  LOCAL_HARDHAT: {
    id: 31337,
    name: 'Hardhat Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    fallbackRpcUrl: 'http://127.0.0.1:8545',
    blockExplorerUrl: '',
    agentIdContract: '0x0000000000000000000000000000000000000000',
  },
};

export interface BinanceOAuthStatus {
  enabled: boolean;
  configured: boolean;
  partnerAccessRequired: boolean;
  clientIdPrefix?: string;
  redirectUri?: string;
  message: string;
}

export interface BinanceUserProfile {
  providerSubject: string;
  displayName?: string;
  email?: string;
  scopes: string[];
  linkedAt: string;
}

export interface UserSession {
  userId: string;
  binanceAccount?: BinanceUserProfile | null;
  walletAddress?: string | null;
  hasAgentId: boolean;
  agentIdTokenId?: string | null;
  isAuthenticated: boolean;
}

export interface WalletLinkRequest {
  address: string;
  signature: string;
  nonce: number;
}

export interface AgentAchievement {
  id: string;
  title: string;
  description: string;
  earnedAt: string;
  minRecordsThreshold: number;
}

export interface AgentPerformancePoint {
  period: string;
  tasksApproved: number;
  avgQualityScore: number;
  avgLatencySec: number;
}

// Part 3: Machine-readable Capability Registry Specification
export interface AgentCapabilitySpec {
  capabilities: string[];
  inputFormats: string[];
  outputFormats: string[];
  supportedOperations: string[];
  maxRowsLimit: number;
  timeoutSec: number;
  baseCostBnb: string;
  costUsdEstimate: number;
  slaDeliverySec: number;
  maxRevisions: number;
}

// Part 8: 6-Dimension Reputation Intelligence Model
export interface ReputationBreakdown {
  reliability: number; // 0-100 (on-chain/pipeline faultlessness)
  quality: number;     // 0-100 (data hygiene + anomaly/evidence score)
  completion: number;  // 0-100 (completed / accepted ratio)
  expertise: number;   // 0-100 (capability depth & domain volume)
  clientTrust: number; // 0-100 (human approvals vs revisions)
  timeliness: number;  // 0-100 (SLA adherence)
  overallScore: number;
  verifiedWorkCount: number;
  liveWorkCount: number;
  methodologyNote: string;
}

export interface CraftReputationCredentials {
  tier: 'Seed' | 'Verified Operator' | 'Senior Quant' | 'Enterprise Council';
  issuedBy: 'CRAFT Reputation Protocol';
  reputationScore: number;
  approvalRate: number;
  reliabilityScore: number;
  qualityScoreAvg: number;
  minimumSampleThreshold: number;
  meetsRankingMinimum: boolean;
  badges: string[];
  breakdown?: ReputationBreakdown;
}

export interface AgentProfile {
  id: string;
  name: string;
  slug: string;
  roleKey?: 'orchestrator' | 'datacraft' | 'sentinel' | 'metricsmind' | 'external';
  title: string;
  description: string;
  walletAddress: string;
  avatarUrl: string;
  specialty: string[];
  supportedFormats: string[];
  capabilitySpec?: AgentCapabilitySpec;
  // Layer 1: Official Binance Agent ID Credential
  verifiedAgentId: boolean;
  agentIdTokenId?: string;
  agentIdContract?: string;
  // Layer 2: CRAFT Protocol Reputation & Telemetry
  tasksCompleted: number;
  reputationScore: number;
  approvalRate?: number;
  totalApprovals?: number;
  totalRevisions?: number;
  qualityScoreAvg?: number;
  reliabilityScore?: number;
  avgExecutionTimeSec: number;
  isAvailable: boolean;
  isDemoSeed?: boolean;
  craftCredentials?: CraftReputationCredentials;
  achievements?: AgentAchievement[];
  performanceHistory?: AgentPerformancePoint[];
}

export interface AgentMatchExplanation {
  agent: AgentProfile;
  totalMatchScore: number; // 0-100
  factors: {
    capabilityMatchScore: number;
    historicalPerformanceScore: number;
    availabilityScore: number;
    speedScore: number;
    costEfficiencyScore: number;
  };
  matchedCapabilities: string[];
  estimatedTimeSec: number;
  estimatedCostUsd: number;
  rationale: string;
}

// Part 6: Agent Bidding System
export interface AgentBid {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  agentWallet: string;
  verifiedAgentId: boolean;
  capabilityMatchScore: number;
  methodology: string;
  estimatedDurationSec: number;
  proposedCostUsd: number;
  deliverables: string[];
  performanceEvidence: {
    completedJobs: number;
    approvalRate: number;
    reputationScore: number;
  };
  status: 'pending' | 'selected' | 'rejected';
  createdAt: string;
}

// Part 4: Hierarchical Agent-to-Agent Delegation
export interface SubtaskDelegation {
  id: string;
  parentTaskId: string;
  delegatorAgentId: string;
  delegateeAgentId: string;
  delegateeWallet: string;
  roleTitle: string;
  dependencySubtaskIds: string[];
  authorizedByAgentId: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'recovered';
  durationMs?: number;
  evidenceHash?: string;
  contributionSummary: string;
  error?: string;
  retryCount: number;
}

export interface DatasetColumnSchema {
  name: string;
  type: 'numeric' | 'string' | 'date' | 'boolean' | 'unknown';
  sampleValues: (string | number)[];
  nullCount: number;
  distinctCount: number;
  missingPercent?: number;
}

export interface DatasetProfilingResult {
  fileName: string;
  fileSizeBytes: number;
  rowCount: number;
  columnCount: number;
  sha256Hash: string;
  columns: DatasetColumnSchema[];
  missingValuesTotal: number;
  duplicateRows: number;
  dataQualityScore: number;
  warnings: string[];
}

export interface DeterministicCalculations {
  summary: {
    totalRows: number;
    metrics: Record<string, number | string>;
  };
  numericalDistributions: Record<string, {
    count: number;
    sum: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
    variance: number;
    iqr: number;
    outliersCount?: number;
  }>;
  categoricalDistributions: Record<string, {
    topFrequencies: Array<{ value: string; count: number; percentage: number }>;
  }>;
  correlations?: Array<{ colA: string; colB: string; correlation: number; strength: string }>;
  timeSeriesAggregation?: Array<{ period: string; count: number; sum?: number; avg?: number }>;
  forecast?: {
    targetColumn: string;
    periodsObserved: number;
    slopePerPeriod: number;
    nextPeriodLabel: string;
    projectedValue: number;
    methodology: string;
  };
  anomalies?: Array<{ rowIndex: number; column: string; value: number; zScore: number; reason: string }>;
  rawHash: string;
}

export interface ContradictionCheckItem {
  id: string;
  claim: string;
  verifiedMetricValue: string;
  consistent: boolean;
  note: string;
}

export interface AIAnalyticalReport {
  taskId: string;
  generatedAt: string;
  agentId: string;
  executiveSummary: string;
  datasetOverview: {
    datasetName: string;
    totalRows: number;
    totalFeatures: number;
    qualityAssessment: string;
    identifiedSchema: string[];
  };
  keyMetrics: Array<{
    label: string;
    value: string | number;
    interpretation: string;
    impact: 'positive' | 'neutral' | 'negative' | 'critical';
  }>;
  detailedAnalysis: string[];
  trendsAndPatterns: string[];
  businessInsights: string[];
  recommendations: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
  }>;
  calculationEvidence: {
    deterministicHash: string;
    metricsAudit: Record<string, any>;
    anomaliesDetected?: number;
    correlationsCount?: number;
  };
  contradictionAudit?: ContradictionCheckItem[];
  confidenceScore?: number; // 0 - 100
  limitationsAndAssumptions: string[];
  proofHash: string;
}

export type RecordVerificationTier =
  | 'demonstration_seed'
  | 'local_verified_digest'
  | 'testnet_anchored'
  | 'mainnet_anchored';

export interface FourDigestCommitments {
  datasetHash: string;
  configHash: string;
  evidenceHash: string;
  reportHash: string;
  compositeProofHash: string;
}

export interface TaskRecord {
  id: string;
  onChainTaskId?: number;
  title: string;
  description: string;
  objective: string;
  status: TaskState;
  clientAddress: string;
  assignedAgentId?: string;
  datasetHash?: string;
  configHash?: string;
  datasetFileName?: string;
  datasetRowCount?: number;
  outputProofHash?: string;
  calculationsHash?: string;
  reportHash?: string;
  digests?: FourDigestCommitments;
  report?: AIAnalyticalReport;
  delegations?: SubtaskDelegation[];
  bids?: AgentBid[];
  sla?: {
    maxDurationSec: number;
    maxRevisions: number;
    agreedCostUsd: number;
    successCriteria: string;
  };
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  submittedAt?: string;
  verifiedAt?: string;
  approvedAt?: string;
  cancelledAt?: string;
  onChainTxHash?: string;
  onChainBlockNumber?: number;
  onChainChainId?: number;
  contractAddress?: string;
  revisionReason?: string;
  isDemo?: boolean;
  verificationTier?: RecordVerificationTier;
  councilRunId?: string;
}

export interface ProofPayload {
  taskId: string;
  onChainTaskId?: number;
  clientAddress: string;
  agentAddress: string;
  datasetHash: string;
  configHash?: string;
  deterministicCalculationsHash: string;
  reportContentHash: string;
  finalProofHash: string;
  timestamp: number;
}

// Agent Council
export type CouncilAgentRole = 'orchestrator' | 'datacraft' | 'sentinel' | 'metricsmind';

export interface CouncilStepLog {
  id: string;
  stepOrder: number;
  role: CouncilAgentRole;
  agentId: string;
  agentName: string;
  actionTitle: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  contributionSummary: string;
  findings: string[];
  validationPassed: boolean;
  evidenceHash?: string;
  logs: string[];
  resourceUsage?: {
    executionTimeMs: number;
    rowsProcessed: number;
    memoryDeltaKb: number;
  };
}

export interface CouncilExecutionRun {
  id: string;
  taskId?: string;
  title: string;
  objective: string;
  datasetFileName: string;
  datasetRowCount: number;
  datasetHash: string;
  configHash?: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  steps: CouncilStepLog[];
  delegations?: SubtaskDelegation[];
  contradictionChecks?: ContradictionCheckItem[];
  confidenceScore?: number;
  profiling?: DatasetProfilingResult;
  calculations?: DeterministicCalculations;
  consolidatedReport?: AIAnalyticalReport;
  compositeProofHash?: string;
  isDemo?: boolean;
}

// Part 9: Real SSE Event Stream Telemetry
export interface MissionStreamEvent {
  id: string;
  runId: string;
  taskId: string;
  eventType:
    | 'mission_started'
    | 'matching_completed'
    | 'delegation_authorized'
    | 'agent_step_started'
    | 'agent_step_completed'
    | 'contradiction_audited'
    | 'proof_sealed'
    | 'task_approved'
    | 'mission_error';
  agentId?: string;
  stageLabel: string;
  progressPercent: number;
  message: string;
  durationMs?: number;
  evidenceHash?: string;
  timestamp: string;
}

// Part 10: Benchmark Arena
export interface BenchmarkAgentResult {
  agentId: string;
  agentName: string;
  executionTimeMs: number;
  memoryDeltaKb: number;
  numericalAccuracyScore: number; // 0-100 against blinded ground truth
  completenessScore: number;      // 0-100
  evidenceCoverageScore: number;  // 0-100
  compositeBenchmarkScore: number;
  anomaliesDetected: number;
  humanEvaluationRating?: number; // 1-5 stars
  evidenceHash: string;
}

export interface BenchmarkRunRecord {
  id: string;
  datasetName: string;
  rowCount: number;
  createdAt: string;
  criteriaNote: string;
  blindedGroundTruthPolicy: string;
  results: BenchmarkAgentResult[];
}

// Part 11: Verified Trust Graph
export interface TrustGraphNode {
  id: string;
  label: string;
  kind: 'agent' | 'client' | 'task';
  verifiedAgentId?: boolean;
  reputationScore?: number;
  roleTitle?: string;
}

export interface TrustGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: 'DELEGATED_TO' | 'VALIDATED_BY' | 'APPROVED_BY' | 'COLLABORATED_ON';
  taskId: string;
  evidenceHash?: string;
  isDemo?: boolean;
}

export interface TrustGraphSnapshot {
  nodes: TrustGraphNode[];
  edges: TrustGraphEdge[];
  generatedAt: string;
}

// Visual Workflow Studio
export type WorkflowNodeType =
  | 'dataset_upload'
  | 'data_cleaning'
  | 'data_validation'
  | 'statistical_analysis'
  | 'anomaly_detection'
  | 'ai_interpretation'
  | 'agent_review'
  | 'report_generation'
  | 'proof_verification'
  | 'human_approval';

export interface WorkflowNodeConfig {
  label: string;
  description?: string;
  assignedAgentId?: string;
  zScoreThreshold?: number;
  handleMissingStrategy?: 'drop_nulls' | 'zero_fill' | 'flag_only';
  requireProofHash?: boolean;
  requireHumanSignOff?: boolean;
  objectivePrompt?: string;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  config: WorkflowNodeConfig;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  isTemplate?: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNodeExecutionLog {
  nodeId: string;
  nodeType: WorkflowNodeType;
  label: string;
  status: 'completed' | 'failed' | 'waiting_approval' | 'skipped';
  durationMs: number;
  outputSummary: string;
  evidenceHash?: string;
  error?: string;
}

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  datasetFileName: string;
  status: 'completed' | 'waiting_human_approval' | 'failed';
  startedAt: string;
  completedAt?: string;
  stepResults: WorkflowNodeExecutionLog[];
  finalProofHash?: string;
  linkedTaskId?: string;
}

// Global Agent League
export type LeaderboardCategory =
  | 'overall'
  | 'best_data_analyst'
  | 'best_bi_agent'
  | 'highest_reliability'
  | 'best_verified_performance';

export interface LeaderboardEntry {
  rank: number;
  agent: AgentProfile;
  verifiedJobsCount: number;
  seedJobsCount: number;
  approvalRate: number;
  avgQualityScore: number;
  reliabilityScore: number;
  compositeRankScore: number;
  eligibleForOfficialPrize: boolean;
  eligibilityNote: string;
}

// Developer Hub
export interface DeveloperApiKeyMeta {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  requestCount: number;
  revoked: boolean;
  ownerAddress?: string;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  lastDeliveredAt?: string;
  lastStatus?: number;
}

export interface ApiUsageMetric {
  endpoint: string;
  callsTotal: number;
  avgLatencyMs: number;
  errorRatePercent: number;
}

// Events, Metrics, Enterprise & Growth
export interface BlockchainEventRecord {
  id: string;
  eventName:
    | 'TaskApproved'
    | 'TaskVerified'
    | 'TaskProposed'
    | 'ProofSubmitted'
    | 'TaskStarted'
    | 'TaskAccepted'
    | 'TaskCreated'
    | 'SubtaskDelegated'
    | 'RevisionRequested'
    | 'AgentVerified';
  taskId: string;
  txHash?: string;
  blockNumber?: number;
  chainId: number;
  wallet: string;
  proofHash?: string;
  timestamp: string;
  verificationTier: RecordVerificationTier;
  statusLabel: string;
}

export interface PlatformMetricsSnapshot {
  verifiedAgentsCount: number;
  registeredAgentsCount?: number;
  activeTasksCount: number;
  completedJobsCount: number;
  successfulVerificationsCount: number;
  liveRecordsCount: number;
  demoRecordsCount: number;
  uniqueAgentIdAddressesInteracted?: number;
  uniqueOnChainAddressesVerified?: number;
  officialAgentIdContract: string;
  latestBscBlock?: number | null;
  recentEvents: BlockchainEventRecord[];
  generatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  category: 'AUTH' | 'WORKFLOW' | 'PROOF' | 'API' | 'APPROVAL' | 'DELEGATION';
  action: string;
  actor: string;
  resourceId?: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface RecurringJobConfig {
  id: string;
  name: string;
  workflowId: string;
  scheduleCron: string;
  status: 'active' | 'paused' | 'coming_soon';
  nextRunLabel: string;
  requiresOnChainAutomationNote: string;
}

export interface CommunityFeedbackItem {
  id: string;
  walletAddress?: string;
  hasAgentId: boolean;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReadinessCriterionResult {
  criterion: string;
  weightPercent: number;
  implementedEvidence: string[];
  testEvidence: string[];
  remainingGaps: string[];
  measuredStatus: 'Strong' | 'Partial' | 'Gap';
}

/**
 * Pure deterministic helper shared between browser analyzer and API engine
 * so Pearson correlations, time-series aggregation, and OLS forecasting
 * never diverge across client and server.
 */
export function computeCorrelationsAndTimeForecast(
  rows: Record<string, any>[],
  columns: DatasetColumnSchema[]
): {
  correlations: NonNullable<DeterministicCalculations['correlations']>;
  timeSeriesAggregation: NonNullable<DeterministicCalculations['timeSeriesAggregation']>;
  forecast?: DeterministicCalculations['forecast'];
} {
  const numericCols = columns.filter((c) => c.type === 'numeric');
  const correlations: NonNullable<DeterministicCalculations['correlations']> = [];

  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const colA = numericCols[i].name;
      const colB = numericCols[j].name;
      const pairs: Array<[number, number]> = [];
      for (const row of rows) {
        const va = row[colA];
        const vb = row[colB];
        if (typeof va === 'number' && !isNaN(va) && typeof vb === 'number' && !isNaN(vb)) {
          pairs.push([va, vb]);
        }
      }
      if (pairs.length < 3) continue;
      const n = pairs.length;
      const meanA = pairs.reduce((s, p) => s + p[0], 0) / n;
      const meanB = pairs.reduce((s, p) => s + p[1], 0) / n;
      let num = 0;
      let denA = 0;
      let denB = 0;
      for (const [a, b] of pairs) {
        const da = a - meanA;
        const db = b - meanB;
        num += da * db;
        denA += da * da;
        denB += db * db;
      }
      const denom = Math.sqrt(denA * denB);
      if (denom === 0) continue;
      const r = Number((num / denom).toFixed(4));
      const absR = Math.abs(r);
      const strength =
        absR >= 0.7
          ? r > 0
            ? 'Strong positive'
            : 'Strong negative'
          : absR >= 0.4
          ? r > 0
            ? 'Moderate positive'
            : 'Moderate negative'
          : 'Weak / None';
      correlations.push({ colA, colB, correlation: r, strength });
    }
  }

  correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  const dateCol = columns.find((c) => c.type === 'date');
  const preferredMetric =
    numericCols.find((c) => /revenue|amount|sales|value|total|profit|volume|price/i.test(c.name)) ||
    numericCols[0];

  const timeSeriesAggregation: NonNullable<DeterministicCalculations['timeSeriesAggregation']> = [];
  if (dateCol && preferredMetric) {
    const grouped: Record<string, { count: number; sum: number }> = {};
    for (const row of rows) {
      const rawDate = row[dateCol.name];
      const rawMetric = row[preferredMetric.name];
      if (!rawDate) continue;
      const parsedMs = Date.parse(String(rawDate));
      let period = String(rawDate).slice(0, 7);
      if (!isNaN(parsedMs)) {
        const d = new Date(parsedMs);
        period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      }
      if (!grouped[period]) grouped[period] = { count: 0, sum: 0 };
      grouped[period].count += 1;
      if (typeof rawMetric === 'number' && !isNaN(rawMetric)) {
        grouped[period].sum += rawMetric;
      }
    }
    for (const period of Object.keys(grouped).sort()) {
      const g = grouped[period];
      timeSeriesAggregation.push({
        period,
        count: g.count,
        sum: Number(g.sum.toFixed(2)),
        avg: Number((g.sum / Math.max(1, g.count)).toFixed(2)),
      });
    }
  }

  let forecast: DeterministicCalculations['forecast'] | undefined;
  if (preferredMetric && timeSeriesAggregation.length >= 2) {
    const series = timeSeriesAggregation.map((p, idx) => ({ x: idx, y: p.sum ?? 0 }));
    const n = series.length;
    const meanX = series.reduce((s, p) => s + p.x, 0) / n;
    const meanY = series.reduce((s, p) => s + p.y, 0) / n;
    let num = 0;
    let den = 0;
    for (const p of series) {
      num += (p.x - meanX) * (p.y - meanY);
      den += (p.x - meanX) * (p.x - meanX);
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;
    const projectedValue = Math.max(0, Number((slope * n + intercept).toFixed(2)));
    const lastPeriod = timeSeriesAggregation[timeSeriesAggregation.length - 1].period;
    let nextPeriodLabel = `Period ${n + 1}`;
    if (/^\d{4}-\d{2}$/.test(lastPeriod)) {
      const [yStr, mStr] = lastPeriod.split('-');
      let year = Number(yStr);
      let month = Number(mStr) + 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      nextPeriodLabel = `${year}-${String(month).padStart(2, '0')}`;
    }
    forecast = {
      targetColumn: preferredMetric.name,
      periodsObserved: n,
      slopePerPeriod: Number(slope.toFixed(2)),
      nextPeriodLabel,
      projectedValue,
      methodology:
        'Deterministic OLS linear trend over chronological period aggregates (mathematical projection only; excludes external market shocks).',
    };
  }

  return {
    correlations: correlations.slice(0, 10),
    timeSeriesAggregation,
    forecast,
  };
}
