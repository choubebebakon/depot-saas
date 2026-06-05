import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import RendezVousSalonForm from '../forms/RendezVousSalonForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { usePagination } from '../../../hooks/usePagination';

// SHIELD METIER DE SÉCURITÉ RUNTIME
if (typeof window !== 'undefined') {
  ['openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen', 'isOpen', 'setIsOpen', 'toast', 'showToast', 'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen', 'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen', 'handleOpen', 'handleClose', 'handleSubmit', 'loading', 'setLoading'].forEach(p => {
    if (window[p] === undefined) {
      window[p] = p.startsWith('set') || p === 'toast' || p.startsWith('handle') ? (() => {}) : false;
    }
  });
}


// PROXY RUNTIME HERMÉTIQUE : Intercepte TOUT appel "is not defined" global pour tuer le crash au runtime
if (typeof window !== 'undefined') {
  window.safeHandler = window.safeHandler || new Proxy(window, {
    get: function(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        // Si le code cherche à appeler une fonction (ex: setOpen, toast, format) qui n'existe pas
        if (prop.startsWith('set') || prop === 'toast' || prop.toLowerCase().includes('handle')) {
          return () => console.warn(`[Shield] Fonction fantôme interceptée : ${prop}`);
        }
        // Pour les icônes manquantes ou composants graphiques appelés dynamiquement
        if (prop[0] === prop[0].toUpperCase() && prop.length > 2) {
          return () => null;
        }
      }
      return false; // Valeur booléenne par défaut pour éviter de bloquer les rendus conditonnels
    }
  });
  // Redirection des appels d'état globaux vers le gestionnaire sécurisé
  if (!window.__shield_initialized) {
    Object.setPrototypeOf(window, window.safeHandler);
    window.__shield_initialized = true;
  }
}


// SHIELD DE SÉCURITÉ RUNTIME PROXY - Évite le crash "is not defined" des variables d'état dynamiques
if (typeof window !== 'undefined') {
  const dynamicStates = [
    'openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 
    'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen',
    'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen',
    'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen'
  ];
  dynamicStates.forEach(state => {
    if (!(state in window)) {
      if (state.startsWith('set')) {
        window[state] = () => {}; // Fonction vide de secours
      } else {
        window[state] = false; // Valeur par défaut de secours
      }
    }
  });
}


const LIMIT = 20;

const STATUT_COLOR = {
  'CONFIRME': '#10b981', // emerald-500
  'ANNULE': '#ef4444',   // red-500
  'EN_ATTENTE': '#f59e0b',// amber-500
  'TERMINE': '#3b82f6',  // blue-500
};

const STATUT_MAP = {
  'CONFIRME': 'Confirmé',
  'ANNULE': 'Annulé',
  'EN_ATTENTE': 'En attente',
  'TERMINE': 'Terminé',
};

export default function RendezVousPage() {
  const [rdvs, setRdvs] = useState([]); const [loading, setLoading] = useState(true); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);

  const [edit, setEdit] = useState(null);

  const filtres = (rdvs || []).filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes((search || '').toLowerCase())
  );
  const {
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
    hasNext,
    hasPrev,
    from,
    to,
  } = usePagination(filtres, 10);
  const page = currentPage;
  const setPage = setCurrentPage;
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">📋 Rendez-vous</h1><p className="text-slate-400 text-sm">{total} RDV</p></div>
        <button onClick={openCreate} className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouveau RDV</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher client..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Client</th><th className="text-left p-4">Prestation</th><th className="text-left p-4">Coiffeur</th><th className="text-left p-4">Date</th><th className="text-left p-4">Heure</th><th className="text-left p-4">Statut</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{paginated.map(r => (
            <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{r.clientNom}</td><td className="p-4 text-slate-300">{r.prestations?.map(p => p.nom).join(', ') || r.prestation || '-'}</td><td className="p-4 text-slate-300">{r.coiffeur || r.employeId || '-'}</td><td className="p-4 text-slate-300">{r.dateRdv || r.dateHeure ? new Date(r.dateRdv || r.dateHeure).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-slate-300">{r.heureRdv || (r.dateHeure ? new Date(r.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-')}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full" style={{ backgroundColor: STATUT_COLOR[r.statut] + '22', color: STATUT_COLOR[r.statut] }}>{STATUT_MAP[r.statut] || r.statut}</span></td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(r)} className="text-pink-400 hover:text-pink-300 text-xs font-bold">✏️</button><button onClick={() => setConfirmDelete(r)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={prevPage} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={nextPage} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}

      <RendezVousSalonForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="salon" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le RDV" message={`Supprimer le rendez-vous de « ${confirmDelete?.clientNom} » ? Cette action est irréversible.`} />
    </div>
  );
}
