import { lazy, Suspense, useState } from 'react';
import { Route, Routes, Navigate, Outlet, useNavigate } from 'react-router-dom';
import DashboardRedirect from '../../components/DashboardRedirect';
import { useAuth } from '../../contexts/AuthContext';
import { useDepot, DepotProvider } from '../../contexts/DepotContext';
import DynamicSidebar from '../../components/DynamicSidebar';
import NotificationBell from '../../core/notifications/NotificationBell';
import NotificationToast from '../../core/notifications/NotificationToast';
import PendingSaleAlert from '../../components/PendingSaleAlert';
import GeStockChatbot from '../../components/chatbot/GeStockChatbot';
import SupportWidget from '../../components/SupportWidget';
import PermissionGate from '../../shared/permissions/PermissionGate';

const UtilisateursPage = lazy(() => import('../../components/admin/UtilisateursPage'));
const DepotsPage = lazy(() => import('../../components/admin/DepotsPage'));
const AbonnementPage = lazy(() => import('../../components/admin/AbonnementPage'));
const AuditPage = lazy(() => import('../../pages/AuditPage'));
const ProfilPage = lazy(() => import('../../pages/ProfilPage'));
const DashboardDepot = lazy(() => import('./pages/DashboardDepot'));
const StockArticlesPage = lazy(() => import('./pages/StockArticlesPage'));
const AchatsReceptionsPage = lazy(() => import('./pages/AchatsReceptionsPageV2'));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage'));
const VentesPage = lazy(() => import('./pages/VentesPage'));
const ConsignesPage = lazy(() => import('./pages/ConsignesPage'));
const LivraisonsPage = lazy(() => import('./pages/LivraisonsPage'));
const TourneesPage = lazy(() => import('./pages/TourneesPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const FournisseursPage = lazy(() => import('./pages/FournisseursPage'));
const CaissePage = lazy(() => import('./pages/CaissePage'));
const RapportsPage = lazy(() => import('./pages/RapportsPage'));
const DepensesPage = lazy(() => import('./pages/DepensesPage'));
const ParametresPage = lazy(() => import('./pages/ParametresPage'));
const LotsPage = lazy(() => import('../../shared/pages/LotsPage'));

function Loader() { return <div className="flex items-center justify-center py-32"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" /></div>; }
function gate(sousModule, Page) { return <PermissionGate sousModule={sousModule}><Page /></PermissionGate>; }
function MetierGuard({ children }) { const { metier } = useAuth(); const stored = localStorage.getItem('gestock_metier'); if (metier && metier !== 'DEPOT_BOISSONS') return <Navigate to="/onboarding/metier" replace />; if (!metier && stored && stored !== 'DEPOT_BOISSONS') return <Navigate to="/onboarding/metier" replace />; return children; }
function AchatsAccess() { const { user } = useAuth(); const role = user?.role; const allowed = role === 'PATRON' || role === 'GERANT' || role === 'MAGASINIER' || role === 'COMPTABLE' || user?.isSuperAdmin === true; return allowed ? <AchatsReceptionsPage /> : <div className="p-8 text-center"><h2 className="font-bold text-white">Accès restreint</h2><p className="mt-1 text-sm text-slate-400">Votre rôle ne permet pas de gérer les achats et réceptions.</p></div>; }

function DepotLayout() {
  const { user, logout } = useAuth(); const { depots, depotActif, changerDepot } = useDepot(); const [sidebarOpen, setSidebarOpen] = useState(false); const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  return <div className="flex h-screen overflow-hidden bg-slate-900 font-sans text-slate-100"><NotificationToast /><PendingSaleAlert /><div className="hidden shrink-0 lg:flex"><DynamicSidebar user={user} tenant={user?.tenant} onLogout={handleLogout} /></div><div className="flex min-w-0 flex-1 flex-col overflow-hidden"><header className="z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 backdrop-blur-md"><div className="flex items-center gap-4 lg:hidden"><button type="button" onClick={() => setSidebarOpen(true)} className="-ml-2 p-2 text-slate-400 hover:text-white" aria-label="Ouvrir le menu"><span className="block h-0.5 w-6 bg-current" /><span className="mt-1.5 block h-0.5 w-6 bg-current" /><span className="mt-1.5 block h-0.5 w-6 bg-current" /></button><span className="text-lg font-black text-white">GesTock</span></div><div className="flex flex-1 items-center justify-end gap-6"><NotificationBell /><div className="flex items-center gap-3"><div className="hidden flex-col items-end sm:flex"><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dépôt actif</span><span className="mt-1 text-sm font-bold text-indigo-400">{depotActif?.nom || 'Global'}</span></div><select aria-label="Dépôt actif" value={depotActif?.id || ''} onChange={(e) => { const depot = depots.find((d) => d.id === e.target.value); if (depot) changerDepot(depot); }} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-white"><option value="">Aucun dépôt disponible</option>{depots.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}</select></div><div className="hidden h-8 w-px bg-slate-800 sm:block" /><div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 px-3 py-1.5"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{user?.email?.[0]?.toUpperCase()}</div><span className="hidden text-xs font-semibold text-white md:block">{user?.email}</span></div></div></header><main className="relative flex-1 overflow-y-auto custom-scrollbar"><div className="mx-auto min-h-full max-w-[1600px]"><Suspense fallback={<Loader />}><Outlet /></Suspense></div></main></div>{sidebarOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} /><div className="absolute left-0 top-0 h-full"><DynamicSidebar user={user} tenant={user?.tenant} onLogout={handleLogout} /></div></div>}<GeStockChatbot metier={user?.metier} tenantNom={user?.nomEntreprise} /><SupportWidget /></div>;
}

export default function DepotBoissonsRoutes() {
  return <MetierGuard><DepotProvider><Routes><Route element={<DepotLayout />}>
    <Route path="dashboard" element={gate('dashboard', DashboardDepot)} />
    <Route path="stock" element={gate('stock_articles', StockArticlesPage)} />
    <Route path="achats" element={<AchatsAccess />} />
    <Route path="promotions" element={gate('promotions', PromotionsPage)} />
    <Route path="consignes" element={gate('consignes', ConsignesPage)} />
    <Route path="livraisons" element={gate('livraisons', LivraisonsPage)} />
    <Route path="tournees" element={gate('tournees', TourneesPage)} />
    <Route path="clients" element={gate('clients', ClientsPage)} />
    <Route path="fournisseurs" element={gate('fournisseurs', FournisseursPage)} />
    <Route path="ventes" element={gate('ventes', VentesPage)} />
    <Route path="caisse" element={gate('caisse', CaissePage)} />
    <Route path="depenses" element={gate('depenses', DepensesPage)} />
    <Route path="rapports" element={gate('rapports', RapportsPage)} />
    <Route path="parametres" element={gate('parametres', ParametresPage)} />
    <Route path="lots" element={gate('stock', () => <LotsPage metier="depot" />)} />
    <Route path="utilisateurs" element={gate('utilisateurs', UtilisateursPage)} />
    <Route path="depots" element={gate('depots', DepotsPage)} />
    <Route path="abonnement" element={<Navigate to="/pricing" replace />} />
    <Route path="audit-patron" element={gate('audit_patron', AuditPage)} />
    <Route path="profil" element={<ProfilPage />} />
    <Route path="*" element={<DashboardRedirect />} />
  </Route></Routes></DepotProvider></MetierGuard>;
}
