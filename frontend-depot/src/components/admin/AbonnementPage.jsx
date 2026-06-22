import { useAuth } from '../../contexts/AuthContext';

// En local, ton site vitrine tourne sur le port 3001
// En production, ce sera remplacé par l'URL de ton choix via le .env
const SITE_VITRINE_TARIFS_URL = import.meta.env.VITE_SITE_VITRINE_URL || 'http://localhost:3001/#/tarifs';

export default function AbonnementPage() {
  const { user } = useAuth();

  const handleRedirect = () => {
    if (user?.tenantId) {
      // 🚀 TRANSMISSION RÉELLE : On envoie le vrai tenantId et l'email au site vitrine
      const urlParametree = `${SITE_VITRINE_TARIFS_URL}?tenantId=${user.tenantId}&email=${encodeURIComponent(user.email)}`;
      window.location.href = urlParametree;
    } else {
      window.location.href = SITE_VITRINE_TARIFS_URL;
    }
  };

  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 text-center relative">
        
        <div className="text-6xl mb-4">💳</div>
        <h1 className="text-2xl font-black text-white mb-2">Abonnement</h1>
        <p className="text-slate-400 text-sm mb-6">
          Gerez votre formule d'abonnement et accédez à toutes les fonctionnalités de votre plan.
        </p>

        {/* Informations de profil */}
        <div className="bg-slate-900/50 rounded-xl p-4 mb-6 text-left text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Entreprise</span>
            <span className="text-white font-semibold">{user?.nomEntreprise || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Métier</span>
            <span className="text-white font-semibold">{user?.metier || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Statut</span>
            <span className="text-emerald-400 font-semibold">{user?.statutAbonnement || 'ACTIVE'}</span>
          </div>
        </div>

        {/* Bouton unique officiel : Lance le vrai tunnel de paiement */}
        <button 
          onClick={handleRedirect}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
        >
          🔗 Gérer mon abonnement
        </button>

        <p className="text-slate-600 text-xs mt-4">
          Vous serez redirigé vers notre portail de paiement sécurisé.
        </p>
      </div>
    </div>
  );
}