import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PLANS = {
  SOLO: {
    name: 'SOLO',
    price: 5000,
    currency: 'XAF',
    features: ['1 Dépôt', 'Utilisateurs illimités', 'Support email'],
    popular: false,
  },
  PME: {
    name: 'PME',
    price: 15000,
    currency: 'XAF',
    features: ['3 Dépôts', 'Utilisateurs illimités', 'Support prioritaire', 'Rapports avancés'],
    popular: true,
  },
  PREMIUM: {
    name: 'PREMIUM',
    price: 25000,
    currency: 'XAF',
    features: ['5 Dépôts', 'Utilisateurs illimités', 'Support 24/7', 'Rapports avancés', 'API accès'],
    popular: false,
  },
};

const PAYMENT_CHANNELS = [
  { id: 'cm.orange', name: 'Orange Money', icon: '🟠' },
  { id: 'cm.mtn', name: 'MTN Mobile Money', icon: '🟡' },
  { id: 'card', name: 'Carte Visa/Mastercard', icon: '💳' },
];

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000/api/v1';

export default function TarifsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const tenantId = searchParams.get('tenantId');
  const email = searchParams.get('email');
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState('cm.orange');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!tenantId || !email) {
      setError('Informations manquantes. Veuillez vous reconnecter depuis l\'application.');
    }
  }, [tenantId, email]);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setError(null);
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      setError('Veuillez sélectionner un plan.');
      return;
    }
    if (!tenantId || !email) {
      setError('Informations manquantes. Veuillez vous reconnecter depuis l\'application.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_API_URL}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          email,
          plan: selectedPlan.name,
          amount: selectedPlan.price,
          currency: selectedPlan.currency,
          channel: selectedChannel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'initialisation du paiement');
      }

      // Redirect to NotchPay authorization URL
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du paiement');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-black text-white mb-2">Paiement en cours</h1>
          <p className="text-slate-400 text-sm mb-6">Vous allez être redirigé vers NotchPay pour effectuer votre paiement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-slate-400 text-lg">
            Sélectionnez la formule adaptée à vos besoins
          </p>
          {tenantId && email && (
            <p className="text-emerald-400 text-sm mt-2">
              Connecté en tant que : {email}
            </p>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.name}
              onClick={() => handlePlanSelect(plan)}
              className={`relative bg-slate-800/60 border rounded-2xl p-6 cursor-pointer transition-all ${
                selectedPlan?.name === plan.name
                  ? 'border-amber-500 ring-2 ring-amber-500/50'
                  : 'border-slate-700/50 hover:border-slate-600'
              } ${plan.popular ? 'ring-2 ring-emerald-500/50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAIRE
                </div>
              )}
              <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-black text-white">{plan.price.toLocaleString('fr-FR')}</span>
                <span className="text-slate-400"> {plan.currency}/mois</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-slate-300 text-sm flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className={`text-center py-2 rounded-lg text-sm font-bold ${
                selectedPlan?.name === plan.name
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {selectedPlan?.name === plan.name ? '✓ Sélectionné' : 'Sélectionner'}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Channel Selection */}
        {selectedPlan && (
          <div className="max-w-2xl mx-auto bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Méthode de paiement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PAYMENT_CHANNELS.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedChannel === channel.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="text-3xl mb-2">{channel.icon}</div>
                  <div className="text-white font-bold text-sm">{channel.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment Button */}
        {selectedPlan && (
          <div className="max-w-md mx-auto text-center">
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold py-4 rounded-xl text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  🔒 Payer {selectedPlan.price.toLocaleString('fr-FR')} {selectedPlan.currency}
                </>
              )}
            </button>
            <p className="text-slate-500 text-xs mt-4">
              Paiement sécurisé via NotchPay • Orange Money, MTN Mobile Money, Visa/Mastercard
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 text-sm">
          <p>Besoin d'aide ? Contactez notre support à support@gestock.app</p>
        </div>
      </div>
    </div>
  );
}
