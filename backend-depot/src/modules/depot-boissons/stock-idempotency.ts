import { createHash } from 'node:crypto';

export function stockPayloadHash(payload: unknown): string {
  const canonical = JSON.stringify(payload, Object.keys((payload ?? {}) as object).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

export function getIdempotencyKey(data: Record<string, unknown>): string | undefined {
  const raw = data.idempotencyKey ?? data.operationId;
  if (typeof raw !== 'string') return undefined;
  const key = raw.trim();
  return key.length > 0 ? key : undefined;
}
