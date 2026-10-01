import { createContext, useContext, useMemo, useState } from 'react'

/*
  UI state that is NOT part of the board data: which task the editor is
  showing. It lives in its own context so any card or column can open the
  editor without callbacks being passed down through every level.
*/
const UIContext = createContext(null)

export function UIProvider({ children }) {
  // null | { mode: 'create', columnId } | { mode: 'edit', taskId }
  const [editor, setEditor] = useState(null)

  const value = useMemo(
    () => ({
      editor,
      openNewTask: (columnId) => setEditor({ mode: 'create', columnId }),
      openTask: (taskId) => setEditor({ mode: 'edit', taskId }),
      closeEditor: () => setEditor(null),
    }),
    [editor],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const value = useContext(UIContext)
  if (!value) throw new Error('useUI must be used inside <UIProvider>')
  return value
}
