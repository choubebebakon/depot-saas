import { decodeHistoryCursor, encodeHistoryCursor } from '../crm-cursor';
import { CrmError } from '../crm-errors';

describe('crm-cursor', () => {
  it('encode et décode un curseur de façon symétrique', () => {
    const cursor = { date: '2026-09-16T10:00:00.000Z', id: 'vente-1' };

    expect(decodeHistoryCursor(encodeHistoryCursor(cursor))).toEqual(cursor);
  });

  it('produit un curseur opaque (aucun identifiant en clair)', () => {
    const encoded = encodeHistoryCursor({
      date: '2026-09-16T10:00:00.000Z',
      id: 'vente-1',
    });

    expect(encoded).not.toContain('vente-1');
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('refuse un curseur vide ou illisible', () => {
    expect(() => decodeHistoryCursor('')).toThrow(CrmError);
    expect(() => decodeHistoryCursor('   ')).toThrow(CrmError);
    expect(() =>
      decodeHistoryCursor(Buffer.from('pas-du-json').toString('base64url')),
    ).toThrow(CrmError);
  });

  it('refuse un curseur incomplet ou dont la date est invalide', () => {
    const incomplete = Buffer.from(JSON.stringify({ d: 'x' }), 'utf8').toString(
      'base64url',
    );
    const badDate = Buffer.from(
      JSON.stringify({ d: 'pas-une-date', i: 'vente-1' }),
      'utf8',
    ).toString('base64url');

    expect(() => decodeHistoryCursor(incomplete)).toThrow(/incomplet/i);
    expect(() => decodeHistoryCursor(badDate)).toThrow(/date invalide/i);
  });

  it('refuse un curseur anormalement long (anti-abus)', () => {
    expect(() => decodeHistoryCursor('a'.repeat(300))).toThrow(CrmError);
  });
});