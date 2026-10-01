import { useEffect, useId, useRef } from 'react'
import { CloseIcon } from './Icons.jsx'

/*
  A thin wrapper around the native <dialog>. showModal() gives us, for free:
  - a focus trap (Tab can't leave the dialog)
  - Esc to close (the "cancel" event)
  - everything behind it made inert for mouse, keyboard and screen readers
  - the ::backdrop pseudo-element
  We only add: open/close from a React prop, closing on backdrop click, and
  returning focus to whatever opened the dialog.
*/
export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const dialogRef = useRef(null)
  const openerRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      openerRef.current = document.activeElement
      dialog.showModal()
      // showModal() moves focus on its own, which can undo React's autoFocus
      // (that runs earlier, during commit). So we pick the target explicitly.
      dialog.querySelector('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
      // The opener may have been removed (e.g. a deleted card), so check.
      const opener = openerRef.current
      if (opener?.isConnected) opener.focus()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault() // let React state decide when it closes
        onClose()
      }}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) = backdrop.
        if (event.target === dialogRef.current) onClose()
      }}
      className={`m-auto max-h-[92dvh] w-[calc(100vw-1.5rem)] overflow-hidden bg-transparent p-px text-ink ${
        size === 'sm' ? 'max-w-sm' : 'max-w-lg'
      }`}
    >
      {open && (
        // The tick marks overflow by 1px, so the frame itself never scrolls;
        // only the body below the header does.
        <div className="ticks flex max-h-[92dvh] animate-slide-up flex-col border border-line-strong bg-panel shadow-2xl">
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <h2 id={titleId} className="font-mono text-xs font-semibold uppercase tracking-[0.18em]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 grid size-9 place-items-center text-ink-soft hover:text-ink"
              aria-label="Close dialog"
            >
              <CloseIcon />
            </button>
          </header>
          <div className="scroll-thin overflow-y-auto p-5">{children}</div>
        </div>
      )}
    </dialog>
  )
}
