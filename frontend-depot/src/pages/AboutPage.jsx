import { useNavigate } from 'react-router-dom';
import { Warehouse, MapPin, ArrowRight, Users, Target, Heart, Zap } from 'lucide-react';

const team = [
  { name: 'Alain K.', role: 'Fondateur & CEO', city: 'Douala', emoji: '👨‍💼', bio: 'Ancien gérant de dépôt de boissons à Bonabéri. A perdu des millions sur des consignes mal tracées. A créé GeStock pour ne plus jamais vivre ça.' },
  { name: 'Marie N.', role: 'CTO', city: 'Douala', emoji: '👩‍💻', bio: 'Ingénieure logiciel avec 8 ans d\'expérience en fintech africaine. Architecte du système multi-tenant de GeStock.' },
  { name: 'Paul B.', role: 'Responsable Produit', city: 'Yaoundé', emoji: '👨‍🎨', bio: 'Ex-commercial chez un distributeur SABC. Connaît les besoins terrain mieux que quiconque.' },
  { name: 'Fatou D.', role: 'Support & Succès Client', city: 'Douala', emoji: '👩‍🎯', bio: 'En contact direct avec les gérants tous les jours. La voix de nos clients au sein de l\'équipe produit.' },
];

const values = [
  { icon: Target, color: '#6366f1', title: 'Pertinence locale', desc: 'Chaque fonctionnalité est conçue pour la réalité des dépôts camerounais : FCFA, Mobile Money, consignes, tournées tricycle.' },
  { icon: Heart, color: '#f43f5e', title: 'Honnêteté', desc: 'Pas de frais cachés. Pas de promesses non tenues. Nous disons ce que nous faisons et faisons ce que nous disons.' },
  { icon: Zap, color: '#f59e0b', title: 'Simplicité', desc: 'GeStock doit être utilisable par un gérant de marché sans formation informatique. La complexité, c\'est notre problème, pas le vôtre.' },
  { icon: Users, color: '#10b981', title: 'Impact terrain', desc: 'Nous mesurons notre succès par les millions de FCFA que nos clients récupèrent sur leurs consignes et leurs marges.' },
];

export default function AboutPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#080812 0%,#0d1117 100%)', color:'#fff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .cta-btn { transition:all 0.2s; cursor:pointer; border:none; } .cta-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
        .team-card { transition:transform 0.3s; } .team-card:hover { transform:translateY(-5px); }
      `}</style>
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, backdropFilter:'blur(20px)', background:'rgba(8,8,18,0.8)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:64 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:'#fff', fontWeight:800, fontSize:18 }}><Warehouse size={22} color="#6366f1" /> GeStock</button>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => navigate('/careers')} className="cta-btn" style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', padding:'10px 18px', borderRadius:12, fontWeight:700, fontSize:13 }}>Nous rejoindre</button>
          <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'10px 22px', borderRadius:12, fontWeight:700, fontSize:14 }}>Essai gratuit</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'120px 24px 70px', textAlign:'center', animation:'fadeUp 0.6s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:100, padding:'6px 18px', marginBottom:24 }}>
          <MapPin size={14} color="#a5b4fc" /><span style={{ fontSize:12, color:'#a5b4fc', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>Made in Cameroon 🇨🇲</span>
        </div>
        <h1 style={{ fontSize:'clamp(34px,5vw,56px)', fontWeight:900, lineHeight:1.1, marginBottom:20, letterSpacing:-2 }}>
          Une solution née des<br />
          <span style={{ background:'linear-gradient(135deg,#6366f1,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>problèmes du terrain</span>
        </h1>
        <p style={{ fontSize:17, color:'#94a3b8', maxWidth:660, margin:'0 auto', lineHeight:1.7 }}>
          GeStock est une <strong style={{ color:'#fff' }}>solution 100% camerounaise</strong>, conçue à Douala par une équipe qui a vécu de l'intérieur les problèmes de vols de stock, d'erreurs de consignes et de pertes financières dans les dépôts de boissons. Nous ne sommes pas des consultants. Nous sommes des praticiens.
        </p>
      </section>

      {/* Origin story */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 70px' }}>
        <div style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(245,158,11,0.06))', border:'1px solid rgba(99,102,241,0.2)', borderRadius:28, padding:'40px 48px' }}>
          <h2 style={{ fontSize:24, fontWeight:900, marginBottom:20 }}>🍺 Pourquoi GeStock existe</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:16, color:'#94a3b8', fontSize:15, lineHeight:1.8 }}>
            <p style={{ margin:0 }}>En 2023, notre fondateur gérait un dépôt de boissons à Bonabéri, Douala. Chaque fin de mois, les comptes ne tombaient pas juste. Des casiers de Castel disparaissaient. Des clients contestaient leurs dettes de consigne. Des chauffeurs rendaient des recettes incomplètes.</p>
            <p style={{ margin:0 }}>Les logiciels existants étaient soit des outils conçus pour l'Europe (incompatibles avec le Mobile Money et les réalités locales), soit des ERP hors de prix. Rien n'était fait pour <strong style={{ color:'#fff' }}>le petit ou moyen dépôt de boissons africain</strong>.</p>
            <p style={{ margin:0 }}>GeStock est né de cette frustration. Après 18 mois de développement avec des gérants de dépôts réels à Douala, Yaoundé et Bafoussam, la première version a été lancée en 2024. Aujourd'hui, plus de 5 000 dépôts dans 15 pays africains font confiance à GeStock.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 70px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:20 }}>
          {[['2024', 'Année de lancement', '#6366f1'], ['+5 000', 'Dépôts actifs', '#f59e0b'], ['15', 'Pays africains', '#10b981'], ['Douala 🇨🇲', 'Quartier général', '#8b5cf6']].map(([val, label, color]) => (
            <div key={val} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'28px 20px', textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:900, color, letterSpacing:-1, marginBottom:8 }}>{val}</div>
              <div style={{ fontSize:12, color:'#475569', lineHeight:1.4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px 70px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <h2 style={{ fontSize:28, fontWeight:900, marginBottom:10 }}>Nos valeurs</h2>
          <p style={{ color:'#64748b', fontSize:15 }}>Ce qui guide chaque décision produit et chaque interaction avec nos clients.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:20 }}>
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:24 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:`${v.color}22`, border:`1px solid ${v.color}44`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}><Icon size={20} color={v.color} /></div>
                <h3 style={{ fontSize:15, fontWeight:800, marginBottom:8 }}>{v.title}</h3>
                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, margin:0 }}>{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Team */}
      <section style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px 80px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <h2 style={{ fontSize:28, fontWeight:900, marginBottom:10 }}>L'équipe</h2>
          <p style={{ color:'#64748b', fontSize:15 }}>Des professionnels du terrain, basés au Cameroun.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:20 }}>
          {team.map((member, i) => (
            <div key={i} className="team-card" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22, padding:24, textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:12 }}>{member.emoji}</div>
              <h3 style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>{member.name}</h3>
              <div style={{ fontSize:13, color:'#6366f1', fontWeight:700, marginBottom:4 }}>{member.role}</div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}><MapPin size={11} />{member.city}</div>
              <p style={{ fontSize:12, color:'#64748b', lineHeight:1.6, margin:0 }}>{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth:700, margin:'0 auto 80px', padding:'0 24px', textAlign:'center' }}>
        <h2 style={{ fontSize:24, fontWeight:900, marginBottom:12 }}>Rejoignez l'aventure GeStock</h2>
        <p style={{ color:'#64748b', fontSize:15, marginBottom:28 }}>5 000 dépôts nous font confiance. Pourquoi pas le vôtre ?</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'14px 28px', borderRadius:14, fontWeight:800, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>Essai gratuit 30 jours <ArrowRight size={17}/></button>
          <button onClick={() => navigate('/careers')} className="cta-btn" style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'14px 28px', borderRadius:14, fontWeight:700, fontSize:15 }}>Travailler avec nous</button>
        </div>
      </section>
    </div>
  );
}
