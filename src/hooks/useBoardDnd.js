import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  closestCenter,
  getFirstCollision,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useBoardDispatch, useBoardState } from '../state/BoardContext.jsx'
import { boardActions, findColumnId } from '../state/boardReducer.js'

/*
  Keyboard moves: sortableKeyboardCoordinates jumps to the nearest droppable
  in the arrow's direction. While a COLUMN is dragged, the task cards inside
  columns would count as "nearest", so we hand it a view that only contains
  columns.
*/
function keyboardCoordinates(event, args) {
  const { active, droppableContainers } = args.context
  if (active?.data.current?.type !== 'column') return sortableKeyboardCoordinates(event, args)

  const columnsOnly = {
    getEnabled: () => droppableContainers.getEnabled().filter((c) => c.data.current?.type === 'column'),
    get: (id) => droppableContainers.get(id),
  }
  return sortableKeyboardCoordinates(event, {
    ...args,
    context: { ...args.context, droppableContainers: columnsOnly },
  })
}

/*
  All drag-and-drop logic lives here, so Board.jsx only has to spread the
  returned props onto <DndContext>. The hook never changes state directly:
  every change goes through dispatch(), just like a button click.

  Lifecycle:
    dragStart  -> remember a snapshot of the columns (for cancel)
    dragOver   -> task crossed into ANOTHER column: MOVE_TASK right away so
                  the cards in that column make room (live preview)
    dragEnd    -> final MOVE_TASK (reorder within the column) or REORDER_COLUMN
    dragCancel -> Esc: RESTORE_SNAPSHOT puts everything back
*/
export function useBoardDnd() {
  const board = useBoardState()
  const dispatch = useBoardDispatch()

  const [active, setActive] = useState(null) // { id, type }
  const snapshot = useRef(null)
  const lastOverId = useRef(null)
  const movedToNewColumn = useRef(false)

  // Announcement callbacks are called by dnd-kit later; a ref guarantees they
  // read the latest board rather than the one from an old render.
  const boardRef = useRef(board)
  boardRef.current = board

  /*
    Sensors decide WHAT input starts a drag.
    - PointerSensor covers mouse, pen and touch (they're all pointer events).
      `distance: 4` means a tiny wobble while clicking won't start a drag.
      Touch scrolling still works because only the grip handle has
      `touch-action: none`; the rest of the card scrolls normally.
    - KeyboardSensor: Space/Enter picks up, arrows move, Space/Enter drops,
      Esc cancels. sortableKeyboardCoordinates moves to the next item instead
      of nudging a few pixels at a time.
  */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  )

  // After a cross-column move, let the layout settle for one frame before
  // trusting collisions again (prevents items flickering back and forth).
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      movedToNewColumn.current = false
    })
    return () => cancelAnimationFrame(frame)
  }, [board.columns])

  /*
    Collision detection decides WHAT the dragged item is over.
    - Dragging a column: only other columns count.
    - Dragging a task: first find the column under the pointer, then the
      closest task inside it. An empty column has no tasks, so the column
      itself is the target - that's what makes empty columns droppable.
  */
  const collisionDetection = useCallback((args) => {
    if (args.active.data.current?.type === 'column') {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === 'column'),
      })
    }

    const pointerHits = pointerWithin(args) // mouse/touch
    const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args) // keyboard
    let overId = getFirstCollision(hits, 'id')

    if (overId != null) {
      const container = args.droppableContainers.find((c) => c.id === overId)
      if (container?.data.current?.type === 'column') {
        const taskIds = container.data.current.taskIds
        if (taskIds.length > 0) {
          const closest = closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter((c) => taskIds.includes(c.id)),
          })
          overId = getFirstCollision(closest, 'id') ?? overId
        }
      }
      lastOverId.current = overId
      return [{ id: overId }]
    }

    if (movedToNewColumn.current) lastOverId.current = args.active.id
    return lastOverId.current ? [{ id: lastOverId.current }] : []
  }, [])

  const columnOf = (state, id) => (state.columns[id] ? id : findColumnId(state, id))

  /**
   * Where would the active task land if dropped on `over` right now?
   * Indexes are into the FULL taskIds list, so hidden (filtered-out) tasks
   * keep their positions.
   */
  function dropTarget(state, activeId, over) {
    const toColumnId = columnOf(state, over.id)
    if (!toColumnId) return null
    const taskIds = state.columns[toColumnId].taskIds
    if (over.id === toColumnId) {
      // Over the column itself (empty area): keep position if already here,
      // otherwise go to the end.
      const current = taskIds.indexOf(activeId)
      return { toColumnId, index: current >= 0 ? current : taskIds.length }
    }
    return { toColumnId, index: taskIds.indexOf(over.id) }
  }

  function handleDragStart({ active }) {
    snapshot.current = board.columns
    setActive({ id: active.id, type: active.data.current?.type })
  }

  function handleDragOver({ active, over }) {
    if (!over || active.data.current?.type !== 'task') return
    const fromColumnId = findColumnId(board, active.id)
    const toColumnId = columnOf(board, over.id)
    if (!fromColumnId || !toColumnId || fromColumnId === toColumnId) return

    const taskIds = board.columns[toColumnId].taskIds
    let index = taskIds.length
    if (over.id !== toColumnId) {
      // Over a task: go above it, or below it if we're past its middle.
      const overIndex = taskIds.indexOf(over.id)
      const activeRect = active.rect.current.translated
      const below = activeRect && activeRect.top > over.rect.top + over.rect.height / 2
      index = overIndex + (below ? 1 : 0)
    }
    movedToNewColumn.current = true
    dispatch(boardActions.moveTask(active.id, toColumnId, index))
  }

  function handleDragEnd({ active, over }) {
    setActive(null)
    const type = active.data.current?.type

    if (!over) {
      // Dropped outside the board: treat it like a cancel.
      if (snapshot.current) dispatch(boardActions.restoreSnapshot(snapshot.current))
      snapshot.current = null
      return
    }
    snapshot.current = null

    if (type === 'column') {
      const fromIndex = board.columnOrder.indexOf(active.id)
      const toIndex = board.columnOrder.indexOf(over.id)
      if (toIndex >= 0) dispatch(boardActions.reorderColumn(fromIndex, toIndex))
      return
    }

    const target = dropTarget(board, active.id, over)
    if (target && target.index >= 0) {
      dispatch(boardActions.moveTask(active.id, target.toColumnId, target.index))
    }
  }

  function handleDragCancel() {
    setActive(null)
    if (snapshot.current) dispatch(boardActions.restoreSnapshot(snapshot.current))
    snapshot.current = null
  }

  /*
    Screen-reader announcements. dnd-kit reads these out through a hidden
    aria-live region. We describe things by NAME and POSITION, not by id.
  */
  const accessibility = useMemo(() => {
    // Right after pick-up, dnd-kit reports the item as "over" its own slot.
    // Announcing that would instantly replace "Picked up…" in the live
    // region, so the first self-over is skipped.
    let justPickedUp = false
    const titleOf = (id) => boardRef.current.tasks[id]?.title ?? boardRef.current.columns[id]?.title ?? 'item'
    const isColumn = (item) => item?.data.current?.type === 'column'

    function taskPosition(state, columnId, taskId) {
      const ids = state.columns[columnId]?.taskIds ?? []
      const index = ids.indexOf(taskId)
      return { column: state.columns[columnId]?.title, position: index + 1, total: ids.length }
    }

    return {
      screenReaderInstructions: {
        draggable:
          'To pick up a task or column, press Space or Enter. ' +
          'While dragging, use the arrow keys to move it: up and down within a column, left and right between columns. ' +
          'Press Space or Enter again to drop it, or Escape to cancel.',
      },
      announcements: {
        onDragStart({ active }) {
          justPickedUp = true
          const state = boardRef.current
          if (isColumn(active)) {
            const index = state.columnOrder.indexOf(active.id)
            return `Picked up column ${titleOf(active.id)}. It is column ${index + 1} of ${state.columnOrder.length}.`
          }
          const p = taskPosition(state, findColumnId(state, active.id), active.id)
          return `Picked up task ${titleOf(active.id)}. It is in ${p.column}, position ${p.position} of ${p.total}.`
        },
        onDragOver({ active, over }) {
          const skip = justPickedUp && over?.id === active.id
          justPickedUp = false
          if (skip) return undefined
          const state = boardRef.current
          if (!over) return `${titleOf(active.id)} is no longer over a drop area.`
          if (isColumn(active)) {
            return `Column ${titleOf(active.id)} moved to position ${state.columnOrder.indexOf(over.id) + 1} of ${state.columnOrder.length}.`
          }
          const target = dropTarget(state, active.id, over)
          if (!target) return undefined
          const column = state.columns[target.toColumnId]
          if (target.index >= column.taskIds.length || column.taskIds.length === 0) {
            return `Task ${titleOf(active.id)} is over ${column.title}, at the end.`
          }
          return `Task ${titleOf(active.id)} is over ${column.title}, position ${target.index + 1} of ${column.taskIds.length}.`
        },
        onDragEnd({ active, over }) {
          const state = boardRef.current
          if (!over) return `${titleOf(active.id)} was dropped outside the board and returned to where it was.`
          if (isColumn(active)) {
            return `Column ${titleOf(active.id)} dropped at position ${state.columnOrder.indexOf(over.id) + 1} of ${state.columnOrder.length}.`
          }
          const target = dropTarget(state, active.id, over)
          if (!target) return undefined
          const column = state.columns[target.toColumnId]
          const position = Math.min(target.index, column.taskIds.length - 1) + 1
          return `Task ${titleOf(active.id)} dropped in ${column.title}, position ${position} of ${column.taskIds.length}.`
        },
        onDragCancel({ active }) {
          return `Moving ${titleOf(active.id)} was cancelled. It went back to where it started.`
        },
      },
    }
  }, [])

  return {
    activeItem: active,
    dndContextProps: {
      sensors,
      collisionDetection,
      // Re-measure while dragging, because cards move between columns.
      measuring: { droppable: { strategy: MeasuringStrategy.Always } },
      accessibility,
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel,
    },
  }
}
