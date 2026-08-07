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
  ShoppingCart,
  Users,
  BarChart3,
  CreditCard,
  FileText,
  Warehouse,
  Store,
  ShoppingBag,
  Utensils,
  Scissors,
  Wrench,
  Pill,
  Hotel,
  Home,
  Truck,
  MessageCircle,
  Headphones,
  Star,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Sparkles,
  Rocket,
  Shield,
  Lock,
  RefreshCw,
  Database,
LineChart,
  PieChart,
  Building2,
  TrendingDown as TrendDown,
} from 'lucide-react';
import logo from '../assets/logo-neon.png';

const copy = {
  fr: {
    nav: ['Produit', 'Métiers', 'Tarifs', 'Témoignages', 'FAQ'],
    login: 'Se connecter',
    trial: 'Essai gratuit',
    badge: 'La solution de gestion tout-en-un pour PME africaines',
    title: 'Digitalisez votre entreprise. Simplifiez votre croissance.',
    subtitle: 'La solution de gestion tout-en-un conçue pour les PME africaines. Gérez vos stocks, vos ventes, votre caisse et votre équipe depuis une seule plateforme moderne et intuitive.',
    primary: 'Démarrer gratuitement',
    secondary: 'Voir la démo',
    reassurance: ['Sans carte bancaire', 'Essai 14 jours', 'Annulable à tout moment', 'Support en français'],
    trust: ['+5000 entreprises', '15 pays africains', '99.9% disponibilité', 'Support 24/7'],
    problemsTitle: 'Les défis des PME africaines',
    problemsText: 'Des milliers d\'entreprises perdent du temps et de l\'argent avec ces problèmes quotidiens. GESTOCK les a résolus.',
    solutionsTitle: 'Comment GESTOCK transforme votre entreprise',
    metiersTitle: 'Les métiers que nous servons',
    metiersText: 'Une solution adaptée à chaque secteur d\'activité',
    whyTitle: 'Pourquoi choisir GESTOCK',
    testimonialsTitle: 'Ce que nos clients disent',
    faqTitle: 'Questions fréquentes',
    ctaTitle: 'Prêt à transformer votre entreprise ?',
    ctaText: 'Rejoignez les centaines d\'entreprises africaines qui ont déjà choisi GESTOCK.',
    ctaButton: 'Commencer l\'essai gratuit',
    footerTagline: 'La solution de gestion pensée pour l\'Afrique.',
    footerBottom: '2026 GESTOCK. Conçu pour l\'Afrique, par des professionnels qui comprennent vos défis.',
  },
  en: {
    nav: ['Product', 'Industries', 'Pricing', 'Testimonials', 'FAQ'],
    login: 'Log in',
    trial: 'Start free',
    badge: 'The all-in-one management solution for African SMEs',
    title: 'Digitalize your business. Simplify your growth.',
    subtitle: 'The all-in-one management solution designed for African SMEs. Manage your inventory, sales, cash register and team from a single modern and intuitive platform.',
    primary: 'Start free trial',
    secondary: 'Watch demo',
    reassurance: ['No credit card', '14-day trial', 'Cancel anytime', 'French support'],
    trust: ['+5000 businesses', '15 African countries', '99.9% uptime', '24/7 support'],
    problemsTitle: 'Challenges faced by African SMEs',
    problemsText: 'Thousands of businesses lose time and money with these daily issues. GESTOCK has solved them.',
    solutionsTitle: 'How GESTOCK transforms your business',
    metiersTitle: 'Industries we serve',
    metiersText: 'A solution adapted to every business sector',
    whyTitle: 'Why choose GESTOCK',
    testimonialsTitle: 'What our clients say',
    faqTitle: 'Frequently asked questions',
    ctaTitle: 'Ready to transform your business?',
    ctaText: 'Join the hundreds of African businesses that have already chosen GESTOCK.',
    ctaButton: 'Start free trial',
    footerTagline: 'The management solution designed for Africa.',
    footerBottom: '2026 GESTOCK. Designed for Africa, by professionals who understand your challenges.',
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
    frDesc: 'Saisies répétitives, sources d\'erreurs et temps perdu dans la consolidation des données',
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
    frDesc: 'Historique complet, identification des responsabilités et rapports d\'audit détaillés',
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

const metiers = [
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
    frDesc: 'Suivi des rayons, gestion des promotions et caisse intégrée',
    enDesc: 'Aisle tracking, promotion management and integrated POS',
    frBenefits: ['Réduction des ruptures de 60%', 'Augmentation du panier moyen', 'Gestion multi-caisse'],
    enBenefits: ['60% stockout reduction', 'Increased basket size', 'Multi-POS management'],
    color: '#f59e0b',
  },
  {
    icon: Store,
    key: 'boutique',
    fr: 'Boutique',
    en: 'Retail Store',
    frDesc: 'Interface simplifiée, prise en main rapide et fonctionnalités essentielles',
    enDesc: 'Simplified interface, quick onboarding and essential features',
    frBenefits: ['Prise en main en 48 heures', 'Réduction des erreurs de 90%', 'Meilleure connaissance client'],
    enBenefits: ['48-hour onboarding', '90% error reduction', 'Better customer knowledge'],
    color: '#0891b2',
  },
  {
    icon: Utensils,
    key: 'restaurant',
    fr: 'Restaurant',
    en: 'Restaurant',
    frDesc: 'Gestion des tables, commandes et réservations',
    enDesc: 'Table management, orders and reservations',
    frBenefits: ['Optimisation du service', 'Gestion des stocks cuisine', 'Suivi des réservations'],
    enBenefits: ['Service optimization', 'Kitchen stock management', 'Reservation tracking'],
    color: '#dc2626',
  },
  {
    icon: Scissors,
    key: 'salon',
    fr: 'Salon de Coiffure',
    en: 'Hair Salon',
    frDesc: 'Agenda, prestations et gestion des rendez-vous',
    enDesc: 'Agenda, services and appointment management',
    frBenefits: ['Gestion de l\'agenda', 'Historique client', 'Suivi des prestations'],
    enBenefits: ['Agenda management', 'Client history', 'Service tracking'],
    color: '#ec4899',
  },
  {
    icon: Wrench,
    key: 'garage',
    fr: 'Garage Automobile',
    en: 'Auto Garage',
    frDesc: 'Ordres de réparation et gestion des véhicules',
    enDesc: 'Repair orders and vehicle management',
    frBenefits: ['Suivi des réparations', 'Gestion des pièces', 'Historique véhicule'],
    enBenefits: ['Repair tracking', 'Parts management', 'Vehicle history'],
    color: '#f97316',
  },
  {
    icon: Pill,
    key: 'pharmacie',
    fr: 'Pharmacie',
    en: 'Pharmacy',
    frDesc: 'Gestion des médicaments et ordonnances',
    enDesc: 'Medication and prescription management',
    frBenefits: ['Suivi des péremptions', 'Gestion des stocks', 'Historique des ventes'],
    enBenefits: ['Expiry tracking', 'Stock management', 'Sales history'],
    color: '#059669',
  },
  {
    icon: Hotel,
    key: 'hotel',
    fr: 'Hôtel',
    en: 'Hotel',
    frDesc: 'Gestion des chambres et réservations',
    enDesc: 'Room and reservation management',
    frBenefits: ['Gestion des chambres', 'Suivi des réservations', 'Facturation automatique'],
    enBenefits: ['Room management', 'Reservation tracking', 'Automatic invoicing'],
    color: '#8b5cf6',
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
    frDesc: 'Gérez votre entreprise depuis votre smartphone',
    enDesc: 'Manage your business from your smartphone',
  },
  {
    icon: Zap,
    fr: 'Opérationnel en 48h',
    en: 'Live in 48h',
    frDesc: 'Prise en main rapide sans formation complexe',
    enDesc: 'Quick onboarding without complex training',
  },
  {
    icon: ShieldCheck,
    fr: 'Données sécurisées',
    en: 'Secure data',
    frDesc: 'Sauvegardes automatiques et permissions par rôle',
    enDesc: 'Automatic backups and role-based permissions',
  },
  {
    icon: Headphones,
    fr: 'Support local',
    en: 'Local support',
    frDesc: 'Équipe basée en Afrique, disponible en français',
    enDesc: 'Africa-based team, available in French',
  },
  {
    icon: TrendingUp,
    fr: 'Scalabilité',
    en: 'Scalability',
    frDesc: 'Évoluez à votre rythme avec une architecture multi-tenant',
    enDesc: 'Grow at your pace with multi-tenant architecture',
  },
];

const testimonials = [
  {
    name: 'Emmanuel N.',
    company: 'Dépôt Boissons Plus',
    city: 'Douala, Cameroun',
    fr: 'Depuis que nous utilisons GESTOCK, nos pertes de stock ont diminué de 35%. Le suivi des consignations est désormais automatisé et sans erreur.',
    en: 'Since using GESTOCK, our inventory losses have decreased by 35%. Consignment tracking is now automated and error-free.',
    role: 'Dépôt de Boissons',
  },
  {
    name: 'Marie-Claire T.',
    company: 'Supermarché Élite',
    city: 'Yaoundé, Cameroun',
    fr: 'GESTOCK a transformé la gestion de notre supermarché. Nos ruptures ont diminué de moitié et nous avons pu augmenter notre panier moyen de 15%.',
    en: 'GESTOCK transformed our supermarket management. Our stockouts dropped by half and we increased our basket size by 15%.',
    role: 'Supermarché',
  },
  {
    name: 'Jean-Paul M.',
    company: 'Boutique du Centre',
    city: 'Libreville, Gabon',
    fr: 'Je ne suis pas très à l\'aise avec la technologie, mais GESTOCK a été une révélation. En une heure, je gérais mes ventes et mes stocks sans difficulté.',
    en: 'I\'m not very comfortable with technology, but GESTOCK was a revelation. In one hour, I was managing my sales and inventory without difficulty.',
    role: 'Boutique',
  },
  {
    name: 'Aminata D.',
    company: 'Groupe Commercial AD',
    city: 'Abidjan, Côte d\'Ivoire',
    fr: 'Avec 3 points de vente, la gestion était devenue un enfer. GESTOCK nous a permis de centraliser tout dans une seule interface.',
    en: 'With 3 sales points, management had become a nightmare. GESTOCK allowed us to centralize everything in a single interface.',
    role: 'Multi-sites',
  },
];

const faqs = {
  fr: [
    ['Qu\'est-ce que GESTOCK exactement ?', 'GESTOCK est une plateforme SaaS de gestion d\'entreprise tout-en-un, conçue spécifiquement pour les PME africaines. Elle permet de gérer les stocks, les ventes, les achats, la caisse, les clients et les employés depuis une seule interface.'],
    ['À qui s\'adresse GESTOCK ?', 'GESTOCK s\'adresse principalement aux dépôts de boissons, supermarchés, boutiques, restaurants et commerces de proximité en Afrique.'],
    ['Combien de temps faut-il pour mettre en place GESTOCK ?', 'La mise en place est rapide : comptez 24 à 48 heures pour configurer votre compte et importer vos données.'],
    ['GESTOCK fonctionne-t-il hors connexion ?', 'GESTOCK nécessite une connexion internet pour synchroniser les données, mais une application mobile permet de continuer à travailler hors connexion avec synchronisation automatique.'],
    ['Mes données sont-elles sécurisées ?', 'Absolument. Vos données sont hébergées sur des serveurs sécurisés avec sauvegardes automatiques quotidiennes et chiffrement des données.'],
    ['Combien coûte GESTOCK ?', 'Nous proposons plusieurs formules adaptées à la taille de votre entreprise. Contactez-nous pour obtenir un devis personnalisé.'],
    ['Y a-t-il un essai gratuit ?', 'Oui, nous proposons une période d\'essai gratuit de 14 jours pour découvrir toutes les fonctionnalités.'],
  ],
  en: [
    ['What is GESTOCK exactly?', 'GESTOCK is an all-in-one business management SaaS platform designed specifically for African SMEs. It allows you to manage inventory, sales, purchases, cash register, customers and employees from a single interface.'],
    ['Who is GESTOCK for?', 'GESTOCK is primarily aimed at beverage depots, supermarkets, retail stores, restaurants and local businesses in Africa.'],
    ['How long does it take to set up GESTOCK?', 'Setup is fast: count 24 to 48 hours to configure your account and import your data.'],
    ['Does GESTOCK work offline?', 'GESTOCK requires an internet connection to sync data, but a mobile app allows you to continue working offline with automatic sync.'],
    ['Is my data secure?', 'Absolutely. Your data is hosted on secure servers with daily automatic backups and data encryption.'],
    ['How much does GESTOCK cost?', 'We offer several plans adapted to the size of your business. Contact us for a personalized quote.'],
    ['Is there a free trial?', 'Yes, we offer a 14-day free trial to discover all features.'],
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
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
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
              <button key={item} type="button" onClick={() => scrollTo(['product', 'metiers', 'pricing', 'testimonials', 'faq'][index])}>
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
            <button key={item} type="button" onClick={() => scrollTo(['product', 'metiers', 'pricing', 'testimonials', 'faq'][index])}>
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
                <Star size={16} />
                {t.badge}
              </div>
              <h1 className="hero-title">{t.title}</h1>
              <p className="hero-subtitle">{t.subtitle}</p>
              <div className="hero-cta">
                <button className="btn btn-primary btn-lg" type="button" onClick={() => navigate('/register')}>
                  {t.primary}
                  <ArrowRight size={20} />
                </button>
                <button className="btn btn-secondary btn-lg" type="button" onClick={() => scrollTo('product')}>
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
                  <div className="mockup-title">GESTOCK Dashboard</div>
                </div>
                <div className="mockup-body">
                  <div className="mockup-sidebar">
                    <div className="mockup-item active" />
                    <div className="mockup-item" />
                    <div className="mockup-item" />
                    <div className="mockup-item" />
                  </div>
                  <div className="mockup-main">
                    <div className="mockup-stats">
                      <div className="mockup-stat" />
                      <div className="mockup-stat" />
                      <div className="mockup-stat" />
                    </div>
                    <div className="mockup-chart" />
                    <div className="mockup-list">
                      <div className="mockup-list-item" />
                      <div className="mockup-list-item" />
                      <div className="mockup-list-item" />
                    </div>
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
                    <Icon size={32} />
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
                    <Icon size={32} />
                  </div>
                  <h3>{isFr ? fr : en}</h3>
                  <p>{isFr ? frDesc : enDesc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Métiers Section */}
        <section id="metiers" className="section section-dark">
          <div className="container">
            <div className="section-header" data-reveal>
              <h2>{t.metiersTitle}</h2>
              <p>{t.metiersText}</p>
            </div>
            
            <div className="metier-tabs" data-reveal>
              {metiers.map(({ icon: Icon, key, fr, en }) => (
                <button
                  key={key}
                  type="button"
                  className={activeMetier === key ? 'active' : ''}
                  onClick={() => setActiveMetier(key)}
                  style={activeMetier === key ? { borderColor: metiers.find(m => m.key === key)?.color } : {}}
                >
                  <Icon size={20} />
                  {isFr ? fr : en}
                </button>
              ))}
            </div>

            <div className="metier-detail" data-reveal>
              {metiers.filter(m => m.key === activeMetier).map(({ icon: Icon, fr, en, frDesc, enDesc, frBenefits, enBenefits, color }) => (
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

      {/* Footer */}
      <footer className="gesstock-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <img src={logo} alt="GESTOCK" className="footer-logo" />
            <div>
              <strong>GESTOCK</strong>
              <p>{t.footerTagline}</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>{t.footerBottom}</p>
          </div>
        </div>
      </footer>

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
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 92, 246, 0.1), transparent),
            radial-gradient(ellipse 50% 30% at 20% 80%, rgba(6, 182, 212, 0.08), transparent),
            linear-gradient(180deg, #0a0a0f 0%, #0f172a 50%, #0a0a0f 100%);
          z-index: -2;
        }

        .noise-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E");
          z-index: -1;
          pointer-events: none;
        }

        .gesstock-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
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
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.75rem;
          font-weight: 900;
          color: #f8fafc;
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .brand span {
          background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-logo {
          height: 36px;
          width: auto;
          filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.3));
        }

        .footer-logo {
          height: 44px;
          width: auto;
          filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.2));
        }

        .nav-links {
          display: flex;
          gap: 2rem;
        }

        .nav-links button {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
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
          background: rgba(148, 163, 184, 0.1);
          border-radius: 8px;
          padding: 0.25rem;
        }

        .lang-toggle button {
          background: none;
          border: none;
          padding: 0.25rem 0.75rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .lang-toggle button.active {
          background: #6366f1;
          color: #f8fafc;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-ghost {
          background: transparent;
          color: #94a3b8;
        }

        .btn-ghost:hover {
          color: #f8fafc;
          background: rgba(148, 163, 184, 0.1);
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
          color: #f8fafc;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
          position: relative;
          overflow: hidden;
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .btn-primary:hover::before {
          left: 100%;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 40px rgba(99, 102, 241, 0.5);
        }

        .btn-secondary {
          background: rgba(148, 163, 184, 0.1);
          color: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(148, 163, 184, 0.2);
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1rem;
        }

        .btn-mobile {
          display: none;
          background: none;
          border: none;
          color: #f8fafc;
          cursor: pointer;
        }

        .mobile-nav {
          position: fixed;
          top: 72px;
          left: 0;
          right: 0;
          background: rgba(15, 23, 42, 0.98);
          backdrop-filter: blur(20px);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .mobile-nav button {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1rem;
          padding: 1rem;
          text-align: left;
          cursor: pointer;
        }

        .hero-section {
          padding: 8rem 0 4rem;
          position: relative;
          overflow: hidden;
        }

        .hero-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-content {
          z-index: 1;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 100px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #a5b4fc;
          margin-bottom: 2rem;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 900;
          line-height: 1.05;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #c7d2fe 50%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.03em;
        }

        .hero-subtitle {
          font-size: 1.35rem;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 2rem;
          max-width: 600px;
        }

        .hero-cta {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .hero-reassurance {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          font-size: 0.85rem;
          color: #64748b;
        }

        .hero-reassurance span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dashboard-mockup {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          padding: 1.25rem;
          backdrop-filter: blur(30px);
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.4),
            0 0 100px rgba(99, 102, 241, 0.1);
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        .mockup-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .mockup-dots {
          display: flex;
          gap: 0.5rem;
        }

        .mockup-dots span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(148, 163, 184, 0.3);
        }

        .mockup-title {
          font-size: 0.85rem;
          color: #64748b;
        }

        .mockup-body {
          display: flex;
          gap: 1rem;
          padding: 1rem;
        }

        .mockup-sidebar {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mockup-item {
          width: 40px;
          height: 8px;
          border-radius: 4px;
          background: rgba(148, 163, 184, 0.2);
        }

        .mockup-item.active {
          background: #6366f1;
        }

        .mockup-main {
          flex: 1;
        }

        .mockup-stats {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .mockup-stat {
          flex: 1;
          height: 60px;
          border-radius: 8px;
          background: rgba(148, 163, 184, 0.1);
        }

        .mockup-chart {
          height: 120px;
          border-radius: 8px;
          background: rgba(148, 163, 184, 0.1);
          margin-bottom: 1rem;
        }

        .mockup-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mockup-list-item {
          height: 32px;
          border-radius: 6px;
          background: rgba(148, 163, 184, 0.1);
        }

        .trust-band {
          padding: 2rem 0;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .trust-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: center;
          gap: 3rem;
          flex-wrap: wrap;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
        }

        .section {
          padding: 6rem 0;
        }

        .section-alt {
          background: rgba(30, 41, 59, 0.3);
        }

        .section-dark {
          background: rgba(15, 23, 42, 0.5);
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .narrow {
          max-width: 800px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-header h2 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #f8fafc, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .section-header p {
          font-size: 1.1rem;
          color: #94a3b8;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .problem-card, .solution-card, .feature-card {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 20px;
          padding: 2.25rem;
          backdrop-filter: blur(30px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .problem-card::before, .solution-card::before, .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
        }

        .problem-card:hover, .solution-card:hover, .feature-card:hover {
          transform: translateY(-8px);
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.15);
        }

        .problem-icon, .solution-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
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
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .problem-card h3, .solution-card h3, .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #f8fafc;
        }

        .problem-card p, .solution-card p, .feature-card p {
          color: #94a3b8;
          line-height: 1.6;
        }

        .feature-icon {
          font-size: 2rem;
          color: #6366f1;
          margin-bottom: 1rem;
        }

        .metier-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .metier-tabs button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(30, 41, 59, 0.5);
          border: 2px solid transparent;
          border-radius: 100px;
          color: #94a3b8;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .metier-tabs button:hover {
          background: rgba(30, 41, 59, 0.8);
          color: #f8fafc;
        }

        .metier-tabs button.active {
          background: rgba(99, 102, 241, 0.1);
          color: #f8fafc;
        }

        .metier-detail {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 24px;
          padding: 3rem;
          backdrop-filter: blur(30px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        }

        .metier-content {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 3rem;
          align-items: center;
        }

        .metier-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          border-radius: 20px;
        }

        .metier-icon-large {
          width: 120px;
          height: 120px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f8fafc;
        }

        .metier-info h3 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .metier-info p {
          font-size: 1.1rem;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        .benefit-list {
          list-style: none;
          padding: 0;
          margin-bottom: 2rem;
        }

        .benefit-list li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
          color: #f8fafc;
          font-weight: 500;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .testimonial-card {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 20px;
          padding: 2.25rem;
          backdrop-filter: blur(30px);
          transition: all 0.3s ease;
        }

        .testimonial-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .testimonial-stars {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1rem;
          color: #fbbf24;
        }

        .testimonial-card p {
          font-size: 1rem;
          color: #f8fafc;
          line-height: 1.7;
          margin-bottom: 1.5rem;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .testimonial-author strong {
          display: block;
          color: #f8fafc;
          font-size: 1rem;
        }

        .testimonial-author span {
          display: block;
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .testimonial-role {
          color: #6366f1 !important;
          font-weight: 600;
        }

        .testimonial-city {
          color: #64748b;
          font-size: 0.8rem;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .faq-item {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .faq-item button {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: none;
          border: none;
          color: #f8fafc;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
        }

        .faq-item.open button {
          background: rgba(99, 102, 241, 0.1);
        }

        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .faq-item.open .faq-answer {
          max-height: 500px;
        }

        .faq-answer p {
          padding: 0 1.5rem 1.5rem;
          color: #94a3b8;
          line-height: 1.7;
        }

        .cta-section {
          padding: 8rem 0;
        }

        .cta-card {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
          border-radius: 28px;
          padding: 4rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          box-shadow: 
            0 25px 50px rgba(99, 102, 241, 0.4),
            0 0 100px rgba(139, 92, 246, 0.2);
          position: relative;
          overflow: hidden;
        }

        .cta-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          animation: pulse 8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .cta-content h2 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          color: #f8fafc;
        }

        .cta-content p {
          font-size: 1.1rem;
          color: rgba(248, 250, 252, 0.8);
          margin-bottom: 2rem;
        }

        .cta-visual {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cta-icon {
          color: rgba(248, 250, 252, 0.2);
        }

        .gesstock-footer {
          padding: 3rem 0;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
        }

        .footer-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .footer-brand strong {
          font-size: 1.5rem;
          color: #f8fafc;
        }

        .footer-brand p {
          color: #64748b;
          font-size: 0.9rem;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
        }

        .footer-bottom p {
          color: #64748b;
          font-size: 0.85rem;
        }

        [data-reveal] {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease;
        }

        [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 1024px) {
          .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hero-cta {
            justify-content: center;
          }

          .hero-reassurance {
            justify-content: center;
          }

          .grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }

          .metier-content {
            grid-template-columns: 1fr;
          }

          .testimonials-grid {
            grid-template-columns: 1fr;
          }

          .cta-card {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .cta-visual {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .nav-links, .btn-ghost, .btn-primary {
            display: none;
          }

          .btn-mobile {
            display: block;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .grid-3 {
            grid-template-columns: 1fr;
          }

          .trust-container {
            flex-direction: column;
            gap: 1rem;
          }

          .section-header h2 {
            font-size: 2rem;
          }

          .metier-tabs {
            flex-direction: column;
          }

          .metier-tabs button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
