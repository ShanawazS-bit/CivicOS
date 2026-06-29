import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type ThemeMode = 'light' | 'dark'

function readInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem('civic-theme')
  if (stored === 'dark' || stored === 'light') return stored
  return 'light'
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.dataset.theme = mode
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => readInitialTheme())

  useEffect(() => {
    applyTheme(mode)
    window.localStorage.setItem('civic-theme', mode)
  }, [mode])

  const dark = mode === 'dark'
  const Icon = dark ? Sun : Moon

  return (
    <button
      type="button"
      onClick={() => setMode(dark ? 'light' : 'dark')}
      className="flex items-center gap-2 border border-[#111111] bg-white px-3 py-2 font-mono text-[10px] font-black uppercase tracking-widest text-[#111111] transition-colors hover:border-[#E11D2E] hover:text-[#E11D2E] dark:border-white/40 dark:bg-[#111111] dark:text-[#F2F1EE] dark:hover:border-[#E11D2E] dark:hover:text-[#E11D2E]"
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
    </button>
  )
}
