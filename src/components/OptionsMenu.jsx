import { useEffect, useId, useRef, useState } from 'react'
import { DotsIcon } from './Icons.jsx'

/*
  A disclosure menu: a button that shows/hides a list of buttons.
  We deliberately don't use role="menu" - that ARIA pattern promises
  arrow-key navigation and typeahead. Plain buttons that you Tab through are
  simpler and fully accessible. Esc and clicking outside close it.
*/
export default function OptionsMenu({ label, items, triggerRef, triggerContent, triggerClassName }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const ownRef = useRef(null)
  const buttonRef = triggerRef ?? ownRef
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function close({ restoreFocus = true } = {}) {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation()
          close()
        }
      }}
      onBlur={(event) => {
        // Close when focus moves somewhere outside the menu.
        if (open && !wrapperRef.current.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={
          triggerClassName ??
          'grid size-8 place-items-center text-ink-soft hover:bg-panel-2 hover:text-ink aria-expanded:bg-panel-2 aria-expanded:text-ink'
        }
      >
        {triggerContent ?? <DotsIcon />}
      </button>

      {open && (
        <ul
          id={menuId}
          className="absolute right-0 top-full z-30 mt-1 w-52 animate-slide-up border border-line-strong bg-panel py-1 shadow-[4px_4px_0_var(--color-grid),0_10px_30px_rgb(0_0_0/0.18)]"
        >
          {items
            .filter((item) => !item.hidden)
            .map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    // Actions that open something else (rename, dialogs)
                    // manage focus themselves.
                    close({ restoreFocus: !item.keepFocus })
                    item.onSelect()
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-panel-2 disabled:opacity-40 disabled:hover:bg-transparent ${
                    item.danger ? 'text-overdue' : ''
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
