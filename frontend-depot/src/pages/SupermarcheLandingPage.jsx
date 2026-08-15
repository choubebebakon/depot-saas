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
  ShoppingBag,
  Store,
  CreditCard,
  Clock,
  CheckCircle,
  Play,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  Box,
  Phone,
  MapPin,
  FileText,
  RefreshCw,
  Scan,
  Tag,
  Percent,
  Shield,
  User,
  LayoutGrid,
  Receipt
} from 'lucide-react';
import logo from '../assets/logo-neon.png';
import Footer from '../components/Footer';

const SupermarcheLandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="supermarche-landing">
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
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
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
        background: 'radial-gradient(circle at 8% 5%, rgba(245,158,11,.20), transparent 28%), radial-gradient(circle at 92% 8%, rgba(217,119,6,.20), transparent 30%), radial-gradient(circle at 50% 100%, rgba(180,83,9,.16), transparent 34%), linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)',
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
          background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 8s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(217,119,6,0.1) 0%, transparent 70%)',
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
              background: 'linear-gradient(135deg, rgba(245,158,11,.16), rgba(217,119,6,.11))',
              border: '1px solid rgba(245,158,11,.30)',
              borderRadius: '100px',
              padding: '0.5rem 1rem',
              marginBottom: '1.5rem',
              backdropFilter: 'blur(18px)'
            }}>
              <Sparkles size={16} style={{ color: '#fbbf24' }} />
              <span style={{ color: '#fbbf24', fontSize: '0.8125rem', fontWeight: 600 }}>Gestion intelligente avec IA</span>
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
              Des milliers de produits.<br />
              <span style={{ background: 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 42%,#d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Une seule vision.</span>
            </h1>

            <p style={{
              fontSize: '1.125rem',
              color: '#91a4c4',
              lineHeight: 1.7,
              marginBottom: '2rem',
              maxWidth: '540px'
            }}>
              Rayons, articles, codes-barres, fournisseurs, promotions, réceptions, ventes POS, dépenses et inventaires : GesTock vous aide à piloter votre supermarché depuis une seule plateforme intelligente.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button onClick={() => navigate('/register')} style={{
                padding: '1rem 2rem',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(245,158,11,0.4)'
              }}>
                🚀 Équiper mon supermarché
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
                Découvrir le système
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
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={20} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <p style={{ color: '#f4f8ff', fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Supermarché</p>
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: 0 }}>Vue d'ensemble</p>
                  </div>
                </div>
              </div>

              {/* Dashboard Stats */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                {/* CA */}
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
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>CA aujourd'hui</p>
                    <p style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>3 842 500 FCFA</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#22c55e', fontSize: '0.875rem', fontWeight: 600 }}>
                    <ArrowUp size={16} />
                    8,7%
                  </div>
                </div>

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
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={24} style={{ color: '#3b82f6' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Ventes</p>
                    <p style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>286 ventes</p>
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
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Alertes stock</p>
                    <p style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>14 alertes</p>
                  </div>
                </div>

                {/* Promotions */}
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
                    <Tag size={24} style={{ color: '#8b5cf6' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Promotions actives</p>
                    <p style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>23 actives</p>
                  </div>
                </div>

                {/* Inventaire */}
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
                    <CheckCircle size={24} style={{ color: '#22c55e' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Inventaire</p>
                    <p style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>98,2% correspondance</p>
                  </div>
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
              <ShoppingBag size={20} style={{ color: '#f59e0b' }} />
              <div>
                <p style={{ color: '#8ea2c3', fontSize: '0.75rem', margin: 0 }}>Ventes</p>
                <p style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>+8,7%</p>
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
              <Tag size={20} style={{ color: '#8b5cf6' }} />
              <div>
                <p style={{ color: '#8ea2c3', fontSize: '0.75rem', margin: 0 }}>Promotions</p>
                <p style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>23 actives</p>
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
              Plus votre supermarché grandit, plus la gestion devient complexe.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              'Des centaines ou milliers de références',
              'Des rayons différents',
              'Des fournisseurs différents',
              'Des promotions',
              'Des caisses',
              'Des inventaires',
              'Des employés'
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
                <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                <span style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 600 }}>{item}</span>
              </div>
            ))}
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
              GesTock transforme cette complexité en organisation.
            </p>
          </div>
        </div>
      </section>

      {/* Rayons Section */}
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
              Chaque produit à sa place. Chaque rayon à sa logique.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              { icon: Package, name: 'Alimentaire', color: '#22c55e' },
              { icon: Sparkles, name: 'Hygiène', color: '#3b82f6' },
              { icon: LayoutGrid, name: 'Électronique', color: '#8b5cf6' },
              { icon: Store, name: 'Bazar', color: '#f59e0b' },
              { icon: ShoppingBag, name: 'Liquide', color: '#06b6d4' },
              { icon: RefreshCw, name: 'Frais', color: '#10b981' }
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
                border: '1px solid rgba(171,202,255,.17)',
                borderRadius: '24px',
                padding: '2rem',
                backdropFilter: 'blur(28px)',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: `${item.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <item.icon size={32} style={{ color: item.color }} />
                </div>
                <h3 style={{ color: '#f4f8ff', fontSize: '1.25rem', fontWeight: 700, marginBottom: 0 }}>{item.name}</h3>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {[
              'Couleurs personnalisables',
              'Ordre d\'affichage',
              'Organisation structurée'
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
        </div>
      </section>

      {/* Articles Section */}
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
              Votre catalogue, jusque dans les moindres détails.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              'Code-barres',
              'Prix d\'achat',
              'Prix de vente',
              'Seuil critique',
              'Familles',
              'Marques',
              'Plusieurs codes-barres'
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
              Identifiez rapidement vos produits et gardez une meilleure maîtrise de votre catalogue.
            </p>
          </div>
        </div>
      </section>

      {/* POS Section */}
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
              Une caisse qui suit le rythme de votre commerce.
            </h2>
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
              { icon: Scan, label: 'Scanner' },
              { icon: ShoppingBag, label: 'Ajouter au panier' },
              { icon: Percent, label: 'Remise' },
              { icon: CreditCard, label: 'Paiement' },
              { icon: CheckCircle, label: 'Vente terminée' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
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
              Moins de friction. Plus de fluidité au point de vente.
            </p>
          </div>
        </div>
      </section>

      {/* Promotions Section */}
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
              Transformez vos promotions en véritables leviers commerciaux.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            {[
              { icon: Percent, title: '%', desc: 'Promotion en pourcentage.' },
              { icon: DollarSign, title: 'Montant fixe', desc: 'Réduction d\'un montant défini.' },
              { icon: Tag, title: 'Prix fixe', desc: 'Vente à un prix promotionnel.' }
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
                border: '1px solid rgba(171,202,255,.17)',
                borderRadius: '24px',
                padding: '2rem',
                backdropFilter: 'blur(28px)',
                textAlign: 'center'
              }}>
                <item.icon size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                <h3 style={{ color: '#f4f8ff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>{item.title}</h3>
                <p style={{ color: '#8ea2c3', fontSize: '1rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {[
              'Date de début',
              'Date de fin',
              'Activation',
              'Désactivation'
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
        </div>
      </section>

      {/* AI Section */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
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
              L'IA vous aide à lire ce que votre supermarché vous raconte.
            </h2>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '2px solid rgba(245,158,11,0.4)',
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
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              padding: '0.5rem 1.5rem',
              borderRadius: '100px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}>
              ✨ GESTOCK AI
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <p style={{ color: '#f4f8ff', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Analyse commerciale</p>
              
              <div style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <TrendingUp size={24} style={{ color: '#22c55e' }} />
                  <span style={{ color: '#22c55e', fontSize: '1.125rem', fontWeight: 700 }}>📈 Les ventes de votre rayon</span>
                </div>
                <p style={{ color: '#8ea2c3', fontSize: '1rem', lineHeight: 1.6 }}>
                  Alimentaire progressent.
                </p>
              </div>

              <div style={{
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
                  <span style={{ color: '#f59e0b', fontSize: '1.125rem', fontWeight: 700 }}>⚠️ 5 références présentent</span>
                </div>
                <p style={{ color: '#8ea2c3', fontSize: '1rem', lineHeight: 1.6 }}>
                  un niveau de stock à surveiller.
                </p>
              </div>

              <div style={{
                background: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <Sparkles size={24} style={{ color: '#8b5cf6' }} />
                  <span style={{ color: '#8b5cf6', fontSize: '1.125rem', fontWeight: 700 }}>💡 Analysez ces articles</span>
                </div>
                <p style={{ color: '#8ea2c3', fontSize: '1rem', lineHeight: 1.6 }}>
                  avant votre prochain réapprovisionnement.
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '24px',
            padding: '2rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center',
            marginTop: '3rem',
            maxWidth: '800px',
            margin: '3rem auto 0'
          }}>
            <p style={{
              fontSize: '1.25rem',
              color: '#f4f8ff',
              fontWeight: 600,
              marginBottom: 0
            }}>
              L'objectif n'est pas de remplacer votre décision. C'est de vous donner de meilleures informations pour la prendre.
            </p>
          </div>
        </div>
      </section>

      {/* Inventaire Section */}
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
              Votre stock théorique face à la réalité.
            </h2>
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
              'Stock théorique',
              'Inventaire physique',
              'Comparaison',
              'Identification des écarts'
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Package size={32} style={{ color: '#fff' }} />
                </div>
                <span style={{ color: '#f4f8ff', fontSize: '1.125rem', fontWeight: 700 }}>{item}</span>
                {idx < 3 && <ArrowDown size={24} style={{ color: '#8ea2c3' }} />}
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
              Comptez. Comparez. Comprenez. Contrôlez.
            </p>
          </div>
        </div>
      </section>

      {/* Fournisseurs Section */}
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
              Maîtrisez vos approvisionnements.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {[
              'Fournisseurs',
              'Réceptions',
              'Bordereaux',
              'Lignes de réception',
              'Paiements partiels'
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
        </div>
      </section>

      {/* Dépenses Section */}
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
              Une dépense doit laisser une trace.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {[
              'Montant',
              'Motif',
              'Catégorie',
              'Justificatif photo'
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
        </div>
      </section>

      {/* Équipes Section */}
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
              Chaque collaborateur doit avoir le bon rôle.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {[
              { icon: User, title: 'Gérant', desc: 'Vision globale.' },
              { icon: Package, title: 'Magasinier', desc: 'Stocks et réceptions.' },
              { icon: CreditCard, title: 'Caissier', desc: 'Ventes.' },
              { icon: BarChart3, title: 'Comptable', desc: 'Rapports et finances.' }
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
                border: '1px solid rgba(171,202,255,.17)',
                borderRadius: '24px',
                padding: '2rem',
                backdropFilter: 'blur(28px)',
                textAlign: 'center'
              }}>
                <item.icon size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                <h3 style={{ color: '#f4f8ff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>{item.title}</h3>
                <p style={{ color: '#8ea2c3', fontSize: '1rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '24px',
            padding: '2rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center',
            marginTop: '3rem'
          }}>
            <p style={{
              fontSize: '1.25rem',
              color: '#f4f8ff',
              fontWeight: 600,
              marginBottom: 0
            }}>
              Plus de clarté dans les responsabilités.
            </p>
          </div>
        </div>
      </section>

      {/* Sous-métiers Section */}
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
              Sous-métiers
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              'Alimentaire',
              'Hygiène',
              'Électronique',
              'Bazar',
              'Liquide',
              'Frais'
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
                border: '1px solid rgba(171,202,255,.17)',
                borderRadius: '20px',
                padding: '2rem',
                backdropFilter: 'blur(28px)',
                textAlign: 'center'
              }}>
                <span style={{ color: '#f4f8ff', fontSize: '1.5rem', fontWeight: 700 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
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
            Votre supermarché devient plus grand. Votre gestion doit évoluer avec lui.
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#91a4c4',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            maxWidth: '700px',
            margin: '0 auto 2.5rem'
          }}>
            Passez d'une gestion dispersée à une vision centralisée, structurée et intelligente.
          </p>
          <button onClick={() => navigate('/register')} style={{
            padding: '1.25rem 2.5rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '1.125rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(245,158,11,0.4)'
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

        .supermarche-landing {
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

export default SupermarcheLandingPage;
