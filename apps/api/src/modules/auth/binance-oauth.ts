import crypto from 'crypto';
import { BinanceOAuthStatus, BinanceUserProfile, BINANCE_OAUTH_ENDPOINTS } from '@craft/shared';

export interface OAuthStateRecord {
  state: string;
  codeVerifier?: string;
  createdAt: number;
}

export class BinanceOAuthService {
  private clientId?: string;
  private clientSecret?: string;
  private redirectUri?: string;
  private isEnabled: boolean;

  // In-memory store for pending CSRF states with TTL expiration (10 min)
  private pendingStates: Map<string, OAuthStateRecord> = new Map();

  constructor() {
    this.clientId = process.env.BINANCE_OAUTH_CLIENT_ID;
    this.clientSecret = process.env.BINANCE_OAUTH_CLIENT_SECRET;
    this.redirectUri = process.env.BINANCE_OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/binance/callback';
    this.isEnabled = process.env.BINANCE_OAUTH_ENABLED === 'true';
  }

  /**
   * Check if official partner OAuth credentials are fully provided
   */
  public isConfigured(): boolean {
    return Boolean(
      this.isEnabled &&
      this.clientId &&
      this.clientId.length > 5 &&
      this.clientSecret &&
      this.clientSecret.length > 5 &&
      this.redirectUri
    );
  }

  /**
   * Diagnostic status reported to UI and reviewers
   */
  public getStatus(): BinanceOAuthStatus {
    const configured = this.isConfigured();
    return {
      enabled: this.isEnabled,
      configured,
      partnerAccessRequired: true,
      clientIdPrefix: this.clientId ? `${this.clientId.substring(0, 4)}...` : undefined,
      redirectUri: this.redirectUri,
      message: configured
        ? 'Official Binance OAuth partner credentials configured and active.'
        : 'Official Binance OAuth requires approved ecosystem partner access from the Binance Developer Center (developers.binance.com). Web3 wallet connection is fully active.',
    };
  }

  /**
   * Initiate official OAuth 2.0 Authorization request
   * Implements CSRF state and PKCE (RFC 7636) code challenge
   */
  public generateAuthorizationUrl(customScope = 'user:openId'): {
    url: string;
    state: string;
    codeVerifier: string;
  } {
    if (!this.isConfigured()) {
      throw new Error(
        'Binance OAuth is not active. Official partner access credentials (BINANCE_OAUTH_CLIENT_ID, BINANCE_OAUTH_CLIENT_SECRET) must be issued by Binance.'
      );
    }

    // Generate cryptographic CSRF state token
    const state = crypto.randomBytes(24).toString('hex');

    // Generate PKCE code verifier and code challenge (S256)
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Store state with timestamp for replay & expiration protection
    this.pendingStates.set(state, {
      state,
      codeVerifier,
      createdAt: Date.now(),
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId!,
      redirect_uri: this.redirectUri!,
      scope: customScope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const url = `${BINANCE_OAUTH_ENDPOINTS.AUTHORIZE}?${params.toString()}`;

    return {
      url,
      state,
      codeVerifier,
    };
  }

  /**
   * Validate received CSRF state on callback
   */
  public validateAndConsumeState(state: string): OAuthStateRecord | null {
    const record = this.pendingStates.get(state);
    if (!record) return null;

    // Remove state immediately to prevent replay
    this.pendingStates.delete(state);

    // 10 minute expiration check
    if (Date.now() - record.createdAt > 10 * 60 * 1000) {
      return null;
    }

    return record;
  }

  /**
   * Exchange authorization code for access token via Binance token endpoint
   */
  public async exchangeCodeForToken(
    code: string,
    stateRecord: OAuthStateRecord
  ): Promise<{
    accessToken: string;
    openId: string;
    scopes: string[];
  }> {
    if (!this.isConfigured()) {
      throw new Error('Binance OAuth credentials missing or not enabled.');
    }

    const payload = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId!,
      client_secret: this.clientSecret!,
      code: code,
      redirect_uri: this.redirectUri!,
      code_verifier: stateRecord.codeVerifier || '',
    });

    const response = await fetch(BINANCE_OAUTH_ENDPOINTS.TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CRAFT-Protocol/1.0',
      },
      body: payload.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Binance OAuth token exchange failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      openId: data.openId || data.sub,
      scopes: (data.scope || 'user:openId').split(' '),
    };
  }

  /**
   * Query Binance user info endpoint
   */
  public async fetchUserInfo(accessToken: string): Promise<BinanceUserProfile> {
    const response = await fetch(BINANCE_OAUTH_ENDPOINTS.USER_INFO, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'CRAFT-Protocol/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Binance user profile (${response.status})`);
    }

    const data = await response.json();
    return {
      providerSubject: data.openId || data.sub,
      displayName: data.nickname || data.userName || `Binance User #${(data.openId || '').slice(-4)}`,
      email: data.email, // only present if user granted email scope
      scopes: ['user:openId'],
      linkedAt: new Date().toISOString(),
    };
  }
}

export const binanceOAuthService = new BinanceOAuthService();
