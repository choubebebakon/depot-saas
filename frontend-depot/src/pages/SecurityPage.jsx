import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, Server, Key, Users, ArrowRight, Warehouse, CheckCircle2 } from 'lucide-react';

const pillars = [
  { icon: Lock, color: '#6366f1', title: 'Architecture Multi-Tenant', desc: 'Chaque dépôt est un tenant totalement isolé. Vos données sont séparées physiquement de celles de vos voisins.', points: ['Isolation par schéma de base de données', 'Aucune requête cross-tenant possible', 'Identifiant tenant vérifié à chaque appel API', 'Tests d\'isolation automatisés en continu'] },
  { icon: Key, color: '#f59e0b', title: 'Chiffrement des Données', desc: 'Toutes vos données sensibles (mots de passe, transactions, clés API) sont chiffrées avant stockage.', points: ['Mots de passe hachés avec bcrypt', 'Tokens JWT signés RS256', 'Communications HTTPS/TLS 1.3', 'Clés NotchPay chiffrées au repos'] },
  { icon: Users, color: '#10b981', title: 'Permissions par Rôle', desc: 'Chaque membre accède uniquement à ce que vous lui autorisez. Le caissier ne voit pas les marges.', points: ['Rôle Gérant : accès total', 'Rôle Caissier : ventes uniquement', 'Rôle Livreur : tournées et confirmations', 'Rôle Magasinier : stocks et réceptions'] },
  { icon: Server, color: '#8b5cf6', title: 'Sauvegardes Automatiques', desc: 'Votre base est sauvegardée chaque jour. En cas de problème, vos données sont restaurées en 15 minutes.', points: ['Backup quotidien automatique PostgreSQL', 'Rétention 30 jours d\'historique', 'Restauration en moins de 15 minutes', 'Serveurs hébergés en Europe'] },
  { icon: Eye, color: '#06b6d4', title: 'Journal d\'Audit', desc: 'Chaque action critique est tracée avec l\'identité de l\'utilisateur, l\'heure et l\'adresse IP.', points: ['Log de toutes les connexions', 'Traçabilité des modifications de stock', 'Détection des accès anormaux', 'Export du journal sur demande'] },
  { icon: ShieldCheck, color: '#f43f5e', title: 'Protection Anti-Fraude', desc: 'GeStock détecte automatiquement les comportements suspects : ventes non enregistrées, écarts d\'inventaire.', points: ['Alertes sur les écarts d\'inventaire', 'Détection des ventes sans reçu', 'Verrouillage après tentatives échouées', 'Notification push au gérant en temps réel'] },
];

export default function SecurityPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #080812 0%, #0d1117 100%)', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        .sec-card { transition: transform 0.3s; } .sec-card:hover { transform: translateY(-6px); }
        .cta-btn { transition: all 0.2s; cursor: pointer; border: none; } .cta-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
      `}</style>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(8,8,18,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 64 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 800, fontSize: 18 }}><Warehouse size={22} color="#6366f1" /> GeStock</button>
        <button onClick={() => navigate('/register')} className="cta-btn" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '10px 22px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>Essai gratuit</button>
      </nav>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center', animation: 'fadeUp 0.6s ease' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '6px 18px', marginBottom: 24 }}>
          <ShieldCheck size={14} color="#a5b4fc" /><span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Sécurité</span>
        </div>
        <h1 style={{ fontSize: 'clamp(34px, 5vw, 58px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: -2 }}>
          Vos données, blindées.<br />
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Personne ne voit vos ventes.</span>
        </h1>
        <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.7 }}>
          GeStock est construit sur une architecture <strong style={{ color: '#a5b4fc' }}>Multi-Tenant</strong> : les données de votre dépôt sont cryptées et isolées. Votre voisin ne peut jamais voir vos stocks, vos ventes ni vos clients. C'est une garantie technique.
        </p>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['TLS 1.3', 'Chiffrement transit'], ['AES-256', 'Chiffrement repos'], ['99.9%', 'SLA garanti'], ['24/7', 'Surveillance']].map(([val, label]) => (
            <div key={val} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>{val}</div>
              <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.05))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 28, padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>L'isolation Multi-Tenant en pratique</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Imaginez un immeuble d'appartements. Chaque dépôt a son propre appartement verrouillé. Le voisin du 3ème ne peut jamais entrer chez vous, même s'il est sur la même plateforme.</p>
            {['Dépôt Central Bonanjo → son propre schéma de données', 'Dépôt Bonabéri → son propre schéma de données', 'Impossible de croiser les requêtes entre dépôts', 'Même le support GeStock a un accès limité et tracé'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>
                <CheckCircle2 size={15} color="#10b981" style={{ marginTop: 1, flexShrink: 0 }} />{item}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['Dépôt Bonabéri', '#6366f1'], ['Dépôt Bonanjo', '#10b981'], ['Dépôt Bepanda', '#f59e0b']].map(([name, color]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, background: `${color}11`, border: `1px solid ${color}33`, borderRadius: 14, padding: '14px 18px' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={15} color={color} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#f1f5f9' }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Données isolées · Accès chiffré</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color, background: `${color}22`, borderRadius: 6, padding: '3px 8px' }}>PRIVÉ</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>6 couches de sécurité</h2>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>Une approche défense en profondeur, pour que vos données soient toujours protégées.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 22 }}>
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <article key={i} className="sec-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: 26 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: `${pillar.color}22`, border: `1px solid ${pillar.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Icon size={21} color={pillar.color} /></div>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{pillar.title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>{pillar.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {pillar.points.map((point, j) => (
                    <li key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#94a3b8' }}>
                      <CheckCircle2 size={13} color={pillar.color} style={{ marginTop: 1, flexShrink: 0 }} />{point}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section style={{ maxWidth: 800, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 28, padding: '48px 40px', textAlign: 'center' }}>
          <ShieldCheck size={44} color="#6366f1" style={{ marginBottom: 18 }} />
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>La sécurité de vos données, notre priorité</h2>
          <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 28 }}>Commencez l'essai gratuit. Aucune carte bancaire requise.</p>
          <button onClick={() => navigate('/register')} className="cta-btn" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '14px 32px', borderRadius: 14, fontWeight: 800, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Démarrer gratuitement <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </div>
  );
}
