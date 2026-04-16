import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
import { ROLES, hasRole } from '../utils/rbac';

const LABELS_TYPES = {
  BOUTEILLE_33CL: { label: 'Btl 33cl', emoji: '🍺' },
  BOUTEILLE_60CL: { label: 'Btl 60cl', emoji: '🍺' },
  CASIER: { label: 'Casier', emoji: '📦' },
  PALETTE: { label: 'Palette', emoji: '🏗️' },
  PACK_EAU: { label: 'Pack eau', emoji: '💧' },
};

export default function VenteForm() {
  const { tenantId, role } = useAuth();
  const { siteId } = useSite();
  const canCreateSales = hasRole(role, [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.COMMERCIAL]);

  const [articles, setArticles] = useState([]);
  const [typesConsigne, setTypesConsigne] = useState([]);
  const [clients, setClients] = useState([]);
  const [lignes, setLignes] = useState([{ articleId: '', quantite: 1, remise: 0 }]);
  const [modePaiement, setModePaiement] = useState('CASH');
  const [clientId, setClientId] = useState('');
  const [avecConsignes, setAvecConsignes] = useState(false);
  const [lignesConsignes, setLignesConsignes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [derniereVente, setDerniereVente] = useState(null);

  useEffect(() => {
    if (!tenantId) return;
    Promise.all([
      api.get('/articles', { params: { tenantId } }),
      api.get('/consignes/types', { params: { tenantId } }),
      api.get('/clients', { params: { tenantId } }),
    ]).then(([resA, resC, resCl]) => {
      setArticles(Array.isArray(resA.data) ? resA.data : []);
      setTypesConsigne(Array.isArray(resC.data) ? resC.data : []);
      setClients(Array.isArray(resCl.data) ? resCl.data : []);
    }).catch(console.error);
  }, [tenantId]);

  useEffect(() => {
    if (avecConsignes && lignesConsignes.length === 0 && typesConsigne.length > 0) {
      setLignesConsignes(typesConsigne.map((t) => ({
        typeConsigneId: t.id,
        type: t.type,
        valeurXAF: t.valeurXAF,
        quantiteSortie: 0,
        quantiteRendue: 0,
      })));
    }
  }, [avecConsignes, typesConsigne, lignesConsignes.length]);

  const updateLigne = (i, champ, val) => {
    const copy = [...lignes];
    copy[i][champ] = champ === 'articleId' ? val : Number(val);
    setLignes(copy);
  };

  const updateConsigne = (i, champ, val) => {
    const copy = [...lignesConsignes];
    copy[i][champ] = Math.max(0, Number(val));
    setLignesConsignes(copy);
  };

  const getArticle = (articleId) => articles.find((a) => a.id === articleId);

  const totalArticles = lignes.reduce((acc, l) => {
    const art = getArticle(l.articleId);
    const sousTotal = art ? art.prixVente * (parseInt(l.quantite, 10) || 0) : 0;
    return acc + Math.max(0, sousTotal - (Number(l.remise) || 0));
  }, 0);

  const totalRemises = lignes.reduce((acc, l) => acc + (Number(l.remise) || 0), 0);

  const caution = lignesConsignes.reduce((acc, l) => {
    const net = l.quantiteSortie - l.quantiteRendue;
    return acc + (net > 0 ? net * l.valeurXAF : 0);
  }, 0);

  const totalGeneral = totalArticles + caution;

  const resetForm = () => {
    setLignes([{ articleId: '', quantite: 1, remise: 0 }]);
    setModePaiement('CASH');
    setClientId('');
    setAvecConsignes(false);
    setLignesConsignes([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!siteId) { setErreur('Sélectionnez un site dans le menu.'); return; }
    setLoading(true);
    setSuccess(false);
    setErreur(null);

    try {
      const payloadLignes = lignes.map((l) => {
        const article = getArticle(l.articleId);
        const quantite = parseInt(l.quantite, 10);
        const remise = Number(l.remise) || 0;
        const sousTotal = (article?.prixVente || 0) * quantite;
        if (remise > sousTotal) {
          throw new Error(`La remise dépasse le montant de ${article?.designation || 'la ligne'}.`);
        }
        return {
          articleId: l.articleId,
          quantite,
          remise,
        };
      });

      const resVente = await api.post('/ventes', {
        siteId,
        tenantId,
        modePaiement,
        clientId: clientId || undefined,
        lignes: payloadLignes,
      });

      const vente = resVente.data;

      if (avecConsignes && lignesConsignes.some((l) => l.quantiteSortie > 0 || l.quantiteRendue > 0)) {
        const lignesActives = lignesConsignes.filter(
          (l) => l.quantiteSortie > 0 || l.quantiteRendue > 0
        );

        await api.post('/consignes/vente', {
          venteId: vente.id,
          tenantId,
          clientId: clientId || undefined,
          lignesConsignes: lignesActives.map((l) => ({
            typeConsigneId: l.typeConsigneId,
            quantiteSortie: l.quantiteSortie,
            quantiteRendue: l.quantiteRendue,
          })),
        });
      }

      setSuccess(true);
      setDerniereVente({
        reference: vente.reference,
        total: totalArticles,
        caution,
        statut: vente.statut,
      });
      resetForm();
      window.dispatchEvent(new CustomEvent('refresh-stocks'));
      window.dispatchEvent(new CustomEvent('refresh-ventes'));
      setTimeout(() => { setSuccess(false); setDerniereVente(null); }, 6000);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Erreur inattendue.';
      setErreur(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    { val: 'CASH', label: 'Cash' },
    { val: 'ORANGE_MONEY', label: 'Orange Money' },
    { val: 'MTN_MOMO', label: 'MTN MoMo' },
    { val: 'CREDIT', label: 'Ardoise' },
  ];

  if (!canCreateSales) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
        <h2 className="text-white font-bold text-lg mb-3">Caisse Express</h2>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          Votre rôle ne permet pas de créer des ventes. Utilisez l’historique ou les validations si vous êtes magasinier.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
      <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
        <span>🛒</span>
        <span>Caisse Express</span>
      </h2>

      {success && derniereVente && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          <p className="font-black">Vente {derniereVente.reference} enregistrée</p>
          <p className="text-xs mt-1">
            Statut: {derniereVente.statut} · Articles: {derniereVente.total.toLocaleString('fr-FR')} FCFA
            {derniereVente.caution > 0 && ` · Caution: ${derniereVente.caution.toLocaleString('fr-FR')} FCFA`}
          </p>
        </div>
      )}

      {erreur && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
            Client (optionnel)
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Sans client (vente comptoir)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}{c.soldeCredit > 0 ? ` - Ardoise: ${c.soldeCredit.toLocaleString('fr-FR')} F` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {lignes.map((ligne, i) => {
            const article = getArticle(ligne.articleId);
            const sousTotal = article ? article.prixVente * (parseInt(ligne.quantite, 10) || 0) : 0;
            const totalLigne = Math.max(0, sousTotal - (Number(ligne.remise) || 0));

            return (
              <div key={i} className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                <div className="flex gap-2 items-center">
                  <select
                    required
                    value={ligne.articleId}
                    onChange={(e) => updateLigne(i, 'articleId', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-600 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Choisir un article...</option>
                    {articles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.famille?.emoji} {a.designation} {a.format && `(${a.format})`} - {a.prixVente.toLocaleString('fr-FR')} F
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ligne.quantite}
                    onChange={(e) => updateLigne(i, 'quantite', e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-600 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 text-center"
                  />
                  {lignes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLignes(lignes.filter((_, idx) => idx !== i))}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="mt-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Remise</label>
                    <input
                      type="number"
                      min="0"
                      value={ligne.remise}
                      onChange={(e) => updateLigne(i, 'remise', e.target.value)}
                      className="w-28 bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs text-slate-500">FCFA</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-500 mr-2">Ligne</span>
                    <span className="font-black text-white">{totalLigne.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setLignes([...lignes, { articleId: '', quantite: 1, remise: 0 }])}
          className="w-full border border-dashed border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-xl py-2 text-sm font-semibold transition-all"
        >
          + Ajouter un article
        </button>

        {typesConsigne.length > 0 && (
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setAvecConsignes(!avecConsignes)}
                className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${avecConsignes ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${avecConsignes ? 'left-7' : 'left-1'}`} />
              </div>
              <span className="text-slate-300 text-sm font-semibold">Gérer les consignes / vides</span>
            </label>
          </div>
        )}

        {avecConsignes && lignesConsignes.length > 0 && (
          <div className="bg-slate-900 rounded-xl p-4 space-y-3 border border-slate-600">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Consignes & Vides
            </p>

            <div className="grid grid-cols-3 gap-1 text-slate-500 text-xs px-1 mb-1">
              <span>Type</span>
              <span className="text-center">Sortis</span>
              <span className="text-center">Rendus</span>
            </div>

            {lignesConsignes.map((l, i) => {
              const label = LABELS_TYPES[l.type];
              const net = l.quantiteSortie - l.quantiteRendue;
              return (
                <div key={l.typeConsigneId}>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{label?.emoji}</span>
                      <span className="text-slate-300 text-xs font-semibold">{label?.label}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={l.quantiteSortie}
                      onChange={(e) => updateConsigne(i, 'quantiteSortie', e.target.value)}
                      className="w-full bg-slate-800 border border-red-500/30 text-red-400 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-red-500"
                    />
                    <input
                      type="number"
                      min="0"
                      value={l.quantiteRendue}
                      onChange={(e) => updateConsigne(i, 'quantiteRendue', e.target.value)}
                      className="w-full bg-slate-800 border border-emerald-500/30 text-emerald-400 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  {net > 0 && (
                    <p className="text-orange-400 text-xs mt-1 text-right font-bold">
                      Caution : {(net * l.valeurXAF).toLocaleString('fr-FR')} FCFA
                    </p>
                  )}
                </div>
              );
            })}

            {caution > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
                <p className="text-orange-400 font-black text-sm">
                  Total caution : {caution.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
            Mode de paiement
          </p>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((m) => (
              <button
                key={m.val}
                type="button"
                onClick={() => setModePaiement(m.val)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${modePaiement === m.val
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {(totalArticles > 0 || caution > 0 || totalRemises > 0) && (
          <div className="bg-slate-900 rounded-xl px-4 py-3 border border-slate-700 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Articles</span>
              <span className="text-white font-bold">{totalArticles.toLocaleString('fr-FR')} FCFA</span>
            </div>
            {totalRemises > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-400">Remises</span>
                <span className="text-amber-400 font-bold">-{totalRemises.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            {caution > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-orange-400">Caution emballages</span>
                <span className="text-orange-400 font-bold">{caution.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-700 pt-1">
              <span className="text-white font-black">Total général</span>
              <span className="text-white font-black text-lg">{totalGeneral.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || lignes.every((l) => !l.articleId)}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          {loading ? 'Validation...' : (
            totalGeneral > 0
              ? `Créer la vente - ${totalGeneral.toLocaleString('fr-FR')} FCFA`
              : 'Créer la vente'
          )}
        </button>
      </form>
    </div>
  );
}
