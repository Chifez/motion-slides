import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DropdownContextType {
  open: boolean
  setOpen: (open: boolean) => void
}
const DropdownContext = createContext<DropdownContextType | undefined>(undefined)

function useDropdown() {
  const context = useContext(DropdownContext)
  if (!context) throw new Error('Dropdown components must be used within a <Dropdown.Root>')
  return context
}

export function Root({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      window.addEventListener('click', handleClickOutside)
    }
    return () => {
      window.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export function Trigger({ children, asChild }: { children: React.ReactElement<any>, asChild?: boolean }) {
  const { open, setOpen } = useDropdown()
  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as any
    return React.cloneElement(children, {
      ...childProps,
      onClick: (e: any) => {
        childProps.onClick?.(e)
        setOpen(!open)
      }
    })
  }
  return <button onClick={() => setOpen(!open)}>{children}</button>
}

export function Content({ children, className, align = 'start' }: { children: React.ReactNode, className?: string, align?: 'start' | 'end' }) {
  const { open } = useDropdown()
  
  const alignClasses = align === 'start' ? 'left-0' : 'right-0'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -5 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            "absolute z-50 mt-2 min-w-[8rem] rounded-md border border-(--ms-border) bg-(--ms-bg-surface) shadow-lg p-1 origin-top",
            alignClasses,
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Item({ children, className, onSelect, disabled }: { children: React.ReactNode, className?: string, onSelect?: () => void, disabled?: boolean }) {
  const { setOpen } = useDropdown()
  
  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) {
          onSelect?.()
          setOpen(false)
        }
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-(--ms-bg-elevated) hover:text-(--ms-text-primary) data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      {children}
    </button>
  )
}

export const Dropdown = {
  Root,
  Trigger,
  Content,
  Item
}
