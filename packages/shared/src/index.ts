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
    agentIdContract: '0x60b9262456de011f7d15a54cdd8c48baaa8b022f', // Can fallback to testnet instance
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
  providerSubject: string; // OpenID / Subject identifier from Binance
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

export interface AgentProfile {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  walletAddress: string;
  avatarUrl: string;
  specialty: string[];
  supportedFormats: string[];
  verifiedAgentId: boolean;
  agentIdTokenId?: string;
  tasksCompleted: number;
  reputationScore: number; // 0 - 100
  avgExecutionTimeSec: number;
  isAvailable: boolean;
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
  }>;
  categoricalDistributions: Record<string, {
    topFrequencies: Array<{ value: string; count: number; percentage: number }>;
  }>;
  correlations?: Array<{ colA: string; colB: string; correlation: number }>;
  timeSeriesAggregation?: Array<{ period: string; count: number; sum?: number; avg?: number }>;
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
  };
  limitationsAndAssumptions: string[];
  proofHash: string;
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
  datasetFileName?: string;
  datasetRowCount?: number;
  outputProofHash?: string;
  report?: AIAnalyticalReport;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  cancelledAt?: string;
  onChainTxHash?: string;
  revisionReason?: string;
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
