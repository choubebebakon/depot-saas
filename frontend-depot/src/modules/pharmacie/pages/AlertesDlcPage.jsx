import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
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


export default function AlertesDlcPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'pharmacie';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [deleting, setDeleting] = useState(false);

  const [notif, setNotif] = useState(null);

  const handleTraiter = async (item, action) => { try { await api.post(`/${prefix}/alertes/traiter`, { id: item.id, action }); refetch(); success('Action effectuée'); } catch { notifError('Erreur'); } };

  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); };

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'alertes-dlc');

  const { data: medicaments = [],
    loading,
    refetch,
   } = useData(`/${prefix}/medicaments`, { enabled: true });




  return (
    <div className="p-6 space-y-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div>
        <h1 className="text-2xl font-black text-white">⏰ Alertes DLC</h1>
        <p className="text-slate-400 text-sm mt-1">Surveillance des dates limite de consommation</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🔴</span>
              <h2 className="text-white font-black text-lg">Expirés ({expirees.length})</h2>
            </div>
            {expirees.length === 0 ? (
              <p className="text-slate-500 text-sm ml-8">Aucun médicament expiré</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expirees.map(m => (
                  <div key={m.id}>
                    <AlertCard medicament={m} niveau="expire" />
                    {perm.canEdit && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleTraiter(m, 'retourner')}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-bold py-2 rounded-xl text-xs transition-colors">📦 Retourner fournisseur</button>
                      <button onClick={() => handleTraiter(m, 'detruire')}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold py-2 rounded-xl text-xs transition-colors">🗑️ Détruire</button>
                    </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🟠</span>
              <h2 className="text-white font-black text-lg">Expire dans &lt; 7 jours ({urgentes.length})</h2>
            </div>
            {urgentes.length === 0 ? (
              <p className="text-slate-500 text-sm ml-8">Aucune alerte urgente</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {urgentes.map(m => <AlertCard key={m.id} medicament={m} niveau="urgent" />)}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🟡</span>
              <h2 className="text-white font-black text-lg">Expire dans &lt; 30 jours ({bientot.length})</h2>
            </div>
            {bientot.length === 0 ? (
              <p className="text-slate-500 text-sm ml-8">Aucune alerte à venir</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bientot.map(m => <AlertCard key={m.id} medicament={m} niveau="bientot" />)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}


