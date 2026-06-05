// frontend-depot/src/hooks/useTenant.js
import { useContext, useCallback } from 'react'
import { TenantContext } from '../contexts/TenantContext'

/**
 * useTenant — Accès au contexte du tenant (organisation) courant.
 * Fournit les infos du dépôt/entreprise connectée, le plan actif,
 * les permissions et les helpers de navigation multi-dépôts.
 */
export function useTenant() {
  const context = useContext(TenantContext)

  if (!context) {
    throw new Error('useTenant must be used inside <TenantProvider>')
  }

  const {
    tenant,
    currentDepot,
    setCurrentDepot,
    depots,
    plan,
    isLoading,
    error,
  } = context

  // ── Plan helpers ──────────────────────────────────────────────
  const isFree       = plan === 'free'
  const isSolo       = plan === 'solo'
  const isPME        = plan === 'pme'
  const isEnterprise = plan === 'enterprise'

  const canAccessMultiDepot = isPME || isEnterprise
  const canAccessAPI        = isEnterprise
  const maxDepots = isSolo ? 1 : isPME ? 10 : isEnterprise ? Infinity : 1

  // ── Depot helpers ─────────────────────────────────────────────
  const hasMultipleDepots = depots?.length > 1

  const switchDepot = useCallback((depotId) => {
    const depot = depots?.find((d) => d.id === depotId)
    if (!depot) {
      console.warn(`[useTenant] Depot "${depotId}" not found.`)
      return
    }
    setCurrentDepot(depot)
  }, [depots, setCurrentDepot])

  const isCurrentDepot = useCallback(
    (depotId) => currentDepot?.id === depotId,
    [currentDepot]
  )

  // ── Permission helpers ────────────────────────────────────────
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
    currentDepot,
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
    switchDepot,
    isCurrentDepot,

    // Permissions
    hasFeature,
    canAccessAPI,
  }
}