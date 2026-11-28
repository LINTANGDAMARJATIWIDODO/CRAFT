import {
  AgentProfile,
  CouncilExecutionRun,
  SubtaskDelegation,
  TaskRecord,
  TaskState,
  TrustGraphEdge,
  TrustGraphNode,
  TrustGraphSnapshot,
} from '@craft/shared';

function wouldCreateCycle(
  existing: SubtaskDelegation[],
  delegatorAgentId: string,
  delegateeAgentId: string
): boolean {
  if (delegatorAgentId === delegateeAgentId) return true;

  // Walk backwards: can delegatee reach delegator through existing delegation chains?
  const visited = new Set<string>();
  const stack = [delegateeAgentId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === delegatorAgentId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const d of existing) {
      if (d.delegatorAgentId === current) {
        stack.push(d.delegateeAgentId);
      }
    }
  }
  return false;
}

export function createValidatedDelegation(params: {
  existingDelegations: SubtaskDelegation[];
  parentTaskId: string;
  delegatorAgentId: string;
  delegateeAgent: AgentProfile;
  roleTitle: string;
  dependencySubtaskIds?: string[];
  contributionSummary: string;
  enforceAgentId?: boolean;
}): SubtaskDelegation {
  if (wouldCreateCycle(params.existingDelegations, params.delegatorAgentId, params.delegateeAgent.id)) {
    throw new Error(
      `Circular delegation rejected: ${params.delegatorAgentId} -> ${params.delegateeAgent.id} creates a cycle.`
    );
  }

  if (params.enforceAgentId && !params.delegateeAgent.verifiedAgentId) {
    throw new Error(
      `Delegation authorization failed: ${params.delegateeAgent.name} lacks verified Binance Agent ID.`
    );
  }

  return {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    parentTaskId: params.parentTaskId,
    delegatorAgentId: params.delegatorAgentId,
    delegateeAgentId: params.delegateeAgent.id,
    delegateeWallet: params.delegateeAgent.walletAddress,
    roleTitle: params.roleTitle,
    dependencySubtaskIds: params.dependencySubtaskIds || [],
    authorizedByAgentId: params.delegateeAgent.verifiedAgentId,
    status: 'pending',
    contributionSummary: params.contributionSummary,
    retryCount: 0,
  };
}

export async function runSubtaskWithRecovery<T>(
  delegation: SubtaskDelegation,
  fn: () => Promise<T>,
  maxRetries = 1
): Promise<{ delegation: SubtaskDelegation; result?: T }> {
  const started = performance.now();
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      delegation.status = 'running';
      const result = await fn();
      delegation.durationMs = Math.max(1, Math.round(performance.now() - started));
      delegation.status = attempt > 0 ? 'recovered' : 'completed';
      return { delegation, result };
    } catch (err: any) {
      delegation.retryCount += 1;
      delegation.error = err?.message || 'Subtask execution failed';
      if (attempt >= maxRetries) {
        delegation.durationMs = Math.max(1, Math.round(performance.now() - started));
        delegation.status = 'failed';
        return { delegation };
      }
      attempt += 1;
    }
  }

  return { delegation };
}

export function buildTrustGraphSnapshot(params: {
  agents: AgentProfile[];
  tasks: TaskRecord[];
  councilRuns: CouncilExecutionRun[];
}): TrustGraphSnapshot {
  const nodeMap = new Map<string, TrustGraphNode>();
  const edges: TrustGraphEdge[] = [];

  for (const agent of params.agents) {
    nodeMap.set(agent.id, {
      id: agent.id,
      label: agent.name,
      kind: 'agent',
      verifiedAgentId: agent.verifiedAgentId,
      reputationScore: agent.reputationScore,
      roleTitle: agent.title,
    });
  }

  for (const task of params.tasks) {
    const clientNodeId = `client:${task.clientAddress.toLowerCase()}`;
    if (!nodeMap.has(clientNodeId)) {
      nodeMap.set(clientNodeId, {
        id: clientNodeId,
        label: `Client ${task.clientAddress.slice(0, 6)}...${task.clientAddress.slice(-4)}`,
        kind: 'client',
      });
    }

    if (task.assignedAgentId && task.status === TaskState.Approved) {
      edges.push({
        id: `edge-approve-${task.id}`,
        source: clientNodeId,
        target: task.assignedAgentId,
        relation: 'APPROVED_BY',
        taskId: task.id,
        evidenceHash: task.outputProofHash,
        isDemo: task.isDemo,
      });
    }

    for (const del of task.delegations || []) {
      if (nodeMap.has(del.delegatorAgentId) && nodeMap.has(del.delegateeAgentId)) {
        edges.push({
          id: `edge-del-${del.id}`,
          source: del.delegatorAgentId,
          target: del.delegateeAgentId,
          relation: 'DELEGATED_TO',
          taskId: task.id,
          evidenceHash: del.evidenceHash,
          isDemo: task.isDemo,
        });
      }
    }
  }

  for (const run of params.councilRuns) {
    for (const del of run.delegations || []) {
      if (nodeMap.has(del.delegatorAgentId) && nodeMap.has(del.delegateeAgentId)) {
        edges.push({
          id: `edge-run-del-${del.id}`,
          source: del.delegatorAgentId,
          target: del.delegateeAgentId,
          relation: del.roleTitle.toLowerCase().includes('validation') ? 'VALIDATED_BY' : 'DELEGATED_TO',
          taskId: run.taskId || run.id,
          evidenceHash: del.evidenceHash,
          isDemo: run.isDemo,
        });
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: edges.slice(0, 60),
    generatedAt: new Date().toISOString(),
  };
}
