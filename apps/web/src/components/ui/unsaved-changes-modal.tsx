import { Save, LogOut } from 'lucide-react'
import { Modal } from '@/components/ui/core/Modal'
import { Button } from '@/components/ui/core/Button'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onDiscard: () => void
}

export function UnsavedChangesModal({ isOpen, onClose, onConfirm, onDiscard }: Props) {
  return (
    <Modal.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Portal>
        <Modal.Overlay className="bg-black/80" />
        <Modal.Content>
          <Modal.Header className="flex-row items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <Save size={24} />
            </div>
            <div className="flex-1">
              <Modal.Title>Unsaved Changes</Modal.Title>
              <Modal.Description className="mt-1 leading-relaxed">
                You have changes that haven't been synced to the cloud yet.
                Would you like to save them before leaving?
              </Modal.Description>
            </div>
            <Modal.Close className="relative right-0 top-0" />
          </Modal.Header>

          <Modal.Footer className="flex-col gap-2 p-6 pt-2 border-none">
            <Button
              variant="primary"
              onClick={onConfirm}
              className="w-full h-11"
            >
              <Save size={16} className="mr-2" />
              Save and Leave
            </Button>

            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                onClick={onDiscard}
                className="flex-1"
              >
                <LogOut size={16} className="mr-2" />
                Leave Anyway
              </Button>
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Stay
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Portal>
    </Modal.Root>
  )
}
