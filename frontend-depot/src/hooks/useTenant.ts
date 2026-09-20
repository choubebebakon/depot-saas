// frontend-depot/src/hooks/useTenant.js
import { useContext, useCallback } from 'react'
import { TenantContext } from '../contexts/TenantContext'

/**
 * useTenant — Accès au contexte du tenant (organisation) courant.
 * Fournit les infos de l'entreprise connectée et le plan actif.
 *
 * NOTE (correctif du 9 septembre 2026) : ce hook ne gère plus le dépôt
 * actif. Utiliser useDepot() (src/contexts/DepotContext.jsx) pour tout ce
 * qui concerne le dépôt sélectionné — c'est l'unique source de vérité.
 */
export function useTenant() {
  const context = useContext(TenantContext)

  if (!context) {
    throw new Error('useTenant must be used inside <TenantProvider>')
  }

  const {
    tenant,
    depots,
    plan,
    isLoading,
    error,
  } = context

  // ── Plan helpers ──────────────────────────────────────────
  const isFree       = plan === 'free'
  const isSolo       = plan === 'solo'
  const isPME        = plan === 'pme'
  const isEnterprise = plan === 'enterprise'

  const canAccessMultiDepot = isPME || isEnterprise
  const canAccessAPI        = isEnterprise
  const maxDepots = isSolo ? 1 : isPME ? 10 : isEnterprise ? Infinity : 1

  const hasMultipleDepots = depots?.length > 1

  // ── Permission helpers ──────────────────────────────────────────
  const hasFeature = useCallback((feature) => {
    const featureMap = {
      stock:           true,
      sales:           true,
      purchases:       true,
      deliveries:      true,
      accounting:      true,
      hr:              true,
      reports:         true,
      multiDepot:      canAccessMultiDepot,
      advancedReports: isPME || isEnterprise,
      api:             canAccessAPI,
      prioritySupport: isPME || isEnterprise,
      customRoles:     isPME || isEnterprise,
    }
    return featureMap[feature] ?? false
  }, [canAccessMultiDepot, canAccessAPI, isPME, isEnterprise])

  return {
    // Données brutes
    tenant,
    depots,
    plan,
    isLoading,
    error,

    // Plan
    isFree,
    isSolo,
    isPME,
    isEnterprise,
    maxDepots,

    // Dépôts
    hasMultipleDepots,
    canAccessMultiDepot,

    // Permissions
    hasFeature,
    canAccessAPI,
  }
}