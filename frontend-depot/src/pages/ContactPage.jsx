import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', type: 'Bug', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    setSent(true);
    setTimeout(() => {
      setSent(false);
      navigate('/');
    }, 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', fontFamily: "'Inter', sans-serif", paddingTop: 100 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16, textAlign: 'center' }}>Contact & Support</h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 48 }}>Une question ? Un bug ? Notre équipe est là pour vous aider.</p>

        {sent ? (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: 40, borderRadius: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Message envoyé !</h2>
            <p style={{ color: '#94a3b8' }}>Nous vous répondrons par email dans les plus brefs délais.</p>
          </div>
        ) : (
          <>
            <div style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', padding: 24, borderRadius: 24, textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Support Rapide via WhatsApp</h2>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>Notre équipe basée à Douala répond généralement en moins de 2 heures.</p>
              <a href="https://wa.me/237600000000?text=Bonjour%20GeStock%2C%20j%27ai%20besoin%20d%27aide." target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25d366', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
                <span style={{ fontSize: 20 }}>💬</span> Contacter sur WhatsApp
              </a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Ou par email</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: 40, borderRadius: 24 }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Nom Complet</label>
              <input 
                type="text" required 
                value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: 14, borderRadius: 12, color: '#fff', outline: 'none' }} 
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Email Professionnel</label>
              <input 
                type="email" required 
                value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: 14, borderRadius: 12, color: '#fff', outline: 'none' }} 
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Type de demande</label>
              <select 
                value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: 14, borderRadius: 12, color: '#fff', outline: 'none' }}
              >
                <option value="Bug">Signalement d'un bug</option>
                <option value="Suggestion">Suggestion de fonctionnalité</option>
                <option value="Question">Question commerciale / Tarifs</option>
                <option value="Other">Autre</option>
              </select>
            </div>
            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Message</label>
              <textarea 
                required rows={5}
                value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: 14, borderRadius: 12, color: '#fff', outline: 'none', resize: 'none' }} 
              />
            </div>
            <button type="submit" style={{ width: '100%', background: '#6366f1', color: '#fff', padding: '16px', borderRadius: 12, fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>Envoyer le message</button>
          </form>
          </>
        )}
      </div>
    </div>
  );
}
