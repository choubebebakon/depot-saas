import { useDepot } from '../../../contexts/DepotContext';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';
import VenteBoutiqueForm from '../forms/VenteBoutiqueForm';

export default function CaissePage() {
  const depotData = useDepot();
  const depotActif = depotData?.depotActif;
  const perm = usePermission(PERMISSIONS, 'caisse');

  if (!perm.canCreate) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-6 text-center">
          <p className="font-bold">Accès refusé</p>
          <p className="text-sm mt-2">Vous n'avez pas les permissions pour accéder à la caisse.</p>
        </div>
      </div>
    );
  }

  if (!depotActif) {
    return (
      <div className="p-6">
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl p-6 text-center">
          <p className="font-bold">Dépôt non sélectionné</p>
          <p className="text-sm mt-2">Veuillez sélectionner un dépôt pour accéder à la caisse.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Caisse POS</h1>
          <p className="text-slate-400 text-sm mt-1">Point de vente — {depotActif.nom}</p>
        </div>
      </div>
      <VenteBoutiqueForm depotId={depotActif.id} onSuccess={() => {}} />
    </div>
  );
}
