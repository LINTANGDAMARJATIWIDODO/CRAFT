// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IAgentID
 * @notice Standard interface for Binance Agent ID BEP-721 token
 */
interface IAgentID {
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @title TaskRegistry
 * @notice Verifiable Task Lifecycle and Proof Anchor Contract for CRAFT Autonomous AI Work Network
 * @dev Deployed on BNB Smart Chain, enforces Binance Agent ID identity verification
 */
contract TaskRegistry is Ownable, ReentrancyGuard {
    enum TaskState {
        Created,            // 0
        Accepted,           // 1
        InProgress,         // 2
        Submitted,          // 3
        RevisionRequested,  // 4
        Approved,           // 5
        Cancelled           // 6
    }

    struct Task {
        uint256 id;
        address client;
        address assignedAgent;
        bytes32 datasetHash;
        bytes32 proofHash;
        TaskState state;
        uint256 createdAt;
        uint256 acceptedAt;
        uint256 startedAt;
        uint256 submittedAt;
        uint256 approvedAt;
        string metadataURI;
        string outputURI;
    }

    // Official Binance Agent ID Contract
    IAgentID public agentIdContract;
    bool public enforceAgentIdCheck;

    uint256 public nextTaskId;
    mapping(uint256 => Task) public tasks;

    // Custom Errors
    error UnauthorizedClient();
    error UnauthorizedAgent();
    error MissingAgentID(address target);
    error InvalidStateTransition(TaskState current, TaskState requested);
    error InvalidTask(uint256 taskId);
    error ZeroAddress();
    error TaskAlreadyApproved();
    error EmptyProofHash();

    // Events
    event TaskCreated(
        uint256 indexed taskId,
        address indexed client,
        address indexed assignedAgent,
        bytes32 datasetHash,
        string metadataURI
    );
    event TaskAccepted(uint256 indexed taskId, address indexed agent, uint256 timestamp);
    event TaskStarted(uint256 indexed taskId, address indexed agent, uint256 timestamp);
    event ProofSubmitted(uint256 indexed taskId, address indexed agent, bytes32 proofHash, string outputURI);
    event RevisionRequested(uint256 indexed taskId, address indexed client, string reason);
    event TaskApproved(uint256 indexed taskId, address indexed client, uint256 timestamp);
    event TaskCancelled(uint256 indexed taskId, address indexed client);
    event AgentIdContractUpdated(address indexed oldContract, address indexed newContract);
    event AgentIdCheckToggled(bool isEnabled);

    /**
     * @param _agentIdContract Address of the official Binance Agent ID BEP-721 token
     * @param _enforceCheck Flag to mandate on-chain Agent ID checks
     */
    constructor(address _agentIdContract, bool _enforceCheck) Ownable(msg.sender) {
        agentIdContract = IAgentID(_agentIdContract);
        enforceAgentIdCheck = _enforceCheck;
        nextTaskId = 1;
    }

    /**
     * @notice Creates a new data analysis task
     * @param assignedAgent The authorized AI Agent address
     * @param datasetHash The SHA-256 cryptographic digest of the ingested dataset
     * @param metadataURI Off-chain metadata reference (JSON metadata pointer)
     */
    function createTask(
        address assignedAgent,
        bytes32 datasetHash,
        string calldata metadataURI
    ) external returns (uint256 taskId) {
        if (assignedAgent == address(0)) revert ZeroAddress();

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
     * @notice AI Agent accepts the assigned task. Validates Binance Agent ID on-chain.
     */
    function acceptTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.assignedAgent) revert UnauthorizedAgent();
        if (task.state != TaskState.Created) revert InvalidStateTransition(task.state, TaskState.Accepted);

        if (enforceAgentIdCheck && address(agentIdContract) != address(0)) {
            if (agentIdContract.balanceOf(msg.sender) == 0) {
                revert MissingAgentID(msg.sender);
            }
        }

        task.state = TaskState.Accepted;
        task.acceptedAt = block.timestamp;

        emit TaskAccepted(taskId, msg.sender, block.timestamp);
    }

    /**
     * @notice AI Agent transitions the task to InProgress upon starting computation
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
     * @notice AI Agent submits verified calculation deliverables and SHA-256 proof hash
     */
    function submitProof(
        uint256 taskId,
        bytes32 proofHash,
        string calldata outputURI
    ) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.assignedAgent) revert UnauthorizedAgent();
        if (proofHash == bytes32(0)) revert EmptyProofHash();

        if (task.state != TaskState.InProgress && task.state != TaskState.RevisionRequested) {
            revert InvalidStateTransition(task.state, TaskState.Submitted);
        }

        task.state = TaskState.Submitted;
        task.proofHash = proofHash;
        task.outputURI = outputURI;
        task.submittedAt = block.timestamp;

        emit ProofSubmitted(taskId, msg.sender, proofHash, outputURI);
    }

    /**
     * @notice Client reviews deliverables and approves task completion
     */
    function approveTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.client) revert UnauthorizedClient();
        if (task.state != TaskState.Submitted) revert InvalidStateTransition(task.state, TaskState.Approved);

        task.state = TaskState.Approved;
        task.approvedAt = block.timestamp;

        emit TaskApproved(taskId, msg.sender, block.timestamp);
    }

    /**
     * @notice Client requests revision with specific reasoning
     */
    function requestRevision(uint256 taskId, string calldata reason) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.client) revert UnauthorizedClient();
        if (task.state != TaskState.Submitted) revert InvalidStateTransition(task.state, TaskState.RevisionRequested);

        task.state = TaskState.RevisionRequested;

        emit RevisionRequested(taskId, msg.sender, reason);
    }

    /**
     * @notice Client cancels task before work begins
     */
    function cancelTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.id == 0) revert InvalidTask(taskId);
        if (msg.sender != task.client) revert UnauthorizedClient();

        if (task.state != TaskState.Created && task.state != TaskState.Accepted) {
            revert InvalidStateTransition(task.state, TaskState.Cancelled);
        }

        task.state = TaskState.Cancelled;

        emit TaskCancelled(taskId, msg.sender);
    }

    /**
     * @notice Get full task details
     */
    function getTask(uint256 taskId) external view returns (Task memory) {
        if (tasks[taskId].id == 0) revert InvalidTask(taskId);
        return tasks[taskId];
    }

    // Owner administration functions
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
