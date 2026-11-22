import { TaskRecord, TaskState, AIAnalyticalReport } from '@craft/shared';
import { INITIAL_AGENTS } from './constants';
import { computeSha256 } from './utils';

const STORAGE_KEY = 'craft_tasks_v1';

export const SAMPLE_SALES_CSV = `Transaction_ID,Date,Product_Category,Units_Sold,Unit_Price,Customer_Segment,Revenue,Discount_Applied
TXN-1001,2024-01-05,Hardware,14,120.00,Enterprise,1680.00,0.05
TXN-1002,2024-01-07,Cloud_Services,3,450.00,SMB,1350.00,0.00
TXN-1003,2024-01-10,Security_Software,25,85.50,Enterprise,2137.50,0.10
TXN-1004,2024-01-12,Hardware,8,120.00,Consumer,960.00,0.00
TXN-1005,2024-01-15,Developer_Tools,40,49.00,SMB,1960.00,0.15
TXN-1006,2024-01-18,Cloud_Services,5,450.00,Enterprise,2250.00,0.00
TXN-1007,2024-01-20,Hardware,2,120.00,Consumer,240.00,0.00
TXN-1008,2024-01-22,Security_Software,18,85.50,SMB,1539.00,0.05
TXN-1009,2024-01-25,Developer_Tools,60,49.00,Enterprise,2940.00,0.20
TXN-1010,2024-01-28,Hardware,12,120.00,Enterprise,1440.00,0.05
TXN-1011,2024-02-01,Cloud_Services,7,450.00,Enterprise,3150.00,0.00
TXN-1012,2024-02-04,Security_Software,30,85.50,SMB,2565.00,0.10
TXN-1013,2024-02-08,Developer_Tools,22,49.00,Consumer,1078.00,0.00
TXN-1014,2024-02-12,Hardware,19,120.00,Enterprise,2280.00,0.08
TXN-1015,2024-02-15,Cloud_Services,4,450.00,SMB,1800.00,0.00
TXN-1016,2024-02-18,Security_Software,11,85.50,Enterprise,940.50,0.00
TXN-1017,2024-02-22,Developer_Tools,55,49.00,Enterprise,2695.00,0.15
TXN-1018,2024-02-25,Hardware,6,120.00,Consumer,720.00,0.00
TXN-1019,2024-02-28,Cloud_Services,9,450.00,Enterprise,4050.00,0.05
TXN-1020,2024-03-02,Security_Software,45,85.50,Enterprise,3847.50,0.12`;

const PRELOADED_TASKS: TaskRecord[] = [
  {
    id: 'task-craft-001',
    onChainTaskId: 1,
    title: 'Q1 Enterprise Hardware & Cloud Revenue Decomposition',
    description: 'Comprehensive financial variance analysis across customer segments (Enterprise vs SMB vs Consumer) to optimize pricing discounts.',
    objective: 'Calculate revenue by category, analyze discount elasticity, and provide actionable gross margin recommendations.',
    status: TaskState.Approved,
    clientAddress: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
    assignedAgentId: 'agent-datacraft-01',
    datasetFileName: 'q1_tech_revenue_matrix.csv',
    datasetRowCount: 20,
    datasetHash: '0x8f2d5e7a9b1c3e4f6a8b0c2d4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c',
    outputProofHash: '0x3c9a1b5d7e8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0b',
    createdAt: '2024-03-05T09:30:00Z',
    acceptedAt: '2024-03-05T09:32:00Z',
    startedAt: '2024-03-05T09:32:15Z',
    submittedAt: '2024-03-05T09:34:40Z',
    approvedAt: '2024-03-05T10:15:00Z',
    onChainTxHash: '0x9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
    report: {
      taskId: 'task-craft-001',
      generatedAt: '2024-03-05T09:34:40Z',
      agentId: 'agent-datacraft-01',
      executiveSummary: 'Total audited revenue amounted to $39,632.50 across 20 verified transactions. Enterprise clients generated 68.4% of total sales with an average order value of $2,710.00, demonstrating high resilience to lower discount tiers.',
      datasetOverview: {
        datasetName: 'q1_tech_revenue_matrix.csv',
        totalRows: 20,
        totalFeatures: 8,
        qualityAssessment: 'High completeness (100% non-null cells, 0 syntax anomalies).',
        identifiedSchema: ['Transaction_ID', 'Date', 'Product_Category', 'Units_Sold', 'Unit_Price', 'Customer_Segment', 'Revenue', 'Discount_Applied'],
      },
      keyMetrics: [
        { label: 'Audited Gross Revenue', value: '$39,632.50', interpretation: 'Total transaction volume across Q1 cohort', impact: 'positive' },
        { label: 'Enterprise Contribution', value: '68.4%', interpretation: 'Primary driver of cloud and developer tool contracts', impact: 'positive' },
        { label: 'Average Discount Applied', value: '5.75%', interpretation: 'Discounts peaked at 20% for developer tools', impact: 'neutral' },
        { label: 'Highest Volume SKU', value: 'Developer Tools', interpretation: '177 units sold across 4 bulk orders', impact: 'positive' },
      ],
      detailedAnalysis: [
        'Cloud Services represents the highest gross margin product line, bringing $12,600.00 on just 28 unit commitments ($450.00 unit price).',
        'Developer Tools drove the highest unit volume (177 units) but required higher discount concession (up to 20%) to close enterprise tiers.',
        'Consumer Hardware orders had low basket sizes (2-8 units) and zero discount tolerance.',
      ],
      trendsAndPatterns: [
        'Month-over-month expansion from January ($14,036.50) to February ($17,748.50) represented +26.4% acceleration.',
        'Enterprise accounts repeatedly combined Cloud Services with Developer Tools.',
      ],
      businessInsights: [
        'Cloud services pricing has inelastic demand; standardizing discount caps at 5% will protect margins.',
        'Developer tools can serve as a primary funnel for new enterprise logo acquisition.',
      ],
      recommendations: [
        { action: 'Cap Developer Tool enterprise discounts at 12%', priority: 'high', rationale: 'Current 20% discounts dilute margins without providing incremental unit volume.' },
        { action: 'Bundle Cloud Services with Security Software', priority: 'medium', rationale: '80% of cloud buyers also evaluated security line items.' },
      ],
      calculationEvidence: {
        deterministicHash: '0x8f2d5e7a9b1c3e4f6a8b0c2d4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c',
        metricsAudit: {
          totalRows: 20,
          totalRevenueSum: 39632.5,
          meanRevenue: 1981.625,
          medianRevenue: 1880.0,
          standardDeviation: 984.12,
        },
      },
      limitationsAndAssumptions: [
        'Sample covers 20 Q1 transactions; seasonality adjustments require full-year data.',
        'Cost of goods sold (COGS) was not included in raw schema.',
      ],
      proofHash: '0x3c9a1b5d7e8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0b',
    },
  },
  {
    id: 'task-craft-002',
    onChainTaskId: 2,
    title: 'Customer Churn Risk & Retention Cohort Modeling',
    description: 'Analyzing active user engagement drops, recurring subscription lifecycles, and churn signals from a SaaS customer retention dataset.',
    objective: 'Identify key churn indicators and quantify financial impact of 30-day reactivation campaigns.',
    status: TaskState.Submitted,
    clientAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
    assignedAgentId: 'agent-sentinel-02',
    datasetFileName: 'saas_churn_cohort_2024.csv',
    datasetRowCount: 350,
    datasetHash: '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
    outputProofHash: '0xfa39b2c817e04b7a956102cd8b34f89104b2a6e849c3017fb92c10a4e76d9c28',
    createdAt: '2024-03-06T11:10:00Z',
    acceptedAt: '2024-03-06T11:12:00Z',
    startedAt: '2024-03-06T11:12:30Z',
    submittedAt: '2024-03-06T11:16:45Z',
    onChainTxHash: '0xaa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
  },
  {
    id: 'task-craft-003',
    onChainTaskId: 3,
    title: 'Supply Chain Shipping Lead Time & Vendor Reliability',
    description: 'Statistical evaluation of delivery variance across 4 overseas fulfillment partners and impact on warehouse stockout frequency.',
    objective: 'Establish supplier SLA compliance ratings and calculate optimal safety stock multipliers.',
    status: TaskState.InProgress,
    clientAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    assignedAgentId: 'agent-metricsmind-03',
    datasetFileName: 'logistics_vendor_sla_audit.csv',
    datasetRowCount: 520,
    datasetHash: '0x99887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa',
    createdAt: '2024-03-06T14:05:00Z',
    acceptedAt: '2024-03-06T14:06:00Z',
    startedAt: '2024-03-06T14:06:15Z',
    onChainTxHash: '0x554433221100aabbccddeeff00112233445566778899aabbccddeeff00112233',
  },
  {
    id: 'task-craft-004',
    onChainTaskId: 4,
    title: 'Ad Spend ROI & Multi-Channel Attribution Audit',
    description: 'Evaluation of paid search, paid social, and influencer campaign conversion funnels with clean deterministic ROAS calculation.',
    objective: 'Pinpoint channels yielding negative unit economics and recommend budget reallocation.',
    status: TaskState.Created,
    clientAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    datasetFileName: 'q1_marketing_adspend_attribution.csv',
    datasetRowCount: 140,
    datasetHash: '0x33445566778899aabbccddeeff00112233445566778899aabbccddeeff001122',
    createdAt: '2024-03-06T15:20:00Z',
    onChainTxHash: '0x77889900aabbccddeeff112233445566778899aabbccddeeff00112233445566',
  },
];

export function getStoredTasks(): TaskRecord[] {
  if (typeof window === 'undefined') {
    return PRELOADED_TASKS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PRELOADED_TASKS));
      return PRELOADED_TASKS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored tasks:', e);
    return PRELOADED_TASKS;
  }
}

export function saveStoredTasks(tasks: TaskRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks to localStorage:', e);
  }
}

export function getTaskById(id: string): TaskRecord | undefined {
  const tasks = getStoredTasks();
  return tasks.find((t) => t.id === id);
}

export function updateTask(id: string, updates: Partial<TaskRecord>): TaskRecord | undefined {
  const tasks = getStoredTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return undefined;
  
  tasks[index] = { ...tasks[index], ...updates };
  saveStoredTasks(tasks);
  return tasks[index];
}

export function createTaskRecord(newTask: Omit<TaskRecord, 'id' | 'createdAt'>): TaskRecord {
  const tasks = getStoredTasks();
  const id = `task-craft-${Date.now().toString().slice(-6)}`;
  const record: TaskRecord = {
    ...newTask,
    id,
    onChainTaskId: tasks.length + 1,
    createdAt: new Date().toISOString(),
  };
  tasks.unshift(record);
  saveStoredTasks(tasks);
  return record;
}
