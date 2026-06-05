import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, MapPin, Users, Settings, LogOut, PlusCircle, Printer, BarChart3, Warehouse, CreditCard, Tag, AlertTriangle, Box, ClipboardList, Users2, FileText, Activity, ShieldCheck, Wrench, ArrowRightLeft, Target, Receipt, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import { usePermissions } from '../hooks/usePermissions';
import { filterByRole, ROLES } from '../utils/rbac';
import { getMetierMenus, getMetierConfig } from '../config/metier-dashboard.config';

import MetierDashboard from '../components/MetierDashboard';
import NotificationsPage from '../core/notifications/NotificationsPage';
import NotificationToast from '../core/notifications/NotificationToast';
import NotificationBell from '../core/notifications/NotificationBell';
import CaissePage from '../pages/CaissePage';
import ClientsPage from '../pages/ClientsPage';
import FournisseursPage from '../pages/FournisseursPage';
import StocksPage from '../pages/StocksPage';
import VentesPage from '../pages/VentesPage';
import RapportsPage from '../pages/RapportsPage';
import AuditPage from '../pages/AuditPage';
import AnalysesPage from '../pages/AnalysesPage';
import SettingsPage from '../pages/SettingsPage';
import DepotsPage from '../pages/DepotsPage';
import GestionPersonnel from '../pages/GestionPersonnel';

import ConsignesPage from '../pages/ConsignesPage';
import TourneesPage from '../pages/TourneesPage';
import DlcPage from '../pages/DlcPage';
import ReceptionsPage from '../pages/ReceptionsPage';
import AvariesPage from '../pages/AvariesPage';
import MaintenancePage from '../pages/MaintenancePage';
import CommissionsPage from '../pages/CommissionsPage';
import CommandesPage from '../pages/CommandesPage';
import LivraisonsPage from '../pages/LivraisonsPage';
import CataloguePage from '../pages/CataloguePage';

import BoutiquePage from '../pages/boutique/BoutiquePage';
import PharmaciePage from '../pages/pharmacie/PharmaciePage';
import RestaurantPage from '../pages/restaurant/RestaurantPage';
import TelephoniePage from '../pages/telephonie/TelephoniePage';
import QuincailleriePage from '../pages/quincaillerie/QuincailleriePage';
import HotelleriePage from '../pages/hotellerie/HotelleriePage';
import ImmobilierPage from '../pages/immobilier/ImmobilierPage';
import TransportPage from '../pages/transport/TransportPage';
import CliniquePage from '../pages/clinique/CliniquePage';
import LibrairiePage from '../pages/librairie/LibrairiePage';
import GlacierPage from '../pages/glacier/GlacierPage';
import ProductionPage from '../pages/boulangerie/ProductionPage';
import FidelitePage from '../pages/parfumerie/FidelitePage';
import ProduitsPage from '../pages/parfumerie/ProduitsPage';
import AgendaPage from '../pages/salon/AgendaPage';
import PrestationsPage from '../pages/salon/PrestationsPage';
import TroupeauxPage from '../pages/elevage/TroupeauxPage';
import EvenementsPage from '../pages/elevage/EvenementsPage';
import TicketsPage from '../pages/pressing/TicketsPage';
import NouveauDepotPage from '../pages/pressing/NouveauDepotPage';
import OrdresReparationPage from '../pages/garage/OrdresReparationPage';
import VehiculesPage from '../pages/garage/VehiculesPage';
import CimentLivraisonsPage from '../pages/ciment-btp/LivraisonsPage';
import CimentVehiculesPage from '../pages/ciment-btp/VehiculesPage';
import SupermarchePage from '../pages/supermarche/SupermarchePage';

import Sidebar from '../components/Sidebar';
import PendingSaleAlert from '../components/PendingSaleAlert';
import GeStockChatbot from '../components/chatbot/GeStockChatbot';
import logo from '../assets/logo-neon.png';

const ICON_SIZE = 20;

function AccessDeniedCard() {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-8 text-center">
      <h2 className="text-xl font-black text-white">Accès limité</h2>
      <p className="mt-2 text-sm text-amber-200">
        Votre rôle ne permet pas d'ouvrir cette section.
      </p>
    </div>
  );
}

const ADMIN_NAV = [
  { id: '/settings', label: 'Paramètres', icon: '⚙️', roles: [ROLES.PATRON, ROLES.GERANT] },
  { id: '/personnel', label: 'Utilisateurs', icon: '👤', roles: [ROLES.PATRON, ROLES.GERANT] },
  { id: '/depots', label: 'Dépôts', icon: '🏢', roles: [ROLES.PATRON, ROLES.GERANT] },
  { id: '/audit', label: 'Audit Patron', icon: '🛡️', roles: [ROLES.PATRON] },
  { id: '/analyses', label: 'Analyses BI', icon: '📊', roles: [ROLES.PATRON, ROLES.GERANT] },
];

const ALL_ROLES = [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER, ROLES.MAGASINIER, ROLES.COMMERCIAL, ROLES.COMPTABLE];

const PAGE_REGISTRY = {
  '/dashboard': <MetierDashboard />,
  '/notifications': <NotificationsPage />,
  '/ventes': <VentesPage />,
  '/stock': <StocksPage />,
  '/clients': <ClientsPage />,
  '/fournisseurs': <FournisseursPage />,
  '/caisse': <CaissePage />,
  '/rapports': <RapportsPage />,
  '/settings': <SettingsPage />,
  '/personnel': <GestionPersonnel />,
  '/depots': <DepotsPage />,
  '/audit': <AuditPage />,
  '/analyses': <AnalysesPage />,
  '/consignes': <ConsignesPage />,
  '/tournees': <TourneesPage />,
  '/alertes-dlc': <DlcPage />,
  '/receptions': <ReceptionsPage />,
  '/avaries': <AvariesPage />,
  '/maintenance': <MaintenancePage />,
  '/commissions': <CommissionsPage />,
  '/commandes': <CommandesPage />,
  '/livraisons': <LivraisonsPage />,
  '/catalogue': <CataloguePage />,
  '/medicaments': <PharmaciePage />,
  '/ordonnances': <PharmaciePage />,
  '/promotions': <BoutiquePage />,
  '/tables': <RestaurantPage />,
  '/menu': <RestaurantPage />,
  '/cuisine': <RestaurantPage />,
  '/reservations': <RestaurantPage />,
  '/telephones': <TelephoniePage />,
  '/reparations': <TelephoniePage />,
  '/accessoires': <TelephoniePage />,
  '/garanties': <TelephoniePage />,
  '/devis': <QuincailleriePage />,
  '/chantiers': <QuincailleriePage />,
  '/hotel/chambres': <HotelleriePage />,
  '/hotel/reservations': <HotelleriePage />,
  '/hotel/sejours': <HotelleriePage />,
  '/immobilier/biens': <ImmobilierPage />,
  '/immobilier/contrats': <ImmobilierPage />,
  '/immobilier/loyers': <ImmobilierPage />,
  '/immobilier/interventions': <ImmobilierPage />,
  '/transport/colis': <TransportPage />,
  '/transport/trajets': <TransportPage />,
  '/transport/flotte': <TransportPage />,
  '/clinique/agenda': <CliniquePage />,
  '/clinique/patients': <CliniquePage />,
  '/clinique/consultations': <CliniquePage />,
  '/clinique/prescriptions': <CliniquePage />,
  '/librairie/catalogue': <LibrairiePage />,
  '/librairie/commandes': <LibrairiePage />,
  '/glacier/commande': <GlacierPage />,
  '/glacier/menu': <GlacierPage />,
  '/boulangerie/production': <ProductionPage />,
  '/boulangerie/recettes': <ProductionPage />,
  '/parfumerie/produits': <ProduitsPage />,
  '/parfumerie/fidelite': <FidelitePage />,
  '/salon/agenda': <AgendaPage />,
  '/salon/rendez-vous': <AgendaPage />,
  '/salon/prestations': <PrestationsPage />,
  '/elevage/troupeaux': <TroupeauxPage />,
  '/elevage/evenements': <EvenementsPage />,
  '/elevage/alimentation': <TroupeauxPage />,
  '/pressing/tickets': <TicketsPage />,
  '/pressing/nouveau': <NouveauDepotPage />,
  '/pressing/prets': <TicketsPage />,
  '/garage/ordres-reparation': <OrdresReparationPage />,
  '/garage/vehicules': <VehiculesPage />,
  '/ciment-btp/livraisons': <CimentLivraisonsPage />,
  '/ciment-btp/vehicules': <CimentVehiculesPage />,
  '/supermarche/rayons': <SupermarchePage />,
  '/supermarche/scan': <SupermarchePage />,
};

const ROLE_GATED = ['/personnel', '/depots', '/audit', '/analyses'];
const ROLE_GATE_MAP = {
  '/personnel': [ROLES.PATRON, ROLES.GERANT],
  '/depots': [ROLES.PATRON, ROLES.GERANT],
  '/audit': [ROLES.PATRON],
  '/analyses': [ROLES.PATRON, ROLES.GERANT],
};

export default function MainLayout() {
  const { user, role, logout } = useAuth();
  const permissions = usePermissions();
  const { depots, depotActif, changerDepot } = useDepot();
  const navigate = useNavigate();

  const metier = user?.metier || 'DEPOT_BOISSONS';
  const config = getMetierConfig(metier);

  const [pageActive, setPageActive] = useState('/dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paywallError, setPaywallError] = useState(false);

  useEffect(() => {
    const handler = () => setPaywallError(true);
    window.addEventListener('saas-paywall-locked', handler);
    return () => window.removeEventListener('saas-paywall-locked', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    const handleNav = (e) => {
      if (e.detail) setPageActive(e.detail);
    };
    window.addEventListener('nav-change', handleNav);
    return () => window.removeEventListener('nav-change', handleNav);
  }, []);

  const metierNavItems = useMemo(() => {
    const menus = getMetierMenus(metier);
    return menus.map((item) => ({
      id: item.path,
      label: item.label,
      icon: item.icon,
      badge: item.badge || null,
      roles: ALL_ROLES,
    }));
  }, [metier]);

  const allNavItems = useMemo(() => {
    return [...metierNavItems, ...ADMIN_NAV];
  }, [metierNavItems]);

  const nav = useMemo(() => filterByRole(allNavItems, role), [allNavItems, role]);

  const activePageId = nav.some((item) => item.id === pageActive)
    ? pageActive
    : (nav[0]?.id || '/dashboard');

  const renderPage = () => {
    if (ROLE_GATED.includes(activePageId)) {
      const allowed = ROLE_GATE_MAP[activePageId];
      if (!allowed.includes(role)) return <AccessDeniedCard />;
    }
    return PAGE_REGISTRY[activePageId] || (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p className="text-lg font-semibold">Module en cours de développement</p>
      </div>
    );
  };

  const commonSidebarProps = {
    nav,
    pageActive: activePageId,
    setPageActive,
    user,
    logout: handleLogout,
    logo,
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-sans">
      <NotificationToast />
      <PendingSaleAlert />
      <div className="hidden lg:flex shrink-0">
        <Sidebar {...commonSidebarProps} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
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
            <NotificationBell />
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

        <div className="px-6 py-2 flex flex-wrap gap-4 items-center justify-between bg-slate-900/30 border-b border-slate-800">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                <Warehouse size={14} className="text-indigo-400" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  {depots.length} Dépôts Utilisés
                </span>
              </div>

              {user?.status === 'GRACE_PERIOD' && (
                <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 animate-pulse">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="text-[11px] font-black text-amber-500 uppercase tracking-wider">
                    Période de grâce active - Renouvelez bientôt
                  </span>
                </div>
              )}
           </div>

           <button
             onClick={() => navigate('/pricing')}
             className="text-[10px] font-black text-indigo-400 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors"
           >
             Gérer l'abonnement <ArrowRightLeft size={12} />
           </button>
        </div>

        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div key={`${activePageId}-${depotActif?.id || 'global'}`} className="max-w-[1600px] mx-auto min-h-full">
            {renderPage()}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar {...commonSidebarProps} setSidebarOpen={setSidebarOpen} />
          </div>
        </div>
      )}

      <GeStockChatbot metier={user?.metier} tenantNom={user?.nomEntreprise} />

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
