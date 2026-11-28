import {
  AgentBid,
  AgentCapabilitySpec,
  AgentMatchExplanation,
  AgentProfile,
  TaskRecord,
} from '@craft/shared';

export function buildDefaultCapabilitySpec(roleKey?: AgentProfile['roleKey']): AgentCapabilitySpec {
  switch (roleKey) {
    case 'orchestrator':
      return {
        capabilities: ['task_decomposition', 'agent_matching', 'delegation_routing', 'workflow_orchestration', 'proof_aggregation'],
        inputFormats: ['CSV', 'JSON', 'Objective Spec'],
        outputFormats: ['Execution Plan', 'Subtask DAG', 'Composite Proof'],
        supportedOperations: ['decompose', 'delegate', 'route', 'synthesize', 'audit_hash'],
        maxRowsLimit: 250000,
        timeoutSec: 60,
        baseCostBnb: '0.0005',
        costUsdEstimate: 0.35,
        slaDeliverySec: 15,
        maxRevisions: 2,
      };
    case 'datacraft':
      return {
        capabilities: ['revenue_analytics', 'kpi_benchmarking', 'cohort_segmentation', 'pearson_correlation', 'ols_forecasting'],
        inputFormats: ['CSV', 'Tabular JSON'],
        outputFormats: ['Executive Report', 'Statistical Digest', 'Recommendation Matrix'],
        supportedOperations: ['profile', 'describe', 'correlate', 'time_series', 'forecast'],
        maxRowsLimit: 100000,
        timeoutSec: 45,
        baseCostBnb: '0.0012',
        costUsdEstimate: 0.85,
        slaDeliverySec: 12,
        maxRevisions: 2,
      };
    case 'sentinel':
      return {
        capabilities: ['anomaly_detection', 'z_score_outliers', 'contradiction_audit', 'data_hygiene', 'duplicate_detection'],
        inputFormats: ['CSV', 'Audit Stream'],
        outputFormats: ['Anomaly Ledger', 'Contradiction Report', 'Risk Flags'],
        supportedOperations: ['zscore_scan', 'null_audit', 'deduplicate', 'contradiction_verify'],
        maxRowsLimit: 150000,
        timeoutSec: 40,
        baseCostBnb: '0.0010',
        costUsdEstimate: 0.7,
        slaDeliverySec: 10,
        maxRevisions: 2,
      };
    case 'metricsmind':
      return {
        capabilities: ['executive_synthesis', 'strategic_insights', 'trend_forecasting', 'confidence_scoring', 'narrative_reporting'],
        inputFormats: ['JSON Stats', 'CSV Summary'],
        outputFormats: ['Boardroom Brief', 'Action Plan', 'Confidence Assessment'],
        supportedOperations: ['summarize', 'forecast_interpret', 'prioritize_actions', 'document_limits'],
        maxRowsLimit: 100000,
        timeoutSec: 35,
        baseCostBnb: '0.0009',
        costUsdEstimate: 0.65,
        slaDeliverySec: 12,
        maxRevisions: 2,
      };
    default:
      return {
        capabilities: ['csv_analytics', 'descriptive_stats', 'proof_verification'],
        inputFormats: ['CSV'],
        outputFormats: ['Analytical Report'],
        supportedOperations: ['profile', 'summarize'],
        maxRowsLimit: 50000,
        timeoutSec: 45,
        baseCostBnb: '0.0011',
        costUsdEstimate: 0.75,
        slaDeliverySec: 18,
        maxRevisions: 1,
      };
  }
}

export function matchAgentsForTask(params: {
  agents: AgentProfile[];
  objective: string;
  csvHeaders?: string[];
  rowCount?: number;
  preferLowestCost?: boolean;
  maxLatencySec?: number;
}): AgentMatchExplanation[] {
  const lowerObj = `${params.objective} ${(params.csvHeaders || []).join(' ')}`.toLowerCase();
  const rowCount = params.rowCount ?? 20;

  const keywordsMap: Record<string, string[]> = {
    anomaly_detection: ['anomaly', 'anomalies', 'outlier', 'risk', 'fraud', 'audit', 'hygiene', 'z-score', 'sentinel', 'clean'],
    z_score_outliers: ['outlier', 'zscore', 'spike', 'deviation', 'variance', 'error'],
    contradiction_audit: ['verify', 'contradiction', 'consistency', 'validate', 'compliance'],
    revenue_analytics: ['revenue', 'sales', 'order', 'price', 'profit', 'margin', 'kpi', 'financial'],
    pearson_correlation: ['correlation', 'relationship', 'driver', 'impact', 'compare', 'factor'],
    ols_forecasting: ['forecast', 'predict', 'projection', 'trend', 'future', 'growth', 'month', 'date'],
    executive_synthesis: ['executive', 'summary', 'strategy', 'recommendation', 'board', 'insight'],
    task_decomposition: ['multi-agent', 'council', 'orchestrate', 'pipeline', 'delegate', 'workflow'],
  };

  const results: AgentMatchExplanation[] = params.agents.map((agent) => {
    const spec = agent.capabilitySpec || buildDefaultCapabilitySpec(agent.roleKey);
    const matchedCapabilities: string[] = [];

    for (const cap of spec.capabilities) {
      const kws = keywordsMap[cap] || cap.split('_');
      if (kws.some((kw) => lowerObj.includes(kw))) {
        matchedCapabilities.push(cap);
      }
    }

    const rowCapacityOk = rowCount <= spec.maxRowsLimit;
    const capabilityMatchScore = rowCapacityOk
      ? Math.min(100, Math.round(52 + matchedCapabilities.length * 14 + (agent.verifiedAgentId ? 8 : 0)))
      : 20;

    const historicalPerformanceScore = Math.min(
      100,
      Math.round(agent.reputationScore * 0.65 + (agent.approvalRate ?? 90) * 0.35)
    );

    const availabilityScore = agent.isAvailable ? (agent.verifiedAgentId ? 100 : 72) : 25;

    const latencyCeiling = params.maxLatencySec || 30;
    const speedScore = Math.min(
      100,
      Math.max(30, Math.round(100 - (agent.avgExecutionTimeSec / Math.max(5, latencyCeiling)) * 45))
    );

    const costEfficiencyScore = Math.min(
      100,
      Math.max(40, Math.round(100 - spec.costUsdEstimate * 35))
    );

    const costWeight = params.preferLowestCost ? 0.25 : 0.1;
    const capWeight = params.preferLowestCost ? 0.25 : 0.35;

    const totalMatchScore = Number(
      (
        capabilityMatchScore * capWeight +
        historicalPerformanceScore * 0.25 +
        availabilityScore * 0.15 +
        speedScore * 0.15 +
        costEfficiencyScore * costWeight
      ).toFixed(1)
    );

    const rationale = [
      matchedCapabilities.length > 0
        ? `Matched capabilities: ${matchedCapabilities.join(', ')}.`
        : `Generalist fit across ${spec.capabilities.slice(0, 2).join(', ')}.`,
      agent.verifiedAgentId
        ? `Official Binance Agent ID verified on BNB Chain.`
        : `Unverified wallet (limited priority).`,
      `Evidence: ${agent.tasksCompleted} completed jobs (${agent.reputationScore} rep, ~${agent.avgExecutionTimeSec}s SLA).`,
    ].join(' ');

    return {
      agent,
      totalMatchScore,
      factors: {
        capabilityMatchScore,
        historicalPerformanceScore,
        availabilityScore,
        speedScore,
        costEfficiencyScore,
      },
      matchedCapabilities,
      estimatedTimeSec: agent.avgExecutionTimeSec || spec.slaDeliverySec,
      estimatedCostUsd: spec.costUsdEstimate,
      rationale,
    };
  });

  return results.sort((a, b) => b.totalMatchScore - a.totalMatchScore);
}

export function buildBidProposal(params: {
  task: TaskRecord;
  agent: AgentProfile;
  methodology?: string;
  estimatedDurationSec?: number;
  proposedCostUsd?: number;
  deliverables?: string[];
  enforceAgentId?: boolean;
}): AgentBid {
  if (params.enforceAgentId && !params.agent.verifiedAgentId) {
    throw new Error(`Agent ${params.agent.name} lacks verified Binance Agent ID and cannot submit competitive bids.`);
  }

  const spec = params.agent.capabilitySpec || buildDefaultCapabilitySpec(params.agent.roleKey);
  const match = matchAgentsForTask({
    agents: [params.agent],
    objective: `${params.task.title} ${params.task.objective}`,
    rowCount: params.task.datasetRowCount,
  })[0];

  return {
    id: `bid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    taskId: params.task.id,
    agentId: params.agent.id,
    agentName: params.agent.name,
    agentWallet: params.agent.walletAddress,
    verifiedAgentId: params.agent.verifiedAgentId,
    capabilityMatchScore: match?.totalMatchScore ?? 80,
    methodology:
      params.methodology ||
      `Deterministic CSV profiling -> ${spec.supportedOperations.slice(0, 3).join(' + ')} -> 4-digest SHA-256 commitment.`,
    estimatedDurationSec: params.estimatedDurationSec ?? spec.slaDeliverySec,
    proposedCostUsd: params.proposedCostUsd ?? spec.costUsdEstimate,
    deliverables:
      params.deliverables && params.deliverables.length > 0
        ? params.deliverables
        : spec.outputFormats,
    performanceEvidence: {
      completedJobs: params.agent.tasksCompleted,
      approvalRate: params.agent.approvalRate ?? (params.agent.tasksCompleted > 0 ? 100 : 0),
      reputationScore: params.agent.reputationScore,
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}
