import { crmErrors } from './crm-errors';
import type { CrmChannelName, CrmIdentifier } from './crm.types';

/**
 * Résolution de l'identifiant de canal.
 *
 * Règle explicite (et non un comportement implicite) : lorsqu'un appelant
 * transmet plusieurs identifiants, la précédence est TOUJOURS
 * téléphone > Instagram > Messenger. Un seul identifiant sert à la recherche :
 * combiner les identifiants en AND ferait échouer un contact qui n'a, par
 * exemple, que son téléphone renseigné.
 *
 * Sécurité : le premier identifiant présent est isolé, les suivants sont
 * ignorés pour la recherche (ils peuvent en revanche compléter une fiche vide
 * côté écriture, voir crm-service.ts).
 */

const CHANNEL_BY_KIND: Record<CrmIdentifier['kind'], CrmChannelName> = {
  PHONE: 'WHATSAPP',
  INSTAGRAM: 'INSTAGRAM',
  MESSENGER: 'MESSENGER',
};

/**
 * Normalisation minimale d'un numéro : on retire les séparateurs de saisie
 * (espaces, points, tirets, parenthèses) et on conserve un éventuel « + ».
 *
 * LIMITE ASSUMÉE : aucun indicatif pays n'est deviné. Convertir un numéro local
 * (« 6 55 00 00 00 ») en E.164 exige un indicatif configuré par shop, qui
 * n'existe pas encore dans le schéma. Tant qu'il n'est pas fourni, la recherche
 * se fait sur la forme stockée : les numéros déjà enregistrés dans un autre
 * format ne seront pas retrouvés (voir Hypothèses & Compromis).
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^0-9]/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export interface RawIdentifierInput {
  readonly phoneNumber?: string;
  readonly instagramId?: string;
  readonly messengerId?: string;
  readonly channel?: CrmChannelName;
}

/** Détermine l'identifiant de recherche, ou refuse la requête (400). */
export function resolveIdentifier(input: RawIdentifierInput): CrmIdentifier {
  if (input.phoneNumber && input.phoneNumber.trim() !== '') {
    const value = normalizePhone(input.phoneNumber);
    if (value.replace(/[^0-9]/g, '').length < 4) {
      throw crmErrors.validation('phoneNumber invalide (trop court).');
    }
    return { kind: 'PHONE', value, channel: input.channel ?? CHANNEL_BY_KIND.PHONE };
  }

  if (input.instagramId && input.instagramId.trim() !== '') {
    const value = input.instagramId.trim();
    return {
      kind: 'INSTAGRAM',
      value,
      channel: input.channel ?? CHANNEL_BY_KIND.INSTAGRAM,
    };
  }

  if (input.messengerId && input.messengerId.trim() !== '') {
    const value = input.messengerId.trim();
    return {
      kind: 'MESSENGER',
      value,
      channel: input.channel ?? CHANNEL_BY_KIND.MESSENGER,
    };
  }

  throw crmErrors.validation(
    'Au moins un identifiant de canal est requis : phoneNumber, instagramId ou messengerId.',
  );
}

/**
 * Identifiants complémentaires (rattachement d'une fiche incomplète).
 * Ne contient jamais l'identifiant principal déjà résolu.
 */
export function resolveExtraIdentifiers(
  input: RawIdentifierInput,
  primary: CrmIdentifier,
): CrmIdentifier[] {
  const candidates: CrmIdentifier[] = [];

  if (input.phoneNumber && input.phoneNumber.trim() !== '') {
    candidates.push({
      kind: 'PHONE',
      value: normalizePhone(input.phoneNumber),
      channel: 'WHATSAPP',
    });
  }
  if (input.instagramId && input.instagramId.trim() !== '') {
    candidates.push({
      kind: 'INSTAGRAM',
      value: input.instagramId.trim(),
      channel: 'INSTAGRAM',
    });
  }
  if (input.messengerId && input.messengerId.trim() !== '') {
    candidates.push({
      kind: 'MESSENGER',
      value: input.messengerId.trim(),
      channel: 'MESSENGER',
    });
  }

  return candidates.filter(
    (candidate) =>
      !(candidate.kind === primary.kind && candidate.value === primary.value),
  );
}