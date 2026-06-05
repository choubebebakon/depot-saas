import { useNavigate } from 'react-router-dom';
import { Warehouse, ArrowRight, Clock, User } from 'lucide-react';

const articles = [
  {
    tag: 'Logistique', date: '15 mai 2026', author: 'Équipe GeStock',
    title: 'Comment optimiser vos tournées de livraison pour réduire les coûts de carburant de 30%',
    excerpt: 'Le carburant représente souvent 15 à 25% des coûts opérationnels d\'un dépôt de boissons en pleine activité. Voici les stratégies concrètes utilisées par nos meilleurs clients pour réduire cette charge sans réduire leur volume de livraisons.',
    color: '#6366f1', read: '8 min',
  },
  {
    tag: 'Digitalisation', date: '8 mai 2026', author: 'Équipe GeStock',
    title: 'La digitalisation des dépôts de boissons au Cameroun : état des lieux 2026',
    excerpt: 'Selon notre étude menée auprès de 500 gérants de dépôts à Douala, Yaoundé, Bafoussam et Garoua, moins de 12% utilisaient un logiciel de gestion en 2024. Ce chiffre est passé à 31% en 2026. Que s\'est-il passé ?',
    color: '#f59e0b', read: '12 min',
  },
  {
    tag: 'Consignes', date: '1 mai 2026', author: 'Équipe GeStock',
    title: 'Le problème des consignes dans les dépôts africains : pourquoi vous perdez de l\'argent chaque jour',
    excerpt: 'Nous avons analysé les données de 1 200 dépôts utilisant GeStock. La perte moyenne sur les consignes non tracées est de 47 000 FCFA par mois. Pour les grands dépôts, ce chiffre dépasse 200 000 FCFA. Voici comment l\'arrêter.',
    color: '#10b981', read: '10 min',
  },
  {
    tag: 'Gestion', date: '22 avril 2026', author: 'Équipe GeStock',
    title: 'SABC, Guinness, Castel : comment négocier de meilleures conditions avec vos fournisseurs',
    excerpt: 'Les grands brasseurs accordent des remises et des délais de paiement aux dépôts qui prouvent leur sérieux avec des données chiffrées. Voici comment utiliser les rapports GeStock pour renforcer votre position de négociation.',
    color: '#8b5cf6', read: '7 min',
  },
  {
    tag: 'Mobile Money', date: '14 avril 2026', author: 'Équipe GeStock',
    title: 'Orange Money et MTN MoMo dans la vente de gros : pratiques et précautions',
    excerpt: 'L\'adoption du Mobile Money dans les transactions B2B de boissons explose au Cameroun. Mais comment sécuriser les paiements importants ? GeStock intègre nativement NotchPay pour tracer chaque transaction.',
    color: '#06b6d4', read: '6 min',
  },
  {
    tag: 'Succès client', date: '5 avril 2026', author: 'Équipe GeStock',
    title: 'Témoignage : comment le Dépôt Fraîcheur de Bafoussam a multiplié sa marge par 2 en 6 mois',
    excerpt: 'Jean-Marie Tchio gérait son dépôt de 8 000 casiers avec un carnet et Excel. Depuis GeStock, il a découvert que deux de ses produits phares lui coûtaient plus cher qu\'ils ne lui rapportaient. Il a réajusté ses prix et doublé sa marge.',
    color: '#f43f5e', read: '5 min',
  },
];

export default function BlogPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#080812 0%,#0d1117 100%)', color:'#fff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .cta-btn { transition:all 0.2s; cursor:pointer; border:none; } .cta-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
        .art-card { transition:transform 0.3s, box-shadow 0.3s; cursor:pointer; } .art-card:hover { transform:translateY(-6px); box-shadow:0 20px 50px rgba(0,0,0,0.4); }
      `}</style>
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, backdropFilter:'blur(20px)', background:'rgba(8,8,18,0.8)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:64 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:'#fff', fontWeight:800, fontSize:18 }}><Warehouse size={22} color="#6366f1" /> GeStock</button>
        <button onClick={() => navigate('/register')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'10px 22px', borderRadius:12, fontWeight:700, fontSize:14 }}>Essai gratuit</button>
      </nav>

      <section style={{ maxWidth:900, margin:'0 auto', padding:'120px 24px 60px', textAlign:'center', animation:'fadeUp 0.6s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:100, padding:'6px 18px', marginBottom:24 }}>
          <span style={{ fontSize:12, color:'#a5b4fc', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>Blog GeStock</span>
        </div>
        <h1 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:900, lineHeight:1.1, marginBottom:16, letterSpacing:-2 }}>
          Logistique boissons en Afrique<br />
          <span style={{ background:'linear-gradient(135deg,#6366f1,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>conseils & analyses terrain</span>
        </h1>
        <p style={{ color:'#64748b', fontSize:16 }}>Articles rédigés par notre équipe basée à Douala, pour les professionnels du secteur boissons en Afrique.</p>
      </section>

      {/* Featured article */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px 48px' }}>
        <div onClick={() => {}} className="art-card" style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(245,158,11,0.06))', border:'1px solid rgba(99,102,241,0.25)', borderRadius:28, padding:40, display:'grid', gridTemplateColumns:'1fr auto', gap:40, alignItems:'center' }}>
          <div>
            <div style={{ display:'flex', gap:12, marginBottom:16 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#a5b4fc', background:'rgba(99,102,241,0.2)', borderRadius:6, padding:'3px 10px' }}>À LA UNE</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#fbbf24', background:'rgba(245,158,11,0.15)', borderRadius:6, padding:'3px 10px' }}>{articles[0].tag}</span>
            </div>
            <h2 style={{ fontSize:26, fontWeight:900, lineHeight:1.2, marginBottom:14, color:'#f1f5f9' }}>{articles[0].title}</h2>
            <p style={{ fontSize:14, color:'#64748b', lineHeight:1.7, marginBottom:20 }}>{articles[0].excerpt}</p>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <span style={{ fontSize:12, color:'#475569', display:'flex', alignItems:'center', gap:6 }}><User size={13} />{articles[0].author}</span>
              <span style={{ fontSize:12, color:'#475569', display:'flex', alignItems:'center', gap:6 }}><Clock size={13} />{articles[0].read} de lecture</span>
              <span style={{ fontSize:12, color:'#475569' }}>{articles[0].date}</span>
            </div>
          </div>
          <div style={{ flexShrink:0, textAlign:'center' }}>
            <div style={{ fontSize:80, marginBottom:8 }}>🚚</div>
            <span style={{ fontSize:13, fontWeight:700, color:'#6366f1', display:'flex', alignItems:'center', gap:6 }}>Lire l'article <ArrowRight size={14} /></span>
          </div>
        </div>
      </section>

      {/* Articles grid */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px 100px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:24 }}>
          {articles.slice(1).map((art, i) => (
            <article key={i} className="art-card" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:24, padding:28 }}>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                <span style={{ fontSize:11, fontWeight:700, color:art.color, background:`${art.color}22`, borderRadius:6, padding:'3px 10px' }}>{art.tag}</span>
              </div>
              <h3 style={{ fontSize:16, fontWeight:800, lineHeight:1.4, marginBottom:12, color:'#f1f5f9' }}>{art.title}</h3>
              <p style={{ fontSize:13, color:'#475569', lineHeight:1.6, marginBottom:20 }}>{art.excerpt.substring(0, 120)}…</p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', gap:14 }}>
                  <span style={{ fontSize:11, color:'#334155', display:'flex', alignItems:'center', gap:4 }}><Clock size={11} />{art.read}</span>
                  <span style={{ fontSize:11, color:'#334155' }}>{art.date}</span>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:art.color, display:'flex', alignItems:'center', gap:4 }}>Lire <ArrowRight size={12} /></span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section style={{ maxWidth:700, margin:'0 auto 80px', padding:'0 24px', textAlign:'center' }}>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:24, padding:'40px 32px' }}>
          <h2 style={{ fontSize:22, fontWeight:900, marginBottom:10 }}>Restez informé</h2>
          <p style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>Un article par semaine sur la gestion de dépôts en Afrique. Pas de spam.</p>
          <div style={{ display:'flex', gap:10, maxWidth:420, margin:'0 auto' }}>
            <input placeholder="votre@email.cm" style={{ flex:1, padding:'12px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'#fff', fontSize:14, outline:'none', fontFamily:'inherit' }} />
            <button className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'12px 20px', borderRadius:12, fontWeight:700, fontSize:14, whiteSpace:'nowrap' }}>S'abonner</button>
          </div>
        </div>
      </section>
    </div>
  );
}
