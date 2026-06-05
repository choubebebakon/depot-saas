import { useAuth } from '../../contexts/AuthContext';

const ABONNEMENT_URL = import.meta.env.VITE_ABONNEMENT_URL || 'https://gestock.app/tarifs';

export default function AbonnementPage() {
  const { user } = useAuth();

  const handleRedirect = () => {
    window.location.href = ABONNEMENT_URL;
  };

  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">💳</div>
        <h1 className="text-2xl font-black text-white mb-2">Abonnement</h1>
        <p className="text-slate-400 text-sm mb-6">
          Gérez votre formule d'abonnement et accédez à toutes les fonctionnalités de votre plan.
        </p>

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

        <button onClick={handleRedirect}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
          🔗 Gérer mon abonnement
        </button>

        <p className="text-slate-600 text-xs mt-4">
          Vous serez redirigé vers notre portail de paiement sécurisé.
        </p>
      </div>
    </div>
  );
}
