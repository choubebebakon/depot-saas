import {
  assertPatchWithinBounds,
  deepMergeMetaData,
  flattenMetaData,
  toJsonObject,
} from '../crm-deep-merge';
import { CrmError } from '../crm-errors';

/** Options par défaut : aucun tableau n'est concaténé (stratégie = remplacement). */
const replaceOptions = { appendPaths: [], maxArrayItems: 100 };
const appendOptions = { appendPaths: ['interactions'], maxArrayItems: 3 };

describe('deepMergeMetaData', () => {
  it('fusionne les objets imbriqués sans écraser les branches absentes du patch', () => {
    const base = { preferences: { couleur: 'bleu', pointure: 42 }, canal: 'WHATSAPP' };
    const patch = { preferences: { couleur: 'rouge' } };

    const { merged, appliedPaths } = deepMergeMetaData(
      base,
      patch,
      replaceOptions,
    );

    expect(merged).toEqual({
      preferences: { couleur: 'rouge', pointure: 42 },
      canal: 'WHATSAPP',
    });
    expect(appliedPaths).toContain('preferences');
  });

  it('REMPLACE un tableau par défaut (pas de croissance non bornée)', () => {
    const { merged } = deepMergeMetaData(
      { tags: ['a', 'b'] },
      { tags: ['c'] },
      replaceOptions,
    );

    expect(merged.tags).toEqual(['c']);
  });

  it('CONCATÈNE et déduplique uniquement les chemins explicitement configurés', () => {
    const { merged } = deepMergeMetaData(
      { interactions: [{ id: 1 }, { id: 2 }] },
      { interactions: [{ id: 2 }, { id: 3 }] },
      appendOptions,
    );

    expect(merged.interactions).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('tronque un tableau concaténé à maxArrayItems en conservant les plus récents', () => {
    const { merged } = deepMergeMetaData(
      { interactions: [{ id: 1 }, { id: 2 }] },
      { interactions: [{ id: 3 }, { id: 4 }] },
      { appendPaths: ['interactions'], maxArrayItems: 3 },
    );

    expect(merged.interactions).toEqual([{ id: 2 }, { id: 3 }, { id: 4 }]);
  });

  it('traite null comme une écriture explicite (JSON ne sait pas exprimer « absent »)', () => {
    const { merged } = deepMergeMetaData(
      { note: 'ancienne' },
      { note: null },
      replaceOptions,
    );

    expect(merged.note).toBeNull();
  });

  it('refuse un patch trop profond', () => {
    const tooDeep = { a: { b: { c: { d: { e: { f: 1 } } } } } };

    expect(() => assertPatchWithinBounds(tooDeep)).toThrow(CrmError);
    expect(() => assertPatchWithinBounds(tooDeep)).toThrow(/profondeur/i);
  });

  it('refuse un patch non sérialisable (BigInt) en erreur métier, pas en TypeError', () => {
    expect(() =>
      assertPatchWithinBounds({ big: BigInt(1) } as unknown as Record<
        string,
        never
      >),
    ).toThrow(/non sérialisable/i);
  });

  it('refuse un patch trop volumineux', () => {
    const huge = { blob: 'x'.repeat(33 * 1024) };

    expect(() => assertPatchWithinBounds(huge)).toThrow(/volumineux/i);
  });
});

describe('flattenMetaData', () => {
  it('aplatit le metaData en notation pointée pour le contexte du LLM', () => {
    expect(
      flattenMetaData({ preferences: { couleur: 'rouge' }, tags: ['a'] }),
    ).toEqual({ 'preferences.couleur': 'rouge', tags: '["a"]' });
  });
});

describe('toJsonObject', () => {
  it('normalise toute valeur non-objet en objet vide', () => {
    expect(toJsonObject(null)).toEqual({});
    expect(toJsonObject([1, 2])).toEqual({});
    expect(toJsonObject('texte')).toEqual({});
    expect(toJsonObject({ a: 1 })).toEqual({ a: 1 });
  });
});