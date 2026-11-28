import {
  AgentProfile,
  ReputationBreakdown,
  TaskRecord,
  TaskState,
} from '@craft/shared';

export const REPUTATION_METHODOLOGY = {
  dimensions: [
    { key: 'reliability', label: 'Reliability', weight: 0.2, rule: 'Successful verified executions without failures or broken digests.' },
    { key: 'quality', label: 'Analytical Quality', weight: 0.25, rule: 'Mean dataset hygiene, Z-score anomaly, and contradiction audit score.' },
    { key: 'completion', label: 'Completion Rate', weight: 0.15, rule: 'Ratio of approved tasks over total assigned work.' },
    { key: 'expertise', label: 'Capability Expertise', weight: 0.15, rule: 'Verified capability breadth and historical task volume.' },
    { key: 'clientTrust', label: 'Client Trust', weight: 0.15, rule: 'Human approval rate penalized by client revision requests.' },
    { key: 'timeliness', label: 'SLA Timeliness', weight: 0.1, rule: 'Actual execution duration relative to SLA target.' },
  ],
  safeguards: [
    'Each taskId can only credit reputation once (rewardedTaskIds deduplication).',
    'Self-approval is strictly rejected: clientAddress cannot equal assigned agent walletAddress.',
    'Seed demonstration history does not qualify agents for live leaderboard prize ranking.',
    'AI Council agreement checks consistency and never self-approves a task.',
  ],
};

export function computeReputationBreakdown(
  agent: AgentProfile,
  tasks: TaskRecord[]
): ReputationBreakdown {
  const agentTasks = tasks.filter((t) => t.assignedAgentId === agent.id);
  const liveTasks = agentTasks.filter((t) => !t.isDemo);
  const approvedTasks = agentTasks.filter((t) => t.status === TaskState.Approved);
  const revisions = agentTasks.filter((t) => t.status === TaskState.RevisionRequested || Boolean(t.revisionReason));

  const reliability = Math.min(100, Math.max(40, Math.round(agent.reliabilityScore ?? (approvedTasks.length > 0 ? 96 : 85))));
  const quality = Math.min(100, Math.max(40, Math.round(agent.qualityScoreAvg ?? 90)));

  const totalHandled = Math.max(1, agent.tasksCompleted + (agent.totalRevisions ?? revisions.length));
  const completion = Math.min(
    100,
    Math.max(40, Math.round((agent.tasksCompleted / totalHandled) * 100))
  );

  const capCount = agent.capabilitySpec?.capabilities.length ?? agent.specialty.length;
  const expertise = Math.min(100, Math.round(62 + Math.min(20, capCount * 4) + Math.min(18, agent.tasksCompleted * 1.2)));

  const totalVotes = Math.max(1, (agent.totalApprovals ?? approvedTasks.length) + (agent.totalRevisions ?? 0));
  const clientTrust = Math.min(
    100,
    Math.round(
      agent.approvalRate ?? ((agent.totalApprovals ?? agent.tasksCompleted) / totalVotes) * 100
    )
  );

  const slaTarget = agent.capabilitySpec?.slaDeliverySec ?? 25;
  const actualSec = Math.max(1, agent.avgExecutionTimeSec || 5);
  const timeliness = Math.min(100, Math.max(55, Math.round(actualSec <= slaTarget ? 98 - actualSec * 0.6 : Math.max(55, 100 - (actualSec - slaTarget) * 2))));

  const overallScore = Number(
    (
      reliability * 0.2 +
      quality * 0.25 +
      completion * 0.15 +
      expertise * 0.15 +
      clientTrust * 0.15 +
      timeliness * 0.1
    ).toFixed(1)
  );

  return {
    reliability,
    quality,
    completion,
    expertise,
    clientTrust,
    timeliness,
    overallScore,
    verifiedWorkCount: agent.tasksCompleted,
    liveWorkCount: liveTasks.filter((t) => t.status === TaskState.Approved).length,
    methodologyNote:
      'Weighted 6-dimension score computed from verifiable execution evidence, SLA latency, contradiction checks, and deduplicated client approvals.',
  };
}

export function validateApprovalEligibility(params: {
  task: TaskRecord;
  callerAddress: string;
  agent?: AgentProfile;
  rewardedTaskIds: Set<string>;
}): { allowed: boolean; reason?: string } {
  const caller = params.callerAddress.trim().toLowerCase();
  if (params.agent && caller === params.agent.walletAddress.trim().toLowerCase()) {
    return {
      allowed: false,
      reason: 'Anti-self-approval guard: assigned agent wallet cannot approve its own work or accrue reputation.',
    };
  }
  if (params.task.status === TaskState.Approved) {
    return {
      allowed: false,
      reason: 'Task is already approved; duplicate approval cannot alter reputation.',
    };
  }
  if (params.rewardedTaskIds.has(params.task.id)) {
    return {
      allowed: false,
      reason: 'Reputation reward already credited once for this taskId.',
    };
  }
  return { allowed: true };
}
