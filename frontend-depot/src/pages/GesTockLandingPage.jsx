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
  Bot,
  LineChart,
  Radar,
  Target,
  FileBarChart,
  RefreshCw,
  Calendar,
  Tag,
  Rocket
} from 'lucide-react';
import logo from '../assets/logo-neon.png';
import Footer from '../components/Footer';

const copy = {
  fr: {
    nav: ['Produit', 'GeStock AI', 'Métiers', 'Tarifs', 'Témoignages', 'FAQ'],
    login: 'Se connecter',
    trial: 'Essai gratuit',
    badge: 'La plateforme intelligente qui transforme vos opérations en décisions rentables',
    title: 'Prenez le contrôle de votre entreprise. Décidez plus vite. Gagnez en visibilité.',
    subtitle: 'GESTOCK centralise vos stocks, ventes, achats, caisse et indicateurs dans une expérience moderne pensée pour les réalités africaines. Avec GeStock AI, transformez vos données en alertes utiles, prévisions et décisions plus intelligentes.',
    primary: 'Démarrer gratuitement',
    secondary: 'Voir la démo',
    reassurance: ['Sans carte bancaire', 'Essai 14 jours', 'Annulable à tout moment', 'Support en français'],
    trust: ['+5000 entreprises', '15 pays africains', '99.9% disponibilité', 'Support 24/7'],
    problemsTitle: 'Arrêtez de gérer votre entreprise à l’aveugle',
    problemsText: 'Chaque erreur de stock, chaque vente oubliée et chaque heure passée sur des tableaux dispersés coûte de l’argent. GESTOCK vous aide à reprendre le contrôle avec une vision claire, centralisée et exploitable.',
    solutionsTitle: 'Passez d’une gestion réactive à une gestion intelligente',
    aiSectionTitle: 'GeStock AI : votre copilote pour décider avec plus de confiance',
    aiSectionText: 'Ne vous contentez plus de regarder ce qui s’est passé. Détectez les signaux importants, anticipez les risques et identifiez les opportunités à partir de vos données.',
    metiersTitle: 'Une expérience pensée pour votre métier, pas un logiciel générique',
    metiersText: 'Dépôt de boissons, supermarché ou boutique : retrouvez les outils essentiels à votre activité sans vous perdre dans des fonctions inutiles.',
    whyTitle: 'Pourquoi les entreprises choisissent GESTOCK',
    testimonialsTitle: 'Des résultats qui parlent mieux que les promesses',
    faqTitle: 'Tout ce qu’il faut savoir avant de commencer',
    ctaTitle: 'Votre prochaine décision mérite de meilleures données.',
    ctaText: 'Centralisez votre activité, réduisez les tâches inutiles et donnez à votre équipe une vision claire de ce qui compte vraiment. Commencez simplement, puis faites grandir votre gestion avec GESTOCK.',
    ctaButton: 'Commencer gratuitement',
    footerTagline: 'Pilotez mieux. Décidez plus vite. Faites grandir votre activité.',
  },
  en: {
    nav: ['Product', 'GeStock AI', 'Industries', 'Pricing', 'Testimonials', 'FAQ'],
    login: 'Log in',
    trial: 'Start free',
    badge: 'The intelligent platform that turns operations into better decisions',
    title: 'Take control of your business. Decide faster. See more clearly.',
    subtitle: 'GESTOCK brings inventory, sales, purchasing, POS and key business indicators into one modern experience built for African realities. With GeStock AI, turn your data into useful alerts, forecasts and smarter decisions.',
    primary: 'Start free trial',
    secondary: 'Watch demo',
    reassurance: ['No credit card', '14-day trial', 'Cancel anytime', 'French support'],
    trust: ['+5000 businesses', '15 African countries', '99.9% uptime', '24/7 support'],
    problemsTitle: 'Stop running your business in the dark',
    problemsText: 'Every stock discrepancy, missed sale and hour spent reconciling scattered records has a cost. GESTOCK helps you regain control with one clear, centralized and actionable view.',
    solutionsTitle: 'Move from reactive management to intelligent operations',
    aiSectionTitle: 'GeStock AI: your copilot for more confident decisions',
    aiSectionText: 'Do more than look at what happened. Detect important signals, anticipate risks and uncover opportunities from your business data.',
    metiersTitle: 'Built around your business, not generic software',
    metiersText: 'Beverage depot, supermarket or retail store: get the tools your activity actually needs without unnecessary complexity.',
    whyTitle: 'Why businesses choose GESTOCK',
    testimonialsTitle: 'Results speak louder than promises',
    faqTitle: 'Everything you need to know before getting started',
    ctaTitle: 'Your next decision deserves better data.',
    ctaText: 'Centralize your operations, remove unnecessary manual work and give your team a clear view of what matters. Start simple, then grow your management with GESTOCK.',
    ctaButton: 'Start for free',
    footerTagline: 'Manage better. Decide faster. Grow with confidence.',
  },
};

const problems = [
  {
    icon: AlertTriangle,
    fr: 'Pertes de stock importantes',
    en: 'Significant inventory losses',
    frDesc: 'Les écarts, produits oubliés et réapprovisionnements mal anticipés grignotent vos marges sans toujours être visibles.',
    enDesc: '15 to 30% annual loss due to poor inventory management',
  },
  {
    icon: TrendingDown,
    fr: 'Erreurs de caisse et manque de traçabilité',
    en: 'Cash register errors and lack of traceability',
    frDesc: 'Chaque opération doit laisser une trace claire : ventes, encaissements, écarts et responsabilités.',
    enDesc: 'Unidentified cash discrepancies and internal theft hard to detect',
  },
  {
    icon: BarChart3,
    fr: 'Manque de visibilité sur l\'activité',
    en: 'Lack of visibility on activity',
    frDesc: 'Sans vision en temps réel, vous découvrez souvent les problèmes après qu’ils ont déjà coûté cher.',
    enDesc: 'No real-time statistics and inability to make informed decisions',
  },
  {
    icon: Clock,
    fr: 'Gestion manuelle chronophage',
    en: 'Time-consuming manual management',
    frDesc: 'Libérez votre équipe des tâches répétitives et consacrez son temps à servir les clients et développer l’activité.',
    enDesc: 'Repetitive entries, error sources and time lost consolidating data',
  },
  {
    icon: X,
    fr: 'Erreurs humaines coûteuses',
    en: 'Costly human errors',
    frDesc: 'Réduisez les oublis et incohérences qui se transforment en pertes, retards ou clients insatisfaits.',
    enDesc: 'Double orders, billing errors and forgotten customer follow-ups',
  },
  {
    icon: ShieldCheck,
    fr: 'Absence d\'outils adaptés',
    en: 'Lack of adapted tools',
    frDesc: 'Une expérience simple, moderne et pensée pour les contraintes opérationnelles des PME africaines.',
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
    color: '#f59e0b',
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
    ['À quels métiers s\'adresse la plateforme ?', 'GeStock est optimisé pour les Dépôts de boissons, les Supermarchés, les Boutiques de détail, et pleins d\'autres metiers encore.'],
    ['Mes données sont-elles sécurisées ?', 'Absolument. Vos données sont isolées (architecture multi-tenant) et hébergées sur des serveurs hautement sécurisés avec des sauvegardes quotidiennes.'],
    ['Y a-t-il un essai gratuit ?', 'Oui, nous proposons une période d\'essai gratuit de 14 jours sans engagement.'],
  ],
  en: [
    ['What is GESTOCK exactly?', 'GESTOCK is an AI-powered all-in-one business management SaaS platform designed specifically for African SMEs, handling inventory, sales, and POS from a single interface.'],
    ['What is the role of AI in GeStock?', 'GeStock AI analyzes your sales flows in real-time to predict stockout risks, suggest optimal supplier orders, and identify hidden profitability trends.'],
    ['Which industries does the platform target?', 'GeStock is optimized for Beverage Depots, Supermarkets, Retail Stores and many other jobs.'],
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
      <div className="liquid-orb orb-one" />
      <div className="liquid-orb orb-two" />
      <div className="liquid-orb orb-three" />
      <div className="noise-overlay" />

      {/* Navigation */}
      <nav className="gesstock-nav">
        <div className="nav-container">
          <a className="brand" href="#top" onClick={(e) => { e.preventDefault(); scrollTo('top'); }}>
            <img src={logo} alt="GESTOCK" className="brand-logo" />
            <span>GESTOCK</span>
          </a>

          <div className="nav-links">
            {t.nav.map((item, index) => {
              const navItems = ['product', 'ai-section', 'metiers', 'pricing', 'testimonials', 'faq'];
              return (
                <button 
                  key={item} 
                  type="button" 
                  onClick={() => {
                    if (navItems[index] === 'pricing') {
                      navigate('/pricing');
                    } else {
                      scrollTo(navItems[index]);
                    }
                  }}
                >
                  {item}
                </button>
              );
            })}
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
          {t.nav.map((item, index) => {
            const navItems = ['product', 'ai-section', 'metiers', 'pricing', 'testimonials', 'faq'];
            return (
              <button 
                key={item} 
                type="button" 
                onClick={() => {
                  if (navItems[index] === 'pricing') {
                    navigate('/pricing');
                  } else {
                    scrollTo(navItems[index]);
                  }
                }}
              >
                {item}
              </button>
            );
          })}
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
              <div className="hero-glow-ring" />
              <div className="floating-glass-chip chip-sales"><TrendingUp size={14} /> <span>Ventes en hausse</span></div>
              <div className="floating-glass-chip chip-stock"><Package size={14} /> <span>Stock maîtrisé</span></div>
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
                        <span className="ai-status-pill"><span /> Action recommandée</span>
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
                  <LineChart size={24} />
                </div>
                <h3>Prévoir les ventes</h3>
                <p>
                  Comprendre la tendance avant que le problème n'arrive pour décider en avance.
                  Anticipez les fluctuations de demande et ajustez votre stratégie.
                </p>
              </div>

              <div className="ai-card" data-reveal>
                <div className="ai-card-icon">
                  <Radar size={24} />
                </div>
                <h3>Détecter les anomalies</h3>
                <p>
                  Repérer les écarts et pertes invisibles grâce à la détection intelligente.
                  Identifiez rapidement les incohérences dans vos données.
                </p>
              </div>

              <div className="ai-card" data-reveal>
                <div className="ai-card-icon">
                  <Target size={24} />
                </div>
                <h3>Recommandation des réapprovisionnements</h3>
                <p>
                  Suggérer des actions prioritaires pour éviter rupture et surstocks.
                  Optimisez vos commandes fournisseurs en temps réel.
                </p>
              </div>

              <div className="ai-card" data-reveal>
                <div className="ai-card-icon">
                  <FileBarChart size={24} />
                </div>
                <h3>Identification des produits rentables</h3>
                <p>
                  Mettre en avant les articles qui génèrent réellement les marges.
                  Concentrez vos efforts sur les produits les plus performants.
                </p>
              </div>

              <div className="ai-card" data-reveal>
                <div className="ai-card-icon">
                  <FileText size={24} />
                </div>
                <h3>Création automatique des rapports</h3>
                <p>
                  Récapituler l'essentiel : ce qui s'améliore, ce qui se dégrade, quoi faire en suite.
                  Recevez des synthèses claires et actionnables.
                </p>
              </div>

              <div className="ai-card" data-reveal>
                <div className="ai-card-icon">
                  <RefreshCw size={24} />
                </div>
                <h3>Automatiser les tâches répétitives</h3>
                <p>
                  Libérez votre temps en automatisant les processus manuels.
                  Réduisez les erreurs et gagnez en efficacité.
                </p>
              </div>

              <div className="ai-card" data-reveal>
                <div className="ai-card-icon">
                  <Calendar size={24} />
                </div>
                <h3>Anticiper les périodes de fortes activités</h3>
                <p>
                  Prévoir les pics de demande et ajuster les stocks en conséquence.
                  Soyez prêt pour les saisons et événements importants.
                </p>
              </div>

              <div className="ai-card" data-reveal>
                <div className="ai-card-icon">
                  <Tag size={24} />
                </div>
                <h3>Optimiser les promotions</h3>
                <p>
                  Recevoir des recommandations pour maximiser l'impact des promotions.
                  Ciblez les bons produits au bon moment.
                </p>
              </div>

              <div className="ai-card" data-reveal>
                <div className="ai-card-icon">
                  <Rocket size={24} />
                </div>
                <h3>Découvrir des opportunités de croissance</h3>
                <p>
                  Recevoir des recommandations personnalisées pour développer votre activité.
                  Identifiez de nouveaux axes de développement.
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
                      onClick={() => {
                        if (activeMetier === 'depot-boissons') {
                          navigate('/depot-boissons-landing');
                        } else if (activeMetier === 'supermarche') {
                          navigate('/supermarche-landing');
                        } else if (activeMetier === 'boutique') {
                          navigate('/boutique-landing');
                        } else {
                          navigate('/register');
                        }
                      }}
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


        /* =========================================================
           LIQUID GLASS 2026 — VISUAL SYSTEM
           Purely visual layer: existing navigation, state and routing
           logic are intentionally preserved.
           ========================================================= */
        .gesstock-landing {
          --glass-bg: rgba(13, 24, 49, 0.46);
          --glass-bg-strong: rgba(15, 27, 56, 0.68);
          --glass-border: rgba(191, 219, 254, 0.18);
          --glass-highlight: rgba(255, 255, 255, 0.18);
          --cyan: #5ee7ff;
          --violet: #8b7cff;
          --blue: #4f8cff;
          background: #030817;
          overflow: hidden;
        }

        .gesstock-landing::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: -3;
          background:
            radial-gradient(circle at 50% 0%, rgba(71, 113, 255, .18), transparent 32%),
            radial-gradient(circle at 5% 50%, rgba(63, 227, 255, .07), transparent 28%),
            radial-gradient(circle at 95% 70%, rgba(133, 84, 255, .09), transparent 30%);
        }

        .gradient-bg {
          background:
            radial-gradient(ellipse 70% 50% at 50% -10%, rgba(67, 119, 255, .24), transparent 65%),
            radial-gradient(ellipse 55% 45% at 90% 55%, rgba(123, 77, 255, .14), transparent 70%),
            radial-gradient(ellipse 45% 35% at 10% 80%, rgba(29, 208, 255, .10), transparent 70%),
            linear-gradient(180deg, #020714 0%, #071226 45%, #030817 100%);
          z-index: -4;
        }

        .liquid-orb {
          position: fixed;
          width: 28rem;
          height: 28rem;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
          opacity: .16;
          z-index: -2;
          animation: liquidFloat 14s ease-in-out infinite alternate;
        }
        .orb-one { top: 8%; left: -12rem; background: #4cc9ff; }
        .orb-two { top: 35%; right: -14rem; background: #735cff; animation-delay: -5s; }
        .orb-three { bottom: -16rem; left: 38%; background: #2f74ff; animation-delay: -9s; }

        @keyframes liquidFloat {
          from { transform: translate3d(0, -18px, 0) scale(1); }
          to { transform: translate3d(30px, 22px, 0) scale(1.08); }
        }

        .gesstock-nav {
          top: 14px;
          left: 50%;
          right: auto;
          width: min(1180px, calc(100% - 28px));
          transform: translateX(-50%);
          padding: .72rem .9rem;
          border: 1px solid rgba(191, 219, 254, .14);
          border-radius: 22px;
          background: rgba(7, 15, 34, .48);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.12),
            0 18px 55px rgba(0,0,0,.28),
            0 0 40px rgba(65, 109, 255, .08);
        }

        .gesstock-nav::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(120deg, rgba(255,255,255,.10), transparent 28%, transparent 72%, rgba(94,231,255,.05));
        }

        .gesstock-nav.is-scrolled {
          top: 8px;
          background: rgba(5, 12, 28, .74);
          border-color: rgba(191, 219, 254, .20);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.14),
            0 20px 60px rgba(0,0,0,.38),
            0 0 45px rgba(79, 140, 255, .10);
        }

        .nav-container { position: relative; z-index: 2; max-width: none; }
        .brand { text-shadow: 0 0 20px rgba(93, 208, 255, .18); }
        .brand-logo { filter: drop-shadow(0 0 12px rgba(82, 139, 255, .45)); }
        .nav-links { gap: .35rem; }
        .nav-links button {
          padding: .65rem .85rem;
          border-radius: 12px;
          color: #9eb0ca;
        }
        .nav-links button:hover {
          color: #fff;
          background: rgba(255,255,255,.055);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
        }

        .lang-toggle {
          border-radius: 14px;
          background: rgba(255,255,255,.045);
          border-color: rgba(191,219,254,.12);
          backdrop-filter: blur(14px);
        }
        .lang-toggle button { border-radius: 10px; }
        .lang-toggle button.active {
          background: linear-gradient(135deg, rgba(80,140,255,.95), rgba(117,84,255,.95));
          box-shadow: 0 0 18px rgba(91,113,255,.35), inset 0 1px 0 rgba(255,255,255,.25);
        }

        .btn {
          position: relative;
          overflow: hidden;
          border-radius: 15px;
          border: 1px solid rgba(191,219,254,.14);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 10px 28px rgba(0,0,0,.18);
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease, background .25s ease;
        }
        .btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, rgba(255,255,255,.15), transparent 30%, transparent 70%, rgba(94,231,255,.08));
          opacity: .65;
          pointer-events: none;
        }
        .btn > * { position: relative; z-index: 1; }
        .btn:hover { transform: translateY(-2px); }
        .btn-primary {
          background: linear-gradient(135deg, rgba(72,133,255,.95), rgba(118,78,255,.95));
          border-color: rgba(177,206,255,.32);
          box-shadow: 0 0 0 1px rgba(118,139,255,.08), 0 12px 35px rgba(67,96,255,.32), inset 0 1px 0 rgba(255,255,255,.25);
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #5a96ff, #8b67ff);
          box-shadow: 0 0 0 1px rgba(118,139,255,.16), 0 16px 42px rgba(67,96,255,.42), inset 0 1px 0 rgba(255,255,255,.3);
        }
        .btn-secondary, .btn-ghost {
          background: rgba(255,255,255,.045);
          border-color: rgba(191,219,254,.14);
        }
        .btn-secondary:hover, .btn-ghost:hover { background: rgba(255,255,255,.085); border-color: rgba(191,219,254,.24); }
        .btn-lg { padding: .9rem 1.35rem; border-radius: 17px; }

        .hero-section { padding-top: 11.5rem; padding-bottom: 7rem; }
        .hero-container { gap: 5rem; }
        .hero-content { position: relative; z-index: 2; }
        .hero-badge, .inline-badge {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(74,125,255,.16), rgba(132,91,255,.10));
          border: 1px solid rgba(156,190,255,.22);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 0 28px rgba(79,140,255,.08);
          backdrop-filter: blur(18px) saturate(150%);
          -webkit-backdrop-filter: blur(18px) saturate(150%);
        }
        .hero-badge::after, .inline-badge::after {
          content: '';
          position: absolute;
          width: 90px;
          height: 2px;
          left: 12%;
          top: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.7), transparent);
          filter: blur(.5px);
          animation: shineSweep 5s ease-in-out infinite;
        }
        @keyframes shineSweep {
          0%, 55% { transform: translateX(-120px); opacity: 0; }
          65% { opacity: 1; }
          82%, 100% { transform: translateX(260px); opacity: 0; }
        }

        .hero-title {
          max-width: 760px;
          font-size: clamp(3.1rem, 5.2vw, 5rem);
          line-height: 1.02;
          letter-spacing: -.055em;
          background: linear-gradient(105deg, #ffffff 8%, #dbeafe 45%, #9bb9ff 72%, #b69cff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          filter: drop-shadow(0 10px 30px rgba(58,106,255,.12));
        }
        .hero-subtitle { max-width: 700px; color: #a8b7cf; font-size: 1.12rem; }
        .hero-reassurance span {
          padding: .38rem .65rem;
          border: 1px solid rgba(191,219,254,.09);
          border-radius: 999px;
          background: rgba(255,255,255,.025);
        }

        .hero-visual { position: relative; min-height: 490px; display: grid; place-items: center; }
        .hero-glow-ring {
          position: absolute;
          width: 82%;
          aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(75,128,255,.22), rgba(109,78,255,.08) 42%, transparent 70%);
          filter: blur(18px);
          animation: breathe 6s ease-in-out infinite;
        }
        @keyframes breathe { 0%,100% { transform: scale(.94); opacity: .7; } 50% { transform: scale(1.06); opacity: 1; } }

        .dashboard-mockup {
          position: relative;
          z-index: 2;
          width: min(100%, 590px);
          background: linear-gradient(145deg, rgba(21,38,76,.70), rgba(5,13,31,.72));
          border: 1px solid rgba(191,219,254,.22);
          border-radius: 30px;
          overflow: hidden;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.20),
            inset 0 -1px 0 rgba(255,255,255,.04),
            0 35px 90px rgba(0,0,0,.48),
            0 0 60px rgba(67,112,255,.16);
          backdrop-filter: blur(28px) saturate(155%);
          -webkit-backdrop-filter: blur(28px) saturate(155%);
          transform: perspective(1200px) rotateY(-4deg) rotateX(2deg);
          animation: mockupFloat 7s ease-in-out infinite;
        }
        .dashboard-mockup::before {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(125deg, rgba(255,255,255,.15), transparent 23%, transparent 70%, rgba(95,194,255,.07));
        }
        @keyframes mockupFloat { 0%,100% { transform: perspective(1200px) rotateY(-4deg) rotateX(2deg) translateY(0); } 50% { transform: perspective(1200px) rotateY(-2deg) rotateX(1deg) translateY(-10px); } }
        .mockup-header {
          background: rgba(255,255,255,.035);
          border-bottom-color: rgba(191,219,254,.10);
          padding: .9rem 1.1rem;
        }
        .mockup-dots span { box-shadow: 0 0 10px rgba(95,194,255,.12); }
        .mockup-title { color: #a9b9d4; letter-spacing: .04em; }
        .mockup-body { min-height: 330px; }
        .mockup-sidebar { background: rgba(0,0,0,.18); border-right-color: rgba(191,219,254,.08); }
        .mockup-item { height: 10px; background: rgba(184,205,238,.12); border-radius: 8px; }
        .mockup-item.active { background: linear-gradient(90deg, #4f8cff, #8a70ff); box-shadow: 0 0 18px rgba(79,140,255,.42); }
        .mockup-main { padding: 1.4rem; }
        .ai-preview-box, .mockup-stat, .mockup-chart {
          background: linear-gradient(145deg, rgba(74,126,255,.13), rgba(255,255,255,.035));
          border-color: rgba(148,181,255,.16);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.09);
          backdrop-filter: blur(18px);
        }
        .ai-preview-box { position: relative; align-items: flex-start; }
        .ai-preview-box p { max-width: 360px; }
        .ai-status-pill {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          margin-top: .55rem;
          padding: .3rem .55rem;
          border-radius: 999px;
          background: rgba(45, 212, 191, .08);
          border: 1px solid rgba(45,212,191,.14);
          color: #8ee9da;
          font-size: .65rem;
          font-weight: 700;
        }
        .ai-status-pill span { width: 6px; height: 6px; border-radius: 50%; background: #5ee7c6; box-shadow: 0 0 10px #5ee7c6; }

        .floating-glass-chip {
          position: absolute;
          z-index: 4;
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          padding: .62rem .82rem;
          border-radius: 16px;
          color: #dce9ff;
          font-size: .72rem;
          font-weight: 700;
          background: rgba(9,19,42,.58);
          border: 1px solid rgba(191,219,254,.18);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 18px 40px rgba(0,0,0,.25), 0 0 24px rgba(79,140,255,.10);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          animation: chipFloat 5s ease-in-out infinite;
        }
        .floating-glass-chip svg { color: #6ee7ff; }
        .chip-sales { top: 17%; right: -2%; }
        .chip-stock { bottom: 14%; left: -3%; animation-delay: -2.3s; }
        @keyframes chipFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }

        .trust-band {
          position: relative;
          background: rgba(8,17,36,.35);
          border-color: rgba(191,219,254,.08);
          backdrop-filter: blur(20px);
        }
        .trust-item {
          padding: .75rem 1rem;
          border: 1px solid rgba(191,219,254,.07);
          border-radius: 16px;
          background: rgba(255,255,255,.022);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
        }
        .trust-item svg { color: #6aa5ff; filter: drop-shadow(0 0 8px rgba(106,165,255,.5)); }

        .section { position: relative; padding: 7.5rem 0; }
        .section-alt, .section-dark { background: transparent; }
        .section-header h2 { font-size: clamp(2.1rem, 4vw, 3.15rem); letter-spacing: -.045em; }
        .section-header p { color: #91a4c1; }

        .problem-card, .solution-card, .feature-card, .testimonial-card, .faq-item, .metier-detail, .ai-card {
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, rgba(20,35,69,.48), rgba(7,15,33,.38));
          border: 1px solid rgba(191,219,254,.13);
          border-radius: 24px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.10), 0 20px 50px rgba(0,0,0,.16);
          backdrop-filter: blur(24px) saturate(145%);
          -webkit-backdrop-filter: blur(24px) saturate(145%);
        }
        .problem-card::before, .solution-card::before, .feature-card::before, .testimonial-card::before, .faq-item::before, .metier-detail::before, .ai-card::before {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(125deg, rgba(255,255,255,.10), transparent 24%, transparent 75%, rgba(92,185,255,.05));
        }
        .problem-card:hover, .solution-card:hover, .feature-card:hover, .testimonial-card:hover, .ai-card:hover {
          transform: translateY(-8px);
          border-color: rgba(126,173,255,.28);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 26px 60px rgba(0,0,0,.24), 0 0 32px rgba(75,128,255,.08);
        }
        .problem-card, .solution-card, .feature-card, .testimonial-card, .ai-card { transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease; }

        .problem-icon, .solution-icon, .ai-card-icon {
          position: relative;
          border-radius: 18px;
          border: 1px solid rgba(191,219,254,.14);
          background: linear-gradient(145deg, rgba(92,137,255,.18), rgba(123,77,255,.08));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 10px 25px rgba(0,0,0,.16), 0 0 22px rgba(79,140,255,.10);
        }
        .problem-icon.danger { color: #ff9aa8; background: linear-gradient(145deg, rgba(255,92,122,.13), rgba(109,50,86,.08)); }
        .solution-icon.success { color: #75f0d4; background: linear-gradient(145deg, rgba(55,224,192,.13), rgba(65,103,255,.08)); }
        .ai-card-icon { color: #91b4ff; }
        .problem-card h3, .solution-card h3, .feature-card h3, .ai-card h3 { letter-spacing: -.02em; }
        .problem-card p, .solution-card p, .feature-card p, .ai-card p { color: #9aabc4; }

        .ai-showcase-section { background: radial-gradient(circle at 50% 45%, rgba(74,117,255,.10), transparent 55%); }
        .ai-card { border-color: rgba(115,135,255,.18); }
        .ai-card:hover { border-color: rgba(123,158,255,.38); }

        .metier-tabs button {
          position: relative;
          background: rgba(255,255,255,.035);
          border-color: rgba(191,219,254,.13);
          border-radius: 16px;
          backdrop-filter: blur(18px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
        }
        .metier-tabs button:hover, .metier-tabs button.active {
          background: linear-gradient(135deg, rgba(75,128,255,.13), rgba(126,84,255,.10));
          color: #fff;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 12px 30px rgba(0,0,0,.18), 0 0 26px rgba(79,140,255,.08);
        }
        .metier-detail { padding: 3.25rem; }
        .metier-visual {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(191,219,254,.10);
          background: linear-gradient(145deg, rgba(76,126,255,.12), rgba(120,77,255,.06)) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.09);
        }
        .metier-visual::before {
          content: '';
          position: absolute;
          width: 230px;
          height: 230px;
          border-radius: 50%;
          background: rgba(85,142,255,.20);
          filter: blur(55px);
        }
        .metier-icon-large {
          position: relative;
          z-index: 1;
          background: linear-gradient(145deg, rgba(88,143,255,.9), rgba(117,83,255,.85)) !important;
          border: 1px solid rgba(255,255,255,.25);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 20px 45px rgba(0,0,0,.28), 0 0 45px rgba(79,140,255,.22);
          backdrop-filter: blur(18px);
        }
        .benefit-list li {
          padding: .6rem .75rem;
          border-radius: 13px;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(191,219,254,.07);
        }

        .testimonial-card p { color: #c5d3e8; }
        .testimonial-stars { filter: drop-shadow(0 0 7px rgba(245,158,11,.25)); }
        .testimonial-author { border-top-color: rgba(191,219,254,.08); }

        .faq-item.open {
          border-color: rgba(108,153,255,.25);
          background: linear-gradient(145deg, rgba(25,43,82,.54), rgba(8,17,37,.46));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 20px 45px rgba(0,0,0,.20), 0 0 28px rgba(79,140,255,.06);
        }
        .faq-item button { padding: 1.35rem 1.5rem; }
        .faq-item button svg { transition: transform .3s ease; color: #89aaff; }
        .faq-item.open button svg { transform: rotate(180deg); }
        .faq-answer { color: #9aabc4; }

        .cta-card {
          background: linear-gradient(135deg, rgba(55,100,220,.22), rgba(116,74,224,.13) 55%, rgba(22,180,225,.08));
          border: 1px solid rgba(166,197,255,.24);
          border-radius: 30px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 30px 80px rgba(0,0,0,.3), 0 0 70px rgba(79,140,255,.12);
          backdrop-filter: blur(30px) saturate(155%);
          -webkit-backdrop-filter: blur(30px) saturate(155%);
        }
        .cta-card::before {
          content: '';
          position: absolute;
          width: 380px;
          height: 380px;
          right: -100px;
          top: -160px;
          border-radius: 50%;
          background: rgba(88,139,255,.20);
          filter: blur(65px);
        }
        .cta-icon { filter: drop-shadow(0 0 28px rgba(103,144,255,.45)); opacity: .65; }

        [data-reveal] { transform: translateY(28px) scale(.985); transition: opacity .8s cubic-bezier(.2,.8,.2,1), transform .8s cubic-bezier(.2,.8,.2,1); }
        [data-reveal].is-visible { transform: translateY(0) scale(1); }

        @media (prefers-reduced-motion: reduce) {
          .liquid-orb, .dashboard-mockup, .hero-glow-ring, .floating-glass-chip, .hero-badge::after, .inline-badge::after { animation: none !important; }
          [data-reveal] { transition: opacity .2s ease !important; transform: none !important; }
          .btn, .problem-card, .solution-card, .feature-card, .testimonial-card, .ai-card { transition: none !important; }
        }

        @media (max-width: 968px) {
          .gesstock-nav { top: 8px; width: calc(100% - 16px); }
          .nav-links { display: none; }
          .btn-mobile { display: block; }
          .hero-container, .metier-content { grid-template-columns: 1fr; gap: 2rem; }
          .cta-card { display: flex; flex-direction: column; align-items: flex-start; gap: 2rem; }
          .hero-title { font-size: clamp(2.55rem, 9vw, 3.8rem); }
          .hero-section { padding-top: 9rem; }
          .hero-visual { min-height: 420px; margin-top: 1rem; }
          .dashboard-mockup { transform: none; animation: mockupFloatMobile 7s ease-in-out infinite; }
          @keyframes mockupFloatMobile { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
          .chip-sales { right: -1%; top: 8%; }
          .chip-stock { left: -1%; bottom: 8%; }
          .trust-container, .grid-3, .ai-grid, .testimonials-grid { grid-template-columns: 1fr; }
          .metier-detail { padding: 1.5rem; }
          .metier-visual { height: 230px; }
        }

        @media (max-width: 560px) {
          .nav-actions { gap: .35rem; }
          .nav-actions .btn-ghost, .nav-actions .lang-toggle { display: none; }
          .brand span { font-size: 1rem; }
          .hero-section { padding-bottom: 4rem; }
          .hero-cta { flex-direction: column; align-items: stretch; }
          .hero-cta .btn { width: 100%; }
          .hero-reassurance { gap: .45rem; }
          .hero-reassurance span { font-size: .72rem; }
          .hero-visual { min-height: 330px; }
          .dashboard-mockup { border-radius: 22px; }
          .mockup-body { min-height: 240px; }
          .mockup-sidebar { width: 44px; }
          .mockup-main { padding: .8rem; }
          .ai-preview-box { padding: .75rem; gap: .65rem; }
          .ai-preview-box p { font-size: .68rem; }
          .floating-glass-chip { font-size: .62rem; padding: .5rem .62rem; }
          .chip-sales { right: -2%; }
          .chip-stock { left: -2%; }
          .section { padding: 5rem 0; }
          .section-header { margin-bottom: 2.5rem; }
          .cta-card { padding: 2rem; }
          .cta-content h2 { font-size: 2rem; }
          .cta-visual { display: none; }
        }
      `}</style>
    </div>
  );
}