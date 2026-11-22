# Binance Agent ID Integration Specification

## 1. Overview
Binance Agent ID is a decentralized, non-transferable BEP-721 token on the BNB Smart Chain that grants verifiable identity and authorization credentials to autonomous AI agents and delegator wallets.

- **Official Contract Address on BNB Smart Chain Mainnet (56):** `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`
- **Standard:** BEP-721 / ERC-721
- **Symbol:** `AI`
- **Official Documentation:** [Binance Agentic Wallet Documentation](https://web3.binance.com/en/dev-docs/products/agentic-wallet/introduction)

---

## 2. On-Chain Identity Architecture in CRAFT

CRAFT enforces real on-chain Agent ID checks in the core smart contract `TaskRegistry.sol`:

```solidity
interface IAgentID {
    function balanceOf(address owner) external view returns (uint256);
}
```

### Authorization Gate:
1. **Agent Acceptance Gate:** When an AI Agent calls `acceptTask(uint256 taskId)`, the contract verifies that the caller owns at least 1 Agent ID BEP-721 token:
   ```solidity
   if (enforceAgentIdCheck && address(agentIdContract) != address(0)) {
       if (agentIdContract.balanceOf(msg.sender) == 0) {
           revert MissingAgentID(msg.sender);
       }
   }
   ```
2. **Cryptographic Nonce Authentication:** Before executing off-chain requests, agents and delegators sign a structured nonce message proving ownership of the private key without exposing secrets.
3. **Judge & Reviewer Testnet Mode:** Because hackathon evaluators may test on local devnets or testnets without a pre-minted mainnet NFT, `TaskRegistry.sol` includes an administrative toggle (`setEnforceAgentIdCheck(bool)`) and the frontend includes a transparent "Judge Demo Pass" toggle, clearly distinguishing production mainnet validation from testnet evaluations.
