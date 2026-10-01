import { useTheme } from '../hooks/useTheme.js'
import { MoonIcon, SunIcon } from './Icons.jsx'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'
  return (
    // aria-pressed makes it a toggle button: screen readers say
    // "Dark mode, toggle button, pressed / not pressed".
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={dark}
      className="inline-flex h-10 items-center gap-2 border border-line-strong bg-panel px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] hover:bg-panel-2"
    >
      {dark ? <MoonIcon /> : <SunIcon />}
      Dark mode
    </button>
  )
}
