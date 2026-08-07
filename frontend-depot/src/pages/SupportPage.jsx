import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, Send, MessageSquare, Clock, CheckCircle, AlertCircle, Plus, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const TICKET_TYPES = [
  { value: 'BUG', label: 'Bug', icon: <AlertCircle size={16} />, color: 'text-red-400' },
  { value: 'SUGGESTION', label: 'Suggestion', icon: <MessageSquare size={16} />, color: 'text-indigo-400' },
  { value: 'MESSAGE', label: 'Message', icon: <LifeBuoy size={16} />, color: 'text-emerald-400' },
];

const STATUS_STYLES = {
  OUVERT: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: <CheckCircle size={14} /> },
  EN_COURS: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: <Clock size={14} /> },
  TRAITE: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', icon: <CheckCircle size={14} /> },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.OUVERT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black ${style.bg} ${style.border} ${style.text}`}>
      {style.icon}
      {(status || 'OUVERT').replace('_', ' ')}
    </span>
  );
}

export default function SupportPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    type: 'MESSAGE',
    description: '',
  });

  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ['support-messages', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const res = await api.get('/support/messages');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!tenantId,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/support/messages', {
        message: data.description,
        type: data.type,
        pageUrl: window.location.pathname,
        userAgent: navigator.userAgent,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['support-messages']);
      setShowForm(false);
      setFormData({ titre: '', type: 'MESSAGE', description: '' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || !formData.description.trim()) return;
    createTicketMutation.mutate(formData);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <LifeBuoy size={28} className="text-indigo-400" />
            <h1 className="text-2xl font-black text-white">Support & Aide</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Contactez notre équipe pour toute question ou problème.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Fermer' : 'Nouveau Ticket'}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 mb-6 shadow-xl shadow-black/20">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Send size={20} className="text-indigo-400" />
            Créer un nouveau ticket
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                Type de demande
              </label>
              <div className="grid grid-cols-3 gap-3">
                {TICKET_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                      formData.type === type.value
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {type.icon}
                    <span className="text-sm font-bold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                Titre
              </label>
              <input
                type="text"
                value={formData.titre}
                onChange={(e) => setFormData((prev) => ({ ...prev, titre: e.target.value }))}
                placeholder="Résumé de votre demande..."
                className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre problème ou suggestion en détail..."
                rows={4}
                className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createTicketMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 disabled:cursor-not-allowed text-white font-bold px-4 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                {createTicketMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Envoyer le ticket
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-3 rounded-xl border border-slate-600 bg-slate-800/50 text-slate-400 hover:text-white hover:border-slate-500 font-bold transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-md px-4 py-3 text-sm text-red-400">
          {error.response?.data?.message || error.message || 'Impossible de charger vos messages.'}
        </div>
      )}

      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <LifeBuoy size={48} className="mx-auto mb-4 text-slate-600" />
            <p>Aucun message de support.</p>
            <p className="text-sm mt-2">Créez votre premier message pour contacter notre équipe.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusBadge status={ticket.statut} />
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">{ticket.message}</h3>
                    <p className="text-slate-400 text-sm mb-3">{ticket.user?.email || 'Vous'}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-bold uppercase tracking-wider">Type:</span>
                      <span className="text-slate-400">{ticket.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
