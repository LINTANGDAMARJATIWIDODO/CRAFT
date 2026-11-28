import { TaskRecord, TaskState } from '@craft/shared';

const STORAGE_KEY = 'craft_tasks_v2';

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
    title: 'Q1 Enterprise Hardware & Cloud Revenue Decomposition [Sample]',
    description:
      'Reference demonstration dataset decomposing financial variance across customer segments (Enterprise vs SMB vs Consumer).',
    objective:
      'Calculate revenue by category, analyze discount elasticity, and provide actionable gross margin recommendations.',
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
        'Total audited revenue amounted to $39,632.50 across 20 sample transactions. Enterprise clients generated 68.4% of total sales with strong resilience to lower discount tiers.',
      datasetOverview: {
        datasetName: 'q1_tech_revenue_matrix.csv',
        totalRows: 20,
        totalFeatures: 8,
        qualityAssessment: 'High completeness (100% non-null cells, 0 syntax anomalies).',
        identifiedSchema: [
          'Transaction_ID',
          'Date',
          'Product_Category',
          'Units_Sold',
          'Unit_Price',
          'Customer_Segment',
          'Revenue',
          'Discount_Applied',
        ],
      },
      keyMetrics: [
        { label: 'Audited Gross Revenue', value: '$39,632.50', interpretation: 'Total transaction volume across Q1 cohort', impact: 'positive' },
        { label: 'Enterprise Contribution', value: '68.4%', interpretation: 'Primary driver of cloud and developer tool contracts', impact: 'positive' },
        { label: 'Average Discount Applied', value: '5.75%', interpretation: 'Discounts peaked at 20% for developer tools', impact: 'neutral' },
        { label: 'Highest Volume SKU', value: 'Developer Tools', interpretation: '177 units sold across 4 bulk orders', impact: 'positive' },
      ],
      detailedAnalysis: [
        'Cloud Services represents the highest gross margin product line ($12,600.00 across 28 units).',
        'Developer Tools drove the highest unit volume (177 units) but required higher discount concessions (up to 20%).',
        'Consumer Hardware orders had small basket sizes (2-8 units) and zero discount tolerance.',
      ],
      trendsAndPatterns: [
        'Month-over-month expansion from January ($14,036.50) to February ($17,748.50) represented +26.4% acceleration.',
        'Enterprise accounts repeatedly combined Cloud Services with Developer Tools.',
      ],
      businessInsights: [
        'Cloud services pricing shows inelastic demand; capping discounts at 5% protects gross margins.',
        'Developer tools serve as a primary acquisition funnel for Enterprise contracts.',
      ],
      recommendations: [
        { action: 'Cap Developer Tool enterprise discounts at 12%', priority: 'high', rationale: 'Current 20% discounts dilute margins without incremental unit lift.' },
        { action: 'Bundle Cloud Services with Security Software', priority: 'medium', rationale: 'High cross-sell overlap among enterprise accounts.' },
      ],
      calculationEvidence: {
        deterministicHash: '0x4a1d5e7a9b1c3e4f6a8b0c2d4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a1122',
        metricsAudit: {
          totalRows: 20,
          totalRevenueSum: 39632.5,
          meanRevenue: 1981.625,
          medianRevenue: 1880.0,
          standardDeviation: 984.12,
        },
        anomaliesDetected: 0,
      },
      limitationsAndAssumptions: [
        'Sample reference covers 20 transactions; seasonality adjustments require full-year data.',
        'Cost of goods sold (COGS) was excluded from raw schema.',
      ],
      proofHash: '0x3c9a1b5d7e8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0b',
    },
  },
  {
    id: 'task-craft-002',
    onChainTaskId: 2,
    title: 'Customer Churn Risk & Retention Cohort Modeling [Sample]',
    description:
      'Reference sample auditing engagement drops, recurring subscription lifecycles, and churn predictors across 350 records.',
    objective: 'Identify key churn indicators and quantify financial impact of 30-day reactivation campaigns.',
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

export function getStoredTasks(): TaskRecord[] {
  if (typeof window === 'undefined') {
    return PRELOADED_TASKS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem('craft_tasks_v1');
      if (legacyRaw) {
        const legacyParsed = (JSON.parse(legacyRaw) as TaskRecord[]).map((t) =>
          (t.status as number) === 5 && !t.verifiedAt ? { ...t, status: TaskState.Approved } : t
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyParsed));
        return legacyParsed;
      }
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
    window.dispatchEvent(new CustomEvent('craft_tasks_updated'));
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
    isDemo: false,
    verificationTier: newTask.verificationTier || 'local_verified_digest',
  };
  tasks.unshift(record);
  saveStoredTasks(tasks);
  return record;
}
