import React, { createContext, useContext } from 'react'
import { useAccessControl, type AccessControl } from '@/hooks/useAccessControl'

const PermissionContext = createContext<AccessControl | null>(null)

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const access = useAccessControl()

  return (
    <PermissionContext.Provider value={access}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}
