import { useNavigate } from 'react-router-dom';
import { Warehouse, ArrowRight, BarChart3, TrendingUp, PieChart, Calendar, Download, CheckCircle2 } from 'lucide-react';

export default function RapportsStatsPage() {
  const navigate = useNavigate();
  const rapports = [
    { icon: BarChart3, color: '#6366f1', title: 'Bénéfice net par marque', desc: 'Sachez exactement quelle marque vous rapporte le plus : Castel, Guinness, Supermont, Top Ananas… Marge par produit, par semaine et par mois.' },
    { icon: TrendingUp, color: '#f59e0b', title: 'Évolution des ventes', desc: 'Graphiques interactifs pour visualiser la croissance de votre chiffre d\'affaires jour par jour. Identifiez vos pics et vos creux d\'activité.' },
    { icon: PieChart, color: '#10b981', title: 'Classement clients', desc: 'Vos 10 meilleurs clients par volume d\'achat. Sachez qui fidéliser et qui relancer pour réduire vos créances.' },
    { icon: Calendar, color: '#8b5cf6', title: 'Rapport mensuel automatique', desc: 'Un rapport PDF complet est généré automatiquement en fin de mois : ventes, achats, marges, consignes, caisse. Prêt pour votre comptable.' },
    { icon: Download, color: '#06b6d4', title: 'Export Excel & PDF', desc: 'Exportez toutes vos données en un clic. Format Excel pour votre comptable, PDF pour vos partenaires bancaires ou pour l\'administration fiscale.' },
    { icon: BarChart3, color: '#f43f5e', title: 'Rapport par livreur', desc: 'Comparez les performances de vos chauffeurs : volume livré, écarts de recette, consommation carburant. Gérez vos équipes avec des données réelles.' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#080812 0%,#0d1117 100%)', color:'#fff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .cta-btn { transition:all 0.2s; cursor:pointer; border:none; } .cta-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
        .rpt-card { transition:transform 0.3s; } .rpt-card:hover { transform:translateY(-5px); }
      `}</style>
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, backdropFilter:'blur(20px)', background:'rgba(8,8,18,0.8)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:64 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:'#fff', fontWeight:800, fontSize:18 }}><Warehouse size={22} color="#6366f1" /> GeStock</button>
        <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'10px 22px', borderRadius:12, fontWeight:700, fontSize:14 }}>Essai gratuit</button>
      </nav>

      <section style={{ maxWidth:900, margin:'0 auto', padding:'120px 24px 70px', textAlign:'center', animation:'fadeUp 0.6s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:100, padding:'6px 18px', marginBottom:24 }}>
          <BarChart3 size={14} color="#a5b4fc" /><span style={{ fontSize:12, color:'#a5b4fc', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>Solutions · Rapports</span>
        </div>
        <h1 style={{ fontSize:'clamp(34px,5vw,56px)', fontWeight:900, lineHeight:1.1, marginBottom:20, letterSpacing:-2 }}>
          Les bonnes décisions<br />
          <span style={{ background:'linear-gradient(135deg,#6366f1,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>avec les bonnes données</span>
        </h1>
        <p style={{ fontSize:17, color:'#94a3b8', maxWidth:620, margin:'0 auto 36px', lineHeight:1.7 }}>
          Tableaux de bord interactifs conçus pour les gérants de dépôts de boissons. Visualisez vos bénéfices nets par marque, suivez vos meilleurs clients et exportez vos rapports en un clic.
        </p>
      </section>

      {/* Dashboard mockup */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 70px' }}>
        <div style={{ background:'linear-gradient(160deg,rgba(99,102,241,0.1),rgba(245,158,11,0.05))', border:'1px solid rgba(99,102,241,0.2)', borderRadius:28, padding:36 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
            <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>📊 Tableau de bord · Dépôt Bonabéri · Mai 2026</h2>
            <span style={{ fontSize:12, color:'#64748b', background:'rgba(255,255,255,0.05)', borderRadius:8, padding:'4px 12px' }}>Mis à jour en temps réel</span>
          </div>
          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:28 }}>
            {[['2 840 000', 'FCFA', 'Ventes du mois', '#f59e0b'], ['890 000', 'FCFA', 'Bénéfice net', '#10b981'], ['247', 'casiers', 'Consignes dues', '#f43f5e'], ['18', 'tournées', 'Ce mois', '#6366f1']].map(([val, unit, label, color]) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20 }}>
                <div style={{ fontSize:24, fontWeight:900, color, letterSpacing:-1 }}>{val}<span style={{ fontSize:12, fontWeight:600, color:'#475569', marginLeft:4 }}>{unit}</span></div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:6 }}>{label}</div>
              </div>
            ))}
          </div>
          {/* Mini chart bars */}
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:16, padding:'20px 24px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:16 }}>Bénéfice par marque (FCFA)</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[['Castel Beer 65cl', 78, '#f59e0b', '340 000'], ['Castel Beer 33cl', 62, '#6366f1', '270 000'], ['Supermont 1.5L', 45, '#10b981', '197 000'], ['Guinness 65cl', 38, '#8b5cf6', '167 000'], ['Top Ananas', 25, '#06b6d4', '109 000']].map(([name, pct, color, val]) => (
                <div key={name} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ fontSize:12, color:'#64748b', width:140, flexShrink:0 }}>{name}</div>
                  <div style={{ flex:1, height:8, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${color},${color}aa)`, borderRadius:4 }} />
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color, width:80, textAlign:'right', flexShrink:0 }}>{val} F</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rapport cards */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px 80px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <h2 style={{ fontSize:28, fontWeight:900, marginBottom:12 }}>Tous les rapports dont vous avez besoin</h2>
          <p style={{ color:'#94a3b8', fontSize:15 }}>Conçus pour les réalités du marché camerounais.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
          {rapports.map((r, i) => {
            const Icon = r.icon;
            return (
              <article key={i} className="rpt-card" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22, padding:26 }}>
                <div style={{ width:46, height:46, borderRadius:13, background:`${r.color}22`, border:`1px solid ${r.color}44`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}><Icon size={21} color={r.color} /></div>
                <h3 style={{ fontSize:16, fontWeight:800, marginBottom:8 }}>{r.title}</h3>
                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, margin:0 }}>{r.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section style={{ maxWidth:800, margin:'0 auto 80px', padding:'0 24px', textAlign:'center' }}>
        <h2 style={{ fontSize:26, fontWeight:900, marginBottom:12 }}>Pilotez votre dépôt avec des données réelles</h2>
        <p style={{ color:'#94a3b8', fontSize:15, marginBottom:28 }}>30 jours gratuits, toutes les fonctionnalités analytics incluses.</p>
        <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'14px 32px', borderRadius:14, fontWeight:800, fontSize:15, display:'inline-flex', alignItems:'center', gap:8 }}>
          Démarrer gratuitement <ArrowRight size={17} />
        </button>
      </section>
    </div>
  );
}
