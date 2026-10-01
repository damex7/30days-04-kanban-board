import { BoardProvider, useBoardState } from './state/BoardContext.jsx'

function Debug() {
  const board = useBoardState()
  return (
    <ul className="mt-4 font-mono text-sm">
      {board.columnOrder.map((id) => (
        <li key={id}>
          {board.columns[id].title} · {board.columns[id].taskIds.length}
        </li>
      ))}
    </ul>
  )
}

export default function App() {
  return (
    <BoardProvider>
      <main className="min-h-dvh p-6">
        <h1 className="font-display text-3xl font-bold">Blueprint Kanban</h1>
        <Debug />
      </main>
    </BoardProvider>
  )
}
