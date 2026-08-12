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
  Receipt,
  Shirt,
  Smartphone,
  Sparkles as SparklesIcon,
  Home,
  Laptop,
  BookOpen,
  Coffee,
  Droplets,
  Sofa,
  Briefcase,
  Gem,
  Gamepad2,
  Trophy,
  Wrench,
  Car,
  Gift,
  Building2,
  Footprints
} from 'lucide-react';
import logo from '../assets/logo-neon.png';
import Footer from '../components/Footer';

const boutiqueTypes = [
  { id: 'mode', icon: Shirt, name: 'Mode', subtypes: ['Vêtements', 'Prêt-à-porter', 'Mode homme', 'Mode femme', 'Mode enfant', 'Accessoires'], message: 'Organisez vos collections et catégories, suivez vos articles, vos ventes, vos stocks et vos promotions.' },
  { id: 'chaussures', icon: Footprints, name: 'Chaussures', subtypes: ['Chaussures homme', 'Chaussures femme', 'Chaussures enfant', 'Sneakers', 'Sandales', 'Sport'], message: 'Du catalogue à la vente, gardez une vision claire de vos articles et de vos stocks.' },
  { id: 'telephonie', icon: Smartphone, name: 'Téléphonie', subtypes: ['Smartphones', 'Accessoires', 'Chargeurs', 'Écouteurs', 'Coques', 'Câbles', 'High-tech'], message: 'Gérez facilement vos références et gardez le contrôle sur votre catalogue et vos ventes.' },
  { id: 'beaute', icon: SparklesIcon, name: 'Beauté', subtypes: ['Parfumerie', 'Cosmétiques', 'Maquillage', 'Soins', 'Cheveux', 'Accessoires'], message: 'Organisez votre catalogue beauté, gérez vos promotions et suivez vos ventes simplement.' },
  { id: 'electromenager', icon: Home, name: 'Électroménager', subtypes: ['Réfrigérateurs', 'Téléviseurs', 'Cuisinières', 'Micro-ondes', 'Lave-linge', 'Petits appareils'], message: 'Gardez une vision claire de vos articles, de vos stocks et de vos ventes.' },
  { id: 'informatique', icon: Laptop, name: 'Informatique', subtypes: ['Ordinateurs', 'PC portables', 'Imprimantes', 'Écrans', 'Claviers', 'Composants'], message: 'Centralisez votre catalogue et facilitez le suivi de vos références.' },
  { id: 'alimentaire', icon: Coffee, name: 'Alimentaire', subtypes: ['Épicerie', 'Produits alimentaires', 'Produits secs', 'Supérettes', 'Commerce spécialisé'], message: 'Suivez vos articles, vos ventes et vos stocks au même endroit.' },
  { id: 'librairie', icon: BookOpen, name: 'Librairie', subtypes: ['Livres', 'Papeterie', 'Fournitures scolaires', 'Fournitures de bureau', 'Cahiers'], message: 'Organisez votre catalogue et retrouvez rapidement vos articles.' },
  { id: 'entretien', icon: Droplets, name: 'Entretien', subtypes: ['Produits ménagers', 'Lessives', 'Nettoyage', 'Accessoires ménagers'], message: 'Un catalogue organisé pour une gestion plus simple au quotidien.' },
  { id: 'maison', icon: Sofa, name: 'Maison', subtypes: ['Décoration', 'Articles de maison', 'Ustensiles', 'Petit mobilier'], message: 'Gérez facilement un catalogue varié et gardez une vision globale de votre activité.' },
  { id: 'maroquinerie', icon: Briefcase, name: 'Maroquinerie', subtypes: ['Sacs', 'Portefeuilles', 'Ceintures', 'Bagagerie', 'Articles de voyage'], message: 'Gérez vos articles de maroquinerie avec précision.' },
  { id: 'bijouterie', icon: Gem, name: 'Bijouterie', subtypes: ['Bijoux', 'Montres', 'Accessoires', 'Articles fantaisie'], message: 'Suivez vos articles précieux et vos ventes avec soin.' },
  { id: 'jouets', icon: Gamepad2, name: 'Jouets', subtypes: ['Jouets', 'Jeux', 'Articles enfants', 'Accessoires bébé', 'Puériculture'], message: 'Gérez votre catalogue de jouets et articles pour enfants.' },
  { id: 'sport', icon: Trophy, name: 'Sport', subtypes: ['Articles de sport', 'Vêtements sportifs', 'Chaussures de sport', 'Accessoires', 'Loisirs'], message: 'Organisez vos articles sportifs et suivez vos ventes.' },
  { id: 'quincaillerie', icon: Wrench, name: 'Quincaillerie', subtypes: ['Outils', 'Matériel bricolage', 'Accessoires', 'Produits quincaillerie'], message: 'Gérez votre quincaillerie avec une vision claire de vos stocks.' },
  { id: 'automobile', icon: Car, name: 'Automobile', subtypes: ['Accessoires auto', 'Pièces', 'Entretien', 'Accessoires véhicules'], message: 'Suivez vos articles automobiles et vos ventes facilement.' },
  { id: 'cadeaux', icon: Gift, name: 'Cadeaux', subtypes: ['Cadeaux', 'Articles décoratifs', 'Souvenirs', 'Produits personnalisés'], message: 'Gérez votre catalogue de cadeaux et articles divers.' },
  { id: 'general', icon: Building2, name: 'Commerce général', subtypes: ['Multi-catégories', 'Produits variés', 'Commerce mixte'], message: 'Configurez votre boutique selon votre activité multi-catégories.' }
];

const BoutiqueLandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="boutique-landing">
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
        borderBottom: scrollY > 50 ? '1px solid rgba(8, 145, 178, 0.15)' : 'none'
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
              background: 'linear-gradient(135deg, #0891b2, #0e7490)',
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
        background: 'radial-gradient(circle at 8% 5%, rgba(8,145,178,.20), transparent 28%), radial-gradient(circle at 92% 8%, rgba(14,116,144,.20), transparent 30%), radial-gradient(circle at 50% 100%, rgba(21,94,117,.16), transparent 34%), linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)',
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
          background: 'radial-gradient(circle, rgba(8,145,178,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 8s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(14,116,144,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 10s ease-in-out infinite reverse'
        }} />

        <div style={{ maxWidth: '1320px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, rgba(8,145,178,.16), rgba(14,116,144,.11))',
            border: '1px solid rgba(8,145,178,.30)',
            borderRadius: '100px',
            padding: '0.5rem 1rem',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(18px)'
          }}>
            <Sparkles size={16} style={{ color: '#22d3ee' }} />
            <span style={{ color: '#22d3ee', fontSize: '0.8125rem', fontWeight: 600 }}>Propulsé par GesTock AI</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 900,
            color: '#f8fbff',
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
            textShadow: '0 10px 40px rgba(8,145,178,.18)'
          }}>
            Votre boutique. Votre métier.<br />
            <span style={{ background: 'linear-gradient(135deg,#22d3ee 0%,#0891b2 42%,#0e7490 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Votre gestion.</span>
          </h1>

          <p style={{
            fontSize: '1.125rem',
            color: '#91a4c4',
            lineHeight: 1.7,
            marginBottom: '2rem',
            maxWidth: '700px',
            margin: '0 auto 2rem'
          }}>
            Quel que soit votre commerce, GesTock s'adapte à votre boutique.
          </p>

          <p style={{
            fontSize: '1rem',
            color: '#8ea2c3',
            lineHeight: 1.7,
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            Mode, chaussures, téléphonie, parfumerie, électroménager, beauté, alimentation, librairie et bien plus : gérez vos articles, ventes, stocks, promotions et clients depuis une seule plateforme intelligente.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
            <button onClick={() => navigate('/register')} style={{
              padding: '1rem 2rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0891b2, #0e7490)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(8,145,178,0.4)'
            }}>
              🚀 Commencer avec GesTock
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
              Découvrir GesTock Boutique
            </button>
          </div>

          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Sans carte bancaire', 'Essai 14 jours', 'Annulable à tout moment', 'Support en français'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8ea2c3', fontSize: '0.875rem' }}>
                <CheckCircle size={16} style={{ color: '#5ee0a2' }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Une boutique n'est jamais simplement "une boutique" */}
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
              💎 Une boutique n'est jamais simplement « une boutique »
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              'Une boutique de vêtements ne fonctionne pas exactement comme une boutique de téléphonie.',
              'Une parfumerie n\'a pas les mêmes produits qu\'une boutique de chaussures.',
              'Un commerce d\'électroménager n\'a pas le même catalogue qu\'une librairie.'
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
                <CheckCircle size={20} style={{ color: '#0891b2' }} />
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
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <p style={{ color: '#8ea2c3', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '1rem' }}>
              Mais tous ont un besoin commun : vendre, contrôler leurs stocks, connaître leurs produits, suivre leurs clients et comprendre leur activité.
            </p>
            <p style={{
              fontSize: '1.5rem',
              color: '#f4f8ff',
              fontWeight: 700,
              marginBottom: 0
            }}>
              C'est là que GesTock intervient.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(8,145,178,.20), rgba(14,116,144,.15))',
            border: '2px solid rgba(8,145,178,0.4)',
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
              Une gestion flexible qui s'adapte à votre type de commerce.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Section: Quel est votre commerce? */}
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
              Quel est votre commerce ?
            </h2>
            <p style={{ color: '#91a4c4', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
              Cliquez sur votre type de commerce pour découvrir comment GesTock s'adapte à votre activité.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
            {boutiqueTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                style={{
                  background: selectedType === type.id 
                    ? 'linear-gradient(135deg, #0891b2, #0e7490)' 
                    : 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
                  border: selectedType === type.id 
                    ? '2px solid #0891b2' 
                    : '1px solid rgba(171,202,255,.17)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  backdropFilter: 'blur(28px)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <type.icon size={32} style={{ color: selectedType === type.id ? '#fff' : '#0891b2' }} />
                <span style={{ color: selectedType === type.id ? '#fff' : '#f4f8ff', fontSize: '0.875rem', fontWeight: 600 }}>
                  {type.name}
                </span>
              </button>
            ))}
          </div>

          {selectedType && (
            <div style={{
              background: 'linear-gradient(145deg, rgba(8,145,178,.20), rgba(14,116,144,.15))',
              border: '2px solid rgba(8,145,178,0.4)',
              borderRadius: '24px',
              padding: '3rem',
              backdropFilter: 'blur(28px)',
              textAlign: 'center',
              animation: 'fadeInUp 0.5s ease'
            }}>
              <h3 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 800,
                color: '#f8fbff',
                marginBottom: '1rem'
              }}>
                GesTock pour votre boutique de {boutiqueTypes.find(t => t.id === selectedType)?.name}
              </h3>
              <p style={{ color: '#91a4c4', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                {boutiqueTypes.find(t => t.id === selectedType)?.message}
              </p>
              <button onClick={() => navigate('/register')} style={{
                padding: '1rem 2rem',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0891b2, #0e7490)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(8,145,178,0.4)'
              }}>
                Commencer avec GesTock
                <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Une seule plateforme */}
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
              🧠 Une seule plateforme pour des commerçants très différents
            </h2>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '30px',
            padding: '3rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0891b2', marginBottom: '2rem' }}>
              GESTOCK BOUTIQUE
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              {['MODE', 'BEAUTÉ', 'TÉLÉPHONIE', 'CHAUSSURES', 'PARFUM', 'HIGH-TECH', 'ÉLECTROMÉNAGER', 'ALIMENTAIRE', 'LIBRAIRIE', '+ BIEN D\'AUTRES'].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0891b2' }} />
                  <span style={{ color: '#f4f8ff', fontSize: '1.125rem', fontWeight: 600 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{
              background: 'linear-gradient(145deg, rgba(8,145,178,.20), rgba(14,116,144,.15))',
              border: '1px solid rgba(8,145,178,0.3)',
              borderRadius: '16px',
              padding: '1.5rem'
            }}>
              <p style={{
                fontSize: '1.25rem',
                color: '#f4f8ff',
                fontWeight: 600,
                marginBottom: 0
              }}>
                Votre métier peut changer. Votre outil de gestion reste avec vous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gestion des articles */}
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
              📦 Gestion des articles
            </h2>
            <p style={{ color: '#91a4c4', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
              Votre catalogue, organisé selon votre commerce.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              'Vos articles',
              'Vos catégories',
              'Vos prix',
              'Vos stocks',
              'Vos promotions',
              'Vos recherches',
              'Vos filtres'
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
              Retrouvez rapidement ce que vous vendez et gardez une meilleure visibilité sur ce que vous avez en stock.
            </p>
          </div>
        </div>
      </section>

      {/* Catégories dynamiques */}
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
              🗂️ Catégories dynamiques
            </h2>
            <p style={{ color: '#91a4c4', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
              Votre boutique évolue. Votre catalogue aussi.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '24px',
            padding: '2rem',
            backdropFilter: 'blur(28px)',
            marginBottom: '3rem'
          }}>
            <p style={{ color: '#8ea2c3', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem', textAlign: 'center' }}>
              GesTock peut adapter l'organisation de votre catalogue à votre type de commerce.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {[
                { title: 'Mode', items: 'Hommes → Femmes → Enfants → Accessoires' },
                { title: 'Téléphonie', items: 'Smartphones → Accessoires → Chargeurs → Audio' },
                { title: 'Beauté', items: 'Parfums → Maquillage → Soins → Cheveux' },
                { title: 'Librairie', items: 'Livres → Papeterie → Scolaire → Bureau' },
                { title: 'Électroménager', items: 'Cuisine → Froid → Lavage → Petit électro' }
              ].map((cat, idx) => (
                <div key={idx} style={{
                  background: 'rgba(8,145,178,0.1)',
                  border: '1px solid rgba(8,145,178,0.3)',
                  borderRadius: '16px',
                  padding: '1.5rem'
                }}>
                  <h4 style={{ color: '#0891b2', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>{cat.title}</h4>
                  <p style={{ color: '#8ea2c3', fontSize: '0.875rem', margin: 0 }}>{cat.items}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(8,145,178,.20), rgba(14,116,144,.15))',
            border: '1px solid rgba(8,145,178,0.3)',
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
              Une organisation qui suit votre activité au lieu de vous imposer un modèle unique.
            </p>
          </div>
        </div>
      </section>

      {/* Ventes */}
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
              🛒 Ventes
            </h2>
            <p style={{ color: '#91a4c4', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
              Vendez simplement. Gardez le contrôle.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '24px',
            padding: '2rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center'
          }}>
            <p style={{ color: '#8ea2c3', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '1rem' }}>
              Enregistrez vos ventes et retrouvez une vision claire de votre activité.
            </p>
            <p style={{
              fontSize: '1.25rem',
              color: '#f4f8ff',
              fontWeight: 600,
              marginBottom: 0
            }}>
              Chaque vente alimente votre vision commerciale.
            </p>
          </div>
        </div>
      </section>

      {/* Stock */}
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
              📊 Stock
            </h2>
            <p style={{ color: '#91a4c4', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
              Ne cherchez plus ce que vous avez déjà en stock.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '24px',
            padding: '2rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center'
          }}>
            <p style={{ color: '#8ea2c3', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '1rem' }}>
              GesTock vous aide à suivre vos articles et vos niveaux de stock.
            </p>
            <p style={{
              fontSize: '1.25rem',
              color: '#f4f8ff',
              fontWeight: 600,
              marginBottom: 0
            }}>
              Plus de visibilité. Moins d'incertitude.
            </p>
          </div>
        </div>
      </section>

      {/* Promotions */}
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
              🏷️ Promotions
            </h2>
            <p style={{ color: '#91a4c4', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
              Transformez vos promotions en opportunités.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            {[
              { icon: Percent, title: 'Pourcentage', desc: 'Exemple : -10 %' },
              { icon: DollarSign, title: 'Montant fixe', desc: 'Exemple : -5 000 FCFA' },
              { icon: Tag, title: 'Prix fixe', desc: 'Article vendu directement à un prix promotionnel' }
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
                border: '1px solid rgba(171,202,255,.17)',
                borderRadius: '24px',
                padding: '2rem',
                backdropFilter: 'blur(28px)',
                textAlign: 'center'
              }}>
                <item.icon size={48} style={{ color: '#0891b2', marginBottom: '1rem' }} />
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

      {/* Crédit client */}
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
              💳 Crédit client
            </h2>
            <p style={{ color: '#91a4c4', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
              La confiance, oui. La perte de contrôle, non.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '1px solid rgba(171,202,255,.17)',
            borderRadius: '24px',
            padding: '2rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <p style={{ color: '#8ea2c3', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '1rem' }}>
              Pour les boutiques qui vendent à crédit :
            </p>
            <p style={{ color: '#f4f8ff', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: 0 }}>
              Suivez les crédits et les dettes clients depuis votre espace de gestion.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(8,145,178,.20), rgba(14,116,144,.15))',
            border: '1px solid rgba(8,145,178,0.3)',
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
              Sachez ce qui a été vendu, ce qui a été payé et ce qui reste à récupérer.
            </p>
          </div>
        </div>
      </section>

      {/* GesTock AI */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(8,145,178,0.15) 0%, transparent 70%)',
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
              ✨ GesTock AI
            </h2>
            <p style={{ color: '#91a4c4', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
              Votre boutique a un assistant intelligent.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(37,60,101,.58), rgba(7,18,38,.70))',
            border: '2px solid rgba(8,145,178,0.4)',
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
              background: 'linear-gradient(135deg, #0891b2, #0e7490)',
              padding: '0.5rem 1.5rem',
              borderRadius: '100px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}>
              ✨ GESTOCK AI
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <p style={{ color: '#f4f8ff', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
                Analysez votre activité. Identifiez ce qui mérite votre attention. Prenez vos décisions avec davantage de visibilité.
              </p>
              
              <div style={{
                background: 'rgba(8,145,178,0.1)',
                border: '1px solid rgba(8,145,178,0.3)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'left'
              }}>
                <p style={{ color: '#f4f8ff', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Bonjour 👋</p>
                <p style={{ color: '#8ea2c3', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                  J'ai analysé votre activité.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                  <span style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 600 }}>⚠️ 4 articles nécessitent votre attention.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <TrendingUp size={20} style={{ color: '#22c55e' }} />
                  <span style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 600 }}>📈 Votre activité évolue favorablement cette semaine.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Sparkles size={20} style={{ color: '#8b5cf6' }} />
                  <span style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 600 }}>💡 Consultez vos données pour identifier les produits à surveiller.</span>
                </div>
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
              L'IA ne remplace pas le commerçant. Elle lui donne une meilleure visibilité pour décider.
            </p>
          </div>
        </div>
      </section>

      {/* GesTock Boutique pour tous les commerces */}
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
              🚀 GesTock Boutique pour tous les commerces
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
            {[
              { icon: Shirt, name: 'Vêtements' },
              { icon: Footprints, name: 'Chaussures' },
              { icon: Smartphone, name: 'Téléphonie' },
              { icon: SparklesIcon, name: 'Parfumerie' },
              { icon: SparklesIcon, name: 'Beauté & cosmétiques' },
              { icon: Home, name: 'Électroménager' },
              { icon: Laptop, name: 'Informatique' },
              { icon: BookOpen, name: 'Librairie' },
              { icon: FileText, name: 'Papeterie' },
              { icon: Coffee, name: 'Alimentaire' },
              { icon: Droplets, name: 'Produits d\'entretien' },
              { icon: Sofa, name: 'Maison & décoration' },
              { icon: Briefcase, name: 'Maroquinerie' },
              { icon: Gem, name: 'Bijouterie' },
              { icon: Gamepad2, name: 'Jouets' },
              { icon: Trophy, name: 'Sport & loisirs' },
              { icon: Wrench, name: 'Quincaillerie' },
              { icon: Car, name: 'Accessoires automobile' },
              { icon: Gift, name: 'Cadeaux' },
              { icon: Building2, name: 'Commerce général' }
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
                <item.icon size={20} style={{ color: '#0891b2' }} />
                <span style={{ color: '#f4f8ff', fontSize: '0.875rem', fontWeight: 600 }}>{item.name}</span>
                <CheckCircle size={16} style={{ color: '#5ee0a2', marginLeft: 'auto' }} />
              </div>
            ))}
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(8,145,178,.20), rgba(14,116,144,.15))',
            border: '1px solid rgba(8,145,178,0.3)',
            borderRadius: '24px',
            padding: '2rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '1.5rem',
              color: '#f4f8ff',
              fontWeight: 700,
              marginBottom: 0
            }}>
              Et ce n'est que le début.
            </p>
          </div>
        </div>
      </section>

      {/* La promesse marketing */}
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
              🔥 La promesse marketing
            </h2>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(8,145,178,.20), rgba(14,116,144,.15))',
            border: '2px solid rgba(8,145,178,0.4)',
            borderRadius: '30px',
            padding: '3rem',
            backdropFilter: 'blur(28px)',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <p style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: '#f4f8ff',
              fontWeight: 700,
              marginBottom: 0
            }}>
              Votre commerce n'entre pas dans une case. GesTock s'adapte à votre commerce.
            </p>
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
              fontSize: '1.125rem',
              color: '#8ea2c3',
              lineHeight: 1.7,
              marginBottom: 0
            }}>
              Que vous vendiez des vêtements, des chaussures, des smartphones, des parfums, des appareils électroménagers, des produits alimentaires ou des centaines d'autres références, GesTock vous offre une base de gestion flexible pour organiser vos articles, vos stocks, vos ventes, vos promotions et vos clients.
            </p>
          </div>
        </div>
      </section>

      {/* Avant / Après */}
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
              💎 Avant / Après
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(1fr, 1fr))', gap: '2rem' }}>
            {/* Avant */}
            <div>
              <h3 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>Avant</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  'Cahiers dispersés',
                  'Stocks difficiles à suivre',
                  'Promotions difficiles à contrôler',
                  'Créances oubliées',
                  'Catalogue mal organisé',
                  'Peu de visibilité sur l\'activité'
                ].map((item, idx) => (
                  <div key={idx} style={{
                    background: 'linear-gradient(145deg, rgba(239,68,68,.10), rgba(220,38,38,.10))',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '16px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <X size={20} style={{ color: '#ef4444' }} />
                    <span style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 600 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Après */}
            <div>
              <h3 style={{ color: '#22c55e', fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>Avec GesTock</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  'Articles centralisés',
                  'Stocks suivis',
                  'Ventes enregistrées',
                  'Promotions maîtrisées',
                  'Crédits clients suivis',
                  'Catégories adaptées',
                  'Dashboard',
                  'IA GesTock'
                ].map((item, idx) => (
                  <div key={idx} style={{
                    background: 'linear-gradient(145deg, rgba(34,197,94,.10), rgba(22,163,74,.10))',
                    border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: '16px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <Check size={20} style={{ color: '#22c55e' }} />
                    <span style={{ color: '#f4f8ff', fontSize: '1rem', fontWeight: 600 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(8,145,178,0.15) 0%, transparent 70%)',
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
            🎯 Votre commerce mérite une gestion à sa mesure.
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#91a4c4',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            maxWidth: '700px',
            margin: '0 auto 2.5rem'
          }}>
            Choisissez votre activité. Configurez votre boutique. Et laissez GesTock vous accompagner dans votre quotidien.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{
              padding: '1.25rem 2.5rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0891b2, #0e7490)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '1.125rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(8,145,178,0.4)'
            }}>
              🚀 Commencer avec GesTock Boutique
              <ArrowRight size={24} />
            </button>
            <button style={{
              padding: '1.25rem 2.5rem',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.05)',
              color: '#f8fbff',
              border: '1px solid rgba(255,255,255,0.1)',
              fontWeight: 600,
              fontSize: '1.125rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease'
            }}>
              Voir la démo
              <Play size={20} />
            </button>
          </div>
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

        .boutique-landing {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #e8efff;
          background: #020617;
        }

        .nav-liquid a:hover {
          color: #f8fbff;
        }

        .hero-liquid > div > div {
          animation: fadeInUp 0.8s ease;
        }

        @media (max-width: 968px) {
          .hero-liquid > div > div {
            padding: 0 1rem;
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

export default BoutiqueLandingPage;
