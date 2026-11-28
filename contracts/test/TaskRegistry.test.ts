import { expect } from 'chai';
import { ethers } from 'hardhat';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { TaskRegistry, MockAgentID } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('TaskRegistry Competitive Work Protocol Suite', function () {
  let taskRegistry: TaskRegistry;
  let mockAgentId: MockAgentID;
  let owner: SignerWithAddress;
  let client: SignerWithAddress;
  let agentWithId: SignerWithAddress;
  let validatorAgentWithId: SignerWithAddress;
  let agentWithoutId: SignerWithAddress;
  let attacker: SignerWithAddress;

  const datasetHash = ethers.keccak256(ethers.toUtf8Bytes('dataset-sales-q1.csv'));
  const configHash = ethers.keccak256(ethers.toUtf8Bytes('zscore=2.0;mode=deterministic'));
  const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes('calc-metrics-canonical'));
  const proofHash = ethers.keccak256(ethers.toUtf8Bytes('output-proof-analysis-report'));

  beforeEach(async function () {
    [owner, client, agentWithId, validatorAgentWithId, agentWithoutId, attacker] = await ethers.getSigners();

    const MockAgentFactory = await ethers.getContractFactory('MockAgentID');
    mockAgentId = await MockAgentFactory.deploy();
    await mockAgentId.waitForDeployment();

    await mockAgentId.mint(agentWithId.address);
    await mockAgentId.mint(validatorAgentWithId.address);

    const TaskRegistryFactory = await ethers.getContractFactory('TaskRegistry');
    taskRegistry = await TaskRegistryFactory.deploy(await mockAgentId.getAddress(), true);
    await taskRegistry.waitForDeployment();
  });

  describe('Initialization, Agent ID Verification & Capability Registry', function () {
    it('should configure Agent ID contract and toggle enforcement', async function () {
      expect(await taskRegistry.agentIdContract()).to.equal(await mockAgentId.getAddress());
      expect(await taskRegistry.enforceAgentIdCheck()).to.be.true;
      expect(await taskRegistry.nextTaskId()).to.equal(1);

      await taskRegistry.setEnforceAgentIdCheck(false);
      expect(await taskRegistry.enforceAgentIdCheck()).to.be.false;
    });

    it('should allow Agent ID holder to register capabilities and track unique Agent IDs', async function () {
      await expect(
        taskRegistry.connect(agentWithoutId).registerAgentCapabilities('ipfs://cap-none')
      ).to.be.revertedWithCustomError(taskRegistry, 'MissingAgentID');

      await expect(taskRegistry.connect(agentWithId).registerAgentCapabilities('ipfs://cap-datacraft'))
        .to.emit(taskRegistry, 'AgentCapabilityRegistered')
        .withArgs(agentWithId.address, 'ipfs://cap-datacraft', true);

      expect(await taskRegistry.uniqueAgentIdCount()).to.equal(1);
    });

    it('should allow 1-tx Agent ID check-in and atomic 4-digest commitVerifiedWork while counting unique Agent IDs', async function () {
      await expect(
        taskRegistry.connect(agentWithoutId).verifyAndCheckInAgentId('analyst')
      ).to.be.revertedWithCustomError(taskRegistry, 'MissingAgentID');

      await expect(taskRegistry.connect(agentWithId).verifyAndCheckInAgentId('datacraft-quant'))
        .to.emit(taskRegistry, 'AgentCheckedIn')
        .withArgs(agentWithId.address, 'datacraft-quant', true, anyValue);

      expect(await taskRegistry.uniqueAgentIdCount()).to.equal(1);

      // Re-checking in same address must NOT double-count uniqueAgentIdCount
      await taskRegistry.connect(agentWithId).verifyAndCheckInAgentId('datacraft-quant');
      expect(await taskRegistry.uniqueAgentIdCount()).to.equal(1);

      // Second unique Agent ID holder commits full 4-digest work atomically
      await expect(
        taskRegistry
          .connect(validatorAgentWithId)
          .commitVerifiedWork(datasetHash, configHash, evidenceHash, proofHash, 'ipfs://council-mission')
      ).to.emit(taskRegistry, 'WorkProofAnchoredOnChain');

      expect(await taskRegistry.uniqueAgentIdCount()).to.equal(2);
      expect(await taskRegistry.taskCount()).to.equal(1);
      const anchored = await taskRegistry.getTask(1);
      expect(anchored.state).to.equal(6); // Approved
      expect(anchored.proofHash).to.equal(proofHash);
    });
  });

  describe('Agent Bidding & Hierarchical Delegation', function () {
    it('should support competitive bidding and client selection (Created -> Proposed -> Accepted)', async function () {
      await taskRegistry.connect(client).createTask(ethers.ZeroAddress, datasetHash, 'ipfs://open-task');

      // Agent without Agent ID cannot bid
      await expect(
        taskRegistry.connect(agentWithoutId).proposeBid(1, 30, 0, configHash)
      ).to.be.revertedWithCustomError(taskRegistry, 'MissingAgentID');

      // Qualified agent bids
      await expect(taskRegistry.connect(agentWithId).proposeBid(1, 25, 1000, configHash))
        .to.emit(taskRegistry, 'BidProposed');

      let task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(1); // Proposed

      // Non-client cannot select bid
      await expect(
        taskRegistry.connect(attacker).selectBid(1, agentWithId.address)
      ).to.be.revertedWithCustomError(taskRegistry, 'UnauthorizedClient');

      // Client selects winning bid
      await expect(taskRegistry.connect(client).selectBid(1, agentWithId.address))
        .to.emit(taskRegistry, 'BidSelected');

      task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(2); // Accepted
      expect(task.assignedAgent).to.equal(agentWithId.address);
    });

    it('should allow hierarchical subtask delegation while blocking circular or unauthorized delegation', async function () {
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://parent-task');
      await taskRegistry.connect(agentWithId).acceptTask(1);

      // Circular self-delegation rejected
      await expect(
        taskRegistry.connect(agentWithId).delegateSubtask(1, agentWithId.address, evidenceHash, 'ipfs://sub')
      ).to.be.revertedWithCustomError(taskRegistry, 'CircularDelegation');

      // Attacker unauthorized delegation rejected
      await expect(
        taskRegistry.connect(attacker).delegateSubtask(1, validatorAgentWithId.address, evidenceHash, 'ipfs://sub')
      ).to.be.revertedWithCustomError(taskRegistry, 'UnauthorizedAgent');

      // Delegate to agent without ID rejected
      await expect(
        taskRegistry.connect(agentWithId).delegateSubtask(1, agentWithoutId.address, evidenceHash, 'ipfs://sub')
      ).to.be.revertedWithCustomError(taskRegistry, 'MissingAgentID');

      // Valid delegation to verified validator agent
      await expect(
        taskRegistry.connect(agentWithId).delegateSubtask(1, validatorAgentWithId.address, evidenceHash, 'ipfs://sub-sentinel')
      ).to.emit(taskRegistry, 'SubtaskDelegated');

      const subs = await taskRegistry.getChildSubtasks(1);
      expect(subs.length).to.equal(1);
      const sub = await taskRegistry.getTask(subs[0]);
      expect(sub.parentTaskId).to.equal(1);
      expect(sub.assignedAgent).to.equal(validatorAgentWithId.address);
    });
  });

  describe('Full Lifecycle, Four-Digest Verification & Anti-Self-Approval', function () {
    it('should execute full Created -> Accepted -> InProgress -> Submitted -> Verified -> Approved flow', async function () {
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://meta-full');
      await taskRegistry.connect(agentWithId).acceptTask(1);
      await taskRegistry.connect(agentWithId).startTask(1);

      await expect(
        taskRegistry.connect(agentWithId).submitFourDigestsProof(1, configHash, evidenceHash, proofHash, 'ipfs://report-json')
      ).to.emit(taskRegistry, 'ProofDigestsCommitted');

      // Executing agent cannot verify their own work!
      await expect(
        taskRegistry.connect(agentWithId).verifyTask(1, evidenceHash)
      ).to.be.revertedWithCustomError(taskRegistry, 'UnauthorizedValidator');

      // Independent validator verifies submission
      await expect(taskRegistry.connect(validatorAgentWithId).verifyTask(1, evidenceHash))
        .to.emit(taskRegistry, 'TaskVerified');

      let task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(5); // Verified
      expect(task.verifiedByValidator).to.equal(validatorAgentWithId.address);

      // Client approves verified deliverable
      await expect(taskRegistry.connect(client).approveTask(1))
        .to.emit(taskRegistry, 'TaskApproved');

      task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(6); // Approved
    });

    it('should block self-approval when client equals assigned agent', async function () {
      await taskRegistry.connect(agentWithId).createTask(agentWithId.address, datasetHash, 'ipfs://self');
      await taskRegistry.connect(agentWithId).acceptTask(1);
      await taskRegistry.connect(agentWithId).startTask(1);
      await taskRegistry.connect(agentWithId).submitProof(1, proofHash, 'ipfs://out');

      await expect(
        taskRegistry.connect(agentWithId).approveTask(1)
      ).to.be.revertedWithCustomError(taskRegistry, 'SelfApprovalBlocked');
    });

    it('should support revision and cancellation rules', async function () {
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://rev');
      await taskRegistry.connect(agentWithId).acceptTask(1);
      await taskRegistry.connect(agentWithId).startTask(1);
      await taskRegistry.connect(agentWithId).submitProof(1, proofHash, 'ipfs://out1');

      await taskRegistry.connect(client).requestRevision(1, 'Verify Z-score anomalies');
      expect((await taskRegistry.getTask(1)).state).to.equal(7); // RevisionRequested

      await taskRegistry.connect(agentWithId).submitProof(1, proofHash, 'ipfs://out2');
      expect((await taskRegistry.getTask(1)).state).to.equal(4); // Submitted

      await taskRegistry.connect(client).approveTask(1);
      expect((await taskRegistry.getTask(1)).state).to.equal(6); // Approved

      // Cancel open task works, cannot cancel InProgress
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://cancel');
      await expect(taskRegistry.connect(client).cancelTask(2)).to.emit(taskRegistry, 'TaskCancelled');
    });
  });
});
