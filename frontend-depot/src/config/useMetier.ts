// ─────────────────────────────────────────────────────────────────
// useMetier.ts  (Frontend — React Hook)
// Récupère le métier du tenant connecté depuis le contexte auth,
// et retourne la config navigation + widgets correspondante.
// Utilisé par le Sidebar et le Dashboard.
// ─────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import {
  MetierType,
  getMetierConfig,
  getMetierMenus,
  getMetierWidgets,
  MetierDashboardConfig,
  MenuItem,
  DashboardWidget,
} from '../config/metier-dashboard.config';

// Adapte ce chemin à ton contexte auth réel
// import { useAuth } from './useAuth';

interface UseMetierReturn {
  metier:      MetierType | null;
  config:      MetierDashboardConfig | null;
  menus:       MenuItem[];
  widgets:     DashboardWidget[];
  label:       string;
  icon:        string;
  couleur:     string;
  isLoaded:    boolean;
}

export function useMetier(): UseMetierReturn {
  // ── Récupère le métier depuis ton contexte auth ───────────────
  // Remplace cette ligne par ton vrai hook auth :
  // const { tenant } = useAuth();
  // const metier = tenant?.metier as MetierType | null;

  const metier = (
    localStorage.getItem('gestock_metier') as MetierType | null
  );

  const result = useMemo<UseMetierReturn>(() => {
    if (!metier) {
      return {
        metier:   null,
        config:   null,
        menus:    [],
        widgets:  [],
        label:    '',
        icon:     '',
        couleur:  '#2563eb',
        isLoaded: false,
      };
    }

    const config = getMetierConfig(metier);

    return {
      metier,
      config,
      menus:    getMetierMenus(metier),
      widgets:  getMetierWidgets(metier),
      label:    config.label,
      icon:     config.icon,
      couleur:  config.couleur,
      isLoaded: true,
    };
  }, [metier]);

  return result;
}

// ─── Helper hook : vérifie si l'onboarding est complet ───────────
export function useOnboardingStatus(): {
  isComplete:  boolean;
  metier:      MetierType | null;
  redirectTo:  string;
} {
  const metier = localStorage.getItem('gestock_metier') as MetierType | null;

  return {
    isComplete: !!metier,
    metier,
    redirectTo: metier ? '/dashboard' : '/onboarding/metier',
  };
}