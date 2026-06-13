import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supermarcheApi } from '../services/supermarcheApi';
import PromotionSupermarcheForm from '../forms/PromotionSupermarcheForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

function PromoCard({ promo, articles, onEdit, onToggle, onDelete }) {
  const article = articles.find(a => a.id === promo.articleId);
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
            🏷️
          </div>
          <div>
            <h3 className="text-white font-bold text-base">{promo.nom}</h3>
            <p className="text-slate-400 text-xs">{article?.designation || 'Article non trouvé'}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(promo)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm">✏️</button>
          <button onClick={() => onDelete(promo)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm">🗑️</button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-2 py-1 rounded-full">
          {promo.type === 'POURCENTAGE' ? `-${promo.valeur}%` : promo.type === 'MONTANT_FIXE' ? `-${promo.valeur?.toLocaleString('fr-FR')} F` : promo.type === 'PRIX_FIXE' ? `${promo.valeur?.toLocaleString('fr-FR')} F` : 'Promo'}
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
  const { metier } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: promos = [], isLoading: loadingPromos } = useQuery({
    queryKey: ['supermarche-promotions'],
    queryFn: async () => {
      const r = await supermarcheApi.getPromotions();
      return r.data;
    },
  });

  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ['supermarche-articles'],
    queryFn: async () => {
      const r = await supermarcheApi.getArticles({ limit: 100 });
      return r.data?.data || r.data || [];
    },
  });

  const loading = loadingPromos || loadingArticles;

  const toggleMutation = useMutation({
    mutationFn: async (promo) => {
      const r = await supermarcheApi.updatePromotion(promo.id, { actif: !promo.actif });
      return r.data;
    },
    onSuccess: (_, promo) => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      notif.success(promo.actif ? 'Promotion désactivée' : 'Promotion activée');
    },
    onError: () => {
      notif.error('Erreur lors de la modification');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const r = await supermarcheApi.deletePromotion(id);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      notif.success('Promotion supprimée');
      setConfirmDelete(null);
    },
    onError: () => {
      notif.error('Erreur lors de la suppression');
    }
  });

  const handleToggle = (promo) => {
    toggleMutation.mutate(promo);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete.id);
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
          <span className="text-6xl">🏷️</span>
          <p className="text-slate-400 font-semibold mt-4">Aucune promotion créée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map(promo => (
            <PromoCard key={promo.id} promo={promo} articles={articles}
              onEdit={(p) => { setEditItem(p); setFormOpen(true); }}
              onToggle={handleToggle}
              onDelete={(p) => setConfirmDelete(p)}
            />
          ))}
        </div>
      )}

      <PromotionSupermarcheForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { notif.success(editItem ? 'Promo modifiée' : 'Promo créée'); }} edit={editItem} metier="supermarche" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleteMutation.isPending}
        title="Supprimer la promotion" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
