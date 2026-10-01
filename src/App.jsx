import { useState } from 'react'
import Board from './components/Board.jsx'
import Header from './components/Header.jsx'
import TaskModal from './components/TaskModal.jsx'
import { BoardProvider, useLoadStatus } from './state/BoardContext.jsx'
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

export default function App() {
  return (
    <BoardProvider>
      <UIProvider>
        <a
          href="#board"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent"
        >
          Skip to board
        </a>
        <Header />
        <RecoveryNotice />
        <main id="board">
          <Board />
        </main>
        <TaskModal />
      </UIProvider>
    </BoardProvider>
  )
}
