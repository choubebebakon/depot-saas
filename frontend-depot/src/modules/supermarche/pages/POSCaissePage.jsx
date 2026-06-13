import { useDepot } from '../../../contexts/DepotContext';
import POSSupermarcheForm from '../forms/POSSupermarcheForm';

export default function POSCaissePage() {
  const { depotId } = useDepot();

  return (
    <div className="p-6">
      <POSSupermarcheForm metier="supermarche" depotId={depotId} />
    </div>
  );
}
