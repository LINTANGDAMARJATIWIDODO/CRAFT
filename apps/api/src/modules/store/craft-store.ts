import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import {
  AgentProfile,
  AuditLogEntry,
  BlockchainEventRecord,
  CommunityFeedbackItem,
  CouncilExecutionRun,
  DeveloperApiKeyMeta,
  LeaderboardCategory,
  LeaderboardEntry,
  OFFICIAL_AGENT_ID_CONTRACT_BSC,
  PlatformMetricsSnapshot,
  RecurringJobConfig,
  TaskRecord,
  TaskState,
  UserSession,
  WebhookConfig,
  WorkflowDefinition,
  WorkflowExecutionRecord,
} from '@craft/shared';
import { buildDefaultCapabilitySpec } from '../economy/matching-bidding-service';
import { computeReputationBreakdown } from '../reputation/reputation-service';

const STATE_FILE = path.join(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? os.tmpdir() : process.cwd(),
  '.craft-state.json'
);

export interface StoredApiKey extends DeveloperApiKeyMeta {
  keyHash: string;
}

export interface CraftPersistedState {
  agents: AgentProfile[];
  tasks: TaskRecord[];
  councilRuns: CouncilExecutionRun[];
  workflows: WorkflowDefinition[];
  workflowExecutions: WorkflowExecutionRecord[];
  apiKeys: StoredApiKey[];
  webhooks: WebhookConfig[];
  events: BlockchainEventRecord[];
  auditLogs: AuditLogEntry[];
  recurringJobs: RecurringJobConfig[];
  endpointCalls: Record<string, { calls: number; totalLatencyMs: number; errors: number }>;
  rewardedTaskIds: string[];
  communityFeedback: CommunityFeedbackItem[];
  uniqueInteractingWallets: Record<
    string,
    { hasAgentId: boolean; firstSeenAt: string; contract: string; confirmedTxHash?: string }
  >;
}

const DEFAULT_AGENTS: AgentProfile[] = [
  {
    id: 'agent-datacraft-01',
    name: 'DataCraft Quant AI',
    slug: 'datacraft-quant',
    roleKey: 'datacraft',
    title: 'Lead Financial & Operational Data Analyst',
    description:
      'Specialized in deterministic numeric aggregation, revenue decomposition, statistical distribution profiling, and reproducible numerical evidence.',
    walletAddress: '0x1A29c54C4c1fF7a79e60241b3127C5d7e57c6643',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    specialty: ['Descriptive Statistics', 'Revenue Audit', 'Cohort Analysis', 'Distribution Profiling'],
    supportedFormats: ['CSV', 'TSV'],
    verifiedAgentId: false, // Verified dynamically on BSC mainnet RPC against 0x60b9...022f
    agentIdTokenId: 'Registry-Slot-01 (Demo Profile)',
    agentIdContract: OFFICIAL_AGENT_ID_CONTRACT_BSC,
    tasksCompleted: 42,
    reputationScore: 99,
    approvalRate: 97.6,
    totalApprovals: 41,
    totalRevisions: 1,
    qualityScoreAvg: 98.4,
    reliabilityScore: 99.1,
    avgExecutionTimeSec: 28,
    isAvailable: true,
    isDemoSeed: true,
    craftCredentials: {
      tier: 'Enterprise Council',
      issuedBy: 'CRAFT Reputation Protocol',
      reputationScore: 99,
      approvalRate: 97.6,
      reliabilityScore: 99.1,
      qualityScoreAvg: 98.4,
      minimumSampleThreshold: 5,
      meetsRankingMinimum: true,
      badges: ['Deterministic Audit Master', 'Zero-Hallucination Math'],
    },
    achievements: [
      {
        id: 'ach-dc-1',
        title: 'Deterministic Precision Tier',
        description: 'Maintained >= 95% client approval across 40+ analytical tasks.',
        earnedAt: '2025-01-15T00:00:00Z',
        minRecordsThreshold: 40,
      },
      {
        id: 'ach-dc-2',
        title: 'Council Lead Quantitative Node',
        description: 'Primary mathematical aggregation node in CRAFT Multi-Agent Council.',
        earnedAt: '2025-02-01T00:00:00Z',
        minRecordsThreshold: 10,
      },
    ],
    performanceHistory: [
      { period: 'Week 1', tasksApproved: 8, avgQualityScore: 97, avgLatencySec: 31 },
      { period: 'Week 2', tasksApproved: 11, avgQualityScore: 98, avgLatencySec: 29 },
      { period: 'Week 3', tasksApproved: 10, avgQualityScore: 99, avgLatencySec: 27 },
      { period: 'Week 4', tasksApproved: 13, avgQualityScore: 99, avgLatencySec: 25 },
    ],
  },
  {
    id: 'agent-sentinel-02',
    name: 'SentinelProfiler AI',
    slug: 'sentinel-profiler',
    roleKey: 'sentinel',
    title: 'Data Integrity, Hygiene & Anomaly Auditor',
    description:
      'Autonomous validator focused on dataset hygiene, missing value patterns, schema divergence, duplicate record detection, and Z-score/IQR outlier audits.',
    walletAddress: '0x3D4fC44E3a2c2b09a93D5737199182C0E858D65F',
    avatarUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=150&auto=format&fit=crop&q=80',
    specialty: ['Data Hygiene', 'Schema Audits', 'Z-Score Anomaly Detection', 'Calculation Audit'],
    supportedFormats: ['CSV'],
    verifiedAgentId: false,
    agentIdTokenId: 'Registry-Slot-02 (Demo Profile)',
    agentIdContract: OFFICIAL_AGENT_ID_CONTRACT_BSC,
    tasksCompleted: 29,
    reputationScore: 97,
    approvalRate: 96.5,
    totalApprovals: 28,
    totalRevisions: 1,
    qualityScoreAvg: 97.2,
    reliabilityScore: 98.8,
    avgExecutionTimeSec: 19,
    isAvailable: true,
    isDemoSeed: true,
    craftCredentials: {
      tier: 'Enterprise Council',
      issuedBy: 'CRAFT Reputation Protocol',
      reputationScore: 97,
      approvalRate: 96.5,
      reliabilityScore: 98.8,
      qualityScoreAvg: 97.2,
      minimumSampleThreshold: 5,
      meetsRankingMinimum: true,
      badges: ['Anomaly Sentinel', 'Schema Integrity Guardian'],
    },
    achievements: [
      {
        id: 'ach-sn-1',
        title: 'Sub-20s Hygiene Auditor',
        description: 'Delivered rapid schema & anomaly validation under 20s average latency.',
        earnedAt: '2025-01-20T00:00:00Z',
        minRecordsThreshold: 20,
      },
    ],
    performanceHistory: [
      { period: 'Week 1', tasksApproved: 6, avgQualityScore: 96, avgLatencySec: 22 },
      { period: 'Week 2', tasksApproved: 7, avgQualityScore: 97, avgLatencySec: 20 },
      { period: 'Week 3', tasksApproved: 8, avgQualityScore: 98, avgLatencySec: 18 },
      { period: 'Week 4', tasksApproved: 8, avgQualityScore: 98, avgLatencySec: 17 },
    ],
  },
  {
    id: 'agent-metricsmind-03',
    name: 'MetricsMind E-Comm',
    slug: 'metricsmind-ecomm',
    roleKey: 'metricsmind',
    title: 'Business Intelligence & Strategic Synthesizer',
    description:
      'Transforms audited calculation digests into executive business intelligence, customer LTV/AOV insights, pricing recommendations, and board-ready reports.',
    walletAddress: '0x7e84F14704B184c7E75691F6211833eB937f1e67',
    avatarUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&auto=format&fit=crop&q=80',
    specialty: ['Business Intelligence', 'Strategic Insights', 'Pricing Optimization', 'Executive Reporting'],
    supportedFormats: ['CSV'],
    verifiedAgentId: false,
    agentIdTokenId: 'Registry-Slot-03 (Demo Profile)',
    agentIdContract: OFFICIAL_AGENT_ID_CONTRACT_BSC,
    tasksCompleted: 35,
    reputationScore: 98,
    approvalRate: 97.1,
    totalApprovals: 34,
    totalRevisions: 1,
    qualityScoreAvg: 98.0,
    reliabilityScore: 98.2,
    avgExecutionTimeSec: 24,
    isAvailable: true,
    isDemoSeed: true,
    craftCredentials: {
      tier: 'Enterprise Council',
      issuedBy: 'CRAFT Reputation Protocol',
      reputationScore: 98,
      approvalRate: 97.1,
      reliabilityScore: 98.2,
      qualityScoreAvg: 98.0,
      minimumSampleThreshold: 5,
      meetsRankingMinimum: true,
      badges: ['BI Strategy Leader', 'Council Narrative Synthesizer'],
    },
    achievements: [
      {
        id: 'ach-mm-1',
        title: 'Executive Clarity Distinction',
        description: 'Consistently high client satisfaction on strategic actionable recommendations.',
        earnedAt: '2025-01-25T00:00:00Z',
        minRecordsThreshold: 25,
      },
    ],
    performanceHistory: [
      { period: 'Week 1', tasksApproved: 7, avgQualityScore: 97, avgLatencySec: 26 },
      { period: 'Week 2', tasksApproved: 9, avgQualityScore: 98, avgLatencySec: 25 },
      { period: 'Week 3', tasksApproved: 9, avgQualityScore: 98, avgLatencySec: 23 },
      { period: 'Week 4', tasksApproved: 10, avgQualityScore: 99, avgLatencySec: 22 },
    ],
  },
  {
    id: 'agent-orchestrator-00',
    name: 'CRAFT Orchestrator',
    slug: 'craft-orchestrator',
    roleKey: 'orchestrator',
    title: 'Multi-Agent Task Router & Evidence Aggregator',
    description:
      'Coordinates multi-agent council pipelines, assigns specialized roles, aggregates calculation proofs, and synthesizes canonical SHA-256 commitments.',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    avatarUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=150&auto=format&fit=crop&q=80',
    specialty: ['Task Routing', 'Council Coordination', 'Evidence Synthesis', 'SHA-256 Commitments'],
    supportedFormats: ['CSV', 'JSON'],
    verifiedAgentId: false,
    agentIdTokenId: 'Registry-Slot-00 (System Router)',
    agentIdContract: OFFICIAL_AGENT_ID_CONTRACT_BSC,
    tasksCompleted: 18,
    reputationScore: 98,
    approvalRate: 100,
    totalApprovals: 18,
    totalRevisions: 0,
    qualityScoreAvg: 98.9,
    reliabilityScore: 99.6,
    avgExecutionTimeSec: 12,
    isAvailable: true,
    isDemoSeed: true,
    craftCredentials: {
      tier: 'Enterprise Council',
      issuedBy: 'CRAFT Reputation Protocol',
      reputationScore: 98,
      approvalRate: 100,
      reliabilityScore: 99.6,
      qualityScoreAvg: 98.9,
      minimumSampleThreshold: 5,
      meetsRankingMinimum: true,
      badges: ['Protocol Orchestrator', '100% Routing Integrity'],
    },
    achievements: [
      {
        id: 'ach-or-1',
        title: 'Zero-Fault Council Orchestration',
        description: 'Zero routing failures across multi-agent consensus runs.',
        earnedAt: '2025-02-02T00:00:00Z',
        minRecordsThreshold: 10,
      },
    ],
    performanceHistory: [
      { period: 'Week 1', tasksApproved: 4, avgQualityScore: 98, avgLatencySec: 14 },
      { period: 'Week 2', tasksApproved: 4, avgQualityScore: 99, avgLatencySec: 13 },
      { period: 'Week 3', tasksApproved: 5, avgQualityScore: 99, avgLatencySec: 12 },
      { period: 'Week 4', tasksApproved: 5, avgQualityScore: 99, avgLatencySec: 11 },
    ],
  },
];

const DEMO_TASKS: TaskRecord[] = [
  {
    id: 'task-craft-001',
    onChainTaskId: 1,
    title: 'Q1 Enterprise Hardware & Cloud Revenue Decomposition [Sample]',
    description:
      'Reference demonstration dataset decomposing revenue variance across Enterprise, SMB, and Consumer segments.',
    objective:
      'Calculate deterministic category totals, evaluate discount elasticity, and compile executive recommendations.',
    status: TaskState.Approved,
    clientAddress: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
    assignedAgentId: 'agent-datacraft-01',
    datasetFileName: 'q1_tech_revenue_matrix.csv',
    datasetRowCount: 20,
    datasetHash: '0x8f2d5e7a9b1c3e4f6a8b0c2d4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c',
    calculationsHash: '0x4a1d5e7a9b1c3e4f6a8b0c2d4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a1122',
    outputProofHash: '0x3c9a1b5d7e8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0b',
    createdAt: '2025-02-05T09:30:00Z',
    acceptedAt: '2025-02-05T09:32:00Z',
    startedAt: '2025-02-05T09:32:15Z',
    submittedAt: '2025-02-05T09:34:40Z',
    approvedAt: '2025-02-05T10:15:00Z',
    isDemo: true,
    verificationTier: 'demonstration_seed',
    report: {
      taskId: 'task-craft-001',
      generatedAt: '2025-02-05T09:34:40Z',
      agentId: 'agent-datacraft-01',
      executiveSummary:
        'Sample reference analysis: Total audited revenue across the 20-row sample cohort equaled $39,632.50 with Enterprise contributing 68.4%.',
      datasetOverview: {
        datasetName: 'q1_tech_revenue_matrix.csv',
        totalRows: 20,
        totalFeatures: 8,
        qualityAssessment: '100/100 score across sample reference schema.',
        identifiedSchema: [
          'Transaction_ID (string)',
          'Date (date)',
          'Product_Category (string)',
          'Units_Sold (numeric)',
          'Unit_Price (numeric)',
          'Customer_Segment (string)',
          'Revenue (numeric)',
          'Discount_Applied (numeric)',
        ],
      },
      keyMetrics: [
        { label: 'Audited Gross Revenue', value: '$39,632.50', interpretation: 'Sample Q1 sum across 20 orders', impact: 'positive' },
        { label: 'Mean Order Value', value: '$1,981.63', interpretation: 'Average order size', impact: 'positive' },
        { label: 'Revenue StdDev', value: '$984.12', interpretation: 'Order dispersion across tiers', impact: 'neutral' },
        { label: 'Top Product Line', value: 'Cloud Services', interpretation: '$12,600.00 across 5 orders', impact: 'positive' },
      ],
      detailedAnalysis: [
        'Cloud Services achieved highest unit pricing ($450.00) with minimal discounting.',
        'Developer Tools drove highest unit velocity (177 units) across Enterprise bulk contracts.',
      ],
      trendsAndPatterns: ['Sequential monthly acceleration from Jan ($14,036.50) to Feb ($17,748.50).'],
      businessInsights: ['Enterprise accounts cluster Cloud Services with Security Software subscriptions.'],
      recommendations: [
        { action: 'Cap Developer Tool discounts at 12%', priority: 'high', rationale: 'Protects unit margins.' },
      ],
      calculationEvidence: {
        deterministicHash: '0x4a1d5e7a9b1c3e4f6a8b0c2d4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a1122',
        metricsAudit: {
          totalRows: 20,
          'Total Revenue': 39632.5,
          'Avg Revenue': 1981.63,
          'Total Units_Sold': 396,
        },
        anomaliesDetected: 0,
      },
      limitationsAndAssumptions: ['Demonstration reference dataset (COGS omitted).'],
      proofHash: '0x3c9a1b5d7e8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0b',
    },
  },
  {
    id: 'task-craft-002',
    onChainTaskId: 2,
    title: 'SaaS Churn Risk & Hygiene Audit [Sample]',
    description: 'Reference sample dataset auditing 350 subscription cohort records for churn predictors.',
    objective: 'Audit data quality, compute cohort retention statistics, and quantify reactivation impact.',
    status: TaskState.Submitted,
    clientAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
    assignedAgentId: 'agent-sentinel-02',
    datasetFileName: 'saas_churn_cohort_2024.csv',
    datasetRowCount: 350,
    datasetHash: '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
    outputProofHash: '0xfa39b2c817e04b7a956102cd8b34f89104b2a6e849c3017fb92c10a4e76d9c28',
    createdAt: '2025-02-06T11:10:00Z',
    acceptedAt: '2025-02-06T11:12:00Z',
    startedAt: '2025-02-06T11:12:30Z',
    submittedAt: '2025-02-06T11:16:45Z',
    isDemo: true,
    verificationTier: 'demonstration_seed',
  },
];

const DEFAULT_WORKFLOW_TEMPLATES: WorkflowDefinition[] = [
  {
    id: 'wf-template-council-audit',
    name: 'Full Multi-Agent Enterprise Audit Pipeline',
    description:
      'Standard end-to-end deterministic workflow: Dataset Upload -> Cleaning -> Validation -> Statistical Analysis -> Anomaly Detection -> AI Interpretation -> Proof Verification -> Human Sign-Off.',
    isTemplate: true,
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2025-02-01T08:00:00Z',
    nodes: [
      { id: 'n1', type: 'dataset_upload', position: { x: 40, y: 80 }, config: { label: 'CSV Dataset Upload' } },
      { id: 'n2', type: 'data_cleaning', position: { x: 280, y: 80 }, config: { label: 'Hygiene Cleaning', handleMissingStrategy: 'flag_only' } },
      { id: 'n3', type: 'data_validation', position: { x: 520, y: 80 }, config: { label: 'Schema Validation' } },
      { id: 'n4', type: 'statistical_analysis', position: { x: 760, y: 80 }, config: { label: 'DataCraft Math Engine', assignedAgentId: 'agent-datacraft-01' } },
      { id: 'n5', type: 'anomaly_detection', position: { x: 160, y: 260 }, config: { label: 'Sentinel Z-Score Audit', assignedAgentId: 'agent-sentinel-02', zScoreThreshold: 2.0 } },
      { id: 'n6', type: 'ai_interpretation', position: { x: 420, y: 260 }, config: { label: 'MetricsMind BI Synthesis', assignedAgentId: 'agent-metricsmind-03' } },
      { id: 'n7', type: 'report_generation', position: { x: 680, y: 260 }, config: { label: 'Canonical Report Builder' } },
      { id: 'n8', type: 'proof_verification', position: { x: 940, y: 260 }, config: { label: 'SHA-256 Proof Digest', requireProofHash: true } },
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
  {
    id: 'wf-template-fast-anomaly',
    name: 'Rapid Financial Anomaly & Proof Pipeline',
    description: 'High-speed outlier scan followed by proof hashing and mandatory human sign-off gate.',
    isTemplate: true,
    createdAt: '2025-02-02T08:00:00Z',
    updatedAt: '2025-02-02T08:00:00Z',
    nodes: [
      { id: 'n1', type: 'dataset_upload', position: { x: 60, y: 140 }, config: { label: 'CSV Ingest' } },
      { id: 'n2', type: 'statistical_analysis', position: { x: 320, y: 140 }, config: { label: 'Numeric Aggregation', assignedAgentId: 'agent-datacraft-01' } },
      { id: 'n3', type: 'anomaly_detection', position: { x: 580, y: 140 }, config: { label: 'Outlier Scan (Z>1.8)', zScoreThreshold: 1.8 } },
      { id: 'n4', type: 'human_approval', position: { x: 840, y: 140 }, config: { label: 'Human Sign-Off Gate', requireHumanSignOff: true } },
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e2-3', source: 'n2', target: 'n3' },
      { id: 'e3-4', source: 'n3', target: 'n4' },
    ],
  },
];

const DEFAULT_EVENTS: BlockchainEventRecord[] = [
  {
    id: 'evt-demo-001',
    eventName: 'TaskApproved',
    taskId: 'task-craft-001',
    chainId: 56,
    wallet: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
    proofHash: '0x3c9a1b5d7e8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0b',
    timestamp: '2025-02-05T10:15:00Z',
    verificationTier: 'demonstration_seed',
    statusLabel: 'Sample Seed Reference (Not On-Chain Mainnet Tx)',
  },
  {
    id: 'evt-demo-002',
    eventName: 'ProofSubmitted',
    taskId: 'task-craft-002',
    chainId: 56,
    wallet: '0x3D4fC44E3a2c2b09a93D5737199182C0E858D65F',
    proofHash: '0xfa39b2c817e04b7a956102cd8b34f89104b2a6e849c3017fb92c10a4e76d9c28',
    timestamp: '2025-02-06T11:16:45Z',
    verificationTier: 'demonstration_seed',
    statusLabel: 'Sample Seed Reference (Pending Client Review)',
  },
];

const DEFAULT_RECURRING_JOBS: RecurringJobConfig[] = [
  {
    id: 'job-daily-revenue-digest',
    name: 'Daily E-Commerce Margin & Discount Audit',
    workflowId: 'wf-template-council-audit',
    scheduleCron: '0 2 * * *',
    status: 'coming_soon',
    nextRunLabel: 'Autonomous Keeper Scheduler (Coming Soon)',
    requiresOnChainAutomationNote:
      'Scheduled cron triggers require off-chain webhook ingestion or BNB Chain Automation keeper binding before live activation.',
  },
  {
    id: 'job-weekly-hygiene-scan',
    name: 'Weekly Customer Cohort Hygiene Audit',
    workflowId: 'wf-template-fast-anomaly',
    scheduleCron: '0 6 * * 1',
    status: 'paused',
    nextRunLabel: 'Manual Trigger Enabled via Workflow Studio',
    requiresOnChainAutomationNote:
      'Execute manually anytime from Workflow Studio or REST API POST /api/v1/analyze.',
  },
];

class CraftStore {
  public state: CraftPersistedState;
  public nonces: Map<string, { nonce: number; createdAt: number }> = new Map();
  public sessions: Map<string, UserSession> = new Map();

  constructor() {
    this.state = this.loadOrInit();
  }

  private hydrateAgents(agents: AgentProfile[], tasks: TaskRecord[]): AgentProfile[] {
    return agents.map((agent) => {
      const capabilitySpec = agent.capabilitySpec || buildDefaultCapabilitySpec(agent.roleKey);
      const enriched: AgentProfile = { ...agent, capabilitySpec };
      const breakdown = computeReputationBreakdown(enriched, tasks);
      if (enriched.craftCredentials) {
        enriched.craftCredentials = {
          ...enriched.craftCredentials,
          breakdown,
        };
      }
      return enriched;
    });
  }

  private loadOrInit(): CraftPersistedState {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        const parsed = JSON.parse(raw) as Partial<CraftPersistedState>;
        const rawTasks = (parsed.tasks?.length ? parsed.tasks : DEMO_TASKS).map((t) => {
          // Safely migrate legacy v1 TaskState numbers where Approved was 5 and Submitted was 3
          if (t.isDemo && t.id === 'task-craft-001' && (t.status as number) === 5) {
            return { ...t, status: TaskState.Approved };
          }
          if (t.isDemo && t.id === 'task-craft-002' && (t.status as number) === 3) {
            return { ...t, status: TaskState.Submitted };
          }
          return t;
        });
        const agents = this.hydrateAgents(
          parsed.agents?.length ? parsed.agents : DEFAULT_AGENTS,
          rawTasks
        );
        return {
          agents,
          tasks: rawTasks,
          councilRuns: parsed.councilRuns || [],
          workflows: parsed.workflows?.length ? parsed.workflows : DEFAULT_WORKFLOW_TEMPLATES,
          workflowExecutions: parsed.workflowExecutions || [],
          apiKeys: parsed.apiKeys || [],
          webhooks: parsed.webhooks || [],
          events: parsed.events?.length ? parsed.events : DEFAULT_EVENTS,
          auditLogs: parsed.auditLogs || [],
          recurringJobs: parsed.recurringJobs?.length ? parsed.recurringJobs : DEFAULT_RECURRING_JOBS,
          endpointCalls: parsed.endpointCalls || {},
          rewardedTaskIds: parsed.rewardedTaskIds || ['task-craft-001'],
          communityFeedback: parsed.communityFeedback || [],
          uniqueInteractingWallets: parsed.uniqueInteractingWallets || {},
        };
      }
    } catch (err) {
      console.warn('[CraftStore] Could not restore .craft-state.json, starting fresh:', err);
    }

    const fresh: CraftPersistedState = {
      agents: this.hydrateAgents(DEFAULT_AGENTS, DEMO_TASKS),
      tasks: DEMO_TASKS,
      councilRuns: [],
      workflows: DEFAULT_WORKFLOW_TEMPLATES,
      workflowExecutions: [],
      apiKeys: [],
      webhooks: [],
      events: DEFAULT_EVENTS,
      auditLogs: [
        {
          id: 'aud-init-001',
          category: 'AUTH',
          action: 'SYSTEM_INITIALIZED',
          actor: 'craft-protocol',
          details: 'CRAFT API initialized with official Agent ID gate 0x60b9262456de011f7d15a54cdd8c48baaa8b022f',
          timestamp: new Date().toISOString(),
          severity: 'info',
        },
      ],
      recurringJobs: DEFAULT_RECURRING_JOBS,
      endpointCalls: {},
      rewardedTaskIds: ['task-craft-001'],
      communityFeedback: [],
      uniqueInteractingWallets: {},
    };
    this.persist(fresh);
    return fresh;
  }

  public save(): void {
    this.persist(this.state);
  }

  private persist(data: CraftPersistedState): void {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.warn('[CraftStore] Persist warning:', err);
    }
  }

  public addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const full: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(full);
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 200);
    }
    this.save();
    return full;
  }

  public addEvent(event: Omit<BlockchainEventRecord, 'id' | 'timestamp'>): BlockchainEventRecord {
    const full: BlockchainEventRecord = {
      ...event,
      id: `evt-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };
    this.state.events.unshift(full);
    if (this.state.events.length > 200) {
      this.state.events = this.state.events.slice(0, 200);
    }
    this.save();
    return full;
  }

  public recordTaskApprovalForAgent(agentId: string, qualityScore: number, executionTimeSec: number): void {
    const agent = this.state.agents.find((a) => a.id === agentId);
    if (!agent) return;

    agent.tasksCompleted = (agent.tasksCompleted || 0) + 1;
    agent.totalApprovals = (agent.totalApprovals || 0) + 1;
    const totalReviews = (agent.totalApprovals || 0) + (agent.totalRevisions || 0);
    agent.approvalRate = Number((((agent.totalApprovals || 0) / Math.max(1, totalReviews)) * 100).toFixed(1));
    agent.qualityScoreAvg = Number(
      (((agent.qualityScoreAvg || 95) * (agent.tasksCompleted - 1) + qualityScore) / agent.tasksCompleted).toFixed(1)
    );
    agent.avgExecutionTimeSec = Math.max(
      2,
      Math.round(((agent.avgExecutionTimeSec || 20) * (agent.tasksCompleted - 1) + executionTimeSec) / agent.tasksCompleted)
    );
    agent.reputationScore = Math.min(
      100,
      Math.round((agent.approvalRate * 0.5 + (agent.qualityScoreAvg || 95) * 0.5))
    );
    if (agent.craftCredentials) {
      agent.craftCredentials.reputationScore = agent.reputationScore;
      agent.craftCredentials.approvalRate = agent.approvalRate;
      agent.craftCredentials.qualityScoreAvg = agent.qualityScoreAvg;
      agent.craftCredentials.meetsRankingMinimum =
        agent.tasksCompleted >= agent.craftCredentials.minimumSampleThreshold;
    }
    if (agent.performanceHistory && agent.performanceHistory.length > 0) {
      const latest = agent.performanceHistory[agent.performanceHistory.length - 1];
      latest.tasksApproved += 1;
      latest.avgQualityScore = Math.round(agent.qualityScoreAvg || 98);
    }
    this.save();
  }

  public recordTaskRevisionForAgent(agentId: string): void {
    const agent = this.state.agents.find((a) => a.id === agentId);
    if (!agent) return;
    agent.totalRevisions = (agent.totalRevisions || 0) + 1;
    const totalReviews = (agent.totalApprovals || 0) + (agent.totalRevisions || 0);
    agent.approvalRate = Number((((agent.totalApprovals || 0) / Math.max(1, totalReviews)) * 100).toFixed(1));
    if (agent.craftCredentials) {
      agent.craftCredentials.approvalRate = agent.approvalRate;
    }
    this.save();
  }

  public getMetricsSnapshot(latestBscBlock?: number | null): PlatformMetricsSnapshot {
    const liveTasks = this.state.tasks.filter((t) => !t.isDemo);
    const demoTasks = this.state.tasks.filter((t) => t.isDemo);
    const verifiedAgentsCount = this.state.agents.filter((a) => a.verifiedAgentId).length;
    const activeTasksCount = this.state.tasks.filter(
      (t) =>
        t.status === TaskState.Created ||
        t.status === TaskState.Proposed ||
        t.status === TaskState.Accepted ||
        t.status === TaskState.InProgress ||
        t.status === TaskState.Submitted ||
        t.status === TaskState.Verified
    ).length;
    const completedJobsCount = this.state.tasks.filter((t) => t.status === TaskState.Approved).length;
    const successfulVerificationsCount =
      this.state.events.filter(
        (e) =>
          (e.eventName === 'TaskApproved' || e.eventName === 'TaskVerified' || e.eventName === 'ProofSubmitted') &&
          e.verificationTier !== 'demonstration_seed'
      ).length +
      this.state.tasks.filter((t) => Boolean(t.outputProofHash)).length;

    const interactingList = Object.values(this.state.uniqueInteractingWallets || {});
    const uniqueAgentIdAddressesInteracted = interactingList.filter((w) => w.hasAgentId).length;

    return {
      verifiedAgentsCount,
      registeredAgentsCount: this.state.agents.length,
      activeTasksCount,
      completedJobsCount,
      successfulVerificationsCount,
      liveRecordsCount: liveTasks.length,
      demoRecordsCount: demoTasks.length,
      uniqueAgentIdAddressesInteracted,
      uniqueOnChainAddressesVerified: interactingList.length,
      officialAgentIdContract: OFFICIAL_AGENT_ID_CONTRACT_BSC,
      latestBscBlock: latestBscBlock ?? null,
      recentEvents: this.state.events.slice(0, 12),
      generatedAt: new Date().toISOString(),
    };
  }

  public getLeaderboard(category: LeaderboardCategory = 'overall'): LeaderboardEntry[] {
    const MIN_SAMPLE_REQUIRED = 5;

    const scored = this.state.agents.map((agent) => {
      const liveApproved = this.state.tasks.filter(
        (t) => !t.isDemo && (t.assignedAgentId === agent.id || Boolean(t.councilRunId)) && t.status === TaskState.Approved
      ).length;
      const verifiedJobsCount = agent.tasksCompleted;
      const seedJobsCount = agent.isDemoSeed ? Math.max(0, agent.tasksCompleted - liveApproved) : 0;
      const approvalRate = agent.approvalRate ?? 95;
      const avgQualityScore = agent.qualityScoreAvg ?? 95;
      const reliabilityScore = agent.reliabilityScore ?? 96;

      let score = 0;
      if (category === 'best_data_analyst') {
        const isQuant = agent.roleKey === 'datacraft' ? 3 : 0;
        score = avgQualityScore * 0.5 + approvalRate * 0.4 + Math.min(10, verifiedJobsCount * 0.2) + isQuant;
      } else if (category === 'best_bi_agent') {
        const isBI = agent.roleKey === 'metricsmind' ? 4 : 0;
        score = approvalRate * 0.5 + avgQualityScore * 0.4 + isBI;
      } else if (category === 'highest_reliability') {
        score = reliabilityScore * 0.65 + approvalRate * 0.35;
      } else if (category === 'best_verified_performance') {
        const chainBonus = agent.verifiedAgentId ? 5 : 0;
        score = approvalRate * 0.4 + avgQualityScore * 0.4 + Math.min(15, verifiedJobsCount * 0.3) + chainBonus;
      } else {
        score = agent.reputationScore * 0.45 + approvalRate * 0.3 + reliabilityScore * 0.25;
      }

      // Fraud prevention / sample minimum gate
      const eligible = verifiedJobsCount >= MIN_SAMPLE_REQUIRED && approvalRate >= 70;
      const eligibilityNote = eligible
        ? `Meets minimum ${MIN_SAMPLE_REQUIRED}+ completed tasks & >=70% client approval`
        : `Requires at least ${MIN_SAMPLE_REQUIRED} completed tasks (Anti-Sybil gate)`;

      return {
        rank: 0,
        agent,
        verifiedJobsCount,
        seedJobsCount,
        approvalRate,
        avgQualityScore,
        reliabilityScore,
        compositeRankScore: Number(score.toFixed(2)),
        eligibleForOfficialPrize: eligible,
        eligibilityNote,
      };
    });

    scored.sort((a, b) => {
      if (a.eligibleForOfficialPrize !== b.eligibleForOfficialPrize) {
        return a.eligibleForOfficialPrize ? -1 : 1;
      }
      return b.compositeRankScore - a.compositeRankScore;
    });

    return scored.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }

  public recordEndpointUsage(endpoint: string, latencyMs: number, isError: boolean): void {
    const existing = this.state.endpointCalls[endpoint] || {
      calls: 0,
      totalLatencyMs: 0,
      errors: 0,
    };
    existing.calls += 1;
    existing.totalLatencyMs += latencyMs;
    if (isError) existing.errors += 1;
    this.state.endpointCalls[endpoint] = existing;
    this.save();
  }
}

export const craftStore = new CraftStore();
