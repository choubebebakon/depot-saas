import {
  normalizePhone,
  resolveExtraIdentifiers,
  resolveIdentifier,
} from '../crm-identifier';
import { CrmError } from '../crm-errors';

describe('normalizePhone', () => {
  it('retire les séparateurs de saisie et conserve le « + »', () => {
    expect(normalizePhone('+237 6 55-00.00')).toBe('+2376550000');
    expect(normalizePhone('(6) 55 00 00 00')).toBe('655000000');
    expect(normalizePhone('  655000000  ')).toBe('655000000');
  });
});

describe('resolveIdentifier', () => {
  it('applique la précédence documentée téléphone > Instagram > Messenger', () => {
    expect(
      resolveIdentifier({
        phoneNumber: '655000000',
        instagramId: 'ig-1',
        messengerId: 'ms-1',
      }),
    ).toEqual({ kind: 'PHONE', value: '655000000', channel: 'WHATSAPP' });

    expect(
      resolveIdentifier({ instagramId: 'ig-1', messengerId: 'ms-1' }),
    ).toEqual({ kind: 'INSTAGRAM', value: 'ig-1', channel: 'INSTAGRAM' });

    expect(resolveIdentifier({ messengerId: 'ms-1' })).toEqual({
      kind: 'MESSENGER',
      value: 'ms-1',
      channel: 'MESSENGER',
    });
  });

  it('respecte le canal déclaré par l’orchestrateur', () => {
    expect(
      resolveIdentifier({ phoneNumber: '655000000', channel: 'INSTAGRAM' })
        .channel,
    ).toBe('INSTAGRAM');
  });

  it('refuse une requête sans aucun identifiant de canal (400)', () => {
    expect(() => resolveIdentifier({})).toThrow(CrmError);
    expect(() => resolveIdentifier({ phoneNumber: '   ' })).toThrow(
      /identifiant de canal/i,
    );
  });

  it('refuse un téléphone manifestement invalide', () => {
    expect(() => resolveIdentifier({ phoneNumber: '12' })).toThrow(/invalide/i);
  });
});

describe('resolveExtraIdentifiers', () => {
  it('exclut l’identifiant principal déjà résolu', () => {
    const primary = resolveIdentifier({ phoneNumber: '655000000' });
    const extras = resolveExtraIdentifiers(
      { phoneNumber: '655000000', instagramId: 'ig-1' },
      primary,
    );

    expect(extras).toEqual([
      { kind: 'INSTAGRAM', value: 'ig-1', channel: 'INSTAGRAM' },
    ]);
  });

  it('ne renvoie rien quand aucun identifiant complémentaire n’est fourni', () => {
    const primary = resolveIdentifier({ messengerId: 'ms-1' });
    expect(resolveExtraIdentifiers({ messengerId: 'ms-1' }, primary)).toEqual([]);
  });
});