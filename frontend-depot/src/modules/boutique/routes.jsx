import { lazy, Suspense, useState } from 'react';
import { Route, Routes, Navigate, Outlet, useNavigate } from 'react-router-dom';
import DashboardRedirect from '../../components/DashboardRedirect';
import { useAuth } from '../../contexts/AuthContext';
import DynamicSidebar from '../../components/DynamicSidebar';
import NotificationBell from '../../core/notifications/NotificationBell';
import NotificationToast from '../../core/notifications/NotificationToast';
import GeStockChatbot from '../../components/chatbot/GeStockChatbot';

const UtilisateursPage = lazy(() => import('../../components/admin/UtilisateursPage'));
const DepotsPage = lazy(() => import('../../components/admin/DepotsPage'));
const AbonnementPage = lazy(() => import('../../components/admin/AbonnementPage'));

const DashboardBoutique = lazy(() => import('./pages/DashboardBoutique'));
const VentesPage        = lazy(() => import('./pages/VentesPage'));
const StockPage         = lazy(() => import('./pages/StockPage'));
const ClientsPage       = lazy(() => import('./pages/ClientsPage'));
const CaissePage        = lazy(() => import('./pages/CaissePage'));
const PromotionsPage    = lazy(() => import('./pages/PromotionsPage'));
const FacturesPage      = lazy(() => import('./pages/FacturesPage'));
const FournisseursPage  = lazy(() => import('./pages/FournisseursPage'));
const DepensesPage      = lazy(() => import('./pages/DepensesPage'));
const RapportsPage      = lazy(() => import('./pages/RapportsPage'));
const PersonnelPage     = lazy(() => import('./pages/PersonnelPage'));
const ParametresPage    = lazy(() => import('./pages/ParametresPage'));

function Loader() { return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>; }

function MetierGuard({ children }) {
  const { metier } = useAuth(); const stored = localStorage.getItem('gestock_metier');
  if (metier && metier !== 'BOUTIQUE') return <Navigate to="/onboarding/metier" replace />;
  if (!metier && stored && stored !== 'BOUTIQUE') return <Navigate to="/onboarding/metier" replace />;
  return children;
}

function BoutiqueLayout() {
  const { user, logout } = useAuth(); const [sidebarOpen, setSidebarOpen] = useState(false); const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-sans text-slate-100">
      <NotificationToast />
      <div className="hidden lg:flex shrink-0"><DynamicSidebar user={user} tenant={user?.tenant} onLogout={handleLogout} /></div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-40">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
            <span className="text-white font-black text-lg">GeStock</span>
          </div>
          <div className="flex-1 flex justify-end items-center gap-6">
            <NotificationBell />
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-2xl border border-slate-700 shadow-inner">
              <div className="w-7 h-7 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">{user?.email?.[0]?.toUpperCase()}</div>
              <div className="hidden md:flex flex-col"><span className="text-white text-xs font-semibold leading-none">{user?.email}</span><span className="text-cyan-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Boutique</span></div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto relative custom-scrollbar"><div className="max-w-[1600px] mx-auto min-h-full"><Suspense fallback={<Loader />}><Outlet /></Suspense></div></main>
      </div>
      {sidebarOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} /><div className="absolute left-0 top-0 h-full"><DynamicSidebar user={user} tenant={user?.tenant} onLogout={handleLogout} /></div></div>}
      <GeStockChatbot metier={user?.metier} tenantNom={user?.nomEntreprise} />
    </div>
  );
}

export default function BoutiqueRoutes() {
  return (
    <MetierGuard>
      <Routes>
        <Route element={<BoutiqueLayout />}>
          <Route path="dashboard"    element={<DashboardBoutique />} />
          <Route path="ventes"       element={<VentesPage />} />
          <Route path="stock"        element={<StockPage />} />
          <Route path="clients"      element={<ClientsPage />} />
          <Route path="caisse"       element={<CaissePage />} />
          <Route path="promotions"   element={<PromotionsPage />} />
          <Route path="factures"     element={<FacturesPage />} />
          <Route path="fournisseurs" element={<FournisseursPage />} />
          <Route path="depenses"     element={<DepensesPage />} />
          <Route path="rapports"     element={<RapportsPage />} />
          <Route path="personnel"    element={<PersonnelPage />} />
          <Route path="parametres"   element={<ParametresPage />} />
           <Route path="utilisateurs" element={<UtilisateursPage />} />
            <Route path="depots"       element={<DepotsPage />} />
            <Route path="abonnement"   element={<AbonnementPage />} />
           <Route path="*"            element={<DashboardRedirect />} />
        </Route>
      </Routes>
    </MetierGuard>
);
}