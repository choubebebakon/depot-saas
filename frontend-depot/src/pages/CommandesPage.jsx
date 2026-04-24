import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import { ShoppingCart, AlertTriangle, CheckCircle, Plus, FileText, ChevronRight } from 'lucide-react';

const CommandesPage = () => {
  const { user, tenantId } = useAuth();
  const { depotId } = useDepot();
  const queryClient = useQueryClient();
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [fournisseurId, setFournisseurId] = useState('');
  const [step, setStep] = useState('SUGGESTIONS'); // SUGGESTIONS, DRAFT

  // 1. Charger les suggestions (Articles < Seuil)
  const { data: suggestions = [], isLoading: loadingSugg } = useQuery({
    queryKey: ['commandes-suggestions', tenantId, depotId],
    queryFn: async () => {
      const res = await api.get('/commandes/suggestions', { params: { tenantId, depotId } });
      return res.data;
    },
    enabled: !!tenantId && !!depotId
  });

  // 2. Charger les fournisseurs
  const { data: fournisseurs = [] } = useQuery({
    queryKey: ['fournisseurs', tenantId],
    queryFn: async () => {
      const res = await api.get(`/fournisseurs?tenantId=${tenantId}`);
      return res.data;
    },
    enabled: !!tenantId
  });

  // 3. Mutation pour créer le bon de commande
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/commandes', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes', tenantId, depotId] });
      queryClient.invalidateQueries({ queryKey: ['commandes-suggestions', tenantId, depotId] });
      alert('Bon de commande généré avec succès !');
      setStep('LIST');
      setSelectedArticles([]);
    }
  });

  const toggleArticle = (art) => {
    if (selectedArticles.find(a => a.articleId === art.articleId)) {
      setSelectedArticles(selectedArticles.filter(a => a.articleId !== art.articleId));
    } else {
      setSelectedArticles([...selectedArticles, { ...art, quantiteACommander: art.seuilCritique * 2 }]);
    }
  };

  const updateQt = (id, qt) => {
    setSelectedArticles(selectedArticles.map(a => a.articleId === id ? { ...a, quantiteACommander: Number(qt) } : a));
  };

  const handleGenerer = () => {
    if (!fournisseurId || selectedArticles.length === 0) return;
    
    const reference = `BC-${new Date().getTime()}`;
    createMutation.mutate({
      reference,
      fournisseurId,
      depotId: selectedArticles[0].depotId, // On prend le dépôt du premier article pour l'instant
      note: 'Généré automatiquement via suggestions',
      lignes: selectedArticles.map(a => ({
        articleId: a.articleId,
        quantite: a.quantiteACommander,
        prixAchatUnit: a.prixAchatEstime
      }))
    });
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Réapprovisionnement</h1>
          <p className="text-slate-400 text-sm">Gérez vos stocks critiques et générez vos bons de commande.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setStep('SUGGESTIONS')}
             className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${step === 'SUGGESTIONS' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
           >
             Suggestions
           </button>
           <button 
             onClick={() => setStep('LIST')}
             className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${step === 'LIST' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
           >
             Historique BC
           </button>
        </div>
      </div>

      {step === 'SUGGESTIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des suggestions */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={20} />
              Articles sous le seuil critique
            </h2>
            
            {suggestions.length === 0 && !loadingSugg && (
              <div className="bg-slate-800/50 p-12 rounded-3xl text-center border border-dashed border-slate-700">
                <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                <p className="text-slate-400">
                  {depotId
                    ? 'Tous vos stocks sont au-dessus de leurs seuils critiques.'
                    : 'Sélectionnez un dépôt pour afficher les suggestions.'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map(s => (
                <div 
                  key={s.articleId}
                  onClick={() => toggleArticle(s)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedArticles.find(a => a.articleId === s.articleId)
                    ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white">{s.designation}</h3>
                    {selectedArticles.find(a => a.articleId === s.articleId) && (
                      <CheckCircle className="text-indigo-500" size={18} />
                    )}
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-xs space-y-1">
                      <p className="text-slate-500 text-[10px] uppercase font-black">Stock actuel</p>
                      <p className="text-red-400 font-bold">{s.quantiteActuelle} / {s.seuilCritique}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panier de commande */}
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 h-fit sticky top-6">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <ShoppingCart className="text-indigo-500" size={24} />
              Panier de BC
            </h2>

            {selectedArticles.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Sélectionnez des articles pour générer un bon de commande.</p>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {selectedArticles.map(a => (
                    <div key={a.articleId} className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-white text-sm font-bold truncate">{a.designation}</p>
                        <p className="text-slate-500 text-[10px]">Sug: +{a.seuilCritique * 2}</p>
                      </div>
                      <input 
                        type="number"
                        value={a.quantiteACommander}
                        onChange={(e) => updateQt(a.articleId, e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-right text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-700 pt-6">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Fournisseur</label>
                  <select 
                    value={fournisseurId}
                    onChange={(e) => setFournisseurId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Choisir un fournisseur</option>
                    {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </select>
                </div>

                <button 
                  onClick={handleGenerer}
                  disabled={!fournisseurId || createMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Générer le Brouillon
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'LIST' && (
         <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
               <h2 className="text-xl font-black text-white">Bons de Commande Fournisseurs</h2>
            </div>
            {/* Liste simplifiée pour l'instant */}
            <div className="p-12 text-center text-slate-500">
               <FileText size={48} className="mx-auto mb-4 opacity-10" />
               <p>L'historique détaillé des BC sera implémenté dans la prochaine itération.</p>
               <button onClick={() => setStep('SUGGESTIONS')} className="mt-4 text-indigo-500 font-bold flex items-center justify-center gap-1 mx-auto">
                  Retour aux suggestions <ChevronRight size={16} />
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default CommandesPage;




