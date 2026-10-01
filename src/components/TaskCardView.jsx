import { formatDue, isOverdue, todayISO } from '../lib/dates.js'
import { CalendarIcon, GripIcon } from './Icons.jsx'

const PRIORITY_COLOR = {
  low: 'text-low',
  medium: 'text-medium',
  high: 'text-high',
}

/* Priority drawn like a dimension line on a technical drawing: |— HIGH —| */
export function PriorityTag({ priority }) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] ${PRIORITY_COLOR[priority]}`}>
      <span aria-hidden="true" className="h-2 w-2.5 border-l border-current bg-[linear-gradient(currentColor,currentColor)] bg-[length:100%_1px] bg-center bg-no-repeat" />
      <span>
        {priority}
        <span className="sr-only"> priority</span>
      </span>
      <span aria-hidden="true" className="h-2 w-2.5 border-r border-current bg-[linear-gradient(currentColor,currentColor)] bg-[length:100%_1px] bg-center bg-no-repeat" />
    </span>
  )
}

/**
 * Pure presentation: draws one task. Used by the sortable card on the board
 * AND by the floating copy in the DragOverlay, so they always look the same.
 *
 * handleProps: props for the drag handle button (from dnd-kit), if any.
 */
export default function TaskCardView({ task, isDone = false, onOpen, handleProps, handleRef, isOverlay = false }) {
  const today = todayISO()
  const overdue = !isDone && isOverdue(task.dueDate, today)
  const dueToday = !isDone && task.dueDate === today

  return (
    <article
      aria-label={task.title}
      className={`group relative border bg-panel p-3 transition-shadow ${
        overdue ? 'border-dashed border-overdue' : 'border-line-strong'
      } ${isOverlay ? 'rotate-[1.5deg] shadow-[6px_8px_0_var(--color-grid),0_18px_40px_rgb(0_0_0/0.25)] ring-2 ring-accent' : 'hover:shadow-[3px_3px_0_var(--color-line)]'}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <PriorityTag priority={task.priority} />
          {overdue && (
            <span className="-rotate-2 border-2 border-overdue px-1.5 font-mono text-[10px] font-bold uppercase leading-4 tracking-[0.18em] text-overdue">
              Overdue
            </span>
          )}
        </div>

        {/* The drag handle. dnd-kit puts its listeners and ARIA attributes here. */}
        <button
          type="button"
          ref={handleRef}
          {...handleProps}
          className="relative z-10 -mr-1 -mt-1 grid size-8 shrink-0 cursor-grab touch-none place-items-center text-ink-soft hover:bg-panel-2 hover:text-ink active:cursor-grabbing"
          aria-label={`Move task: ${task.title}`}
        >
          <GripIcon />
        </button>
      </div>

      <h3 className="mt-1.5 font-display text-[15px] font-medium leading-snug">
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="text-left decoration-accent decoration-2 underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {task.title}
          </button>
        ) : (
          task.title
        )}
      </h3>

      {task.description && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{task.description}</p>}

      {(task.labels.length > 0 || task.dueDate) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {task.labels.map((label) => (
            <span key={label} className="border border-line px-1.5 font-mono text-[11px] leading-5 text-ink-soft">
              #{label}
            </span>
          ))}
          {task.dueDate && (
            <span
              className={`ml-auto inline-flex items-center gap-1 font-mono text-[11px] leading-5 ${
                overdue ? 'font-semibold text-overdue' : dueToday ? 'font-semibold text-ink' : 'text-ink-soft'
              }`}
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Due </span>
              {dueToday ? 'Today' : formatDue(task.dueDate, today)}
            </span>
          )}
        </div>
      )}
    </article>
  )
}
