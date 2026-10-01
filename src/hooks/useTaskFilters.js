import { useDeferredValue, useMemo, useState } from 'react'
import { useBoardState } from '../state/BoardContext.jsx'
import { cleanLabels } from '../state/validateBoard.js'

const EMPTY = { query: '', priority: '', label: '' }

/*
  Search + filters. Filtering never touches the board data: it only decides
  which ids each column SHOWS. Because we filter each column's taskIds array
  in place (no sorting), the order is always preserved.
*/
export function useTaskFilters() {
  const board = useBoardState()
  const [filters, setFilters] = useState(EMPTY)

  // Typing updates the input immediately; the (heavier) board re-render can
  // lag a frame behind without making the input feel sluggish.
  const query = useDeferredValue(filters.query)

  const isFiltered = Boolean(filters.query.trim() || filters.priority || filters.label)

  const visibleIds = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    const label = filters.label.toLowerCase()

    const matches = (task) => {
      if (filters.priority && task.priority !== filters.priority) return false
      if (label && !task.labels.some((l) => l.toLowerCase() === label)) return false
      if (words.length === 0) return true
      const haystack = `${task.title} ${task.description} ${task.labels.join(' ')}`.toLowerCase()
      return words.every((word) => haystack.includes(word)) // every word must appear
    }

    const result = {}
    for (const columnId of board.columnOrder) {
      result[columnId] = board.columns[columnId].taskIds.filter((id) => matches(board.tasks[id]))
    }
    return result
  }, [board, query, filters.priority, filters.label])

  // Every label in use, for the label dropdown.
  const allLabels = useMemo(
    () => cleanLabels(Object.values(board.tasks).flatMap((t) => t.labels)).sort((a, b) => a.localeCompare(b)),
    [board.tasks],
  )

  const shownCount = Object.values(visibleIds).reduce((sum, ids) => sum + ids.length, 0)

  return {
    filters,
    setFilter: (field, value) => setFilters((f) => ({ ...f, [field]: value })),
    clearFilters: () => setFilters(EMPTY),
    isFiltered,
    visibleIds,
    allLabels,
    shownCount,
  }
}
