import ReceptionsPage from '../pages/ReceptionsPage';
import AvariesPage from '../pages/AvariesPage';
import MaintenancePage from '../pages/MaintenancePage';
import CommissionsPage from '../pages/CommissionsPage';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertesDashboard from '../components/AlertesDashboard';
import StatsCards from '../components/StatsCards';
import StockTable from '../components/StockTable';
import VenteForm from '../components/VenteForm';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import { useAlertes } from '../hooks/useAlertes';
import { filterByRole, ROLES } from '../utils/rbac';
import CaissePage from '../pages/CaissePage';
import CataloguePage from '../pages/CataloguePage';
import ClientsPage from '../pages/ClientsPage';
import ConsignesPage from '../pages/ConsignesPage';
import DlcPage from '../pages/DlcPage';
import FournisseursPage from '../pages/FournisseursPage';
import StocksPage from '../pages/StocksPage';
import TourneesPage from '../pages/TourneesPage';
import VentesPage from '../pages/VentesPage';
import AuditPage from '../pages/AuditPage';
import RapportsPage from '../pages/RapportsPage';
import SettingsPage from '../pages/SettingsPage';
import AnalysesPage from '../pages/AnalysesPage';
import CommandesPage from '../pages/CommandesPage';
import DepotsPage from '../pages/DepotsPage';
import Receipt80mm from '../components/Receipt80mm';

// Import de ton nouveau logo GesTock
import logo from '../assets/1776204959956-01.jpeg';

const Icons = {
  analyses: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  TableauDeBord: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  ventes: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  consignes: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
  maintenance: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  commissions: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  stocks: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  receptions: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
  avaries: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  clients: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  fournisseurs: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />,
  tournees: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
  caisse: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
  catalogue: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
  dlc: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />,
  audit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />,
  commandes: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
  rapports: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v18m-6-6l6 6 8-8" />,
  depots: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
};

function NavItem({ icon, label, active, onClick, badge, badgeCritique }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${active
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
    >
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icon}
      </svg>
      <span className="flex-1 text-left">{label}</span>
      {badge > 0 && (
        <span className={`text-white text-xs font-black px-2 py-0.5 rounded-full shrink-0 ${badgeCritique ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function AccessDeniedCard() {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-8 text-center">
      <h2 className="text-xl font-black text-white">Accès limité</h2>
      <p className="mt-2 text-sm text-amber-200">
        Votre rôle ne permet pas d’ouvrir cette section.
      </p>
    </div>
  );
}

export default function MainLayout() {
  const { user, role, logout } = useAuth();
  const { depots, depotActif, changerDepot } = useDepot();
  const navigate = useNavigate();
  const [pageActive, setPageActive] = useState('TableauDeBord');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paywallError, setPaywallError] = useState(false);
  const { totalAlertes, alertesCritiques, stocksAlertes } = useAlertes(user?.tenantId, depotActif?.id);
  const [lastCritiqueCount, setLastCritiqueCount] = useState(alertesCritiques);

  // Notification sonore lors du passage sous le seuil critique
  useEffect(() => {
    if (alertesCritiques > lastCritiqueCount) {
      // Beep discret via Web Audio API
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime); // Note A5 (plus aigu et distinct)
      
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    }
    setLastCritiqueCount(alertesCritiques);
  }, [alertesCritiques, lastCritiqueCount]);

  useEffect(() => {
    const handler = () => setPaywallError(true);
    window.addEventListener('saas-paywall-locked', handler);
    return () => window.removeEventListener('saas-paywall-locked', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Listener pour navigation interne
  useEffect(() => {
    const handleNav = (e) => {
      if (e.detail) setPageActive(e.detail);
    };
    window.addEventListener('nav-change', handleNav);
    return () => window.removeEventListener('nav-change', handleNav);
  }, []);

  const nav = useMemo(() => filterByRole([
    { id: 'analyses', label: 'Analyses BI', icon: Icons.analyses, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.COMPTABLE] },
    { id: 'TableauDeBord', label: 'TableauDeBord', icon: Icons.TableauDeBord, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER, ROLES.COMMERCIAL, ROLES.COMPTABLE] },
    { id: 'ventes', label: 'Ventes', icon: Icons.ventes, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER, ROLES.COMMERCIAL] },
    {
      id: 'stocks', label: 'Stocks', icon: Icons.stocks,
      badge: totalAlertes, badgeCritique: alertesCritiques > 0,
      roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER],
    },
    { id: 'receptions', label: 'Réceptions', icon: Icons.receptions, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER] },
    { id: 'avaries', label: 'Avaries & Pertes', icon: Icons.avaries, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER] },
    { id: 'commandes', label: 'Commandes', icon: Icons.commandes, roles: [ROLES.PATRON, ROLES.GERANT] },
    { id: 'clients', label: 'Clients', icon: Icons.clients, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.COMMERCIAL, ROLES.COMPTABLE] },
    { id: 'consignes', label: 'Consignes', icon: Icons.consignes, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER] },
    { id: 'maintenance', label: 'Maintenance', icon: Icons.maintenance },
    { id: 'commissions', label: 'Commissions', icon: Icons.commissions },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: Icons.fournisseurs, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER, ROLES.COMPTABLE] },
    { id: 'tournees', label: 'Tournees', icon: Icons.tournees, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER, ROLES.COMMERCIAL] },
    { id: 'caisse', label: 'Caisse', icon: Icons.caisse, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.COMPTABLE] },
    { id: 'catalogue', label: 'Catalogue', icon: Icons.catalogue, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER, ROLES.COMMERCIAL] },
    { id: 'dlc', label: 'DLC & Lots', icon: Icons.dlc, badge: totalAlertes, badgeCritique: alertesCritiques > 0, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER] },
    { id: 'rapports', label: 'Rapports', icon: Icons.rapports, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.COMPTABLE] },
    { id: 'settings', label: 'Paramètres', icon: Icons.settings, roles: [ROLES.PATRON, ROLES.GERANT] },
    { id: 'depots', label: 'Dépôts', icon: Icons.depots, roles: [ROLES.PATRON, ROLES.GERANT] },
    { id: 'audit', label: 'Audit Patron', icon: Icons.audit, roles: [ROLES.PATRON] },
  ], role), [role, totalAlertes, alertesCritiques]);

  useEffect(() => {
    if (!nav.some((item) => item.id === pageActive)) {
      setPageActive(nav[0]?.id || 'TableauDeBord');
    }
  }, [nav, pageActive]);

  const renderPage = () => {
    switch (pageActive) {
      case 'TableauDeBord':
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-black text-white">TableauDeBord</h1>
              <p className="text-slate-400 text-sm mt-1">
                Vue temps réel - {depotActif?.nom || 'Aucun depot sélectionné'}
              </p>
            </div>
            <AlertesDashboard />
            <StatsCards />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
              <div className="lg:col-span-4">
                <div className="sticky top-6"><VenteForm /></div>
              </div>
              <div className="lg:col-span-8"><StockTable /></div>
            </div>
          </div>
        );
      case 'consignes': return <ConsignesPage />;
      case 'analyses': return <AnalysesPage />;
      case 'ventes': return <VentesPage />;
      case 'maintenance': return <MaintenancePage />;
      case 'commissions': return <CommissionsPage />;
      case 'commandes': return <CommandesPage />;
      case 'stocks': return <StocksPage />;
      case 'receptions': return <ReceptionsPage />;
      case 'avaries': return <AvariesPage />;
      case 'clients': return <ClientsPage />;
      case 'fournisseurs': return <FournisseursPage />;
      case 'tournees': return <TourneesPage />;
      case 'caisse': return <CaissePage />;
      case 'catalogue': return <CataloguePage />;
      case 'dlc': return <DlcPage />;
      case 'settings': return <SettingsPage />;
      case 'depots': return [ROLES.PATRON, ROLES.GERANT].includes(role) ? <DepotsPage /> : <AccessDeniedCard />;
      case 'audit': return role === ROLES.PATRON ? <AuditPage /> : <AccessDeniedCard />;
      case 'rapports': return [ROLES.PATRON, ROLES.GERANT, ROLES.COMPTABLE].includes(role) ? <RapportsPage /> : <AccessDeniedCard />;
      default: return null;
    }
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-slate-950 border-r border-slate-800 w-64 shrink-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex flex-col items-center">
          {/* TON LOGO NÉON */}
          <img src={logo} alt="GesTock" className="w-40 h-auto object-contain" />

          {/* TEXTE PERSONNALISÉ EN DESSOUS */}
          <div className="text-center mt-2">
            <h2 className="text-white font-black text-lg tracking-wider">GesTock</h2>
            <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Gestion de stock • Cameroun
            </p>
          </div>
        </div>
      </div>
      {totalAlertes > 0 && (
        <div
          onClick={() => setPageActive('stocks')}
          className={`mx-3 mt-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all hover:opacity-80 ${alertesCritiques > 0
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-orange-500/10 border-orange-500/20'
            }`}
        >
          <div className="flex items-center gap-2">
            <span>{alertesCritiques > 0 ? '🚨' : '⚠️'}</span>
            <div>
              <p className={`text-xs font-black ${alertesCritiques > 0 ? 'text-red-400' : 'text-orange-400'}`}>
                {totalAlertes} alerte{totalAlertes > 1 ? 's' : ''}
              </p>
              <p className="text-slate-600 text-xs">Voir les stocks</p>
            </div>
          </div>
        </div>
      )}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={pageActive === item.id}
            onClick={() => { setPageActive(item.id); setSidebarOpen(false); }}
            badge={item.badge}
            badgeCritique={item.badgeCritique}
          />
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-bold truncate">{user?.email}</p>
            <p className="text-slate-500 text-xs">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{Icons.logout}</svg>
          Deconnexion
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-sans">
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* HEADER BAR AVEC SELECTEUR DE DEPOT */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-40">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-white font-black text-lg">GesTock</span>
          </div>

          <div className="flex-1 flex justify-end items-center gap-6">
            {/* SELECTEUR DE DEPOT DESIGN NÉON */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Dépôt Actif</span>
                <span className="text-indigo-400 font-bold text-sm leading-none mt-1">{depotActif?.nom || 'Global'}</span>
              </div>
              <div className="relative group">
                 <select
                  value={depotActif?.id || ''}
                  onChange={(e) => {
                    const depot = depots.find((s) => s.id === e.target.value);
                    if (depot) changerDepot(depot);
                  }}
                  className="appearance-none bg-slate-800 border border-slate-700 hover:border-indigo-500/50 text-white text-xs font-bold rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-lg shadow-black/20"
                >
                  {depots.length === 0 && <option value="">Aucun dépôt disponible</option>}
                  {depots.map((s) => (
                    <option key={s.id} value={s.id}>
                      📍 {s.nom}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-indigo-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-2xl border border-slate-700 shadow-inner">
               <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                 {user?.email?.[0]?.toUpperCase()}
               </div>
               <span className="text-white text-xs font-semibold hidden md:block">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div key={`${pageActive}-${depotActif?.id || 'global'}`} className="max-w-[1600px] mx-auto min-h-full">
            {renderPage()}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {paywallError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-red-500/30 p-8 rounded-3xl max-w-md text-center shadow-2xl shadow-red-500/10">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-white text-2xl font-black mb-4 uppercase tracking-tight">Accès Verrouillé</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Votre période d'essai ou votre abonnement a expiré. Veuillez contacter l'administrateur pour régulariser votre situation.
            </p>
            <button
               onClick={handleLogout}
               className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest text-sm"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}







