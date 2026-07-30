import React, { createContext, useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}
const TabsContext = createContext<TabsContextType | undefined>(undefined)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tabs components must be used within a <Tabs.Root>')
  return context
}

export function Root({ defaultValue, value, onValueChange, children, className }: { defaultValue?: string, value?: string, onValueChange?: (value: string) => void, children: React.ReactNode, className?: string }) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  
  const activeValue = value !== undefined ? value : internalValue
  const setActiveValue = (v: string) => {
    if (value === undefined) setInternalValue(v)
    onValueChange?.(v)
  }

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: setActiveValue }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function List({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-(--ms-bg-elevated) p-1 text-(--ms-text-muted)", className)}>
      {children}
    </div>
  )
}

export function Trigger({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
  const { value: activeValue, onValueChange } = useTabs()
  const isActive = activeValue === value
  
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex relative items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive ? "text-(--ms-text-primary)" : "hover:text-(--ms-text-primary)",
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="tabs-active-indicator"
          className="absolute inset-0 bg-(--ms-bg-surface) shadow-sm rounded-md"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

export function Content({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
  const { value: activeValue } = useTabs()
  
  if (activeValue !== value) return null
  
  return (
    <div
      className={cn("mt-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-(--ms-bg-base)", className)}
    >
      {children}
    </div>
  )
}

export const Tabs = {
  Root,
  List,
  Trigger,
  Content
}
