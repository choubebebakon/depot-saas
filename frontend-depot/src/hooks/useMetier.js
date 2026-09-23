import { useMemo } from 'react';
import { getMetierConfig, getMetierMenus, getMetierWidgets } from '../config/metier-dashboard.config';
import { SIDEBAR_CONFIG as DEPOT_SIDEBAR } from '../modules/depot-boissons/sidebar.config';
import { DASHBOARD_WIDGETS as DEPOT_WIDGETS } from '../modules/depot-boissons/dashboard.config';
import { SIDEBAR_CONFIG as SUPERMARCHE_SIDEBAR } from '../modules/supermarche/sidebar.config';
import { DASHBOARD_WIDGETS as SUPERMARCHE_WIDGETS } from '../modules/supermarche/dashboard.config';
import { SIDEBAR_CONFIG as PHARMACIE_SIDEBAR } from '../modules/pharmacie/sidebar.config';
import { DASHBOARD_WIDGETS as PHARMACIE_WIDGETS } from '../modules/pharmacie/dashboard.config';
import { SIDEBAR_CONFIG as HOTEL_SIDEBAR } from '../modules/hotel/sidebar.config';
import { DASHBOARD_WIDGETS as HOTEL_WIDGETS } from '../modules/hotel/dashboard.config';
import { SIDEBAR_CONFIG as RESTAURANT_SIDEBAR } from '../modules/restaurant/sidebar.config';
import { DASHBOARD_WIDGETS as RESTAURANT_WIDGETS } from '../modules/restaurant/dashboard.config';
import { SIDEBAR_CONFIG as CLINIQUE_SIDEBAR } from '../modules/clinique/sidebar.config';
import { DASHBOARD_WIDGETS as CLINIQUE_WIDGETS } from '../modules/clinique/dashboard.config';
import { SIDEBAR_CONFIG as ELEVAGE_SIDEBAR } from '../modules/elevage/sidebar.config';
import { DASHBOARD_WIDGETS as ELEVAGE_WIDGETS } from '../modules/elevage/dashboard.config';
import { SIDEBAR_CONFIG as GARAGE_SIDEBAR } from '../modules/garage_automobile/sidebar.config';
import { DASHBOARD_WIDGETS as GARAGE_WIDGETS } from '../modules/garage_automobile/dashboard.config';
import { SIDEBAR_CONFIG as IMMOBILIER_SIDEBAR } from '../modules/immobilier/sidebar.config';
import { DASHBOARD_WIDGETS as IMMOBILIER_WIDGETS } from '../modules/immobilier/dashboard.config';
import { SIDEBAR_CONFIG as BOUTIQUE_SIDEBAR } from '../modules/boutique/sidebar.config';
import { DASHBOARD_WIDGETS as BOUTIQUE_WIDGETS } from '../modules/boutique/dashboard.config';
import { SIDEBAR_CONFIG as TRANSPORT_SIDEBAR } from '../modules/transport/sidebar.config';
import { DASHBOARD_WIDGETS as TRANSPORT_WIDGETS } from '../modules/transport/dashboard.config';
import { SIDEBAR_CONFIG as BOULANGERIE_SIDEBAR } from '../modules/boulangerie/sidebar.config';
import { DASHBOARD_WIDGETS as BOULANGERIE_WIDGETS } from '../modules/boulangerie/dashboard.config';
import { SIDEBAR_CONFIG as PRESSING_SIDEBAR } from '../modules/pressing/sidebar.config';
import { DASHBOARD_WIDGETS as PRESSING_WIDGETS } from '../modules/pressing/dashboard.config';
import { SIDEBAR_CONFIG as CIMENT_BTP_SIDEBAR } from '../modules/ciment_btp/sidebar.config';
import { DASHBOARD_WIDGETS as CIMENT_BTP_WIDGETS } from '../modules/ciment_btp/dashboard.config';

const MODULE_CONFIGS = {
  DEPOT_BOISSONS: {
    sidebar: DEPOT_SIDEBAR.DEPOT_BOISSONS,
    widgets: DEPOT_WIDGETS,
  },
  SUPERMARCHE: {
    sidebar: SUPERMARCHE_SIDEBAR.SUPERMARCHE,
    widgets: SUPERMARCHE_WIDGETS,
  },
  PHARMACIE: {
    sidebar: PHARMACIE_SIDEBAR.PHARMACIE,
    widgets: PHARMACIE_WIDGETS,
  },
  HOTEL: {
    sidebar: HOTEL_SIDEBAR.HOTEL,
    widgets: HOTEL_WIDGETS,
  },
  RESTAURANT: {
    sidebar: RESTAURANT_SIDEBAR.RESTAURANT,
    widgets: RESTAURANT_WIDGETS,
  },
  CLINIQUE: {
    sidebar: CLINIQUE_SIDEBAR.CLINIQUE,
    widgets: CLINIQUE_WIDGETS,
  },
  ELEVAGE: {
    sidebar: ELEVAGE_SIDEBAR.ELEVAGE,
    widgets: ELEVAGE_WIDGETS,
  },
  GARAGE_AUTOMOBILE: {
    sidebar: GARAGE_SIDEBAR.GARAGE_AUTOMOBILE,
    widgets: GARAGE_WIDGETS,
  },
  IMMOBILIER: {
    sidebar: IMMOBILIER_SIDEBAR.IMMOBILIER,
    widgets: IMMOBILIER_WIDGETS,
  },
  BOUTIQUE: {
    sidebar: BOUTIQUE_SIDEBAR.BOUTIQUE,
    widgets: BOUTIQUE_WIDGETS,
  },
  TRANSPORT: {
    sidebar: TRANSPORT_SIDEBAR.TRANSPORT,
    widgets: TRANSPORT_WIDGETS,
  },
  BOULANGERIE: {
    sidebar: BOULANGERIE_SIDEBAR.BOULANGERIE,
    widgets: BOULANGERIE_WIDGETS,
  },
  PRESSING: {
    sidebar: PRESSING_SIDEBAR.PRESSING,
    widgets: PRESSING_WIDGETS,
  },
  CIMENT_BTP: {
    sidebar: CIMENT_BTP_SIDEBAR.CIMENT_BTP,
    widgets: CIMENT_BTP_WIDGETS,
  },
};

export function useMetier() {
  const metierKey = localStorage.getItem('gestock_metier') || 'DEPOT_BOISSONS';

  return useMemo(() => {
    const centralConfig = getMetierConfig(metierKey);
    const moduleConfig = MODULE_CONFIGS[metierKey];

    const config = moduleConfig?.sidebar || centralConfig;
    const menus = moduleConfig?.sidebar?.menus || getMetierMenus(metierKey);
    const widgets = moduleConfig?.widgets || getMetierWidgets(metierKey);

    return {
      metier: metierKey,
      config,
      menus,
      widgets,
      label: config?.label || '',
      icon: config?.icon || '',
      couleur: config?.couleur || '#2563eb',
      isLoaded: true,
    };
  }, [metierKey]);
}

export function useOnboardingStatus() {
  const metier = localStorage.getItem('gestock_metier');
  return {
    isComplete: !!metier,
    metier,
    redirectTo: metier ? '/dashboard' : '/onboarding/metier',
  };
}
