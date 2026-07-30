import { Sun, Moon } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { memo } from 'react'

interface Props {
  showLabel?: boolean
  className?: string
}

/**
 * Global theme switcher.
 * DOM synchronization is handled by the store actions and a blocking head script to prevent FOUC.
 */
export const ThemeToggle = memo(function ThemeToggle({ showLabel = false, className = "" }: Props) {
  const theme = useEditorStore(s => s.theme)
  const toggleTheme = useEditorStore(s => s.toggleTheme)

  return (
    <button
      onClick={() => toggleTheme()}
      className={`inline-flex items-center gap-2 p-2 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition border-none bg-transparent cursor-pointer ${className}`}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      {showLabel && <span className="text-xs font-medium">{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>}
    </button>
  )
})
