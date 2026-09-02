import { getIdempotencyKey, stockPayloadHash } from './stock-idempotency';

describe('stock idempotency helpers', () => {
  it('normalizes object key order', () => {
    expect(stockPayloadHash({ articleId: 'a', quantite: 2 })).toBe(
      stockPayloadHash({ quantite: 2, articleId: 'a' }),
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
});
