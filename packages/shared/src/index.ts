/**
 * CRAFT - Shared Types, Enums and Constants
 * Intelligence Into Action
 */

export enum TaskState {
  Created = 0,
  Accepted = 1,
  InProgress = 2,
  Submitted = 3,
  RevisionRequested = 4,
  Approved = 5,
  Cancelled = 6,
}

export const TASK_STATE_LABELS: Record<TaskState, string> = {
  [TaskState.Created]: 'Created',
  [TaskState.Accepted]: 'Accepted',
  [TaskState.InProgress]: 'In Progress',
  [TaskState.Submitted]: 'Submitted for Review',
  [TaskState.RevisionRequested]: 'Revision Requested',
  [TaskState.Approved]: 'Approved & Finalized',
  [TaskState.Cancelled]: 'Cancelled',
};

export const TASK_STATE_COLORS: Record<TaskState, { bg: string; text: string; border: string }> = {
  [TaskState.Created]: { bg: 'bg-zinc-800/80', text: 'text-zinc-300', border: 'border-zinc-700' },
  [TaskState.Accepted]: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/50' },
  [TaskState.InProgress]: { bg: 'bg-blue-950/40', text: 'text-blue-300', border: 'border-blue-800/50' },
  [TaskState.Submitted]: { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/50' },
  [TaskState.RevisionRequested]: { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-800/50' },
  [TaskState.Approved]: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/50' },
  [TaskState.Cancelled]: { bg: 'bg-red-950/40', text: 'text-red-400', border: 'border-red-900/50' },
};

// Official Agent ID Contract Reference on BNB Smart Chain Mainnet
export const OFFICIAL_AGENT_ID_CONTRACT_BSC = '0x60b9262456de011f7d15a54cdd8c48baaa8b022f';

// Official Binance OAuth 2.0 Endpoints
export const BINANCE_OAUTH_ENDPOINTS = {
  AUTHORIZE: 'https://accounts.binance.com/en/oauth/authorize',
  TOKEN: 'https://api.binance.com/v1/oauth/token',
  USER_INFO: 'https://api.binance.com/v1/oauth/user/info',
};

// Supported Networks
export const SUPPORTED_CHAINS = {
  BSC_MAINNET: {
    id: 56,
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    blockExplorerUrl: 'https://bscscan.com',
    agentIdContract: OFFICIAL_AGENT_ID_CONTRACT_BSC,
  },
  BSC_TESTNET: {
    id: 97,
    name: 'BNB Smart Chain Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorerUrl: 'https://testnet.bscscan.com',
    agentIdContract: '0x60b9262456de011f7d15a54cdd8c48baaa8b022f',
  },
  LOCAL_HARDHAT: {
    id: 31337,
    name: 'Hardhat Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
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
  // Layer 1: Official Binance Agent ID Credential
  verifiedAgentId: boolean;
  agentIdTokenId?: string;
  agentIdContract?: string;
  // Layer 2: CRAFT Protocol Reputation & Telemetry
  tasksCompleted: number;
  reputationScore: number; // 0 - 100
  approvalRate?: number; // 0 - 100
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

export interface DatasetColumnSchema {
  name: string;
  type: 'numeric' | 'string' | 'date' | 'boolean' | 'unknown';
  sampleValues: (string | number)[];
  nullCount: number;
  distinctCount: number;
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
  dataQualityScore: number; // 0 - 100
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
  correlations?: Array<{ colA: string; colB: string; correlation: number }>;
  timeSeriesAggregation?: Array<{ period: string; count: number; sum?: number; avg?: number }>;
  anomalies?: Array<{ rowIndex: number; column: string; value: number; zScore: number; reason: string }>;
  rawHash: string;
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
  };
  limitationsAndAssumptions: string[];
  proofHash: string;
}

export type RecordVerificationTier =
  | 'demonstration_seed'
  | 'local_verified_digest'
  | 'testnet_anchored'
  | 'mainnet_anchored';

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
  datasetFileName?: string;
  datasetRowCount?: number;
  outputProofHash?: string;
  calculationsHash?: string;
  reportHash?: string;
  report?: AIAnalyticalReport;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  submittedAt?: string;
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
  deterministicCalculationsHash: string;
  reportContentHash: string;
  finalProofHash: string;
  timestamp: number;
}

// ==========================================
// AGENT COUNCIL (MULTI-AGENT COLLABORATION)
// ==========================================

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
}

export interface CouncilExecutionRun {
  id: string;
  taskId?: string;
  title: string;
  objective: string;
  datasetFileName: string;
  datasetRowCount: number;
  datasetHash: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  steps: CouncilStepLog[];
  profiling?: DatasetProfilingResult;
  calculations?: DeterministicCalculations;
  consolidatedReport?: AIAnalyticalReport;
  compositeProofHash?: string;
  isDemo?: boolean;
}

// ==========================================
// VISUAL WORKFLOW STUDIO
// ==========================================

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

// ==========================================
// GLOBAL AGENT LEAGUE & LEADERBOARD
// ==========================================

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

// ==========================================
// DEVELOPER HUB & API MANAGEMENT
// ==========================================

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

// ==========================================
// PLATFORM METRICS, TRUST CENTER & ENTERPRISE
// ==========================================

export interface BlockchainEventRecord {
  id: string;
  eventName:
    | 'TaskApproved'
    | 'ProofSubmitted'
    | 'TaskStarted'
    | 'TaskAccepted'
    | 'TaskCreated'
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
  activeTasksCount: number;
  completedJobsCount: number;
  successfulVerificationsCount: number;
  liveRecordsCount: number;
  demoRecordsCount: number;
  officialAgentIdContract: string;
  latestBscBlock?: number | null;
  recentEvents: BlockchainEventRecord[];
  generatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  category: 'AUTH' | 'WORKFLOW' | 'PROOF' | 'API' | 'APPROVAL';
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
