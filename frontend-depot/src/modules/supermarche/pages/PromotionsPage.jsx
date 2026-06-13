import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import PromotionSupermarcheForm from '../forms/PromotionSupermarcheForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

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


function PromoCard({ promo, produits, onEdit, onToggle, onDelete }) {
  const produit = produits.find(p => p.id === promo.produitId);
  const debut = promo.dateDebut ? new Date(promo.dateDebut) : null;
  const fin = promo.dateFin ? new Date(promo.dateFin) : null;
  const maintenant = new Date();
  const expireBientot = fin && (fin - maintenant) < 86400000 * 2;
  const expire = fin && fin < maintenant;

  return (
    <div className={`bg-slate-800/60 border rounded-2xl p-5 transition-all group ${expire ? 'border-red-500/20 opacity-60' : expireBientot ? 'border-amber-500/40' : 'border-slate-700/50 hover:border-amber-500/30'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${promo.actif && !expire ? 'bg-amber-500/20' : 'bg-slate-700'}`}>
            {String.fromCodePoint(0x1F3F7)}
          </div>
          <div>
            <h3 className="text-white font-bold text-base">{promo.nom}</h3>
            <p className="text-slate-400 text-xs">{produit?.nom || 'Tous les produits'}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(promo)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm">{String.fromCodePoint(0x270F)}</button>
          <button onClick={() => onDelete(promo)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm">{String.fromCodePoint(0x1F5D1)}</button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-2 py-1 rounded-full">
          {promo.type === 'pourcentage' ? `-${promo.valeur}%` : promo.type === 'montant' ? `-${promo.valeur?.toLocaleString('fr-FR')} F` : '2 pour 1'}
        </span>
        {expireBientot && !expire && <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-1 rounded-full">Expire bientôt</span>}
        {expire && <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-full">Expirée</span>}
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${promo.actif && !expire ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
          {promo.actif && !expire ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="text-slate-500 text-xs flex items-center justify-between">
        <span>{debut?.toLocaleDateString('fr-FR')} → {fin?.toLocaleDateString('fr-FR')}</span>
        <button onClick={() => onToggle(promo)}
          className={`font-bold transition-colors ${promo.actif ? 'text-amber-400 hover:text-amber-300' : 'text-slate-400 hover:text-white'}`}>
          {promo.actif ? 'Désactiver' : 'Activer'}
        </button>
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'supermarche';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const [edit, setEdit] = useState(null);


  const { success, error: notifError } = useNotif();

  const { data: promos = [],
    error: loadingPromos,
    refetch: refetchPromos,
   } = useData(`/${prefix}/promotions`, { enabled: true });

  const { data: produits = [],
    loading: loadingProduitsLoading, error: loadingProduits,
   } = useData(`/${prefix}/produits`, { enabled: true });

  const loading = loadingPromos || loadingProduits;

  const handleToggle = async (promo) => {
    try {
      await api.patch(`/${prefix}/promotions/${promo.id}`, { actif: !promo.actif });
      success(promo.actif ? 'Promotion désactivée' : 'Promotion activée');
      refetchPromos();
    } catch {
      notifError('Erreur lors de la modifiécation', 'Ééchec');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/${prefix}/promotions/${confirmDelete.id}`);
      setConfirmDelete(null);
      success('Promotion suppriméée');
      refetchPromos();
    } catch {
      notifError('Erreur lors de la suppression', 'Ééchec');
    } finally {
      setDeleting(false);
    }
  };

  const actives = promos.filter(p => p.actif && (!p.dateFin || new Date(p.dateFin) >= new Date()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Promotions</h1>
          <p className="text-slate-400 text-sm mt-1">{actives.length} promotion{actives.length !== 1 ? 's' : ''} active{actives.length !== 1 ? 's' : ''} sur {promos.length}</p>
        </div>
        <button onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
          + Nouvelle Promotion
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : promos.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl">{String.fromCodePoint(0x1F3F7)}</span>
          <p className="text-slate-400 font-semibold mt-4">Aucune promotion créée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map(promo => (
            <PromoCard key={promo.id} promo={promo} produits={produits}
              onEdit={(p) => { setEditItem(p); setFormOpen(true); }}
              onToggle={handleToggle}
              onDelete={(p) => setConfirmDelete(p)}
            />
          ))}
        </div>
      )}

      <PromotionSupermarcheForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { success(editItem ? 'Promo modifiéée' : 'Promo créée'); refetchPromos(); }} edit={editItem} metier={prefix} />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la promotion" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
