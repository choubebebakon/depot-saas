import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Sparkles, Mail, Bell } from 'lucide-react';
import logo from '../assets/logo-neon.png';

const metierNames = {
  'pharmacie': 'Pharmacie',
  'quincaillerie': 'Quincaillerie',
  'restaurant': 'Restaurant',
  'hotel': 'Hôtel',
  'ciment-btp': 'Ciment / BTP',
  'pressing': 'Pressing',
  'garage-automobile': 'Garage Automobile',
  'elevage': 'Élevage',
  'agriculture': 'Agriculture',
  'boulangerie-patisserie': 'Boulangerie / Pâtisserie',
  'clinique': 'Clinique',
  'transport-logistique': 'Transport / Logistique',
  'gestion-immobiliere': 'Gestion Immobilière',
  'ressources-humaines': 'Ressources Humaines',
  'tontine': 'Tontine'
};

const MetierComingSoonPage = () => {
  const navigate = useNavigate();
  const metierKey = window.location.pathname.split('/').pop();
  const metierName = metierNames[metierKey] || 'Ce métier';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(circle at 8% 5%, rgba(34,211,238,.20), transparent 28%), radial-gradient(circle at 92% 8%, rgba(6,182,212,.20), transparent 30%), radial-gradient(circle at 50% 100%, rgba(8,145,178,.16), transparent 34%), linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)'
      }} />

      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '12px',
            padding: '0.75rem 1.25rem',
            color: '#8ea2c3',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '2rem'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(34,211,238,0.1)';
            e.target.style.borderColor = 'rgba(34,211,238,0.3)';
            e.target.style.color = '#22d3ee';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.05)';
            e.target.style.borderColor = 'rgba(171,202,255,.17)';
            e.target.style.color = '#8ea2c3';
          }}
        >
          <ArrowLeft size={20} />
          Retour
        </button>

        <div style={{
          background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
          border: '1px solid rgba(171,202,255,.17)',
          borderRadius: '30px',
          padding: '3rem',
          backdropFilter: 'blur(28px) saturate(145%)',
          WebkitBackdropFilter: 'blur(28px) saturate(145%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.14), inset 0 -1px 0 rgba(0,0,0,.22), 0 28px 80px rgba(0,0,0,.32)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(6,182,212,0.15))',
            border: '2px solid rgba(34,211,238,0.3)',
            marginBottom: '2rem'
          }}>
            <Clock size={40} style={{ color: '#22d3ee' }} />
          </div>

          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: '#f8fbff',
            marginBottom: '1rem',
            letterSpacing: '-0.02em'
          }}>
            Bientôt disponible
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: '#91a4c4',
            lineHeight: 1.7,
            marginBottom: '1.5rem'
          }}>
            La solution GesTock pour <span style={{ color: '#22d3ee', fontWeight: 700 }}>{metierName}</span> est en cours de développement.
          </p>

          <p style={{
            fontSize: '1rem',
            color: '#8ea2c3',
            lineHeight: 1.7,
            marginBottom: '2rem'
          }}>
            Nous travaillons activement pour vous offrir une gestion adaptée à votre métier. Restez informé de l'avancement !
          </p>

          <div style={{
            background: 'linear-gradient(145deg, rgba(34,211,238,0.1), rgba(6,182,212,0.08))',
            border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', justifyContent: 'center' }}>
              <Sparkles size={20} style={{ color: '#22d3ee' }} />
              <span style={{ color: '#f4f8ff', fontSize: '1.125rem', fontWeight: 600 }}>Ce qui vous attend</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
              {[
                'Interface adaptée à votre métier',
                'Gestion spécifique à votre activité',
                'Tableau de bord personnalisé',
                'Support dédié'
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: '#8ea2c3', fontSize: '0.9375rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22d3ee' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '1rem 2rem',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(34,211,238,0.4)'
              }}
            >
              Découvrir les métiers disponibles
              <Sparkles size={18} />
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '1rem 2rem',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.05)',
                color: '#f8fbff',
                border: '1px solid rgba(255,255,255,0.1)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
            >
              <Mail size={18} />
              Être notifié
            </button>
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.875rem',
          marginTop: '2rem'
        }}>
          Besoin d'aide ? <a href="/contact" style={{ color: '#22d3ee', textDecoration: 'none' }}>Contactez notre équipe</a>
        </p>
      </div>
    </div>
  );
};

export default MetierComingSoonPage;
