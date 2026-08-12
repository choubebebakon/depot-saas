import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  X,
  Menu,
  Zap,
  TrendingUp,
  Package,
  BarChart3,
  Truck,
  Users,
  DollarSign,
  AlertTriangle,
  Sparkles,
  BrainCircuit,
  Bot,
  Warehouse,
  ShoppingBag,
  CreditCard,
  Clock,
  CheckCircle,
  Play,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  Box,
  Store,
  Phone,
  MapPin,
  FileText,
  RefreshCw
} from 'lucide-react';
import logo from '../assets/logo-neon.png';
import Footer from '../components/Footer';

const DepotBoissonsLandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="depot-boissons-landing">
      {/* Navigation */}
      <nav className="nav-liquid" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '1rem 2rem',
        background: scrollY > 50 ? 'rgba(2, 6, 23, 0.85)' : 'transparent',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'all 0.3s ease',
        borderBottom: scrollY > 50 ? '1px solid rgba(115, 165, 255, 0.15)' : 'none'
      }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={logo} alt="GESTOCK" style={{ height: '40px', width: 'auto' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fbff', letterSpacing: '-0.02em' }}>GESTOCK</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '2rem', display: window.innerWidth > 768 ? 'flex' : 'none' }}>
              <a onClick={() => navigate('/')} style={{ color: '#91a4c4', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, transition: 'color 0.2s ease', cursor: 'pointer' }}>Produit</a>
              <a onClick={() => navigate('/features')} style={{ color: '#91a4c4', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, transition: 'color 0.2s ease', cursor: 'pointer' }}>Fonctionnalités</a>
              <a onClick={() => navigate('/pricing')} style={{ color: '#91a4c4', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, transition: 'color 0.2s ease', cursor: 'pointer' }}>Tarifs</a>
              <a onClick={() => navigate('/contact')} style={{ color: '#91a4c4', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, transition: 'color 0.2s ease', cursor: 'pointer' }}>Contact</a>
            </div>
            <button onClick={() => navigate('/login')} style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}>
              Se connecter
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-liquid" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '8rem 2rem 4rem',
        background: 'radial-gradient(circle at 8% 5%, rgba(77,123,255,.20), transparent 28%), radial-gradient(circle at 92% 8%, rgba(139,92,246,.20), transparent 30%), radial-gradient(circle at 50% 100%, rgba(38,91,180,.16), transparent 34%), linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 8s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 10s ease-in-out infinite reverse'
        }} />

        <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          {/* Left content */}
          <div style={{ zIndex: 1 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, rgba(245,158,11,.16), rgba(251,146,60,.11))',
              border: '1px solid rgba(245,158,11,.30)',
              borderRadius: '100px',
              padding: '0.5rem 1rem',
              marginBottom: '1.5rem',
              backdropFilter: 'blur(18px)'
            }}>
              <Sparkles size={16} style={{ color: '#fbbf24' }} />
              <span style={{ color: '#fbbf24', fontSize: '0.8125rem', fontWeight: 600 }}>Gestion intelligente propulsée par l'IA</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 900,
              color: '#f8fbff',
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em',
              textShadow: '0 10px 40px rgba(245,158,11,.18)'
            }}>
              Votre dépôt tourne.<br />
              <span style={{ background: 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 42%,#d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GesTock garde le contrôle.</span>
            </h1>

            <p style={{
              fontSize: '1.125rem',
              color: '#91a4c4',
              lineHeight: 1.7,
              marginBottom: '2rem',
              maxWidth: '540px'
            }}>
              De la réception fournisseur à la livraison client, pilotez votre dépôt en temps réel et laissez l'IA vous aider à transformer vos données en décisions.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button onClick={() => navigate('/register')} style={{
                padding: '1rem 2rem',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)'
              }}>
                🚀 Commencer avec mon dépôt
                <ArrowRight size={20} />
              </button>
              <button style={{
                padding: '1rem 2rem',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.05)',
                color: '#f8fbff',
                border: '1px solid rgba(255,255,255,0.1)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}>
                <Play size={20} />
                Voir comment ça fonctionne
              </button>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {['Sans carte bancaire', 'Essai 14 jours', 'Annulable à tout moment', 'Support en français'].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8ea2c3', fontSize: '0.875rem' }}>
                  <CheckCircle size={16} style={{ color: '#5ee0a2' }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right - Dashboard Preview */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
              border: '1px solid rgba(171,202,255,.17)',
              borderRadius: '30px',
              padding: '2rem',
              backdropFilter: 'blur(28px) saturate(145%)',
              WebkitBackdropFilter: 'blur(28px) saturate(145%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.14), inset 0 -1px 0 rgba(0,0,0,.22), 0 28px 80px rgba(0,0,0,.32)',
              position: 'relative',
              animation: 'float 6s ease-in-out infinite'
            }}>
              {/* Dashboard Header */}
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(169,198,255,.13)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Warehouse size={20} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <p style={{ color: '#f4f8ff', fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Bonjour 👋</p>
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: 0 }}>Voici l'état de votre dépôt</p>
                  </div>
                </div>
              </div>

              {/* Dashboard Stats */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Ventes */}
                <div style={{
                  background: 'rgba(255,255,255,0.045)',
                  border: '1px solid rgba(190,213,255,.12)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={24} style={{ color: '#22c55e' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Ventes aujourd'hui</p>
                    <p style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>1 845 000 FCFA</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#22c55e', fontSize: '0.875rem', fontWeight: 600 }}>
                    <ArrowUp size={16} />
                    12,4%
                  </div>
                </div>

                {/* Stock */}
                <div style={{
                  background: 'rgba(255,255,255,0.045)',
                  border: '1px solid rgba(190,213,255,.12)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={24} style={{ color: '#3b82f6' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Stock</p>
                    <p style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>8 420 unités</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontSize: '0.875rem', fontWeight: 600 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                    Normal
                  </div>
                </div>

                {/* Alertes */}
                <div style={{
                  background: 'rgba(255,255,255,0.045)',
                  border: '1px solid rgba(190,213,255,.12)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Alertes</p>
                    <p style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>4 produits critiques</p>
                  </div>
                </div>

                {/* Tournées */}
                <div style={{
                  background: 'rgba(255,255,255,0.045)',
                  border: '1px solid rgba(190,213,255,.12)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={24} style={{ color: '#8b5cf6' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Tournées actives</p>
                    <p style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>7 en cours</p>
                  </div>
                </div>

                {/* Créances */}
                <div style={{
                  background: 'rgba(255,255,255,0.045)',
                  border: '1px solid rgba(190,213,255,.12)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={24} style={{ color: '#ef4444' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Créances clients</p>
                    <p style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>485 000 FCFA</p>
                  </div>
                </div>
              </div>

              {/* AI Suggestion */}
              <div style={{
                marginTop: '1.5rem',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.15))',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '16px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <Bot size={20} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                <div>
                  <p style={{ color: '#f4f8ff', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>✨ IA GesTock</p>
                  <p style={{ color: '#8ea2c3', fontSize: '0.8125rem', margin: 0, lineHeight: 1.5 }}>3 produits risquent d'atteindre leur seuil critique prochainement.</p>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-30px',
              background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
              border: '1px solid rgba(171,202,255,.17)',
              borderRadius: '20px',
              padding: '1rem',
              backdropFilter: 'blur(28px)',
              animation: 'float 5s ease-in-out infinite 1s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Package size={20} style={{ color: '#3b82f6' }} />
              <div>
                <p style={{ color: '#8ea2c3', fontSize: '0.75rem', margin: 0 }}>Stock</p>
                <p style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>+12,4%</p>
              </div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '-30px',
              background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
              border: '1px solid rgba(171,202,255,.17)',
              borderRadius: '20px',
              padding: '1rem',
              backdropFilter: 'blur(28px)',
              animation: 'float 5s ease-in-out infinite 2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Truck size={20} style={{ color: '#8b5cf6' }} />
              <div>
                <p style={{ color: '#8ea2c3', fontSize: '0.75rem', margin: 0 }}>Livraisons</p>
                <p style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>7 actives</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section style={{ padding: '6rem 2rem', background: '#020617' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#f8fbff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Un dépôt de boissons ne se résume pas à vendre des casiers.
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#91a4c4',
              lineHeight: 1.7,
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              Chaque journée vous devez gérer : les commandes fournisseurs, les réceptions, les stocks, les ventes, les paiements, les crédits, les créances, la caisse, les livraisons, les tournées, les réapprovisionnements.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '30px',
            padding: '3rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 700,
              color: '#f8fbff',
              marginBottom: '1rem',
              letterSpacing: '-0.01em'
            }}>
              Quand l'information est dispersée, la décision devient incertaine.
            </p>
            <p style={{
              fontSize: '1.25rem',
              color: '#8b5cf6',
              fontWeight: 600
            }}>
              GesTock rassemble tout.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#f8fbff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Votre dépôt en un seul regard.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: DollarSign, title: 'Ventes du jour', desc: 'Sachez immédiatement où vous en êtes.' },
              { icon: AlertTriangle, title: 'Stock critique', desc: 'Identifiez les produits nécessitant votre attention.' },
              { icon: Truck, title: 'Livraisons en cours', desc: 'Visualisez votre activité de livraison.' },
              { icon: CreditCard, title: 'Caisse du jour', desc: 'Gardez une vision claire des mouvements de caisse.' },
              { icon: Users, title: 'Clients débiteurs', desc: 'Suivez vos crédits et vos créances.' },
              { icon: BarChart3, title: 'Ventes 30 jours', desc: 'Comprenez l\'évolution de votre activité.' },
              { icon: TrendingUp, title: 'Top articles', desc: 'Identifiez vos produits les plus performants.' }
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
                border: '1px solid rgba(171,202,255,.17)',
                borderRadius: '24px',
                padding: '2rem',
                backdropFilter: 'blur(28px)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}>
                <item.icon size={32} style={{ color: '#8b5cf6', marginBottom: '1rem' }} />
                <h3 style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>{item.title}</h3>
                <p style={{ color: '#8ea2c3', fontSize: '0.9375rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section style={{ padding: '6rem 2rem', background: '#020617', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />

        <div style={{ maxWidth: '1320px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#f8fbff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Votre dépôt produit des données. L'IA vous aide à les comprendre.
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#8b5cf6',
              fontWeight: 600
            }}>
              Ne regardez plus seulement vos chiffres. Comprenez ce qu'ils signifient.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '2px solid rgba(139,92,246,0.4)',
            borderRadius: '30px',
            padding: '3rem',
            backdropFilter: 'blur(28px)',
            maxWidth: '700px',
            margin: '0 auto',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              padding: '0.5rem 1.5rem',
              borderRadius: '100px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}>
              ✨ GESTOCK AI
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <p style={{ color: '#f4f8ff', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Analyse de votre activité</p>
              
              <div style={{
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
                  <span style={{ color: '#f59e0b', fontSize: '1.125rem', fontWeight: 700 }}>Attention</span>
                </div>
                <p style={{ color: '#8ea2c3', fontSize: '1rem', lineHeight: 1.6 }}>
                  3 articles présentent actuellement un niveau de stock à surveiller.
                </p>
              </div>

              <div style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <Sparkles size={24} style={{ color: '#22c55e' }} />
                  <span style={{ color: '#22c55e', fontSize: '1.125rem', fontWeight: 700 }}>Recommandation</span>
                </div>
                <p style={{ color: '#8ea2c3', fontSize: '1rem', lineHeight: 1.6 }}>
                  Vérifiez votre prochain réapprovisionnement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stock Section */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#f8fbff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Ne découvrez plus une rupture quand il est déjà trop tard.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              'Suivi en temps réel',
              'Seuils de sécurité',
              'Alertes stock critique',
              'Évolution du stock',
              'Réapprovisionnement'
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
                border: '1px solid rgba(171,202,255,.17)',
                borderRadius: '16px',
                padding: '1.5rem',
                backdropFilter: 'blur(28px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle size={20} style={{ color: '#5ee0a2' }} />
                <span style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button onClick={() => navigate('/register')} style={{
              padding: '1rem 2rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}>
              Maîtriser mon stock
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Ventes & Caisse Section */}
      <section style={{ padding: '6rem 2rem', background: '#020617' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#f8fbff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Chaque vente. Chaque paiement. Chaque journée.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              'Enregistrer les ventes',
              'Suivre les paiements',
              'Gérer les sessions de caisse',
              'Définir le fonds initial',
              'Clôturer les caisses'
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
                border: '1px solid rgba(171,202,255,.17)',
                borderRadius: '16px',
                padding: '1.5rem',
                backdropFilter: 'blur(28px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle size={20} style={{ color: '#5ee0a2' }} />
                <span style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '24px',
            padding: '2rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '1.25rem',
              color: '#f4f8ff',
              fontWeight: 600,
              marginBottom: 0
            }}>
              Vous savez ce qui est vendu. Vous savez ce qui est encaissé.
            </p>
          </div>
        </div>
      </section>

      {/* Clients & Crédits Section */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#f8fbff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Le crédit client ne doit jamais devenir une dette oubliée.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              'Fiches clients',
              'Crédits',
              'Dettes',
              'Suivi des créances'
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
                border: '1px solid rgba(171,202,255,.17)',
                borderRadius: '16px',
                padding: '1.5rem',
                backdropFilter: 'blur(28px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle size={20} style={{ color: '#5ee0a2' }} />
                <span style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button onClick={() => navigate('/register')} style={{
              padding: '1rem 2rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}>
              Reprendre le contrôle de mes créances
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Livraisons Section */}
      <section style={{ padding: '6rem 2rem', background: '#020617' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#f8fbff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              De votre dépôt jusqu'au client.
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#91a4c4',
              marginBottom: '3rem'
            }}>
              Planifiez et suivez vos tournées.
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            marginBottom: '3rem'
          }}>
            {[
              { icon: Warehouse, label: 'Dépôt' },
              { icon: ShoppingBag, label: 'Commande' },
              { icon: Package, label: 'Préparation' },
              { icon: Truck, label: 'Tournée' },
              { icon: Users, label: 'Client' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <item.icon size={32} style={{ color: '#fff' }} />
                </div>
                <span style={{ color: '#f4f8ff', fontSize: '1.125rem', fontWeight: 700 }}>{item.label}</span>
                {idx < 4 && <ArrowDown size={24} style={{ color: '#8ea2c3' }} />}
              </div>
            ))}
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '24px',
            padding: '2rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '1.25rem',
              color: '#f4f8ff',
              fontWeight: 600,
              marginBottom: 0
            }}>
              Une meilleure visibilité sur vos livraisons, du départ à l'arrivée.
            </p>
          </div>
        </div>
      </section>

      {/* Réapprovisionnement Section */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#f8fbff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Achetez mieux. Anticipez davantage.
            </h2>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '24px',
            padding: '2rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <BrainCircuit size={48} style={{ color: '#8b5cf6', marginBottom: '1rem' }} />
            <p style={{
              fontSize: '1.125rem',
              color: '#8ea2c3',
              lineHeight: 1.7,
              marginBottom: 0
            }}>
              Analysez vos tendances de stock et identifiez les situations nécessitant votre attention.
            </p>
          </div>
        </div>
      </section>

      {/* Pour Qui Section */}
      <section style={{ padding: '6rem 2rem', background: '#020617' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#f8fbff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Pour qui ?
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { icon: Package, title: 'Dépôt pur', desc: 'Bières, sodas, eaux, jus.' },
              { icon: ShoppingBag, title: 'Dépôt mixte', desc: 'Boissons + produits alimentaires associés.' },
              { icon: Store, title: 'Glacier / Snack', desc: 'Gestion adaptée à la vente directe.' }
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
                border: '1px solid rgba(171,202,255,.17)',
                borderRadius: '24px',
                padding: '2rem',
                backdropFilter: 'blur(28px)',
                textAlign: 'center'
              }}>
                <item.icon size={48} style={{ color: '#8b5cf6', marginBottom: '1rem' }} />
                <h3 style={{ color: '#f4f8ff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>{item.title}</h3>
                <p style={{ color: '#8ea2c3', fontSize: '1rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Résultat Section */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#f8fbff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Moins de zones d'ombre. Plus de contrôle.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
            <div>
              <h3 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Avant GesTock</h3>
              {[
                'Informations dispersées',
                'Stocks difficiles à suivre',
                'Créances difficiles à contrôler',
                'Vision limitée des livraisons',
                'Décisions basées sur des estimations'
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <X size={20} style={{ color: '#ef4444' }} />
                  <span style={{ color: '#8ea2c3', fontSize: '1rem' }}>{item}</span>
                </div>
              ))}
            </div>

            <div>
              <h3 style={{ color: '#22c55e', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Avec GesTock</h3>
              {[
                'Vision centralisée',
                'Stock maîtrisé',
                'Créances suivies',
                'Tournées visibles',
                'Données disponibles',
                'IA pour vous aider à analyser'
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Check size={20} style={{ color: '#22c55e' }} />
                  <span style={{ color: '#8ea2c3', fontSize: '1rem' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{ padding: '6rem 2rem', background: '#020617', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />

        <div style={{ maxWidth: '1320px', margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            color: '#f8fbff',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em'
          }}>
            Votre dépôt mérite mieux que des approximations.
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#91a4c4',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            maxWidth: '700px',
            margin: '0 auto 2.5rem'
          }}>
            Passez à une gestion plus claire, plus structurée et plus intelligente.
          </p>
          <button onClick={() => navigate('/register')} style={{
            padding: '1.25rem 2.5rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '1.125rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)'
          }}>
            🚀 Commencer avec GesTock
            <ArrowRight size={24} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .depot-boissons-landing {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #e8efff;
          background: #020617;
        }

        .nav-liquid a:hover {
          color: #f8fbff;
        }

        .hero-liquid > div > div > div:first-child {
          animation: fadeInUp 0.8s ease;
        }

        .hero-liquid > div > div > div:last-child {
          animation: fadeInUp 0.8s ease 0.2s both;
        }

        @media (max-width: 968px) {
          .hero-liquid > div > div {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
        }

        @media (max-width: 768px) {
          .nav-liquid > div > div > div:nth-child(2) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DepotBoissonsLandingPage;
