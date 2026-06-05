import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

export default function ArticleForm() {
  const { metier, user } = useAuth();
  const sectorPrefix = metier?.toLowerCase().replace(/_/g, '-') || 'produits';

  const [form, setForm] = useState({ codeBarres: '', nom: '', prix: '', stock: '' });
  const [loading, setLoading] = useState(false);

  const handleScan = async (code) => {
    setForm((prev) => ({ ...prev, codeBarres: code }));
    setLoading(true);
    try {
      const res = await api.get(`/${sectorPrefix}/produits`, { params: { codeBarres: code } });
      if (res.data?.data?.length) {
        const p = res.data.data[0];
        setForm({ codeBarres: p.codeBarres || code, nom: p.nom || '', prix: p.prixVente || '', stock: p.stock || '' });
      }
    } catch {} finally { setLoading(false); }
  };

  const { scannedCode, resetScan } = useBarcodeScanner({ onScan: handleScan });

  useEffect(() => {
    if (scannedCode) resetScan();
  }, [scannedCode, resetScan]);

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold text-white">Article</h1>

      <div>
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">Code-barres</label>
        <input value={form.codeBarres} onChange={(e) => setForm({ ...form, codeBarres: e.target.value })}
          placeholder="Scannez un produit..."
          className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
        {loading && <p className="text-amber-400 text-xs mt-1">Recherche en cours...</p>}
      </div>

      <div>
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nom</label>
        <input value={form.nom} readOnly
          className="w-full bg-slate-800/50 border border-slate-700 text-slate-300 rounded-xl px-4 py-3 text-sm outline-none cursor-default" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">Prix</label>
          <input value={form.prix} readOnly
            className="w-full bg-slate-800/50 border border-slate-700 text-slate-300 rounded-xl px-4 py-3 text-sm outline-none cursor-default" />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">Stock</label>
          <input value={form.stock} readOnly
            className="w-full bg-slate-800/50 border border-slate-700 text-slate-300 rounded-xl px-4 py-3 text-sm outline-none cursor-default" />
        </div>
      </div>
    </div>
  );
}
