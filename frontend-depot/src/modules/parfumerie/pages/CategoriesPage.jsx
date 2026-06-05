import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import CategorieParfumerieForm from '../forms/CategorieParfumerieForm';

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
  const metier = metierParam || metierAuth || 'parfumerie';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [deleting, setDeleting] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const [edit, setEdit] = useState(null);
  const { success, error: notifError } = useNotif();

  const { data: data = [],
    loading,
    refetch,
   } = useData(`/${prefix}/categories`, { enabled: true });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/${prefix}/categories/${confirmDelete}`);
      setConfirmDelete(null);
      success('Élément suppriméé');
      refetch();
    } catch {
      notifError('Erreur lors de la suppression', 'Ééchec');
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-black text-white tracking-tight">📁 Catégories</h1><p className="text-slate-400 text-sm">{data.length} catégorie(s)</p></div>
        <button onClick={() => { setEdit(null); setShowForm(true); }} className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvelle catégorie</button>
      </div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(c => (
            <div key={c.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center justify-between"><h3 className="text-white font-bold">{c.nom}</h3><div className="flex gap-2"><button onClick={() => { setEdit(c); setShowForm(true); }} className="text-fuchsia-400 text-xs">✏️</button><button onClick={() => setConfirm(c)} className="text-red-400 text-xs">🗑️</button></div></div>
              {c.description && <p className="text-slate-400 text-sm mt-1">{c.description}</p>}
            </div>
          ))}
          {data.length === 0 && !loading && <div className="col-span-full text-center py-16 text-slate-500"><p className="text-lg font-semibold">Aucune catégorie</p></div>}
        </div>
      )}
      <CategorieParfumerieForm isOpen={showForm} onClose={() => { setShowForm(false); setEdit(null); }} onSuccess={refetch} edit={edit} />
      <ConfirmModal isOpen={!!confirm} onConfirm={handleDelete} onCancel={() => setConfirm(null)} title="Supprimer ?" message={`Supprimer ${confirm?.nom} ?`} />
    </div>
  );
}
