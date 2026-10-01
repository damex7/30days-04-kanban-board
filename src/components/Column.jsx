import { useId, useRef, useState } from 'react'
import { useBoardDispatch, useBoardState } from '../state/BoardContext.jsx'
import { boardActions } from '../state/boardReducer.js'
import { useUI } from '../state/UIContext.jsx'
import ColumnMenu from './ColumnMenu.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { CheckIcon, PlusIcon } from './Icons.jsx'
import TaskCardView from './TaskCardView.jsx'

const pad2 = (n) => String(n).padStart(2, '0')

export default function Column({ columnId, index }) {
  const board = useBoardState()
  const dispatch = useBoardDispatch()
  const { openNewTask, openTask } = useUI()
  const column = board.columns[columnId]
  const headingId = useId()
  const menuButtonRef = useRef(null)

  const [renaming, setRenaming] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const total = board.columnOrder.length
  const count = column.taskIds.length

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
      aria-labelledby={headingId}
      className="ticks flex w-[min(86vw,300px)] shrink-0 snap-start flex-col border border-line-strong bg-panel/85 backdrop-blur-[1px]"
    >
      <header className="flex items-center gap-2 border-b border-line-strong px-3 py-2.5">
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

        <span
          className="border border-line-strong px-1.5 font-mono text-xs font-semibold tabular-nums leading-6"
          aria-label={`${count} ${count === 1 ? 'task' : 'tasks'}`}
        >
          {pad2(count)}
        </span>

        <ColumnMenu
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

      <ul className="flex min-h-28 flex-1 flex-col gap-2 px-2 pb-3">
        {column.taskIds.map((taskId) => (
          <li key={taskId}>
            <TaskCardView task={board.tasks[taskId]} isDone={column.isDone} onOpen={() => openTask(taskId)} />
          </li>
        ))}
        {count === 0 && (
          <li className="grid flex-1 place-items-center border border-dashed border-line px-4 py-6 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
              No tasks here yet.
              <br />
              Add one, or drag a card in.
            </p>
          </li>
        )}
      </ul>

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
