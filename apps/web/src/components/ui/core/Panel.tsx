import React, { createContext, useContext, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
  side: 'left' | 'right' | 'bottom'
}
const PanelContext = createContext<PanelContextType | undefined>(undefined)

function usePanel() {
  const context = useContext(PanelContext)
  if (!context) throw new Error('Panel components must be used within a <Panel.Root>')
  return context
}

export function Root({ open, onOpenChange, side = 'right', children }: { open: boolean, onOpenChange: (open: boolean) => void, side?: 'left' | 'right' | 'bottom', children: React.ReactNode }) {
  return <PanelContext.Provider value={{ open, onOpenChange, side }}>{children}</PanelContext.Provider>
}

export function Trigger({ children, asChild }: { children: React.ReactElement<any>, asChild?: boolean }) {
  const { onOpenChange } = usePanel()
  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as any
    return React.cloneElement(children, {
      ...childProps,
      onClick: (e: any) => {
        childProps.onClick?.(e)
        onOpenChange(true)
      }
    })
  }
  return <button onClick={() => onOpenChange(true)}>{children}</button>
}

export function Portal({ children, forceMount }: { children: React.ReactNode, forceMount?: boolean }) {
  const { open } = usePanel()
  return (
    <AnimatePresence>
      {(open || forceMount) && (
        <div className="fixed inset-0 z-[90] flex pointer-events-none">
          {children}
        </div>
      )}
    </AnimatePresence>
  )
}

export function Overlay({ className }: { className?: string }) {
  const { onOpenChange } = usePanel()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpenChange(false)}
      className={cn("absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto", className)}
    />
  )
}

export function Content({ children, className, containerClassName, width = 'w-[320px]', height = 'h-[60vh]' }: { children: React.ReactNode, className?: string, containerClassName?: string, width?: string, height?: string }) {
  const { side } = usePanel()
  
  let initial = {}
  let animate = {}
  let exit = {}
  let positionClasses = ''
  let sizeClasses = width

  if (side === 'right') {
    initial = { x: '100%' }
    animate = { x: 0 }
    exit = { x: '100%' }
    positionClasses = 'right-0 top-0 bottom-0 border-l'
  } else if (side === 'left') {
    initial = { x: '-100%' }
    animate = { x: 0 }
    exit = { x: '-100%' }
    positionClasses = 'left-0 top-0 bottom-0 border-r'
  } else if (side === 'bottom') {
    initial = { y: '100%' }
    animate = { y: 0 }
    exit = { y: '100%' }
    positionClasses = 'bottom-0 left-0 right-0 border-t rounded-t-2xl'
    sizeClasses = `w-full ${height}`
  }
  
  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.8 }}
      className={cn(
        "absolute pointer-events-auto flex flex-col bg-(--ms-bg-surface) border-(--ms-border) shadow-2xl overflow-hidden",
        positionClasses,
        sizeClasses,
        containerClassName
      )}
    >
      <div className={cn("flex flex-col h-full w-full", className)}>
        {children}
      </div>
    </motion.div>
  )
}

export function Header({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-3 border-b border-(--ms-border) bg-(--ms-bg-surface) shrink-0", className)}>
      {children}
    </div>
  )
}

export function Title({ children, className }: { children: React.ReactNode, className?: string }) {
  return <h3 className={cn("text-sm font-semibold tracking-wide text-(--ms-text-primary)", className)}>{children}</h3>
}

export function Close({ className }: { className?: string }) {
  const { onOpenChange } = usePanel()
  return (
    <button
      onClick={() => onOpenChange(false)}
      className={cn(
        "p-1.5 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-elevated) transition-colors cursor-pointer",
        className
      )}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close panel</span>
    </button>
  )
}

export const Panel = {
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Header,
  Title,
  Close,
}
