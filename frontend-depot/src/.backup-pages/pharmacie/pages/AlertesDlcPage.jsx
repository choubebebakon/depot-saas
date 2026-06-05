import { useState, useEffect } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';

function AlertCard({ medicament, niveau }) {
  const colors = {
    expire: { bg: 'bg-red-500/10 border-red-500/30', badge: 'bg-red-500/20 text-red-400', label: '🔴 Expiré', icon: '🔴' },
    urgent: { bg: 'bg-amber-500/10 border-amber-500/30', badge: 'bg-amber-500/20 text-amber-400', label: '🟠 < 7 jours', icon: '🟠' },
    bientot: { bg: 'bg-yellow-500/10 border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-400', label: '🟡 < 30 jours', icon: '🟡' },
  };
  const c = colors[niveau] || colors.bientot;

  return (
    <div className={`${c.bg} rounded-2xl p-5 transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-bold text-base">{medicament.designation}</h3>
          <p className="text-slate-400 text-xs">{medicament.dosage || ''} — {medicament.formeGalenique || ''}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.badge}`}>{c.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-900/50 rounded-xl px-3 py-2">
          <span className="text-slate-500">Lot</span>
          <p className="text-white font-semibold">{medicament.numeroLot || '—'}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl px-3 py-2">
          <span className="text-slate-500">Expire le</span>
          <p className="text-white font-semibold">{medicament.dateExpiration ? new Date(medicament.dateExpiration).toLocaleDateString('fr-FR') : '—'}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl px-3 py-2">
          <span className="text-slate-500">Stock</span>
          <p className="text-white font-semibold">{medicament.stock ?? 0}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl px-3 py-2">
          <span className="text-slate-500">Fournisseur</span>
          <p className="text-white font-semibold">{medicament.fournisseurNom || '—'}</p>
        </div>
      </div>
    </div>
  );
}

export default function AlertesDlcPage() {
  const [medicaments, setMedicaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState(null);
  const perm = usePermission(PERMISSIONS, 'alertes-dlc');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pharmacie/medicaments');
      const data = res.data?.data || res.data || [];
      setMedicaments(data);
    } catch (_) { setMedicaments([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const now = new Date();
  const dans7j = new Date(now.getTime() + 7 * 86400000);
  const dans30j = new Date(now.getTime() + 30 * 86400000);

  const expirees = medicaments.filter(m => m.dateExpiration && new Date(m.dateExpiration) <= now);
  const urgentes = medicaments.filter(m => m.dateExpiration && new Date(m.dateExpiration) > now && new Date(m.dateExpiration) <= dans7j);
  const bientot = medicaments.filter(m => m.dateExpiration && new Date(m.dateExpiration) > dans7j && new Date(m.dateExpiration) <= dans30j);

  const handleTraiter = async (m, action) => {
    try {
      await api.patch(`/pharmacie/medicaments/${m.id}`, { actionDLC: action, dateExpiration: null });
      showNotif(`${m.designation} — ${action === 'detruire' ? 'Marqué pour destruction' : 'Retourné fournisseur'}`);
      load();
    } catch (_) { showNotif('Erreur', 'error'); }
  };

  return (
    <div className="p-6 space-y-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div>
        <h1 className="text-2xl font-black text-white">⏰ Alertes DLC</h1>
        <p className="text-slate-400 text-sm mt-1">Surveillance des dates limite de consommation</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🔴</span>
              <h2 className="text-white font-black text-lg">Expirés ({expirees.length})</h2>
            </div>
            {expirees.length === 0 ? (
              <p className="text-slate-500 text-sm ml-8">Aucun médicament expiré</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expirees.map(m => (
                  <div key={m.id}>
                    <AlertCard medicament={m} niveau="expire" />
                    {perm.canEdit && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleTraiter(m, 'retourner')}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 font-bold py-2 rounded-xl text-xs transition-colors">📦 Retourner fournisseur</button>
                      <button onClick={() => handleTraiter(m, 'detruire')}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold py-2 rounded-xl text-xs transition-colors">🗑️ Détruire</button>
                    </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🟠</span>
              <h2 className="text-white font-black text-lg">Expire dans &lt; 7 jours ({urgentes.length})</h2>
            </div>
            {urgentes.length === 0 ? (
              <p className="text-slate-500 text-sm ml-8">Aucune alerte urgente</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {urgentes.map(m => <AlertCard key={m.id} medicament={m} niveau="urgent" />)}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🟡</span>
              <h2 className="text-white font-black text-lg">Expire dans &lt; 30 jours ({bientot.length})</h2>
            </div>
            {bientot.length === 0 ? (
              <p className="text-slate-500 text-sm ml-8">Aucune alerte à venir</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bientot.map(m => <AlertCard key={m.id} medicament={m} niveau="bientot" />)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
