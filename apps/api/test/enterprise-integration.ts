import assert from 'assert';
import { craftStore } from '../src/modules/store/craft-store';
import { councilService } from '../src/modules/council/council-service';
import { workflowService } from '../src/modules/workflows/workflow-service';
import { developerService } from '../src/modules/developer/developer-service';
import { SAMPLE_SALES_CSV_BACKEND } from '../src/modules/analytics/deterministic-engine';
import { matchAgentsForTask, buildBidProposal } from '../src/modules/economy/matching-bidding-service';
import { createValidatedDelegation, buildTrustGraphSnapshot } from '../src/modules/delegation/delegation-service';
import { computeReputationBreakdown, validateApprovalEligibility } from '../src/modules/reputation/reputation-service';
import { missionSseBroker } from '../src/modules/mission/sse-broker';
import { benchmarkService } from '../src/modules/benchmark/benchmark-service';

async function runEnterpriseTests() {
  console.log('\n========================================');
  console.log('Running CRAFT Competitive Backend Test Suite');
  console.log('========================================\n');

  // 1. Deterministic Council Sequential Pipeline + 4 Digests + Contradiction Checks + SSE Events
  console.log('1. Testing Multi-Agent Council (4 Digests, Delegations, Contradiction Check, SSE)...');
  const councilResult = await councilService.executeCouncilRun({
    title: 'Test Competitive Council Audit Run',
    objective: 'Compute revenue metrics, correlations, linear forecast, and detect outliers.',
    fileName: 'test_sales.csv',
    csvContent: SAMPLE_SALES_CSV_BACKEND,
    clientAddress: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
    isDemoMission: false,
  });

  assert.strictEqual(councilResult.run.steps.length, 4, 'Must execute all 4 sequential council roles');
  assert(councilResult.run.configHash?.startsWith('0x'), 'Must compute 4th configHash digest');
  assert(councilResult.task.digests?.datasetHash && councilResult.task.digests?.configHash && councilResult.task.digests?.evidenceHash && councilResult.task.digests?.reportHash, 'Must seal all 4 digests');
  assert((councilResult.run.delegations?.length ?? 0) >= 3, 'Must record hierarchical SubtaskDelegations');
  assert((councilResult.run.contradictionChecks?.length ?? 0) >= 3, 'Must perform contradiction cross-checks');
  assert(
    typeof councilResult.run.confidenceScore === 'number' &&
      councilResult.run.confidenceScore > 0 &&
      councilResult.run.confidenceScore <= 95,
    'Confidence score must be realistically bounded'
  );
  assert((councilResult.run.calculations?.correlations?.length ?? 0) > 0, 'Must compute Pearson correlations');
  assert(councilResult.run.calculations?.forecast !== undefined, 'Must compute chronological OLS forecast');
  assert(!councilResult.task.onChainTxHash, 'Must NOT fabricate fake on-chain txHash');
  assert(missionSseBroker.getRecentEvents(10).length >= 5, 'SSE broker must record real lifecycle events');
  console.log('  OK: 4-digest bundle, correlations, forecast, contradiction check, and SSE telemetry verified');

  // 2. Explainable Matching, Bidding & Cycle Prevention in Hierarchical Delegation
  console.log('\n2. Testing Explainable Matching, Bidding & Circular Delegation Guard...');
  const matches = matchAgentsForTask({
    agents: craftStore.state.agents,
    objective: 'Detect revenue outliers, Pearson correlations, and executive forecast',
    csvHeaders: ['Date', 'Revenue', 'Units_Sold'],
    rowCount: 20,
  });
  assert(matches.length >= 4 && matches[0].totalMatchScore > 0, 'Matcher must score agents transparently');

  // Enforce Agent ID gate blocks unverified wallets from bidding when strict mode enabled
  assert.throws(() => {
    buildBidProposal({
      task: councilResult.task,
      agent: { ...craftStore.state.agents[0], verifiedAgentId: false },
      enforceAgentId: true,
    });
  }, /lacks verified Binance Agent ID/, 'Unverified wallet must be rejected under strict Agent ID bidding gate');

  const sampleBid = buildBidProposal({
    task: councilResult.task,
    agent: { ...craftStore.state.agents[0], verifiedAgentId: true },
    enforceAgentId: true,
  });
  assert(sampleBid.verifiedAgentId && sampleBid.performanceEvidence.reputationScore > 0, 'Bid must carry Agent ID & evidence');

  assert.throws(() => {
    createValidatedDelegation({
      existingDelegations: [
        {
          id: 'sub-1',
          parentTaskId: 't1',
          delegatorAgentId: 'agent-orchestrator-00',
          delegateeAgentId: 'agent-datacraft-01',
          delegateeWallet: '0x1',
          roleTitle: 'Quant',
          dependencySubtaskIds: [],
          authorizedByAgentId: true,
          status: 'completed',
          contributionSummary: 'test',
          retryCount: 0,
        },
      ],
      parentTaskId: 't1',
      delegatorAgentId: 'agent-datacraft-01',
      delegateeAgent: craftStore.state.agents.find((a) => a.id === 'agent-orchestrator-00')!,
      roleTitle: 'Cycle test',
      contributionSummary: 'should reject',
    });
  }, /Circular delegation rejected/, 'Circular delegation must be rejected');
  console.log('  OK: Explainable matching, bidding & cycle prevention passed');

  // 3. 6-Dimension Reputation & Anti-Self-Approval / Duplicate Guard
  console.log('\n3. Testing 6-Dimension Reputation & Anti-Self-Approval Safeguards...');
  const primaryAgent = craftStore.state.agents[0];
  const breakdown = computeReputationBreakdown(primaryAgent, craftStore.state.tasks);
  assert(
    breakdown.reliability > 0 &&
      breakdown.quality > 0 &&
      breakdown.completion > 0 &&
      breakdown.expertise > 0 &&
      breakdown.clientTrust > 0 &&
      breakdown.timeliness > 0,
    'All 6 reputation dimensions must populate'
  );

  const selfApprovalCheck = validateApprovalEligibility({
    task: councilResult.task,
    callerAddress: primaryAgent.walletAddress,
    agent: primaryAgent,
    rewardedTaskIds: new Set(),
  });
  assert.strictEqual(selfApprovalCheck.allowed, false, 'Self-approval by assigned agent wallet must be blocked');

  const duplicateCheck = validateApprovalEligibility({
    task: councilResult.task,
    callerAddress: councilResult.task.clientAddress,
    agent: primaryAgent,
    rewardedTaskIds: new Set([councilResult.task.id]),
  });
  assert.strictEqual(duplicateCheck.allowed, false, 'Duplicate task reputation reward must be blocked');
  console.log('  OK: 6-dimension reputation & anti-self-approval guards verified');

  // 4. Blinded Benchmark Arena & Trust Graph Snapshot
  console.log('\n4. Testing Blinded Benchmark Arena & Real Trust Graph...');
  const benchRun = benchmarkService.runBlindedBenchmark({
    agents: craftStore.state.agents,
    csvContent: SAMPLE_SALES_CSV_BACKEND,
    fileName: 'benchmark_sales.csv',
  });
  assert(benchRun.results.length >= 2, 'Benchmark must compare multiple specialist agents');
  assert.strictEqual(benchRun.results[0].numericalAccuracyScore, 100, 'Deterministic engine must achieve 100% accuracy vs verifier');
  const rated = benchmarkService.rateAgentInRun(benchRun.id, benchRun.results[0].agentId, 5);
  assert.strictEqual(rated?.results[0].humanEvaluationRating, 5, 'Human benchmark rating must persist');

  const graph = buildTrustGraphSnapshot({
    agents: craftStore.state.agents,
    tasks: craftStore.state.tasks,
    councilRuns: craftStore.state.councilRuns,
  });
  assert(graph.nodes.length >= 4 && graph.edges.length >= 3, 'Trust Graph must reflect recorded delegations and approvals');
  console.log(`  OK: Benchmark evaluated ${benchRun.results.length} agents & Trust Graph emitted ${graph.edges.length} edges`);

  // 5. Workflow Studio Topological Execution
  console.log('\n5. Testing Visual Workflow Studio Execution...');
  const template = workflowService.listWorkflows()[0];
  assert(template && template.nodes.length >= 4, 'Template workflow must exist');
  const wfExec = await workflowService.executeWorkflow({
    workflowId: template.id,
    workflowName: template.name,
    nodes: template.nodes,
    edges: template.edges,
    csvContent: SAMPLE_SALES_CSV_BACKEND,
    fileName: 'wf_test.csv',
  });
  assert.strictEqual(wfExec.status, 'completed', 'Workflow execution should complete cleanly');
  console.log(`  OK: Executed ${wfExec.stepResults.length} workflow nodes deterministically`);

  // 6. Developer API Key Security & Leaderboard Anti-Sybil Gate
  console.log('\n6. Testing Developer API Security & Leaderboard Anti-Sybil Gate...');
  const issued = developerService.createApiKey({ name: 'Test Enterprise Key' });
  assert(issued.secretKeyOnce.startsWith('craft_live_'), 'Generated secret must have prefix');
  const found = developerService.listApiKeys().find((k) => k.id === issued.meta.id);
  assert(found && (found as any).keyHash === undefined, 'Must NEVER expose keyHash');
  developerService.revokeApiKey(issued.meta.id);
  assert.strictEqual(developerService.verifyKeyAndTrack(issued.secretKeyOnce), null, 'Revoked key must be rejected');

  assert.throws(() => {
    developerService.registerWebhook({ url: 'http://127.0.0.1:4000/hook', events: ['TaskApproved'] });
  }, /blocked for security/, 'SSRF loopback webhook URL must be rejected');

  const leaderboard = craftStore.getLeaderboard('overall');
  assert(leaderboard.length >= 4 && leaderboard[0].rank === 1, 'Leaderboard must rank agents cleanly');
  console.log('  OK: Secret protection, SSRF block, and Leaderboard verification passed');

  console.log('\n========================================');
  console.log('ALL COMPETITIVE BACKEND TESTS PASSED!');
  console.log('========================================\n');
}

runEnterpriseTests().catch((err) => {
  console.error('Enterprise test suite failed:', err);
  process.exit(1);
});
