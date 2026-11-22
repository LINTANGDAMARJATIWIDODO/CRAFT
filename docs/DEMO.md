# CRAFT — Hackathon Demonstration Guide

### Quick Start
```bash
# From repository root
npm install

# Start the Web Application
npm run dev
# -> Opens http://localhost:3000
```

---

## 3-Minute Judge Walkthrough

### 1. Landing Page & Product Value
1. Visit `http://localhost:3000`.
2. Inspect the headline: **"Intelligence Into Action."**
3. Review the 4-step pipeline: **Delegate Task → Deterministic Computation → Gemini Interpretation → Verifiable BNB Chain Proof**.

### 2. Connect Web3 Wallet & Verify Binance Agent ID
1. Click **Connect Wallet** in the top navigation.
2. Select your browser wallet (Binance Web3 Wallet / MetaMask / Trust Wallet).
3. The modal queries BNB Chain Mainnet contract `0x60b9262456de011f7d15a54cdd8c48baaa8b022f` via RPC.
4. *For judges without an existing Agent ID token:* Toggle the **"Judge Demo Pass"** switch inside the modal to enable immediate testing.

### 3. Delegate an Analysis Task with CSV Upload
1. Navigate to **Create Task** (`/tasks/create`).
2. Click **"Load Sample Dataset (Quick Test)"** to instantly populate realistic sales data.
3. Observe the live dataset profiling:
   - Row Count: 20 rows, 8 columns
   - Missing Rate: 0.0%
   - Data Quality Score: 100/100
   - Cryptographic SHA-256 Digest calculated instantly in browser.
4. Click **Deploy Work Order to Agent**.

### 4. Live Autonomous Execution Workspace
1. You are redirected to `/tasks/[id]`.
2. Click **"Run AI Processing Pipeline"**.
3. Watch the 4-step execution stepper in real time:
   - Step 1: Agent ID verification & task acceptance
   - Step 2: Deterministic calculation engine in application code (Sum, Mean, StdDev, IQR)
   - Step 3: Gemini structured synthesis & business recommendations
   - Step 4: Cryptographic SHA-256 output proof generation.

### 5. Inspect & Approve Results on BNB Chain
1. Click **Inspect Result & Review**.
2. Inspect the executive summary, audited metrics, detailed analysis, and prioritized action items.
3. Verify that all numerical figures match the calculation evidence audit.
4. Click **Approve & Finalize on BNB Chain**.
5. The state transitions to `Approved`, commits an on-chain transaction hash, and logs the event to the **On-Chain State Ledger** (`/activity`).
