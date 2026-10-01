import { useEffect, useRef } from 'react'
import { useBoardDispatch, useBoardState } from '../state/BoardContext.jsx'
import { boardActions } from '../state/boardReducer.js'

const TIMEOUT_MS = 6000

/*
  "Task deleted · Undo". The reducer keeps the last deleted task in
  state.lastDeleted; this bar just offers to dispatch UNDO_DELETE.
*/
export default function UndoBar() {
  const { lastDeleted } = useBoardState()
  const dispatch = useBoardDispatch()
  const undoRef = useRef(null)

  // Auto-dismiss. Each new delete restarts the timer (lastDeleted changes).
  // While the Undo button has focus we wait, so it never vanishes under a
  // keyboard user who is about to press it.
  useEffect(() => {
    if (!lastDeleted) return
    let timer
    const tick = () => {
      if (document.activeElement === undoRef.current) timer = setTimeout(tick, 1500)
      else dispatch(boardActions.clearUndo())
    }
    timer = setTimeout(tick, TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [lastDeleted, dispatch])

  // Deleting removes the card that had focus. If focus fell back to <body>,
  // put it on Undo so keyboard users aren't stranded at the top of the page.
  useEffect(() => {
    if (!lastDeleted) return
    const frame = requestAnimationFrame(() => {
      if (document.activeElement === document.body) undoRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [lastDeleted])

  // Ctrl+Z / Cmd+Z, unless the user is typing in a field (where it should
  // undo their typing instead).
  useEffect(() => {
    if (!lastDeleted) return
    const onKeyDown = (event) => {
      const typing = event.target.closest?.('input, textarea, select, [contenteditable]')
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey && !typing) {
        event.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lastDeleted]) // eslint-disable-line react-hooks/exhaustive-deps -- undo() only reads lastDeleted

  function undo() {
    const id = lastDeleted.task.id
    dispatch(boardActions.undoDelete())
    // Once the card is back, move focus to it.
    requestAnimationFrame(() => document.querySelector(`[data-task-id="${id}"] h3 button`)?.focus())
  }

  return (
    // The live region is ALWAYS in the DOM; only its content changes. Screen
    // readers announce changes to an existing region, not a newly added one.
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      {lastDeleted && (
        <div className="ticks pointer-events-auto flex animate-slide-up items-center gap-4 border border-ink bg-ink py-2 pl-4 pr-2 text-panel shadow-xl">
          <span className="font-mono text-xs uppercase tracking-[0.14em]">
            Task deleted<span className="sr-only">: {lastDeleted.task.title}</span>
          </span>
          <button
            ref={undoRef}
            type="button"
            onClick={undo}
            className="border border-accent bg-accent px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-on-accent hover:brightness-110"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
