import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { RealtimeService } from '../common/realtime/realtime.service';
import { CRM_SERIALIZABLE_RETRIES } from './crm.constants';
import {
  assertPatchWithinBounds,
  deepMergeMetaData,
  isPlainObject,
  toJsonObject,
} from './crm-deep-merge';
import { crmErrors } from './crm-errors';
import { CrmLogger } from './crm-logger.service';
import { clientUniqueWhere, toCustomerProfile } from './crm-mapper';
import { CrmSettingsService } from './crm-settings.service';
import type {
  CrmIdentifier,
  JsonObject,
  UpsertCustomerInput,
  UpsertCustomerResult,
} from './crm.types';

/** Projection minimale, partagée avec la lecture. */
const CLIENT_SELECT = {
  id: true,
  nom: true,
  telephone: true,
  instagramId: true,
  messengerId: true,
  depotId: true,
  createdAt: true,
  updatedAt: true,
  metaData: true,
} as const;

/** Champs d'identité d'un client, restreints aux colonnes de canal. */
type ClientIdentityFields = Pick<
  Prisma.ClientCreateInput,
  'telephone' | 'instagramId' | 'messengerId'
>;

/**
 * Écriture CRM : `upsertCustomerFromIA`.
 *
 * CONCURRENCE (fusion JSONB sans perte de mise à jour) :
 * deux webhooks quasi simultanés sur le même client produiraient une perte de
 * mise à jour avec un simple « lire → fusionner → écrire ». La lecture et
 * l'écriture se font donc dans UNE transaction en isolation `Serializable` :
 * PostgreSQL détecte le conflit d'écriture croisée et rejette l'un des deux
 * commits (P2034). La transaction est alors rejouée : la seconde tentative
 * relit l'état frais et refusionne le patch, donc aucune donnée n'est perdue.
 *
 * Alternative écartée : `UPDATE ... SET metaData = metaData || $1` (opérateur
 * JSONB `||`) n'effectue qu'une fusion de PREMIER niveau et écraserait les
 * sous-objets imbriqués, ce qui est inacceptable pour un profil client.
 */
@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: CrmSettingsService,
    private readonly realtime: RealtimeService,
    private readonly logger: CrmLogger,
  ) {}

  async upsertCustomerFromIA(
    input: UpsertCustomerInput,
  ): Promise<UpsertCustomerResult> {
    const patch = this.normalizePatch(input.metaDataPatch);
    const displayName = input.displayName?.trim() || undefined;

    for (let attempt = 1; attempt <= CRM_SERIALIZABLE_RETRIES; attempt += 1) {
      try {
        const result = await this.prisma.$transaction(
          async (tx) => this.applyUpsert(tx, input, patch, displayName),
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,
            timeout: 10000,
          },
        );

        this.publishMutation(input, result.created);
        return result;
      } catch (error) {
        if (
          this.isSerializationFailure(error) &&
          attempt < CRM_SERIALIZABLE_RETRIES
        ) {
          this.logger.warn('crm_upsert_serialization_retry', {
            requestId: input.requestId,
            tenantId: input.tenantId,
            attempt,
          });
          continue;
        }

        throw error;
      }
    }

    throw crmErrors.internal(
      'Fusion des métadonnées impossible après plusieurs tentatives concurrentes.',
    );
  }

  /**
   * Corps de la transaction : lecture de l'état courant puis fusion.
   * Tout se fait dans la même transaction Serializable, ce qui rend la fusion
   * « lire-fusionner-écrire » atomique vis-à-vis des webhooks concurrents.
   */
  private async applyUpsert(
    tx: Prisma.TransactionClient,
    input: UpsertCustomerInput,
    patch: JsonObject,
    displayName: string | undefined,
  ): Promise<UpsertCustomerResult> {
    const [tenant, existing] = await Promise.all([
      tx.tenant.findUnique({
        where: { id: input.tenantId },
        select: { parametres: true },
      }),
      tx.client.findUnique({
        where: clientUniqueWhere(input.tenantId, input.identifier),
        select: CLIENT_SELECT,
      }),
    ]);

    const shopSettings = this.settings.resolve(tenant?.parametres ?? null);
    const identity = this.identityFields(input.identifier);

    // le depotId provient du body : il doit appartenir au même commerçant,
    // sinon une clé valide pourrait rattacher un client à un dépôt étranger.
    if (input.depotId) {
      await this.assertDepotInTenant(tx, input.tenantId, input.depotId);
    }

    const mergeOptions = {
      appendPaths: shopSettings.metaData.appendPaths,
      maxArrayItems: shopSettings.metaData.maxArrayItems,
    };

    if (!existing) {
      // `nom` est NOT NULL en base et un client sans nom n'est pas exploitable
      // par le commerçant : on refuse plutôt que d'inventer un nom de
      // remplacement. C'est exactement le cas où l'IA doit collecter le nom.
      if (!displayName) {
        throw crmErrors.nameRequired(
          "Client inconnu de ce shop : collectez le nom auprès du contact avant d'enregistrer la fiche.",
        );
      }

      const merged = deepMergeMetaData({}, patch, mergeOptions);

      const created = await tx.client.create({
        data: {
          tenantId: input.tenantId,
          nom: displayName,
          depotId: input.depotId ?? null,
          ...identity,
          // Renseignement des identifiants complémentaires fournis d'emblée.
          ...this.extraIdentityFields(identity, input.extraIdentifiers ?? []),
          metaData: merged.merged as Prisma.InputJsonValue,
        },
        select: CLIENT_SELECT,
      });

      this.logger.info('crm_customer_created', {
        requestId: input.requestId,
        tenantId: input.tenantId,
        customerId: created.id,
        channel: input.identifier.channel,
        identifierRef: this.logger.subjectRef(input.identifier.value),
      });

      return {
        created: true,
        customer: toCustomerProfile(created),
        metaData: toJsonObject(created.metaData),
        mergedPaths: merged.appliedPaths,
      };
    }

    const merged = deepMergeMetaData(toJsonObject(existing.metaData), patch, mergeOptions);

    const updateData: Prisma.ClientUpdateInput = {
      metaData: merged.merged as Prisma.InputJsonValue,
      ...this.extraIdentityFields(existing, input.extraIdentifiers ?? []),
    };

    // Le nom n'est écrasé que s'il est explicitement fourni : l'agent IA ne
    // doit jamais effacer un nom déjà connu avec une valeur vide.
    if (displayName) updateData.nom = displayName;

    const updated = await tx.client.update({
      where: { id: existing.id },
      data: updateData,
      select: CLIENT_SELECT,
    });

    this.logger.info('crm_customer_merged', {
      requestId: input.requestId,
      tenantId: input.tenantId,
      customerId: updated.id,
      channel: input.identifier.channel,
      identifierRef: this.logger.subjectRef(input.identifier.value),
      mergedPathCount: merged.appliedPaths.length,
    });

    return {
      created: false,
      customer: toCustomerProfile(updated),
      metaData: toJsonObject(updated.metaData),
      mergedPaths: merged.appliedPaths,
    };
  }

  /** Le patch doit être un objet JSON dans les bornes anti-abus. */
  private normalizePatch(raw: JsonObject | undefined): JsonObject {
    if (raw === undefined) return {};

    if (!isPlainObject(raw)) {
      throw crmErrors.validation('metaData doit être un objet JSON.');
    }

    assertPatchWithinBounds(raw);
    return raw;
  }

  /** Colonne de canal correspondant à l'identifiant de recherche. */
  private identityFields(identifier: CrmIdentifier): ClientIdentityFields {
    switch (identifier.kind) {
      case 'PHONE':
        return { telephone: identifier.value };
      case 'INSTAGRAM':
        return { instagramId: identifier.value };
      case 'MESSENGER':
        return { messengerId: identifier.value };
    }
  }

  /**
   * Renseigne les identifiants complémentaires (téléphone + Instagram +
   * Messenger d'un même contact) SANS jamais écraser une valeur existante.
   *
   * Un identifiant déjà rattaché à un autre contact ne doit pas être volé : il
   * est ignoré ici, et si la contrainte d'unicité du tenant le détecte, la base
   * lève P2002 (traduit en 409 IDENTITY_CONFLICT par le filtre d'erreurs).
   */
  private extraIdentityFields(
    current: ClientIdentityFields,
    extras: readonly CrmIdentifier[],
  ): ClientIdentityFields {
    const updates: ClientIdentityFields = {};

    for (const extra of extras) {
      switch (extra.kind) {
        case 'PHONE':
          if (!current.telephone && !updates.telephone) {
            updates.telephone = extra.value;
          }
          break;
        case 'INSTAGRAM':
          if (!current.instagramId && !updates.instagramId) {
            updates.instagramId = extra.value;
          }
          break;
        case 'MESSENGER':
          if (!current.messengerId && !updates.messengerId) {
            updates.messengerId = extra.value;
          }
          break;
      }
    }

    return updates;
  }

  /** Conflit d'écriture croisée PostgreSQL : la transaction doit être rejouée. */
  private isSerializationFailure(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }

  /**
   * Un `depotId` fourni par l'appelant ne doit jamais permettre de rattacher un
   * client à un dépôt d'un autre commerçant. Le contrôle est fait DANS la
   * transaction d'écriture : aucun appelant du service ne peut le contourner.
   */
  private async assertDepotInTenant(
    tx: Prisma.TransactionClient,
    tenantId: string,
    depotId: string,
  ): Promise<void> {
    const depot = await tx.depot.findFirst({
      where: { id: depotId, tenantId, isArchived: false },
      select: { id: true },
    });

    if (!depot) {
      throw crmErrors.validation('depotId inconnu pour ce shop.');
    }
  }

  /**
   * Diffusion temps réel APRÈS validation de la transaction, pour que le
   * back-office du commerçant rafraîchisse sa liste de clients sans scrutation.
   * L'événement ne contient aucune PII (pas de nom, pas de téléphone).
   */
  private publishMutation(input: UpsertCustomerInput, created: boolean): void {
    try {
      this.realtime.publish({
        type: 'api.mutation',
        resource: 'clients',
        action: created ? 'created' : 'updated',
        tenantId: input.tenantId,
        depotId: input.depotId ?? null,
        // Aucun acteur humain : la mutation provient de l'agent IA / du webhook.
        actorUserId: null,
        occurredAt: new Date().toISOString(),
        payload: { method: 'POST', path: '/api/v1/crm/customer/upsert' },
      });
    } catch {
      // La diffusion ne doit jamais faire échouer une écriture déjà validée.
    }
  }
}