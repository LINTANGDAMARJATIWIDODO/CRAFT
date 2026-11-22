# CRAFT Smart Contract Specification

## Core Contract: `TaskRegistry.sol`
Deployed on **BNB Smart Chain (BSC)**.

### 1. Task Lifecycle State Machine
```
Created (0)
   ↓ (acceptTask - Requires Binance Agent ID)
Accepted (1)
   ↓ (startTask)
InProgress (2)
   ↓ (submitProof - Submits SHA-256 proof hash & URI)
Submitted (3) 
   ↙           ↘ (requestRevision)
Approved (5)    RevisionRequested (4)
                      ↓ (submitProof)
                 Submitted (3)
```

### 2. Events Emitted
- `TaskCreated(uint256 indexed taskId, address indexed client, address indexed assignedAgent, bytes32 datasetHash, string metadataURI)`
- `TaskAccepted(uint256 indexed taskId, address indexed agent, uint256 timestamp)`
- `TaskStarted(uint256 indexed taskId, address indexed agent, uint256 timestamp)`
- `ProofSubmitted(uint256 indexed taskId, address indexed agent, bytes32 proofHash, string outputURI)`
- `RevisionRequested(uint256 indexed taskId, address indexed client, string reason)`
- `TaskApproved(uint256 indexed taskId, address indexed client, uint256 timestamp)`
- `TaskCancelled(uint256 indexed taskId, address indexed client)`

### 3. Verification & Deployment Commands
```bash
# Compile contracts
npm --workspace=contracts run compile

# Run automated unit test suite (12 tests)
npm --workspace=contracts test

# Deploy to BNB Chain Testnet (Chain ID: 97)
npm --workspace=contracts run deploy:bscTestnet

# Verify source on BscScan
npx hardhat verify --network bsc <CONTRACT_ADDRESS> "0x60b9262456de011f7d15a54cdd8c48baaa8b022f" true
```
