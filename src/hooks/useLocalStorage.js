import { useEffect, useReducer, useState } from 'react'

/*
  Every localStorage call can throw: storage disabled, private mode, quota
  full, or a value that is not valid JSON. These two helpers swallow those
  errors so the app keeps working (it just won't remember things).
*/

/**
 * Returns { status, value }.
 *  - status "missing": nothing saved yet (first visit)
 *  - status "ok":      saved data was read and passed validation
 *  - status "corrupt": something was saved but could not be used
 */
export function readStorage(key, validate = (v) => v) {
  let raw
  try {
    raw = localStorage.getItem(key)
  } catch {
    return { status: 'missing', value: undefined }
  }
  if (raw === null) return { status: 'missing', value: undefined }

  try {
    const value = validate(JSON.parse(raw))
    if (value == null) throw new Error('failed validation')
    return { status: 'ok', value }
  } catch (error) {
    console.warn(`[storage] Could not read "${key}":`, error.message)
    // Keep a copy of the broken data instead of silently overwriting it.
    try {
      localStorage.setItem(`${key}:corrupt-backup`, raw)
    } catch {
      /* ignore */
    }
    return { status: 'corrupt', value: undefined }
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`[storage] Could not save "${key}":`, error.message)
  }
}

/** useState that survives reloads. */
export function useLocalStorage(key, initialValue, validate) {
  const [value, setValue] = useState(() => {
    const saved = readStorage(key, validate)
    return saved.status === 'ok' ? saved.value : initialValue
  })

  useEffect(() => writeStorage(key, value), [key, value])

  return [value, setValue]
}

/**
 * useReducer that survives reloads.
 *  - Reads storage ONCE, in useReducer's lazy initialiser (not every render).
 *  - `createFallback` builds the state when nothing usable was saved.
 *  - `serialize` picks which part of the state gets saved.
 * Returns [state, dispatch, loadStatus].
 */
export function usePersistedReducer(reducer, key, { validate, createFallback, serialize = (s) => s }) {
  // useState's lazy initialiser also runs once; we use it to keep the load
  // status (so the UI can say "your saved board was unreadable").
  const [load] = useState(() => readStorage(key, validate))

  const [state, dispatch] = useReducer(reducer, load, (loaded) =>
    loaded.status === 'ok' ? loaded.value : createFallback(loaded.status),
  )

  useEffect(() => writeStorage(key, serialize(state)), [key, state, serialize])

  return [state, dispatch, load.status]
}
