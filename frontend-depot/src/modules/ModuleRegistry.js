export const METIER_MODULES = {
  DEPOT_BOISSONS:  { key: 'DEPOT_BOISSONS',  prefix: '/depot',        label: 'Dépôt de Boissons',        icon: '🥤', color: '#2563eb' },
  BOUTIQUE:        { key: 'BOUTIQUE',        prefix: '/boutique',     label: 'Boutique',                  icon: '🏪', color: '#0891b2' },
  QUINCAILLERIE:   { key: 'QUINCAILLERIE',   prefix: '/quincaillerie',label: 'Quincaillerie',            icon: '🛠', color: '#b45309' },
  PHARMACIE:       { key: 'PHARMACIE',       prefix: '/pharmacie',    label: 'Pharmacie',                icon: '💊', color: '#059669' },
  RESTAURANT:      { key: 'RESTAURANT',      prefix: '/restaurant',   label: 'Restaurant',               icon: '🍽', color: '#dc2626' },
  TELEPHONIE:      { key: 'TELEPHONIE',      prefix: '/telephonie',   label: 'Téléphonie',               icon: '📱', color: '#7c3aed' },
  SUPERMARCHE:     { key: 'SUPERMARCHE',     prefix: '/supermarche',  label: 'Supermarché',              icon: '🛒', color: '#f59e0b' },
  CIMENT_BTP:      { key: 'CIMENT_BTP',      prefix: '/ciment-btp',   label: 'Ciment / BTP',             icon: '🏗️', color: '#b45309' },
  PRESSING:        { key: 'PRESSING',        prefix: '/pressing',     label: 'Pressing',                 icon: '👔', color: '#7c3aed' },
  GARAGE_AUTOMOBILE:{key: 'GARAGE_AUTOMOBILE',prefix: '/garage',      label: 'Garage Automobile',        icon: '🔧', color: '#f97316' },
  ELEVAGE:         { key: 'ELEVAGE',         prefix: '/elevage',      label: 'Élevage',                  icon: '🐄', color: '#65a30d' },
  SALON_BEAUTE:    { key: 'SALON_BEAUTE',    prefix: '/salon',        label: 'Salon de Coiffure / Beauté',icon: '💇', color: '#ec4899' },
  PARFUMERIE:      { key: 'PARFUMERIE',      prefix: '/parfumerie',   label: 'Parfumerie / Cosmétique',  icon: '🧴', color: '#d946ef' },
  BOULANGERIE:     { key: 'BOULANGERIE',     prefix: '/boulangerie',  label: 'Boulangerie / Pâtisserie', icon: '🥖', color: '#d97706' },
  GLACIER_SNACK:   { key: 'GLACIER_SNACK',   prefix: '/glacier',      label: 'Glacier / Snack',          icon: '🍦', color: '#06b6d4' },
  LIBRAIRIE:       { key: 'LIBRAIRIE',       prefix: '/librairie',    label: 'Librairie / Papeterie',    icon: '📚', color: '#6366f1' },
  CLINIQUE:        { key: 'CLINIQUE',        prefix: '/clinique',     label: 'Clinique / Médical',       icon: '🏥', color: '#0ea5e9' },
  TRANSPORT:       { key: 'TRANSPORT',       prefix: '/transport',    label: 'Transport / Logistique',   icon: '🚛', color: '#f97316' },
  IMMOBILIER:      { key: 'IMMOBILIER',      prefix: '/immobilier',   label: 'Gestion Immobilière',      icon: '🏠', color: '#14b8a6' },
  HOTEL:           { key: 'HOTEL',           prefix: '/hotel',        label: 'Hôtel',                    icon: '🏨', color: '#8b5cf6' },
};

export function getModule(metier) {
  return METIER_MODULES[metier] || METIER_MODULES.DEPOT_BOISSONS;
}

export function getAllModules() {
  return Object.values(METIER_MODULES);
}

export const SECTOR_PREFIX_TO_METIER = {};
for (const [key, mod] of Object.entries(METIER_MODULES)) {
  SECTOR_PREFIX_TO_METIER[mod.prefix] = key;
}
