# Official Binance Account Login & Agent ID Integration Guide

## 1. Overview
CRAFT implements a dual-identity architecture:
1. **Web2 Identity (Optional / Partner Gated):** Official Binance Login (OAuth 2.0).
2. **Web3 Identity (Core / Verifiable):** Web3 Wallet connection with on-chain Binance Agent ID (`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`) verification.

These two identity layers are **strictly separated** in CRAFT:
- A Binance OAuth login does **NOT** automatically grant access to an on-chain Agent ID.
- An on-chain Agent ID requires authenticating with a Web3 wallet that holds the official BEP-721 token on BNB Smart Chain.
- Users who sign in with Binance can cryptographically link their Web3 wallet using a signed nonce challenge.

---

## 2. Official Binance OAuth Access Restriction

According to official Binance documentation:
> [Binance Login OAuth 2.0 Documentation](https://developers.binance.com/en/docs/products/login/introduction)

Binance currently restricts OAuth 2.0 client registration exclusively to **approved ecosystem partners**. 

### Rules Followed by CRAFT:
- CRAFT **does not fabricate** client credentials.
- CRAFT **does not simulate** a fake Binance login dialog or collect usernames/passwords.
- CRAFT **does not bypass** Binance partner approval.
- The backend architecture is fully implemented, adhering to official specifications:
  - **Authorize URL:** `https://accounts.binance.com/en/oauth/authorize`
  - **Token Exchange:** `https://api.binance.com/v1/oauth/token`
  - **User Info:** `https://api.binance.com/v1/oauth/user/info`
  - **Security:** PKCE (`code_challenge_method=S256`), CSRF State verification, and HTTP-only session tokens.

---

## 3. Account Linking Security

To link a Binance account to a Web3 wallet:
1. CRAFT issues a unique cryptographic challenge:
   ```
   CRAFT Account Linking Verification
   I authorize linking this Web3 wallet to my CRAFT identity.
   User ID: <userId>
   Wallet Address: <address>
   Nonce: <randomNonce>
   Timestamp: <ISO timestamp>
   ```
2. The user signs the message via `personal_sign`.
3. The server validates the signature with `viem.verifyMessage`.
4. Replay attacks are prevented through nonce expiration (5-minute TTL) and single-use invalidation.
5. CRAFT queries `balanceOf(address)` on `0x60b9262456de011f7d15a54cdd8c48baaa8b022f` to verify Agent ID ownership.

---

## 4. Agentic Wallet Safety Rules

Per official hackathon safety guidelines, CRAFT strictly enforces:
- **No pairing-code login:** CRAFT never asks users for Agentic Wallet pairing codes.
- **No QR-code login:** CRAFT does not embed unofficial QR scanner widgets.
- **No private key / seed phrase collection:** Wallet interactions always occur through user-controlled wallet extensions (Binance Web3 Wallet, Trust Wallet, MetaMask).
- **No unauthorized asset movements:** Contract interactions require explicit user signature via `TaskRegistry.sol`.

---

## 5. Activation Checklist for Partners

When official partner credentials are granted by the Binance Developer Center team:
1. Add credentials to `.env`:
   ```env
   BINANCE_OAUTH_ENABLED=true
   BINANCE_OAUTH_CLIENT_ID=your_client_id_here
   BINANCE_OAUTH_CLIENT_SECRET=your_client_secret_here
   BINANCE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/binance/callback
   ```
2. Restart the API server:
   ```bash
   npm --workspace=apps/api run dev
   ```
3. Clicking **"Continue with Binance"** will immediately redirect users to the live Binance authorization consent screen.
