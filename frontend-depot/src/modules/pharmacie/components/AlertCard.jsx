import React from 'react';

export default function AlertCard({ medicament, niveau }) {
  const getColor = () => {
    switch (niveau) {
      case 'expire': return 'bg-red-500/10 border-red-500/30';
      case 'urgent': return 'bg-orange-500/10 border-orange-500/30';
      case 'bientot': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  const getIcon = () => {
    switch (niveau) {
      case 'expire': return '🔴';
      case 'urgent': return '🟠';
      case 'bientot': return '🟡';
      default: return '⚪';
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${getColor()}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{getIcon()}</span>
        <h3 className="text-white font-bold text-sm">{medicament.designation || medicament.nom}</h3>
      </div>
      <p className="text-slate-400 text-xs">Lot: {medicament.numeroLot || '-'}</p>
      <p className="text-slate-400 text-xs">DLC: {medicament.datePeremption ? new Date(medicament.datePeremption).toLocaleDateString('fr-FR') : '-'}</p>
      <p className="text-slate-400 text-xs">Stock: {medicament.stock || medicament.quantite || 0}</p>
    </div>
  );
}
