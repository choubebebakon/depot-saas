import { useNavigate } from 'react-router-dom';
import { Warehouse, Truck, ArrowRight, CheckCircle2, Package, BarChart3, Users } from 'lucide-react';

export default function WholesalersPage() {
  const navigate = useNavigate();
  const steps = [
    { n: '1', title: 'Réception du gros camion', desc: 'Arrivée d\'un camion SABC ou Guinness. Saisissez les quantités reçues en quelques secondes. Le stock est mis à jour instantanément par produit, lot et date de péremption.', color: '#6366f1' },
    { n: '2', title: 'Mise en stock et organisation', desc: 'Affectez les produits à vos zones de stockage. Casiers, palettes, cartons : chaque unité est tracée. Les alertes de stock minimum vous avertissent avant toute rupture.', color: '#f59e0b' },
    { n: '3', title: 'Redistribution aux détaillants', desc: 'Créez un bon de livraison pour chaque client détaillant. Le chauffeur repart avec son bon numérique sur l\'app mobile. La sortie de stock est automatique.', color: '#10b981' },
    { n: '4', title: 'Gestion des retours de consignes', desc: 'À chaque livraison, les bouteilles vides reviennent. GeStock trace les retours, met à jour le portefeuille consigne de chaque client et recalcule les soldes.', color: '#8b5cf6' },
    { n: '5', title: 'Rapport de rentabilité', desc: 'En fin de journée, consultez votre marge nette par marque, par client et par livreur. Sachez enfin quel produit vous rapporte vraiment le plus.', color: '#f43f5e' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #080812 0%, #0d1117 100%)', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .cta-btn { transition:all 0.2s; cursor:pointer; border:none; } .cta-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
      `}</style>
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, backdropFilter:'blur(20px)', background:'rgba(8,8,18,0.8)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:64 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:'#fff', fontWeight:800, fontSize:18 }}><Warehouse size={22} color="#6366f1" /> GeStock</button>
        <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'10px 22px', borderRadius:12, fontWeight:700, fontSize:14 }}>Essai gratuit</button>
      </nav>

      <section style={{ maxWidth:900, margin:'0 auto', padding:'120px 24px 80px', textAlign:'center', animation:'fadeUp 0.6s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:100, padding:'6px 18px', marginBottom:24 }}>
          <Truck size={14} color="#a5b4fc" /><span style={{ fontSize:12, color:'#a5b4fc', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>Solutions · Grossistes</span>
        </div>
        <h1 style={{ fontSize:'clamp(34px,5vw,58px)', fontWeight:900, lineHeight:1.1, marginBottom:20, letterSpacing:-2 }}>
          Du gros camion SABC<br />
          <span style={{ background:'linear-gradient(135deg,#6366f1,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>aux détaillants du quartier</span>
        </h1>
        <p style={{ fontSize:17, color:'#94a3b8', maxWidth:620, margin:'0 auto 40px', lineHeight:1.7 }}>
          GeStock est taillé pour les grossistes et dépôts de boissons qui reçoivent de grands volumes de Brasseries Cameroun (SABC), Guinness ou Castel, et redistribuent aux boutiques, bars et supérettes environnantes.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'14px 28px', borderRadius:14, fontWeight:800, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>Démarrer gratuitement <ArrowRight size={17}/></button>
          <button onClick={() => navigate('/pricing')} className="cta-btn" style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'14px 28px', borderRadius:14, fontWeight:700, fontSize:15 }}>Voir les tarifs</button>
        </div>
      </section>

      {/* Fournisseurs */}
      <section style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px 60px' }}>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:24, padding:32, marginBottom:24 }}>
          <h2 style={{ fontSize:22, fontWeight:800, marginBottom:16 }}>Fournisseurs déjà connus de GeStock</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
            {['🍺 SABC', '🍻 Guinness Cameroun', '🟡 Castel Group', '💧 Supermont', '🍹 Top Boissons', '🧃 Fruiteq'].map(f => (
              <div key={f} style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:12, padding:'14px 16px', fontSize:14, fontWeight:600, color:'#c7d2fe' }}>{f}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 100px' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontSize:30, fontWeight:900, marginBottom:12 }}>Le flux complet, de la réception à la livraison</h2>
          <p style={{ color:'#94a3b8', fontSize:15 }}>5 étapes entièrement gérées par GeStock, sans papier, sans erreur.</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {steps.map((step) => (
            <div key={step.n} style={{ display:'flex', gap:20, alignItems:'flex-start', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:24 }}>
              <div style={{ width:44, height:44, borderRadius:14, background:`${step.color}22`, border:`1px solid ${step.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, color:step.color, flexShrink:0 }}>{step.n}</div>
              <div>
                <h3 style={{ fontSize:17, fontWeight:800, marginBottom:8, color:'#f1f5f9' }}>{step.title}</h3>
                <p style={{ fontSize:14, color:'#64748b', lineHeight:1.7, margin:0 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth:900, margin:'0 auto 80px', padding:'0 24px' }}>
        <div style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(245,158,11,0.08))', border:'1px solid rgba(99,102,241,0.2)', borderRadius:28, padding:'48px 40px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32, textAlign:'center' }}>
          {[['70%', 'Réduction des pertes sur consignes', '#6366f1'], ['30s', 'Pour créer une facture de gros', '#f59e0b'], ['+5 000', 'Dépôts qui utilisent GeStock', '#10b981']].map(([val, label, color]) => (
            <div key={val}>
              <div style={{ fontSize:42, fontWeight:900, color, letterSpacing:-2, marginBottom:8 }}>{val}</div>
              <div style={{ fontSize:13, color:'#64748b', lineHeight:1.5 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
