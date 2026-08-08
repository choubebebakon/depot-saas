import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', fontFamily: "'Inter', sans-serif", paddingTop: 100 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16, textAlign: 'center' }}>Contact & Support</h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 48 }}>Une question ? Un bug ? Notre équipe est là pour vous aider.</p>

        <div style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', padding: 24, borderRadius: 24, textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Support Rapide via WhatsApp</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>Notre équipe basée à Douala répond généralement en moins de 2 heures.</p>
          <a href="https://wa.me/237656929905?text=Bonjour%20GeStock%2C%20j%27ai%20besoin%20d%27aide." target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25d366', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
            <span style={{ fontSize: 20 }}>💬</span> Contacter sur WhatsApp
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Ou par email</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: 40, borderRadius: 24, textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Email</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>Pour les demandes plus détaillées ou les questions commerciales.</p>
          <a href="mailto:gestocksaas237@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#6366f1', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
            <span style={{ fontSize: 20 }}>✉️</span> gestocksaas237@gmail.com
          </a>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
