import { createPortal } from 'react-dom'
import { defaultDropAnimationSideEffects, DndContext, DragOverlay } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { useBoardDnd } from '../hooks/useBoardDnd.js'
import { findColumnId } from '../state/boardReducer.js'
import { useBoardState } from '../state/BoardContext.jsx'
import AddColumn from './AddColumn.jsx'
import Column, { ColumnPreview } from './Column.jsx'
import EmptyBoard from './EmptyBoard.jsx'
import TaskCardView from './TaskCardView.jsx'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * visibleIds: { [columnId]: taskId[] } - which tasks each column shows
 * (search/filters may hide some). Defaults to all of them.
 */
export default function Board({ visibleIds, isFiltered = false }) {
  const board = useBoardState()
  const { activeItem, dndContextProps } = useBoardDnd()

  if (board.columnOrder.length === 0) return <EmptyBoard />

  const idsFor = (columnId) => visibleIds?.[columnId] ?? board.columns[columnId].taskIds

  return (
    <DndContext {...dndContextProps}>
      {/*
        The horizontal strip. On phones, scroll-snap makes each column settle
        neatly into view (switched off mid-drag so it can't fight auto-scroll).
        tabIndex makes the scroll area reachable by keyboard.
      */}
      <div
        role="region"
        aria-label="Board columns"
        tabIndex={0}
        className={`scroll-thin flex items-start gap-4 overflow-x-auto scroll-px-4 px-4 pb-10 pt-2 sm:px-6 ${
          activeItem ? '' : 'snap-x snap-mandatory sm:snap-none'
        }`}
      >
        <SortableContext items={board.columnOrder} strategy={horizontalListSortingStrategy}>
          {board.columnOrder.map((columnId, index) => (
            <Column
              key={columnId}
              columnId={columnId}
              index={index}
              visibleTaskIds={idsFor(columnId)}
              isFiltered={isFiltered}
            />
          ))}
        </SortableContext>
        <AddColumn />
      </div>

      {/*
        DragOverlay: the copy that follows your pointer/finger. Rendered in a
        portal on <body> so no parent's overflow or transform can clip it.
      */}
      {createPortal(
        <DragOverlay
          dropAnimation={
            prefersReducedMotion()
              ? null
              : { sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }
          }
        >
          {/*
            The plain <div> wrappers matter: dnd-kit measures the overlay's
            first child. If that child is rotated, its bounding box grows and
            keyboard moves pick the wrong neighbour. So the measured element
            stays unrotated and the tilt lives one level down.
          */}
          {activeItem?.type === 'task' && board.tasks[activeItem.id] && (
            <div>
              <TaskCardView
                task={board.tasks[activeItem.id]}
                isDone={board.columns[findColumnId(board, activeItem.id)]?.isDone}
                isOverlay
                handleProps={{ tabIndex: -1, 'aria-hidden': true }}
              />
            </div>
          )}
          {activeItem?.type === 'column' && (
            <div>
              <ColumnPreview columnId={activeItem.id} />
            </div>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}
