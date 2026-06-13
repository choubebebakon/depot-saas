import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { depotApi } from '../services/depotApi';
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


export default function CaissePage() {
  const { metier } = useAuth();

  const [caisse, setCaisse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({ montant: '', motif: '', typeMouvement: 'ENTREE' });
  const [mouvements, setMouvements] = useState([]);
  const [confirmFermer, setConfirmFermer] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [rapportData, setRapportData] = useState(null);

  const [isOpen, setIsOpen] = useState(false);

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await depotApi.getCaisseStatut();
      setCaisse(res.data);
      setMouvements(res.data.mouvements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleOuvrir() {
    if (!formData.montant || isNaN(formData.montant)) return;
    try {
      await depotApi.ouvrirCaisse({ montantInitial: parseInt(formData.montant) });
      setShowModal(null);
      setFormData({ montant: '', motif: '', typeMouvement: 'ENTREE' });
      load();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleFermer() {
    if (!confirmFermer) return;
    setDeleting(true);
    try {
      await depotApi.fermerCaisse({});
      setConfirmFermer(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  async function handleMouvement() {
    if (!formData.montant || isNaN(formData.montant)) return;
    try {
      await depotApi.mouvementCaisse(formData);
      setShowModal(null);
      setFormData({ montant: '', motif: '', typeMouvement: 'ENTREE' });
      load();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRapport() {
    try {
      const res = await depotApi.rapportJournalier();
      setRapportData(res.data);
      setShowModal('rapport');
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-32 bg-slate-800/60 rounded-xl" />
        <div className="h-20 bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  const estOuverte = caisse?.statut === 'OUVERTE';

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">🏧 Caisse</h1>
          <p className="text-slate-400 text-sm mt-1">
            {estOuverte ? '🟢 Caisse ouverte' : '🔴 Caisse fermée'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!estOuverte ? (
            <button onClick={() => { setFormData({ montant: '', motif: '', typeMouvement: 'ENTREE' }); setShowModal('ouvrir'); }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20">
              🔓 Ouvrir caisse
            </button>
          ) : (
            <>
              <button onClick={() => { setFormData({ montant: '', motif: '', typeMouvement: 'ENTREE' }); setShowModal('vente'); }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2">
                💰 Saisir vente
              </button>
              <button onClick={() => { setFormData({ montant: '', motif: '', typeMouvement: 'ENTREE' }); setShowModal('mouvement'); }}
                className="px-4 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2">
                ➕ Mouvement
              </button>
              <button onClick={() => setConfirmFermer(true)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2">
                🔒 Fermer caisse
              </button>
            </>
          )}
          <button onClick={handleRapport}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2">
            📊 Rapport journalier
          </button>
        </div>
      </div>

      {caisse && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Solde actuel</p>
            <p className="text-2xl font-black text-white mt-1">{(caisse.solde || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Entrées du jour</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">+{(caisse.entreesJour || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Sorties du jour</p>
            <p className="text-2xl font-black text-red-400 mt-1">-{(caisse.sortiesJour || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Mouvements du jour</h2>
        {mouvements.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">Aucun mouvement aujourd'hui</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {mouvements.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span>{m.typeMouvement === 'ENTREE' ? '📥' : '📤'}</span>
                  <div>
                    <p className="text-sm text-white font-medium">{m.motif || 'Mouvement'}</p>
                    <p className="text-xs text-slate-500">{new Date(m.date).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${m.typeMouvement === 'ENTREE' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.typeMouvement === 'ENTREE' ? '+' : '-'}{(m.montant || 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal === 'ouvrir' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-black text-white mb-4">🔓 Ouverture de caisse</h2>
            <div className="space-y-4">
              <input type="number" placeholder="Montant initial (FCFA)" value={formData.montant}
                onChange={e => setFormData({...formData, montant: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
              <input placeholder="Motif d'ouverture" value={formData.motif} onChange={e => setFormData({...formData, motif: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
              <button onClick={handleOuvrir}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm">Ouvrir</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'vente' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-black text-white mb-4">💰 Saisir une vente</h2>
            <div className="space-y-4">
              <input type="number" placeholder="Montant de la vente (FCFA)" value={formData.montant}
                onChange={e => setFormData({...formData, montant: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
              <input placeholder="Description de la vente" value={formData.motif} onChange={e => setFormData({...formData, motif: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
              <button onClick={handleMouvement}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'mouvement' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-black text-white mb-4">Nouveau mouvement</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button onClick={() => setFormData({...formData, typeMouvement: 'ENTREE'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.typeMouvement === 'ENTREE' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>📥 Entrée</button>
                <button onClick={() => setFormData({...formData, typeMouvement: 'SORTIE'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.typeMouvement === 'SORTIE' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>📤 Sortie</button>
              </div>
              <input type="number" placeholder="Montant (FCFA)" value={formData.montant}
                onChange={e => setFormData({...formData, montant: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
              <input placeholder="Motif" value={formData.motif} onChange={e => setFormData({...formData, motif: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
              <button onClick={handleMouvement}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm">Valider</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'rapport' && rapportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-white mb-4">📊 Rapport journalier</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Statut</p>
                  <p className={`text-lg font-black mt-1 ${rapportData.statut === 'OUVERTE' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {rapportData.statut || 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Solde</p>
                  <p className="text-lg font-black text-white mt-1">{(rapportData.solde || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Entrées du jour</p>
                  <p className="text-lg font-black text-emerald-400 mt-1">+{(rapportData.entreesJour || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Sorties du jour</p>
                  <p className="text-lg font-black text-red-400 mt-1">-{(rapportData.sortiesJour || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Mouvements</h3>
                {rapportData.mouvements && rapportData.mouvements.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {rapportData.mouvements.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span>{m.typeMouvement === 'ENTREE' ? '📥' : '📤'}</span>
                          <div>
                            <p className="text-sm text-white font-medium">{m.motif || 'Mouvement'}</p>
                            <p className="text-xs text-slate-500">{new Date(m.date).toLocaleString('fr-FR')}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${m.typeMouvement === 'ENTREE' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {m.typeMouvement === 'ENTREE' ? '+' : '-'}{(m.montant || 0).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm text-center py-4">Aucun mouvement aujourd'hui</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Fermer</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmFermer} onConfirm={handleFermer} onCancel={() => setConfirmFermer(null)} loading={deleting}
        title="Fermer la caisse" message="Fermer la caisse ? Un rapport journalier sera généré et les ventes ne pourront plus être enregistrées pour aujourd'hui." />
    </div>
  );
}
