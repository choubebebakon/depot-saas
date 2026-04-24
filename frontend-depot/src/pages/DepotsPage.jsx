import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import { 
  Plus, Edit, Trash2, MapPin, Building2, Save, X, 
  AlertTriangle, CheckCircle2, RefreshCw, Hash
} from 'lucide-react';

const DepotsPage = () => {
    const { tenantId } = useAuth();
    const { depotActif, changerDepot } = useDepot();
    const queryClient = useQueryClient();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDepot, setEditingDepot] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        adresse: '',
        emplacement: '',
        codePrefix: 'DEP'
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // 1. Fetch Depots
    const { data: depots = [], isLoading } = useQuery({
        queryKey: ['depots', tenantId],
        queryFn: async () => {
            const res = await api.get('/depots', { params: { tenantId } });
            return res.data;
        },
        enabled: !!tenantId
    });

    // 2. Create Mutation
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/depots', { ...data, tenantId }),
        onSuccess: () => {
            queryClient.invalidateQueries(['depots']);
            closeModal();
            showSuccess('Dépôt créé avec succès !');
        },
        onError: (err) => setError(err.response?.data?.message || 'Erreur lors de la création')
    });

    // 3. Update Mutation
    const updateMutation = useMutation({
        mutationFn: (data) => api.patch(`/depots/${data.id}`, data, { params: { tenantId } }),
        onSuccess: () => {
            queryClient.invalidateQueries(['depots']);
            closeModal();
            showSuccess('Dépôt mis à jour !');
        },
        onError: (err) => setError(err.response?.data?.message || 'Erreur lors de la mise à jour')
    });

    // 4. Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/depots/${id}`, { params: { tenantId } }),
        onSuccess: () => {
            queryClient.invalidateQueries(['depots']);
            showSuccess('Dépôt supprimé.');
        },
        onError: (err) => setError(err.response?.data?.message || 'Erreur de suppression')
    });

    const openModal = (depot = null) => {
        if (depot) {
            setEditingDepot(depot);
            setFormData({
                nom: depot.nom,
                adresse: depot.adresse,
                emplacement: depot.emplacement,
                codePrefix: depot.codePrefix || 'DEP'
            });
        } else {
            setEditingDepot(null);
            setFormData({ nom: '', adresse: '', emplacement: '', codePrefix: 'DEP' });
        }
        setIsModalOpen(true);
        setError(null);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingDepot(null);
        setError(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingDepot) {
            updateMutation.mutate({ ...formData, id: editingDepot.id });
        } else {
            createMutation.mutate(formData);
        }
    };

    const showSuccess = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 5000);
    };

    return (
        <div className="p-6 space-y-8 bg-slate-900 min-h-screen text-slate-200">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Building2 className="text-indigo-500" size={32} />
                        Gestion des Dépôts
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Configurez vos entrepôts de stockage et points de vente physiques.
                    </p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                >
                    <Plus size={20} />
                    Nouveau Dépôt
                </button>
            </div>

            {/* Notification area */}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 size={20} />
                    <span className="font-bold">{success}</span>
                </div>
            )}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <AlertTriangle size={20} />
                    <span className="font-bold">{error}</span>
                </div>
            )}

            {/* Depots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-slate-800/50 rounded-3xl animate-pulse border border-slate-700" />
                    ))
                ) : depots.map(depot => (
                    <div 
                        key={depot.id} 
                        className={`group relative bg-slate-800/50 border rounded-3xl p-6 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 ${
                            depotActif?.id === depot.id ? 'border-indigo-500/50 ring-2 ring-indigo-500/10 shadow-xl shadow-indigo-500/10' : 'border-slate-700 hover:border-slate-600'
                        }`}
                    >
                        {depotActif?.id === depot.id && (
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-lg uppercase tracking-widest">
                                Dépôt Actif
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                <MapPin size={24} />
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => openModal(depot)}
                                    className="p-2 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
                                >
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => {
                                        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce dépôt ?")) {
                                            deleteMutation.mutate(depot.id);
                                        }
                                    }}
                                    className="p-2 bg-slate-900/50 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{depot.nom}</h3>
                                <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                                    <Hash size={12} /> Prefix: <span className="text-indigo-400 font-bold">{depot.codePrefix}</span>
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-start gap-2 text-slate-400 text-sm">
                                    <MapPin size={14} className="mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{depot.adresse}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                                    <span>{depot.emplacement}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => changerDepot(depot)}
                                className={`w-full mt-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                    depotActif?.id === depot.id 
                                    ? 'bg-emerald-500/10 text-emerald-400 cursor-default border border-emerald-500/20' 
                                    : 'bg-slate-900 text-slate-400 hover:bg-indigo-600 hover:text-white border border-slate-700 hover:border-indigo-500 shadow-inner'
                                }`}
                            >
                                {depotActif?.id === depot.id ? 'Sélectionné' : 'Définir comme actif'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={closeModal} />
                    <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 overflow-hidden">
                        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-white">{editingDepot ? 'Modifier le Dépôt' : 'Nouveau Dépôt'}</h2>
                                <p className="text-slate-500 text-xs mt-1">Identifiez clairement votre point de stockage.</p>
                            </div>
                            <button onClick={closeModal} className="p-3 text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Nom du Dépôt *</label>
                                    <input 
                                        required
                                        value={formData.nom}
                                        onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                                        placeholder="ex: Entrepôt Nord"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Préfixe Code *</label>
                                        <input 
                                            required
                                            value={formData.codePrefix}
                                            onChange={e => setFormData({ ...formData, codePrefix: e.target.value.toUpperCase() })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono font-bold"
                                            maxLength={5}
                                            placeholder="DEP"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Emplacement</label>
                                        <input 
                                            value={formData.emplacement}
                                            onChange={e => setFormData({ ...formData, emplacement: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                            placeholder="ex: Zone A"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Adresse Physique</label>
                                    <textarea 
                                        rows={3}
                                        value={formData.adresse}
                                        onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                                        placeholder="ex: Boulevard de la liberté, Douala"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={closeModal}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit"
                                    disabled={createMutation.isLoading || updateMutation.isLoading}
                                    className="flex-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                                >
                                    {(createMutation.isLoading || updateMutation.isLoading) ? (
                                        <RefreshCw size={20} className="animate-spin" />
                                    ) : (
                                        <Save size={20} />
                                    )}
                                    {editingDepot ? 'Mettre à jour' : 'Créer le Dépôt'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepotsPage;
