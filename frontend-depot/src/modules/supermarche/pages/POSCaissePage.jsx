import { useState } from 'react';
import { useDepot } from '../../../contexts/DepotContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import POSSupermarcheForm from '../forms/POSSupermarcheForm';
import Receipt80mm from '../../../components/Receipt80mm';
import { Store } from 'lucide-react';

export default function POSCaissePage() {
  const depot = useDepot();
  const depotId = depot?.depotId ?? null;
  const { tenantId } = useAuth();
  const [printData, setPrintData] = useState(null);

  if (!depotId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center space-y-3">
          <p className="text-4xl"><Store className="w-12 h-12 mx-auto text-slate-500" /></p>
          <p className="text-white font-bold text-lg">Aucun dépôt sélectionné</p>
          <p className="text-slate-400 text-sm">
            Sélectionnez un dépôt actif depuis le menu principal pour accéder à la caisse.
          </p>
        </div>
      </div>
    );
  }

  const handleSuccess = async (createdVente) => {
    if (!createdVente) return;
    try {
      let tenantConfig = {};
      if (tenantId) {
        try {
          const t = await api.get(`/tenants/${tenantId}`);
          tenantConfig = t.data || {};
        } catch(e) {}
      }
      
      const config = {
        nomEntreprise: tenantConfig.nomEntreprise || "SUPERMARCHÉ",
        adresse: tenantConfig.adresse || "",
        telephone: tenantConfig.telephone || "",
        messageFin: "Merci de votre visite !",
        logo: tenantConfig.logo,
      };

      setPrintData({ vente: createdVente, config });
      setTimeout(() => {
        window.print();
        setTimeout(() => setPrintData(null), 1000);
      }, 500);
    } catch (e) {
      console.error("Erreur lors de l'impression", e);
    }
  };

  return (
    <div className="p-6">
      <POSSupermarcheForm metier="supermarche" depotId={depotId} onSuccess={handleSuccess} />
      <Receipt80mm vente={printData?.vente} config={printData?.config} />
    </div>
  );
}