import { useBoardState } from '../state/BoardContext.jsx'
import AddColumn from './AddColumn.jsx'
import Column from './Column.jsx'
import EmptyBoard from './EmptyBoard.jsx'

export default function Board() {
  const board = useBoardState()

  if (board.columnOrder.length === 0) return <EmptyBoard />

  return (
    /*
      The horizontal strip. On phones, scroll-snap makes each column settle
      neatly into view; from `sm` up, free scrolling feels better.
      tabIndex makes the scroll area reachable by keyboard (arrow keys scroll).
    */
    <div
      role="region"
      aria-label="Board columns"
      tabIndex={0}
      className="scroll-thin flex snap-x snap-mandatory items-start gap-4 overflow-x-auto scroll-px-4 px-4 pb-10 pt-2 sm:snap-none sm:px-6"
    >
      {board.columnOrder.map((columnId, index) => (
        <Column key={columnId} columnId={columnId} index={index} />
      ))}
      <AddColumn />
    </div>
  )
}
