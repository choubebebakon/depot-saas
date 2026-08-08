import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronDown,
  X,
  Menu,
  Zap,
  ShieldCheck,
  Globe,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
  BarChart3,
  Warehouse,
  Store,
  ShoppingBag,
  Headphones,
  Star,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Building2,
  Cpu,
  BrainCircuit,
  Bot
} from 'lucide-react';
import logo from '../assets/logo-neon.png';
import Footer from '../components/Footer';

const copy = {
  fr: {
    nav: ['Produit', 'GeStock AI', 'Métiers', 'Tarifs', 'Témoignages', 'FAQ'],
    login: 'Se connecter',
    trial: 'Essai gratuit',
    badge: 'La solution de gestion intelligente pour PME africaines',
    title: 'Digitalisez votre entreprise. Pilotez avec l\'IA.',
    subtitle: 'La solution de gestion tout-en-un conçue pour les PME africaines, dopée à l\'Intelligence Artificielle. Gérez vos stocks, prédiction des ventes et caisse depuis une seule plateforme moderne.',
    primary: 'Démarrer gratuitement',
    secondary: 'Voir la démo',
    reassurance: ['Sans carte bancaire', 'Essai 14 jours', 'Annulable à tout moment', 'Support en français'],
    trust: ['+5000 entreprises', '15 pays africains', '99.9% disponibilité', 'Support 24/7'],
    problemsTitle: 'Les défis des PME africaines',
    problemsText: 'Des milliers d\'entreprises perdent du temps et de l\'argent avec ces problèmes quotidiens. GESTOCK les a résolus.',
    solutionsTitle: 'Comment GESTOCK transforme votre entreprise',
    aiSectionTitle: 'GeStock AI : Votre Assistant Intelligent',
    aiSectionText: 'Anticipez l\'avenir de votre commerce grâce à des algorithmes prédictifs conçus pour maximiser vos profits.',
    metiersTitle: 'Les métiers que nous servons',
    metiersText: 'Une solution experte adaptée aux 3 secteurs clés de distribution',
    whyTitle: 'Pourquoi choisir GESTOCK',
    testimonialsTitle: 'Ce que nos clients disent',
    faqTitle: 'Questions fréquentes',
    ctaTitle: 'Prêt à transformer votre entreprise avec l\'IA ?',
    ctaText: 'Rejoignez les centaines d\'entreprises africaines qui font confiance à GESTOCK.',
    ctaButton: 'Commencer l\'essai gratuit',
    footerTagline: 'La solution de gestion pensée pour l\'Afrique.',
  },
  en: {
    nav: ['Product', 'GeStock AI', 'Industries', 'Pricing', 'Testimonials', 'FAQ'],
    login: 'Log in',
    trial: 'Start free',
    badge: 'The smart management solution for African SMEs',
    title: 'Digitalize your business. Drive with AI.',
    subtitle: 'The all-in-one management solution designed for African SMEs, powered by Artificial Intelligence. Manage inventory, sales forecasting and POS from a single modern platform.',
    primary: 'Start free trial',
    secondary: 'Watch demo',
    reassurance: ['No credit card', '14-day trial', 'Cancel anytime', 'French support'],
    trust: ['+5000 businesses', '15 African countries', '99.9% uptime', '24/7 support'],
    problemsTitle: 'Challenges faced by African SMEs',
    problemsText: 'Thousands of businesses lose time and money with these daily issues. GESTOCK has solved them.',
    solutionsTitle: 'How GESTOCK transforms your business',
    aiSectionTitle: 'GeStock AI: Your Intelligent Assistant',
    aiSectionText: 'Anticipate your business future using predictive algorithms designed to maximize your profits.',
    metiersTitle: 'Industries we serve',
    metiersText: 'An expert solution tailored for the 3 key distribution sectors',
    whyTitle: 'Why choose GESTOCK',
    testimonialsTitle: 'What our clients say',
    faqTitle: 'Frequently asked questions',
    ctaTitle: 'Ready to transform your business with AI?',
    ctaText: 'Join the hundreds of African businesses already trusting GESTOCK.',
    ctaButton: 'Start free trial',
    footerTagline: 'The management solution designed for Africa.',
  },
};

const problems = [
  {
    icon: AlertTriangle,
    fr: 'Pertes de stock importantes',
    en: 'Significant inventory losses',
    frDesc: '15 à 30% de perte annuelle due à une mauvaise gestion des stocks',
    enDesc: '15 to 30% annual loss due to poor inventory management',
  },
  {
    icon: TrendingDown,
    fr: 'Erreurs de caisse et manque de traçabilité',
    en: 'Cash register errors and lack of traceability',
    frDesc: 'Écarts de caisse non identifiés et vols internes difficiles à détecter',
    enDesc: 'Unidentified cash discrepancies and internal theft hard to detect',
  },
  {
    icon: BarChart3,
    fr: 'Manque de visibilité sur l\'activité',
    en: 'Lack of visibility on activity',
    frDesc: 'Absence de statistiques en temps réel et impossibilité de prendre des décisions éclairées',
    enDesc: 'No real-time statistics and inability to make informed decisions',
  },
  {
    icon: Clock,
    fr: 'Gestion manuelle chronophage',
    en: 'Time-consuming manual management',
    frDesc: 'Saisies répétitives, sources d\'erreurs et temps perdu dans la consolidation',
    enDesc: 'Repetitive entries, error sources and time lost consolidating data',
  },
  {
    icon: X,
    fr: 'Erreurs humaines coûteuses',
    en: 'Costly human errors',
    frDesc: 'Doubles commandes, erreurs de facturation et oublis de relances clients',
    enDesc: 'Double orders, billing errors and forgotten customer follow-ups',
  },
  {
    icon: ShieldCheck,
    fr: 'Absence d\'outils adaptés',
    en: 'Lack of adapted tools',
    frDesc: 'Solutions occidentales inadaptées et coûts prohibitifs pour les PME locales',
    enDesc: 'Unadapted Western solutions and prohibitive costs for local SMEs',
  },
];

const solutions = [
  {
    icon: Package,
    fr: 'Gestion des stocks intelligente',
    en: 'Smart inventory management',
    frDesc: 'Alertes automatiques, suivi en temps réel et prévision des besoins',
    enDesc: 'Automatic alerts, real-time tracking and demand forecasting',
  },
  {
    icon: FileText,
    fr: 'Traçabilité totale des opérations',
    en: 'Complete operation traceability',
    frDesc: 'Historique complet, identification des responsabilités et rapports d\'audit',
    enDesc: 'Complete history, responsibility identification and detailed audit reports',
  },
  {
    icon: BarChart3,
    fr: 'Tableaux de bord en temps réel',
    en: 'Real-time dashboards',
    frDesc: 'Statistiques instantanées, KPIs et visualisation des tendances',
    enDesc: 'Instant statistics, KPIs and trend visualization',
  },
  {
    icon: Zap,
    fr: 'Automatisation des processus',
    en: 'Process automation',
    frDesc: 'Facturation automatique, relances programmées et synchronisation multi-sites',
    enDesc: 'Automatic invoicing, scheduled reminders and multi-site synchronization',
  },
  {
    icon: CheckCircle,
    fr: 'Réduction des erreurs',
    en: 'Error reduction',
    frDesc: 'Validation automatique, contrôles de cohérence et sauvegardes automatiques',
    enDesc: 'Automatic validation, consistency checks and automatic backups',
  },
  {
    icon: Globe,
    fr: 'Adaptation locale',
    en: 'Local adaptation',
    frDesc: 'Paiements mobiles intégrés, interface en français et tarification adaptée',
    enDesc: 'Integrated mobile payments, French interface and adapted pricing',
  },
];

// Uniquement les 3 métiers actifs demandés
const activeMetiers = [
  {
    icon: Warehouse,
    key: 'depot-boissons',
    fr: 'Dépôt de Boissons',
    en: 'Beverage Depot',
    frDesc: 'Gestion des lots, traçabilité des consignations et suivi des fournisseurs multiples',
    enDesc: 'Batch management, consignment tracking and multi-supplier monitoring',
    frBenefits: ['Réduction des pertes de 40%', 'Optimisation de la trésorerie', 'Visibilité sur les marges'],
    enBenefits: ['40% loss reduction', 'Cash flow optimization', 'Margin visibility'],
    color: '#2563eb',
  },
  {
    icon: ShoppingBag,
    key: 'supermarche',
    fr: 'Supermarché',
    en: 'Supermarket',
    frDesc: 'Suivi des rayons, gestion des promotions et caisse intégrée ultra-rapide',
    enDesc: 'Aisle tracking, promotion management and integrated high-speed POS',
    frBenefits: ['Réduction des ruptures de 60%', 'Augmentation du panier moyen', 'Gestion multi-caisse'],
    enBenefits: ['60% stockout reduction', 'Increased basket size', 'Multi-POS management'],
    color: '#f59e0b',
  },
  {
    icon: Store,
    key: 'boutique',
    fr: 'Boutique',
    en: 'Retail Store',
    frDesc: 'Interface simplifiée, prise en main rapide et fonctionnalités de vente essentielles',
    enDesc: 'Simplified interface, quick onboarding and essential sales features',
    frBenefits: ['Prise en main en 48 heures', 'Réduction des erreurs de 90%', 'Meilleure connaissance client'],
    enBenefits: ['48-hour onboarding', '90% error reduction', 'Better customer knowledge'],
    color: '#0891b2',
  },
];

const whyChoose = [
  {
    icon: Globe,
    fr: 'Conçu pour l\'Afrique',
    en: 'Built for Africa',
    frDesc: 'Intégration native des paiements mobiles et interface adaptée',
    enDesc: 'Native mobile payment integration and adapted interface',
  },
  {
    icon: Smartphone,
    fr: '100% Mobile',
    en: '100% Mobile',
    frDesc: 'Gérez votre entreprise directement depuis votre smartphone',
    enDesc: 'Manage your business directly from your smartphone',
  },
  {
    icon: Zap,
    fr: 'Opérationnel en 48h',
    en: 'Live in 48h',
    frDesc: 'Prise en main rapide sans formation complexe nécessaire',
    enDesc: 'Quick onboarding without complex training needed',
  },
  {
    icon: ShieldCheck,
    fr: 'Données sécurisées',
    en: 'Secure data',
    frDesc: 'Sauvegardes automatiques cloud et permissions strictes par rôle',
    enDesc: 'Automatic cloud backups and strict role-based permissions',
  },
  {
    icon: Headphones,
    fr: 'Support local',
    en: 'Local support',
    frDesc: 'Équipe basée en Afrique, réactive et disponible en français',
    enDesc: 'Africa-based team, responsive and available in French',
  },
  {
    icon: TrendingUp,
    fr: 'Scalabilité',
    en: 'Scalability',
    frDesc: 'Évoluez à votre rythme avec une architecture multi-tenant robuste',
    enDesc: 'Grow at your pace with a robust multi-tenant architecture',
  },
];

const testimonials = [
  {
    name: 'Emmanuel N.',
    company: 'Dépôt Boissons Plus',
    city: 'Douala, Cameroun',
    fr: 'Depuis que nous utilisons GESTOCK, nos pertes de stock ont diminué de 35%. Le suivi des consignations est désormais automatisé.',
    en: 'Since using GESTOCK, our inventory losses have decreased by 35%. Consignment tracking is now automated.',
    role: 'Dépôt de Boissons',
  },
  {
    name: 'Marie-Claire T.',
    company: 'Supermarché Élite',
    city: 'Yaoundé, Cameroun',
    fr: 'GESTOCK a transformé la gestion de notre supermarché. Nos ruptures ont diminué de moitié et notre chiffre d\'affaires a grimpé.',
    en: 'GESTOCK transformed our supermarket management. Our stockouts dropped by half and our revenue increased.',
    role: 'Supermarché',
  },
  {
    name: 'Jean-Paul M.',
    company: 'Boutique du Centre',
    city: 'Libreville, Gabon',
    fr: 'En une heure, je gérais mes ventes et mes stocks sans difficulté. L\'interface est claire et taillée pour nos réalités.',
    en: 'In one hour, I was managing my sales and inventory without difficulty. The interface is clear and built for our realities.',
    role: 'Boutique',
  },
];

const faqs = {
  fr: [
    ['Qu\'est-ce que GESTOCK exactement ?', 'GESTOCK est une plateforme SaaS de gestion d\'entreprise tout-en-un dotée d\'IA, conçue spécifiquement pour les PME africaines. Elle gère stocks, ventes, achats et caisse depuis une seule interface.'],
    ['Quel est le rôle de l\'IA dans GeStock ?', 'GeStock AI analyse vos flux de vente en temps réel pour prédire les risques de rupture de stock, suggérer vos commandes fournisseurs optimales et identifier les tendances cachées de rentabilité.'],
    ['À quels métiers s\'adresse la plateforme ?', 'GeStock est optimisé pour les Dépôts de boissons, les Supermarchés et les Boutiques de détail.'],
    ['Mes données sont-elles sécurisées ?', 'Absolument. Vos données sont isolées (architecture multi-tenant) et hébergées sur des serveurs hautement sécurisés avec des sauvegardes quotidiennes.'],
    ['Y a-t-il un essai gratuit ?', 'Oui, nous proposons une période d\'essai gratuit de 14 jours sans engagement.'],
  ],
  en: [
    ['What is GESTOCK exactly?', 'GESTOCK is an AI-powered all-in-one business management SaaS platform designed specifically for African SMEs, handling inventory, sales, and POS from a single interface.'],
    ['What is the role of AI in GeStock?', 'GeStock AI analyzes your sales flows in real-time to predict stockout risks, suggest optimal supplier orders, and identify hidden profitability trends.'],
    ['Which industries does the platform target?', 'GeStock is optimized for Beverage Depots, Supermarkets, and Retail Stores.'],
    ['Is my data secure?', 'Absolutely. Your data is isolated (multi-tenant architecture) and hosted on highly secure servers with daily backups.'],
    ['Is there a free trial?', 'Yes, we offer a 14-day risk-free trial period.'],
  ],
};

export default function GesTockLandingPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('fr');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [activeMetier, setActiveMetier] = useState('depot-boissons');

  const t = copy[lang];
  const isFr = lang === 'fr';

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

    const nav = document.querySelector('.gesstock-nav');
    const onScroll = () => nav?.classList.toggle('is-scrolled', window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      revealObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="gesstock-landing">
      {/* Background Effects */}
      <div className="gradient-bg" />
      <div className="noise-overlay" />

      {/* Navigation */}
      <nav className="gesstock-nav">
        <div className="nav-container">
          <a className="brand" href="#top" onClick={(e) => { e.preventDefault(); scrollTo('top'); }}>
            <img src={logo} alt="GESTOCK" className="brand-logo" />
            <span>GESTOCK</span>
          </a>

          <div className="nav-links">
            {t.nav.map((item, index) => (
              <button key={item} type="button" onClick={() => scrollTo(['product', 'ai-section', 'metiers', 'pricing', 'testimonials', 'faq'][index])}>
                {item}
              </button>
            ))}
          </div>

          <div className="nav-actions">
            <div className="lang-toggle">
              <button type="button" className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
              <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
            </div>
            <button className="btn btn-ghost" type="button" onClick={() => navigate('/login')}>{t.login}</button>
            <button className="btn btn-primary" type="button" onClick={() => navigate('/register')}>{t.trial}</button>
            <button className="btn-mobile" type="button" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-nav">
          {t.nav.map((item, index) => (
            <button key={item} type="button" onClick={() => scrollTo(['product', 'ai-section', 'metiers', 'pricing', 'testimonials', 'faq'][index])}>
              {item}
            </button>
          ))}
          <button type="button" onClick={() => navigate('/login')}>{t.login}</button>
          <button className="btn btn-primary" type="button" onClick={() => navigate('/register')}>{t.trial}</button>
        </div>
      )}

      <main id="top">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <Sparkles size={16} className="text-indigo-400" />
                {t.badge}
              </div>
              <h1 className="hero-title">{t.title}</h1>
              <p className="hero-subtitle">{t.subtitle}</p>
              <div className="hero-cta">
                <button className="btn btn-primary btn-lg" type="button" onClick={() => navigate('/register')}>
                  {t.primary}
                  <ArrowRight size={20} />
                </button>
                <button className="btn btn-secondary btn-lg" type="button" onClick={() => scrollTo('ai-section')}>
                  <Play size={18} />
                  {t.secondary}
                </button>
              </div>
              <div className="hero-reassurance">
                {t.reassurance.map((item) => (
                  <span key={item}>
                    <Check size={14} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="hero-visual">
              <div className="dashboard-mockup">
                <div className="mockup-header">
                  <div className="mockup-dots">
                    <span /><span /><span />
                  </div>
                  <div className="mockup-title">GESTOCK AI Studio</div>
                </div>
                <div className="mockup-body">
                  <div className="mockup-sidebar">
                    <div className="mockup-item active" />
                    <div className="mockup-item" />
                    <div className="mockup-item" />
                  </div>
                  <div className="mockup-main">
                    <div className="ai-preview-box">
                      <BrainCircuit size={28} className="text-indigo-400 animate-pulse" />
                      <div>
                        <span className="ai-label">GeStock AI Insight</span>
                        <p>Alerte de réapprovisionnement imminente sur 3 articles phares.</p>
                      </div>
                    </div>
                    <div className="mockup-stats">
                      <div className="mockup-stat" />
                      <div className="mockup-stat" />
                    </div>
                    <div className="mockup-chart" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Band */}
        <section className="trust-band" data-reveal>
          <div className="trust-container">
            {t.trust.map((item) => (
              <div key={item} className="trust-item">
                <CheckCircle size={20} />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Problems Section */}
        <section id="product" className="section section-alt">
          <div className="container">
            <div className="section-header" data-reveal>
              <h2>{t.problemsTitle}</h2>
              <p>{t.problemsText}</p>
            </div>
            <div className="grid-3">
              {problems.map(({ icon: Icon, fr, en, frDesc, enDesc }) => (
                <div className="problem-card" key={fr} data-reveal>
                  <div className="problem-icon danger">
                    <Icon size={28} />
                  </div>
                  <h3>{isFr ? fr : en}</h3>
                  <p>{isFr ? frDesc : enDesc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section className="section">
          <div className="container">
            <div className="section-header" data-reveal>
              <h2>{t.solutionsTitle}</h2>
            </div>
            <div className="grid-3">
              {solutions.map(({ icon: Icon, fr, en, frDesc, enDesc }) => (
                <div className="solution-card" key={fr} data-reveal>
                  <div className="solution-icon success">
                    <Icon size={28} />
                  </div>
                  <h3>{isFr ? fr : en}</h3>
                  <p>{isFr ? frDesc : enDesc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- NOUVELLE SECTION : GE-STOCK AI --- */}
        <section id="ai-section" className="section ai-showcase-section">
          <div className="container">
            <div className="section-header" data-reveal>
              <div className="inline-badge">
                <Bot size={16} /> Intelligence Artificielle intégrée
              </div>
              <h2>{t.aiSectionTitle}</h2>
              <p>{t.aiSectionText}</p>
            </div>

            <div className="ai-grid">
              <div className="ai-card" data-reveal>
                <div className="ai-card-icon">
                  <TrendingUp size={24} />
                </div>
                <h3>Prédiction des ruptures de stock</h3>
                <p>
                  GeStock AI analyse l'historique de vos ventes et la saisonnalité locale pour vous avertir 
                  avant même que vos produits ne manquent en rayon.
                </p>
              </div>

              <div className="ai-card" data-reveal>
                <div className="ai-card-icon">
                  <Cpu size={24} />
                </div>
                <h3>Suggestions d'achats optimisées</h3>
                <p>
                  Ne commandez plus à l'aveugle. L'intelligence artificielle calcule les quantités idéales 
                  à commander auprès de vos fournisseurs pour maximiser votre trésorerie.
                </p>
              </div>

              <div className="ai-card" data-reveal>
                <div className="ai-card-icon">
                  <Sparkles size={24} />
                </div>
                <h3>Assistant commercial intelligent</h3>
                <p>
                  Posez vos questions en langage naturel à l'application ("Quels sont mes produits les plus rentables ce mois-ci ?") 
                  et obtenez des rapports instantanés.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Métiers Section (Restreint aux 3 métiers actifs) */}
        <section id="metiers" className="section section-dark">
          <div className="container">
            <div className="section-header" data-reveal>
              <h2>{t.metiersTitle}</h2>
              <p>{t.metiersText}</p>
            </div>
            
            <div className="metier-tabs" data-reveal>
              {activeMetiers.map(({ icon: Icon, key, fr, en }) => (
                <button
                  key={key}
                  type="button"
                  className={activeMetier === key ? 'active' : ''}
                  onClick={() => setActiveMetier(key)}
                  style={activeMetier === key ? { borderColor: activeMetiers.find(m => m.key === key)?.color } : {}}
                >
                  <Icon size={20} />
                  {isFr ? fr : en}
                </button>
              ))}
            </div>

            <div className="metier-detail" data-reveal>
              {activeMetiers.filter(m => m.key === activeMetier).map(({ icon: Icon, fr, en, frDesc, enDesc, frBenefits, enBenefits, color }) => (
                <div key={fr} className="metier-content">
                  <div className="metier-visual" style={{ background: `linear-gradient(135deg, ${color}20, ${color}10)` }}>
                    <div className="metier-icon-large" style={{ background: color }}>
                      <Icon size={48} />
                    </div>
                  </div>
                  <div className="metier-info">
                    <h3 style={{ color }}>{isFr ? fr : en}</h3>
                    <p>{isFr ? frDesc : enDesc}</p>
                    <ul className="benefit-list">
                      {(isFr ? frBenefits : enBenefits).map((benefit) => (
                        <li key={benefit}>
                          <Check size={18} style={{ color }} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <button 
                      className="btn btn-primary" 
                      type="button" 
                      onClick={() => navigate('/register')}
                      style={{ background: color, borderColor: color }}
                    >
                      {isFr ? 'Découvrir cette solution' : 'Discover this solution'}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="section">
          <div className="container">
            <div className="section-header" data-reveal>
              <h2>{t.whyTitle}</h2>
            </div>
            <div className="grid-3">
              {whyChoose.map(({ icon: Icon, fr, en, frDesc, enDesc }) => (
                <div className="feature-card" key={fr} data-reveal>
                  <Icon size={28} className="feature-icon" />
                  <h3>{isFr ? fr : en}</h3>
                  <p>{isFr ? frDesc : enDesc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="section section-alt">
          <div className="container">
            <div className="section-header" data-reveal>
              <h2>{t.testimonialsTitle}</h2>
            </div>
            <div className="testimonials-grid">
              {testimonials.map(({ name, company, city, fr, en, role }) => (
                <div className="testimonial-card" key={name} data-reveal>
                  <div className="testimonial-stars">
                    {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <p>"{isFr ? fr : en}"</p>
                  <div className="testimonial-author">
                    <div>
                      <strong>{name}</strong>
                      <span>{company}</span>
                      <span className="testimonial-role">{role}</span>
                    </div>
                    <span className="testimonial-city">{city}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="section">
          <div className="container narrow">
            <div className="section-header" data-reveal>
              <h2>{t.faqTitle}</h2>
            </div>
            <div className="faq-list">
              {faqs[lang].map(([question, answer], index) => (
                <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={question} data-reveal>
                  <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                    <span>{question}</span>
                    <ChevronDown size={20} />
                  </button>
                  <div className="faq-answer">
                    <p>{answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section cta-section">
          <div className="container">
            <div className="cta-card" data-reveal>
              <div className="cta-content">
                <h2>{t.ctaTitle}</h2>
                <p>{t.ctaText}</p>
                <button className="btn btn-primary btn-lg" type="button" onClick={() => navigate('/register')}>
                  {t.ctaButton}
                  <ArrowRight size={20} />
                </button>
              </div>
              <div className="cta-visual">
                <Building2 size={120} className="cta-icon" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .gesstock-landing {
          min-height: 100vh;
          background: #0a0a0f;
          color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .gradient-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: 
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 92, 246, 0.1), transparent),
            radial-gradient(ellipse 50% 30% at 20% 80%, rgba(6, 182, 212, 0.08), transparent),
            linear-gradient(180deg, #0a0a0f 0%, #0f172a 50%, #0a0a0f 100%);
          z-index: -2;
        }

        .noise-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E");
          z-index: -1;
          pointer-events: none;
        }

        .gesstock-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          padding: 1.25rem 0;
          transition: all 0.3s ease;
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .gesstock-nav.is-scrolled {
          background: rgba(10, 10, 15, 0.95);
          backdrop-filter: blur(30px);
          border-bottom: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #f8fafc;
          font-weight: 700;
          font-size: 1.25rem;
        }

        .brand-logo {
          height: 32px;
          width: auto;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
        }

        .nav-links button {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-links button:hover {
          color: #f8fafc;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .lang-toggle {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 2px;
        }

        .lang-toggle button {
          background: none;
          border: none;
          color: #94a3b8;
          padding: 4px 8px;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
        }

        .lang-toggle button.active {
          background: #6366f1;
          color: white;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 12px;
          font-weight: 600;
          padding: 0.625rem 1.25rem;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
          border: 1px solid #6366f1;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        .btn-primary:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-ghost {
          background: none;
          border: none;
          color: #cbd5e1;
        }

        .btn-ghost:hover {
          color: white;
        }

        .btn-mobile {
          display: none;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
        }

        .mobile-nav {
          position: fixed;
          top: 70px; left: 0; right: 0;
          background: #0a0a0f;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          z-index: 999;
        }

        .hero-section {
          padding: 10rem 0 6rem;
          position: relative;
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          padding: 0.375rem 0.875rem;
          border-radius: 50px;
          font-size: 0.875rem;
          color: #a5b4fc;
          margin-bottom: 1.5rem;
        }

        .hero-title {
          font-size: 3.5rem;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.15rem;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .hero-cta {
          display: flex;
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .hero-reassurance {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .hero-reassurance span {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .hero-reassurance svg {
          color: #10b981;
        }

        .dashboard-mockup {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .mockup-header {
          background: #1f2937;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .mockup-dots {
          display: flex;
          gap: 6px;
        }

        .mockup-dots span {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #374151;
        }

        .mockup-title {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 600;
        }

        .mockup-body {
          display: flex;
          min-height: 280px;
        }

        .mockup-sidebar {
          width: 60px;
          background: rgba(0, 0, 0, 0.2);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1rem 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mockup-item {
          height: 8px;
          background: #374151;
          border-radius: 4px;
        }

        .mockup-item.active {
          background: #6366f1;
        }

        .mockup-main {
          flex: 1;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .ai-preview-box {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          padding: 1rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .ai-label {
          font-size: 0.7rem;
          font-weight: bold;
          color: #818cf8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ai-preview-box p {
          font-size: 0.8rem;
          color: #cbd5e1;
          margin-top: 2px;
        }

        .mockup-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .mockup-stat {
          height: 36px;
          background: #1f2937;
          border-radius: 8px;
        }

        .mockup-chart {
          flex: 1;
          background: #1f2937;
          border-radius: 8px;
          min-height: 80px;
        }

        .trust-band {
          padding: 2.5rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.01);
        }

        .trust-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          text-align: center;
        }

        .trust-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .trust-item svg {
          color: #6366f1;
        }

        .section {
          padding: 6rem 0;
        }

        .section-alt {
          background: rgba(255, 255, 255, 0.01);
        }

        .section-dark {
          background: #0d111a;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .container.narrow {
          max-width: 800px;
        }

        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 4rem;
        }

        .section-header h2 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
        }

        .section-header p {
          color: #94a3b8;
          font-size: 1.1rem;
        }

        .inline-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .problem-card, .solution-card, .feature-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 2rem;
          border-radius: 16px;
          transition: transform 0.2s, border-color 0.2s;
        }

        .problem-card:hover, .solution-card:hover, .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .problem-icon, .solution-icon {
          width: 56px; height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .problem-icon.danger {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .solution-icon.success {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .problem-card h3, .solution-card h3, .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .problem-card p, .solution-card p, .feature-card p {
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        /* Styles GeStock AI Section */
        .ai-showcase-section {
          background: radial-gradient(circle at center, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
        }

        .ai-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .ai-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.2);
          padding: 2.5rem 2rem;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .ai-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.5);
        }

        .ai-card-icon {
          width: 48px; height: 48px;
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .ai-card h3 {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .ai-card p {
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .metier-tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .metier-tabs button {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.2s;
        }

        .metier-tabs button.active {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }

        .metier-detail {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 3rem;
        }

        .metier-content {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 3rem;
          align-items: center;
        }

        .metier-visual {
          border-radius: 20px;
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metier-icon-large {
          width: 96px; height: 96px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }

        .metier-info h3 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .metier-info p {
          color: #94a3b8;
          font-size: 1.05rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .benefit-list {
          list-style: none;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .benefit-list li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 500;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .testimonial-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 2rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .testimonial-stars {
          color: #f59e0b;
          display: flex;
          gap: 4px;
          margin-bottom: 1rem;
        }

        .testimonial-card p {
          color: #cbd5e1;
          font-style: italic;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .testimonial-author {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 1rem;
        }

        .testimonial-author strong {
          display: block;
          font-size: 0.95rem;
        }

        .testimonial-author span {
          display: block;
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .testimonial-role {
          color: #6366f1 !important;
          font-weight: 600;
          margin-top: 2px;
        }

        .testimonial-city {
          font-size: 0.75rem;
          color: #64748b;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .faq-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
        }

        .faq-item button {
          width: 100%;
          background: none;
          border: none;
          padding: 1.25rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }

        .faq-answer {
          padding: 0 1.5rem 1.25rem;
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .cta-section {
          padding: 4rem 0 8rem;
        }

        .cta-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 24px;
          padding: 4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .cta-content {
          max-width: 600px;
          z-index: 1;
        }

        .cta-content h2 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .cta-content p {
          color: #94a3b8;
          font-size: 1.1rem;
          margin-bottom: 2rem;
        }

        .cta-visual {
          color: rgba(99, 102, 241, 0.2);
          z-index: 0;
        }

        [data-reveal] {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 968px) {
          .nav-links { display: none; }
          .btn-mobile { display: block; }
          .hero-container, .metier-content, .cta-card { grid-template-columns: 1fr; gap: 2rem; }
          .hero-title { font-size: 2.5rem; }
          .trust-container, .grid-3, .ai-grid, .testimonials-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}