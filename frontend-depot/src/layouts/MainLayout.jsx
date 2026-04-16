import MaintenancePage from '../pages/MaintenancePage';
import CommissionsPage from '../pages/CommissionsPage';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertesDashboard from '../components/AlertesDashboard';
import StatsCards from '../components/StatsCards';
import StockTable from '../components/StockTable';
import VenteForm from '../components/VenteForm';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
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

const Icons = {
  dashboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  ventes: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  consignes: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
  maintenance: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  commissions: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  stocks: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  clients: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  fournisseurs: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />,
  tournees: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
  caisse: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
  catalogue: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
  dlc: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  audit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />,
  rapports: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v18m-6-6l6 6 8-8" />,
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
  const { sites, siteActif, changerSite } = useSite();
  const navigate = useNavigate();
  const [pageActive, setPageActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paywallError, setPaywallError] = useState(false);
  const { totalAlertes, alertesCritiques } = useAlertes(user?.tenantId, siteActif?.id);

  useEffect(() => {
    const handler = () => setPaywallError(true);
    window.addEventListener('saas-paywall-locked', handler);
    return () => window.removeEventListener('saas-paywall-locked', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const nav = useMemo(() => filterByRole([
    { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER, ROLES.COMMERCIAL, ROLES.COMPTABLE] },
    { id: 'ventes', label: 'Ventes', icon: Icons.ventes, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER, ROLES.COMMERCIAL] },
    {
      id: 'stocks', label: 'Stocks', icon: Icons.stocks,
      badge: totalAlertes, badgeCritique: alertesCritiques > 0,
      roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER],
    },
    { id: 'clients', label: 'Clients', icon: Icons.clients, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.COMMERCIAL, ROLES.COMPTABLE] },
    { id: 'consignes', label: 'Consignes', icon: Icons.consignes, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER] },
    { id: 'maintenance', label: 'Maintenance', icon: Icons.maintenance },
    { id: 'commissions', label: 'Commissions', icon: Icons.commissions },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: Icons.fournisseurs, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER, ROLES.COMPTABLE] },
    { id: 'tournees', label: 'Tournees', icon: Icons.tournees, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER, ROLES.COMMERCIAL] },
    { id: 'caisse', label: 'Caisse', icon: Icons.caisse, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.COMPTABLE] },
    { id: 'catalogue', label: 'Catalogue', icon: Icons.catalogue, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER, ROLES.COMMERCIAL] },
    {
      id: 'dlc', label: 'DLC & Lots', icon: Icons.dlc,
      badge: totalAlertes, badgeCritique: alertesCritiques > 0,
      roles: [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER],
    },
    { id: 'rapports', label: 'Rapports', icon: Icons.rapports, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.COMPTABLE] },
    { id: 'audit', label: 'Audit Patron', icon: Icons.audit, roles: [ROLES.PATRON] },
  ], role), [role, totalAlertes, alertesCritiques]);

  useEffect(() => {
    if (!nav.some((item) => item.id === pageActive)) {
      setPageActive(nav[0]?.id || 'dashboard');
    }
  }, [nav, pageActive]);

  const renderPage = () => {
    switch (pageActive) {
      case 'dashboard':
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-black text-white">Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">
                Vue temps réel - {siteActif?.nom || 'Aucun site sélectionné'}
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
      case 'ventes': return <VentesPage />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'commissions':
        return <CommissionsPage />;
      case 'stocks': return <StocksPage />;
      case 'clients': return <ClientsPage />;
      case 'fournisseurs': return <FournisseursPage />;
      case 'tournees': return <TourneesPage />;
      case 'caisse': return <CaissePage />;
      case 'catalogue': return <CataloguePage />;
      case 'dlc': return <DlcPage />;
      case 'audit': return role === ROLES.PATRON ? <AuditPage /> : <AccessDeniedCard />;
      case 'rapports': return [ROLES.PATRON, ROLES.GERANT, ROLES.COMPTABLE].includes(role) ? <RapportsPage /> : <AccessDeniedCard />;
      default: return null;
    }
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-slate-950 border-r border-slate-800 w-64 shrink-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <span className="text-white font-black text-xl">D</span>
          </div>
          <div>
            <p className="text-white font-black text-sm leading-tight">Depot-SaaS</p>
            <p className="text-slate-500 text-xs">{user?.nomEntreprise || 'Mon Depot'}</p>
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

      <div className="px-4 py-3 border-b border-slate-800 mt-3">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Site actif</p>
        <select
          value={siteActif?.id || ''}
          onChange={(e) => {
            const site = sites.find((s) => s.id === e.target.value);
            if (site) changerSite(site);
          }}
          className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          {sites.length === 0 && <option value="">Aucun site</option>}
          {sites.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
      </div>

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
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">Depot-SaaS</span>
            {totalAlertes > 0 && (
              <span className={`text-white text-xs font-black px-2 py-0.5 rounded-full ${alertesCritiques > 0 ? 'bg-red-500' : 'bg-orange-500'}`}>
                {totalAlertes}
              </span>
            )}
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>

      {paywallError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />
          <div className="relative bg-slate-900 border border-red-500/20 p-10 rounded-3xl shadow-2xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Acces verrouille</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Abonnement expire. Renouvelez pour <strong className="text-white">20 000 FCFA/mois</strong>.
            </p>
            <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-all">
              Renouveler via Orange Money / MTN
            </button>
            <p className="mt-4 text-slate-500 text-xs">Reactivation immediate apres paiement</p>
          </div>
        </div>
      )}
    </div>
  );
}
