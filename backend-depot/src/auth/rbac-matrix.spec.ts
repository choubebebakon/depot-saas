import { Role } from '@prisma/client';
import { PermissionService } from './permission.service';
import {
  ADMINISTRATION_SUBMODULES,
  PermissionMetier,
} from './permissions.config';
import {
  PERMISSION_SEED,
  PERMISSION_SEED_INDEX,
  PermissionSeedMetier,
} from './seed-permissions.data';

/**
 * §21 — Tests de la MATRICE RBAC de référence (rôles × métiers × sous-modules)
 * exécutés sur le vrai `PermissionService`, alimenté par la matrice seedée
 * (`seed-permissions.data.ts`, la même source que `prisma/seed-permissions.ts`).
 *
 * Ils vérifient la matrice des 3 métiers prioritaires (dépôt de boissons,
 * supermarché, boutique) : le backend et le frontend (matrice miroir) restent
 * ainsi alignés sur une source unique de vérité.
 */

const METIERS: PermissionMetier[] = ['supermarche', 'boutique', 'depot'];
const OPERATIONAL_ROLES: Role[] = [
  Role.CAISSIER,
  Role.MAGASINIER,
  Role.COMMERCIAL,
  Role.COMPTABLE,
];

/** Nom du sous-module « caisse » selon le métier (§7/§8/§9). */
const CAISSE: Record<PermissionSeedMetier, string> = {
  supermarche: 'pos_caisse',
  boutique: 'caisse',
  depot: 'caisse',
};

/** Nom du sous-module « stock » selon le métier. */
const STOCK: Record<PermissionSeedMetier, string> = {
  supermarche: 'stock',
  boutique: 'stock',
  depot: 'stock_articles',
};

/** Service dont le mock Prisma reflète exactement la matrice seedée. */
function createService() {
  const prisma = {
    permission: {
      findUnique: jest.fn((args: any) => {
        const key = args?.where?.role_metier_sousModule;
        if (!key) return Promise.resolve(null);
        const row = PERMISSION_SEED_INDEX.get(
          `${key.role}|${key.metier}|${key.sousModule}`,
        );
        return Promise.resolve(
          row ? { canRead: row.canRead, canWrite: row.canWrite } : null,
        );
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    tenant: { findUnique: jest.fn().mockResolvedValue(null) },
  };

  return new PermissionService(prisma as any);
}

/** Lecture : le sous-module apparaît dans la navigation. */
async function canRead(
  service: PermissionService,
  role: string,
  metier: PermissionMetier,
  sousModule: string,
): Promise<boolean> {
  const res = await service.canAccess(role, metier, sousModule, 'read');
  return res.canRead;
}

/** Écriture : les actions de modification sont autorisées. */
async function canWrite(
  service: PermissionService,
  role: string,
  metier: PermissionMetier,
  sousModule: string,
): Promise<boolean> {
  const res = await service.canAccess(role, metier, sousModule, 'write');
  return res.canWrite;
}

describe('§21 — RBAC matrix (rôles × métiers × sous-modules)', () => {
  let service: PermissionService;

  beforeEach(() => {
    service = createService();
  });

  // ── §4/§17/§23 — administration des établissements ────────────────────────
  describe('Administration des établissements (§4/§17/§23)', () => {
    it.each(OPERATIONAL_ROLES)(
      '%s ne peut jamais administrer un établissement (tous métiers)',
      async (role) => {
        for (const metier of METIERS) {
          expect(await canRead(service, role, metier, 'depots')).toBe(false);
          expect(await canWrite(service, role, metier, 'depots')).toBe(false);
        }
      },
    );

    it('GERANT ne peut pas créer/administrer un établissement, PATRON oui', async () => {
      for (const metier of METIERS) {
        expect(await canWrite(service, Role.GERANT, metier, 'depots')).toBe(
          false,
        );
        expect(await canRead(service, Role.GERANT, metier, 'depots')).toBe(
          false,
        );
        expect(await canWrite(service, Role.PATRON, metier, 'depots')).toBe(
          true,
        );
      }
    });

    it.each(OPERATIONAL_ROLES)(
      '%s est refusé sur tous les sous-modules d’administration tenant',
      async (role) => {
        for (const metier of METIERS) {
          for (const sousModule of ADMINISTRATION_SUBMODULES) {
            expect(await canRead(service, role, metier, sousModule)).toBe(false);
            expect(await canWrite(service, role, metier, sousModule)).toBe(
              false,
            );
          }
        }
      },
    );
  });

  // ── §10/§21 — rapports granulaires ───────────────────────────────────────
  describe('Rapports granulaires (§10)', () => {
    it('CAISSIER : aucun accès aux rapports, quel que soit le métier', async () => {
      for (const metier of METIERS) {
        expect(await canRead(service, Role.CAISSIER, metier, 'rapports')).toBe(
          false,
        );
        expect(
          await canRead(service, Role.CAISSIER, metier, 'rapports_stock'),
        ).toBe(false);
        expect(
          await canRead(service, Role.CAISSIER, metier, 'rapports_performance'),
        ).toBe(false);
      }
    });

    it('MAGASINIER : rapports stock seulement (jamais financiers)', async () => {
      for (const metier of METIERS) {
        expect(
          await canRead(service, Role.MAGASINIER, metier, 'rapports_stock'),
        ).toBe(true);
        expect(await canRead(service, Role.MAGASINIER, metier, 'rapports')).toBe(
          false,
        );
        expect(
          await canRead(
            service,
            Role.MAGASINIER,
            metier,
            'rapports_performance',
          ),
        ).toBe(false);
      }
    });

    it('COMMERCIAL : « Mes performances » seulement', async () => {
      for (const metier of METIERS) {
        expect(
          await canRead(
            service,
            Role.COMMERCIAL,
            metier,
            'rapports_performance',
          ),
        ).toBe(true);
        expect(await canRead(service, Role.COMMERCIAL, metier, 'rapports')).toBe(
          false,
        );
        expect(
          await canRead(service, Role.COMMERCIAL, metier, 'rapports_stock'),
        ).toBe(false);
      }
    });

    it('COMPTABLE/GERANT/PATRON : rapports financiers autorisés (Gérant scopé établissement)', async () => {
      for (const metier of METIERS) {
        expect(await canRead(service, Role.COMPTABLE, metier, 'rapports')).toBe(
          true,
        );
        expect(await canRead(service, Role.GERANT, metier, 'rapports')).toBe(
          true,
        );
        expect(await canRead(service, Role.PATRON, metier, 'rapports')).toBe(
          true,
        );
      }
    });
  });

  // ── §21 — stock (écriture réservée aux profils habilités) ────────────────
  describe('Stock (§21)', () => {
    const WRITE_EXPECTATION: Array<[Role, boolean]> = [
      [Role.MAGASINIER, true],
      [Role.CAISSIER, false],
      [Role.COMMERCIAL, false],
      [Role.COMPTABLE, false],
    ];

    it.each(WRITE_EXPECTATION)(
      '%s : écriture stock = %s (les autres rôles restent en consultation)',
      async (role, expected) => {
        for (const metier of METIERS) {
          expect(await canWrite(service, role, metier, STOCK[metier])).toBe(
            expected,
          );
          expect(await canRead(service, role, metier, STOCK[metier])).toBe(true);
        }
      },
    );

    it('GERANT et PATRON modifient le stock de leur périmètre', async () => {
      for (const metier of METIERS) {
        expect(await canWrite(service, Role.GERANT, metier, STOCK[metier])).toBe(
          true,
        );
        expect(
          await canWrite(service, Role.PATRON, metier, STOCK[metier]),
        ).toBe(true);
      }
    });
  });

  // ── §21 — caisse (opérationnelle vs contrôle) ────────────────────────────
  describe('Caisse (§21)', () => {
    it('MAGASINIER et COMMERCIAL n’ont aucun accès à la caisse', async () => {
      for (const metier of METIERS) {
        for (const role of [Role.MAGASINIER, Role.COMMERCIAL]) {
          expect(await canRead(service, role, metier, CAISSE[metier])).toBe(
            false,
          );
          expect(await canWrite(service, role, metier, CAISSE[metier])).toBe(
            false,
          );
        }
      }
    });

    it('CAISSIER et GERANT opèrent la caisse', async () => {
      for (const metier of METIERS) {
        for (const role of [Role.CAISSIER, Role.GERANT]) {
          expect(await canRead(service, role, metier, CAISSE[metier])).toBe(
            true,
          );
          expect(await canWrite(service, role, metier, CAISSE[metier])).toBe(
            true,
          );
        }
      }
    });

    it('COMPTABLE : consultation/contrôle de la caisse sans opération', async () => {
      for (const metier of METIERS) {
        expect(await canRead(service, Role.COMPTABLE, metier, CAISSE[metier])).toBe(
          true,
        );
        expect(
          await canWrite(service, Role.COMPTABLE, metier, CAISSE[metier]),
        ).toBe(false);
      }
    });
  });

  // ── §11 — invariants de la matrice (aucune autorisation excessive) ───────
  describe('Invariants de la matrice seedée (§11/§23)', () => {
    it('ne contient aucun doublon role × metier × sousModule', () => {
      const keys = PERMISSION_SEED.map(
        (row) => `${row.role}|${row.metier}|${row.sousModule}`,
      );
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('accorde le dashboard à chaque role × metier seedé', () => {
      const trios = new Set(
        PERMISSION_SEED.map((row) => `${row.role}|${row.metier}`),
      );
      for (const trio of trios) {
        expect(PERMISSION_SEED_INDEX.get(`${trio}|dashboard`)?.canRead).toBe(
          true,
        );
      }
    });

    it('n’accorde jamais un sous-module d’administration tenant à un rôle opérationnel', () => {
      const offenders = PERMISSION_SEED.filter(
        (row) =>
          ADMINISTRATION_SUBMODULES.has(row.sousModule) &&
          (row.canRead || row.canWrite),
      );
      expect(offenders).toEqual([]);
    });

    it('ne référence que les 3 métiers priorisés et les 4 rôles opérationnels', () => {
      for (const row of PERMISSION_SEED) {
        expect(METIERS).toContain(row.metier);
        expect(OPERATIONAL_ROLES).toContain(row.role);
      }
    });
  });
});
