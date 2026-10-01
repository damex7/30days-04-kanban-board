import { ISO_DATE } from '../lib/dates.js'
import { PRIORITIES } from './boardReducer.js'

/*
  Anything read from localStorage or an imported file is untrusted: it may be
  from an older version, hand-edited, or just broken. validateBoard() either
  returns a clean, internally consistent board, or null if the data is not a
  board at all. Small problems are REPAIRED rather than rejected, so one bad
  task never costs you the whole board.
*/

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const cleanString = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function cleanLabels(labels) {
  if (!Array.isArray(labels)) return []
  const seen = new Set()
  const result = []
  for (const raw of labels) {
    const label = cleanString(raw, 24)
    const key = label.toLowerCase()
    if (label && !seen.has(key)) {
      seen.add(key)
      result.push(label)
    }
  }
  return result.slice(0, 8)
}

function cleanTask(id, raw) {
  if (!isObject(raw)) return null
  return {
    id,
    title: cleanString(raw.title, 120) || 'Untitled task',
    description: cleanString(raw.description, 2000),
    priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'medium',
    dueDate: typeof raw.dueDate === 'string' && ISO_DATE.test(raw.dueDate) ? raw.dueDate : null,
    labels: cleanLabels(raw.labels),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
  }
}

export function validateBoard(data) {
  if (!isObject(data) || !isObject(data.tasks) || !isObject(data.columns)) return null

  const tasks = {}
  for (const [id, raw] of Object.entries(data.tasks)) {
    const task = cleanTask(id, raw)
    if (task) tasks[id] = task
  }

  // Keep the saved column order, then append any columns it forgot.
  const savedOrder = Array.isArray(data.columnOrder) ? data.columnOrder : []
  const order = [...new Set([...savedOrder, ...Object.keys(data.columns)])].filter((id) =>
    isObject(data.columns[id]),
  )

  const columns = {}
  const placed = new Set() // a task may only appear in one column, once
  for (const id of order) {
    const raw = data.columns[id]
    const taskIds = (Array.isArray(raw.taskIds) ? raw.taskIds : []).filter((taskId) => {
      if (!tasks[taskId] || placed.has(taskId)) return false
      placed.add(taskId)
      return true
    })
    columns[id] = {
      id,
      title: cleanString(raw.title, 40) || 'Untitled',
      isDone: raw.isDone === true,
      taskIds,
    }
  }

  // Drop tasks that no column points to.
  for (const id of Object.keys(tasks)) {
    if (!placed.has(id)) delete tasks[id]
  }

  return { version: 1, tasks, columns, columnOrder: order }
}

/** The part of the state that gets saved (lastDeleted is session-only). */
export function serializeBoard({ version, tasks, columns, columnOrder }) {
  return { version, tasks, columns, columnOrder }
}
