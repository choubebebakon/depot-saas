import { createHash } from 'node:crypto';

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((out, key) => {
        out[key] = canonicalize((value as Record<string, unknown>)[key]);
        return out;
      }, {});
  }
  return value;
}

export function stockPayloadHash(payload: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(payload)))
    .digest('hex');
}

export function getIdempotencyKey(data: Record<string, unknown>): string | undefined {
  const raw = data.idempotencyKey ?? data.operationId;
  if (typeof raw !== 'string') return undefined;
  const key = raw.trim();
  return key.length > 0 && key.length <= 200 ? key : undefined;
}

/**
 * Stable UUID derived from the tenant + idempotency key.
 * It lets us enforce idempotency using the existing unique primary keys,
 * without introducing a second persistence table just for stock commands.
 */
export function stockOperationId(tenantId: string, idempotencyKey: string): string {
  const digest = createHash('sha256')
    .update(`${tenantId}\u0000${idempotencyKey}`)
    .digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
