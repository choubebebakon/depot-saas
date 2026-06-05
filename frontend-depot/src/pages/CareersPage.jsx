import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Warehouse, MapPin, ArrowRight, CheckCircle2, Briefcase, MessageCircle } from 'lucide-react';

const jobs = [
  { title: 'Développeur Full-Stack (NestJS / React)', type: 'CDI', city: 'Douala', dept: 'Tech', desc: 'Rejoignez l\'équipe produit pour construire les nouvelles fonctionnalités de GeStock : modules de reporting, API, app mobile.', skills: ['NestJS / Node.js', 'React / TypeScript', 'PostgreSQL / Prisma', 'Git', 'Docker'], color: '#6366f1' },
  { title: 'Commercial(e) Terrain Dépôts de Boissons', type: 'CDI', city: 'Douala / Yaoundé', dept: 'Ventes', desc: 'Prospecter et onboarder de nouveaux dépôts de boissons. Vous connaissez le milieu, vous savez parler aux gérants.', skills: ['Connaissance secteur boissons', 'Permis B', 'Maîtrise du Français', 'Anglais bienvenu', 'Smartphone Android'], color: '#f59e0b' },
  { title: 'Responsable Support Client', type: 'CDI', city: 'Douala', dept: 'Support', desc: 'Répondre aux gérants sur WhatsApp, former les nouveaux clients, documenter les cas d\'usage et remonter les bugs au produit.', skills: ['Excellente communication', 'Patience et empathie', 'Connaissance outils SaaS', 'Bilingue FR/EN', 'WhatsApp Business'], color: '#10b981' },
  { title: 'Développeur Mobile Android (React Native)', type: 'Freelance / CDI', city: 'Remote Cameroun', dept: 'Tech', desc: 'Développer et maintenir l\'app mobile GeStock utilisée par les chauffeurs-livreurs et gérants sur le terrain.', skills: ['React Native', 'Expo', 'APIs REST', 'Android', 'Offline-first'], color: '#8b5cf6' },
];

const perks = [
  { emoji: '💰', title: 'Salaire compétitif', desc: 'Rémunération alignée sur le marché tech camerounais + part variable pour les commerciaux.' },
  { emoji: '📱', title: 'Équipement fourni', desc: 'Smartphone Android et laptop fournis pour tous les postes terrain et tech.' },
  { emoji: '🌍', title: 'Impact réel', desc: 'Votre travail aide des milliers de gérants camerounais à gagner leur vie plus facilement.' },
  { emoji: '🎓', title: 'Formation continue', desc: 'Budget formation annuel et accès aux conférences tech en Afrique.' },
  { emoji: '🏡', title: 'Télétravail partiel', desc: 'Flexibilité pour les postes tech : 3 jours bureau, 2 jours remote.' },
  { emoji: '🚀', title: 'Croissance rapide', desc: 'Startup en croissance : vos responsabilités grandissent avec la boîte.' },
];

export default function CareersPage() {
  const navigate = useNavigate();
  const [openJob, setOpenJob] = useState(null);

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#080812 0%,#0d1117 100%)', color:'#fff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        .cta-btn { transition:all 0.2s; cursor:pointer; border:none; } .cta-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
        .job-card { transition:transform 0.3s, box-shadow 0.3s; } .job-card:hover { transform:translateY(-4px); }
      `}</style>

      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, backdropFilter:'blur(20px)', background:'rgba(8,8,18,0.8)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:64 }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:'#fff', fontWeight:800, fontSize:18 }}><Warehouse size={22} color="#6366f1" /> GeStock</button>
        <button onClick={() => navigate('/about')} className="cta-btn" style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', padding:'10px 18px', borderRadius:12, fontWeight:700, fontSize:13 }}>À propos</button>
      </nav>

      <section style={{ maxWidth:860, margin:'0 auto', padding:'120px 24px 60px', textAlign:'center', animation:'fadeUp 0.6s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:100, padding:'6px 18px', marginBottom:24 }}>
          <Briefcase size={14} color="#a5b4fc" /><span style={{ fontSize:12, color:'#a5b4fc', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase' }}>Carrières · Douala 🇨🇲</span>
        </div>
        <h1 style={{ fontSize:'clamp(32px,5vw,54px)', fontWeight:900, lineHeight:1.1, marginBottom:20, letterSpacing:-2 }}>
          Construisez l'avenir<br />
          <span style={{ background:'linear-gradient(135deg,#6366f1,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>de la gestion africaine</span>
        </h1>
        <p style={{ fontSize:17, color:'#94a3b8', maxWidth:600, margin:'0 auto 16px', lineHeight:1.7 }}>
          GeStock est une startup en forte croissance basée à Douala. Nous cherchons des talents passionnés par la tech et par l'Afrique pour nous aider à atteindre 50 000 dépôts d'ici 2027.
        </p>
        <div style={{ display:'flex', gap:24, justifyContent:'center', marginTop:28 }}>
          {[['4', 'Postes ouverts'], ['Douala', 'Siège social'], ['15', 'Pays servis']].map(([val, label]) => (
            <div key={val} style={{ textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:900, color:'#fff' }}>{val}</div>
              <div style={{ fontSize:12, color:'#475569', marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Perks */}
      <section style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px 60px' }}>
        <h2 style={{ fontSize:24, fontWeight:900, marginBottom:28, textAlign:'center' }}>Pourquoi rejoindre GeStock ?</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
          {perks.map((perk, i) => (
            <div key={i} style={{ display:'flex', gap:16, alignItems:'flex-start', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'20px 22px' }}>
              <span style={{ fontSize:28, flexShrink:0 }}>{perk.emoji}</span>
              <div>
                <h3 style={{ fontSize:14, fontWeight:800, marginBottom:6 }}>{perk.title}</h3>
                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.5, margin:0 }}>{perk.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Job listings */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 80px' }}>
        <h2 style={{ fontSize:24, fontWeight:900, marginBottom:28, textAlign:'center' }}>Postes ouverts</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {jobs.map((job, i) => (
            <article key={i} className="job-card" style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${openJob === i ? job.color + '55' : 'rgba(255,255,255,0.07)'}`, borderRadius:22, overflow:'hidden' }}>
              <button onClick={() => setOpenJob(openJob === i ? null : i)} style={{ width:'100%', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:16, padding:'22px 28px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                <div>
                  <div style={{ display:'flex', gap:10, marginBottom:10, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:job.color, background:`${job.color}22`, borderRadius:6, padding:'3px 10px' }}>{job.dept}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#64748b', background:'rgba(255,255,255,0.05)', borderRadius:6, padding:'3px 10px' }}>{job.type}</span>
                    <span style={{ fontSize:11, color:'#475569', display:'flex', alignItems:'center', gap:4 }}><MapPin size={11} />{job.city}</span>
                  </div>
                  <h3 style={{ fontSize:17, fontWeight:800, color:'#f1f5f9', margin:0 }}>{job.title}</h3>
                </div>
                <div style={{ width:36, height:36, borderRadius:'50%', background:`${job.color}22`, border:`1px solid ${job.color}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <ArrowRight size={16} color={job.color} style={{ transform: openJob === i ? 'rotate(90deg)' : 'none', transition:'transform 0.3s' }} />
                </div>
              </button>

              {openJob === i && (
                <div style={{ padding:'0 28px 28px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize:14, color:'#94a3b8', lineHeight:1.7, margin:'20px 0 16px' }}>{job.desc}</p>
                  <h4 style={{ fontSize:13, fontWeight:800, color:'#64748b', marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>Compétences recherchées</h4>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
                    {job.skills.map((skill, j) => (
                      <span key={j} style={{ fontSize:12, fontWeight:600, color:job.color, background:`${job.color}15`, border:`1px solid ${job.color}33`, borderRadius:8, padding:'5px 12px' }}>{skill}</span>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    <a href={`https://wa.me/237600000000?text=Bonjour%20GeStock%2C%20je%20postule%20pour%20le%20poste%20de%20${encodeURIComponent(job.title)}`} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#25d366', color:'#fff', padding:'12px 22px', borderRadius:12, fontWeight:800, fontSize:14, textDecoration:'none' }}>
                      <MessageCircle size={16} /> Postuler via WhatsApp
                    </a>
                    <button onClick={() => navigate('/contact')} className="cta-btn" style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'12px 22px', borderRadius:12, fontWeight:700, fontSize:14 }}>Envoyer un email</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Spontaneous */}
      <section style={{ maxWidth:800, margin:'0 auto 80px', padding:'0 24px', textAlign:'center' }}>
        <div style={{ background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.2)', borderRadius:24, padding:'36px 32px' }}>
          <span style={{ fontSize:40, display:'block', marginBottom:12 }}>💌</span>
          <h2 style={{ fontSize:20, fontWeight:900, marginBottom:10 }}>Candidature spontanée</h2>
          <p style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>Vous ne trouvez pas le poste qui vous correspond mais vous croyez en GeStock ? Envoyez-nous votre CV et dites-nous ce que vous pourriez apporter.</p>
          <a href="https://wa.me/237600000000?text=Bonjour%20GeStock%2C%20je%20souhaite%20faire%20une%20candidature%20spontan%C3%A9e." target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#25d366', color:'#fff', padding:'14px 28px', borderRadius:14, fontWeight:800, fontSize:15, textDecoration:'none' }}>
            <MessageCircle size={18} /> Candidature spontanée WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
