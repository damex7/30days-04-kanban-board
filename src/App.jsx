import { useState } from 'react'
import Board from './components/Board.jsx'
import BoardMenu from './components/BoardMenu.jsx'
import FilterBar from './components/FilterBar.jsx'
import Header from './components/Header.jsx'
import TaskModal from './components/TaskModal.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import UndoBar from './components/UndoBar.jsx'
import { useTaskFilters } from './hooks/useTaskFilters.js'
import { BoardProvider, useBoardState, useLoadStatus } from './state/BoardContext.jsx'
import { UIProvider } from './state/UIContext.jsx'

function RecoveryNotice() {
  const status = useLoadStatus()
  const [dismissed, setDismissed] = useState(false)
  if (status !== 'corrupt' || dismissed) return null
  return (
    <div role="status" className="mx-4 mb-4 flex flex-wrap items-center gap-3 border border-dashed border-overdue bg-panel px-4 py-2 text-sm sm:mx-6">
      <span>
        Your saved board couldn't be read, so the sample board was loaded. The unreadable data was kept as a backup in
        localStorage.
      </span>
      <button type="button" onClick={() => setDismissed(true)} className="ml-auto font-mono text-xs font-semibold uppercase tracking-[0.14em] underline">
        Dismiss
      </button>
    </div>
  )
}

/* Lives inside the providers, so it can use the board hooks. */
function KanbanApp() {
  const board = useBoardState()
  const filters = useTaskFilters()

  return (
    <>
      <a
        href="#board"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent"
      >
        Skip to board
      </a>
      <Header>
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-0 flex-[1_1_30rem]">
            <FilterBar {...filters} totalCount={Object.keys(board.tasks).length} />
          </div>
          <div className="flex gap-2">
            <BoardMenu />
            <ThemeToggle />
          </div>
        </div>
      </Header>
      <RecoveryNotice />
      <main id="board">
        <Board visibleIds={filters.visibleIds} isFiltered={filters.isFiltered} />
      </main>
      <TaskModal />
      <UndoBar />
    </>
  )
}

export default function App() {
  return (
    <BoardProvider>
      <UIProvider>
        <KanbanApp />
      </UIProvider>
    </BoardProvider>
  )
}
