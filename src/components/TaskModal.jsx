import { useId, useMemo, useRef, useState } from 'react'
import { useBoardDispatch, useBoardState } from '../state/BoardContext.jsx'
import { boardActions, findColumnId, PRIORITIES } from '../state/boardReducer.js'
import { useUI } from '../state/UIContext.jsx'
import { cleanLabels } from '../state/validateBoard.js'
import Button from './Button.jsx'
import { CloseIcon } from './Icons.jsx'
import Modal from './Modal.jsx'

const inputClass =
  'w-full border border-line-strong bg-panel-2 px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus-visible:outline-accent'
const labelClass = 'mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft'

export default function TaskModal() {
  const { editor, closeEditor } = useUI()
  const board = useBoardState()

  // An "edit" target that no longer exists (deleted elsewhere) just closes.
  const task = editor?.mode === 'edit' ? board.tasks[editor.taskId] : null
  const open = Boolean(editor) && (editor.mode === 'create' || Boolean(task))

  return (
    <Modal open={open} onClose={closeEditor} title={task ? 'Edit task' : 'New task'}>
      {/* key: a fresh form (fresh state) every time the editor opens */}
      {open && <TaskForm key={task?.id ?? `new-${editor.columnId}`} task={task} editor={editor} />}
    </Modal>
  )
}

function TaskForm({ task, editor }) {
  const board = useBoardState()
  const dispatch = useBoardDispatch()
  const { closeEditor } = useUI()
  const ids = { title: useId(), desc: useId(), due: useId(), labels: useId(), column: useId(), error: useId() }
  const titleRef = useRef(null)

  const initialColumn = task ? findColumnId(board, task.id) : editor.columnId
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'medium',
    dueDate: task?.dueDate ?? '',
    labels: task?.labels ?? [],
    columnId: initialColumn,
  })
  const [labelDraft, setLabelDraft] = useState('')
  const [error, setError] = useState('')

  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }))

  // Every label used anywhere on the board, offered as suggestions.
  const knownLabels = useMemo(
    () => cleanLabels(Object.values(board.tasks).flatMap((t) => t.labels)),
    [board.tasks],
  )

  function addLabel(raw) {
    const labels = cleanLabels([...form.labels, ...raw.split(',')])
    setForm((f) => ({ ...f, labels }))
    setLabelDraft('')
  }

  function removeLabel(label) {
    setForm((f) => ({ ...f, labels: f.labels.filter((l) => l !== label) }))
  }

  function handleLabelKeyDown(event) {
    if ((event.key === 'Enter' || event.key === ',') && labelDraft.trim()) {
      event.preventDefault()
      addLabel(labelDraft)
    } else if (event.key === 'Enter') {
      event.preventDefault() // don't submit the form from an empty label box
    } else if (event.key === 'Backspace' && !labelDraft && form.labels.length) {
      removeLabel(form.labels.at(-1))
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) {
      setError('Give the task a title.')
      titleRef.current?.focus()
      return
    }
    const fields = {
      title,
      description: form.description.trim(),
      priority: form.priority,
      dueDate: form.dueDate || null,
      // A label still sitting in the input counts too.
      labels: cleanLabels([...form.labels, ...labelDraft.split(',')]),
    }
    if (task) {
      dispatch(boardActions.updateTask(task.id, fields))
      if (form.columnId !== initialColumn) dispatch(boardActions.moveTask(task.id, form.columnId, 0))
    } else {
      dispatch(boardActions.addTask(form.columnId, fields))
    }
    closeEditor()
  }

  function handleDelete() {
    dispatch(boardActions.deleteTask(task.id))
    closeEditor()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor={ids.title} className={labelClass}>
          Title <span aria-hidden="true">*</span>
        </label>
        <input
          ref={titleRef}
          id={ids.title}
          data-autofocus
          required
          maxLength={120}
          value={form.title}
          onChange={(e) => {
            set('title')(e)
            if (error) setError('')
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? ids.error : undefined}
          className={`${inputClass} font-display text-base font-medium`}
          placeholder="What needs doing?"
        />
        {error && (
          <p id={ids.error} className="mt-1.5 text-sm font-medium text-overdue">
            {error}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={ids.desc} className={labelClass}>
          Description <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          id={ids.desc}
          rows={3}
          maxLength={2000}
          value={form.description}
          onChange={set('description')}
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Radio buttons inside a fieldset: the legend names the group. */}
      <fieldset>
        <legend className={labelClass}>Priority</legend>
        <div className="grid grid-cols-3 border border-line-strong">
          {PRIORITIES.map((p) => (
            <label key={p} className="relative cursor-pointer border-line-strong not-last:border-r">
              <input
                type="radio"
                name="priority"
                value={p}
                checked={form.priority === p}
                onChange={set('priority')}
                className="peer sr-only"
              />
              <span
                className="block py-2 text-center font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft peer-checked:bg-ink peer-checked:text-panel peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-4 peer-focus-visible:outline-accent"
              >
                {p}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.due} className={labelClass}>
            Due date <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <input id={ids.due} type="date" value={form.dueDate} onChange={set('dueDate')} className={inputClass} />
        </div>
        <div>
          <label htmlFor={ids.column} className={labelClass}>
            Column
          </label>
          {/* Also the non-drag way to move a task (WCAG 2.5.7). */}
          <select id={ids.column} value={form.columnId} onChange={set('columnId')} className={inputClass}>
            {board.columnOrder.map((id) => (
              <option key={id} value={id}>
                {board.columns[id].title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={ids.labels} className={labelClass}>
          Labels <span className="normal-case tracking-normal">(Enter or comma to add)</span>
        </label>
        <div className="flex flex-wrap items-center gap-1.5 border border-line-strong bg-panel-2 p-1.5 focus-within:outline-2 focus-within:outline-accent">
          {form.labels.map((label) => (
            <span key={label} className="inline-flex items-center gap-1 border border-line-strong bg-panel py-0.5 pl-2 font-mono text-xs">
              {label}
              <button
                type="button"
                onClick={() => removeLabel(label)}
                className="grid size-6 place-items-center text-ink-soft hover:text-overdue"
                aria-label={`Remove label ${label}`}
              >
                <CloseIcon className="size-3" />
              </button>
            </span>
          ))}
          <input
            id={ids.labels}
            list={`${ids.labels}-list`}
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onKeyDown={handleLabelKeyDown}
            onBlur={() => labelDraft.trim() && addLabel(labelDraft)}
            className="min-w-24 flex-1 bg-transparent px-1.5 py-1 text-sm outline-none"
            placeholder={form.labels.length ? '' : 'design, bug…'}
          />
          <datalist id={`${ids.labels}-list`}>
            {knownLabels
              .filter((l) => !form.labels.includes(l))
              .map((l) => (
                <option key={l} value={l} />
              ))}
          </datalist>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
        {task && (
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button onClick={closeEditor}>Cancel</Button>
          <Button type="submit" variant="primary">
            {task ? 'Save' : 'Add task'}
          </Button>
        </div>
      </div>
    </form>
  )
}
