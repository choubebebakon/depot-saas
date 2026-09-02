import {
  getIdempotencyKey,
  stockOperationId,
  stockPayloadHash,
} from './stock-idempotency';

describe('stock idempotency helpers', () => {
  it('normalizes object key order recursively', () => {
    expect(
      stockPayloadHash({ articleId: 'a', meta: { depotId: 'd', motif: 'x' }, quantite: 2 }),
    ).toBe(
      stockPayloadHash({ quantite: 2, meta: { motif: 'x', depotId: 'd' }, articleId: 'a' }),
    );
  });

  it('preserves array order', () => {
    expect(stockPayloadHash({ lines: [1, 2] })).not.toBe(
      stockPayloadHash({ lines: [2, 1] }),
    );
  });

  it('accepts idempotencyKey and legacy operationId', () => {
    expect(getIdempotencyKey({ idempotencyKey: ' abc ' })).toBe('abc');
    expect(getIdempotencyKey({ operationId: 'xyz' })).toBe('xyz');
  });

  it('rejects empty and oversized keys', () => {
    expect(getIdempotencyKey({ idempotencyKey: '   ' })).toBeUndefined();
    expect(getIdempotencyKey({ idempotencyKey: 'x'.repeat(201) })).toBeUndefined();
  });

  it('creates a stable UUID per tenant and key', () => {
    const first = stockOperationId('tenant-a', 'operation-1');
    expect(stockOperationId('tenant-a', 'operation-1')).toBe(first);
    expect(stockOperationId('tenant-a', 'operation-2')).not.toBe(first);
    expect(stockOperationId('tenant-b', 'operation-1')).not.toBe(first);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
