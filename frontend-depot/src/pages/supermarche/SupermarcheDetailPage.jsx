import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export default function SupermarcheDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rayon, setRayon] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nom: '', ordre: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState('');
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [articleForm, setArticleForm] = useState({ articleId: '' });
  const [catalogue, setCatalogue] = useState([]);

  const isNew = id === 'nouveau';

  useEffect(() => {
    const load = async () => {
      try {
        if (!isNew) {
          const res = await api.get(`/supermarche/rayons/${id}`);
          const d = res.data?.data || res.data;
          setRayon(d);
          setForm({ nom: d.nom || '', ordre: d.ordre || 0 });
          if (d.articles) setArticles(d.articles);
        }
        const catRes = await api.get(`/articles?tenantId=${user?.tenantId}`);
        setCatalogue(catRes.data?.data || catRes.data || []);
      } catch (_) {} finally { setLoading(false); }
    };
    load();
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { nom: form.nom, ordre: parseInt(form.ordre) || 0, tenantId: user?.tenantId };
      if (isNew) {
        await api.post('/supermarche/rayons', payload);
      } else {
        await api.patch(`/supermarche/rayons/${id}`, payload);
      }
      navigate('/supermarche');
    } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  const assignArticle = async () => {
    try {
      await api.post(`/supermarche/rayons/${id}/articles`, { articleId: articleForm.articleId });
      setShowArticleModal(false);
      const res = await api.get(`/supermarche/rayons/${id}`);
      setArticles(res.data?.data?.articles || []);
    } catch (_) { setErreur('Erreur assignation'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/supermarche')} className="text-slate-400 hover:text-white text-sm mb-4 block">← Retour aux rayons</button>
      {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-black text-white mb-6">{isNew ? 'Créer un rayon' : 'Modifier le rayon'}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label>
            <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Ordre</label>
            <input type="number" value={form.ordre} onChange={e => setForm({ ...form, ordre: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 px-6 rounded-xl">
              {submitting ? 'Enregistrement...' : isNew ? 'Créer' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {!isNew && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Articles du rayon</h2>
            <button onClick={() => setShowArticleModal(true)}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-bold">+ Assigner un article</button>
          </div>
          {articles.length === 0 ? (
            <p className="text-slate-500 text-sm">Aucun article dans ce rayon</p>
          ) : (
            <div className="space-y-2">
              {articles.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-slate-800/50 px-4 py-2 rounded-lg">
                  <span className="text-slate-300 text-sm">{a.article?.designation || a.designation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowArticleModal(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-black text-lg mb-4">Assigner un article</h3>
            <select value={articleForm.articleId} onChange={e => setArticleForm({ articleId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm mb-4">
              <option value="">Sélectionner...</option>
              {catalogue.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowArticleModal(false)} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
              <button onClick={assignArticle} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl">Assigner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
