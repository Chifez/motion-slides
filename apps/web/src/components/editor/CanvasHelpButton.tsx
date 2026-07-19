
import { Keyboard } from 'lucide-react'
import { ShortcutsHelper } from './ShortcutsHelper'

interface Props {
    isOpen: boolean
    onOpen: () => void
    onClose: () => void
}

export function CanvasHelpButton({ isOpen, onOpen, onClose }: Props) {
    return (
        <>
            <button
                onClick={onOpen}
                className="absolute bottom-4 right-4 z-[400] flex items-center justify-center p-2 rounded-lg bg-(--ms-bg-surface)/80 backdrop-blur border border-(--ms-border) hover:bg-(--ms-bg-surface) text-(--ms-text-secondary) hover:text-(--ms-text-primary) shadow-sm cursor-pointer transition hover:scale-105"
                title="Keyboard Shortcuts (Ctrl + /)"
            >
                <Keyboard size={16} />
            </button>
            <ShortcutsHelper isOpen={isOpen} onClose={onClose} />
        </>
    )
}