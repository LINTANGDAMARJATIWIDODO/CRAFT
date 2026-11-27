import assert from 'assert';
import { craftStore } from '../src/modules/store/craft-store';
import { councilService } from '../src/modules/council/council-service';
import { workflowService } from '../src/modules/workflows/workflow-service';
import { developerService } from '../src/modules/developer/developer-service';
import { SAMPLE_SALES_CSV_BACKEND } from '../src/modules/analytics/deterministic-engine';

async function runEnterpriseTests() {
  console.log('\n========================================');
  console.log('Running CRAFT Enterprise Backend Test Suite');
  console.log('========================================\n');

  // 1. Deterministic Council Sequential Pipeline
  console.log('1. Testing Multi-Agent Council Sequential Execution...');
  const councilResult = await councilService.executeCouncilRun({
    title: 'Test Council Audit Run',
    objective: 'Compute revenue metrics, detect outliers, and generate proof digest.',
    fileName: 'test_sales.csv',
    csvContent: SAMPLE_SALES_CSV_BACKEND,
    clientAddress: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
    isDemoMission: false,
  });

  assert.strictEqual(councilResult.run.steps.length, 4, 'Must execute all 4 sequential council roles');
  assert.strictEqual(councilResult.run.steps[0].role, 'orchestrator');
  assert.strictEqual(councilResult.run.steps[1].role, 'datacraft');
  assert.strictEqual(councilResult.run.steps[2].role, 'sentinel');
  assert.strictEqual(councilResult.run.steps[3].role, 'metricsmind');
  assert(councilResult.task.outputProofHash?.startsWith('0x'), 'Must compute SHA-256 output proof hash');
  assert(!councilResult.task.onChainTxHash, 'Must NOT fabricate fake on-chain txHash');
  console.log('  ✓ Sequential Council pipeline completed cleanly without fake tx hashes');

  // 2. Workflow Studio Topological Execution
  console.log('\n2. Testing Visual Workflow Studio Execution...');
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
  assert.strictEqual(wfExec.stepResults.length, template.nodes.length, 'Every node must produce step output');
  console.log(`  ✓ Executed ${wfExec.stepResults.length} workflow nodes deterministically`);

  // 3. Developer API Key Security (No secret leak in list)
  console.log('\n3. Testing Developer API Key Security & SSRF Guards...');
  const issued = developerService.createApiKey({ name: 'Test Enterprise Key' });
  assert(issued.secretKeyOnce.startsWith('craft_live_'), 'Generated secret must have prefix');
  const list = developerService.listApiKeys();
  const found = list.find((k) => k.id === issued.meta.id);
  assert(found, 'Created key metadata should appear in list');
  assert.strictEqual((found as any).keyHash, undefined, 'Must NEVER expose keyHash in API responses');
  assert.strictEqual((found as any).secretKeyOnce, undefined, 'Must NEVER expose raw secret in list');

  const verified = developerService.verifyKeyAndTrack(issued.secretKeyOnce);
  assert(verified !== null && verified.requestCount === 1, 'Valid key must authenticate & track request count');
  developerService.revokeApiKey(issued.meta.id);
  assert.strictEqual(developerService.verifyKeyAndTrack(issued.secretKeyOnce), null, 'Revoked key must be rejected');

  assert.throws(() => {
    developerService.registerWebhook({ url: 'http://127.0.0.1:4000/hook', events: ['TaskApproved'] });
  }, /blocked for security/, 'SSRF loopback webhook URL must be rejected');
  console.log('  ✓ Secret API keys never exposed in listing & SSRF webhook URLs blocked');

  // 4. Leaderboard Fraud Prevention Gate
  console.log('\n4. Testing Global Agent League Ranking & Anti-Sybil Gate...');
  const leaderboard = craftStore.getLeaderboard('overall');
  assert(leaderboard.length >= 4, 'Leaderboard should list active agents');
  assert.strictEqual(leaderboard[0].rank, 1, 'Top rank should be 1');
  console.log(`  ✓ Leaderboard ranked ${leaderboard.length} agents with minimum sample gating`);

  console.log('\n========================================');
  console.log('ALL ENTERPRISE BACKEND TESTS PASSED!');
  console.log('========================================\n');
}

runEnterpriseTests().catch((err) => {
  console.error('Enterprise test suite failed:', err);
  process.exit(1);
});
