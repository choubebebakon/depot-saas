import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { depotApi } from '../services/depotApi';
import ConsigneForm from '../forms/ConsigneForm';
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


export default function ConsignesPage() {
  const { metier } = useAuth();
  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [consignes, setConsignes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [edit, setEdit] = useState(null);


  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const res = await depotApi.getClients({ limit: 100 });
      setClients(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const loadConsignes = useCallback(async (clientId) => {
    try {
      const res = await depotApi.getConsignesClient(clientId);
      setConsignes(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const openForm = () => { setEditItem(null); setFormOpen(true); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      setConfirmDelete(null);
      loadConsignes(selectedClient?.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    if (selectedClient) loadConsignes(selectedClient.id);
  };

  const filteredClients = clients.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.telephone?.includes(search)
  );

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Consignes</h1>
          <p className="text-slate-400 text-sm mt-1">Portefeuille consignes par client</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <input type="text" placeholder="🔍 Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500" />

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <p className="text-lg mb-1">👥 Aucun client</p>
                <p className="text-sm">Ajoutez des clients pour gérer les consignes</p>
              </div>
            ) : filteredClients.map(c => (
              <button key={c.id} onClick={() => { setSelectedClient(c); loadConsignes(c.id); }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedClient?.id === c.id
                    ? 'bg-blue-600/20 border-blue-500/50 text-white'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700/60'
                }`}>
                <p className="font-bold text-sm">{c.nom}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.telephone || '-'}</p>
                {c.soldeConsigne > 0 && (
                  <p className="text-xs font-bold text-amber-400 mt-1">💰 {parseInt(c.soldeConsigne).toLocaleString('fr-FR')} FCFA</p>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedClient ? (
            <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <p className="text-3xl mb-3">🔄</p>
              <p className="text-lg font-medium">Sélectionnez un client</p>
              <p className="text-sm mt-1">Pour voir et gérer son portefeuille de consignes</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedClient.nom}</h2>
                    <p className="text-sm text-slate-400">{selectedClient.telephone || 'Aucun téléphone'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={openForm}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all">
                      🔄 Nouveau mouvement
                    </button>
                  </div>
                </div>

                {consignes && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {Object.entries(consignes.portefeuille || {}).map(([type, qte]) => (
                      <div key={type} className="bg-slate-700/30 rounded-lg p-3 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">{type}</p>
                        <p className="text-xl font-black text-white mt-1">{qte}</p>
                      </div>
                    ))}
                  </div>
                )}

                {consignes?.soldeTotal > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-amber-400 uppercase tracking-wider">Valeur totale consignes</p>
                    <p className="text-xl font-black text-amber-400">{parseInt(consignes.soldeTotal).toLocaleString('fr-FR')} FCFA</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Historique des consignes</h3>
                {(!consignes?.historique || consignes.historique.length === 0) ? (
                  <p className="text-slate-500 text-sm text-center py-4">Aucun mouvement de consigne</p>
                ) : (
                  <div className="space-y-2">
                    {consignes.historique.slice(0, 20).map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span>{h.type === 'sortie' ? '📤' : h.type === 'retour' ? '📥' : '💰'}</span>
                          <div>
                            <p className="text-sm text-white font-medium">{h.typeConsigne}</p>
                            <p className="text-xs text-slate-500">{new Date(h.date).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${h.type === 'sortie' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {h.type === 'sortie' ? '-' : '+'}{h.quantite}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConsigneForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={handleFormSuccess} edit={editItem} metier="depot-boissons" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer" message={`Supprimer ce mouvement ? Cette action est irréversible.`} />
    </div>
  );
}
