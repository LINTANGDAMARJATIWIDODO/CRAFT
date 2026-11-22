import assert from 'assert';
import { binanceOAuthService } from '../src/modules/auth/binance-oauth';
import { accountLinkingService } from '../src/modules/auth/account-linking';
import { privateKeyToAccount } from 'viem/accounts';

async function runAuthTests() {
  console.log('\n========================================');
  console.log('Running CRAFT Authentication Test Suite');
  console.log('========================================\n');

  // Test 1: Binance OAuth Status & Partner Access
  console.log('Test 1: Binance OAuth Status & Access Restriction...');
  const status = binanceOAuthService.getStatus();
  assert.strictEqual(status.partnerAccessRequired, true, 'Partner access should be required');
  assert.strictEqual(status.configured, false, 'Should be unconfigured when credentials unset');
  console.log('  ✓ Correctly enforces partner access requirement and unconfigured state');

  // Test 2: Unconfigured OAuth Authorize Rejection (No fake login)
  console.log('\nTest 2: Rejecting OAuth initiation without partner credentials...');
  assert.throws(
    () => {
      binanceOAuthService.generateAuthorizationUrl();
    },
    /Binance OAuth is not active/,
    'Should throw descriptive error instead of faking login'
  );
  console.log('  ✓ Rejected unauthorized initiation without credentials');

  // Test 3: CSRF State & PKCE Generation when configured
  console.log('\nTest 3: Testing OAuth URL, CSRF State, and PKCE Generation (Simulated Partner Mode)...');
  (binanceOAuthService as any).clientId = 'test_partner_client_id_12345';
  (binanceOAuthService as any).clientSecret = 'test_partner_secret_67890';
  (binanceOAuthService as any).isEnabled = true;

  const authData = binanceOAuthService.generateAuthorizationUrl('user:openId');
  assert(authData.url.startsWith('https://accounts.binance.com/en/oauth/authorize'), 'URL must match official endpoint');
  assert(authData.url.includes('client_id=test_partner_client_id_12345'), 'Must contain client_id');
  assert(authData.url.includes('code_challenge_method=S256'), 'Must enforce S256 PKCE');
  assert(authData.state.length >= 24, 'State token must have sufficient entropy');
  console.log('  ✓ Official authorization URL correctly generated with S256 PKCE and CSRF token');

  // Test 4: CSRF State validation & replay protection
  console.log('\nTest 4: State validation and single-use replay protection...');
  const validRecord = binanceOAuthService.validateAndConsumeState(authData.state);
  assert(validRecord !== null, 'State must be valid on first consumption');
  const replayRecord = binanceOAuthService.validateAndConsumeState(authData.state);
  assert.strictEqual(replayRecord, null, 'Replayed state token must be rejected');
  console.log('  ✓ CSRF State token successfully consumed and replay attempts rejected');

  // Reset service back to production unconfigured state
  (binanceOAuthService as any).clientId = undefined;
  (binanceOAuthService as any).clientSecret = undefined;
  (binanceOAuthService as any).isEnabled = false;

  // Test 5: Account Linking Challenge Generation
  console.log('\nTest 5: Account Linking Nonce Challenge Generation...');
  const testAccount = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  const challenge = accountLinkingService.createChallenge('usr_test_12345', testAccount.address);
  assert(challenge.nonce >= 100000, 'Nonce must be at least 6 digits');
  assert(challenge.message.includes('CRAFT Account Linking Verification'), 'Message must contain protocol name');
  assert(challenge.message.includes(testAccount.address), 'Message must contain target address');
  console.log('  ✓ Nonce challenge generated with bound user ID and wallet address');

  // Test 6: Account Linking Valid Cryptographic Signature
  console.log('\nTest 6: Verifying valid cryptographic signature...');
  const signature = await testAccount.signMessage({ message: challenge.message });
  const linkResult = await accountLinkingService.verifyAndLink(
    'usr_test_12345',
    testAccount.address,
    signature
  );
  assert.strictEqual(linkResult.success, true, 'Valid signature must succeed');
  assert.strictEqual(linkResult.address.toLowerCase(), testAccount.address.toLowerCase(), 'Address must match');
  console.log('  ✓ Valid Web3 signature verified and wallet successfully linked');

  // Test 7: Replay Attack Rejection on Account Linking
  console.log('\nTest 7: Rejecting replay attacks on consumed link challenge...');
  await assert.rejects(
    async () => {
      await accountLinkingService.verifyAndLink('usr_test_12345', testAccount.address, signature);
    },
    /No active link challenge found/,
    'Replay attempt with consumed challenge must fail'
  );
  console.log('  ✓ Replay attack blocked: Challenge consumed upon first use');

  // Test 8: Forged Signature Rejection
  console.log('\nTest 8: Rejecting forged signature from different wallet...');
  const attackerAccount = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
  const newChallenge = accountLinkingService.createChallenge('usr_test_67890', testAccount.address);
  // Attacker signs instead of legitimate owner
  const forgedSignature = await attackerAccount.signMessage({ message: newChallenge.message });

  await assert.rejects(
    async () => {
      await accountLinkingService.verifyAndLink('usr_test_67890', testAccount.address, forgedSignature);
    },
    /Invalid signature/,
    'Forged signature must be rejected'
  );
  console.log('  ✓ Forged signature correctly identified and rejected');

  console.log('\n========================================');
  console.log('ALL 8 AUTHENTICATION TESTS PASSED (100%)');
  console.log('========================================\n');
}

runAuthTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
