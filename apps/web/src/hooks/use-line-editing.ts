import { useRef, useEffect } from 'react'
import { useEditorStore } from '@/store/editor-store'
import type { LineContent } from '@motionslides/shared'

export function useLineEditing(elementId: string, content: LineContent) {
  const isEditingId = useEditorStore(state => state.isEditingId)
  const setEditingId = useEditorStore(state => state.setEditingId)
  const updateElement = useEditorStore(state => state.updateElement)

  const isEditing = isEditingId === elementId
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleBlur = () => {
    if (inputRef.current) {
      updateElement(elementId, {
        content: { ...content, label: inputRef.current.value }
      })
    }
    setEditingId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  return {
    isEditing,
    inputRef,
    handleBlur,
    handleKeyDown,
  }
}
