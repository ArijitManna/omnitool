import { Files, Moon, Search, Sun } from 'lucide-react'

interface HeaderProps {
  dark: boolean
  onToggleDark: () => void
  search: string
  onSearch: (value: string) => void
  onLogoClick: () => void
}

export function Header({ dark, onToggleDark, search, onSearch, onLogoClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onLogoClick}
          className="flex cursor-pointer items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
            <Files className="h-6 w-6" />
          </div>
          <div>
            <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-xl font-bold tracking-tight text-transparent dark:from-brand-500 dark:to-indigo-400">
              SwiftDoc
            </span>
            <p className="hidden text-[10px] font-medium text-slate-500 sm:block dark:text-slate-400">
              All-in-One Processing Platform
            </p>
          </div>
        </button>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search tools (e.g. compress, merge pdf, qr)…"
            className="w-full rounded-xl border border-transparent bg-slate-100 py-2 pr-4 pl-9 text-sm outline-none transition-all focus:border-brand-500 dark:bg-slate-800/80"
          />
          <kbd className="absolute top-1/2 right-3 -translate-y-1/2 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-600 dark:bg-slate-700">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDark}
            className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Toggle theme"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 lg:flex dark:border-slate-800">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/50 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/50 dark:text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Hybrid privacy
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
