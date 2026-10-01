import { makeId } from '../lib/ids.js'

/*
  The whole board is one normalised object:

    {
      version: 1,
      tasks:   { [taskId]: { id, title, description, priority, dueDate, labels, createdAt } },
      columns: { [columnId]: { id, title, isDone, taskIds: [taskId, ...] } },
      columnOrder: [columnId, ...],
      lastDeleted: { task, columnId, index } | null   // for Undo, not saved
    }

  Tasks live in ONE place (tasks). Columns only hold an ordered list of ids.
  Moving a task is therefore just "take an id out of one array and put it
  into another" - the task object itself never moves or gets copied.
*/

export const ACTIONS = {
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  UNDO_DELETE: 'UNDO_DELETE',
  CLEAR_UNDO: 'CLEAR_UNDO',
  MOVE_TASK: 'MOVE_TASK',
  ADD_COLUMN: 'ADD_COLUMN',
  RENAME_COLUMN: 'RENAME_COLUMN',
  TOGGLE_COLUMN_DONE: 'TOGGLE_COLUMN_DONE',
  DELETE_COLUMN: 'DELETE_COLUMN',
  REORDER_COLUMN: 'REORDER_COLUMN',
  RESTORE_SNAPSHOT: 'RESTORE_SNAPSHOT',
  REPLACE_BOARD: 'REPLACE_BOARD',
}

export const PRIORITIES = ['low', 'medium', 'high']

export const emptyBoard = () => ({
  version: 1,
  tasks: {},
  columns: {},
  columnOrder: [],
  lastDeleted: null,
})

/* ---------- small immutable array helpers ---------- */

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

function insertAt(list, index, item) {
  const copy = [...list]
  copy.splice(clamp(index, 0, copy.length), 0, item)
  return copy
}

function moveItem(list, from, to) {
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(clamp(to, 0, copy.length), 0, item)
  return copy
}

/** Which column currently holds this task? */
export function findColumnId(state, taskId) {
  return state.columnOrder.find((id) => state.columns[id]?.taskIds.includes(taskId))
}

/* ---------- the reducer ---------- */

export function boardReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_TASK: {
      const { task, columnId } = action
      const column = state.columns[columnId]
      if (!column) return state
      return {
        ...state,
        tasks: { ...state.tasks, [task.id]: task },
        columns: {
          ...state.columns,
          // New tasks go to the top of the column, where you can see them.
          [columnId]: { ...column, taskIds: [task.id, ...column.taskIds] },
        },
      }
    }

    case ACTIONS.UPDATE_TASK: {
      const task = state.tasks[action.id]
      if (!task) return state
      return {
        ...state,
        tasks: { ...state.tasks, [action.id]: { ...task, ...action.changes, id: task.id } },
      }
    }

    case ACTIONS.DELETE_TASK: {
      const task = state.tasks[action.id]
      const columnId = findColumnId(state, action.id)
      if (!task || !columnId) return state
      const column = state.columns[columnId]
      const { [action.id]: _removed, ...tasks } = state.tasks
      return {
        ...state,
        tasks,
        columns: {
          ...state.columns,
          [columnId]: { ...column, taskIds: column.taskIds.filter((id) => id !== action.id) },
        },
        // Remember enough to put it back exactly where it was.
        lastDeleted: { task, columnId, index: column.taskIds.indexOf(action.id) },
      }
    }

    case ACTIONS.UNDO_DELETE: {
      const { lastDeleted } = state
      if (!lastDeleted) return state
      // If its column was deleted meanwhile, fall back to the first column.
      const columnId = state.columns[lastDeleted.columnId]
        ? lastDeleted.columnId
        : state.columnOrder[0]
      if (!columnId) return { ...state, lastDeleted: null }
      const column = state.columns[columnId]
      return {
        ...state,
        tasks: { ...state.tasks, [lastDeleted.task.id]: lastDeleted.task },
        columns: {
          ...state.columns,
          [columnId]: {
            ...column,
            taskIds: insertAt(column.taskIds, lastDeleted.index, lastDeleted.task.id),
          },
        },
        lastDeleted: null,
      }
    }

    case ACTIONS.CLEAR_UNDO:
      return state.lastDeleted ? { ...state, lastDeleted: null } : state

    /*
      One action for every task move: reordering inside a column AND moving
      to another column. toIndex is the task's position in the target column
      AFTER the move.
    */
    case ACTIONS.MOVE_TASK: {
      const { taskId, toColumnId, toIndex } = action
      const fromColumnId = findColumnId(state, taskId)
      const target = state.columns[toColumnId]
      if (!fromColumnId || !target) return state

      if (fromColumnId === toColumnId) {
        const from = target.taskIds.indexOf(taskId)
        const to = clamp(toIndex, 0, target.taskIds.length - 1)
        if (from === to) return state // nothing changed: keep the same object
        return {
          ...state,
          columns: {
            ...state.columns,
            [toColumnId]: { ...target, taskIds: moveItem(target.taskIds, from, to) },
          },
        }
      }

      const source = state.columns[fromColumnId]
      return {
        ...state,
        columns: {
          ...state.columns,
          [fromColumnId]: { ...source, taskIds: source.taskIds.filter((id) => id !== taskId) },
          [toColumnId]: { ...target, taskIds: insertAt(target.taskIds, toIndex, taskId) },
        },
      }
    }

    case ACTIONS.ADD_COLUMN:
      return {
        ...state,
        columns: {
          ...state.columns,
          [action.id]: { id: action.id, title: action.title, isDone: false, taskIds: [] },
        },
        columnOrder: [...state.columnOrder, action.id],
      }

    case ACTIONS.RENAME_COLUMN: {
      const column = state.columns[action.id]
      if (!column || column.title === action.title) return state
      return { ...state, columns: { ...state.columns, [action.id]: { ...column, title: action.title } } }
    }

    case ACTIONS.TOGGLE_COLUMN_DONE: {
      const column = state.columns[action.id]
      if (!column) return state
      return {
        ...state,
        columns: { ...state.columns, [action.id]: { ...column, isDone: !column.isDone } },
      }
    }

    case ACTIONS.DELETE_COLUMN: {
      const column = state.columns[action.id]
      if (!column) return state
      const { [action.id]: _removed, ...columns } = state.columns
      // Normalised data means we must also delete the column's tasks,
      // otherwise they would sit in `tasks` forever with no column.
      const tasks = { ...state.tasks }
      column.taskIds.forEach((id) => delete tasks[id])
      return {
        ...state,
        tasks,
        columns,
        columnOrder: state.columnOrder.filter((id) => id !== action.id),
        lastDeleted: state.lastDeleted?.columnId === action.id ? null : state.lastDeleted,
      }
    }

    case ACTIONS.REORDER_COLUMN: {
      const { fromIndex, toIndex } = action
      if (fromIndex === toIndex || fromIndex < 0) return state
      return { ...state, columnOrder: moveItem(state.columnOrder, fromIndex, toIndex) }
    }

    // Used when a drag is cancelled with Esc: put every column back.
    case ACTIONS.RESTORE_SNAPSHOT:
      return { ...state, columns: action.columns }

    // Import, load sample data, or clear the board.
    case ACTIONS.REPLACE_BOARD:
      return { ...emptyBoard(), ...action.board, lastDeleted: null }

    default:
      throw new Error(`Unknown board action: ${action.type}`)
  }
}

/*
  Action creators. The reducer must be pure (same input -> same output), so
  anything random or time-based - new ids, createdAt - is created HERE and
  passed in, never inside the reducer.
*/
export const boardActions = {
  addTask: (columnId, fields) => ({
    type: ACTIONS.ADD_TASK,
    columnId,
    task: { ...fields, id: makeId('task'), createdAt: new Date().toISOString() },
  }),
  updateTask: (id, changes) => ({ type: ACTIONS.UPDATE_TASK, id, changes }),
  deleteTask: (id) => ({ type: ACTIONS.DELETE_TASK, id }),
  undoDelete: () => ({ type: ACTIONS.UNDO_DELETE }),
  clearUndo: () => ({ type: ACTIONS.CLEAR_UNDO }),
  moveTask: (taskId, toColumnId, toIndex) => ({ type: ACTIONS.MOVE_TASK, taskId, toColumnId, toIndex }),
  addColumn: (title) => ({ type: ACTIONS.ADD_COLUMN, id: makeId('col'), title }),
  renameColumn: (id, title) => ({ type: ACTIONS.RENAME_COLUMN, id, title }),
  toggleColumnDone: (id) => ({ type: ACTIONS.TOGGLE_COLUMN_DONE, id }),
  deleteColumn: (id) => ({ type: ACTIONS.DELETE_COLUMN, id }),
  reorderColumn: (fromIndex, toIndex) => ({ type: ACTIONS.REORDER_COLUMN, fromIndex, toIndex }),
  restoreSnapshot: (columns) => ({ type: ACTIONS.RESTORE_SNAPSHOT, columns }),
  replaceBoard: (board) => ({ type: ACTIONS.REPLACE_BOARD, board }),
}
