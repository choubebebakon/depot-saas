import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Calendar, AlertTriangle, Plus, Edit, Trash2, X, RefreshCw } from 'lucide-react';
import api from '../../../api/axios';
import FormModal from '../forms/FormModal';
import FormField from '../forms/FormField';

export default function LotStockManager({ articleId, depotId, tenantId }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [formData, setFormData] = useState({
    quantite: '',
    dlc: '',
    numeroLot: '',
  });

  const { data: lots, isLoading, refetch } = useQuery({
    queryKey: ['lots', articleId, depotId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (articleId) params.append('articleId', articleId);
      if (depotId) params.append('depotId', depotId);
      params.append('tenantId', tenantId);
      
      const res = await api.get(`/stocks/lots?${params.toString()}`);
      return res.data;
    },
    enabled: !!tenantId,
  });

  const { data: alertes } = useQuery({
    queryKey: ['lots-alertes', depotId, tenantId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('tenantId', tenantId);
      if (depotId) params.append('depotId', depotId);
      
      const res = await api.get(`/stocks/lots/alertes-dlc?${params.toString()}`);
      return res.data;
    },
    enabled: !!tenantId,
  });

  const createLotMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/stocks/lots', { ...data, tenantId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lots']);
      setIsModalOpen(false);
      setFormData({ quantite: '', dlc: '', numeroLot: '' });
    },
  });

  const updateLotMutation = useMutation({
    mutationFn: async ({ lotId, data }) => {
      const params = new URLSearchParams();
      params.append('tenantId', tenantId);
      const res = await api.put(`/stocks/lots/${lotId}?${params.toString()}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lots']);
      setIsModalOpen(false);
      setEditingLot(null);
    },
  });

  const deleteLotMutation = useMutation({
    mutationFn: async (lotId) => {
      const params = new URLSearchParams();
      params.append('tenantId', tenantId);
      const res = await api.delete(`/stocks/lots/${lotId}?${params.toString()}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lots']);
    },
  });

  const handleCreate = () => {
    setEditingLot(null);
    setFormData({ quantite: '', dlc: '', numeroLot: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (lot) => {
    setEditingLot(lot);
    setFormData({
      quantite: lot.quantite,
      dlc: lot.dlc ? lot.dlc.split('T')[0] : '',
      numeroLot: lot.numeroLot || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      articleId,
      depotId,
      quantite: parseInt(formData.quantite),
      dlc: formData.dlc ? new Date(formData.dlc).toISOString() : null,
      numeroLot: formData.numeroLot || null,
    };

    if (editingLot) {
      updateLotMutation.mutate({ lotId: editingLot.id, data });
    } else {
      createLotMutation.mutate(data);
    }
  };

  const handleDelete = (lotId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lot ? Cela réduira le stock global.')) {
      deleteLotMutation.mutate(lotId);
    }
  };

  const getUrgenceColor = (urgence) => {
    switch (urgence) {
      case 'PERIME': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'URGENT': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'BIENTOT': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {/* Alertes DLC */}
      {alertes && alertes.total > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={20} className="text-red-400" />
            <h3 className="text-white font-bold">Alertes DLC ({alertes.total})</h3>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-red-400 font-bold">Périmés: {alertes.perimes}</span>
            <span className="text-orange-400 font-bold">Urgents (< 7j): {alertes.urgent}</span>
            <span className="text-yellow-400 font-bold">Bientôt: {alertes.bientot}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package size={24} className="text-indigo-400" />
          <h2 className="text-xl font-black text-white">Gestion des Lots</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Nouveau Lot
          </button>
        </div>
      </div>

      {/* Liste des lots */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lots && lots.length > 0 ? (
        <div className="space-y-3">
          {lots.map((lot) => (
            <div
              key={lot.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-bold">{lot.numeroLot || `Lot ${lot.id.slice(0, 8)}`}</span>
                    {lot.dlc && (
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getUrgenceColor(lot.urgence || 'BIENTOT')}`}>
                        {lot.urgence || 'BIENTOT'}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Quantité:</span>
                      <span className="text-white font-semibold ml-2">{lot.quantite}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-slate-400">DLC:</span>
                      <span className="text-white font-semibold">{formatDate(lot.dlc)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Initial:</span>
                      <span className="text-white font-semibold ml-2">{lot.quantiteInitiale}</span>
                    </div>
                  </div>
                  {lot.dlc && lot.joursRestants !== null && (
                    <div className="mt-2 text-xs">
                      <span className="text-slate-400">Jours restants:</span>
                      <span className={`font-semibold ml-2 ${lot.joursRestants < 0 ? 'text-red-400' : lot.joursRestants <= 7 ? 'text-orange-400' : 'text-green-400'}`}>
                        {lot.joursRestants}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(lot)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(lot.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-semibold">Aucun lot configuré</p>
          <p className="text-sm mt-1">Créez votre premier lot pour suivre les DLC</p>
        </div>
      )}

      {/* Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLot(null);
          setFormData({ quantite: '', dlc: '', numeroLot: '' });
        }}
        onSubmit={handleSubmit}
        title={editingLot ? 'Modifier le Lot' : 'Nouveau Lot'}
        loading={createLotMutation.isLoading || updateLotMutation.isLoading}
        submitLabel={editingLot ? 'Mettre à jour' : 'Créer le Lot'}
        submitIcon={<Package size={18} />}
      >
        <div className="space-y-4">
          <FormField
            label="Numéro de Lot"
            name="numeroLot"
            placeholder="ex: LOT-2024-001"
            value={formData.numeroLot}
            onChange={(e) => setFormData({ ...formData, numeroLot: e.target.value })}
          />
          <FormField
            label="Quantité"
            name="quantite"
            type="number"
            placeholder="ex: 100"
            value={formData.quantite}
            onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
            required
          />
          <FormField
            label="Date Limite de Consommation (DLC)"
            name="dlc"
            type="date"
            value={formData.dlc}
            onChange={(e) => setFormData({ ...formData, dlc: e.target.value })}
          />
        </div>
      </FormModal>
    </div>
  );
}
