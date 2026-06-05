import { useNavigate } from 'react-router-dom';
import { Smartphone, QrCode, Truck, CheckCircle2, Wifi, Download, ArrowRight, Warehouse, Users, Package } from 'lucide-react';

const roles = [
  {
    icon: Truck,
    color: '#f59e0b',
    title: 'Chauffeur-Livreur',
    desc: 'L\'app devient le carnet de bord numérique du chauffeur. Plus de papier, plus de litige sur les quantités livrées.',
    actions: [
      'Voir son bon de chargement du jour',
      'Scanner le QR code du client à la livraison',
      'Confirmer les quantités livrées et les retours de vides',
      'Déclarer sa consommation de carburant',
      'Verser sa recette en fin de tournée',
    ],
  },
  {
    icon: Users,
    color: '#6366f1',
    title: 'Gérant / Propriétaire',
    desc: 'Gardez le contrôle de votre dépôt même quand vous n\'êtes pas sur place. Tout se passe sur votre téléphone.',
    actions: [
      'Tableau de bord en temps réel',
      'Valider les sorties de stock',
      'Suivre les tournées en cours',
      'Approuver les ventes à crédit',
      'Consulter les rapports du jour',
    ],
  },
  {
    icon: Package,
    color: '#10b981',
    title: 'Magasinier / Caissier',
    desc: 'Réception des livraisons fournisseur, gestion des entrées en stock et encaissement au comptoir.',
    actions: [
      'Enregistrer une réception fournisseur (SABC, Guinness…)',
      'Saisir une vente comptoir rapide',
      'Gérer les retours de consignes',
      'Consulter le stock disponible en temps réel',
      'Imprimer ou envoyer un reçu par WhatsApp',
    ],
  },
];

export default function MobileAppPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #080812 0%, #0d1117 100%)', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        .role-card { transition: transform 0.3s, box-shadow 0.3s; }
        .role-card:hover { transform: translateY(-6px); }
        .cta-btn { transition: all 0.2s; cursor: pointer; border: none; }
        .cta-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(8,8,18,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 64 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 800, fontSize: 18 }}>
          <Warehouse size={22} color="#6366f1" /> GeStock
        </button>
        <button onClick={() => navigate('/register')} className="cta-btn" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '10px 22px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>
          Essai gratuit
        </button>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 1100, margin: '0 auto', padding: '120px 24px 80px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 60, alignItems: 'center' }}>
        <div style={{ animation: 'fadeUp 0.6s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 100, padding: '6px 18px', marginBottom: 24 }}>
            <Smartphone size={14} color="#fbbf24" />
            <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Application Mobile</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: -2 }}>
            GeStock dans la poche<br />
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>de chaque acteur</span>
          </h1>
          <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32, maxWidth: 520 }}>
            Du gérant au chauffeur-livreur, en passant par le magasinier. Chaque membre de votre équipe a son interface adaptée sur Android. Les livraisons de casiers en ville ne laissent plus aucune trace papier.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} className="cta-btn" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', padding: '14px 28px', borderRadius: 14, fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={18} /> Télécharger l'app
            </button>
            <button onClick={() => navigate('/features')} className="cta-btn" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 16 }}>
              Voir les fonctionnalités
            </button>
          </div>
        </div>

        {/* Phone mockup */}
        <div style={{ animation: 'float 4s ease-in-out infinite', flexShrink: 0 }}>
          <div style={{ width: 200, height: 380, background: 'linear-gradient(160deg, #1e1b4b, #0f0f23)', border: '2px solid rgba(99,102,241,0.4)', borderRadius: 32, padding: 16, boxShadow: '0 0 80px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.08)', position: 'relative' }}>
            <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <QrCode size={18} color="#6366f1" />
                <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 700 }}>SCAN EN COURS</span>
              </div>
              <div style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>Client : Chez Mama</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Bonanjo, Douala</div>
            </div>
            {[['Castel 33cl', '20 casiers', '#f59e0b'], ['Supermont 1.5L', '12 packs', '#10b981'], ['Top Ananas', '8 cartons', '#6366f1']].map(([name, qty, color]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{qty}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 12, padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>✅ Confirmer livraison</span>
            </div>
          </div>
        </div>
      </section>

      {/* Scan QR Feature */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(99,102,241,0.08))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 28, padding: '48px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={24} color="#f59e0b" />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Scan QR Code lors des livraisons</h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
              Chaque client dispose d'un QR code unique dans GeStock. Lors d'une livraison de casiers en ville, le chauffeur scanne ce QR code avec son téléphone Android pour confirmer la livraison, enregistrer les quantités et récupérer les bouteilles vides — sans connexion permanente.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              ['1', 'Chargement au dépôt', 'Le gérant valide le bon de tournée sur l\'app'],
              ['2', 'En route', 'Le chauffeur voit son itinéraire de livraisons'],
              ['3', 'Chez le client', 'Scan QR → saisie quantités → récupération vides'],
              ['4', 'Retour dépôt', 'Versement recette + retour de stock validé'],
            ].map(([step, title, desc]) => (
              <div key={step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#000', flexShrink: 0 }}>{step}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>Une app, plusieurs rôles</h2>
          <p style={{ color: '#94a3b8', fontSize: 16 }}>Chaque membre de votre équipe a accès uniquement à ce dont il a besoin.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {roles.map((role, i) => {
            const Icon = role.icon;
            return (
              <article key={i} className="role-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 28 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${role.color}22`, border: `1px solid ${role.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={22} color={role.color} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{role.title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>{role.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {role.actions.map((action, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#94a3b8' }}>
                      <CheckCircle2 size={15} color={role.color} style={{ marginTop: 1, flexShrink: 0 }} />
                      {action}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {/* Offline badge */}
      <section style={{ maxWidth: 900, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '24px 32px' }}>
          <Wifi size={32} color="#10b981" />
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>Compatible faible connexion</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>L'app fonctionne même avec une connexion 2G ou 3G faible, très courante dans les quartiers de Douala et Yaoundé. Les données sont synchronisées automatiquement dès que la connexion revient.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
