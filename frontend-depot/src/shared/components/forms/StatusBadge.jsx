const STATUS_MAP = {
  ACTIF: { color: 'emerald', label: 'Actif', icon: '✓' },
  INACTIF: { color: 'red', label: 'Inactif', icon: '✕' },
  EN_ATTENTE: { color: 'amber', label: 'En attente', icon: '⏳' },
  LIVRE: { color: 'emerald', label: 'Livré', icon: '📦' },
  EXPEDIE: { color: 'blue', label: 'Expédié', icon: '🚚' },
  PREPARE: { color: 'purple', label: 'Préparé', icon: '📋' },
  ANNULE: { color: 'red', label: 'Annulé', icon: '✕' },
  PAYE: { color: 'emerald', label: 'Payé', icon: '✅' },
  IMPAYE: { color: 'red', label: 'Impayé', icon: '❌' },
  REMBOURSE: { color: 'blue', label: 'Remboursé', icon: '🔄' },
  OCCUPEE: { color: 'red', label: 'Occupée', icon: '🔴' },
  LIBRE: { color: 'emerald', label: 'Libre', icon: '🟢' },
  HORS_SERVICE: { color: 'slate', label: 'Hors service', icon: '🔧' },
  EN_NETTOYAGE: { color: 'amber', label: 'En nettoyage', icon: '🧹' },
  RESERVEE: { color: 'blue', label: 'Réservée', icon: '📅' },
  EN_COURS: { color: 'blue', label: 'En cours', icon: '⚡' },
  TERMINE: { color: 'emerald', label: 'Terminé', icon: '✅' },
  ACCOMPLIE: { color: 'emerald', label: 'Accomplie', icon: '✅' },
  PLANIFIEE: { color: 'purple', label: 'Planifiée', icon: '📅' },
  EFFECTUEE: { color: 'emerald', label: 'Effectuée', icon: '✅' },
  NEUF: { color: 'emerald', label: 'Neuf', icon: '✨' },
  RECONDITIONNE: { color: 'blue', label: 'Reconditionné', icon: '🔄' },
  OCCASION: { color: 'amber', label: 'Occasion', icon: '📱' },
  VENDU: { color: 'purple', label: 'Vendu', icon: '💰' },
  EN_STOCK: { color: 'emerald', label: 'En stock', icon: '📦' },
  RUPTURE: { color: 'red', label: 'Rupture', icon: '⛔' },
  BLOQUE: { color: 'red', label: 'Bloqué', icon: '🚫' },
  DISPONIBLE: { color: 'emerald', label: 'Disponible', icon: '✅' },
  NON_DISPONIBLE: { color: 'red', label: 'Non disponible', icon: '❌' },
  LIVRAISON: { color: 'blue', label: 'Livraison', icon: '🚚' },
  A_EMPORTER: { color: 'purple', label: 'À emporter', icon: '🛍️' },
  SUR_PLACE: { color: 'emerald', label: 'Sur place', icon: '🍽️' },
  VALIDE: { color: 'emerald', label: 'Validé', icon: '✅' },
  REJETE: { color: 'red', label: 'Rejeté', icon: '❌' },
  EN_ATTENTE_VALIDATION: { color: 'amber', label: 'En attente validation', icon: '⏳' },
  CREE: { color: 'blue', label: 'Créé', icon: '🆕' },
  MASCULIN: { color: 'blue', label: 'Masculin', icon: '♂️' },
  FEMININ: { color: 'pink', label: 'Féminin', icon: '♀️' },
};

const COLOR_CLASSES = {
  emerald: 'bg-emerald-500/20 text-emerald-400',
  red: 'bg-red-500/20 text-red-400',
  amber: 'bg-amber-500/20 text-amber-400',
  blue: 'bg-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/20 text-purple-400',
  slate: 'bg-slate-700 text-slate-400',
  pink: 'bg-pink-500/20 text-pink-400',
};

export default function StatusBadge({ status, className = '', size = 'sm' }) {
  const config = STATUS_MAP[status?.toUpperCase()] || { color: 'slate', label: status || '—', icon: '●' };
  const colorClass = COLOR_CLASSES[config.color] || COLOR_CLASSES.slate;
  const sizeClass = size === 'lg' ? 'text-xs px-3 py-1.5' : 'text-xs px-2 py-1';

  return (
    <span className={`font-bold rounded-full inline-flex items-center gap-1.5 ${sizeClass} ${colorClass} ${className}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
