import React, { createContext, useContext, useMemo } from 'react'
import { useAccessControl, type AccessControl } from '@/hooks/useAccessControl'

const PermissionContext = createContext<AccessControl | null>(null)

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const access = useAccessControl()
  
  // Memoize the value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => access, [
    access.mode, 
    access.canEdit, 
    access.isReadOnly, 
    access.isDenied, 
    access.isAuthenticated
  ])

  return (
    <PermissionContext.Provider value={value}>
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
