export const METIER_MODULES = {
  DEPOT_BOISSONS:  { key: 'DEPOT_BOISSONS',  prefix: '/depot',        label: 'Dépôt de Boissons',        icon: 'Package', color: '#2563eb' },
  BOUTIQUE:        { key: 'BOUTIQUE',        prefix: '/boutique',     label: 'Boutique',                  icon: 'ShoppingBag', color: '#0891b2' },
  QUINCAILLERIE:   { key: 'QUINCAILLERIE',   prefix: '/quincaillerie',label: 'Quincaillerie',            icon: 'Wrench', color: '#b45309' },
  PHARMACIE:       { key: 'PHARMACIE',       prefix: '/pharmacie',    label: 'Pharmacie',                icon: 'Pill', color: '#059669' },
  RESTAURANT:      { key: 'RESTAURANT',      prefix: '/restaurant',   label: 'Restaurant',               icon: 'Utensils', color: '#dc2626' },
  TELEPHONIE:      { key: 'TELEPHONIE',      prefix: '/telephonie',   label: 'Téléphonie',               icon: 'Smartphone', color: '#7c3aed' },
  SUPERMARCHE:     { key: 'SUPERMARCHE',     prefix: '/supermarche',  label: 'Supermarché',              icon: 'ShoppingCart', color: '#f59e0b' },
  CIMENT_BTP:      { key: 'CIMENT_BTP',      prefix: '/ciment-btp',   label: 'Ciment / BTP',             icon: 'HardHat', color: '#b45309' },
  PRESSING:        { key: 'PRESSING',        prefix: '/pressing',     label: 'Pressing',                 icon: 'Shirt', color: '#7c3aed' },
  GARAGE_AUTOMOBILE:{key: 'GARAGE_AUTOMOBILE',prefix: '/garage',      label: 'Garage Automobile',        icon: 'Wrench', color: '#f97316' },
  ELEVAGE:         { key: 'ELEVAGE',         prefix: '/elevage',      label: 'Élevage',                  icon: 'Tractor', color: '#65a30d' },
  SALON_BEAUTE:    { key: 'SALON_BEAUTE',    prefix: '/salon',        label: 'Salon de Coiffure / Beauté',icon: 'Scissors', color: '#ec4899' },
  PARFUMERIE:      { key: 'PARFUMERIE',      prefix: '/parfumerie',   label: 'Parfumerie / Cosmétique',  icon: 'SprayCan', color: '#d946ef' },
  BOULANGERIE:     { id: 'BOULANGERIE',     prefix: '/boulangerie',  label: 'Boulangerie / Pâtisserie', icon: 'Cookie', color: '#d97706' },
  GLACIER_SNACK:   { key: 'GLACIER_SNACK',   prefix: '/glacier',      label: 'Glacier / Snack',          icon: 'IceCream', color: '#06b6d4' },
  LIBRAIRIE:       { key: 'LIBRAIRIE',       prefix: '/librairie',    label: 'Librairie / Papeterie',    icon: 'Library', color: '#6366f1' },
  CLINIQUE:        { key: 'CLINIQUE',        prefix: '/clinique',     label: 'Clinique / Médical',       icon: 'Hospital', color: '#0ea5e9' },
  TRANSPORT:       { key: 'TRANSPORT',       prefix: '/transport',    label: 'Transport / Logistique',   icon: 'Truck', color: '#f97316' },
  IMMOBILIER:      { key: 'IMMOBILIER',      prefix: '/immobilier',   label: 'Gestion Immobilière',      icon: 'Home', color: '#14b8a6' },
  HOTEL:           { key: 'HOTEL',           prefix: '/hotel',        label: 'Hôtel',                    icon: 'Hotel', color: '#8b5cf6' },
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
