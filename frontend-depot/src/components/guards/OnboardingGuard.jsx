// ─────────────────────────────────────────────────────────────────
// OnboardingGuard.jsx
// Protège toutes les routes /dashboard et sous-pages.
// Si le tenant n'a pas encore choisi son métier → redirige vers
// /onboarding/metier automatiquement.
//
// 📦 Dépendances : React, react-router-dom
// 📁 Destination : src/components/guards/OnboardingGuard.jsx
//
// ── Utilisation dans ton Router ──────────────────────────────────
// <Route element={<OnboardingGuard />}>
//   <Route path="/dashboard" element={<Dashboard />} />
//   <Route path="/ventes"    element={<Ventes />} />
//   ... toutes tes routes protégées
// </Route>
// ─────────────────────────────────────────────────────────────────

import { Navigate, Outlet, useLocation } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────
// Props :
//   tenant : { metier, onboardingComplete } — depuis ton contexte auth
// ─────────────────────────────────────────────────────────────────
export default function OnboardingGuard({ tenant }) {
  const location = useLocation();

  // ── Vérifie si le métier a été choisi ────────────────────────
  const metierChoisi =
    tenant?.metier ||
    tenant?.onboardingComplete ||
    localStorage.getItem("gestock_metier");

  // ── Si pas encore choisi → redirection ───────────────────────
  if (!metierChoisi) {
    return (
      <Navigate
        to="/onboarding/metier"
        state={{ from: location }}
        replace
      />
    );
  }

  // ── Sinon → affiche la route demandée ────────────────────────
  return <Outlet />;
}


// ─────────────────────────────────────────────────────────────────
// OnboardingRoute.jsx
// Inverse : empêche d'accéder à /onboarding/metier si déjà fait.
// Redirige vers /dashboard.
//
// ── Utilisation ──────────────────────────────────────────────────
// <Route element={<OnboardingRoute tenant={tenant} />}>
//   <Route path="/onboarding/metier" element={<OnboardingMetierPage />} />
// </Route>
// ─────────────────────────────────────────────────────────────────
export function OnboardingRoute({ tenant }) {
  const metierChoisi =
    tenant?.metier ||
    tenant?.onboardingComplete ||
    localStorage.getItem("gestock_metier");

  // Si métier déjà choisi → on ne peut plus revenir sur cette page
  if (metierChoisi) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
