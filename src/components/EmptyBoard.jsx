import { useBoardDispatch } from '../state/BoardContext.jsx'
import { boardActions, emptyBoard } from '../state/boardReducer.js'
import { createSampleBoard } from '../state/sampleData.js'
import Button from './Button.jsx'

function defaultColumns() {
  const board = emptyBoard()
  for (const [id, title, isDone] of [
    ['col-todo', 'To do', false],
    ['col-doing', 'In progress', false],
    ['col-done', 'Done', true],
  ]) {
    board.columns[id] = { id, title, isDone, taskIds: [] }
    board.columnOrder.push(id)
  }
  return board
}

export default function EmptyBoard() {
  const dispatch = useBoardDispatch()
  return (
    <div className="mx-4 grid place-items-center py-16 sm:mx-6">
      <div className="ticks w-full max-w-md border border-line-strong bg-panel/85 p-8 text-center">
        {/* A tiny "empty drawing": three outlined column shapes. */}
        <svg viewBox="0 0 120 60" className="mx-auto h-16 text-line-strong" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeDasharray="3 3">
            <rect x="4" y="6" width="32" height="48" />
            <rect x="44" y="6" width="32" height="36" />
            <rect x="84" y="6" width="32" height="24" />
          </g>
        </svg>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Sheet is blank</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">No columns on this board</h2>
        <p className="mt-2 text-sm text-ink-soft">Start with the classic three columns, or load the demo board to explore.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="primary" onClick={() => dispatch(boardActions.replaceBoard(defaultColumns()))}>
            Add default columns
          </Button>
          <Button onClick={() => dispatch(boardActions.replaceBoard(createSampleBoard()))}>Load sample board</Button>
        </div>
      </div>
    </div>
  )
}
