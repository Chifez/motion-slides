import React, { createContext, useContext } from 'react'
import { useAccessControl, type AccessControl } from '@/hooks/useAccessControl'

const PermissionContext = createContext<AccessControl | null>(null)

function AccessControlLoader({ children }: { children: React.ReactNode }) {
  const access = useAccessControl()
  return (
    <PermissionContext.Provider value={access}>
      {children}
    </PermissionContext.Provider>
  )
}

interface PermissionProviderProps {
  children: React.ReactNode
  value?: AccessControl
}

export function PermissionProvider({ children, value }: PermissionProviderProps) {
  if (value) {
    return (
      <PermissionContext.Provider value={value}>
        {children}
      </PermissionContext.Provider>
    )
  }
  return <AccessControlLoader>{children}</AccessControlLoader>
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}
