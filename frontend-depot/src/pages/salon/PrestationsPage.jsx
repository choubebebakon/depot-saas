import { useState, useEffect } from 'react';
import api from '../../api';

export default function PrestationsPage() {
  const [prestations, setPrestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: '', description: '', prix: '', dureeMin: '', categorie: '' });
  const [categories, setCategories] = useState([]);

  const fetchPrestations = async () => {
    try {
      const res = await api.get('/salon/prestations', { params: { limit: 100 } });
      const data = res.data.data || res.data;
      const list = Array.isArray(data) ? data : [];
      setPrestations(list);
      const cats = [...new Set(list.map(p => p.categorie).filter(Boolean))];
      setCategories(cats);
    } catch (err) {
      console.error('Erreur chargement prestations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrestations(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, prix: parseFloat(form.prix), dureeMin: form.dureeMin ? parseInt(form.dureeMin) : undefined };
      await api.post('/salon/prestations', payload);
      setShowModal(false);
      setForm({ nom: '', description: '', prix: '', dureeMin: '', categorie: '' });
      fetchPrestations();
    } catch (err) {
      console.error('Erreur création prestation:', err);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/salon/prestations/${id}/disponibilite`);
      fetchPrestations();
    } catch (err) {
      console.error('Erreur toggle prestation:', err);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">💇 Prestations & Tarifs</h1>
        <button onClick={() => setShowModal(true)} className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-medium">+ Nouvelle prestation</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Chargement...</div>
      ) : prestations.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Aucune prestation. Créez votre première prestation !</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="text-lg font-semibold text-pink-400 mb-2 mt-2 first:mt-0">{cat}</h3>
              {prestations.filter(p => p.categorie === cat).map(p => (
                <PrestationCard key={p.id} prestation={p} onToggle={handleToggle} />
              ))}
            </div>
          ))}
          <div>
            <h3 className="text-lg font-semibold text-slate-400 mb-2 mt-2">Autres</h3>
            {prestations.filter(p => !p.categorie).map(p => (
              <PrestationCard key={p.id} prestation={p} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle prestation</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Nom" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" required />
              <textarea placeholder="Description (optionnelle)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" rows={2} />
              <div className="flex gap-2">
                <input type="number" placeholder="Prix (XAF)" value={form.prix} onChange={e => setForm(p => ({ ...p, prix: e.target.value }))} className="flex-1 p-3 bg-slate-700 rounded-lg" required min="0" />
                <input type="number" placeholder="Durée (min)" value={form.dureeMin} onChange={e => setForm(p => ({ ...p, dureeMin: e.target.value }))} className="w-32 p-3 bg-slate-700 rounded-lg" min="0" />
              </div>
              <input type="text" placeholder="Catégorie (ex: Coupe, Soin, Coloration)" value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))} className="w-full p-3 bg-slate-700 rounded-lg" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-pink-600 py-2 rounded-lg font-medium">Créer</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-600 py-2 rounded-lg">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PrestationCard({ prestation, onToggle }) {
  return (
    <div className={`bg-slate-800 p-3 rounded-xl border mb-2 ${prestation.disponible === false ? 'border-red-800 opacity-60' : 'border-slate-700'}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">{prestation.nom}</p>
          {prestation.description && <p className="text-slate-400 text-xs">{prestation.description}</p>}
          {prestation.dureeMin && <p className="text-slate-500 text-xs">⏱ {prestation.dureeMin} min</p>}
        </div>
        <div className="text-right">
          <p className="text-emerald-400 font-semibold">{prestation.prix} XAF</p>
          <button onClick={() => onToggle(prestation.id)} className={`text-xs mt-1 px-2 py-0.5 rounded ${prestation.disponible === false ? 'bg-green-700' : 'bg-red-700'}`}>
            {prestation.disponible === false ? 'Activer' : 'Désactiver'}
          </button>
        </div>
      </div>
    </div>
  );
}
