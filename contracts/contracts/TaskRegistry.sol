// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IAgentID
 * @notice Verified interface for official SPACE ID / Binance Agent ID contract on BNB Chain
 * @dev Verified on-chain via BSC RPC against 0x60b9262456de011f7d15a54cdd8c48baaa8b022f:
 *      ERC-165 supportsInterface(0x80ac58cd) = true (ERC-721),
 *      supportsInterface(0x5b5e139f) = true (ERC-721Metadata),
 *      supportsInterface(0x780e9d63) = false (ERC-721Enumerable is NOT implemented).
 */
interface IAgentID {
    function balanceOf(address owner) external view returns (uint256);
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/**
 * @title TaskRegistry
 * @notice Verified Autonomous Work Protocol & Delegation Registry for CRAFT on BNB Smart Chain
 * @dev Implements complete lifecycle: Created -> Proposed -> Accepted -> InProgress -> Submitted -> Verified -> Approved
 */
contract TaskRegistry is Ownable, ReentrancyGuard {
    enum TaskState {
        Created,           // 0
        Proposed,          // 1 (Agents submitted execution bids)
        Accepted,          // 2
        InProgress,        // 3
        Submitted,         // 4
        Verified,          // 5 (Independent Sentinel / Council validation commitment)
        Approved,          // 6 (Human client approval)
        RevisionRequested, // 7
        Cancelled          // 8
    }

    struct Task {
        uint256 id;
        address client;
        address assignedAgent;
        bytes32 datasetHash;
        bytes32 configHash;
        bytes32 evidenceHash;
        bytes32 proofHash;
        TaskState state;
        uint256 createdAt;
        uint256 acceptedAt;
        uint256 startedAt;
        uint256 submittedAt;
        uint256 verifiedAt;
        uint256 approvedAt;
        uint256 parentTaskId;
        string metadataURI;
        string outputURI;
        address verifiedByValidator;
    }

    struct Bid {
        address agent;
        uint256 estimatedDurationSec;
        uint256 proposedCostWei;
        bytes32 methodologyHash;
        bool exists;
    }

    struct CapabilityRecord {
        bool registered;
        bool hasAgentIdAtRegistration;
        string metadataURI;
        uint256 updatedAt;
    }

    IAgentID public agentIdContract;
    bool public enforceAgentIdCheck;

    uint256 public nextTaskId;
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => mapping(address => Bid)) public taskBids;
    mapping(uint256 => uint256[]) public childSubtasks;
    mapping(address => CapabilityRecord) public agentCapabilities;
    mapping(address => bool) public uniqueInteractingAgentIds;
    uint256 public uniqueAgentIdCount;

    // Custom Errors
    error UnauthorizedClient();
    error UnauthorizedAgent();
    error UnauthorizedValidator();
    error SelfApprovalBlocked();
    error MissingAgentID(address target);
    error InvalidStateTransition(TaskState current, TaskState requested);
    error InvalidTask(uint256 taskId);
    error ZeroAddress();
    error EmptyProofHash();
    error CircularDelegation();
    error BidNotFound();

    // Events
    event AgentCapabilityRegistered(address indexed agent, string metadataURI, bool verifiedAgentId);
    event TaskCreated(
        uint256 indexed taskId,
        address indexed client,
        address indexed assignedAgent,
        bytes32 datasetHash,
        string metadataURI
    );
    event BidProposed(
        uint256 indexed taskId,
        address indexed agent,
        uint256 estimatedDurationSec,
        uint256 proposedCostWei,
        bytes32 methodologyHash
    );
    event BidSelected(uint256 indexed taskId, address indexed client, address indexed selectedAgent);
    event SubtaskDelegated(
        uint256 indexed parentTaskId,
        uint256 indexed subtaskId,
        address indexed delegatorAgent,
        address delegateeAgent
    );
    event TaskAccepted(uint256 indexed taskId, address indexed agent, uint256 timestamp);
    event TaskStarted(uint256 indexed taskId, address indexed agent, uint256 timestamp);
    event ProofSubmitted(uint256 indexed taskId, address indexed agent, bytes32 proofHash, string outputURI);
    event ProofDigestsCommitted(
        uint256 indexed taskId,
        bytes32 datasetHash,
        bytes32 configHash,
        bytes32 evidenceHash,
        bytes32 proofHash
    );
    event TaskVerified(uint256 indexed taskId, address indexed validator, bytes32 evidenceHash, uint256 timestamp);
    event RevisionRequested(uint256 indexed taskId, address indexed client, string reason);
    event TaskApproved(uint256 indexed taskId, address indexed client, uint256 timestamp);
    event TaskCancelled(uint256 indexed taskId, address indexed client);
    event AgentIdContractUpdated(address indexed oldContract, address indexed newContract);
    event AgentIdCheckToggled(bool isEnabled);

    constructor(address _agentIdContract, bool _enforceCheck) Ownable(msg.sender) {
        agentIdContract = IAgentID(_agentIdContract);
        enforceAgentIdCheck = _enforceCheck;
        nextTaskId = 1;
    }

    function _requireAgentId(address target) internal {
        if (enforceAgentIdCheck && address(agentIdContract) != address(0)) {
            if (agentIdContract.balanceOf(target) == 0) {
                revert MissingAgentID(target);
            }
            if (!uniqueInteractingAgentIds[target]) {
                uniqueInteractingAgentIds[target] = true;
                uniqueAgentIdCount++;
            }
        }
    }

    /**
     * @notice Register agent capabilities on-chain with Agent ID enforcement
     */
    function registerAgentCapabilities(string calldata metadataURI) external {
        _requireAgentId(msg.sender);
        bool hasId = address(agentIdContract) != address(0) && agentIdContract.balanceOf(msg.sender) > 0;
        agentCapabilities[msg.sender] = CapabilityRecord({
            registered: true,
            hasAgentIdAtRegistration: hasId,
            metadataURI: metadataURI,
            updatedAt: block.timestamp
        });
        emit AgentCapabilityRegistered(msg.sender, metadataURI, hasId);
    }

    /**
     * @notice Create a direct or open task (assignedAgent can be address(0) for open bidding)
     */
    function createTask(
        address assignedAgent,
        bytes32 datasetHash,
        string calldata metadataURI
    ) external returns (uint256 taskId) {
        taskId = nextTaskId++;
        Task storage newTask = tasks[taskId];
        newTask.id = taskId;
        newTask.client = msg.sender;
        newTask.assignedAgent = assignedAgent;
        newTask.datasetHash = datasetHash;
        newTask.state = TaskState.Created;
        newTask.createdAt = block.timestamp;
        newTask.metadataURI = metadataURI;

        emit TaskCreated(taskId, msg.sender, assignedAgent, datasetHash, metadataURI);
    }

    /**
     * @notice Qualified Agent ID holder proposes a bid on an open task
     */
    function proposeBid(
        uint256 taskId,
        uint256 estimatedDurationSec,
        uint256 proposedCostWei,
        bytes32 methodologyHash
    ) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (task.state != TaskState.Created && task.state != TaskState.Proposed) {
            revert InvalidStateTransition(task.state, TaskState.Proposed);
        }
        _requireAgentId(msg.sender);

        taskBids[taskId][msg.sender] = Bid({
            agent: msg.sender,
            estimatedDurationSec: estimatedDurationSec,
            proposedCostWei: proposedCostWei,
            methodologyHash: methodologyHash,
            exists: true
        });
        task.state = TaskState.Proposed;

        emit BidProposed(taskId, msg.sender, estimatedDurationSec, proposedCostWei, methodologyHash);
    }

    /**
     * @notice Client selects winning bid, assigning the agent and accepting the agreement
     */
    function selectBid(uint256 taskId, address selectedAgent) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.client) revert UnauthorizedClient();
        if (task.state != TaskState.Proposed) revert InvalidStateTransition(task.state, TaskState.Accepted);
        if (!taskBids[taskId][selectedAgent].exists) revert BidNotFound();

        task.assignedAgent = selectedAgent;
        task.state = TaskState.Accepted;
        task.acceptedAt = block.timestamp;

        emit BidSelected(taskId, msg.sender, selectedAgent);
        emit TaskAccepted(taskId, selectedAgent, block.timestamp);
    }

    /**
     * @notice Hierarchical Agent-to-Agent delegation creating a verifiable child subtask
     */
    function delegateSubtask(
        uint256 parentTaskId,
        address delegateeAgent,
        bytes32 subtaskDigest,
        string calldata metadataURI
    ) external nonReentrant returns (uint256 subtaskId) {
        Task storage parent = tasks[parentTaskId];
        if (parent.id == 0) revert InvalidTask(parentTaskId);
        if (msg.sender != parent.assignedAgent && msg.sender != parent.client) revert UnauthorizedAgent();
        if (delegateeAgent == address(0)) revert ZeroAddress();
        if (delegateeAgent == msg.sender) revert CircularDelegation();

        _requireAgentId(delegateeAgent);

        subtaskId = nextTaskId++;
        Task storage sub = tasks[subtaskId];
        sub.id = subtaskId;
        sub.client = msg.sender;
        sub.assignedAgent = delegateeAgent;
        sub.datasetHash = subtaskDigest;
        sub.state = TaskState.Accepted;
        sub.createdAt = block.timestamp;
        sub.acceptedAt = block.timestamp;
        sub.parentTaskId = parentTaskId;
        sub.metadataURI = metadataURI;

        childSubtasks[parentTaskId].push(subtaskId);

        emit TaskCreated(subtaskId, msg.sender, delegateeAgent, subtaskDigest, metadataURI);
        emit SubtaskDelegated(parentTaskId, subtaskId, msg.sender, delegateeAgent);
    }

    /**
     * @notice Assigned AI Agent accepts a task directly (validates Binance Agent ID on-chain)
     */
    function acceptTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.assignedAgent) revert UnauthorizedAgent();
        if (task.state != TaskState.Created && task.state != TaskState.Proposed) {
            revert InvalidStateTransition(task.state, TaskState.Accepted);
        }

        _requireAgentId(msg.sender);

        task.state = TaskState.Accepted;
        task.acceptedAt = block.timestamp;

        emit TaskAccepted(taskId, msg.sender, block.timestamp);
    }

    /**
     * @notice Transition Accepted task to InProgress
     */
    function startTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.assignedAgent) revert UnauthorizedAgent();
        if (task.state != TaskState.Accepted) revert InvalidStateTransition(task.state, TaskState.InProgress);

        task.state = TaskState.InProgress;
        task.startedAt = block.timestamp;

        emit TaskStarted(taskId, msg.sender, block.timestamp);
    }

    /**
     * @notice Legacy / simple proof submission preserving backward compatibility
     */
    function submitProof(
        uint256 taskId,
        bytes32 proofHash,
        string calldata outputURI
    ) external nonReentrant {
        _submitProofInternal(taskId, bytes32(0), proofHash, proofHash, outputURI);
    }

    /**
     * @notice Full 4-digest verifiable submission (dataset, config, deterministic evidence, composite report proof)
     */
    function submitFourDigestsProof(
        uint256 taskId,
        bytes32 configHash,
        bytes32 evidenceHash,
        bytes32 proofHash,
        string calldata outputURI
    ) external nonReentrant {
        _submitProofInternal(taskId, configHash, evidenceHash, proofHash, outputURI);
    }

    function _submitProofInternal(
        uint256 taskId,
        bytes32 configHash,
        bytes32 evidenceHash,
        bytes32 proofHash,
        string calldata outputURI
    ) internal {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.assignedAgent) revert UnauthorizedAgent();
        if (proofHash == bytes32(0)) revert EmptyProofHash();

        if (task.state != TaskState.InProgress && task.state != TaskState.RevisionRequested) {
            revert InvalidStateTransition(task.state, TaskState.Submitted);
        }

        task.state = TaskState.Submitted;
        task.configHash = configHash;
        task.evidenceHash = evidenceHash;
        task.proofHash = proofHash;
        task.outputURI = outputURI;
        task.submittedAt = block.timestamp;

        emit ProofSubmitted(taskId, msg.sender, proofHash, outputURI);
        emit ProofDigestsCommitted(taskId, task.datasetHash, configHash, evidenceHash, proofHash);
    }

    /**
     * @notice Independent validator agent (e.g. Sentinel) verifies submitted work before client approval
     */
    function verifyTask(uint256 taskId, bytes32 verificationEvidenceHash) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (task.state != TaskState.Submitted) revert InvalidStateTransition(task.state, TaskState.Verified);
        if (msg.sender == task.assignedAgent) revert UnauthorizedValidator(); // Validator must be distinct from executor

        _requireAgentId(msg.sender);

        task.state = TaskState.Verified;
        task.verifiedAt = block.timestamp;
        task.verifiedByValidator = msg.sender;

        emit TaskVerified(taskId, msg.sender, verificationEvidenceHash, block.timestamp);
    }

    /**
     * @notice Client approves Submitted or Verified deliverable (blocks self-approval!)
     */
    function approveTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.client) revert UnauthorizedClient();
        if (msg.sender == task.assignedAgent) revert SelfApprovalBlocked();

        if (task.state != TaskState.Submitted && task.state != TaskState.Verified) {
            revert InvalidStateTransition(task.state, TaskState.Approved);
        }

        task.state = TaskState.Approved;
        task.approvedAt = block.timestamp;

        emit TaskApproved(taskId, msg.sender, block.timestamp);
    }

    function requestRevision(uint256 taskId, string calldata reason) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.client) revert UnauthorizedClient();

        if (task.state != TaskState.Submitted && task.state != TaskState.Verified) {
            revert InvalidStateTransition(task.state, TaskState.RevisionRequested);
        }

        task.state = TaskState.RevisionRequested;
        emit RevisionRequested(taskId, msg.sender, reason);
    }

    function cancelTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.client) revert UnauthorizedClient();

        if (
            task.state != TaskState.Created &&
            task.state != TaskState.Proposed &&
            task.state != TaskState.Accepted
        ) {
            revert InvalidStateTransition(task.state, TaskState.Cancelled);
        }

        task.state = TaskState.Cancelled;
        emit TaskCancelled(taskId, msg.sender);
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        if (tasks[taskId].id == 0) revert InvalidTask(taskId);
        return tasks[taskId];
    }

    function getChildSubtasks(uint256 parentTaskId) external view returns (uint256[] memory) {
        return childSubtasks[parentTaskId];
    }

    function setAgentIdContract(address _newContract) external onlyOwner {
        address oldContract = address(agentIdContract);
        agentIdContract = IAgentID(_newContract);
        emit AgentIdContractUpdated(oldContract, _newContract);
    }

    function setEnforceAgentIdCheck(bool _enforce) external onlyOwner {
        enforceAgentIdCheck = _enforce;
        emit AgentIdCheckToggled(_enforce);
    }
}
