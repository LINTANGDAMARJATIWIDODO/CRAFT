# CRAFT Architecture & Verifiable AI Pipeline

```
+-------------------------------------------------------------+
|                     Next.js 14 Frontend                     |
|  - Operations Dashboard         - Task Marketplace          |
|  - CSV Ingestion & Profiling    - Result Review Workspace   |
|  - Web3 Connect & Agent ID Pill - On-Chain Ledger Explorer  |
+------------------------------+------------------------------+
                               | (HTTP / RPC)
                               v
+-------------------------------------------------------------+
|                      Node.js / Express                      |
|  - Nonce Authentication         - Dataset Ingestion Vault   |
|  - Deterministic Math Engine    - Proof Generator           |
+------------------------------+------------------------------+
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
+-----------------------------+   +-----------------------------+
|    Gemini AI Engine (LLM)   |   |   BNB Chain Smart Contract  |
| - Feeds on pre-calculated   |   | - TaskRegistry.sol          |
|   evidence                  |   | - Enforces Binance Agent ID |
| - Structured analytical     |   |   (0x60b9...022f)           |
|   report (JSON schema)      |   | - Records state transitions |
+-----------------------------+   +-----------------------------+
```

### Deterministic Calculation Guarantee
To eliminate LLM hallucinations:
1. Mathematical metrics (Sum, Mean, Standard Deviation, Median, Min, Max, Categorical frequencies, Anomaly scores) are computed in verified TypeScript code.
2. The outputs are passed to Gemini as strict, non-overridable context.
3. The SHA-256 hash of the calculations is combined with the dataset digest and committed on-chain.
