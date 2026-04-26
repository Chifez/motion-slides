import { useAccessControl } from '@/hooks/useAccessControl'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Play, Zap, ZapOff } from 'lucide-react'

interface Props {
  startPresentation: () => void
}

/**
 * ViewerOverlay — Shown only in 'view' mode.
 * Provides a professional "Player" interface with an Autoplay toggle.
 */
export function ViewerOverlay({ startPresentation }: Props) {
  const { autoplay, mode } = useAccessControl()
  const navigate = useNavigate()
  const params = useParams({ from: '/p/$projectId' })

  const toggleAutoplay = () => {
    navigate({
      to: '/p/$projectId',
      params: { projectId: params.projectId },
      search: (prev: any) => ({ ...prev, autoplay: !autoplay ? 'true' : 'false' }),
      replace: true,
    })
  }

  if (mode !== 'view') return null

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-100 flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => startPresentation()}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2.5 rounded-full transition-all shadow-lg shadow-blue-600/20 active:scale-95"
      >
        <Play size={14} fill="currentColor" />
        Watch Presentation
      </button>

      <div className="w-px h-6 bg-white/10 mx-1" />

      <button
        onClick={toggleAutoplay}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-medium transition-all border border-transparent ${autoplay
            ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
            : 'hover:bg-white/5 text-neutral-400 hover:text-white'
          }`}
        title={autoplay ? 'Disable Autoplay' : 'Enable Autoplay'}
      >
        {autoplay ? <Zap size={13} className="fill-blue-400" /> : <ZapOff size={13} />}
        Autoplay {autoplay ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}
