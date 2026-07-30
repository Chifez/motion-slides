import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/core/modal'
import { Button } from '@/components/ui/core/button'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  projectName: string
  title?: string
  description?: ReactNode
  confirmText?: string
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  title = 'Delete Project',
  description,
  confirmText = 'Delete Permanently'
}: Props) {
  return (
    <Modal.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Portal>
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Header className="flex-row items-start gap-4">
            <div className="p-3 rounded-xl bg-red-500/10 text-red-500 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <Modal.Title>{title}</Modal.Title>
              <Modal.Description className="mt-1 leading-relaxed">
                {description ?? (
                  <>
                    Are you sure you want to delete <span className="text-(--ms-text-primary) font-medium">"{projectName}"</span>?
                    This action cannot be undone and will permanently remove all slides and prototype data.
                  </>
                )}
              </Modal.Description>
            </div>
            <Modal.Close className="relative right-0 top-0" />
          </Modal.Header>
          <Modal.Footer className="border-t border-(--ms-border)/40 gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              className="flex-1" 
              onClick={() => {
                onConfirm()
                onClose()
              }}
            >
              {confirmText}
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Portal>
    </Modal.Root>
  )
}

