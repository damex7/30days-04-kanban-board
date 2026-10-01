import { createContext, useContext } from 'react'
import { usePersistedReducer } from '../hooks/useLocalStorage.js'
import { boardReducer } from './boardReducer.js'
import { createSampleBoard } from './sampleData.js'
import { serializeBoard, validateBoard } from './validateBoard.js'

export const STORAGE_KEY = 'kanban-board:v1'

/*
  Two contexts instead of one. `dispatch` never changes, so components that
  only SEND actions (buttons, menus) subscribe to the dispatch context and
  don't re-render every time the board changes.
*/
const BoardStateContext = createContext(null)
const BoardDispatchContext = createContext(null)
const LoadStatusContext = createContext('ok')

const withSessionFields = (board) => ({ ...board, lastDeleted: null })

export function BoardProvider({ children }) {
  const [state, dispatch, loadStatus] = usePersistedReducer(boardReducer, STORAGE_KEY, {
    validate: (data) => {
      const board = validateBoard(data)
      return board && withSessionFields(board)
    },
    // First visit, or unreadable data: start with the demo board.
    createFallback: () => withSessionFields(createSampleBoard()),
    serialize: serializeBoard,
  })

  return (
    <BoardDispatchContext.Provider value={dispatch}>
      <BoardStateContext.Provider value={state}>
        <LoadStatusContext.Provider value={loadStatus}>{children}</LoadStatusContext.Provider>
      </BoardStateContext.Provider>
    </BoardDispatchContext.Provider>
  )
}

function useRequiredContext(context, name) {
  const value = useContext(context)
  if (value === null) throw new Error(`${name} must be used inside <BoardProvider>`)
  return value
}

export const useBoardState = () => useRequiredContext(BoardStateContext, 'useBoardState')
export const useBoardDispatch = () => useRequiredContext(BoardDispatchContext, 'useBoardDispatch')
export const useLoadStatus = () => useContext(LoadStatusContext)
