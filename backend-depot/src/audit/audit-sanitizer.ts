const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'refreshtoken',
  'refreshtokenhash',
  'accesstoken',
  'twofasecret',
  'secret',
  'apikey',
  'authorization',
  'cookie',
  'setcookie',
  'privatekey',
  'clientsecret',
  'jwtsecret',
  'logo',
]);

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Sanitisation défensive des données avant persistance dans le journal d'audit.
 *
 * - insensible à la casse et aux séparateurs pour les clés sensibles ;
 * - bornée en profondeur, longueur de chaînes, tableaux et nombre de propriétés ;
 * - protège contre les références circulaires ;
 * - ne modifie pas les objets source.
 */
export function sanitizeAuditValue(
  value: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet<object>(),
): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 4) return '[profondeur masquée]';

  if (typeof value === 'string') {
    return value.length > 2_000 ? `${value.slice(0, 2_000)}…[tronqué]` : value;
  }

  if (typeof value !== 'object') return value;
  if (seen.has(value)) return '[référence circulaire masquée]';
  seen.add(value);

  try {
    if (Array.isArray(value)) {
      return value.slice(0, 100).map((item) => sanitizeAuditValue(item, depth + 1, seen));
    }

    const entries = Object.entries(value as Record<string, unknown>);
    const limitedEntries = entries.slice(0, 100);
    const result = Object.fromEntries(
      limitedEntries.map(([key, child]) => [
        key,
        REDACTED_KEYS.has(normalizeKey(key))
          ? '[masqué]'
          : sanitizeAuditValue(child, depth + 1, seen),
      ]),
    );

    if (entries.length > limitedEntries.length) {
      result.__audit_truncated_keys = `[${entries.length - limitedEntries.length} propriétés masquées]`;
    }
    return result;
  } finally {
    seen.delete(value);
  }
}
