/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { TenantProvider } from './contexts/TenantContext';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DepotProvider } from './contexts/DepotContext';
import { NotifProvider } from './context/NotifContext';
import { DataProvider } from './context/DataContext';
import OfflineBanner from './components/OfflineBanner';
import InstallPWA from './components/InstallPWA';
import QuotaUpgradeAlert from './components/QuotaUpgradeAlert';
import LandingPage from './pages/LandingPage';
import OnboardingMetierPage from "./pages/OnboardingMetierPage";
import { OnboardingRoute } from "./components/guards/OnboardingGuard";
import SectorGuard, { getSectorPrefix } from './components/guards/SectorGuard';
import { METIER_MODULES } from './modules/ModuleRegistry';

// Pages Publiques
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CguPage = lazy(() => import('./pages/CguPage'));
const BientotDisponible = lazy(() => import('./pages/BientotDisponible'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));

// Importation des routes par métier
const DepotBoissonsRoutes = lazy(() => import('./modules/depot-boissons/routes'));
const SupermarcheRoutes   = lazy(() => import('./modules/supermarche/routes'));
const PharmacieRoutes     = lazy(() => import('./modules/pharmacie/routes'));
const HotelRoutes         = lazy(() => import('./modules/hotel/routes'));
const RestaurantRoutes    = lazy(() => import('./modules/restaurant/routes'));
const CliniqueRoutes      = lazy(() => import('./modules/clinique/routes'));
const ElevageRoutes       = lazy(() => import('./modules/elevage/routes'));
const GarageAutomobileRoutes   = lazy(() => import('./modules/garage_automobile/routes'));
const QuincaillerieRoutes      = lazy(() => import('./modules/quincaillerie/routes'));
const ImmobilierRoutes         = lazy(() => import('./modules/immobilier/routes'));
const LibrairieRoutes          = lazy(() => import('./modules/librairie/routes'));
const BoutiqueRoutes           = lazy(() => import('./modules/boutique/routes'));
const TransportRoutes          = lazy(() => import('./modules/transport/routes'));
const BoulangerieRoutes        = lazy(() => import('./modules/boulangerie/routes'));
const ParfumerieRoutes         = lazy(() => import('./modules/parfumerie/routes'));
const SalonBeauteRoutes        = lazy(() => import('./modules/salon_beaute/routes'));
const TelephonieRoutes         = lazy(() => import('./modules/telephonie/routes'));
const PressingRoutes           = lazy(() => import('./modules/pressing/routes'));
const CimentBtpRoutes          = lazy(() => import('./modules/ciment_btp/routes'));
const GlacierSnackRoutes       = lazy(() => import('./modules/glacier_snack/routes'));

function AppLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AppLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function SectorHomeRedirect() {
  const { metier, isAuthenticated, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const stored = localStorage.getItem('gestock_metier');
  const sector = metier || stored;
  
  if (!sector) return <Navigate to="/onboarding/metier" replace />;
  
  const prefix = getSectorPrefix(sector);
  // Redirige directement vers la sous-route spécifique du secteur (ex: /supermarche/dashboard)
  return <Navigate to={`${prefix}/dashboard`} replace />;
}

// FIX: Le Dashboard s'adapte dynamiquement au métier actif présent dans l'URL
const SectorDashboardRoute = () => {
  return (
    <PrivateRoute>
      <DepotProvider>
        <Suspense fallback={<AppLoader />}>
          <MainLayout />
        </Suspense>
      </DepotProvider>
    </PrivateRoute>
  );
};

function AppRoutes() {
  return (
    <Suspense fallback={<AppLoader />}>
      <ErrorBoundary>
        <Routes>
          {/* Routes de base et d'authentification */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/onboarding/metier" element={<OnboardingMetierPage />} />
          <Route path="/bientot-disponible" element={<BientotDisponible />} />
          
          {/* Gestion des redirections initiales */}
          <Route path="/dashboard" element={<SectorHomeRedirect />} />
          
          {/* 🛒 1. OFFRE DEPOT BOISSONS */}
          <Route 
            path="/depot/*" 
            element={
              <SectorGuard allowedSectors={['DEPOT_BOISSONS']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <DepotBoissonsRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />
          
          {/* 🏪 2. OFFRE SUPERMARCHÉ */}
          <Route 
            path="/supermarche/*" 
            element={
              <SectorGuard allowedSectors={['SUPERMARCHE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <SupermarcheRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 💊 3. OFFRE PHARMACIE */}
          <Route 
            path="/pharmacie/*" 
            element={
              <SectorGuard allowedSectors={['PHARMACIE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <PharmacieRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🏨 4. OFFRE HÔTEL */}
          <Route 
            path="/hotel/*" 
            element={
              <SectorGuard allowedSectors={['HOTEL']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <HotelRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🍔 5. OFFRE RESTAURANT */}
          <Route 
            path="/restaurant/*" 
            element={
              <SectorGuard allowedSectors={['RESTAURANT']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <RestaurantRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🧪 6. OFFRE CLINIQUE */}
          <Route 
            path="/clinique/*" 
            element={
              <SectorGuard allowedSectors={['CLINIQUE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <CliniqueRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🌾 7. OFFRE ÉLEVAGE */}
          <Route 
            path="/elevage/*" 
            element={
              <SectorGuard allowedSectors={['ELEVAGE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <ElevageRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🚗 8. OFFRE GARAGE AUTOMOBILE */}
          <Route 
            path="/garage-automobile/*" 
            element={
              <SectorGuard allowedSectors={['GARAGE_AUTOMOBILE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <GarageAutomobileRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🔨 9. OFFRE QUINCAILLERIE */}
          <Route 
            path="/quincaillerie/*" 
            element={
              <SectorGuard allowedSectors={['QUINCAILLERIE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <QuincaillerieRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🏢 10. OFFRE IMMOBILIER */}
          <Route 
            path="/immobilier/*" 
            element={
              <SectorGuard allowedSectors={['IMMOBILIER']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <ImmobilierRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 📚 11. OFFRE LIBRAIRIE */}
          <Route 
            path="/librairie/*" 
            element={
              <SectorGuard allowedSectors={['LIBRAIRIE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <LibrairieRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 👗 12. OFFRE BOUTIQUE */}
          <Route 
            path="/boutique/*" 
            element={
              <SectorGuard allowedSectors={['BOUTIQUE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <BoutiqueRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🚛 13. OFFRE TRANSPORT */}
          <Route 
            path="/transport/*" 
            element={
              <SectorGuard allowedSectors={['TRANSPORT']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <TransportRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🥖 14. OFFRE BOULANGERIE */}
          <Route 
            path="/boulangerie/*" 
            element={
              <SectorGuard allowedSectors={['BOULANGERIE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <BoulangerieRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🧪 15. OFFRE PARFUMERIE */}
          <Route 
            path="/parfumerie/*" 
            element={
              <SectorGuard allowedSectors={['PARFUMERIE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <ParfumerieRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 💇 16. OFFRE SALON DE BEAUTÉ */}
          <Route 
            path="/salon-beaute/*" 
            element={
              <SectorGuard allowedSectors={['SALON_BEAUTE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <SalonBeauteRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 📱 17. OFFRE TÉLÉPHONIE */}
          <Route 
            path="/telephonie/*" 
            element={
              <SectorGuard allowedSectors={['TELEPHONIE']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <TelephonieRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🧺 18. OFFRE PRESSING */}
          <Route 
            path="/pressing/*" 
            element={
              <SectorGuard allowedSectors={['PRESSING']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <PressingRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🧱 19. OFFRE CIMENT BTP */}
          <Route 
            path="/ciment-btp/*" 
            element={
              <SectorGuard allowedSectors={['CIMENT_BTP']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <CimentBtpRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* 🍦 20. OFFRE GLACIER SNACK */}
          <Route 
            path="/glacier-snack/*" 
            element={
              <SectorGuard allowedSectors={['GLACIER_SNACK']}>
                <PrivateRoute>
                  <DepotProvider>
                    <Suspense fallback={<AppLoader />}>
                      <GlacierSnackRoutes />
                    </Suspense>
                  </DepotProvider>
                </PrivateRoute>
              </SectorGuard>
            } 
          />

          {/* Route par défaut globale si l'URL ne correspond à rien */}
          <Route path="*" element={<SectorHomeRedirect />} />
        </Routes>
      </ErrorBoundary>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider>
          <NotifProvider>
            <DataProvider>
              <BrowserRouter>
                <AppRoutes />
                <OfflineBanner />
                <InstallPWA />
                <QuotaUpgradeAlert />
              </BrowserRouter>
            </DataProvider>
          </NotifProvider>
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}