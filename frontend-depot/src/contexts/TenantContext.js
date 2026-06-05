// frontend-depot/src/contexts/TenantContext.js
import { createContext, useState, useEffect } from 'react'
import { fetchTenant } from '../services/tenantService' // votre appel API

export const TenantContext = createContext(null)

export function TenantProvider({ children }) {
  const [tenant,       setTenant]       = useState(null)
  const [currentDepot, setCurrentDepot] = useState(null)
  const [depots,       setDepots]       = useState([])
  const [plan,         setPlan]         = useState('free')
  const [isLoading,    setIsLoading]    = useState(true)
  const [error,        setError]        = useState(null)

  useEffect(() => {
    fetchTenant()
      .then((data) => {
        setTenant(data.tenant)
        setDepots(data.depots ?? [])
        setCurrentDepot(data.depots?.[0] ?? null)
        setPlan(data.plan ?? 'free')
      })
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <TenantContext.Provider value={{
      tenant, currentDepot, setCurrentDepot,
      depots, plan, isLoading, error,
    }}>
      {children}
    </TenantContext.Provider>
  )
}