import { useNavigate } from 'react-router-dom';
import { Warehouse, ArrowRight, CheckCircle2, AlertTriangle, TrendingDown, Users, RefreshCw } from 'lucide-react';

export default function GestionConsignesPage() {
  const navigate = useNavigate();
  const problems = [
    'Un client repart avec 20 casiers mais ne rend que 15 vides — vous perdez 5 casiers sans le savoir.',
    'Votre stock de verre est épuisé mais vous ignorez chez quel client se trouvent les bouteilles.',
    'Fin de mois : impossible de calculer les pertes réelles sur les consignes non retournées.',
    'Certains clients «oublient» leur dette de consigne depuis des semaines.',
  ];
  const solutions = [
    { title: 'Portefeuille Consigne par Client', desc: 'Chaque client a son propre compte consigne. À chaque vente, les casiers sortants sont enregistrés. À chaque retour, ils sont déduits. Le solde est visible en temps réel.', color: '#6366f1' },
    { title: 'Alerte sur les Dettes Élevées', desc: 'GeStock alerte automatiquement le gérant quand un client dépasse un seuil de consignes dues. Plus de mauvaise surprise en fin de mois.', color: '#f59e0b' },
    { title: 'Réconciliation à la Livraison', desc: 'Lors d\'une livraison, le chauffeur enregistre les vides récupérés directement depuis l\'app mobile. Le portefeuille client est mis à jour sur-le-champ.', color: '#10b981' },
    { title: 'Rapport Mensuel des Pertes', desc: 'Un rapport automatique calcule la valeur totale des consignes non retournées par client et par produit. Sachez exactement combien vous perdez sur le verre.', color: '#8b5cf6' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#080812 0%,#0d1117 100%)', color:'#fff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .sol-card { transition:transform 0.3s; } .sol-card:hover { transform:translateY(-5px); }
        .cta-btn { transition:all 0.2s; cursor:pointer; border:none; } .cta-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
      `}</style>
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, backdropFilter:'blur(20px)', background:'rgba(8,8,18,0.8)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:64 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:'#fff', fontWeight:800, fontSize:18 }}><Warehouse size={22} color="#6366f1" /> GeStock</button>
        <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'10px 22px', borderRadius:12, fontWeight:700, fontSize:14 }}>Essai gratuit</button>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'120px 24px 60px', textAlign:'center', animation:'fadeUp 0.6s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:100, padding:'6px 18px', marginBottom:24 }}>
          <RefreshCw size={14} color="#fbbf24" /><span style={{ fontSize:12, color:'#fbbf24', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>Solutions · Consignes</span>
        </div>
        <h1 style={{ fontSize:'clamp(34px,5vw,58px)', fontWeight:900, lineHeight:1.1, marginBottom:20, letterSpacing:-2 }}>
          Plus jamais de perte<br />
          <span style={{ background:'linear-gradient(135deg,#f59e0b,#6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>sur vos bouteilles vides</span>
        </h1>
        <p style={{ fontSize:17, color:'#94a3b8', maxWidth:640, margin:'0 auto 16px', lineHeight:1.7 }}>
          La gestion des consignes est <strong style={{ color:'#fbbf24' }}>le problème numéro un</strong> des dépôts de boissons au Cameroun. Des milliers de FCFA perdus chaque mois sur les bouteilles et casiers non retournés. GeStock crée un <strong style={{ color:'#fff' }}>vrai Portefeuille Consigne</strong> par client.
        </p>
      </section>

      {/* Problème */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 60px' }}>
        <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:24, padding:32, marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <AlertTriangle size={24} color="#f43f5e" />
            <h2 style={{ fontSize:20, fontWeight:800, margin:0, color:'#fca5a5' }}>La réalité de la consigne dans vos dépôts</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {problems.map((p, i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', fontSize:14, color:'#94a3b8' }}>
                <TrendingDown size={15} color="#f43f5e" style={{ marginTop:2, flexShrink:0 }} />{p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution cards */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px 80px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <h2 style={{ fontSize:30, fontWeight:900, marginBottom:12 }}>Le Portefeuille Consigne GeStock</h2>
          <p style={{ color:'#94a3b8', fontSize:15 }}>Un système complet pour ne plus jamais perdre sur le verre.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:22 }}>
          {solutions.map((sol, i) => (
            <article key={i} className="sol-card" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22, padding:26 }}>
              <div style={{ width:44, height:44, borderRadius:13, background:`${sol.color}22`, border:`1px solid ${sol.color}44`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <RefreshCw size={20} color={sol.color} />
              </div>
              <h3 style={{ fontSize:16, fontWeight:800, marginBottom:10 }}>{sol.title}</h3>
              <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, margin:0 }}>{sol.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Exemple chiffré */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 80px' }}>
        <div style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(99,102,241,0.06))', border:'1px solid rgba(245,158,11,0.25)', borderRadius:28, padding:'40px' }}>
          <h2 style={{ fontSize:22, fontWeight:900, marginBottom:20, color:'#fbbf24' }}>📊 Exemple concret : Dépôt Bonabéri</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20, marginBottom:24 }}>
            {[['150 casiers', 'Sortis chez les clients', '#f59e0b'], ['120 casiers', 'Retournés ce mois', '#10b981'], ['30 casiers', 'Dus par les clients', '#f43f5e'], ['45 000 FCFA', 'Valeur récupérée', '#6366f1']].map(([val, label, color]) => (
              <div key={val} style={{ textAlign:'center', background:'rgba(255,255,255,0.04)', borderRadius:16, padding:'20px 16px' }}>
                <div style={{ fontSize:24, fontWeight:900, color, marginBottom:6 }}>{val}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>{label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:14, color:'#94a3b8', lineHeight:1.7, margin:0 }}>Sans GeStock, ce dépôt perdait en moyenne <strong style={{ color:'#f43f5e' }}>60 000 FCFA/mois</strong> sur les consignes non tracées. Avec GeStock, les pertes ont chuté de <strong style={{ color:'#10b981' }}>70%</strong> en deux mois.</p>
        </div>
      </section>

      <section style={{ maxWidth:800, margin:'0 auto 80px', padding:'0 24px', textAlign:'center' }}>
        <h2 style={{ fontSize:26, fontWeight:900, marginBottom:12 }}>Commencez à tracker vos consignes aujourd'hui</h2>
        <p style={{ color:'#94a3b8', fontSize:15, marginBottom:28 }}>30 jours gratuits, aucune carte bancaire requise.</p>
        <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#000', padding:'14px 32px', borderRadius:14, fontWeight:800, fontSize:15, display:'inline-flex', alignItems:'center', gap:8 }}>
          Essai gratuit 30 jours <ArrowRight size={17} />
        </button>
      </section>
    </div>
  );
}
