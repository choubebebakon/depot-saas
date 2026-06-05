import { useNavigate } from 'react-router-dom';
import { Boxes, ReceiptText, Truck, PackageCheck, ShieldCheck, BarChart3, Users, Repeat2, AlertTriangle, ArrowRight, Check, Warehouse } from 'lucide-react';

const features = [
  {
    icon: Boxes,
    color: '#6366f1',
    title: 'Gestion des Stocks Entrées / Sorties',
    desc: 'Chaque mouvement de marchandise est enregistré en temps réel. Du camion SABC qui décharge à la caisse du client qui repart avec ses casiers, rien n\'est perdu.',
    items: [
      'Réception fournisseur avec bon d\'entrée numérique',
      'Ventes comptoir : sortie automatique du stock',
      'Alertes de rupture paramétrables par produit',
      'Suivi des dates de péremption (DLC) lot par lot',
      'Historique complet avec utilisateur, heure et quantité',
    ],
  },
  {
    icon: Repeat2,
    color: '#f59e0b',
    title: 'Suivi des Casiers Consignés',
    desc: 'Le point le plus douloureux du métier. GeStock crée un vrai portefeuille consigne : vous savez à tout moment qui vous doit combien de vides, et vous ne perdez plus d\'argent sur le verre.',
    items: [
      'Enregistrement de la consigne à chaque vente',
      'Portefeuille "vides dus" par client',
      'Retours de bouteilles : déduction automatique',
      'Alerte sur les clients à forte dette de consigne',
      'Rapport mensuel de pertes sur consignes',
    ],
  },
  {
    icon: ReceiptText,
    color: '#10b981',
    title: 'Facturation Rapide au Comptoir',
    desc: 'Une facture en 30 secondes, avec votre logo, envoyée par WhatsApp. Vos clients professionnels reçoivent leurs reçus instantanément. Fini le carnet de reçus à la main.',
    items: [
      'Facture générée en 30 secondes',
      'Envoi direct par WhatsApp ou SMS',
      'Gestion des ventes à crédit (clients fidèles)',
      'Caisse journalière avec récapitulatif automatique',
      'Export PDF pour la comptabilité',
    ],
  },
  {
    icon: ShieldCheck,
    color: '#8b5cf6',
    title: 'Multi-Dépôts avec Isolation des Données',
    desc: 'Gérez plusieurs points de vente depuis un seul compte. Les données de chaque dépôt sont strictement isolées : votre gérant de Bonabéri ne voit pas les stocks de votre dépôt de Bonanjo.',
    items: [
      'Tableau de bord centralisé multi-sites',
      'Isolation totale des données par dépôt',
      'Transferts inter-dépôts traçables',
      'Permissions par rôle et par dépôt',
      'Consolidation des rapports groupe',
    ],
  },
  {
    icon: Truck,
    color: '#06b6d4',
    title: 'Gestion des Livraisons & Tournées',
    desc: 'Chargez votre tricycle ou camion, assignez un chauffeur, suivez la tournée et récupérez la recette en fin de journée. Tout est traçable.',
    items: [
      'Bon de chargement par tournée',
      'Suivi du carburant consommé',
      'Versement de recette en fin de journée',
      'Confirmation de livraison numérique',
      'Retours de bouteilles vides intégrés',
    ],
  },
  {
    icon: BarChart3,
    color: '#f43f5e',
    title: 'Rapports & Statistiques',
    desc: 'Tableau de bord analytique pour piloter votre business. Sachez quelle marque vous rapporte le plus, quel client vous achète le plus, et quand votre pic d\'activité se produit.',
    items: [
      'Bénéfice net par marque de boisson',
      'Classement des meilleurs clients',
      'Évolution des ventes par période',
      'Rapport de rentabilité mensuel',
      'Export Excel et PDF',
    ],
  },
];

export default function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #080812 0%, #0d1117 100%)', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
        .feat-card { transition: transform 0.3s, box-shadow 0.3s; }
        .feat-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,0.4); }
        .cta-btn { transition: all 0.2s; cursor: pointer; border: none; }
        .cta-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
      `}</style>

      {/* Header Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(8,8,18,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 64 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 800, fontSize: 18 }}>
          <Warehouse size={22} color="#6366f1" /> GeStock
        </button>
        <button onClick={() => navigate('/register')} className="cta-btn" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '10px 22px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>
          Essai gratuit 30 jours
        </button>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, textAlign: 'center', animation: 'fadeUp 0.6s ease', maxWidth: 900, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '6px 18px', marginBottom: 24 }}>
          <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Fonctionnalités</span>
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: -2 }}>
          Tout ce qu'il faut pour gérer<br />
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>votre dépôt de boissons</span>
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          Conçu par des professionnels du secteur boissons au Cameroun. Chaque fonctionnalité répond à un vrai problème de terrain.
        </p>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 100px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28 }}>
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <article key={i} className="feat-card" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 24, padding: 32,
              animation: `fadeUp ${0.3 + i * 0.08}s ease`,
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${feat.color}22`, border: `1px solid ${feat.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Icon size={24} color={feat.color} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#f1f5f9' }}>{feat.title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>{feat.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feat.items.map((item, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#94a3b8' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${feat.color}22`, border: `1px solid ${feat.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Check size={11} color={feat.color} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)', margin: '0 24px 80px', borderRadius: 32, padding: '60px 40px', textAlign: 'center', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>Prêt à tester GeStock ?</h2>
        <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 32 }}>30 jours gratuits, toutes les fonctionnalités, sans carte bancaire.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/register')} className="cta-btn" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '16px 32px', borderRadius: 14, fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Commencer gratuitement <ArrowRight size={18} />
          </button>
          <button onClick={() => navigate('/pricing')} className="cta-btn" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '16px 32px', borderRadius: 14, fontWeight: 700, fontSize: 16 }}>
            Voir les tarifs
          </button>
        </div>
      </section>
    </div>
  );
}
