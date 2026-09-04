import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createPublicKey, verify as verifySignature } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions.constants';
import { AuditSeverite } from '@prisma/client';

interface GoogleClaims {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: boolean;
  hd?: string;
  iat: number;
  exp: number;
}

interface GoogleJwk {
  kty: string;
  alg?: string;
  use?: string;
  kid: string;
  n: string;
  e: string;
}

@Injectable()
export class GoogleAuthService {
  private jwksCache: { keys: GoogleJwk[]; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  private getGoogleClientId(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) throw new BadRequestException('Connexion Google non configurée.');
    return clientId;
  }

  private async getGoogleKeys(forceRefresh = false): Promise<GoogleJwk[]> {
    if (!forceRefresh && this.jwksCache && this.jwksCache.expiresAt > Date.now()) return this.jwksCache.keys;

    const response = await fetch('https://www.googleapis.com/oauth2/v3/certs', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new UnauthorizedException('Impossible de vérifier le compte Google.');

    const cacheControl = response.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
    const maxAgeSeconds = Math.min(Math.max(Number(maxAgeMatch?.[1] || 3600), 300), 86400);
    const body = (await response.json()) as { keys?: GoogleJwk[] };
    if (!Array.isArray(body.keys) || body.keys.length === 0) throw new UnauthorizedException('Clés Google indisponibles.');

    this.jwksCache = { keys: body.keys, expiresAt: Date.now() + maxAgeSeconds * 1000 };
    return body.keys;
  }

  private decodePart(value: string): Buffer {
    return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='), 'base64');
  }

  private async verifyIdToken(idToken: string): Promise<GoogleClaims> {
    if (!idToken || idToken.length > 8192) throw new UnauthorizedException('Identifiant Google invalide.');

    const parts = idToken.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Identifiant Google invalide.');

    let header: { alg?: string; kid?: string };
    let claims: GoogleClaims;
    try {
      header = JSON.parse(this.decodePart(parts[0]).toString('utf8'));
      claims = JSON.parse(this.decodePart(parts[1]).toString('utf8'));
    } catch {
      throw new UnauthorizedException('Identifiant Google invalide.');
    }

    if (header.alg !== 'RS256' || !header.kid) throw new UnauthorizedException('Algorithme Google non accepté.');
    if (!claims || claims.iss !== 'https://accounts.google.com' || claims.aud !== this.getGoogleClientId()) {
      throw new UnauthorizedException('Identifiant Google non destiné à GesTock.');
    }

    const now = Math.floor(Date.now() / 1000);
    if (!claims.sub || !Number.isFinite(claims.iat) || !Number.isFinite(claims.exp) || claims.exp <= now || claims.iat > now + 300) {
      throw new UnauthorizedException('Identifiant Google expiré ou invalide.');
    }
    if (!claims.email || claims.email.length > 320 || claims.email_verified !== true) {
      throw new UnauthorizedException('Adresse Google non vérifiée.');
    }

    const email = claims.email.toLowerCase();
    const gmail = email.endsWith('@gmail.com');
    const workspace = typeof claims.hd === 'string' && claims.hd.length > 0;
    if (!gmail && !workspace) {
      throw new UnauthorizedException('Ce compte Google ne permet pas de vérifier suffisamment la propriété de cette adresse.');
    }

    let keys = await this.getGoogleKeys();
    let jwk = keys.find((key) => key.kid === header.kid);
    if (!jwk) {
      keys = await this.getGoogleKeys(true);
      jwk = keys.find((key) => key.kid === header.kid);
    }
    if (!jwk) throw new UnauthorizedException('Clé Google inconnue.');

    let valid = false;
    try {
      const publicKey = createPublicKey({ key: { kty: jwk.kty, n: jwk.n, e: jwk.e }, format: 'jwk' });
      valid = verifySignature('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), publicKey, this.decodePart(parts[2]));
    } catch {
      valid = false;
    }
    if (!valid) throw new UnauthorizedException('Signature Google invalide.');

    return { ...claims, email };
  }

  private async issueSession(user: any, meta?: { ip?: string | null; userAgent?: string | null }) {
    if (!user.tenant?.estActif) throw new UnauthorizedException('Compte suspendu. Contactez votre administrateur.');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      depotId: user.depotId ?? undefined,
    };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET?.trim() || 'dev-only-refresh-secret-change-me',
      expiresIn: '30d',
    });
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
      description: `Connexion Google de ${user.email}`,
      ipAddress: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
    }).catch((err) => console.error('[Audit] Échec log CONNEXION_GOOGLE:', err));

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

  async loginWithGoogle(idToken: string, meta?: { ip?: string | null; userAgent?: string | null }) {
    const claims = await this.verifyIdToken(idToken);
    const user = await this.prisma.user.findUnique({ where: { email: claims.email }, include: { tenant: true } });

    // Google Sign-In is deliberately login/link-only here. A new tenant must still
    // be created through the existing onboarding flow, where métier and company data are collected.
    if (!user) throw new UnauthorizedException('Aucun compte GesTock associé à cette adresse. Créez d’abord votre compte GesTock.');
    if (!user.isActive) throw new UnauthorizedException('Compte utilisateur désactivé.');

    return this.issueSession(user, meta);
  }
}
