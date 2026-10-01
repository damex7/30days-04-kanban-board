import { useSortable } from '@dnd-kit/sortable'
import { toTranslate } from '../lib/transform.js'
import { useUI } from '../state/UIContext.jsx'
import TaskCardView from './TaskCardView.jsx'

/*
  The sortable wrapper around TaskCardView.
  useSortable gives us:
  - setNodeRef:          the element that moves (and is measured)
  - setActivatorNodeRef + listeners + attributes: the drag HANDLE. dnd-kit
    returns focus to it after a keyboard drop.
  - transform/transition: how far to slide while others are dragged past
  - isDragging:          true for the original while its overlay copy flies
*/
export default function TaskCard({ task, isDone }) {
  const { openTask } = useUI()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' },
    attributes: { roleDescription: 'draggable task' },
  })

  return (
    <li ref={setNodeRef} style={{ transform: toTranslate(transform), transition }} className="relative">
      {/* While dragging, the original slot becomes the drop indicator: a
          dashed outline exactly the size of the card. opacity-0 (not
          `invisible`) keeps the handle focusable for keyboard users. */}
      <div className={isDragging ? 'opacity-0' : undefined}>
        <TaskCardView
          task={task}
          isDone={isDone}
          onOpen={() => openTask(task.id)}
          handleRef={setActivatorNodeRef}
          handleProps={{ ...attributes, ...listeners }}
        />
      </div>
      {isDragging && (
        <div
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center border-2 border-dashed border-accent bg-accent/10 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink"
        >
          Drops here
        </div>
      )}
    </li>
  )
}
