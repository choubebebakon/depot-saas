import { useNavigate } from 'react-router-dom';

export default function CguPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', fontFamily: "'Inter', sans-serif", paddingTop: 100, paddingBottom: 100 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16 }}>Conditions Générales d'Utilisation</h1>
        <p style={{ color: '#94a3b8', marginBottom: 48 }}>Dernière mise à jour : 14 Mai 2026 · Version 1.0</p>

        <div style={{ lineHeight: 1.8, color: '#cbd5e1' }}>
          <h2 style={{ color: '#fff', fontSize: 24, marginTop: 40, marginBottom: 16 }}>1. Objet</h2>
          <p>Les présentes CGU ont pour objet de définir les modalités de mise à disposition du service GeStock SaaS.</p>

          <h2 style={{ color: '#fff', fontSize: 24, marginTop: 40, marginBottom: 16 }}>2. Abonnement et Paiement</h2>
          <p>L'accès au service est subordonné à la souscription d'un plan. Les paiements s'effectuent via MTN MoMo, Orange Money ou Carte Bancaire. En cas de défaut de paiement, l'accès est restreint après une période de grâce de 3 jours.</p>

          <h2 style={{ color: '#fff', fontSize: 24, marginTop: 40, marginBottom: 16 }}>3. Propriété des Données</h2>
          <p>Le Client reste propriétaire de l'ensemble des données de stock et de vente saisies sur la plateforme. GeStock s'engage à assurer l'isolation des données entre les différents tenants.</p>

          <h2 style={{ color: '#fff', fontSize: 24, marginTop: 40, marginBottom: 16 }}>4. Responsabilité</h2>
          <p>GeStock s'efforce d'assurer une disponibilité du service de 99.9%. Toutefois, nous ne saurions être tenus responsables des interruptions liées aux opérateurs mobiles camerounais (Campay, MTN, Orange).</p>
        </div>

        <button onClick={() => navigate(-1)} style={{ marginTop: 64, background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Retour</button>
      </div>
    </div>
  );
}
