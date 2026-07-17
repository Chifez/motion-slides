import React, { createContext, useContext, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}
const ModalContext = createContext<ModalContextType | undefined>(undefined)

function useModal() {
  const context = useContext(ModalContext)
  if (!context) throw new Error('Modal components must be used within a <Modal.Root>')
  return context
}

export function Root({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) {
  return <ModalContext.Provider value={{ open, onOpenChange }}>{children}</ModalContext.Provider>
}

export function Trigger({ children, asChild }: { children: React.ReactElement<any>, asChild?: boolean }) {
  const { onOpenChange } = useModal()
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

export function Portal({ children }: { children: React.ReactNode }) {
  const { open } = useModal()
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {children}
        </div>
      )}
    </AnimatePresence>
  )
}

export function Overlay({ className }: { className?: string }) {
  const { onOpenChange } = useModal()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => onOpenChange(false)}
      className={cn("absolute inset-0 bg-black/60 backdrop-blur-sm", className)}
    />
  )
}

export function Content({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
      className={cn(
        "relative w-full max-w-md bg-(--ms-bg-surface) border border-(--ms-border) rounded-2xl shadow-2xl overflow-hidden",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export function Header({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6 pb-2", className)}>
      {children}
    </div>
  )
}

export function Footer({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex items-center justify-end space-x-2 p-6 pt-4", className)}>
      {children}
    </div>
  )
}

export function Title({ children, className }: { children: React.ReactNode, className?: string }) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight text-(--ms-text-primary)", className)}>{children}</h3>
}

export function Description({ children, className }: { children: React.ReactNode, className?: string }) {
  return <p className={cn("text-sm text-(--ms-text-muted)", className)}>{children}</p>
}

export function Close({ className }: { className?: string }) {
  const { onOpenChange } = useModal()
  return (
    <button
      onClick={() => onOpenChange(false)}
      className={cn(
        "absolute right-4 top-4 p-1 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none data-[state=open]:bg-(--ms-bg-elevated)",
        className
      )}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
}

export const Modal = {
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Header,
  Footer,
  Title,
  Description,
  Close,
}
