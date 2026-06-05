import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Beer,
  Boxes,
  Building2,
  Calculator,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Globe2,
  Headphones,
  LockKeyhole,
  Menu,
  MessageCircle,
  PackageCheck,
  Play,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Truck,
  Users,
  Warehouse,
  X,
  Zap,
} from 'lucide-react';

const copy = {
  fr: {
    announce: 'GeStock lance la gestion multi-dépôts. Essayez gratuitement pendant 30 jours.',
    nav: ['Produit', 'Fonctionnalités', 'Tarifs', 'À propos', 'Blog'],
    login: 'Se connecter',
    trial: 'Essai gratuit',
    badge: 'Plateforme SaaS pour dépôts de boissons en Afrique',
    title: 'Gérez votre dépôt de boissons comme les meilleurs.',
    subtitle:
      'Stock de bières, eaux, jus et sodas. Facturation automatique. Suivi des livraisons. Rapports intelligents. Tout ce dont votre dépôt a besoin, dans une seule plateforme conçue pour l’Afrique.',
    primary: 'Commencer gratuitement',
    secondary: 'Voir la démo',
    tertiary: 'Voir les fonctionnalités',
    reassurance: ['Sans carte bancaire', 'Accès complet 30 jours', 'Annulable à tout moment', 'Support en français'],
    trust: ['+5 000 dépôts', '15 pays africains', '99.9% disponibilité', 'Support 24/7', '4.8/5'],
    problemsTitle: 'Vous reconnaissez-vous dans ces situations ?',
    problemsText:
      'Des milliers de gérants de dépôts perdaient du temps et de l’argent avec ces problèmes quotidiens. GeStock les a résolus.',
    problems: [
      ['Des casiers de bière disparaissent sans traçabilité', 'Chaque casier tracé en temps réel : entrée, sortie, retour'],
      ['Les factures sont faites à la main ou sur Excel', 'Facture générée en 30 secondes, envoyée automatiquement'],
      ['Rupture de stock découverte trop tard', 'Alertes automatiques avant toute rupture de stock'],
      ['Impossible de savoir quel produit rapporte le plus', 'Rapport de rentabilité par produit, par semaine, par mois'],
      ['Les livraisons ne sont pas contrôlées', 'Bons de livraison numériques et suivi des tournées'],
      ['Plusieurs dépôts, aucune vue centralisée', 'Tableau de bord unique pour tous vos dépôts'],
    ],
    featuresTitle: 'Tout ce qu’il faut pour gérer votre dépôt. Rien de superflu.',
    featuresText:
      'GeStock a été conçu par des experts du secteur boissons en Afrique. Chaque fonctionnalité répond à un vrai besoin terrain.',
    demoTitle: 'Voyez GeStock en action',
    demoText:
      'Découvrez comment les gérants de dépôts au Cameroun et en Afrique simplifient leur gestion quotidienne, de la réception fournisseur à la livraison client.',
    demoButton: 'Regarder la démo complète',
    advantagesTitle: 'Pourquoi les meilleurs dépôts choisissent GeStock',
    pricingTitle: 'Un prix juste. Des fonctionnalités complètes.',
    pricingText: 'Pas de frais cachés. Pas de mauvaise surprise. Changez de plan à tout moment.',
    monthly: 'Mensuel',
    annual: 'Annuel',
    save: 'Économisez 17%',
    testimonialsTitle: 'Ce que les gérants de dépôts disent de GeStock',
    faqTitle: 'Questions fréquentes',
    integrationsTitle: 'Connecté à vos outils du quotidien',
    integrationsText:
      'GeStock s’intègre nativement avec les solutions de paiement Mobile Money et les outils de communication utilisés en Afrique.',
    ctaTitle: 'Votre dépôt mérite un meilleur logiciel.',
    ctaText:
      'Rejoignez les 5 000 gérants de dépôts qui ont choisi GeStock pour simplifier leur gestion et augmenter leurs profits.',
    ctaDemo: 'Réserver une démo gratuite',
    footerTagline: 'La gestion intelligente de votre dépôt de boissons.',
    footerBottom: '2026 GeStock. Développé au Cameroun. Conçu pour l’Afrique.',
  },
  en: {
    announce: 'GeStock launches multi-depot management. Try free for 30 days.',
    nav: ['Product', 'Features', 'Pricing', 'About', 'Blog'],
    login: 'Log in',
    trial: 'Start free',
    badge: 'SaaS platform for beverage depots in Africa',
    title: 'Manage your beverage depot like the best.',
    subtitle:
      'Beer, water, juice and soft drinks inventory. Automatic invoicing. Delivery tracking. Smart reports. Everything your depot needs, in one platform built for Africa.',
    primary: 'Start free',
    secondary: 'Watch demo',
    tertiary: 'See features',
    reassurance: ['No credit card', 'Full access 30 days', 'Cancel anytime', 'French & English support'],
    trust: ['+5,000 depots', '15 African countries', '99.9% uptime', '24/7 support', '4.8/5'],
    problemsTitle: 'Do any of these sound familiar?',
    problemsText:
      'Thousands of depot managers were losing time and money with these daily issues. GeStock solved them.',
    problems: [
      ['Beer crates disappear with no traceability', 'Every crate tracked in real time: in, out, returned'],
      ['Invoices done by hand or on Excel', 'Invoice generated in 30 seconds, sent automatically'],
      ['Stockouts discovered too late', 'Automatic alerts before any stockout'],
      ['No idea which product is most profitable', 'Profitability report per product, per week, per month'],
      ['Deliveries go unmonitored', 'Digital delivery notes and route tracking'],
      ['Multiple depots, no centralized view', 'Single dashboard for all your depots'],
    ],
    featuresTitle: 'Everything you need to run your depot. Nothing unnecessary.',
    featuresText:
      'GeStock was built by beverage industry experts in Africa. Every feature answers a real on-the-ground need.',
    demoTitle: 'See GeStock in action',
    demoText:
      'Discover how depot managers in Cameroon and across Africa simplify daily operations, from supplier receiving to customer delivery.',
    demoButton: 'Watch full demo',
    advantagesTitle: 'Why the best depots choose GeStock',
    pricingTitle: 'Fair pricing. Complete features.',
    pricingText: 'No hidden fees. No surprises. Change your plan at any time.',
    monthly: 'Monthly',
    annual: 'Annual',
    save: 'Save 17%',
    testimonialsTitle: 'What depot managers say about GeStock',
    faqTitle: 'Frequently asked questions',
    integrationsTitle: 'Connected to your everyday tools',
    integrationsText:
      'GeStock natively integrates with Mobile Money payment solutions and communication tools used across Africa.',
    ctaTitle: 'Your depot deserves better software.',
    ctaText:
      'Join 5,000 depot managers who chose GeStock to simplify their management and grow their profits.',
    ctaDemo: 'Book a free demo',
    footerTagline: 'The smart management platform for your beverage depot.',
    footerBottom: '2026 GeStock. Built in Cameroon. Designed for Africa.',
  },
};

const modules = [
  {
    key: 'stock',
    icon: Boxes,
    fr: ['Stock', 'Votre stock boissons, toujours sous contrôle', 'Suivez chaque bouteille, casier, carton et palette en temps réel.', ['Gestion bière, eau, jus, soda, vin, alcool fort', 'Unités : bouteille, casier, carton, palette', 'Multi-entrepôts et multi-dépôts', 'Alertes de rupture paramétrables', 'Suivi des dates de péremption par lot']],
    en: ['Stock', 'Your beverage stock, always under control', 'Track every bottle, crate, carton and pallet in real time.', ['Beer, water, juice, soda, wine, spirits', 'Units: bottle, crate, carton, pallet', 'Multi-warehouse and multi-depot support', 'Configurable stockout alerts', 'Expiry date tracking per batch']],
  },
  {
    key: 'sales',
    icon: ReceiptText,
    fr: ['Ventes', 'Vendez plus vite, encaissez mieux', 'Devis, factures, reçus et gestion des créances, tout automatisé.', ['Ventes en gros et au détail', 'Facturation en 30 secondes avec votre logo', 'Créances et relances automatiques', 'Historique complet par client', 'Caisse intégrée']],
    en: ['Sales', 'Sell faster, collect better', 'Quotes, invoices, receipts and debt management, all automated.', ['Wholesale and retail sales', 'Invoicing in 30 seconds with your logo', 'Debt management and reminders', 'Full history per customer', 'Integrated POS']],
  },
  {
    key: 'deliveries',
    icon: Truck,
    fr: ['Livraisons', 'Chaque livraison, sous votre contrôle', 'Gérez vos chauffeurs, vos tournées et les retours de bouteilles depuis votre téléphone.', ['Bons de sortie par tournée', 'Gestion des chauffeurs-livreurs', 'Suivi des retours de bouteilles vides', 'Confirmation de livraison numérique']],
    en: ['Deliveries', 'Every delivery, under your control', 'Manage drivers, routes and bottle returns from your phone.', ['Outflow receipts per delivery run', 'Delivery driver management', 'Empty bottle return tracking', 'Digital delivery confirmation']],
  },
  {
    key: 'purchases',
    icon: PackageCheck,
    fr: ['Achats', 'Achetez mieux, négociez plus fort', 'Centralisez vos commandes fournisseurs, suivez vos dépenses et comparez vos prix.', ['Gestion des fournisseurs', 'Bons de commande fournisseurs', 'Livraisons entrantes', 'Historique des prix d’achat', 'Comparaison des marges']],
    en: ['Purchases', 'Buy smarter, negotiate stronger', 'Centralize supplier orders, track expenses and compare purchase prices.', ['Supplier management', 'Supplier purchase orders', 'Incoming delivery tracking', 'Purchase price history', 'Margin comparison']],
  },
  {
    key: 'accounting',
    icon: Calculator,
    fr: ['Comptabilité', 'Vos finances, claires comme de l’eau', 'Revenus, dépenses, trésorerie et rapports financiers avec TVA intégrée.', ['Revenus et dépenses', 'Trésorerie quotidienne', 'Rapports mensuels et annuels', 'Export expert-comptable', 'TVA 19,25% intégrée']],
    en: ['Accounting', 'Your finances, crystal clear', 'Revenue, expenses, cash flow and financial reports with VAT support.', ['Revenue and expenses', 'Daily cash flow', 'Monthly and annual reports', 'Accountant export', '19.25% VAT built in']],
  },
  {
    key: 'reports',
    icon: BarChart3,
    fr: ['Rapports', 'Les bonnes décisions avec les bonnes données', 'Graphiques interactifs, classements produits, prévisions de stock et exports.', ['Produits les plus rentables', 'Évolution des ventes', 'Prévisions de stock', 'Rapport par dépôt, livreur, client', 'Export Excel / PDF']],
    en: ['Reports', 'Right decisions with the right data', 'Interactive charts, product rankings, stock forecasts and exports.', ['Most profitable products', 'Sales evolution', 'Stock forecasts', 'Reports by depot, driver, customer', 'Excel / PDF export']],
  },
];

const advantages = [
  [Beer, 'Spécialisé boissons', 'Conçu pour les casiers, palettes, lots et péremptions.', 'Beverage-specific', 'Built for crates, pallets, batches and expiry.'],
  [Globe2, 'Fait pour l’Afrique', 'Interface bilingue. Mobile Money intégré. Connexion faible supportée.', 'Built for Africa', 'Bilingual interface. Mobile Money integrated. Low connectivity support.'],
  [Smartphone, '100% Mobile', 'Gérez votre dépôt depuis votre smartphone Android.', '100% Mobile', 'Manage your depot from your Android smartphone.'],
  [Clock3, 'Opérationnel en 1 heure', 'Pas de technicien. Pas de formation longue.', 'Live in 1 hour', 'No technician. No long training.'],
  [ShieldCheck, 'Données sécurisées', 'Sauvegarde automatique quotidienne et permissions par rôle.', 'Secure data', 'Automatic daily backup and role-based permissions.'],
  [Headphones, 'Support local', 'Une équipe basée au Cameroun, en français et anglais.', 'Local support', 'A team based in Cameroon, in French and English.'],
];

const plans = [
  {
    name: 'Free',
    popular: false,
    monthly: '0 FCFA',
    annual: '0 FCFA',
    fr: ['Découvrir GeStock sans risque', 'Accès complet pendant 30 jours. Aucune carte bancaire requise.', 'Commencer gratuitement', ['Toutes les fonctionnalités', '1 dépôt', 'Jusqu’à 3 utilisateurs', 'Stock, ventes, achats, livraisons', 'Support par email']],
    en: ['Discover GeStock risk-free', 'Full access for 30 days. No credit card required.', 'Start for free', ['All features', '1 depot', 'Up to 3 users', 'Inventory, sales, purchases, deliveries', 'Email support']],
  },
  {
    name: 'Solo',
    popular: false,
    monthly: '20 000 FCFA',
    annual: '199 200 FCFA',
    fr: ['Indépendants et petits dépôts', 'Toutes les fonctionnalités pour gérer un seul dépôt de façon professionnelle.', 'Choisir Solo', ['1 dépôt', 'Utilisateurs illimités', 'Toutes les fonctionnalités', 'Application mobile', 'Support 24/7']],
    en: ['Independents and small depots', 'All features to run a single depot professionally.', 'Choose Solo', ['1 depot', 'Unlimited users', 'All features', 'Mobile app', '24/7 support']],
  },
  {
    name: 'PME',
    popular: true,
    monthly: '50 000 FCFA',
    annual: '498 000 FCFA',
    fr: ['Entreprises avec plusieurs points de dépôt', 'Gérez de 1 à 10 dépôts depuis un seul tableau de bord.', 'Choisir PME', ['1 à 10 dépôts', 'Dashboard centralisé', 'Transferts inter-dépôts', 'Analytics avancées', 'Support prioritaire']],
    en: ['Businesses with multiple depot locations', 'Manage 1 to 10 depots from one dashboard.', 'Choose SME', ['1 to 10 depots', 'Central dashboard', 'Inter-depot transfers', 'Advanced analytics', 'Priority support']],
  },
  {
    name: 'Entreprise',
    popular: false,
    monthly: '300 000 FCFA',
    annual: '2 988 000 FCFA',
    fr: ['Grands groupes et distributeurs régionaux', '20 dépôts et plus. API complète, intégrations sur mesure, accompagnement dédié.', 'Nous contacter', ['Dépôts illimités', 'API & Webhooks', 'Intégrations ERP', 'Account Manager dédié', 'SLA 99.9%']],
    en: ['Large groups and regional distributors', '20 depots and more. Full API, custom integrations, dedicated support.', 'Contact us', ['Unlimited depots', 'API & Webhooks', 'ERP integrations', 'Dedicated Account Manager', '99.9% SLA']],
  },
];

const testimonials = [
  ['Jean-Paul Mbarga', 'Dépôt Central Boissons', 'Douala, Cameroun', 'Les pertes ont baissé de 70% en deux mois.', 'Losses dropped by 70% in two months.'],
  ['Aminata Koné', 'Dépôt Fraîcheur Plus', 'Abidjan, Côte d’Ivoire', 'Mes clients reçoivent leur facture par WhatsApp en 30 secondes.', 'My customers get their invoice on WhatsApp in 30 seconds.'],
  ['Ibrahim Diallo', 'Groupe Boissons Sahel', 'Dakar, Sénégal', 'Je regarde mes 4 dépôts en 5 minutes chaque matin.', 'I check my 4 depots in 5 minutes every morning.'],
  ['Marie-Claire Nkoa', 'Superstock Eaux', 'Yaoundé, Cameroun', 'Les alertes de péremption nous ont sauvé des millions.', 'Expiry alerts have saved us millions.'],
  ['Rodrigue Eto’o', 'Dépôt Brasseries Nord', 'Bafoussam, Cameroun', 'Chaque sortie de casier est enregistrée et chaque retour est tracé.', 'Every crate outflow is recorded and every return is tracked.'],
  ['Carine Mfoumou', 'Distributeur Punch', 'Libreville, Gabon', 'GeStock parle notre langue et comprend nos besoins.', 'GeStock speaks our language and understands our needs.'],
];

const faqs = {
  fr: [
    ['GeStock fonctionne-t-il sans connexion internet ?', 'GeStock nécessite internet pour fonctionner pleinement, avec certaines fonctions basiques disponibles hors-ligne puis synchronisées.'],
    ['Puis-je gérer plusieurs dépôts depuis un seul compte ?', 'Oui. Le plan PME gère jusqu’à 10 dépôts et le plan Entreprise offre des dépôts illimités.'],
    ['Comment gérer les retours de bouteilles vides ?', 'Chaque retour est enregistré, lié à la livraison d’origine et déduit automatiquement de votre stock de consignes.'],
    ['Y a-t-il une application mobile ?', 'Oui. GeStock est disponible sur Android pour gérants, livreurs, caissiers et magasiniers.'],
    ['Comment migrer depuis Excel ?', 'Notre équipe importe vos produits, clients, fournisseurs et stocks depuis Excel ou CSV, généralement en moins de 24 heures.'],
    ['L’essai gratuit inclut-il toutes les fonctionnalités ?', 'Oui. Les 30 jours d’essai donnent accès à 100% des fonctionnalités, sans carte bancaire.'],
  ],
  en: [
    ['Does GeStock work without internet?', 'GeStock needs internet for full use, with some basic offline functions that sync when connection returns.'],
    ['Can I manage multiple depots from one account?', 'Yes. The SME plan manages up to 10 depots, and Enterprise supports unlimited depots.'],
    ['How do I manage empty bottle returns?', 'Each return is recorded, linked to the original delivery and deducted from deposit inventory automatically.'],
    ['Is there a mobile app?', 'Yes. GeStock is available on Android for managers, drivers, cashiers and storekeepers.'],
    ['How do I migrate from Excel?', 'Our team imports products, customers, suppliers and opening stock from Excel or CSV, typically in under 24 hours.'],
    ['Does the free trial include all features?', 'Yes. The 30-day trial includes 100% of GeStock features, with no credit card required.'],
  ],
};

const footer = {
  fr: [
    ['PRODUIT', [
      ['Fonctionnalités', '/features'],
      ['Tarifs', '/pricing'],
      ['Application mobile', '/app-mobile'],
      ['Sécurité', '/securite'],
    ]],
    ['SOLUTIONS', [
      ['Grossistes & Dépôts', '/solutions/grossistes'],
      ['Gestion des Consignes', '/solutions/consignes'],
      ['Suivi des Tournées', '/solutions/tournees'],
      ['Rapports & Statistiques', '/solutions/rapports'],
    ]],
    ['RESSOURCES', [
      ['Documentation API', '/api-docs'],
      ['Centre d\'aide', '/aide'],
      ['Blog', '/blog'],
    ]],
    ['ENTREPRISE', [
      ['À propos', '/about'],
      ['Contact', '/contact'],
      ['Carrières', '/careers'],
    ]],
  ],
  en: [
    ['PRODUCT', [
      ['Features', '/features'],
      ['Pricing', '/pricing'],
      ['Mobile app', '/app-mobile'],
      ['Security', '/securite'],
    ]],
    ['SOLUTIONS', [
      ['Wholesalers & Depots', '/solutions/grossistes'],
      ['Consignment Mgmt', '/solutions/consignes'],
      ['Route Tracking', '/solutions/tournees'],
      ['Reports & Analytics', '/solutions/rapports'],
    ]],
    ['RESOURCES', [
      ['API Documentation', '/api-docs'],
      ['Help center', '/aide'],
      ['Blog', '/blog'],
    ]],
    ['COMPANY', [
      ['About us', '/about'],
      ['Contact', '/contact'],
      ['Careers', '/careers'],
    ]],
  ],
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('fr');
  const [moduleKey, setModuleKey] = useState('stock');
  const [annual, setAnnual] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [activeTool, setActiveTool] = useState(null);

  const handleToolClick = (tool) => {
    if (tool === 'API') {
      navigate('/api-docs');
    } else if (['Orange Money', 'MTN MoMo', 'Wave', 'Airtel Money'].includes(tool)) {
      setActiveTool('money');
    } else if (['WhatsApp Business', 'SMS', 'Email'].includes(tool)) {
      setActiveTool('comm');
    } else if (tool === 'Telegram') {
      setActiveTool('telegram');
    } else if (['Excel / CSV', 'PDF', 'Google Sheets'].includes(tool)) {
      setActiveTool('exports');
    }
  };
  const t = copy[lang];
  const isFr = lang === 'fr';
  const activeModule = modules.find((item) => item.key === moduleKey) ?? modules[0];

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
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

    const nav = document.querySelector('.site-nav');
    const onScroll = () => nav?.classList.toggle('is-scrolled', window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      revealObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const navLinks = useMemo(
    () => [
      ['#product', t.nav[0]],
      ['#features', t.nav[1]],
      ['#pricing', t.nav[2]],
      ['#about', t.nav[3]],
      ['#blog', t.nav[4]],
    ],
    [t.nav],
  );

  const go = (href) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="gestock-site">
      <div className="grain" aria-hidden="true" />
      <div className="announcement">
        <span className="live-dot" aria-hidden="true" />
        {t.announce}
      </div>

      <nav className="site-nav" aria-label="Navigation principale">
        <a className="brand" href="#top" onClick={(event) => { event.preventDefault(); go('#top'); }}>
          <span className="brand-mark"><Warehouse size={20} /></span>
          <span>GeStock</span>
        </a>

        <div className="nav-links">
          {navLinks.map(([href, label]) => (
            <button key={href} type="button" onClick={() => go(href)}>{label}</button>
          ))}
        </div>

        <div className="nav-actions">
          <div className="language-toggle" aria-label="Choix de langue">
            <button type="button" className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
            <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
          <button className="btn btn-ghost desktop-only" type="button" onClick={() => navigate('/login')}>{t.login}</button>
          <button className="btn btn-primary desktop-only" type="button" onClick={() => navigate('/register')}>{t.trial}</button>
          <button className="icon-button mobile-only" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(([href, label]) => (
            <button key={href} type="button" onClick={() => go(href)}>{label}</button>
          ))}
          <button type="button" onClick={() => navigate('/login')}>{t.login}</button>
          <button type="button" className="mobile-cta" onClick={() => navigate('/register')}>{t.trial}</button>
        </div>
      )}

      <main id="top">
        <section className="hero hero-glow bg-grid">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="hero-badge"><BadgeCheck size={16} /> {t.badge}</div>
              <h1 className="hero-title">{t.title}</h1>
              <p className="hero-subtitle">{t.subtitle}</p>
              <div className="hero-cta-group">
                <button className="btn btn-primary btn-lg" type="button" onClick={() => navigate('/register')}>{t.primary}<ArrowRight size={18} /></button>
                <button className="btn btn-secondary btn-lg" type="button" onClick={() => go('#demo')}><Play size={18} />{t.secondary}</button>
                <button className="btn-text" type="button" onClick={() => go('#features')}>{t.tertiary}<ArrowRight size={16} /></button>
              </div>
              <div className="hero-reassurance">
                {t.reassurance.map((item) => <span key={item}><Check size={14} />{item}</span>)}
              </div>
            </div>
            <DashboardMockup lang={lang} />
          </div>
        </section>

        <section className="trust-band" data-reveal>
          <div className="container trust-row">
            {t.trust.map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        <section id="product" className="section">
          <div className="container">
            <SectionHeading title={t.problemsTitle} text={t.problemsText} />
            <div className="problem-grid">
              <div className="panel danger-panel" data-reveal>
                <h3>{isFr ? 'Avant GeStock' : 'Before GeStock'}</h3>
                {t.problems.map(([bad]) => <ProblemItem key={bad} bad text={bad} />)}
              </div>
              <div className="panel success-panel" data-reveal>
                <h3>{isFr ? 'Avec GeStock' : 'With GeStock'}</h3>
                {t.problems.map(([, good]) => <ProblemItem key={good} text={good} />)}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section section-alt">
          <div className="container">
            <SectionHeading title={t.featuresTitle} text={t.featuresText} />
            <div className="module-shell" data-reveal>
              <div className="module-tabs" role="tablist" aria-label="Modules GeStock">
                {modules.map((item) => {
                  const Icon = item.icon;
                  const label = item[lang][0];
                  return (
                    <button key={item.key} type="button" className={moduleKey === item.key ? 'active' : ''} onClick={() => setModuleKey(item.key)}>
                      <Icon size={18} /> {label}
                    </button>
                  );
                })}
              </div>
              <div className="module-panel active">
                <div>
                  <span className="eyebrow">{activeModule[lang][0]}</span>
                  <h3>{activeModule[lang][1]}</h3>
                  <p>{activeModule[lang][2]}</p>
                </div>
                <ul className="check-list">
                  {activeModule[lang][3].map((item) => <li key={item}><Check size={16} />{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="section">
          <div className="container demo-grid">
            <div data-reveal="left">
              <SectionHeading align="left" title={t.demoTitle} text={t.demoText} />
              <button className="btn btn-primary btn-lg" type="button" onClick={() => navigate('/register')}>
                <Play size={18} /> {t.demoButton}
              </button>
            </div>
            <div className="demo-card" data-reveal="right">
              <div className="demo-top">
                <span>{isFr ? 'Démonstration produit' : 'Product demo'}</span>
                <span>03:00</span>
              </div>
              <div className="demo-screen">
                <div className="play-ring"><Play size={28} fill="currentColor" /></div>
                <strong>{isFr ? 'Réception → Facture → Livraison → Rapport' : 'Receiving → Invoice → Delivery → Report'}</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="section section-dark">
          <div className="container">
            <SectionHeading light title={t.advantagesTitle} />
            <div className="card-grid">
              {advantages.map(([Icon, frTitle, frText, enTitle, enText]) => (
                <article className="card feature-card" key={frTitle} data-reveal>
                  <span className="feature-icon"><Icon size={22} /></span>
                  <h3>{isFr ? frTitle : enTitle}</h3>
                  <p>{isFr ? frText : enText}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="section">
          <div className="container">
            <SectionHeading title={t.pricingTitle} text={t.pricingText} />
            <div className="pricing-toggle" data-reveal>
              <button type="button" className={!annual ? 'active' : ''} onClick={() => setAnnual(false)}>{t.monthly}</button>
              <button type="button" className={annual ? 'active' : ''} onClick={() => setAnnual(true)}>{t.annual}</button>
              <span>{t.save}</span>
            </div>
            <div className="pricing-grid">
              {plans.map((plan) => (
                <article className={`pricing-card ${plan.popular ? 'card-premium' : ''}`} key={plan.name} data-reveal>
                  {plan.popular && <span className="popular">{isFr ? 'Le plus populaire' : 'Most popular'}</span>}
                  <h3>{plan.name}</h3>
                  <p className="plan-for">{plan[lang][0]}</p>
                  <p className="plan-desc">{plan[lang][1]}</p>
                  <div className="price-amount">{annual ? plan.annual : plan.monthly}<small>/{annual ? (isFr ? 'an' : 'year') : (isFr ? 'mois' : 'mo')}</small></div>
                  <button className={plan.popular ? 'btn btn-primary btn-full' : 'btn btn-secondary btn-full'} type="button" onClick={() => navigate(plan.name === 'Entreprise' ? '/contact' : '/register')}>{plan[lang][2]}</button>
                  <ul className="check-list">
                    {plan[lang][3].map((item) => <li key={item}><Check size={16} />{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="container">
            <SectionHeading title={t.testimonialsTitle} />
            <div className="testimonial-grid">
              {testimonials.map(([name, company, city, frQuote, enQuote]) => (
                <article className="testimonial-card" key={name} data-reveal>
                  <p>“{isFr ? frQuote : enQuote}”</p>
                  <div>
                    <strong>{name}</strong>
                    <span>{company} · {city}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container narrow">
            <SectionHeading title={t.faqTitle} />
            <div className="faq-list">
              {faqs[lang].map(([question, answer], index) => (
                <article className={`faq-item ${openFaq === index ? 'open' : ''}`} key={question} data-reveal>
                  <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                    <span>{question}</span><ChevronDown size={18} />
                  </button>
                  <div className="faq-answer"><p>{answer}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="blog" className="section section-dark">
          <div className="container">
            <SectionHeading light title={t.integrationsTitle} text={t.integrationsText} />
            <div className="integration-grid">
              {[
                [Banknote, 'Mobile Money', ['Orange Money', 'MTN MoMo', 'Wave', 'Airtel Money']],
                [MessageCircle, 'Communication', ['WhatsApp Business', 'SMS', 'Email', 'Telegram']],
                [FileText, 'Exports', ['Excel / CSV', 'PDF', 'Google Sheets', 'API']],
              ].map(([Icon, title, items]) => (
                <article className="integration-card" key={title} data-reveal>
                  <Icon size={24} />
                  <h3>{title}</h3>
                  <div>{items.map((item) => (
                    <span 
                      key={item} 
                      onClick={() => handleToolClick(item)}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease', display: 'inline-block' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.filter = 'brightness(1.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                    >
                      {item}
                    </span>
                  ))}</div>
                </article>
              ))}
            </div>

            {activeTool && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(10px)' }} onClick={() => setActiveTool(null)}>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 24, padding: 40, maxWidth: 500, width: '100%', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', animation: 'fadeUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setActiveTool(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                    <X size={20} />
                  </button>
                  
                  {activeTool === 'money' && (
                    <>
                      <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', borderRadius: 100, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Paiements Mobile Money Automatisés</div>
                      <p style={{ fontSize: 16, color: '#e2e8f0', lineHeight: 1.7, margin: 0 }}>
                        GeStock intègre nativement les paiements par <strong style={{ color: '#fbbf24' }}>Orange Money</strong> et <strong style={{ color: '#fbbf24' }}>MTN MoMo</strong>. Vos clients (bars, détaillants) peuvent régler leurs factures ou leurs consignes directement depuis leur téléphone. Dès que le transfert est validé, votre stock et votre caisse sont mis à jour instantanément, sans aucune saisie manuelle.
                      </p>
                    </>
                  )}
                  {activeTool === 'comm' && (
                    <>
                      <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(37,211,102,0.15)', color: '#25d366', borderRadius: 100, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Suivi client par message</div>
                      <p style={{ fontSize: 16, color: '#e2e8f0', lineHeight: 1.7, margin: 0 }}>
                        <strong style={{ color: '#25d366' }}>Notification automatique des clients.</strong> Envoyez les reçus de vente, les états des dettes de verre (consignes) ou les alertes de livraison directement sur le WhatsApp ou par SMS de vos clients en un clic.
                      </p>
                    </>
                  )}
                  {activeTool === 'telegram' && (
                    <>
                      <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderRadius: 100, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Alertes gérant Telegram</div>
                      <p style={{ fontSize: 16, color: '#e2e8f0', lineHeight: 1.7, margin: 0 }}>
                        <strong style={{ color: '#38bdf8' }}>Alertes gérant.</strong> Recevez un rapport quotidien automatique de fin de session de caisse directement dans votre groupe Telegram privé pour suivre votre dépôt à distance.
                      </p>
                    </>
                  )}
                  {activeTool === 'exports' && (
                    <>
                      <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: 100, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Exports & Rapports comptables</div>
                      <p style={{ fontSize: 16, color: '#e2e8f0', lineHeight: 1.7, margin: 0 }}>
                        Exportez vos fiches de stocks, vos inventaires Brasseries, vos bilans de tournées de livraison et vos historiques de mouvements de caisse en un clic pour votre comptabilité.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="final-cta">
          <div className="container" data-reveal>
            <h2>{t.ctaTitle}</h2>
            <p>{t.ctaText}</p>
            <div>
              <button className="btn btn-primary btn-lg" type="button" onClick={() => navigate('/register')}>{t.primary}<ArrowRight size={18} /></button>
              <button className="btn btn-secondary btn-lg" type="button" onClick={() => navigate('/contact')}>{t.ctaDemo}</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="footer-brand"><Warehouse size={22} /> GeStock</div>
            <p>{t.footerTagline}</p>
            <div className="socials">
              <a href="https://wa.me/237600000000" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a href="https://facebook.com/gestock" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://linkedin.com/company/gestock" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://youtube.com/@gestock" target="_blank" rel="noopener noreferrer">YouTube</a>
            </div>
          </div>
          {footer[lang].map(([title, links]) => (
            <div key={title}>
              <h3>{title}</h3>
              {links.map(([label, route]) => (
                <button
                  key={label}
                  type="button"
                  className="footer-link"
                  onClick={() => navigate(route)}
                >
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="container footer-bottom">
          <span>{t.footerBottom}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700, color: '#a5b4fc' }}>🇫🇷 Français</span>
            <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>FCFA (XAF)</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

function DashboardMockup({ lang }) {
  const rows = lang === 'fr'
    ? [['Castel Beer', '1 240 casiers', '+200 reçus'], ['Supermont 1.5L', '86 packs', 'Alerte rupture'], ['Coca-Cola 30cl', '520 casiers', 'Sortie client'], ['Jus Top', '310 cartons', 'Marge 24%']]
    : [['Castel Beer', '1,240 crates', '+200 received'], ['Supermont 1.5L', '86 packs', 'Low stock alert'], ['Coca-Cola 30cl', '520 crates', 'Customer outflow'], ['Top Juice', '310 cartons', '24% margin']];

  return (
    <div className="hero-mockup" data-reveal="scale">
      <div className="mockup-chrome">
        <span /><span /><span />
        <strong>GeStock OS</strong>
      </div>
      <div className="mockup-inner">
        <div className="mockup-header">
          <div>
            <span>{lang === 'fr' ? 'Dépôt Bonabéri' : 'Bonaberi depot'}</span>
            <strong>{lang === 'fr' ? 'Tableau de bord' : 'Dashboard'}</strong>
          </div>
          <span className="status-pill"><span className="live-dot" /> Live</span>
        </div>
        <div className="metrics">
          <Metric icon={Banknote} label={lang === 'fr' ? 'Ventes jour' : 'Daily sales'} value="2.84M" />
          <Metric icon={Boxes} label={lang === 'fr' ? 'Stock critique' : 'Critical stock'} value="7" />
          <Metric icon={Truck} label={lang === 'fr' ? 'Livraisons' : 'Deliveries'} value="18" />
        </div>
        <div className="chart-card">
          <div className="bars">{[45, 70, 55, 88, 62, 92, 76].map((height) => <span key={height} style={{ height: `${height}%` }} />)}</div>
        </div>
        <div className="stock-list">
          {rows.map(([name, qty, status]) => (
            <div key={name}>
              <strong>{name}</strong><span>{qty}</span><em>{status}</em>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionHeading({ title, text, align = 'center', light = false }) {
  return (
    <div className={`section-heading ${align === 'left' ? 'align-left' : ''} ${light ? 'light' : ''}`}>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function ProblemItem({ text, bad = false }) {
  return (
    <div className="problem-item">
      {bad ? <LockKeyhole size={17} /> : <Check size={17} />}
      <span>{text}</span>
    </div>
  );
}
