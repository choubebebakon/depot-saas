import React, { useState } from 'react';

export default function MixedCrateBuilder({ articles, crateSize, basePrice, crateName, initialComposition, onSave, onClose }) {
  const [composition, setComposition] = useState(() => {
    if (!initialComposition || !Array.isArray(initialComposition)) return {};
    const init = {};
    initialComposition.forEach(item => {
      const article = articles.find(a => a.id === item.articleId);
      if (article) {
        init[article.id] = { article, quantite: item.quantite };
      }
    });
    return init;
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [customPrices, setCustomPrices] = useState(() => {
    if (!initialComposition || !Array.isArray(initialComposition)) return {};
    const prices = {};
    initialComposition.forEach(item => {
       if (item.prixUnitaire !== undefined) {
         prices[item.articleId] = item.prixUnitaire;
       }
    });
    return prices;
  });

  const getUnitPrice = (article) => {
    if (customPrices[article.id] !== undefined) return customPrices[article.id];
    return Math.round(article.prixVente / 6); // Par défaut: Prix du Pack de 6 divisé par 6
  };

  // Filtrer uniquement les articles pertinents (on peut aussi passer une liste pré-filtrée par la vue parente)
  const availableArticles = articles.filter(a => !a.isCasierMixte);

  const totalSelected = Object.values(composition).reduce((acc, item) => acc + item.quantite, 0);
  const totalPrice = Object.values(composition).reduce((acc, item) => acc + (item.quantite * getUnitPrice(item.article)), 0);
  
  const isComplete = totalSelected > 0;

  const handleIncrement = (article) => {
    setComposition(prev => ({
      ...prev,
      [article.id]: {
        article,
        quantite: (prev[article.id]?.quantite || 0) + 1
      }
    }));
  };

  const handleRemove = (articleId) => {
    setComposition(prev => {
       const next = { ...prev };
       delete next[articleId];
       return next;
    });
  };

  const handleDecrement = (articleId) => {
    setComposition(prev => {
      const current = prev[articleId]?.quantite || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[articleId];
        return next;
      }
      return {
        ...prev,
        [articleId]: {
          ...prev[articleId],
          quantite: current - 1
        }
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isComplete) return;

    const compositionArray = Object.values(composition).map(item => ({
      articleId: item.article.id,
      designation: item.article.designation,
      quantite: item.quantite,
      prixUnitaire: getUnitPrice(item.article)
    }));

    onSave(compositionArray, totalPrice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start shrink-0 relative">
          <div>
            <h3 className="text-xl font-black text-white">Composer : {crateName}</h3>
            <p className="text-slate-400 text-sm mt-1">Sélectionnez les parfums Ã  l'intérieur du casier.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            âœ•
          </button>
        </div>

        {/* Compteur Visuel (Requirement) */}
        <div className="p-6 shrink-0 bg-slate-800/50">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-300">Composition libre</span>
            <span className="text-sm font-black text-emerald-400">
               Total : {totalSelected} bouteille{totalSelected > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Liste des parfums disponibles */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {availableArticles.map((article) => {
            const count = composition[article.id]?.quantite || 0;
            return (
              <div key={article.id} className="flex items-center justify-between bg-slate-800 border border-slate-700 p-3 rounded-xl hover:border-indigo-500/30 transition-colors">
                <div className="flex-1 pr-4">
                  <div className="flex items-baseline gap-2">
                     <p className="text-sm font-bold text-white leading-tight">{article.designation}</p>
                     <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5 mt-1">
                       <input 
                         type="number" 
                         min="0"
                         value={getUnitPrice(article)}
                         onChange={(e) => setCustomPrices(prev => ({ ...prev, [article.id]: parseInt(e.target.value) || 0 }))}
                         className="w-14 bg-transparent text-amber-400 text-xs font-bold focus:outline-none text-right"
                       />
                       <span className="text-[9px] text-slate-500 font-bold uppercase">F/btl</span>
                     </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Stock: {article.stocks?.[0]?.quantite || 0}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
                  {count > 0 && (
                    <button
                       type="button"
                       onClick={() => handleRemove(article.id)}
                       className="w-7 h-7 rounded shrink-0 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center mr-1"
                       title="Retirer l'article"
                    >
                       ðŸ—‘ï¸
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => handleDecrement(article.id)}
                    disabled={count === 0}
                    className="w-8 h-8 rounded shrink-0 bg-slate-800 text-white font-bold hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-white font-black w-6 text-center">{count}</span>
                  <button 
                    type="button"
                    onClick={() => handleIncrement(article)}
                    className="w-8 h-8 rounded shrink-0 bg-slate-800 text-white font-bold hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-800 shrink-0 bg-slate-900 rounded-b-2xl">
          <div className="flex items-center justify-between mb-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
             <span className="text-slate-400 font-bold text-sm">Total Ã  payer</span>
             <span className="text-emerald-400 font-black text-xl">{totalPrice.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <button  
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:bg-slate-700 disabled:text-slate-400 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex flex-col items-center leading-tight"
          >
            <span>Valider la composition</span>
            {!isComplete && <span className="text-[10px] font-normal mt-0.5 uppercase tracking-widest text-amber-200">Sélectionnez au moins un article</span>}
          </button>
        </div>
      </div>
    </div>
  );
}




