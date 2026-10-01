import { serializeBoard, validateBoard } from '../state/validateBoard.js'
import { todayISO } from './dates.js'

/** Download the board as a pretty-printed JSON file. */
export function exportBoard(board) {
  const json = JSON.stringify({ app: 'blueprint-kanban', exportedAt: new Date().toISOString(), ...serializeBoard(board) }, null, 2)
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `kanban-${todayISO()}.json`
  link.click()
  // Give the browser a moment to start the download before freeing memory.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Read a File chosen by the user. Resolves to a validated board, or rejects
 * with an Error whose message is safe to show in the UI.
 */
export async function readBoardFile(file) {
  if (file.size > 2_000_000) throw new Error('That file is too large to be a board export (over 2 MB).')
  let data
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error(`"${file.name}" isn't valid JSON.`)
  }
  const board = validateBoard(data)
  if (!board) throw new Error(`"${file.name}" doesn't look like a board export.`)
  return board
}
