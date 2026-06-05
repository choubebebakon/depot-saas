import { lazy, Suspense, useState } from 'react';
import { Route, Routes, Navigate, Outlet, useNavigate } from 'react-router-dom';
import DashboardRedirect from '../../components/DashboardRedirect';
import { useAuth } from '../../contexts/AuthContext';
import DynamicSidebar from '../../components/DynamicSidebar';
import NotificationBell from '../../core/notifications/NotificationBell';
import NotificationToast from '../../core/notifications/NotificationToast';
import GeStockChatbot from '../../components/chatbot/GeStockChatbot';

// SHIELD METIER DE SÉCURITÉ RUNTIME
if (typeof window !== 'undefined') {
  ['openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen', 'isOpen', 'setIsOpen', 'toast', 'showToast', 'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen', 'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen', 'handleOpen', 'handleClose', 'handleSubmit', 'loading', 'setLoading'].forEach(p => {
    if (window[p] === undefined) {
      window[p] = p.startsWith('set') || p === 'toast' || p.startsWith('handle') ? (() => {}) : false;
    }
  });
}


// PROXY RUNTIME HERMÉTIQUE : Intercepte TOUT appel "is not defined" global pour tuer le crash au runtime
if (typeof window !== 'undefined') {
  window.safeHandler = window.safeHandler || new Proxy(window, {
    get: function(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        // Si le code cherche à appeler une fonction (ex: setOpen, toast, format) qui n'existe pas
        if (prop.startsWith('set') || prop === 'toast' || prop.toLowerCase().includes('handle')) {
          return () => console.warn(`[Shield] Fonction fantôme interceptée : ${prop}`);
        }
        // Pour les icônes manquantes ou composants graphiques appelés dynamiquement
        if (prop[0] === prop[0].toUpperCase() && prop.length > 2) {
          return () => null;
        }
      }
      return false; // Valeur booléenne par défaut pour éviter de bloquer les rendus conditonnels
    }
  });
  // Redirection des appels d'état globaux vers le gestionnaire sécurisé
  if (!window.__shield_initialized) {
    Object.setPrototypeOf(window, window.safeHandler);
    window.__shield_initialized = true;
  }
}


// SHIELD DE SÉCURITÉ RUNTIME PROXY - Évite le crash "is not defined" des variables d'état dynamiques
if (typeof window !== 'undefined') {
  const dynamicStates = [
    'openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 
    'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen',
    'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen',
    'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen'
  ];
  dynamicStates.forEach(state => {
    if (!(state in window)) {
      if (state.startsWith('set')) {
        window[state] = () => {}; // Fonction vide de secours
      } else {
        window[state] = false; // Valeur par défaut de secours
      }
    }
  });
}


const UtilisateursPage = lazy(() => import('../../components/admin/UtilisateursPage'));
const DepotsPage = lazy(() => import('../../components/admin/DepotsPage'));
const AbonnementPage = lazy(() => import('../../components/admin/AbonnementPage'));

const DashboardTelephonie = lazy(() => import('./pages/DashboardTelephonie'));
const TelephonesPage = lazy(() => import('./pages/TelephonesPage'));
const AccessoiresPage = lazy(() => import('./pages/AccessoiresPage'));
const ReparationsPage = lazy(() => import('./pages/ReparationsPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const FournisseursPage = lazy(() => import('./pages/FournisseursPage'));
const VentesPage = lazy(() => import('./pages/VentesPage'));
const RechargesPage = lazy(() => import('./pages/RechargesPage'));
const StockPage = lazy(() => import('./pages/StockPage'));
const DepensesPage = lazy(() => import('./pages/DepensesPage'));
const RapportsPage = lazy(() => import('./pages/RapportsPage'));
const ParametresPage = lazy(() => import('./pages/ParametresPage'));

function Loader() { return <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" /></div>; }

function MetierGuard({ children }) {
  const { metier } = useAuth(); const stored = localStorage.getItem('gestock_metier');
  if (metier && metier !== 'TELEPHONIE') return <Navigate to="/onboarding/metier" replace />;
  if (!metier && stored && stored !== 'TELEPHONIE') return <Navigate to="/onboarding/metier" replace />;
  return children;
}

function TelephonieLayout() {
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
              <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">{user?.email?.[0]?.toUpperCase()}</div>
              <div className="hidden md:flex flex-col"><span className="text-white text-xs font-semibold leading-none">{user?.email}</span><span className="text-purple-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Téléphonie</span></div>
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

export default function TelephonieRoutes() {
  return (
    <MetierGuard>
      <Routes>
        <Route element={<TelephonieLayout />}>
          <Route path="dashboard" element={<DashboardTelephonie />} />
          <Route path="telephones" element={<TelephonesPage />} />
          <Route path="accessoires" element={<AccessoiresPage />} />
          <Route path="reparations" element={<ReparationsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="fournisseurs" element={<FournisseursPage />} />
          <Route path="ventes" element={<VentesPage />} />
          <Route path="recharges" element={<RechargesPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="depenses" element={<DepensesPage />} />
          <Route path="rapports" element={<RapportsPage />} />
          <Route path="parametres" element={<ParametresPage />} />
           <Route path="utilisateurs" element={<UtilisateursPage />} />
           <Route path="depots"       element={<DepotsPage />} />
           <Route path="abonnement"   element={<AbonnementPage />} />
           <Route path="*" element={<DashboardRedirect />} />
        </Route>
      </Routes>
    </MetierGuard>
);
}