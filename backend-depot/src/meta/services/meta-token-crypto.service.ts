import { Injectable, OnModuleInit } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/** Blob sérialisé stocké dans `MetaIntegration.encryptedAccessToken`. */
export interface EncryptedTokenBlob {
  accessToken: string;
  /** PIN de renvoi éventuel de l'étape 3 (register) d'Embedded Signup. */
  registerPin?: string;
}

/**
 * Chiffrement AES-256-GCM — contrainte n°2 : « Token jamais stocké en clair ».
 *
 * Format du blob chiffré : `iv(12) || authTag(16) || ciphertext`, encodé en
 * base64. L'IV est régénéré aléatoirement à CHAQUE chiffrement ; le tag
 * d'authentification GCM rend toute altération du ciphertext détectable au
 * déchiffrement (un blob falsifié est rejeté, jamais déchiffré en silence).
 * La clé vient EXCLUSIVEMENT de l'environnement (META_TOKEN_ENCRYPTION_KEY) —
 * jamais du code, jamais de la base.
 */
@Injectable()
export class MetaTokenCryptoService implements OnModuleInit {
  private key: Buffer | null = null;

  onModuleInit(): void {
    const raw = process.env.META_TOKEN_ENCRYPTION_KEY?.trim() ?? '';
    const isProduction = process.env.NODE_ENV === 'production';

    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      this.key = Buffer.from(raw, 'hex');
      return;
    }

    if (isProduction) {
      // Fail closed : en production, démarrer sans clé de chiffrement exposerait
      // des jetons Meta en clair dans la base au premier onboarding. On refuse
      // le démarrage plutôt que de dégrader la sécurité en silence.
      throw new Error(
        'META_TOKEN_ENCRYPTION_KEY manquante ou invalide : 64 caractères hexadécimaux (32 octets) requis en production.',
      );
    }

    // Développement : clé éphémère régénérée à chaque démarrage. Les blobs
    // chiffrés lors d'un démarrage précédent deviennent illisibles — c'est
    // volontaire et journalisé, jamais silencieux (même politique que le
    // module CRM : fail closed en prod, secret éphémère en dev).
    this.key = randomBytes(32);
  }

  /** Chiffre un blob de jeton. Lève si la clé n'est pas initialisée. */
  encrypt(blob: EncryptedTokenBlob): string {
    const key = this.requireKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(blob), 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /** Déchiffre un blob de jeton. Lève si le blob est corrompu ou falsifié. */
  decrypt(payloadB64: string): EncryptedTokenBlob {
    const key = this.requireKey();
    const raw = Buffer.from(payloadB64, 'base64');
    if (raw.length < 29) {
      // iv(12) + tag(16) + au moins 1 octet de ciphertext.
      throw new Error('Blob de token corrompu.');
    }
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
    return JSON.parse(plaintext) as EncryptedTokenBlob;
  }

  private requireKey(): Buffer {
    if (!this.key) {
      throw new Error('MetaTokenCryptoService non initialisé (clé absente).');
    }
    return this.key;
  }
}
