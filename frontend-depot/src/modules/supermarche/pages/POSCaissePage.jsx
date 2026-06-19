import { useDepot } from '../../../contexts/DepotContext';
import POSSupermarcheForm from '../forms/POSSupermarcheForm';

export default function POSCaissePage() {
  const depot = useDepot();
  const depotId = depot?.depotId ?? null;

  if (!depotId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center space-y-3">
          <p className="text-4xl">🏪</p>
          <p className="text-white font-bold text-lg">Aucun dépôt sélectionné</p>
          <p className="text-slate-400 text-sm">
            Sélectionnez un dépôt actif depuis le menu principal pour accéder à la caisse.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <POSSupermarcheForm metier="supermarche" depotId={depotId} />
    </div>
  );
}