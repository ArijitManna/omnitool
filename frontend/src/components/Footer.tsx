import { Files } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Files className="h-4 w-4 text-brand-600" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">OmniFile Tools</span>
          <span>— everyday file utilities</span>
        </div>
        <div className="flex gap-6">
          <a href="/docs/BRD.md" className="pointer-events-none opacity-60" tabIndex={-1}>
            BRD
          </a>
          <span>Phase 0 · No account required</span>
        </div>
      </div>
    </footer>
  )
}
