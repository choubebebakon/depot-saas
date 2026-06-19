import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SECTOR_ROUTES = {
  DEPOT_BOISSONS:    { prefix: '/depot',         label: 'Dépôt' },
  BOUTIQUE:          { prefix: '/boutique',     label: 'Boutique' },
  QUINCAILLERIE:     { prefix: '/quincaillerie',label: 'Quincaillerie' },
  PHARMACIE:         { prefix: '/pharmacie',    label: 'Pharmacie' },
  RESTAURANT:        { prefix: '/restaurant',   label: 'Restaurant' },
  TELEPHONIE:        { prefix: '/telephonie',   label: 'Téléphonie' },
  SUPERMARCHE:       { prefix: '/supermarche',  label: 'Supermarché' },
  CIMENT_BTP:        { prefix: '/ciment-btp',   label: 'Ciment BTP' }, // Aligné
  PRESSING:          { prefix: '/pressing',     label: 'Pressing' },
  GARAGE:            { prefix: '/garage',       label: 'Garage' },
  ELEVAGE:           { prefix: '/elevage',      label: 'Élevage' },
  SALON:             { prefix: '/salon',        label: 'Salon' },
  PARFUMERIE:        { prefix: '/parfumerie',   label: 'Parfumerie' },
  BOULANGERIE:       { prefix: '/boulangerie',  label: 'Boulangerie' },
  GLACIER:           { prefix: '/glacier',      label: 'Glacier' },
  LIBRAIRIE:         { prefix: '/librairie',    label: 'Librairie' },
  CLINIQUE:          { prefix: '/clinique',     label: 'Clinique' },
  TRANSPORT:         { prefix: '/transport',    label: 'Transport' },
  IMMOBILIER:        { prefix: '/immobilier',   label: 'Immobilier' },
  HOTELLERIE:        { prefix: '/hotel',        label: 'Hôtel' }, // Aligné avec backend
};

export function getSectorPrefix(metier) {
  return SECTOR_ROUTES[metier]?.prefix || '/dashboard';
}

function GuardLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function SectorGuard({ children, allowedSectors }) {
  // FIX M4 : Extraction de loading pour bloquer les redirections prématurées au boot
  const { metier, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Si l'authentification est en cours de vérification, on fige le rendu sur un loader propre
  if (loading) {
    return <GuardLoader />;
  }

  // Si après chargement l'utilisateur n'est pas connecté, là on redirige légitimement
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si aucun allowedSectors spécifié, on laisse passer
  if (!allowedSectors || allowedSectors.length === 0) {
    return children;
  }

  const userSector = metier || localStorage.getItem('gestock_metier');

  if (!userSector) {
    return <Navigate to="/onboarding/metier" replace />;
  }

  // Vérifier si le secteur de l'utilisateur est autorisé
  if (!allowedSectors.includes(userSector)) {
    const redirectTo = getSectorPrefix(userSector);
    
    // Sécurité supplémentaire : évite la boucle infinie si redirectTo correspond à la route actuelle
    if (location.pathname.startsWith(redirectTo)) {
      return children;
    }
    
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}