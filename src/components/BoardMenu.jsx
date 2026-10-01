import { useRef, useState } from 'react'
import { exportBoard, readBoardFile } from '../lib/boardFile.js'
import { useBoardDispatch, useBoardState } from '../state/BoardContext.jsx'
import { boardActions, emptyBoard } from '../state/boardReducer.js'
import { createSampleBoard } from '../state/sampleData.js'
import OptionsMenu from './OptionsMenu.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { DotsIcon } from './Icons.jsx'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

/** Export / import / reset. Every "replace the board" path asks first. */
export default function BoardMenu() {
  const board = useBoardState()
  const dispatch = useBoardDispatch()
  const fileInputRef = useRef(null)
  const menuButtonRef = useRef(null)
  const [pending, setPending] = useState(null) // { title, message, confirmLabel, board }
  const [error, setError] = useState('')

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // so choosing the same file again still fires
    if (!file) return
    setError('')
    try {
      const imported = await readBoardFile(file)
      const tasks = Object.keys(imported.tasks).length
      setPending({
        title: 'Import board',
        message: `Replace the current board with "${file.name}" (${plural(imported.columnOrder.length, 'column')}, ${plural(tasks, 'task')})? Export first if you want to keep what's here.`,
        confirmLabel: 'Replace board',
        board: imported,
      })
    } catch (err) {
      setError(err.message)
      menuButtonRef.current?.focus()
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFile} className="hidden" tabIndex={-1} />
      <OptionsMenu
        triggerRef={menuButtonRef}
        label="Board options: export, import, reset"
        triggerContent={
          <>
            Board <DotsIcon className="size-4" />
          </>
        }
        triggerClassName="inline-flex h-10 items-center gap-2 border border-line-strong bg-panel px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] hover:bg-panel-2 aria-expanded:bg-panel-2"
        items={[
          { label: 'Export as JSON', onSelect: () => exportBoard(board) },
          { label: 'Import from JSON…', onSelect: () => fileInputRef.current?.click() },
          {
            label: 'Reset to sample board',
            onSelect: () =>
              setPending({
                title: 'Reset board',
                message: 'Replace everything with the demo board? Your current tasks will be lost.',
                confirmLabel: 'Reset',
                board: createSampleBoard(),
              }),
          },
          {
            label: 'Clear board',
            danger: true,
            onSelect: () =>
              setPending({
                title: 'Clear board',
                message: `Delete all ${plural(board.columnOrder.length, 'column')} and ${plural(Object.keys(board.tasks).length, 'task')}? This can't be undone.`,
                confirmLabel: 'Clear board',
                board: emptyBoard(),
              }),
          },
        ]}
      />

      {error && (
        <p role="alert" className="absolute right-0 top-full z-30 mt-1 w-72 border border-overdue bg-panel px-3 py-2 text-sm text-overdue shadow-lg">
          {error}{' '}
          <button type="button" onClick={() => setError('')} className="ml-1 underline">
            Dismiss
          </button>
        </p>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.title ?? ''}
        message={pending?.message ?? ''}
        confirmLabel={pending?.confirmLabel ?? 'OK'}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          dispatch(boardActions.replaceBoard(pending.board))
          setPending(null)
        }}
      />
    </div>
  )
}
