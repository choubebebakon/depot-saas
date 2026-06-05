export function formatCFA(montant) {
  if (montant === null || montant === undefined) return '0 F';
  return `${Number(montant).toLocaleString('fr-FR')} F`;
}

export function formatDate(date, options = {}) {
  if (!date) return '—';
  const d = new Date(date);
  const opts = { day: 'numeric', month: 'short', year: 'numeric', ...options };
  return d.toLocaleDateString('fr-FR', opts);
}

export function formatDateTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatRelative(date) {
  if (!date) return '—';
  const now = new Date();
  const d = new Date(date);
  const diff = d - now;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor(abs / 3600000);

  if (diff < 0) {
    if (days === 0) return hours === 0 ? "À l'instant" : `Il y a ${hours}h`;
    if (days === 1) return 'Hier';
    return `Il y a ${days} jours`;
  }
  if (days === 0) return hours === 0 ? "Dans quelques instants" : `Dans ${hours}h`;
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
}

export function formatPourcentage(valeur, total) {
  if (!total || total === 0) return '0%';
  return `${((valeur / total) * 100).toFixed(1)}%`;
}

export function formatTel(telephone) {
  if (!telephone) return '—';
  return telephone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
}
