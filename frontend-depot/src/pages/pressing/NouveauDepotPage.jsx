import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export default function NouveauDepotPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ clientId: '', designation: '', typeService: 'Lavage', prix: 0, avance: 0 });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.get(`/clients?tenantId=${user?.tenantId}`).then(res => setClients(res.data?.data || res.data || [])).catch(() => {});
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/pressing/tickets', {
        clientId: form.clientId,
        reference: 'T-' + Date.now(),
        montantTotal: parseFloat(form.prix),
        avance: parseFloat(form.avance),
        tenantId: user?.tenantId,
        vetements: [{ designation: form.designation, typeService: form.typeService, prix: parseFloat(form.prix) }],
      });
      navigate('/pressing/tickets');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Nouveau dépôt vêtements</h1>
      {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Client *</label>
          <select required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm">
            <option value="">Sélectionner...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Vêtement *</label>
          <input required value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}
            placeholder="Chemise, robe, costume..."
            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant *</label>
          <input required type="number" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Avance</label>
          <input type="number" value={form.avance} onChange={e => setForm({ ...form, avance: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/pressing/tickets')}
            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
            {loading ? 'Création...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
