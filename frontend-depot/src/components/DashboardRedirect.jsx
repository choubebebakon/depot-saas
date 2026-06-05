import { Navigate, useLocation } from 'react-router-dom';

/**
 * Redirige vers le dashboard du secteur actif.
 * Protection anti-boucle : vérifie que la destination est différente
 * de l'URL courante avant de rediriger.
 */
export default function DashboardRedirect() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const base = segments.length >= 1 ? `/${segments[0]}` : '';
  const destination = `${base}/dashboard`;

  if (pathname === destination) {
    return null;
  }

  return <Navigate to={destination} replace />;
}
