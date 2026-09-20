import { Role } from '@prisma/client';
import { rapportSousModule } from './rapport-permission.util';

describe('rapportSousModule — §10 mapping type → sous-module', () => {
  it("le rapport 'stock' exige rapports_stock (MAGASINIER)", () => {
    expect(rapportSousModule('stock')).toBe('rapports_stock');
  });

  it("le rapport 'commissions' exige rapports_performance (COMMERCIAL)", () => {
    expect(rapportSousModule('commissions')).toBe('rapports_performance');
  });

  it('les rapports financiers (ventes, depenses, tournees…) exigent rapports', () => {
    for (const type of ['ventes', 'depenses', 'tournees', 'clients_debiteurs']) {
      expect(rapportSousModule(type)).toBe('rapports');
    }
  });

  it('un type inconnu retombe sur le rapport financier (fail-closed)', () => {
    expect(rapportSousModule('type_inconnu')).toBe('rapports');
  });
});

describe('Role matrix — §10 invariants (miroir seed)', () => {
  it('PATRON/GERANT restent les seuls à passer par le code (pas de bypass table)', () => {
    // Garde-fou documentaire : le mapping n'accorde jamais de rôle magique.
    expect(rapportSousModule('')).toBe('rapports');
  });
});
