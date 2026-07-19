import { useState, useRef, useEffect } from 'react'
import { Info, HelpCircle, AlertTriangle, Star } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { HotspotCard } from './HotspotCard'
import type { HotspotContent } from '@motionslides/shared'
import { usePermissions } from '@/context/PermissionContext'

interface Props {
  content: HotspotContent
  elementId: string
  pulseEffect?: boolean
}

export function HotspotElement({ content, elementId, pulseEffect }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const { isReadOnly } = usePermissions()
  const containerRef = useRef<HTMLDivElement>(null)

  const IconComponent = (() => {
    switch (content.iconType) {
      case 'question': return HelpCircle
      case 'warning': return AlertTriangle
      case 'star': return Star
      case 'info':
      default: return Info
    }
  })()

  // Close card when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const badgeColor = content.color || '#3b82f6'

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center pointer-events-auto cursor-pointer"
      onClick={handleClick}
    >
      <div 
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95 ${
          pulseEffect ? 'animate-ripple-pulse' : ''
        }`}
        style={{ 
          backgroundColor: badgeColor,
          boxShadow: `0 0 12px ${badgeColor}40`
        }}
      >
        <IconComponent size={16} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <HotspotCard
            title={content.title}
            body={content.body}
            color={badgeColor}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
