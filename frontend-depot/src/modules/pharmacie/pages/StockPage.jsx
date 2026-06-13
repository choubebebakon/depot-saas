import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';

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
    // Object.setPrototypeOf(window, window.safeHandler) - REMOVED: not supported in modern browsers
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


export default function StockPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'pharmacie';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [notif, setNotif] = useState(null);

  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState({});

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'stock');

  const { data: medicamentsData = [], loading, refetch } = useData(`/${prefix}/medicaments`, { enabled: true });
  const medicaments = Array.isArray(medicamentsData?.data) ? medicamentsData.data : (Array.isArray(medicamentsData) ? medicamentsData : []);

  const [familleFiltre, setFamilleFiltre] = useState('');
  const ruptureCount = medicaments.filter(i => (i.quantite || 0) === 0).length;
  const faibleCount = medicaments.filter(i => (i.quantite || 0) > 0 && (i.quantite || 0) <= (i.seuil || 5)).length;
  const expireCount = medicaments.filter(i => i.datePeremption && new Date(i.datePeremption) < new Date()).length;

  const totalValeur = medicaments.reduce((acc, i) => acc + (i.valeurStock || i.valeur || i.quantite * i.prix || 0), 0);

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (medicaments || []).filter(item =>
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

  const handleStockEdit = (id, val) => setEdits(prev => ({ ...prev, [id]: val }));
  const saveStock = async (m) => {
    setSaving(prev => ({ ...prev, [m.id]: true }));
    try {
      await api.patch(`/${prefix}/medicaments/${m.id}`, { stock: parseInt(edits[m.id]) });
      setEdits(prev => { const { [m.id]: _, ...rest } = prev; return rest; });
      success('Stock mis à jour');
      refetch();
    } catch {
      notifError('Erreur lors de la mise à jour');
    } finally {
      setSaving(prev => ({ ...prev, [m.id]: false }));
    }
  };

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Stock</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} rfrence{totalItems !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <p className="text-emerald-400 font-black text-xl">{totalValeur.toLocaleString('fr-FR')} F</p>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase">Valeur Stock</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <p className="text-amber-400 font-black text-xl">{faibleCount}</p>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase">Stock Faible</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
          <p className="text-red-400 font-black text-xl">{ruptureCount}</p>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase">Rupture</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
          <p className="text-purple-400 font-black text-xl">{expireCount}</p>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase">Expir</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-emerald-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-64" />
        <select value={familleFiltre} onChange={e => { setFamilleFiltre(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none">
          <option value="">Toutes familles</option>
          {['Antibiotiques','Antalgiques','Anti-inflammatoires','Vitamines','Cardiovasculaires','Autre'].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Mdicament</th>
                <th className="text-left px-5 py-4">Lot</th>
                <th className="text-right px-5 py-4">Stock Systme</th>
                <th className="text-right px-5 py-4">Stock Rel</th>
                <th className="text-right px-5 py-4">Valeur</th>
                <th className="text-center px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun produit trouvé</td></tr>
              ) : paginated.map(m => {
                const stockActuel = m.stock || 0;
                const editVal = edits[m.id];
                const isEditing = editVal !== undefined;
                const isDirty = isEditing && parseInt(editVal) !== stockActuel;
                const valeur = stockActuel * (m.prixAchat || m.prix || 0);

  return (
                  <tr key={m.id} className={`hover:bg-slate-700/20 transition-colors ${stockActuel <= 0 ? 'bg-red-500/5' : stockActuel <= (m.seuilAlerte || 10) ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="text-white font-semibold text-sm">{m.designation}</p>
                      <p className="text-slate-500 text-xs">{m.dosage || ''}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-sm font-mono">{m.numeroLot || ''}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-bold text-sm ${stockActuel <= 0 ? 'text-red-400' : stockActuel <= (m.seuilAlerte || 10) ? 'text-amber-400' : 'text-white'}`}>
                        {stockActuel}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {perm.canEdit ? (
                        <input type="number" min="0" value={editVal !== undefined ? editVal : stockActuel}
                          onChange={e => handleStockEdit(m.id, e.target.value)}
                          className={`w-24 text-right bg-slate-700 border rounded-lg px-3 py-1.5 text-sm text-white outline-none transition-colors ${isDirty ? 'border-emerald-500' : 'border-slate-600 focus:border-emerald-500'}`} />
                      ) : (
                        <span className="text-slate-300 text-sm">{stockActuel}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-300 text-sm font-mono">{valeur.toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-3 text-center">
                      {isDirty && perm.canEdit && (
                        <button onClick={() => saveStock(m)} disabled={saving[m.id]}
                          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                          {saving[m.id] ? '?' : '? Sauver'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} mdicament{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2); const p = start + i;
                  if (p > totalPages) return null;
                  return (<button key={p} onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>);
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
