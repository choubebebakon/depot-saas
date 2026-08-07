import Icon from '../Icon';

const STATUS_MAP = {
  ACTIF: { color: 'emerald', label: 'Actif', icon: 'Check' },
  INACTIF: { color: 'red', label: 'Inactif', icon: 'X' },
  EN_ATTENTE: { color: 'amber', label: 'En attente', icon: 'Clock' },
  LIVRE: { color: 'emerald', label: 'Livré', icon: 'Package' },
  EXPEDIE: { color: 'blue', label: 'Expédié', icon: 'Truck' },
  PREPARE: { color: 'purple', label: 'Préparé', icon: 'Clipboard' },
  ANNULE: { color: 'red', label: 'Annulé', icon: 'X' },
  PAYE: { color: 'emerald', label: 'Payé', icon: 'CheckCircle' },
  IMPAYE: { color: 'red', label: 'Impayé', icon: 'XCircle' },
  REMBOURSE: { color: 'blue', label: 'Remboursé', icon: 'RefreshCw' },
  OCCUPEE: { color: 'red', label: 'Occupée', icon: 'XCircle' },
  LIBRE: { color: 'emerald', label: 'Libre', icon: 'CheckCircle' },
  HORS_SERVICE: { color: 'slate', label: 'Hors service', icon: 'Wrench' },
  EN_NETTOYAGE: { color: 'amber', label: 'En nettoyage', icon: 'Broom' },
  RESERVEE: { color: 'blue', label: 'Réservée', icon: 'Calendar' },
  EN_COURS: { color: 'blue', label: 'En cours', icon: 'Zap' },
  TERMINE: { color: 'emerald', label: 'Terminé', icon: 'CheckCircle' },
  ACCOMPLIE: { color: 'emerald', label: 'Accomplie', icon: 'CheckCircle' },
  PLANIFIEE: { color: 'purple', label: 'Planifiée', icon: 'Calendar' },
  EFFECTUEE: { color: 'emerald', label: 'Effectuée', icon: 'CheckCircle' },
  NEUF: { color: 'emerald', label: 'Neuf', icon: 'Sparkles' },
  RECONDITIONNE: { color: 'blue', label: 'Reconditionné', icon: 'RefreshCw' },
  OCCASION: { color: 'amber', label: 'Occasion', icon: 'Smartphone' },
  VENDU: { color: 'purple', label: 'Vendu', icon: 'DollarSign' },
  EN_STOCK: { color: 'emerald', label: 'En stock', icon: 'Package' },
  RUPTURE: { color: 'red', label: 'Rupture', icon: 'XCircle' },
  BLOQUE: { color: 'red', label: 'Bloqué', icon: 'Ban' },
  DISPONIBLE: { color: 'emerald', label: 'Disponible', icon: 'CheckCircle' },
  NON_DISPONIBLE: { color: 'red', label: 'Non disponible', icon: 'XCircle' },
  LIVRAISON: { color: 'blue', label: 'Livraison', icon: 'Truck' },
  A_EMPORTER: { color: 'purple', label: 'À emporter', icon: 'ShoppingBag' },
  SUR_PLACE: { color: 'emerald', label: 'Sur place', icon: 'Utensils' },
  VALIDE: { color: 'emerald', label: 'Validé', icon: 'CheckCircle' },
  REJETE: { color: 'red', label: 'Rejeté', icon: 'XCircle' },
  EN_ATTENTE_VALIDATION: { color: 'amber', label: 'En attente validation', icon: 'Clock' },
  CREE: { color: 'blue', label: 'Créé', icon: 'Plus' },
  MASCULIN: { color: 'blue', label: 'Masculin', icon: 'User' },
  FEMININ: { color: 'pink', label: 'Féminin', icon: 'User' },
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
  const config = STATUS_MAP[status?.toUpperCase()] || { color: 'slate', label: status || '—', icon: 'Circle' };
  const colorClass = COLOR_CLASSES[config.color] || COLOR_CLASSES.slate;
  const sizeClass = size === 'lg' ? 'text-xs px-3 py-1.5' : 'text-xs px-2 py-1';
  const iconSize = size === 'lg' ? 14 : 12;

  return (
    <span className={`font-bold rounded-full inline-flex items-center gap-1.5 ${sizeClass} ${colorClass} ${className}`}>
      <Icon name={config.icon} size={iconSize} />
      <span>{config.label}</span>
    </span>
  );
}
