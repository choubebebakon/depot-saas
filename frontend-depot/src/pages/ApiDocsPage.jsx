import { useNavigate } from 'react-router-dom';
import { Warehouse, Code2, Key, Webhook, Database, Globe, Copy, CheckCircle2 } from 'lucide-react';

const endpoints = [
  { method: 'GET', path: '/api/v1/stocks', desc: 'Récupérer le stock actuel d\'un dépôt', color: '#10b981' },
  { method: 'POST', path: '/api/v1/ventes', desc: 'Créer une nouvelle vente', color: '#6366f1' },
  { method: 'GET', path: '/api/v1/clients', desc: 'Lister les clients d\'un tenant', color: '#10b981' },
  { method: 'POST', path: '/api/v1/livraisons', desc: 'Créer un bon de livraison', color: '#6366f1' },
  { method: 'GET', path: '/api/v1/rapports/mensuel', desc: 'Rapport mensuel complet', color: '#10b981' },
  { method: 'POST', path: '/api/v1/webhooks', desc: 'Configurer un webhook événementiel', color: '#6366f1' },
  { method: 'GET', path: '/api/v1/consignes/{clientId}', desc: 'Portefeuille consigne d\'un client', color: '#10b981' },
  { method: 'PUT', path: '/api/v1/stocks/{id}', desc: 'Mettre à jour le stock d\'un article', color: '#f59e0b' },
];

export default function ApiDocsPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#080812 0%,#0d1117 100%)', color:'#fff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .cta-btn { transition:all 0.2s; cursor:pointer; border:none; } .cta-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
        .ep-row { transition:background 0.2s; border-radius:12px; } .ep-row:hover { background:rgba(255,255,255,0.04); }
      `}</style>
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, backdropFilter:'blur(20px)', background:'rgba(8,8,18,0.8)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:64 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:'#fff', fontWeight:800, fontSize:18 }}><Warehouse size={22} color="#6366f1" /> GeStock</button>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={() => navigate('/contact')} className="cta-btn" style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'10px 20px', borderRadius:12, fontWeight:700, fontSize:14 }}>Contacter l'équipe API</button>
          <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'10px 22px', borderRadius:12, fontWeight:700, fontSize:14 }}>Essai gratuit</button>
        </div>
      </nav>

      <section style={{ maxWidth:900, margin:'0 auto', padding:'120px 24px 60px', textAlign:'center', animation:'fadeUp 0.6s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:100, padding:'6px 18px', marginBottom:24 }}>
          <Code2 size={14} color="#a5b4fc" /><span style={{ fontSize:12, color:'#a5b4fc', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>Ressources · API</span>
        </div>
        <h1 style={{ fontSize:'clamp(32px,5vw,54px)', fontWeight:900, lineHeight:1.1, marginBottom:20, letterSpacing:-2 }}>
          Intégrez GeStock<br />
          <span style={{ background:'linear-gradient(135deg,#6366f1,#10b981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>à vos systèmes existants</span>
        </h1>
        <p style={{ fontSize:17, color:'#94a3b8', maxWidth:620, margin:'0 auto 20px', lineHeight:1.7 }}>
          GeStock expose une API REST complète, sécurisée par JWT, pour connecter vos systèmes comptables, ERP ou applications tierces. Disponible sur les plans PME et Entreprise.
        </p>
        <div style={{ display:'inline-flex', gap:16, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'16px 28px' }}>
          {[['REST API', 'JSON'], ['JWT Auth', 'Bearer Token'], ['Rate Limit', '1000 req/min'], ['Webhooks', 'Temps réel']].map(([k, v]) => (
            <div key={k} style={{ textAlign:'center' }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{k}</div>
              <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Auth example */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 60px' }}>
        <h2 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>🔑 Authentification</h2>
        <div style={{ background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
            <div style={{ display:'flex', gap:6 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:'#f43f5e', display:'inline-block' }} />
              <span style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b', display:'inline-block' }} />
              <span style={{ width:10, height:10, borderRadius:'50%', background:'#10b981', display:'inline-block' }} />
            </div>
            <span style={{ fontSize:11, color:'#475569' }}>bash</span>
          </div>
          <pre style={{ padding:'24px', margin:0, fontSize:13, color:'#a5b4fc', fontFamily:"'JetBrains Mono', monospace", lineHeight:1.8, overflowX:'auto' }}>{`# 1. Obtenir un token d'accès
curl -X POST https://api.gestock.cm/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"depot@exemple.cm","password":"***"}'

# Réponse
{
  "access_token": "eyJhbGciOiJSUzI1NiJ9...",
  "tenant_id": "depot_bonaberi_001",
  "expires_in": 3600
}

# 2. Utiliser le token
curl -X GET https://api.gestock.cm/api/v1/stocks \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."`}</pre>
        </div>
      </section>

      {/* Endpoints */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 80px' }}>
        <h2 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📡 Endpoints principaux</h2>
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, overflow:'hidden' }}>
          {endpoints.map((ep, i) => (
            <div key={i} className="ep-row" style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 20px', borderBottom: i < endpoints.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span style={{ fontSize:11, fontWeight:800, color: ep.method === 'GET' ? '#10b981' : ep.method === 'POST' ? '#6366f1' : '#f59e0b', background: `${ep.method === 'GET' ? '#10b981' : ep.method === 'POST' ? '#6366f1' : '#f59e0b'}22`, borderRadius:6, padding:'3px 10px', width:44, textAlign:'center', flexShrink:0 }}>{ep.method}</span>
              <code style={{ fontSize:13, color:'#c7d2fe', fontFamily:"'JetBrains Mono',monospace", flex:'0 0 280px' }}>{ep.path}</code>
              <span style={{ fontSize:13, color:'#64748b' }}>{ep.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 80px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20 }}>
          {[
            { icon: Database, color: '#6366f1', title: 'Connecter votre logiciel comptable', desc: 'Synchronisez automatiquement vos ventes GeStock avec Sage, Ciel ou votre logiciel de comptabilité local.' },
            { icon: Webhook, color: '#f59e0b', title: 'Webhooks en temps réel', desc: 'Recevez des notifications instantanées sur chaque vente, livraison ou alerte de stock via webhook HTTPS.' },
            { icon: Globe, color: '#10b981', title: 'Tableaux de bord custom', desc: 'Construisez vos propres tableaux Power BI ou Google Looker Studio en connectant l\'API GeStock.' },
          ].map((uc, i) => {
            const Icon = uc.icon;
            return (
              <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:24 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:`${uc.color}22`, border:`1px solid ${uc.color}44`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}><Icon size={20} color={uc.color} /></div>
                <h3 style={{ fontSize:16, fontWeight:800, marginBottom:8 }}>{uc.title}</h3>
                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, margin:0 }}>{uc.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ maxWidth:800, margin:'0 auto 80px', padding:'0 24px', textAlign:'center' }}>
        <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:24, padding:'36px 32px' }}>
          <h2 style={{ fontSize:22, fontWeight:900, marginBottom:12 }}>Accès API disponible sur PME & Entreprise</h2>
          <p style={{ color:'#94a3b8', fontSize:14, marginBottom:24 }}>Contactez notre équipe technique pour obtenir votre clé API de développement et accéder à la documentation complète Swagger.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => navigate('/contact')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'14px 28px', borderRadius:14, fontWeight:800, fontSize:15 }}>Contacter l'équipe technique</button>
            <button onClick={() => navigate('/pricing')} className="cta-btn" style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'14px 28px', borderRadius:14, fontWeight:700, fontSize:15 }}>Voir les plans</button>
          </div>
        </div>
      </section>
    </div>
  );
}
