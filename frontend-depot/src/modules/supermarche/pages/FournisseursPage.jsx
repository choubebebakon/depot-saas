import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import FournisseurForm from '../../../shared/forms/FournisseurForm';

export default function FournisseursPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth, depotActif } = useAuth();
  const metier = metierParam || metierAuth || 'supermarche';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const { success } = useNotif();
  const perm = usePermission(PERMISSIONS, 'fournisseurs');

  const { data: fournisseursData = [], loading, error, refetch } = useData(
    `/${prefix}/fournisseurs`,
    { enabled: Boolean(prefix && depotActif?.id) },
  );

  const fournisseurs = useMemo(() => {
    const rawData = fournisseursData?.data || fournisseursData || [];
    return Array.isArray(rawData) ? rawData : [];
  }, [fournisseursData]);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filtres = fournisseurs.filter((item) => {
    if (!normalizedSearch) return true;
    return [item.nom, item.contact, item.telephone, item.email]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase().includes(normalizedSearch));
  });

  const { totalItems, paginatedData: paginated } = usePagination(filtres, 10);

  const openCreate = () => {
    setErrorMessage('');
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (fournisseur) => {
    setErrorMessage('');
    setEditItem(fournisseur);
    setFormOpen(true);
  };

  const handleFormSuccess = async () => {
    setFormOpen(false);
    setEditItem(null);
    setErrorMessage('');
    success(editItem ? 'Fournisseur mis à jour' : 'Fournisseur créé');
    await refetch();
  };

  if (!depotActif?.id) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center text-amber-300">
          Aucun dépôt actif n’est sélectionné. Sélectionnez un dépôt pour consulter les fournisseurs.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Fournisseurs</h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalItems} fournisseur{totalItems !== 1 ? 's' : ''}
          </p>
        </div>
        {perm.canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            + Nouveau fournisseur
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          aria-label="Rechercher un fournisseur"
          placeholder="Rechercher par nom, contact, email ou téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm w-full sm:w-96 outline-none focus:border-amber-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-slate-400 hover:text-white text-sm px-2 py-2"
          >
            Effacer
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300" role="alert">
          Impossible de charger les fournisseurs. Vérifiez votre connexion et réessayez.
          <button type="button" onClick={() => refetch()} className="ml-3 underline font-semibold">Réessayer</button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300" role="alert">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 rounded-xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : filtres.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-12 text-center">
          <p className="text-slate-300 font-semibold">
            {search ? 'Aucun fournisseur ne correspond à votre recherche.' : 'Aucun fournisseur enregistré.'}
          </p>
          {!search && perm.canCreate && (
            <button type="button" onClick={openCreate} className="mt-4 text-amber-400 hover:text-amber-300 font-semibold">
              Ajouter le premier fournisseur
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[760px]">
              <thead className="bg-slate-900/50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-4">Fournisseur</th>
                  <th className="px-5 py-4">Téléphone</th>
                  <th className="px-5 py-4">Dépôt</th>
                  <th className="px-5 py-4 text-right">Solde</th>
                  {(perm.canEdit || perm.canDelete) && <th className="px-5 py-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginated.map((fournisseur) => (
                  <tr key={fournisseur.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-semibold text-sm">{fournisseur.nom}</p>
                      {fournisseur.email && <p className="text-slate-400 text-xs font-mono">{fournisseur.email}</p>}
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-sm">{fournisseur.telephone || '-'}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-slate-300 bg-slate-700/50 px-2.5 py-1 rounded-lg">
                        {fournisseur.depot?.nom || 'Dépôt actif'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-orange-400 font-bold">
                      {new Intl.NumberFormat('fr-FR').format(Number(fournisseur.solde || 0))} FCFA
                    </td>
                    {(perm.canEdit || perm.canDelete) && (
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          {perm.canEdit && (
                            <button type="button" onClick={() => openEdit(fournisseur)} className="text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-700 text-sm">
                              Modifier
                            </button>
                          )}
                          {perm.canDelete && (
                            <span className="text-slate-500 text-xs self-center">Suppression via confirmation</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formOpen && (
        <FournisseurForm
          isOpen={formOpen}
          onClose={() => { setFormOpen(false); setEditItem(null); }}
          onSuccess={handleFormSuccess}
          edit={editItem}
          metier={prefix}
          depotId={depotActif.id}
        />
      )}
    </div>
  );
}
