import React, { useState } from 'react';
import { Package, Hash, MessageSquare, Save, X } from 'lucide-react';

const AjustementStockModal = ({ isOpen, onClose, onSubmit, article }) => {
  const [nouvelleQuantite, setNouvelleQuantite] = useState(article?.quantite || 0);
  const [motif, setMotif] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-indigo-600" size={24} />
            Ajustement d'Inventaire
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">
              ðŸ“¦
            </div>
            <div>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Article</p>
              <h3 className="text-indigo-900 font-bold">{article?.article?.designation}</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                <Hash size={14} /> Nouvelle Quantité
              </label>
              <input
                type="number"
                value={nouvelleQuantite}
                onChange={(e) => setNouvelleQuantite(Number(e.target.value))}
                className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder="Ex: 10"
              />
              <p className="text-[10px] text-slate-400 mt-1 italic">
                Ancienne quantité : {article?.quantite} (Différence : {nouvelleQuantite - article?.quantite})
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                <MessageSquare size={14} /> Motif de l'ajustement
              </label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none min-h-[100px]"
                placeholder="Pourquoi ajustez-vous ce stock ? (ex: Erreur livraison, inventaire physique...)"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all"
          >
            Annuler
          </button>
          <button 
            onClick={() => onSubmit({ articleId: article.articleId, nouvelleQuantite, motif })}
            disabled={!motif}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Valider
          </button>
        </div>
      </div>
    </div>
  );
};

export default AjustementStockModal;




