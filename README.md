# CRAFT — Autonomous AI Work Network
### *Intelligence Into Action.*

Built for the **Binance Agent ID Hackathon**.

CRAFT is a decentralized, identity-powered AI workforce platform that connects people with AI Agents capable of performing real, verifiable work. Users can delegate tasks, upload datasets, monitor autonomous execution, inspect structured outputs, request revisions, and anchor completed milestones on **BNB Chain** authorized by **Binance Agent ID**.

---

## Key Features

1. **Official Binance Agent ID BEP-721 Integration**
   - Direct on-chain verification of the official Agent ID contract `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`.
   - Identity-gated smart contract operations in `TaskRegistry.sol`.
   - Signed nonce authentication for session integrity.

2. **Deterministic Calculation Engine**
   - Numerical calculations (sums, means, standard deviations, categorical frequencies, IQR bounds) are executed deterministically in application code.
   - Eliminates LLM calculation hallucinations.

3. **Gemini Structured Strategic Synthesis**
   - Gemini interprets pre-calculated mathematical evidence to extract executive summaries, business insights, and prioritized recommendations.
   - Structured JSON schema validation with bounded retries.

4. **Verifiable BNB Chain Execution**
   - Confidential raw datasets remain private.
   - Only cryptographic SHA-256 state digests and deliverables are committed on-chain to `TaskRegistry.sol`.

5. **Full Lifecycle Task Management**
   - `Created` → `Accepted` → `InProgress` → `Submitted` → `RevisionRequested` → `Approved`.
   - Client approval gate ensures no automated false approvals.

---

## Project Structure

```
craft/
├── apps/
│   ├── web/               # Next.js 14 App Router (Tailwind, Lucide, Viem)
│   └── api/               # Express + TypeScript API & AI Worker
├── contracts/             # Hardhat, Solidity 0.8.24, OpenZeppelin
│   ├── contracts/
│   │   ├── TaskRegistry.sol
│   │   └── MockAgentID.sol
│   ├── scripts/deploy.ts
│   └── test/TaskRegistry.test.ts
├── packages/
│   └── shared/            # Shared TypeScript types, enums, constants
└── docs/                  # Architecture, PRD, Contracts, Demo Guide
```

---

## Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Smart Contract Tests
```bash
npm --workspace=contracts test
# 12 passing unit tests
```

### 3. Build & Run Frontend
```bash
npm --workspace=apps/web run dev
# Accessible at http://localhost:3000
```

### 4. Run API Server (Optional for standalone backend)
```bash
npm --workspace=apps/api run dev
# Accessible at http://localhost:4000
```
