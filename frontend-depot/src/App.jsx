/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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

// Pages Publiques standard
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CguPage = lazy(() => import('./pages/CguPage'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));

// Pages Marketing & Support
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const MobileAppPage = lazy(() => import('./pages/MobileAppPage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const WholesalersPage = lazy(() => import('./pages/WholesalersPage'));
const GestionConsignesPage = lazy(() => import('./pages/GestionConsignesPage'));
const SuiviTourneesPage = lazy(() => import('./pages/SuiviTourneesPage'));
const RapportsStatsPage = lazy(() => import('./pages/RapportsStatsPage'));
const ApiDocsPage = lazy(() => import('./pages/ApiDocsPage'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));

// Module lazy routes (isolés par métier)
const DepotBoissonsRoutes = lazy(() => import('./modules/depot-boissons/routes'));
const SupermarcheRoutes   = lazy(() => import('./modules/supermarche/routes'));
const PharmacieRoutes     = lazy(() => import('./modules/pharmacie/routes'));
const HotelRoutes          = lazy(() => import('./modules/hotel/routes'));
const RestaurantRoutes     = lazy(() => import('./modules/restaurant/routes'));
const CliniqueRoutes        = lazy(() => import('./modules/clinique/routes'));
const ElevageRoutes            = lazy(() => import('./modules/elevage/routes'));
const GarageAutomobileRoutes   = lazy(() => import('./modules/garage_automobile/routes'));
const QuincaillerieRoutes       = lazy(() => import('./modules/quincaillerie/routes'));
const ImmobilierRoutes          = lazy(() => import('./modules/immobilier/routes'));
const LibrairieRoutes           = lazy(() => import('./modules/librairie/routes'));
const BoutiqueRoutes             = lazy(() => import('./modules/boutique/routes'));
const TransportRoutes            = lazy(() => import('./modules/transport/routes'));
const BoulangerieRoutes          = lazy(() => import('./modules/boulangerie/routes'));
const ParfumerieRoutes           = lazy(() => import('./modules/parfumerie/routes'));
const SalonBeauteRoutes          = lazy(() => import('./modules/salon_beaute/routes'));
const TelephonieRoutes           = lazy(() => import('./modules/telephonie/routes'));
const PressingRoutes             = lazy(() => import('./modules/pressing/routes'));
const CimentBtpRoutes            = lazy(() => import('./modules/ciment_btp/routes'));
const GlacierSnackRoutes         = lazy(() => import('./modules/glacier_snack/routes'));

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

// FIX M4 : Sécurisation du redirecteur pour éviter les boucles infinies hors-connexion
function SectorHomeRedirect() {
  const { metier, isAuthenticated, loading } = useAuth();
  
  if (loading) return <AppLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const stored = localStorage.getItem('gestock_metier');
  const sector = metier || stored;
  
  if (!sector) return <Navigate to="/onboarding/metier" replace />;
  
  const prefix = getSectorPrefix(sector);
  return <Navigate to={`${prefix}/dashboard`} replace />;
}

// FIX M4 : Injection d'un Suspense de sécurité pour le layout des modules dynamiques
const SectorDashboardRoute = () => (
  <PrivateRoute>
    <DepotProvider>
      <Suspense fallback={<AppLoader />}>
        <MainLayout />
      </Suspense>
    </DepotProvider>
  </PrivateRoute>
);

function AppRoutes() {
  return (
    <Suspense fallback={<AppLoader />}>
      <ErrorBoundary>
        <Routes>
          {/* Routes Publiques */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cgu" element={<CguPage />} />

          {/* Marketing & Content */}
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/app-mobile" element={<MobileAppPage />} />
          <Route path="/securite" element={<SecurityPage />} />
          <Route path="/solutions/grossistes" element={<WholesalersPage />} />
          <Route path="/solutions/consignes" element={<GestionConsignesPage />} />
          <Route path="/solutions/tournees" element={<SuiviTourneesPage />} />
          <Route path="/solutions/rapports" element={<RapportsStatsPage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
          <Route path="/aide" element={<HelpCenterPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />

          {/* Flux Onboarding */}
          <Route element={<OnboardingRoute tenant={{ metier: null }} />}>
            <Route path="/onboarding/metier" element={<OnboardingMetierPage />} />
          </Route>

          {/* Redirections Globales */}
          <Route path="/dashboard" element={<SectorHomeRedirect />} />
          <Route path="/dashboard/*" element={<SectorDashboardRoute />} />

          {/* Core Modules Prédéfinis (avec double protection Suspense + PrivateRoute) */}
          <Route
            path="/depot/*"
            element={
              <SectorGuard allowedSectors={['DEPOT_BOISSONS']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <DepotBoissonsRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/supermarche/*"
            element={
              <SectorGuard allowedSectors={['SUPERMARCHE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <SupermarcheRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/pharmacie/*"
            element={
              <SectorGuard allowedSectors={['PHARMACIE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <PharmacieRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/hotel/*"
            element={
              <SectorGuard allowedSectors={['HOTEL']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <HotelRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/restaurant/*"
            element={
              <SectorGuard allowedSectors={['RESTAURANT']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <RestaurantRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/clinique/*"
            element={
              <SectorGuard allowedSectors={['CLINIQUE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <CliniqueRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/elevage/*"
            element={
              <SectorGuard allowedSectors={['ELEVAGE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <ElevageRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/garage/*"
            element={
              <SectorGuard allowedSectors={['GARAGE_AUTOMOBILE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <GarageAutomobileRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/quincaillerie/*"
            element={
              <SectorGuard allowedSectors={['QUINCAILLERIE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <QuincaillerieRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/immobilier/*"
            element={
              <SectorGuard allowedSectors={['IMMOBILIER']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <ImmobilierRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/librairie/*"
            element={
              <SectorGuard allowedSectors={['LIBRAIRIE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <LibrairieRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/boutique/*"
            element={
              <SectorGuard allowedSectors={['BOUTIQUE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <BoutiqueRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/transport/*"
            element={
              <SectorGuard allowedSectors={['TRANSPORT']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <TransportRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/boulangerie/*"
            element={
              <SectorGuard allowedSectors={['BOULANGERIE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <BoulangerieRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/parfumerie/*"
            element={
              <SectorGuard allowedSectors={['PARFUMERIE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <ParfumerieRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/salon/*"
            element={
              <SectorGuard allowedSectors={['SALON_BEAUTE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <SalonBeauteRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/telephonie/*"
            element={
              <SectorGuard allowedSectors={['TELEPHONIE']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <TelephonieRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/pressing/*"
            element={
              <SectorGuard allowedSectors={['PRESSING']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <PressingRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/ciment-btp/*"
            element={
              <SectorGuard allowedSectors={['CIMENT_BTP']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <CimentBtpRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          <Route
            path="/glacier/*"
            element={
              <SectorGuard allowedSectors={['GLACIER_SNACK']}>
                <PrivateRoute>
                  <Suspense fallback={<AppLoader />}>
                    <GlacierSnackRoutes />
                  </Suspense>
                </PrivateRoute>
              </SectorGuard>
            }
          />

          {/* Génération dynamique des modules complémentaires (Sécurisée) */}
          {Object.values(METIER_MODULES)
            .filter(m => !['DEPOT_BOISSONS','SUPERMARCHE','PHARMACIE','HOTEL','RESTAURANT','CLINIQUE','ELEVAGE','GARAGE_AUTOMOBILE','QUINCAILLERIE','IMMOBILIER','LIBRAIRIE','BOUTIQUE','TRANSPORT','BOULANGERIE','PARFUMERIE','SALON_BEAUTE','TELEPHONIE','PRESSING','CIMENT_BTP','GLACIER_SNACK'].includes(m.key))
            .map((mod) => (
              <Route
                key={mod.key}
                path={`${mod.prefix}/*`}
                element={
                  <SectorGuard allowedSectors={[mod.key]}>
                    <SectorDashboardRoute />
                  </SectorGuard>
                }
              />
            ))}

          {/* Route de Secours Globale : Redirige intelligemment selon la session */}
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
      </AuthProvider>
    </QueryClientProvider>
  );
}