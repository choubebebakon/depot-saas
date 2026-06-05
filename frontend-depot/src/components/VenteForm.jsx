import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import { ROLES, hasRole } from '../utils/rbac';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { generateId, generateReference } from '../utils/offline';
import Receipt80mm from './Receipt80mm';
import { Printer, PlusCircle } from 'lucide-react';
import MixedCrateBuilder from './MixedCrateBuilder';

const LABELS_TYPES = {
  BOUTEILLE_33CL: { label: 'Btl 33cl', emoji: '🍺' },
  BOUTEILLE_60CL: { label: 'Btl 60cl', emoji: '🍺' },
  CASIER: { label: 'Casier', emoji: '📦' },
  PALETTE: { label: 'Palette', emoji: '🏗️' },
  PACK_EAU: { label: 'Pack eau', emoji: '💧' },
};

export default function VenteForm() {
  const { tenantId, role, user } = useAuth();
  const { depotId } = useDepot();
  const queryClient = useQueryClient();
  const { addToQueue } = useOfflineSync();
  const canCreateSales = hasRole(role, [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.COMMERCIAL]);

  // Chargement des données avec Query (persistance automatique)
  const { data: articles = [] } = useQuery({
    queryKey: ['articles', tenantId, depotId],
    queryFn: async () => {
      const res = await api.get('/articles', { params: { tenantId, depotId } });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!tenantId
  });

  const { data: typesConsigne = [] } = useQuery({
    queryKey: ['consignes-types', tenantId],
    queryFn: async () => {
      const res = await api.get('/consignes/types', { params: { tenantId } });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!tenantId
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', tenantId, depotId],
    queryFn: async () => {
      const res = await api.get('/clients', { params: { tenantId, depotId } });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!tenantId
  });

  const { data: tenantConfig } = useQuery({
    queryKey: ['tenant-config', tenantId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}`);
      return res.data;
    },
    enabled: !!tenantId
  });

  // États locaux du formulaire
  const [lignes, setLignes] = useState(() => {
    try {
      const saved = localStorage.getItem('depot_draft_lignes');
      if (saved) return JSON.parse(saved);
    } catch {
      localStorage.removeItem('depot_draft_lignes');
    }
    return [{ articleId: '', quantite: 1, remise: 0 }];
  });

  useEffect(() => {
    localStorage.setItem('depot_draft_lignes', JSON.stringify(lignes));
  }, [lignes]);

  const [modePaiement, setModePaiement] = useState('CASH');
  const [clientId, setClientId] = useState('');
  const [avecConsignes, setAvecConsignes] = useState(false);
  const [lignesConsignes, setLignesConsignes] = useState([]);
  const [success, setSuccess] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [derniereVente, setDerniereVente] = useState(null);

  // Etat pour le modal Casier Mixte
  const [activeMixBuilder, setActiveMixBuilder] = useState(null);

  const buildLignesConsignes = () => typesConsigne.map((t) => ({
    typeConsigneId: t.id,
    type: t.type,
    valeurXAF: t.valeurXAF,
    quantiteSortie: 0,
    quantiteRendue: 0,
  }));

  const toggleConsignes = (checked) => {
    setAvecConsignes(checked);
    setLignesConsignes(checked ? buildLignesConsignes() : []);
  };

  const updateLigne = (i, champ, val) => {
    const copy = [...lignes];
    copy[i][champ] = champ === 'articleId' ? val : Number(val);
    if (champ === 'articleId') {
      copy[i].casierMixte = false;
      copy[i].composition = null;
    }
    setLignes(copy);
  };

  const updateConsigne = (i, champ, val) => {
    const copy = [...lignesConsignes];
    copy[i][champ] = Math.max(0, Number(val));
    setLignesConsignes(copy);
  };

  const getArticle = (articleId) => articles.find((a) => a.id === articleId);

  const totalArticles = lignes.reduce((acc, l) => {
    let sousTotal = 0;
    if (l.casierMixte && l.prix) {
      sousTotal = l.prix * (parseInt(l.quantite, 10) || 0);
    } else {
      const art = getArticle(l.articleId);
      sousTotal = art ? art.prixVente * (parseInt(l.quantite, 10) || 0) : 0;
    }
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
    localStorage.removeItem('depot_draft_lignes');
    setModePaiement('CASH');
    setClientId('');
    setAvecConsignes(false);
    setLignesConsignes([]);
  };

  const viderPanier = () => {
    if (window.confirm("Voulez-vous vraiment annuler cette vente et vider le panier ?")) {
      setLignes([]);
      setClientId('');
      setAvecConsignes(false);
      setLignesConsignes([]);
      localStorage.removeItem('depot_draft_lignes');
    }
  };

  const createVenteMutation = useMutation({
    mutationFn: async (ventePayload) => {
      if (!navigator.onLine) {
        await addToQueue('POST', '/ventes', ventePayload);
        return { ...ventePayload, status: 'QUEUED_OFFLINE' };
      }
      const res = await api.post('/ventes', ventePayload);
      const vente = res.data;
      if (avecConsignes && lignesConsignes.some((l) => l.quantiteSortie > 0 || l.quantiteRendue > 0)) {
        const lignesActives = lignesConsignes.filter((l) => l.quantiteSortie > 0 || l.quantiteRendue > 0);
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
      return vente;
    },
    onSuccess: (data) => {
      setSuccess(true);
      setDerniereVente({
        reference: data.reference,
        total: totalArticles,
        caution,
        statut: data.status === 'QUEUED_OFFLINE' ? 'EN ATTENTE SYNC' : (data.statut || 'ATTENTE'),
        modePaiement: data.modePaiement,
        client: data.client,
        lignes: data.lignes || [],
        date: data.date || data.createdAt || new Date(),
        caissier: user?.nom || user?.name || user?.email || 'Caissier'
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['stocks', tenantId, depotId] });
      queryClient.invalidateQueries({ queryKey: ['stocks-stats', tenantId, depotId] });
      queryClient.invalidateQueries({ queryKey: ['stocks-mouvements', tenantId, depotId] });
      queryClient.invalidateQueries({ queryKey: ['ventes', tenantId, depotId] });
      window.dispatchEvent(new CustomEvent('refresh-stocks'));
      setTimeout(() => { setSuccess(false); setDerniereVente(null); }, 6000);
    },
    onError: (err) => {
      console.error('Erreur mutation vente:', err);
      const message = err?.response?.data?.message || err.message || 'Erreur inattendue.';
      setErreur(Array.isArray(message) ? message.join(', ') : message);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!depotId) { setErreur('Sélectionnez un Dépôt dans le menu.'); return; }

    try {
      setSuccess(false);
      setErreur(null);

      // Filtrer les lignes vides et calculer les totaux
      const payloadLignes = lignes
        .filter(l => l.articleId || (l.casierMixte && l.composition?.length > 0))
        .map((l) => {
          const article = getArticle(l.articleId);
          const quantite = parseInt(l.quantite, 10) || 0;
          const remise = Number(l.remise) || 0;
          const prixBase = l.casierMixte ? (Number(l.prix) || 0) : (article?.prixVente || 0);
          const sousTotal = prixBase * quantite;

          if (remise > sousTotal && sousTotal > 0) {
            let name = l.casierMixte ? "Casier Mixte" : (article?.designation || 'la ligne');
            throw new Error(`La remise dépasse le montant de ${name}.`);
          }

          // Déterminer l'articleId principal (celui du casier ou le premier du mix)
          const effectiveArticleId = l.casierMixte
            ? (l.composition?.[0]?.articleId || l.articleId)
            : l.articleId;

          if (!effectiveArticleId) {
            throw new Error("ID d'article manquant sur une ligne.");
          }

          return {
            articleId: effectiveArticleId,
            quantite,
            remise,
            casierMixte: !!l.casierMixte,
            composition: l.composition || null,
            prix: prixBase,
            total: sousTotal - remise, // Ajout du total pour le mode hors-ligne
            article: article || (l.casierMixte ? { designation: "Casier Mixte" } : null) // Utile pour Receipt80mm
          };
        });

      if (payloadLignes.length === 0) {
        setErreur("Votre panier est vide.");
        return;
      }

      createVenteMutation.mutate({
        id: generateId(),
        reference: generateReference(user?.email || 'OFF', 'FAC'),
        depotId,
        tenantId,
        modePaiement,
        clientId: clientId || undefined,
        lignes: payloadLignes,
      });
    } catch (err) {
      console.error('Erreur handleSubmit Vente:', err);
      setErreur(err.message);
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
          Accès restreint aux caissiers et gérants.
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
            Total: {derniereVente.total.toLocaleString('fr-FR')} FCFA
          </p>
          <button type="button" onClick={() => window.print()} className="mt-3 bg-emerald-600 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
            <Printer className="w-4 h-4" /> Reçu
          </button>
        </div>
      )}

      {erreur && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{erreur}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500">
            <option value="">Sans client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Paiement</label>
            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              {modes.map((mode) => (
                <option key={mode.val} value={mode.val}>{mode.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2.5">
            <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">Consignes</span>
            <input
              type="checkbox"
              checked={avecConsignes}
              disabled={typesConsigne.length === 0}
              onChange={(e) => toggleConsignes(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
          </label>
        </div>

        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
          {lignes.map((ligne, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                <select value={ligne.articleId} onChange={(e) => updateLigne(i, 'articleId', e.target.value)} className="flex-1 bg-slate-900 border border-slate-600 text-white text-xs rounded-lg px-2 py-2">
                  <option value="">Article...</option>
                  {articles.map((a) => <option key={a.id} value={a.id}>{a.designation}</option>)}
                </select>
                <input type="number" value={ligne.quantite} onChange={(e) => updateLigne(i, 'quantite', e.target.value)} className="w-16 bg-slate-900 border border-slate-600 text-white text-xs rounded-lg px-2 text-center" />
              </div>
              {ligne.articleId && (
                <div className="flex justify-between items-center bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase italic">
                    {ligne.casierMixte ? "Casier Mixte" : "Standard"}
                  </span>
                  <button type="button" onClick={() => {
                    const art = getArticle(ligne.articleId);
                    setActiveMixBuilder({ index: i, crateSize: art?.uniteParCasier || 12, basePrice: art?.prixVente || 8000, crateName: art?.designation, initialComposition: ligne.composition });
                  }} className="text-[10px] text-white bg-indigo-600 px-2 py-1 rounded">Mixer</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setLignes([...lignes, { articleId: '', quantite: 1, remise: 0 }])} className="w-full flex items-center justify-center border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 py-2 text-sm font-semibold rounded-xl transition-all">
          <PlusCircle size={20} className="mr-3" /> Nouvelle Vente
        </button>

        {avecConsignes && (
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-600 space-y-2">
            <p className="text-slate-400 text-xs font-bold uppercase">Consignes</p>
            {lignesConsignes.map((l, i) => (
              <div key={l.typeConsigneId} className="flex justify-between items-center gap-2">
                <span className="text-xs text-slate-300 flex-1">{l.type}</span>
                <input type="number" value={l.quantiteSortie} onChange={(e) => updateConsigne(i, 'quantiteSortie', e.target.value)} className="w-12 bg-slate-800 text-white text-xs rounded p-1 text-center" />
                <input type="number" value={l.quantiteRendue} onChange={(e) => updateConsigne(i, 'quantiteRendue', e.target.value)} className="w-12 bg-slate-800 text-white text-xs rounded p-1 text-center" />
              </div>
            ))}
          </div>
        )}

        {(totalArticles > 0 || caution > 0) && (
          <div className="bg-slate-950 rounded-xl px-4 py-3 border border-slate-700 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Articles</span>
              <span className="text-white font-bold">{totalArticles.toLocaleString('fr-FR')} FCFA</span>
            </div>
            {totalRemises > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Remises</span>
                <span className="text-amber-300 font-bold">-{totalRemises.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-700 pt-1">
              <span className="text-white font-black">Total Général</span>
              <span className="text-white font-black text-lg">{totalGeneral.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={viderPanier}
            className="w-[30%] bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-xl transition-all uppercase tracking-widest text-[10px]"
          >
            ANNULER
          </button>
          <button
            type="submit"
            disabled={createVenteMutation.isPending}
            className="w-[70%] flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all uppercase tracking-widest text-xs"
          >
            {createVenteMutation.isPending ? 'Enregistrement...' : (
              <>
                <Printer size={20} className="mr-3" /> Validation du ticket
              </>
            )}
          </button>
        </div>
      </form>

      {activeMixBuilder && (
        <MixedCrateBuilder
          articles={articles}
          crateSize={activeMixBuilder.crateSize}
          basePrice={activeMixBuilder.basePrice}
          crateName={activeMixBuilder.crateName}
          initialComposition={activeMixBuilder.initialComposition}
          onClose={() => setActiveMixBuilder(null)}
          onSave={(composition, totalPrice) => {
            const copy = [...lignes];
            copy[activeMixBuilder.index].casierMixte = true;
            copy[activeMixBuilder.index].composition = composition;
            copy[activeMixBuilder.index].prix = totalPrice;
            setLignes(copy);
            setActiveMixBuilder(null);
          }}
        />
      )}

      {derniereVente && <Receipt80mm vente={derniereVente} config={tenantConfig} />}
    </div>
  );
}
