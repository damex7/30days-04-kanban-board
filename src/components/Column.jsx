import { useId, useRef, useState } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { toTranslate } from '../lib/transform.js'
import { useBoardDispatch, useBoardState } from '../state/BoardContext.jsx'
import { boardActions } from '../state/boardReducer.js'
import { useUI } from '../state/UIContext.jsx'
import OptionsMenu from './OptionsMenu.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { CheckIcon, GripIcon, PlusIcon } from './Icons.jsx'
import TaskCard from './TaskCard.jsx'

const pad2 = (n) => String(n).padStart(2, '0')

/** visibleTaskIds: the tasks to show (search/filters may hide some). */
export default function Column({ columnId, index, visibleTaskIds, isFiltered }) {
  const board = useBoardState()
  const dispatch = useBoardDispatch()
  const { openNewTask } = useUI()
  const column = board.columns[columnId]
  const headingId = useId()
  const menuButtonRef = useRef(null)

  const [renaming, setRenaming] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  /*
    The column is BOTH a sortable item (columns can be reordered) and the
    drop container for its tasks. data.taskIds lets the collision detector
    look for the closest task inside this column.
  */
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: columnId,
    data: { type: 'column', taskIds: visibleTaskIds },
    attributes: { roleDescription: 'draggable column' },
  })

  const total = board.columnOrder.length
  const count = column.taskIds.length
  const shown = visibleTaskIds.length

  function requestDelete() {
    if (count > 0) setConfirmingDelete(true)
    else dispatch(boardActions.deleteColumn(columnId))
  }

  function finishRename(title) {
    const clean = title?.trim().slice(0, 40)
    if (clean) dispatch(boardActions.renameColumn(columnId, clean))
    setRenaming(false)
    // The input is about to disappear; put focus somewhere sensible.
    requestAnimationFrame(() => menuButtonRef.current?.focus())
  }

  return (
    <section
      ref={setNodeRef}
      style={{ transform: toTranslate(transform), transition }}
      aria-labelledby={headingId}
      className={`ticks flex w-[min(86vw,300px)] shrink-0 snap-start flex-col border bg-panel/85 ${
        isDragging ? 'border-2 border-dashed border-accent bg-accent/10' : 'border-line-strong'
      }`}
    >
      {/* opacity-0 while dragging: the dashed outline is the drop indicator */}
      <div className={`flex flex-1 flex-col ${isDragging ? 'opacity-0' : ''}`}>
      <header className="flex items-center gap-1.5 border-b border-line-strong py-2.5 pl-1.5 pr-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Move column: ${column.title}`}
          className="grid h-10 w-7 shrink-0 cursor-grab touch-none place-items-center text-ink-soft hover:bg-panel-2 hover:text-ink active:cursor-grabbing"
        >
          <GripIcon />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
            Col-{pad2(index + 1)}
            {column.isDone && (
              <span className="inline-flex items-center gap-0.5 text-low">
                · <CheckIcon className="size-3" /> Done
              </span>
            )}
          </p>
          {renaming ? (
            <RenameInput label={`Rename column ${column.title}`} initial={column.title} onDone={finishRename} />
          ) : (
            <h2 id={headingId} className="truncate font-display text-lg font-semibold leading-tight">
              {column.title}
            </h2>
          )}
        </div>

        {/* "02/07" while filtering, "07" otherwise */}
        <span
          className="border border-line-strong px-1.5 font-mono text-xs font-semibold tabular-nums leading-6"
          aria-label={isFiltered ? `${shown} of ${count} tasks shown` : `${count} ${count === 1 ? 'task' : 'tasks'}`}
        >
          {isFiltered ? `${pad2(shown)}/${pad2(count)}` : pad2(count)}
        </span>

        <OptionsMenu
          triggerRef={menuButtonRef}
          label={`Options for column ${column.title}`}
          items={[
            { label: 'Rename', onSelect: () => setRenaming(true), keepFocus: true },
            {
              label: column.isDone ? 'Unmark as done column' : 'Mark as done column',
              onSelect: () => dispatch(boardActions.toggleColumnDone(columnId)),
            },
            { label: 'Move left', disabled: index === 0, onSelect: () => dispatch(boardActions.reorderColumn(index, index - 1)) },
            { label: 'Move right', disabled: index === total - 1, onSelect: () => dispatch(boardActions.reorderColumn(index, index + 1)) },
            { label: 'Delete column', danger: true, onSelect: requestDelete },
          ]}
        />
      </header>

      <div className="p-2">
        <button
          type="button"
          onClick={() => openNewTask(columnId)}
          className="flex w-full items-center justify-center gap-1.5 border border-dashed border-line-strong py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft hover:border-accent hover:text-ink"
        >
          <PlusIcon className="size-3.5" /> Add task
          <span className="sr-only"> to {column.title}</span>
        </button>
      </div>

      {/* The column's own sortable list. Items are the VISIBLE ids only. */}
      <SortableContext items={visibleTaskIds} strategy={verticalListSortingStrategy}>
        <ul className="flex min-h-28 flex-1 flex-col gap-2 px-2 pb-3">
          {visibleTaskIds.map((taskId) => (
            <TaskCard key={taskId} task={board.tasks[taskId]} isDone={column.isDone} />
          ))}
          {shown === 0 && (
            <li className="grid flex-1 place-items-center border border-dashed border-line px-4 py-6 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                {count === 0 ? (
                  <>
                    No tasks here yet.
                    <br />
                    Add one, or drag a card in.
                  </>
                ) : (
                  `No matches · ${count} hidden`
                )}
              </p>
            </li>
          )}
        </ul>
      </SortableContext>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete column"
        message={`"${column.title}" has ${count} ${count === 1 ? 'task' : 'tasks'}. Deleting the column deletes ${count === 1 ? 'it' : 'them'} too. This can't be undone.`}
        confirmLabel="Delete column"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false)
          dispatch(boardActions.deleteColumn(columnId))
        }}
      />
    </section>
  )
}

/** The floating copy shown in the DragOverlay while a column is dragged. */
export function ColumnPreview({ columnId }) {
  const board = useBoardState()
  const column = board.columns[columnId]
  if (!column) return null
  return (
    <div className="w-[min(86vw,300px)] rotate-[1deg] border border-line-strong bg-panel shadow-[0_18px_40px_rgb(0_0_0/0.3)] ring-2 ring-accent">
      <div className="flex items-center gap-2 border-b border-line-strong px-3 py-3">
        <GripIcon className="size-4 text-ink-soft" />
        <span className="flex-1 truncate font-display text-lg font-semibold">{column.title}</span>
        <span className="border border-line-strong px-1.5 font-mono text-xs font-semibold leading-6">{pad2(column.taskIds.length)}</span>
      </div>
      <ul className="space-y-1.5 p-2">
        {column.taskIds.slice(0, 4).map((id) => (
          <li key={id} className="truncate border border-line px-2 py-1.5 text-sm">
            {board.tasks[id].title}
          </li>
        ))}
        {column.taskIds.length > 4 && (
          <li className="px-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">+{column.taskIds.length - 4} more</li>
        )}
      </ul>
    </div>
  )
}

/** Enter or blur saves, Esc cancels. `finished` stops a double save. */
function RenameInput({ label, initial, onDone }) {
  const [value, setValue] = useState(initial)
  const finished = useRef(false)
  const finish = (result) => {
    if (finished.current) return
    finished.current = true
    onDone(result)
  }
  return (
    <input
      autoFocus
      aria-label={label}
      value={value}
      maxLength={40}
      onChange={(e) => setValue(e.target.value)}
      onFocus={(e) => e.target.select()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(value)
        if (e.key === 'Escape') finish(null)
      }}
      onBlur={() => finish(value)}
      className="w-full border border-accent bg-panel-2 px-1.5 font-display text-lg font-semibold leading-tight"
    />
  )
}
