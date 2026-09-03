import { lazy, Suspense, useState } from 'react';
import { Route, Routes, Navigate, Outlet, useNavigate } from 'react-router-dom';
import DashboardRedirect from '../../components/DashboardRedirect';
import { useAuth } from '../../contexts/AuthContext';
import { useDepot, DepotProvider } from '../../contexts/DepotContext';
import DynamicSidebar from '../../components/DynamicSidebar';
import NotificationBell from '../../core/notifications/NotificationBell';
import NotificationToast from '../../core/notifications/NotificationToast';
import GeStockChatbot from '../../components/chatbot/GeStockChatbot';
import SupportWidget from '../../components/SupportWidget';
import PermissionGate from '../../shared/permissions/PermissionGate';

const DashboardSupermarche = lazy(() => import('./pages/DashboardSupermarche'));
const POSCaissePage         = lazy(() => import('./pages/POSCaissePage'));
const StockPage             = lazy(() => import('./pages/StockPage'));
const RayonsPage            = lazy(() => import('./pages/RayonsPage'));
const PromotionsPage        = lazy(() => import('./pages/PromotionsPage'));
const ClientsPage           = lazy(() => import('./pages/ClientsPage'));
const FournisseursPage      = lazy(() => import('./pages/FournisseursPage'));
const ReceptionsPage        = lazy(() => import('./pages/ReceptionsPage'));
const InventairePage        = lazy(() => import('../../shared/pages/InventaireProductionPage'));
const DepensesPage          = lazy(() => import('./pages/DepensesPage'));
const RapportsPage          = lazy(() => import('./pages/RapportsPage'));
const ParametresPage        = lazy(() => import('./pages/ParametresPage'));
const UtilisateursPage      = lazy(() => import('../../components/admin/UtilisateursPage'));
const DepotsPage            = lazy(() => import('../../components/admin/DepotsPage'));
const AbonnementPage        = lazy(() => import('../../components/admin/AbonnementPage'));
const AuditPage             = lazy(() => import('../../pages/AuditPage'));
const ProfilPage            = lazy(() => import('../../pages/ProfilPage'));

function Loader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function gate(sousModule, Page) {
  return (
    <PermissionGate sousModule={sousModule}>
      <Page />
    </PermissionGate>
  );
}

function MetierGuard({ children }) {
  const { metier } = useAuth();
  const stored = localStorage.getItem('gestock_metier');
  if (metier && metier !== 'SUPERMARCHE') return <Navigate to="/onboarding/metier" replace />;
  if (!metier && stored && stored !== 'SUPERMARCHE') return <Navigate to="/onboarding/metier" replace />;
  return children;
}

function SupermarcheLayout() {
  const { user, logout } = useAuth();
  const { depots, depotActif, changerDepot } = useDepot();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-sans text-slate-100">
      <NotificationToast />
      <div className="hidden lg:flex shrink-0"><DynamicSidebar user={user} tenant={user?.tenant} onLogout={handleLogout} /></div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-40">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="text-white font-black text-lg">GeStock</span>
          </div>
          <div className="flex-1 flex justify-end items-center gap-6">
            <NotificationBell />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end"><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Dépôt Actif</span><span className="text-amber-400 font-bold text-sm leading-none mt-1">{depotActif?.nom || 'Global'}</span></div>
              <div className="relative group">
                <select value={depotActif?.id || ''} onChange={(e) => { const depot = depots.find((s) => s.id === e.target.value); if (depot) changerDepot(depot); }} className="appearance-none bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-white text-xs font-bold rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer shadow-lg shadow-black/20">
                  {depots.length === 0 && <option value="">Aucun dépôt disponible</option>}
                  {depots.map((s) => <option key={s.id} value={s.id}>📍 {s.nom}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-amber-400 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-2xl border border-slate-700 shadow-inner"><div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">{user?.email?.[0]?.toUpperCase()}</div><div className="hidden md:flex flex-col"><span className="text-white text-xs font-semibold leading-none">{user?.email}</span><span className="text-amber-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Supermarché</span></div></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto relative custom-scrollbar"><div className="max-w-[1600px] mx-auto min-h-full"><Suspense fallback={<Loader />}><Outlet /></Suspense></div></main>
      </div>
      {sidebarOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} /><div className="absolute left-0 top-0 h-full"><DynamicSidebar user={user} tenant={user?.tenant} onLogout={handleLogout} /></div></div>}
      <GeStockChatbot metier={user?.metier} tenantNom={user?.nomEntreprise} />
      <SupportWidget />
    </div>
  );
}

export default function SupermarcheRoutes() {
  return (
    <MetierGuard>
      <DepotProvider>
        <Routes>
          <Route element={<SupermarcheLayout />}>
            <Route path="dashboard" element={gate('dashboard', DashboardSupermarche)} />
            <Route path="pos" element={gate('pos_caisse', POSCaissePage)} />
            <Route path="stock" element={gate('stock', StockPage)} />
            <Route path="rayons" element={gate('rayons', RayonsPage)} />
            <Route path="promotions" element={gate('promotions', PromotionsPage)} />
            <Route path="clients" element={gate('clients', ClientsPage)} />
            <Route path="fournisseurs" element={gate('fournisseurs', FournisseursPage)} />
            <Route path="receptions" element={gate('receptions', ReceptionsPage)} />
            <Route path="inventaire" element={gate('inventaire', InventairePage)} />
            <Route path="depenses" element={gate('depenses', DepensesPage)} />
            <Route path="rapports" element={gate('rapports', RapportsPage)} />
            <Route path="parametres" element={gate('parametres', ParametresPage)} />
            <Route path="utilisateurs" element={gate('utilisateurs', UtilisateursPage)} />
            <Route path="depots" element={gate('depots', DepotsPage)} />
            <Route path="abonnement" element={<Navigate to="/pricing" replace />} />
            <Route path="audit-patron" element={gate('audit_patron', AuditPage)} />
            <Route path="profil" element={<ProfilPage />} />
            <Route path="*" element={<DashboardRedirect />} />
          </Route>
        </Routes>
      </DepotProvider>
    </MetierGuard>
  );
}
