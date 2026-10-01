import { useBoardState } from '../state/BoardContext.jsx'
import { todayISO } from '../lib/dates.js'

/* The page header, styled like the title block in a drawing's corner. */
export default function Header({ children }) {
  const board = useBoardState()
  const taskCount = Object.keys(board.tasks).length

  return (
    <header className="px-4 pb-4 pt-5 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-ink-soft">
            Sheet 04 / 30 · Rev {todayISO()}
          </p>
          <h1 className="font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl">
            Blueprint<span className="text-accent">/</span>Kanban
          </h1>
        </div>
        <dl className="flex border border-line-strong font-mono text-[11px] uppercase tracking-[0.14em]">
          <div className="border-r border-line-strong px-3 py-1.5">
            <dt className="text-ink-soft">Columns</dt>
            <dd className="font-semibold tabular-nums">{board.columnOrder.length}</dd>
          </div>
          <div className="px-3 py-1.5">
            <dt className="text-ink-soft">Tasks</dt>
            <dd className="font-semibold tabular-nums">{taskCount}</dd>
          </div>
        </dl>
      </div>
      {children}
    </header>
  )
}
