import { useId, useState } from 'react'
import { useBoardDispatch } from '../state/BoardContext.jsx'
import { boardActions } from '../state/boardReducer.js'
import Button from './Button.jsx'

/* Only needs dispatch, so it never re-renders when tasks change. */
export default function AddColumn() {
  const dispatch = useBoardDispatch()
  const [title, setTitle] = useState('')
  const inputId = useId()

  function handleSubmit(event) {
    event.preventDefault()
    const clean = title.trim()
    if (!clean) return
    dispatch(boardActions.addColumn(clean))
    setTitle('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-[min(86vw,300px)] shrink-0 snap-start flex-col gap-2 border border-dashed border-line-strong p-3"
    >
      <label htmlFor={inputId} className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
        New column
      </label>
      <input
        id={inputId}
        value={title}
        maxLength={40}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Review"
        className="w-full border border-line-strong bg-panel-2 px-3 py-2 text-sm"
      />
      <Button type="submit" variant="ghost" disabled={!title.trim()}>
        Add column
      </Button>
    </form>
  )
}
