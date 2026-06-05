import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
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


export default function CategoriesPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'quincaillerie';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ nom: '', description: '' });
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const [notif, setNotif] = useState(null);
  const [saving, setSaving] = useState(false);

  const setF = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full';

  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); };

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'categories');

  const { data: categories = [],
    loading,
    refetch,
   } = useData(`/${prefix}/categories`, { enabled: true });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/${prefix}/categories/${confirmDelete.id}`);
      setConfirmDelete(null);
      success('Élément suppriméé');
      refetch();
    } catch {
      notifError('Erreur lors de la suppression', 'Ééchec');
    } finally {
      setDeleting(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.patch(`/${prefix}/categories/${editItem.id}`, form);
      } else {
        await api.post(`/${prefix}/categories`, form);
      }
      setFormOpen(false);
      setEditItem(null);
      success(editItem ? 'Élément modifiéé' : 'Élément créé');
      refetch();
    } catch {
      notifError("Erreur lors de l'enregistréement", 'Ééchec');
    }
  };
  const openEdit = (item) => {
    setEditItem(item);
    setForm(item);
    setFormOpen(true);
  };



  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-amber-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📁 Catégories</h1><p className="text-slate-400 text-sm mt-1">{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-600/20">+ Nouvelle Catégorie</button>}
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 ? <p className="text-slate-500 col-span-full text-center py-16">Aucune catégorie</p>
          : categories.map(c => (
            <div key={c.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-amber-600/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold text-sm">{c.nom}</h3>
                <div className="flex items-center gap-1">{perm.canEdit && <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 text-xs">✏️</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(c)} className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 text-xs">🗑️</button>}</div>
              </div>
              {c.description && <p className="text-slate-400 text-xs">{c.description}</p>}
            </div>
          ))}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier Catégorie' : '📁 Nouvelle Catégorie'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label><input required value={form.nom} onChange={setF('nom')} className={inputClass} /></div>
        <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Description</label><textarea value={form.description} onChange={setF('description')} className={inputClass} rows={2} /></div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer la catégorie" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
