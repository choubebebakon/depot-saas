import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import { Package, CheckCircle, ChevronRight, Truck, FileText, AlertTriangle, RefreshCw } from 'lucide-react';

export default function LivraisonsPage() {
  const { tenantId } = useAuth();
  const { depotId } = useDepot();
  const queryClient = useQueryClient();
  const [selectedSale, setSelectedSale] = useState(null);
  const [step, setStep] = useState('A_PREPARER'); // A_PREPARER, HISTORIQUE

  // 1. Charger les ventes en attente de livraison
  const { data: ventesAttente = [], isLoading: loadingAttente } = useQuery({
    queryKey: ['ventes-attente', tenantId, depotId],
    queryFn: async () => {
      const res = await api.get('/ventes/validations/en-attente', { params: { tenantId, depotId } });
      return res.data;
    },
    enabled: !!tenantId && !!depotId
  });

  // 2. Charger l'historique (ventes PAYE = Livrées)
  const { data: historique = [], isLoading: loadingHist } = useQuery({
    queryKey: ['ventes-historique-livraisons', tenantId, depotId],
    queryFn: async () => {
      const res = await api.get('/ventes', { params: { tenantId, depotId, statut: 'PAYE' } });
      return res.data;
    },
    enabled: !!tenantId && !!depotId && step === 'HISTORIQUE'
  });

  // 3. Mutation pour valider la sortie (décrémenter le stock, changer statut en PAYE)
  const validerMutation = useMutation({
    mutationFn: async (id) => {
      return api.patch(`/ventes/${id}/valider-sortie`, { tenantId, depotId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventes-attente', tenantId, depotId] });
      queryClient.invalidateQueries({ queryKey: ['ventes-historique-livraisons', tenantId, depotId] });
      queryClient.invalidateQueries({ queryKey: ['stocks', tenantId, depotId] });
      queryClient.invalidateQueries({ queryKey: ['stocks-alertes', tenantId, depotId] });
      setSelectedSale(null);
    }
  });

  const handleConfirmer = () => {
    if (!selectedSale) return;
    validerMutation.mutate(selectedSale.id);
  };

  const getStatusBadge = (statut) => {
    if (statut === 'PAYE') {
      return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Livré</span>;
    }
    if (statut === 'ATTENTE') {
      return <span className="bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">À Préparer</span>;
    }
    return <span className="bg-slate-500/15 text-slate-400 border border-slate-500/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">{statut}</span>;
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Truck className="text-indigo-500" size={28} />
            Préparation des Sorties
          </h1>
          <p className="text-slate-400 text-sm mt-1">Gérez les sorties de stock pour les ventes validées par la caisse.</p>
        </div>
        <div className="flex gap-2">
           <button
             onClick={() => setStep('A_PREPARER')}
             className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${step === 'A_PREPARER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
           >
             À Préparer
             {ventesAttente.length > 0 && (
               <span className="ml-2 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{ventesAttente.length}</span>
             )}
           </button>
           <button
             onClick={() => setStep('HISTORIQUE')}
             className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${step === 'HISTORIQUE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
           >
             Historique
           </button>
        </div>
      </div>

      {/* ONGLET A PREPARER */}
      {step === 'A_PREPARER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des ventes en attente (Gauche) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={20} />
              Ventes en attente de livraison
            </h2>

            {ventesAttente.length === 0 && !loadingAttente && (
              <div className="bg-slate-800/50 p-12 rounded-3xl text-center border border-dashed border-slate-700">
                <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                <p className="text-slate-400 font-bold">Aucune vente en attente de préparation.</p>
                <p className="text-slate-500 text-sm mt-1">Toutes les sorties ont été traitées.</p>
              </div>
            )}

            {loadingAttente && (
              <div className="flex items-center justify-center p-12">
                <RefreshCw size={32} className="text-indigo-500 animate-spin" />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {ventesAttente.map(v => (
                <div
                  key={v.id}
                  onClick={() => setSelectedSale(v)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedSale?.id === v.id
                    ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div>
                    <h3 className="font-black text-white text-base">{v.reference}</h3>
                    <p className="text-slate-400 text-xs mt-1">Client : <span className="font-bold text-slate-300">{v.client?.nom || 'Client Anonyme'}</span></p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mt-2">
                      {new Date(v.date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(v.statut)}
                    {selectedSale?.id === v.id && (
                      <ChevronRight className="text-indigo-500" size={20} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panier de Livraison (Droite) */}
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 h-fit sticky top-6">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <Package className="text-indigo-500" size={24} />
              Détails de Sortie
            </h2>

            {!selectedSale ? (
              <div className="text-center py-12">
                <Truck size={48} className="mx-auto text-slate-600 mb-4 opacity-50" />
                <p className="text-slate-500 text-sm">Sélectionnez une vente pour afficher les articles à livrer.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Référence</p>
                  <p className="text-white font-bold">{selectedSale.reference}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Articles à préparer</p>
                  {selectedSale.lignes?.map(ligne => (
                    <div key={ligne.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-white text-sm font-bold truncate max-w-[200px]">{ligne.article?.designation || 'Article Inconnu'}</p>
                        {ligne.casierMixte && (
                          <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-black uppercase">Casier Mixte</span>
                        )}
                      </div>
                      <div className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg font-black">
                        x {ligne.quantite}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleConfirmer}
                  disabled={validerMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 uppercase tracking-widest text-sm mt-4"
                >
                  {validerMutation.isPending ? (
                    <><RefreshCw size={20} className="animate-spin" /> Validation...</>
                  ) : (
                    <><CheckCircle size={20} /> Confirmer la Sortie</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET HISTORIQUE */}
      {step === 'HISTORIQUE' && (
         <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
               <h2 className="text-xl font-black text-white">Historique des Livraisons</h2>
               {loadingHist && <RefreshCw size={18} className="text-indigo-400 animate-spin" />}
            </div>
            
            <div className="overflow-x-auto">
              {historique.length === 0 && !loadingHist ? (
                <div className="p-12 text-center text-slate-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-10" />
                  <p>Aucun historique de livraison disponible.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Réf. Ticket</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Client</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date Sortie</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {historique.map(v => (
                      <tr key={v.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-white text-sm">{v.reference}</td>
                        <td className="px-6 py-4 text-slate-300 text-sm">{v.client?.nom || 'Anonyme'}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {new Date(v.updatedAt || v.date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(v.statut)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
         </div>
      )}
    </div>
  );
}
