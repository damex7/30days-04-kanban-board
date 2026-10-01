import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage.js'

export const THEME_KEY = 'kanban-theme'

const validTheme = (value) => (value === 'light' || value === 'dark' ? value : null)

/*
  The inline script in index.html already set data-theme before the first
  paint (saved choice, or the OS preference). We start from that, so React
  and the page agree, then keep <html data-theme> and storage in sync.
*/
export function useTheme() {
  const [theme, setTheme] = useLocalStorage(
    THEME_KEY,
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
    validTheme,
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return { theme, toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
}
