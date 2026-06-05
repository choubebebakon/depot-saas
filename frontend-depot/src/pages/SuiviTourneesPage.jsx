import { useNavigate } from 'react-router-dom';
import { Warehouse, ArrowRight, CheckCircle2, Truck, Fuel, Banknote, MapPin, Package } from 'lucide-react';

export default function SuiviTourneesPage() {
  const navigate = useNavigate();
  const etapes = [
    { icon: Package, color: '#6366f1', title: 'Chargement du véhicule', desc: 'Le gérant prépare le bon de tournée depuis GeStock : produits, quantités, clients à livrer. Le chauffeur voit sa liste sur l\'app mobile avant de partir.' },
    { icon: MapPin, color: '#f59e0b', title: 'Livraisons en ville', desc: 'À chaque arrêt, le chauffeur confirme la livraison (scan QR code client ou saisie manuelle). Les quantités livrées et les vides récupérés sont enregistrés.' },
    { icon: Fuel, color: '#10b981', title: 'Suivi du carburant', desc: 'Le chauffeur déclare sa consommation de carburant à la fin de la tournée. GeStock calcule le coût logistique réel de chaque tournée.' },
    { icon: Banknote, color: '#8b5cf6', title: 'Versement de la recette', desc: 'En fin de journée, le commercial reverse sa recette au gérant. GeStock compare automatiquement le montant attendu (bons de livraison) vs. le montant versé.' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#080812 0%,#0d1117 100%)', color:'#fff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .cta-btn { transition:all 0.2s; cursor:pointer; border:none; } .cta-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
        .step-card { transition:transform 0.3s; } .step-card:hover { transform:translateY(-5px); }
      `}</style>
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, backdropFilter:'blur(20px)', background:'rgba(8,8,18,0.8)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:64 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:'#fff', fontWeight:800, fontSize:18 }}><Warehouse size={22} color="#6366f1" /> GeStock</button>
        <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'10px 22px', borderRadius:12, fontWeight:700, fontSize:14 }}>Essai gratuit</button>
      </nav>

      <section style={{ maxWidth:900, margin:'0 auto', padding:'120px 24px 70px', textAlign:'center', animation:'fadeUp 0.6s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:100, padding:'6px 18px', marginBottom:24 }}>
          <Truck size={14} color="#34d399" /><span style={{ fontSize:12, color:'#34d399', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>Solutions · Tournées</span>
        </div>
        <h1 style={{ fontSize:'clamp(34px,5vw,56px)', fontWeight:900, lineHeight:1.1, marginBottom:20, letterSpacing:-2 }}>
          Chaque tournée, tracée.<br />
          <span style={{ background:'linear-gradient(135deg,#10b981,#6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Chaque FCFA, compté.</span>
        </h1>
        <p style={{ fontSize:17, color:'#94a3b8', maxWidth:620, margin:'0 auto 36px', lineHeight:1.7 }}>
          Gérez la logistique complète de vos tricycles, motos ou camions de livraison. Du chargement au dépôt jusqu'au versement de recette en fin de journée — sans paperasse, sans litige.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', padding:'14px 28px', borderRadius:14, fontWeight:800, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>Commencer gratuitement <ArrowRight size={17}/></button>
          <button onClick={() => navigate('/app-mobile')} className="cta-btn" style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'14px 28px', borderRadius:14, fontWeight:700, fontSize:15 }}>Voir l'app mobile</button>
        </div>
      </section>

      {/* 4 étapes */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px 80px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <h2 style={{ fontSize:28, fontWeight:900, marginBottom:12 }}>4 étapes, zéro papier</h2>
          <p style={{ color:'#94a3b8', fontSize:15 }}>Le cycle complet d'une tournée géré dans GeStock.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20 }}>
          {etapes.map((e, i) => {
            const Icon = e.icon;
            return (
              <article key={i} className="step-card" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22, padding:26, position:'relative' }}>
                <div style={{ position:'absolute', top:-12, left:20, width:28, height:28, borderRadius:'50%', background:`linear-gradient(135deg,${e.color},${e.color}aa)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color:'#fff' }}>{i+1}</div>
                <div style={{ width:46, height:46, borderRadius:13, background:`${e.color}22`, border:`1px solid ${e.color}44`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, marginTop:8 }}><Icon size={21} color={e.color} /></div>
                <h3 style={{ fontSize:16, fontWeight:800, marginBottom:8 }}>{e.title}</h3>
                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, margin:0 }}>{e.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Tableau récap */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 80px' }}>
        <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(99,102,241,0.05))', border:'1px solid rgba(16,185,129,0.2)', borderRadius:28, padding:'36px 40px' }}>
          <h2 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📋 Tableau récap de tournée (exemple)</h2>
          <div style={{ display:'grid', gap:12 }}>
            {[['Chauffeur', 'Rodrigue Eto\'o', '#fff'], ['Véhicule', 'Tricycle BT-0423 (Bonabéri)', '#94a3b8'], ['Clients livrés', '12 / 14 prévus', '#10b981'], ['Ventes réalisées', '285 000 FCFA', '#f59e0b'], ['Carburant déclaré', '4 500 FCFA (18L)', '#94a3b8'], ['Vides récupérés', '87 casiers', '#6366f1'], ['Recette versée', '282 500 FCFA', '#10b981'], ['Écart détecté', '+2 500 FCFA', '#f43f5e']].map(([label, val, color]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:14, color:'#64748b' }}>{label}</span>
                <span style={{ fontSize:14, fontWeight:700, color }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features list */}
      <section style={{ maxWidth:900, margin:'0 auto 80px', padding:'0 24px' }}>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:24, padding:32 }}>
          <h2 style={{ fontSize:20, fontWeight:800, marginBottom:20 }}>Tout ce qu'inclut le module Tournées</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:12 }}>
            {['Bons de chargement numériques', 'Assignation des chauffeurs', 'Itinéraire de livraisons', 'Suivi de carburant par tournée', 'Versement de recette guidé', 'Calcul automatique des écarts', 'Retours de bouteilles vides intégrés', 'Rapport de rentabilité par tournée', 'Historique complet par chauffeur', 'Notifications au gérant en temps réel'].map((f, i) => (
              <div key={i} style={{ display:'flex', gap:8, alignItems:'center', fontSize:13, color:'#94a3b8' }}>
                <CheckCircle2 size={14} color="#10b981" style={{ flexShrink:0 }} />{f}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
