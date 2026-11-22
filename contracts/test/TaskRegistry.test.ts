import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TaskRegistry, MockAgentID } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('TaskRegistry Contract Suite', function () {
  let taskRegistry: TaskRegistry;
  let mockAgentId: MockAgentID;
  let owner: SignerWithAddress;
  let client: SignerWithAddress;
  let agentWithId: SignerWithAddress;
  let agentWithoutId: SignerWithAddress;
  let attacker: SignerWithAddress;

  const datasetHash = ethers.keccak256(ethers.toUtf8Bytes('dataset-sales-q1.csv'));
  const proofHash = ethers.keccak256(ethers.toUtf8Bytes('output-proof-analysis-report'));

  beforeEach(async function () {
    [owner, client, agentWithId, agentWithoutId, attacker] = await ethers.getSigners();

    // Deploy Mock Binance Agent ID
    const MockAgentFactory = await ethers.getContractFactory('MockAgentID');
    mockAgentId = await MockAgentFactory.deploy();
    await mockAgentId.waitForDeployment();

    // Mint an Agent ID token to agentWithId
    await mockAgentId.mint(agentWithId.address);

    // Deploy TaskRegistry with Agent ID enforcement enabled
    const TaskRegistryFactory = await ethers.getContractFactory('TaskRegistry');
    taskRegistry = await TaskRegistryFactory.deploy(await mockAgentId.getAddress(), true);
    await taskRegistry.waitForDeployment();
  });

  describe('Initialization & Configuration', function () {
    it('should set the correct initial state and agent id contract', async function () {
      expect(await taskRegistry.agentIdContract()).to.equal(await mockAgentId.getAddress());
      expect(await taskRegistry.enforceAgentIdCheck()).to.be.true;
      expect(await taskRegistry.nextTaskId()).to.equal(1);
    });

    it('should allow owner to update agent ID contract and toggle enforcement', async function () {
      await taskRegistry.setEnforceAgentIdCheck(false);
      expect(await taskRegistry.enforceAgentIdCheck()).to.be.false;

      const randomAddr = ethers.Wallet.createRandom().address;
      await taskRegistry.setAgentIdContract(randomAddr);
      expect(await taskRegistry.agentIdContract()).to.equal(randomAddr);
    });
  });

  describe('Task Lifecycle & Authorization', function () {
    it('should allow client to create a task', async function () {
      const tx = await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://meta-001');
      await expect(tx)
        .to.emit(taskRegistry, 'TaskCreated')
        .withArgs(1, client.address, agentWithId.address, datasetHash, 'ipfs://meta-001');

      const task = await taskRegistry.getTask(1);
      expect(task.client).to.equal(client.address);
      expect(task.assignedAgent).to.equal(agentWithId.address);
      expect(task.state).to.equal(0); // TaskState.Created
    });

    it('should reject agent acceptance if agent does not hold an Agent ID', async function () {
      await taskRegistry.connect(client).createTask(agentWithoutId.address, datasetHash, 'ipfs://meta-002');

      await expect(
        taskRegistry.connect(agentWithoutId).acceptTask(1)
      ).to.be.revertedWithCustomError(taskRegistry, 'MissingAgentID');
    });

    it('should reject task acceptance if caller is not the assigned agent', async function () {
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://meta-003');

      await expect(
        taskRegistry.connect(attacker).acceptTask(1)
      ).to.be.revertedWithCustomError(taskRegistry, 'UnauthorizedAgent');
    });

    it('should allow assigned agent with Agent ID to accept and start task', async function () {
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://meta-004');

      // Accept
      await expect(taskRegistry.connect(agentWithId).acceptTask(1))
        .to.emit(taskRegistry, 'TaskAccepted');

      let task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(1); // TaskState.Accepted

      // Start
      await expect(taskRegistry.connect(agentWithId).startTask(1))
        .to.emit(taskRegistry, 'TaskStarted');

      task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(2); // TaskState.InProgress
    });

    it('should reject proof submission before task is InProgress or from non-agent', async function () {
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://meta-005');

      // Attempt submit without accept or start
      await expect(
        taskRegistry.connect(agentWithId).submitProof(1, proofHash, 'ipfs://out-005')
      ).to.be.revertedWithCustomError(taskRegistry, 'InvalidStateTransition');

      // Accept & start
      await taskRegistry.connect(agentWithId).acceptTask(1);
      await taskRegistry.connect(agentWithId).startTask(1);

      // Attempt submit from attacker
      await expect(
        taskRegistry.connect(attacker).submitProof(1, proofHash, 'ipfs://out-005')
      ).to.be.revertedWithCustomError(taskRegistry, 'UnauthorizedAgent');
    });

    it('should allow assigned agent to submit proof hash and deliverables', async function () {
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://meta-006');
      await taskRegistry.connect(agentWithId).acceptTask(1);
      await taskRegistry.connect(agentWithId).startTask(1);

      await expect(taskRegistry.connect(agentWithId).submitProof(1, proofHash, 'ipfs://out-006'))
        .to.emit(taskRegistry, 'ProofSubmitted')
        .withArgs(1, agentWithId.address, proofHash, 'ipfs://out-006');

      const task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(3); // TaskState.Submitted
      expect(task.proofHash).to.equal(proofHash);
    });

    it('should reject approval from non-client', async function () {
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://meta-007');
      await taskRegistry.connect(agentWithId).acceptTask(1);
      await taskRegistry.connect(agentWithId).startTask(1);
      await taskRegistry.connect(agentWithId).submitProof(1, proofHash, 'ipfs://out-007');

      await expect(
        taskRegistry.connect(attacker).approveTask(1)
      ).to.be.revertedWithCustomError(taskRegistry, 'UnauthorizedClient');
    });

    it('should allow client to approve task completion', async function () {
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://meta-008');
      await taskRegistry.connect(agentWithId).acceptTask(1);
      await taskRegistry.connect(agentWithId).startTask(1);
      await taskRegistry.connect(agentWithId).submitProof(1, proofHash, 'ipfs://out-008');

      await expect(taskRegistry.connect(client).approveTask(1))
        .to.emit(taskRegistry, 'TaskApproved');

      const task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(5); // TaskState.Approved
    });

    it('should allow complete revision workflow (Submit -> RevisionRequested -> Re-submit -> Approve)', async function () {
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://meta-009');
      await taskRegistry.connect(agentWithId).acceptTask(1);
      await taskRegistry.connect(agentWithId).startTask(1);
      await taskRegistry.connect(agentWithId).submitProof(1, proofHash, 'ipfs://out-009');

      // Request Revision
      await expect(taskRegistry.connect(client).requestRevision(1, 'Need deeper breakdown on SMB tier'))
        .to.emit(taskRegistry, 'RevisionRequested')
        .withArgs(1, client.address, 'Need deeper breakdown on SMB tier');

      let task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(4); // TaskState.RevisionRequested

      // Re-submit revised proof
      const revisedProof = ethers.keccak256(ethers.toUtf8Bytes('revised-proof-hash'));
      await taskRegistry.connect(agentWithId).submitProof(1, revisedProof, 'ipfs://out-009-revised');

      task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(3); // TaskState.Submitted
      expect(task.proofHash).to.equal(revisedProof);

      // Approve final
      await taskRegistry.connect(client).approveTask(1);
      task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(5); // TaskState.Approved
    });

    it('should allow cancellation before progress and disallow cancellation once in progress', async function () {
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://meta-010');

      // Cancel while Created
      await expect(taskRegistry.connect(client).cancelTask(1))
        .to.emit(taskRegistry, 'TaskCancelled');

      let task = await taskRegistry.getTask(1);
      expect(task.state).to.equal(6); // TaskState.Cancelled

      // Second task
      await taskRegistry.connect(client).createTask(agentWithId.address, datasetHash, 'ipfs://meta-011');
      await taskRegistry.connect(agentWithId).acceptTask(2);
      await taskRegistry.connect(agentWithId).startTask(2);

      // Cannot cancel InProgress
      await expect(
        taskRegistry.connect(client).cancelTask(2)
      ).to.be.revertedWithCustomError(taskRegistry, 'InvalidStateTransition');
    });
  });
});
