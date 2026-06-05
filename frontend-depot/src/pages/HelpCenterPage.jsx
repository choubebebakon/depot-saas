import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Warehouse, ChevronDown, Search, MessageCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

const faqs = [
  { cat: 'Stock', q: 'Comment faire un inventaire de fin de mois ?', a: 'Dans GeStock, allez dans Stock → Inventaire. Lancez un nouvel inventaire : l\'app vous présente chaque article avec le stock théorique. Vous saisissez le stock physique compté. GeStock calcule automatiquement les écarts, génère un rapport d\'inventaire PDF et ajuste les quantités. Durée moyenne : 45 minutes pour un dépôt de 50 références.' },
  { cat: 'Stock', q: 'Comment gérer une casse de bouteilles ?', a: 'Allez dans Stock → Ajustements → Déclarer une perte. Sélectionnez le produit, saisissez la quantité cassée et le motif (Casse transport, Casse entrepôt, DLC dépassée). GeStock enregistre la perte, met à jour le stock et inclut la perte dans vos rapports de marge mensuelle.' },
  { cat: 'Consignes', q: 'Comment enregistrer un retour de bouteilles vides ?', a: 'Lors d\'une livraison, ouvrez le bon de livraison correspondant et cliquez sur "Retour vides". Saisissez les quantités récupérées par type de consigne. GeStock met à jour le portefeuille consigne du client automatiquement. Vous pouvez aussi faire un retour "hors livraison" depuis Consignes → Retour manuel.' },
  { cat: 'Consignes', q: 'Un client conteste sa dette de consigne, que faire ?', a: 'GeStock garde un historique complet de toutes les livraisons et retours pour chaque client. Allez dans Clients → [Nom du client] → Historique Consignes. Vous verrez chaque sortie et chaque retour avec la date et l\'utilisateur qui l\'a enregistré. Cet historique est incontestable.' },
  { cat: 'Ventes', q: 'Comment faire une vente à crédit ?', a: 'Lors de la création d\'une vente, choisissez "Paiement différé" comme mode de règlement. Entrez le montant versé maintenant et le solde dû. GeStock crée automatiquement une créance pour ce client. Vous pouvez suivre toutes les créances dans Caisse → Créances et envoyer des rappels par WhatsApp.' },
  { cat: 'Ventes', q: 'Comment envoyer une facture par WhatsApp ?', a: 'Après avoir validé une vente, cliquez sur "Partager". GeStock génère un PDF avec votre logo et un lien de partage. Cliquez sur "WhatsApp" pour ouvrir directement la conversation WhatsApp avec ce client. La facture arrive en moins de 10 secondes.' },
  { cat: 'Livraisons', q: 'Comment gérer un chauffeur qui ne rend pas toute la recette ?', a: 'GeStock calcule le montant attendu en fin de tournée (somme des bons de livraison). Quand le chauffeur déclare sa recette, GeStock affiche immédiatement l\'écart. Si un écart est détecté, le gérant reçoit une notification. L\'écart est tracé dans l\'historique du chauffeur.' },
  { cat: 'Livraisons', q: 'Peut-on gérer plusieurs chauffeurs en même temps ?', a: 'Oui. Vous pouvez créer autant de tournées simultanées que nécessaire. Chaque chauffeur voit uniquement ses propres livraisons sur l\'app mobile. Vous voyez toutes les tournées en cours depuis votre tableau de bord gérant en temps réel.' },
  { cat: 'Technique', q: 'GeStock fonctionne-t-il sans internet ?', a: 'GeStock nécessite internet pour synchroniser les données en temps réel. Cependant, l\'app mobile peut fonctionner en mode dégradé sur des connexions très lentes (2G/3G). Les données sont synchronisées dès que la connexion est rétablie. Nous recommandons une connexion 3G minimum.' },
  { cat: 'Technique', q: 'Comment migrer mes données depuis Excel ?', a: 'Notre équipe prend en charge la migration gratuitement pour les nouveaux clients. Envoyez-nous votre fichier Excel (produits, clients, fournisseurs, stocks de départ) via WhatsApp. Nous importons toutes vos données dans GeStock en moins de 24 heures. Vous pouvez commencer à utiliser l\'app immédiatement.' },
];

const cats = ['Toutes', 'Stock', 'Consignes', 'Ventes', 'Livraisons', 'Technique'];

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState('Toutes');
  const [openIdx, setOpenIdx] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = faqs.filter(f =>
    (activeCat === 'Toutes' || f.cat === activeCat) &&
    (search === '' || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#080812 0%,#0d1117 100%)', color:'#fff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .cta-btn { transition:all 0.2s; cursor:pointer; border:none; } .cta-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
        .faq-item { transition:background 0.2s; }
        .cat-btn { transition:all 0.2s; cursor:pointer; border:none; }
        .faq-answer { overflow:hidden; transition:max-height 0.3s ease, opacity 0.3s ease; }
      `}</style>
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, backdropFilter:'blur(20px)', background:'rgba(8,8,18,0.8)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:64 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:'#fff', fontWeight:800, fontSize:18 }}><Warehouse size={22} color="#6366f1" /> GeStock</button>
        <button onClick={() => navigate('/contact')} className="cta-btn" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'10px 22px', borderRadius:12, fontWeight:700, fontSize:14 }}>Contacter le support</button>
      </nav>

      <section style={{ maxWidth:860, margin:'0 auto', padding:'120px 24px 60px', textAlign:'center', animation:'fadeUp 0.6s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:100, padding:'6px 18px', marginBottom:24 }}>
          <Search size={14} color="#a5b4fc" /><span style={{ fontSize:12, color:'#a5b4fc', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>Centre d'aide</span>
        </div>
        <h1 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:900, lineHeight:1.1, marginBottom:16, letterSpacing:-2 }}>Comment pouvons-nous vous aider ?</h1>
        <p style={{ color:'#64748b', fontSize:16, marginBottom:32 }}>Les réponses aux questions les plus fréquentes de nos gérants de dépôts.</p>

        {/* Search */}
        <div style={{ position:'relative', maxWidth:520, margin:'0 auto 40px' }}>
          <Search size={18} color="#475569" style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher dans l'aide… ex: inventaire, casse, consigne"
            style={{ width:'100%', boxSizing:'border-box', paddingLeft:48, paddingRight:16, paddingTop:14, paddingBottom:14, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, color:'#fff', fontSize:15, outline:'none', fontFamily:'inherit' }}
          />
        </div>

        {/* Categories */}
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginBottom:48 }}>
          {cats.map(cat => (
            <button key={cat} className="cat-btn" onClick={() => setActiveCat(cat)} style={{ padding:'8px 18px', borderRadius:100, fontWeight:700, fontSize:13, background: activeCat === cat ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.05)', border: activeCat === cat ? 'none' : '1px solid rgba(255,255,255,0.1)', color: activeCat === cat ? '#fff' : '#64748b' }}>{cat}</button>
          ))}
        </div>
      </section>

      {/* FAQ List */}
      <section style={{ maxWidth:860, margin:'0 auto', padding:'0 24px 80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#475569' }}>
            <Search size={40} style={{ marginBottom:16, opacity:0.4 }} />
            <p style={{ fontSize:16 }}>Aucun résultat pour "{search}". <button onClick={() => navigate('/contact')} style={{ color:'#6366f1', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Contacter le support →</button></p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map((faq, i) => (
              <article key={i} className="faq-item" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, overflow:'hidden' }}>
                <button onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'18px 24px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#6366f1', background:'rgba(99,102,241,0.15)', borderRadius:6, padding:'3px 10px', flexShrink:0 }}>{faq.cat}</span>
                    <span style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>{faq.q}</span>
                  </div>
                  <ChevronDown size={18} color="#475569" style={{ flexShrink:0, transform: openIdx === i ? 'rotate(180deg)' : 'none', transition:'transform 0.3s' }} />
                </button>
                {openIdx === i && (
                  <div style={{ padding:'0 24px 20px' }}>
                    <p style={{ fontSize:14, color:'#94a3b8', lineHeight:1.8, margin:0, borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:16 }}>{faq.a}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* WhatsApp support */}
      <section style={{ maxWidth:860, margin:'0 auto 80px', padding:'0 24px' }}>
        <div style={{ background:'linear-gradient(135deg,rgba(37,211,102,0.12),rgba(37,211,102,0.05))', border:'1px solid rgba(37,211,102,0.25)', borderRadius:24, padding:'36px 40px', display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ width:56, height:56, borderRadius:18, background:'rgba(37,211,102,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <MessageCircle size={28} color="#25d366" />
          </div>
          <div style={{ flex:1, minWidth:260 }}>
            <h2 style={{ fontSize:20, fontWeight:900, marginBottom:8 }}>Pas trouvé votre réponse ?</h2>
            <p style={{ color:'#64748b', fontSize:14, lineHeight:1.6, margin:0 }}>Notre équipe de support basée à Douala répond en moins de 2 heures sur WhatsApp, du lundi au samedi de 7h à 21h.</p>
          </div>
          <a href="https://wa.me/237600000000?text=Bonjour%20GeStock%2C%20j%27ai%20besoin%20d%27aide." target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#25d366', color:'#fff', padding:'14px 24px', borderRadius:14, fontWeight:800, fontSize:14, textDecoration:'none' }}>
            <MessageCircle size={18} /> WhatsApp Support
          </a>
        </div>
      </section>
    </div>
  );
}
