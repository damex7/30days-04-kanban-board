import Button from './Button.jsx'
import Modal from './Modal.jsx'

/** A styled, accessible replacement for window.confirm(). */
export default function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm leading-relaxed">{message}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        {/* Focus starts on Cancel: the safe choice is the default one */}
        <Button data-autofocus onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
