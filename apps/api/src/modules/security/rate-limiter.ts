import { NextFunction, Request, Response } from 'express';
import { verifyMessage } from 'viem';

interface Bucket {
  timestamps: number[];
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  label: string;
}) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${options.label}:${clientIp}`;
    const now = Date.now();
    const cutoff = now - options.windowMs;

    const bucket = buckets.get(key) || { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

    res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
    res.setHeader(
      'X-RateLimit-Remaining',
      String(Math.max(0, options.maxRequests - bucket.timestamps.length))
    );

    if (bucket.timestamps.length >= options.maxRequests) {
      return res.status(429).json({
        error: `Rate limit exceeded for ${options.label}. Max ${options.maxRequests} requests per ${Math.round(
          options.windowMs / 1000
        )}s.`,
      });
    }

    bucket.timestamps.push(now);
    buckets.set(key, bucket);
    next();
  };
}

interface NonceEntry {
  address: string;
  action: string;
  message: string;
  expiresAt: number;
  used: boolean;
}

class WalletActionSecurityService {
  private nonces = new Map<string, NonceEntry>();

  issueActionChallenge(address: string, action: string): { nonce: string; message: string; expiresAt: string } {
    const cleanAddress = address.toLowerCase();
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const message = [
      'CRAFT Verified Work Protocol — Action Authorization',
      `Action: ${action}`,
      `Wallet: ${address}`,
      `Nonce: ${nonce}`,
      `Issued: ${new Date().toISOString()}`,
    ].join('\n');

    this.nonces.set(nonce, {
      address: cleanAddress,
      action,
      message,
      expiresAt,
      used: false,
    });

    // Garbage collect expired challenges
    for (const [k, entry] of Array.from(this.nonces.entries())) {
      if (entry.expiresAt < Date.now()) {
        this.nonces.delete(k);
      }
    }

    return { nonce, message, expiresAt: new Date(expiresAt).toISOString() };
  }

  async verifyWalletActionSignature(params: {
    address: string;
    signature: string;
    nonce: string;
    expectedAction?: string;
  }): Promise<{ valid: boolean; reason?: string }> {
    const entry = this.nonces.get(params.nonce);
    if (!entry) {
      return { valid: false, reason: 'Invalid or expired authorization nonce.' };
    }
    if (entry.used) {
      return { valid: false, reason: 'Replay rejected: authorization nonce already consumed.' };
    }
    if (entry.expiresAt < Date.now()) {
      this.nonces.delete(params.nonce);
      return { valid: false, reason: 'Authorization nonce expired.' };
    }
    if (entry.address !== params.address.toLowerCase()) {
      return { valid: false, reason: 'Signer address does not match challenge address.' };
    }
    if (params.expectedAction && entry.action !== params.expectedAction) {
      return { valid: false, reason: 'Authorization nonce action mismatch.' };
    }

    try {
      const ok = await verifyMessage({
        address: params.address as `0x${string}`,
        message: entry.message,
        signature: params.signature as `0x${string}`,
      });
      if (!ok) {
        return { valid: false, reason: 'Invalid EIP-191 cryptographic signature.' };
      }
      entry.used = true;
      return { valid: true };
    } catch (err: any) {
      return { valid: false, reason: err?.message || 'Signature verification failed.' };
    }
  }
}

export const walletActionSecurity = new WalletActionSecurityService();
