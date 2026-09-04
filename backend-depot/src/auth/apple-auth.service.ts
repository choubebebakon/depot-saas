import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions.constants';
import { AuditSeverite } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  createHash,
  createPublicKey,
  createSign,
  randomBytes,
  timingSafeEqual,
  verify as verifySignature,
} from 'crypto';

interface AppleJwk {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  crv?: string;
  x: string;
  y: string;
}

interface AppleClaims {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  nonce?: string;
  iat: number;
  exp: number;
}

interface AppleTokenResponse {
  id_token?: string;
  refresh_token?: string;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface AppleIdentityRow {
  userId: string;
}

@Injectable()
export class AppleAuthService {
  private appleKeysCache: { keys: AppleJwk[]; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  private getConfig() {
    const clientId = process.env.APPLE_CLIENT_ID?.trim();
    const teamId = process.env.APPLE_TEAM_ID?.trim();
    const keyId = process.env.APPLE_KEY_ID?.trim();
    const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
    const redirectUri = process.env.APPLE_REDIRECT_URI?.trim();

    if (!clientId || !teamId || !keyId || !privateKey || !redirectUri) {
      throw new BadRequestException('Connexion Apple non configurée.');
    }
    if (!redirectUri.startsWith('https://') || redirectUri.includes('#')) {
      throw new BadRequestException('APPLE_REDIRECT_URI doit être une URL HTTPS valide.');
    }

    return { clientId, teamId, keyId, privateKey, redirectUri };
  }

  private getRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET?.trim() || (
      process.env.NODE_ENV === 'production' ? undefined : 'dev-only-refresh-secret-change-me'
    );
    if (!secret) throw new Error('JWT_REFRESH_SECRET est obligatoire en production.');
    return secret;
  }

  private base64Url(value: string | Buffer): string {
    return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  private decodeBase64Url(value: string): Buffer {
    return Buffer.from(
      value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='),
      'base64',
    );
  }

  private derToJose(signature: Buffer, componentLength = 32): Buffer {
    if (signature[0] !== 0x30) throw new Error('Signature DER invalide.');
    let offset = 1;
    let length = signature[offset++];
    if (length & 0x80) {
      const bytes = length & 0x7f;
      length = 0;
      for (let i = 0; i < bytes; i++) length = (length << 8) | signature[offset++];
    }
    if (offset + length !== signature.length) throw new Error('Signature DER invalide.');
    if (signature[offset++] !== 0x02) throw new Error('Signature DER invalide.');
    const rLength = signature[offset++];
    const r = signature.subarray(offset, offset + rLength);
    offset += rLength;
    if (signature[offset++] !== 0x02) throw new Error('Signature DER invalide.');
    const sLength = signature[offset++];
    const s = signature.subarray(offset, offset + sLength);
    if (r.length > componentLength + 1 || s.length > componentLength + 1) throw new Error('Signature ECDSA trop longue.');

    const normalize = (part: Buffer) => {
      let value = part;
      while (value.length > componentLength && value[0] === 0) value = value.subarray(1);
      if (value.length > componentLength) throw new Error('Composant ECDSA invalide.');
      const out = Buffer.alloc(componentLength);
      value.copy(out, componentLength - value.length);
      return out;
    };

    return Buffer.concat([normalize(r), normalize(s)]);
  }

  private joseToDer(signature: Buffer, componentLength = 32): Buffer {
    if (signature.length !== componentLength * 2) throw new Error('Signature JOSE invalide.');
    const encodeInteger = (part: Buffer) => {
      let value = Buffer.from(part);
      while (value.length > 1 && value[0] === 0) value = value.subarray(1);
      if (value[0] & 0x80) value = Buffer.concat([Buffer.from([0]), value]);
      return Buffer.concat([Buffer.from([0x02, value.length]), value]);
    };
    const r = encodeInteger(signature.subarray(0, componentLength));
    const s = encodeInteger(signature.subarray(componentLength));
    const body = Buffer.concat([r, s]);
    return Buffer.concat([Buffer.from([0x30, body.length]), body]);
  }

  private async getAppleKeys(forceRefresh = false): Promise<AppleJwk[]> {
    if (!forceRefresh && this.appleKeysCache && this.appleKeysCache.expiresAt > Date.now()) {
      return this.appleKeysCache.keys;
    }

    let response: Response;
    try {
      response = await fetch('https://appleid.apple.com/auth/keys', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new UnauthorizedException('Impossible de vérifier le compte Apple.');
    }
    if (!response.ok) throw new UnauthorizedException('Impossible de vérifier le compte Apple.');

    const body = (await response.json()) as { keys?: AppleJwk[] };
    if (!Array.isArray(body.keys) || body.keys.length === 0) {
      throw new UnauthorizedException('Clés Apple indisponibles.');
    }
    this.appleKeysCache = { keys: body.keys, expiresAt: Date.now() + 60 * 60 * 1000 };
    return body.keys;
  }

  private createClientSecret(): string {
    const { clientId, teamId, keyId, privateKey } = this.getConfig();
    const now = Math.floor(Date.now() / 1000);
    const header = this.base64Url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
    const payload = this.base64Url(JSON.stringify({
      iss: teamId,
      iat: now,
      exp: now + 5 * 60,
      aud: 'https://appleid.apple.com',
      sub: clientId,
    }));
    const signingInput = `${header}.${payload}`;
    const signer = createSign('SHA256');
    signer.update(signingInput);
    signer.end();
    const derSignature = signer.sign({ key: privateKey, dsaEncoding: 'der' });
    const joseSignature = this.derToJose(derSignature);
    return `${signingInput}.${this.base64Url(joseSignature)}`;
  }

  private async exchangeCode(code: string): Promise<AppleTokenResponse> {
    const { clientId, redirectUri } = this.getConfig();
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: this.createClientSecret(),
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    let response: Response;
    try {
      response = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: body.toString(),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new UnauthorizedException('Impossible de contacter Apple.');
    }

    const result = (await response.json()) as AppleTokenResponse;
    if (!response.ok || !result.id_token) {
      throw new UnauthorizedException(result.error_description || 'Code Apple invalide ou expiré.');
    }
    return result;
  }

  private async verifyIdToken(idToken: string, expectedNonce: string): Promise<AppleClaims> {
    if (!idToken || idToken.length > 8192) throw new UnauthorizedException('Identifiant Apple invalide.');
    const parts = idToken.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Identifiant Apple invalide.');

    let header: { alg?: string; kid?: string; typ?: string };
    let claims: AppleClaims;
    try {
      header = JSON.parse(this.decodeBase64Url(parts[0]).toString('utf8'));
      claims = JSON.parse(this.decodeBase64Url(parts[1]).toString('utf8'));
    } catch {
      throw new UnauthorizedException('Identifiant Apple invalide.');
    }

    const { clientId } = this.getConfig();
    if (header.alg !== 'ES256' || !header.kid) throw new UnauthorizedException('Algorithme Apple non accepté.');
    if (!claims || claims.iss !== 'https://appleid.apple.com' || claims.aud !== clientId) {
      throw new UnauthorizedException('Identifiant Apple non destiné à GesTock.');
    }

    const now = Math.floor(Date.now() / 1000);
    if (!claims.sub || !Number.isFinite(claims.iat) || !Number.isFinite(claims.exp) || claims.exp <= now || claims.iat > now + 300) {
      throw new UnauthorizedException('Identifiant Apple expiré ou invalide.');
    }
    if (!claims.nonce || !expectedNonce || claims.nonce !== expectedNonce) {
      throw new UnauthorizedException('Nonce Apple invalide.');
    }
    if (claims.email_verified !== true && claims.email_verified !== 'true') {
      throw new UnauthorizedException('Adresse Apple non vérifiée.');
    }

    let keys = await this.getAppleKeys();
    let jwk = keys.find((key) => key.kid === header.kid);
    if (!jwk) {
      keys = await this.getAppleKeys(true);
      jwk = keys.find((key) => key.kid === header.kid);
    }
    if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || jwk.alg && jwk.alg !== 'ES256') {
      throw new UnauthorizedException('Clé Apple inconnue.');
    }

    let valid = false;
    try {
      const publicKey = createPublicKey({ key: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, format: 'jwk' });
      const joseSignature = this.decodeBase64Url(parts[2]);
      const derSignature = this.joseToDer(joseSignature);
      valid = verifySignature('sha256', Buffer.from(`${parts[0]}.${parts[1]}`), publicKey, derSignature);
    } catch {
      valid = false;
    }
    if (!valid) throw new UnauthorizedException('Signature Apple invalide.');
    return claims;
  }

  private async findUserByAppleSub(appleSub: string) {
    const mappings = await this.prisma.$queryRaw<AppleIdentityRow[]>(Prisma.sql`
      SELECT "userId"
      FROM "AppleIdentity"
      WHERE "appleSub" = ${appleSub}
      LIMIT 1
    `);
    if (!mappings[0]) return null;
    return this.prisma.user.findUnique({ where: { id: mappings[0].userId }, include: { tenant: true } });
  }

  private async linkAppleIdentity(appleSub: string, userId: string) {
    const existingForUser = await this.prisma.$queryRaw<AppleIdentityRow[]>(Prisma.sql`
      SELECT "userId"
      FROM "AppleIdentity"
      WHERE "userId" = ${userId}
      LIMIT 1
    `);
    if (existingForUser[0] && existingForUser[0].userId === userId) return;

    const id = randomBytes(16).toString('hex');
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "AppleIdentity" ("id", "appleSub", "userId", "createdAt", "updatedAt")
      VALUES (${id}, ${appleSub}, ${userId}, NOW(), NOW())
      ON CONFLICT ("appleSub") DO NOTHING
    `);
  }

  private async issueSession(user: any, meta?: { ip?: string | null; userAgent?: string | null }) {
    if (!user?.tenant?.estActif) throw new UnauthorizedException('Compte suspendu. Contactez votre administrateur.');
    if (!user.isActive) throw new UnauthorizedException('Compte utilisateur désactivé.');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      depotId: user.depotId ?? undefined,
    };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { secret: this.getRefreshSecret(), expiresIn: '30d' });
    const refreshTokenHash = await argon2.hash(refresh_token);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { refreshTokenHash } });
      await tx.refreshToken.deleteMany({ where: { userId: user.id } });
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await tx.refreshToken.create({ data: { token, userId: user.id, expiresAt } });
    });

    await this.auditService.logEvent({
      tenantId: user.tenantId,
      depotId: user.depotId ?? null,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: AUDIT_ACTIONS.CONNEXION,
      severite: AuditSeverite.INFO,
      targetType: 'User',
      targetId: user.id,
      reference: user.email,
      description: `Connexion Apple de ${user.email}`,
      ipAddress: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
    }).catch((err) => console.error('[Audit] Échec log CONNEXION_APPLE:', err));

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        depotId: user.depotId ?? null,
        nomEntreprise: user.tenant.nomEntreprise ?? user.tenant.name,
        metier: user.tenant.metier,
        statutAbonnement: user.tenant.statutAbonnement,
        isSuperAdmin: user.isSuperAdmin,
      },
    };
  }

  async createChallenge() {
    this.getConfig();
    return {
      state: randomBytes(32).toString('hex'),
      nonce: randomBytes(32).toString('hex'),
    };
  }

  async loginWithApple(code: string, state: string, nonce: string, expectedState: string, expectedNonce: string, meta?: { ip?: string | null; userAgent?: string | null }) {
    if (!code || code.length > 2048 || !state || state.length > 256 || !nonce || nonce.length > 256) {
      throw new UnauthorizedException('Réponse Apple invalide.');
    }
    if (!expectedState || !expectedNonce || !timingSafeEqual(Buffer.from(state), Buffer.from(expectedState)) || !timingSafeEqual(Buffer.from(nonce), Buffer.from(expectedNonce))) {
      throw new UnauthorizedException('Session Apple invalide ou expirée.');
    }

    const tokenResponse = await this.exchangeCode(code);
    const claims = await this.verifyIdToken(tokenResponse.id_token!, expectedNonce);
    const appleSub = claims.sub;
    const email = claims.email?.trim().toLowerCase();
    if (!email || email.length > 320) throw new UnauthorizedException('Apple n’a pas fourni une adresse email vérifiée.');

    let user = await this.findUserByAppleSub(appleSub);
    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email }, include: { tenant: true } });
      if (!user) {
        throw new UnauthorizedException('Aucun compte GesTock associé à ce compte Apple. Créez d’abord votre compte GesTock ou associez Apple à votre compte existant.');
      }
      await this.linkAppleIdentity(appleSub, user.id);
    }

    return this.issueSession(user, meta);
  }
}
