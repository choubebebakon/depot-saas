import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Eye,
  FilePlus2,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useDepot } from '../../../contexts/DepotContext';
import { useNotif } from '../../../context/NotifContext';
import { achatsApi } from '../services/achatsApi';
import './AchatsReceptionsPage.css';

const UNITS = ['PIECE', 'BOUTEILLE', 'CASIER', 'PACK', 'PALETTE', 'PLATEAU'];
const PAYMENTS = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'OM', label: 'Orange Money' },
  { value: 'MOMO', label: 'MTN MoMo' },
  { value: 'CREDIT', label: 'Crédit' },
];
const STATUS = {
  BROUILLON: 'Brouillon',
  ENVOYE: 'Envoyée',
  RECU: 'Reçue',
  ANNULE: 'Annulée',
};
const STATUS_CLASS = {
  BROUILLON: 'bg-slate-700/60 text-slate-200 border-slate-600',
  ENVOYE: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  RECU: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  ANNULE: 'bg-red-500/10 text-red-300 border-red-500/30',
};

const list = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const money = (value) => `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} FCFA`;
const newKey = () => globalThis.crypto?.randomUUID?.() || `reception-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const newReference = () => `CMD-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

function Button({ children, icon: Icon, variant = 'secondary', ...props }) {
  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white',
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  );
}

function Field({ label, children, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-400">
        {label}{required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}

function Modal({ title, icon: Icon, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className={`max-h-[92vh] w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}>
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-300"><Icon size={19} /></div>
            <h2 className="font-bold text-white">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-72px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function Summary({ label, value, emphasis = false }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-black ${emphasis ? 'text-amber-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function Empty({ icon: Icon, title, text }) {
  return (
    <div className="p-12 text-center">
      <Icon className="mx-auto mb-3 text-slate-600" size={30} />
      <p className="font-semibold text-slate-300">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function QueryError({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
      <AlertTriangle className="mx-auto mb-3 text-red-300" size={28} />
      <p className="font-semibold text-white">{message}</p>
      <Button className="mt-4" icon={RefreshCw} onClick={onRetry}>Réessayer</Button>
    </div>
  );
}

export default function AchatsReceptionsPageV2() {
  const { user } = useAuth();
  const { depotId, depotActif } = useDepot();
  const notif = useNotif();
  const qc = useQueryClient();
  const [tab, setTab] = useState('commandes');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [receptionIdempotencyKey, setReceptionIdempotencyKey] = useState(null);
  const [cmd, setCmd] = useState({ fournisseurId: '', note: '', lignes: [] });
  const [rec, setRec] = useState({ fournisseurId: '', modePaiement: 'CASH', montantPaye: 0, numBordereau: '', note: '', lignes: [] });

  const enabled = Boolean(depotId);
  const canManage = ['PATRON', 'GERANT', 'MAGASINIER', 'COMPTABLE'].includes(user?.role) || user?.isSuperAdmin === true;
  const isPatron = user?.role === 'PATRON' || user?.isSuperAdmin === true;

  const suppliers = useQuery({ queryKey: ['achats-fournisseurs', depotId], queryFn: achatsApi.getFournisseurs, enabled, staleTime: 30000 });
  const articles = useQuery({ queryKey: ['achats-articles', depotId], queryFn: achatsApi.getArticles, enabled, staleTime: 30000 });
  const commands = useQuery({ queryKey: ['achats-commandes', depotId], queryFn: achatsApi.getCommandes, enabled: enabled && canManage, staleTime: 15000 });
  const receptions = useQuery({ queryKey: ['achats-receptions', depotId], queryFn: achatsApi.getReceptions, enabled: enabled && canManage, staleTime: 15000 });
  const suggestions = useQuery({ queryKey: ['achats-suggestions', depotId], queryFn: achatsApi.getSuggestions, enabled: enabled && canManage, staleTime: 30000 });

  const fournisseurs = useMemo(() => list(suppliers.data), [suppliers.data]);
  const articleList = useMemo(() => list(articles.data), [articles.data]);
  const commandList = useMemo(() => list(commands.data), [commands.data]);
  const receptionList = useMemo(() => list(receptions.data), [receptions.data]);
  const suggestionList = useMemo(() => list(suggestions.data), [suggestions.data]);
  const term = search.trim().toLowerCase();
  const filteredCommands = commandList.filter((c) => !term || [c.reference, c.statut, c.fournisseur?.nom].filter(Boolean).some((v) => String(v).toLowerCase().includes(term)));
  const filteredReceptions = receptionList.filter((r) => !term || [r.reference, r.numBordereau, r.fournisseur?.nom].filter(Boolean).some((v) => String(v).toLowerCase().includes(term)));

  const invalidate = () => {
    ['achats-commandes', 'achats-receptions', 'achats-suggestions', 'achats-fournisseurs', 'achats-articles', 'depot-dashboard', 'depot-stock'].forEach((queryKey) => {
      qc.invalidateQueries({ queryKey: [queryKey] });
    });
  };

  const createCommand = useMutation({
    mutationFn: achatsApi.createCommande,
    onSuccess: () => { invalidate(); setModal(null); notif.success('Commande fournisseur créée.'); },
    onError: (error) => notif.error(error?.response?.data?.message || 'Impossible de créer la commande.'),
  });
  const updateCommand = useMutation({
    mutationFn: ({ id, payload }) => achatsApi.updateCommande(id, payload),
    onSuccess: () => { invalidate(); setModal(null); notif.success('Commande mise à jour.'); },
    onError: (error) => notif.error(error?.response?.data?.message || 'Impossible de mettre à jour la commande.'),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => achatsApi.updateCommandeStatut(id, status),
    onSuccess: () => { invalidate(); notif.success('Statut de la commande mis à jour.'); },
    onError: (error) => notif.error(error?.response?.data?.message || 'Transition refusée.'),
  });
  const createReception = useMutation({
    mutationFn: ({ payload, key }) => achatsApi.createReception(payload, key),
    onSuccess: () => {
      invalidate();
      setModal(null);
      setReceptionIdempotencyKey(null);
      notif.success('Réception enregistrée. Stock et dette fournisseur mis à jour.');
    },
    onError: (error) => notif.error(error?.response?.data?.message || 'Impossible d’enregistrer la réception.'),
  });

  const openCommand = (suggestionsForCommand = []) => {
    const suggestedLines = suggestionsForCommand.map((suggestion) => ({
      articleId: suggestion.articleId,
      quantite: Math.max(1, Number(suggestion.seuilCritique || 1) - Number(suggestion.quantiteActuelle || 0)),
      prixAchatUnit: Number(suggestion.prixAchatEstime || 0),
    }));
    setTab('commandes');
    setCmd({ fournisseurId: fournisseurs[0]?.id || '', note: '', lignes: suggestedLines });
    setModal('new-command');
  };

  const openReception = () => {
    setRec({ fournisseurId: fournisseurs[0]?.id || '', modePaiement: 'CASH', montantPaye: 0, numBordereau: '', note: '', lignes: [] });
    setReceptionIdempotencyKey(newKey());
    setModal('new-reception');
  };

  const add = (setter, line) => setter((form) => ({ ...form, lignes: [...form.lignes, line] }));
  const update = (setter, index, field, value) => setter((form) => ({ ...form, lignes: form.lignes.map((line, i) => i === index ? { ...line, [field]: value } : line) }));
  const remove = (setter, index) => setter((form) => ({ ...form, lignes: form.lignes.filter((_, i) => i !== index) }));

  const submitCommand = () => {
    if (createCommand.isPending) return;
    if (!cmd.fournisseurId || !cmd.lignes.length) return notif.error('Sélectionnez un fournisseur et au moins un article.');
    const ids = cmd.lignes.map((line) => line.articleId);
    if (cmd.lignes.some((line) => !line.articleId || !Number.isInteger(Number(line.quantite)) || Number(line.quantite) < 1 || !Number.isFinite(Number(line.prixAchatUnit)) || Number(line.prixAchatUnit) < 0)) return notif.error('Vérifiez les lignes de la commande.');
    if (new Set(ids).size !== ids.length) return notif.error('Un article ne peut apparaître qu’une seule fois dans une commande.');
    createCommand.mutate({ reference: newReference(), fournisseurId: cmd.fournisseurId, note: cmd.note.trim() || undefined, lignes: cmd.lignes.map((line) => ({ articleId: line.articleId, quantite: Number(line.quantite), prixAchatUnit: Number(line.prixAchatUnit) })) });
  };

  const total = rec.lignes.reduce((sum, line) => sum + Number(line.quantiteLivree || 0) * Number(line.prixAchatUnitaire || 0), 0);
  const paid = Number(rec.montantPaye || 0);
  const debt = Math.max(0, total - paid);

  const submitReception = () => {
    if (createReception.isPending) return;
    if (!receptionIdempotencyKey) setReceptionIdempotencyKey(newKey());
    if (!rec.fournisseurId || !rec.lignes.length) return notif.error('Sélectionnez un fournisseur et au moins un article.');
    const ids = rec.lignes.map((line) => line.articleId);
    if (rec.lignes.some((line) => !line.articleId || !Number.isInteger(Number(line.quantiteLivree)) || Number(line.quantiteLivree) < 1 || !Number.isInteger(Number(line.quantiteGratuite)) || Number(line.quantiteGratuite) < 0 || !Number.isFinite(Number(line.prixAchatUnitaire)) || Number(line.prixAchatUnitaire) < 0)) return notif.error('Vérifiez les lignes de la réception.');
    if (new Set(ids).size !== ids.length) return notif.error('Un article ne peut apparaître qu’une seule fois dans une réception.');
    if (paid > total) return notif.error('Le montant payé ne peut pas dépasser le total.');
    if (rec.modePaiement === 'CREDIT' && paid !== 0) return notif.error('Une réception en crédit ne peut pas avoir de paiement immédiat.');
    const idem = receptionIdempotencyKey || newKey();
    setReceptionIdempotencyKey(idem);
    createReception.mutate({ key: idem, payload: { fournisseurId: rec.fournisseurId, modePaiement: rec.modePaiement, montantPaye: paid, lignes: rec.lignes.map((line) => ({ articleId: line.articleId, quantiteLivree: Number(line.quantiteLivree), quantiteGratuite: Number(line.quantiteGratuite || 0), prixAchatUnitaire: Number(line.prixAchatUnitaire), unite: line.unite })), numBordereau: rec.numBordereau.trim() || undefined, note: rec.note.trim() || undefined } });
  };

  if (!enabled) return <div className="p-8"><div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center"><AlertTriangle className="mx-auto mb-3 text-amber-300" size={28} /><h2 className="font-bold text-white">Aucun dépôt actif</h2><p className="mt-1 text-sm text-slate-400">Sélectionnez un dépôt avant de gérer les achats et réceptions.</p></div></div>;
  if (!canManage) return <div className="p-8"><div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center"><AlertTriangle className="mx-auto mb-3 text-red-300" size={28} /><h2 className="font-bold text-white">Accès restreint</h2><p className="mt-1 text-sm text-slate-400">Votre rôle ne permet pas de gérer les achats et réceptions.</p></div></div>;

  const loading = suppliers.isLoading || articles.isLoading || commands.isLoading || receptions.isLoading;
  const queryError = suppliers.isError || articles.isError || commands.isError || receptions.isError;
  if (queryError && !loading) return <div className="space-y-6 p-4 sm:p-6"><QueryError message="Impossible de charger les données d'approvisionnement." onRetry={invalidate} /></div>;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-300"><ShoppingCart size={18} /><span className="text-xs font-bold uppercase tracking-[0.18em]">Achats & réceptions</span></div>
          <h1 className="mt-1 text-2xl font-black text-white">Approvisionnements</h1>
          <p className="mt-1 text-sm text-slate-400">Dépôt actif : <span className="font-semibold text-slate-200">{depotActif?.nom || 'Dépôt sélectionné'}</span></p>
        </div>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher…" aria-label="Rechercher dans les achats" className="control pl-9 sm:w-72" /></div>
          <Button icon={RefreshCw} onClick={invalidate} disabled={loading}>Actualiser</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3"><Summary label="Commandes" value={commandList.length} /><Summary label="Réceptions" value={receptionList.length} /><Summary label="Articles à réapprovisionner" value={suggestionList.length} emphasis /></div>

      {suggestionList.length > 0 && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-bold text-white">Suggestions de réapprovisionnement</h2><p className="text-xs text-slate-400">Les lignes proposées seront préremplies dans la commande.</p></div><Button variant="ghost" icon={FilePlus2} onClick={() => openCommand(suggestionList)}>Créer depuis les suggestions</Button></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{suggestionList.slice(0, 8).map((suggestion) => <div key={suggestion.articleId} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><p className="truncate text-sm font-semibold text-white">{suggestion.designation}</p><p className="mt-1 text-xs text-slate-500">Stock {suggestion.quantiteActuelle} / seuil {suggestion.seuilCritique}</p></div>)}</div></div>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800"><div className="flex gap-1"><button type="button" onClick={() => setTab('commandes')} className={`border-b-2 px-4 py-3 text-sm font-bold ${tab === 'commandes' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500'}`}>Commandes fournisseurs</button><button type="button" onClick={() => setTab('receptions')} className={`border-b-2 px-4 py-3 text-sm font-bold ${tab === 'receptions' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500'}`}>Réceptions</button></div><Button variant={tab === 'commandes' ? 'primary' : 'success'} icon={tab === 'commandes' ? FilePlus2 : PackageCheck} onClick={tab === 'commandes' ? () => openCommand() : openReception}>{tab === 'commandes' ? 'Nouvelle commande' : 'Nouvelle réception'}</Button></div>

      {loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-800/60" />)}</div> : tab === 'commandes' ? <CommandTable rows={filteredCommands} isPatron={isPatron} statusMutation={statusMutation} onDetail={async (row) => { try { setSelected(await achatsApi.getCommande(row.id)); setModal('command-detail'); } catch (error) { notif.error(error?.response?.data?.message || 'Impossible de charger la commande.'); } }} /> : <ReceptionTable rows={filteredReceptions} onDetail={(row) => { setSelected(row); setModal('reception-detail'); }} />}

      {modal === 'new-command' && <Modal title="Nouvelle commande fournisseur" icon={ShoppingCart} onClose={() => !createCommand.isPending && setModal(null)} wide><CommandForm form={cmd} setForm={setCmd} fournisseurs={fournisseurs} articles={articleList} addLine={() => add(setCmd, { articleId: '', quantite: 1, prixAchatUnit: 0 })} updateLine={(i, k, v) => update(setCmd, i, k, v)} removeLine={(i) => remove(setCmd, i)} onSubmit={submitCommand} loading={createCommand.isPending} /></Modal>}
      {modal === 'new-reception' && <Modal title="Nouvelle réception" icon={PackageCheck} onClose={() => !createReception.isPending && setModal(null)} wide><ReceptionForm form={rec} setForm={setRec} fournisseurs={fournisseurs} articles={articleList} addLine={() => add(setRec, { articleId: '', quantiteLivree: 1, quantiteGratuite: 0, prixAchatUnitaire: 0, unite: 'PIECE' })} updateLine={(i, k, v) => update(setRec, i, k, v)} removeLine={(i) => remove(setRec, i)} total={total} debt={debt} onSubmit={submitReception} loading={createReception.isPending} /></Modal>}
      {modal === 'command-detail' && selected && <Modal title={`Commande ${selected.reference}`} icon={ClipboardList} onClose={() => setModal(null)} wide><CommandDetail command={selected} isPatron={isPatron} onEdit={() => setModal('edit-command')} onStatus={(status) => statusMutation.mutate({ id: selected.id, status })} loading={statusMutation.isPending} /></Modal>}
      {modal === 'edit-command' && selected && <Modal title={`Modifier ${selected.reference}`} icon={ClipboardList} onClose={() => !updateCommand.isPending && setModal(null)}><EditCommand command={selected} onSubmit={(payload) => updateCommand.mutate({ id: selected.id, payload })} loading={updateCommand.isPending} /></Modal>}
      {modal === 'reception-detail' && selected && <Modal title={`Réception ${selected.reference}`} icon={PackageCheck} onClose={() => setModal(null)} wide><ReceptionDetail reception={selected} /></Modal>}
    </div>
  );
}

function CommandTable({ rows, isPatron, statusMutation, onDetail }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">{rows.length ? rows.map((command) => <div key={command.id} className="grid gap-3 border-b border-slate-800/80 px-4 py-4 last:border-0 md:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_1fr] md:items-center"><div><p className="font-semibold text-white">{command.reference}</p><p className="text-xs text-slate-500">{command.lignes?.length || 0} ligne(s)</p></div><p className="text-sm text-slate-300">{command.fournisseur?.nom || '-'}</p><span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_CLASS[command.statut] || STATUS_CLASS.BROUILLON}`}>{STATUS[command.statut] || command.statut}</span><p className="text-sm font-bold text-white">{money(command.total)}</p><div className="flex gap-2 md:justify-end"><Button variant="ghost" icon={Eye} onClick={() => onDetail(command)}>Détail</Button>{isPatron && command.statut === 'BROUILLON' && <Button variant="primary" icon={Send} disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: command.id, status: 'ENVOYE' })}>Envoyer</Button>}</div></div>) : <Empty icon={ClipboardList} title="Aucune commande" text="Créez une première commande fournisseur." />}</div>;
}

function ReceptionTable({ rows, onDetail }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">{rows.length ? rows.map((reception) => <div key={reception.id} className="grid gap-3 border-b border-slate-800/80 px-4 py-4 last:border-0 md:grid-cols-[1.2fr_1fr_0.9fr_0.9fr_1fr] md:items-center"><div><p className="font-semibold text-white">{reception.reference}</p><p className="text-xs text-slate-500">{reception.numBordereau ? `Bordereau ${reception.numBordereau}` : `${reception.lignes?.length || 0} ligne(s)`}</p></div><p className="text-sm text-slate-300">{reception.fournisseur?.nom || '-'}</p><p className="text-sm text-slate-400">{reception.createdAt ? new Date(reception.createdAt).toLocaleDateString('fr-FR') : '-'}</p><p className="text-sm font-bold text-amber-300">{money(reception.montantDette)}</p><div className="flex gap-2 md:justify-end"><Button variant="ghost" icon={Eye} onClick={() => onDetail(reception)}>Détail</Button><Button variant="ghost" icon={ClipboardList} onClick={() => window.print()}>Imprimer</Button></div></div>) : <Empty icon={PackageCheck} title="Aucune réception" text="Enregistrez la première livraison reçue." />}</div>;
}

function LineHeader({ title, onAdd }) {
  return <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-white">{title}</h3><Button variant="ghost" icon={Plus} onClick={onAdd}>Ajouter une ligne</Button></div>;
}

function CommandForm({ form, setForm, fournisseurs, articles, addLine, updateLine, removeLine, onSubmit, loading }) {
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><Field label="Fournisseur" required><select value={form.fournisseurId} onChange={(event) => setForm((current) => ({ ...current, fournisseurId: event.target.value }))} className="control"><option value="">Sélectionner un fournisseur</option>{fournisseurs.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.nom}</option>)}</select></Field><Field label="Note"><input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} maxLength={500} className="control" /></Field></div><LineHeader title="Articles à commander" onAdd={addLine} />{form.lignes.map((line, index) => <div key={`${line.articleId || 'new'}-${index}`} className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 md:grid-cols-[1fr_120px_150px_42px]"><select value={line.articleId} onChange={(event) => updateLine(index, 'articleId', event.target.value)} className="control"><option value="">Article</option>{articles.map((article) => <option key={article.id} value={article.id}>{article.designation}</option>)}</select><input type="number" min="1" step="1" value={line.quantite} onChange={(event) => updateLine(index, 'quantite', event.target.value)} className="control" placeholder="Qté" /><input type="number" min="0" step="0.01" value={line.prixAchatUnit} onChange={(event) => updateLine(index, 'prixAchatUnit', event.target.value)} className="control" placeholder="Prix" /><button type="button" onClick={() => removeLine(index)} className="rounded-xl border border-red-500/20 text-red-300 hover:bg-red-500/10" aria-label="Supprimer la ligne"><Trash2 size={16} className="mx-auto" /></button></div>)}{!form.lignes.length && <Empty icon={Plus} title="Aucune ligne" text="Ajoutez au moins un article." />}<div className="flex justify-end border-t border-slate-800 pt-4"><Button variant="primary" icon={CheckCircle2} disabled={loading || !form.lignes.length} onClick={onSubmit}>{loading ? 'Enregistrement…' : 'Créer la commande'}</Button></div></div>;
}

function ReceptionForm({ form, setForm, fournisseurs, articles, addLine, updateLine, removeLine, total, debt, onSubmit, loading }) {
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><Field label="Fournisseur" required><select value={form.fournisseurId} onChange={(event) => setForm((current) => ({ ...current, fournisseurId: event.target.value }))} className="control"><option value="">Sélectionner un fournisseur</option>{fournisseurs.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.nom}</option>)}</select></Field><Field label="Mode de paiement"><select value={form.modePaiement} onChange={(event) => setForm((current) => ({ ...current, modePaiement: event.target.value, montantPaye: event.target.value === 'CREDIT' ? 0 : current.montantPaye }))} className="control">{PAYMENTS.map((payment) => <option key={payment.value} value={payment.value}>{payment.label}</option>)}</select></Field><Field label="N° bordereau"><input value={form.numBordereau} onChange={(event) => setForm((current) => ({ ...current, numBordereau: event.target.value }))} maxLength={100} className="control" /></Field><Field label="Montant payé"><input type="number" min="0" step="0.01" disabled={form.modePaiement === 'CREDIT'} value={form.montantPaye} onChange={(event) => setForm((current) => ({ ...current, montantPaye: event.target.value }))} className="control" /></Field></div><LineHeader title="Articles reçus" onAdd={addLine} />{form.lignes.map((line, index) => <div key={`${line.articleId || 'new'}-${index}`} className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 md:grid-cols-[1.3fr_90px_90px_140px_130px_42px]"><select value={line.articleId} onChange={(event) => updateLine(index, 'articleId', event.target.value)} className="control"><option value="">Article</option>{articles.map((article) => <option key={article.id} value={article.id}>{article.designation}</option>)}</select><input type="number" min="1" step="1" value={line.quantiteLivree} onChange={(event) => updateLine(index, 'quantiteLivree', event.target.value)} className="control" placeholder="Livrée" /><input type="number" min="0" step="1" value={line.quantiteGratuite} onChange={(event) => updateLine(index, 'quantiteGratuite', event.target.value)} className="control" placeholder="Gratuite" /><input type="number" min="0" step="0.01" value={line.prixAchatUnitaire} onChange={(event) => updateLine(index, 'prixAchatUnitaire', event.target.value)} className="control" placeholder="Prix" /><select value={line.unite} onChange={(event) => updateLine(index, 'unite', event.target.value)} className="control">{UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select><button type="button" onClick={() => removeLine(index)} className="rounded-xl border border-red-500/20 text-red-300 hover:bg-red-500/10" aria-label="Supprimer la ligne"><Trash2 size={16} className="mx-auto" /></button></div>)}{!form.lignes.length && <Empty icon={Plus} title="Aucune ligne" text="Ajoutez au moins un article." />}<Field label="Note"><textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} maxLength={500} rows={3} className="control resize-none" /></Field><div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:grid-cols-3"><Summary label="Total réception" value={money(total)} /><Summary label="Montant payé" value={money(form.montantPaye)} /><Summary label="Dette fournisseur" value={money(debt)} emphasis /></div><div className="flex justify-end border-t border-slate-800 pt-4"><Button variant="success" icon={PackageCheck} disabled={loading || !form.lignes.length} onClick={onSubmit}>{loading ? 'Enregistrement…' : 'Valider la réception'}</Button></div></div>;
}

function CommandDetail({ command, isPatron, onEdit, onStatus, loading }) {
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-4"><Summary label="Fournisseur" value={command.fournisseur?.nom || '-'} /><Summary label="Statut" value={STATUS[command.statut] || command.statut} /><Summary label="Total" value={money(command.total)} /><Summary label="Date" value={command.dateCommande ? new Date(command.dateCommande).toLocaleDateString('fr-FR') : '-'} /></div><div className="overflow-hidden rounded-xl border border-slate-800">{(command.lignes || []).map((line) => <div key={line.id} className="grid grid-cols-[1fr_100px_140px] gap-3 border-b border-slate-800/70 px-4 py-3 text-sm"><span className="text-slate-200">{line.article?.designation || line.articleId}</span><span>{line.quantite}</span><span>{money(line.prixAchatUnit)}</span></div>)}</div>{command.note && <div className="rounded-xl bg-slate-950/40 p-4 text-sm text-slate-400">{command.note}</div>}<div className="flex flex-wrap justify-end gap-2">{command.statut === 'BROUILLON' && <Button icon={ClipboardList} onClick={onEdit}>Modifier</Button>}{isPatron && command.statut === 'BROUILLON' && <Button variant="primary" icon={Send} disabled={loading} onClick={() => onStatus('ENVOYE')}>Envoyer</Button>}{isPatron && command.statut === 'ENVOYE' && <Button variant="success" icon={CheckCircle2} disabled={loading} onClick={() => onStatus('RECU')}>Marquer reçue</Button>}{isPatron && ['BROUILLON', 'ENVOYE'].includes(command.statut) && <Button variant="warning" icon={X} disabled={loading} onClick={() => onStatus('ANNULE')}>Annuler</Button>}</div></div>;
}

function EditCommand({ command, onSubmit, loading }) {
  const [note, setNote] = useState(command.note || '');
  const [date, setDate] = useState(command.dateReceptionPrev ? new Date(command.dateReceptionPrev).toISOString().slice(0, 10) : '');
  return <div className="space-y-4"><Field label="Date de réception prévue"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="control" /></Field><Field label="Note"><textarea rows={4} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className="control resize-none" /></Field><div className="flex justify-end"><Button variant="primary" icon={CheckCircle2} disabled={loading} onClick={() => onSubmit({ note, dateReceptionPrev: date ? new Date(`${date}T12:00:00`).toISOString() : undefined })}>{loading ? 'Enregistrement…' : 'Enregistrer'}</Button></div></div>;
}

function ReceptionDetail({ reception }) {
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-4"><Summary label="Fournisseur" value={reception.fournisseur?.nom || '-'} /><Summary label="Paiement" value={PAYMENTS.find((payment) => payment.value === reception.modePaiement)?.label || reception.modePaiement} /><Summary label="Payé" value={money(reception.montantPaye)} /><Summary label="Dette" value={money(reception.montantDette)} emphasis /></div><div className="overflow-hidden rounded-xl border border-slate-800">{(reception.lignes || []).map((line) => <div key={line.id} className="grid grid-cols-[1fr_90px_90px_120px_120px] gap-3 border-b border-slate-800/70 px-4 py-3 text-sm"><span className="text-slate-200">{line.article?.designation || line.articleId}</span><span>{line.quantiteLivree}</span><span>{line.quantiteGratuite}</span><span>{line.uniteUsed}</span><span>{money(line.prixAchatUnitaire)}</span></div>)}</div>{reception.numBordereau && <p className="text-sm text-slate-400">Bordereau : <span className="font-semibold text-slate-200">{reception.numBordereau}</span></p>}{reception.note && <div className="rounded-xl bg-slate-950/40 p-4 text-sm text-slate-400">{reception.note}</div>}</div>;
}
