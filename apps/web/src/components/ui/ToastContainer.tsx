import { useEditorStore } from '@/store/editorStore'
import type { ToastInfo } from '@/store/slices/uiSlice'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type ToastPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-center'

interface ContainerProps {
  position?: ToastPosition
}

const positionClasses: Record<ToastPosition, string> = {
  'bottom-right': 'bottom-6 right-6 items-end',
  'bottom-left': 'bottom-6 left-6 items-start',
  'top-right': 'top-6 right-6 items-end',
  'top-left': 'top-6 left-6 items-start',
  'top-center': 'top-6 left-1/2 -translate-x-1/2 items-center',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2 items-center',
}

export function ToastContainer({ position = 'bottom-right' }: ContainerProps) {
  const toasts = useEditorStore((state) => state.toasts)
  const dismissToast = useEditorStore((state) => state.dismissToast)

  return (
    <div className={`fixed ${positionClasses[position]} z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4`}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            position={position}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  toast: ToastInfo
  onDismiss: (id: string) => void
  position: ToastPosition
}

const getAnimationProps = (position: ToastPosition) => {
  const isRight = position.includes('right')
  const isLeft = position.includes('left')
  const isTop = position.includes('top')
  
  const xOffset = isRight ? 80 : isLeft ? -80 : 0
  const yOffset = isTop ? -40 : 40

  return {
    initial: { opacity: 0, x: xOffset, y: xOffset === 0 ? yOffset : 0, scale: 0.95 },
    animate: { opacity: 1, x: 0, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, y: isTop ? -20 : 20, transition: { duration: 0.15 } },
    transition: { type: 'spring' as const, damping: 25, stiffness: 350 }
  }
}

function ToastItem({ toast, onDismiss, position }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, 5000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const anim = getAnimationProps(position)

  return (
    <motion.div
      layout
      initial={anim.initial}
      animate={anim.animate}
      exit={anim.exit}
      transition={anim.transition}
      className="flex items-start gap-3 bg-(--ms-bg-surface)/90 backdrop-blur-md border border-(--ms-border) shadow-2xl rounded-xl p-3.5 pointer-events-auto w-full flex-row"
    >
      {toast.type === 'success' && <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />}
      {toast.type === 'error' && <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />}
      {toast.type === 'info' && <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />}

      <div className="flex-1 text-xs text-(--ms-text-primary) font-medium leading-normal pr-1.5 select-none">
        {toast.message}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="text-(--ms-text-muted) hover:text-(--ms-text-primary) cursor-pointer border-none bg-transparent p-0 flex items-center justify-center shrink-0 transition-colors"
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}
