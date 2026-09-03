/** Matrice miroir du seed backend — fallback UX si /auth/permissions indisponible. */
export const ROLE_LABELS_BY_METIER = {
  supermarche: {
    MAGASINIER: 'Rayonniste',
    CAISSIER: 'Caissier(ère)',
    COMPTABLE: 'Comptable',
    COMMERCIAL: 'Commercial',
    PATRON: 'Patron',
    GERANT: 'Gérant',
  },
  boutique: {
    MAGASINIER: 'Vendeur',
    CAISSIER: 'Caissier(ère)',
    COMPTABLE: 'Comptable',
    COMMERCIAL: 'Commercial',
    PATRON: 'Patron',
    GERANT: 'Gérant',
  },
  depot: {
    MAGASINIER: 'Magasinier / Livreur',
    CAISSIER: 'Caissier(ère)',
    COMPTABLE: 'Comptable',
    COMMERCIAL: 'Commercial',
    PATRON: 'Patron',
    GERANT: 'Gérant',
  },
};

export const ADMINISTRATION_SUBMODULES = new Set([
  'utilisateurs',
  'depots',
  'abonnement',
  'parametres',
  'administration',
]);

/** Allow-list explicite (identique à prisma/seed-permissions.ts). */
export const PERMISSION_MATRIX = {
  supermarche: {
    MAGASINIER: {
      dashboard: { canRead: true, canWrite: false },
      stock: { canRead: true, canWrite: true },
      rayons: { canRead: true, canWrite: true },
      fournisseurs: { canRead: true, canWrite: false },
      receptions: { canRead: true, canWrite: true },
      inventaire: { canRead: true, canWrite: true },
    },
    CAISSIER: {
      dashboard: { canRead: true, canWrite: false },
      pos_caisse: { canRead: true, canWrite: true },
      clients: { canRead: true, canWrite: false },
    },
    COMPTABLE: {
      dashboard: { canRead: true, canWrite: false },
      stock: { canRead: true, canWrite: false },
      fournisseurs: { canRead: true, canWrite: true },
      receptions: { canRead: true, canWrite: false },
      inventaire: { canRead: true, canWrite: false },
      depenses: { canRead: true, canWrite: true },
      rapports: { canRead: true, canWrite: true },
    },
    COMMERCIAL: {
      dashboard: { canRead: true, canWrite: false },
      promotions: { canRead: true, canWrite: true },
      clients: { canRead: true, canWrite: true },
      rapports: { canRead: true, canWrite: false },
    },
  },
  boutique: {
    MAGASINIER: {
      dashboard: { canRead: true, canWrite: false },
      ventes: { canRead: true, canWrite: true },
      stock: { canRead: true, canWrite: true },
      inventaire: { canRead: true, canWrite: true },
      clients: { canRead: true, canWrite: false },
      categories: { canRead: true, canWrite: true },
    },
    CAISSIER: {
      dashboard: { canRead: true, canWrite: false },
      ventes: { canRead: true, canWrite: true },
      clients: { canRead: true, canWrite: false },
      caisse: { canRead: true, canWrite: true },
      factures: { canRead: true, canWrite: false },
    },
    COMPTABLE: {
      dashboard: { canRead: true, canWrite: false },
      stock: { canRead: true, canWrite: false },
      inventaire: { canRead: true, canWrite: false },
      factures: { canRead: true, canWrite: true },
      fournisseurs: { canRead: true, canWrite: true },
      depenses: { canRead: true, canWrite: true },
      rapports: { canRead: true, canWrite: true },
    },
    COMMERCIAL: {
      dashboard: { canRead: true, canWrite: false },
      ventes: { canRead: true, canWrite: false },
      clients: { canRead: true, canWrite: true },
      promotions: { canRead: true, canWrite: true },
      rapports: { canRead: true, canWrite: false },
    },
  },
  depot: {
    MAGASINIER: {
      dashboard: { canRead: true, canWrite: false },
      stock_articles: { canRead: true, canWrite: true },
      inventaire: { canRead: true, canWrite: true },
      consignes: { canRead: true, canWrite: true },
      livraisons: { canRead: true, canWrite: true },
      tournees: { canRead: true, canWrite: true },
      fournisseurs: { canRead: true, canWrite: false },
    },
    CAISSIER: {
      dashboard: { canRead: true, canWrite: false },
      consignes: { canRead: true, canWrite: false },
      clients: { canRead: true, canWrite: false },
      ventes: { canRead: true, canWrite: true },
      caisse: { canRead: true, canWrite: true },
    },
    COMPTABLE: {
      dashboard: { canRead: true, canWrite: false },
      stock_articles: { canRead: true, canWrite: false },
      inventaire: { canRead: true, canWrite: false },
      consignes: { canRead: true, canWrite: false },
      fournisseurs: { canRead: true, canWrite: true },
      depenses: { canRead: true, canWrite: true },
      rapports: { canRead: true, canWrite: true },
    },
    COMMERCIAL: {
      dashboard: { canRead: true, canWrite: false },
      clients: { canRead: true, canWrite: true },
      ventes: { canRead: true, canWrite: false },
      rapports: { canRead: true, canWrite: false },
    },
  },
};

export function normalizeMetierSlug(raw) {
  if (!raw) return null;
  const value = String(raw).toLowerCase().replace(/_/g, '-');
  if (value === 'supermarche') return 'supermarche';
  if (value === 'boutique') return 'boutique';
  if (value === 'depot' || value === 'depot-boissons') return 'depot';
  return null;
}

export function normalizeSousModule(raw) {
  return String(raw || '').replace(/-/g, '_');
}

export function roleLabel(role, metier) {
  const slug = normalizeMetierSlug(metier) || 'depot';
  return ROLE_LABELS_BY_METIER[slug]?.[role] || role;
}

/**
 * Résout canRead/canWrite (même règles que PermissionService backend).
 * `apiState` optionnel : réponse de GET /auth/permissions.
 */
export function resolvePermission(role, metier, sousModuleRaw, apiState = null) {
  const sousModule = normalizeSousModule(sousModuleRaw);
  const slug = normalizeMetierSlug(metier);
  const libellePoste = roleLabel(role, slug || metier);

  if (!role || !slug) {
    return {
      canRead: false,
      canWrite: false,
      libelleRoleAutorise: 'Patron ou Gérant',
      libellePoste,
    };
  }

  if (role === 'PATRON') {
    return {
      canRead: true,
      canWrite: true,
      libelleRoleAutorise: libellePoste,
      libellePoste,
    };
  }

  if (role === 'GERANT') {
    const allowed = sousModule !== 'audit_patron';
    return {
      canRead: allowed,
      canWrite: allowed,
      libelleRoleAutorise: roleLabel('PATRON', slug),
      libellePoste,
    };
  }

  if (ADMINISTRATION_SUBMODULES.has(sousModule)) {
    return {
      canRead: false,
      canWrite: false,
      libelleRoleAutorise: 'Patron ou Gérant',
      libellePoste,
    };
  }

  if (apiState && !apiState.fullAccess) {
    const row = apiState.permissions?.[sousModule];
    return {
      canRead: !!row?.canRead,
      canWrite: !!row?.canWrite,
      libelleRoleAutorise: authorizedLabelFromMatrix(slug, sousModule),
      libellePoste: apiState.libellePoste || libellePoste,
    };
  }

  const row = PERMISSION_MATRIX[slug]?.[role]?.[sousModule];
  return {
    canRead: !!row?.canRead,
    canWrite: !!row?.canWrite,
    libelleRoleAutorise: authorizedLabelFromMatrix(slug, sousModule),
    libellePoste,
  };
}

function authorizedLabelFromMatrix(metier, sousModule) {
  if (sousModule === 'audit_patron') return roleLabel('PATRON', metier);
  if (ADMINISTRATION_SUBMODULES.has(sousModule)) return 'Patron ou Gérant';

  const labels = new Set();
  const byRole = PERMISSION_MATRIX[metier] || {};
  for (const [role, modules] of Object.entries(byRole)) {
    const row = modules[sousModule];
    if (row?.canRead || row?.canWrite) {
      labels.add(roleLabel(role, metier));
    }
  }
  return labels.size > 0 ? [...labels].join(' ou ') : 'Patron ou Gérant';
}

/** Extrait le slug sous-module depuis un path de menu (ex: /boutique/stock → stock). */
export function pathToSousModule(path, metierSlug) {
  if (!path) return null;
  const clean = String(path).split('?')[0].replace(/\/+$/, '');
  const parts = clean.split('/').filter(Boolean);
  let segment = parts[parts.length - 1] || '';

  const prefixes = new Set([
    'boutique',
    'supermarche',
    'depot',
    'depot-boissons',
    metierSlug,
  ].filter(Boolean));

  if (prefixes.has(segment) && parts.length >= 2) {
    segment = parts[parts.length - 1];
  }

  const aliases = {
    pos: 'pos_caisse',
    'pos-caisse': 'pos_caisse',
    'audit-patron': 'audit_patron',
    articles: metierSlug === 'depot' ? 'stock_articles' : 'stock',
    stock: metierSlug === 'depot' ? 'stock_articles' : 'stock',
  };

  const key = aliases[segment] || normalizeSousModule(segment);
  return key;
}
