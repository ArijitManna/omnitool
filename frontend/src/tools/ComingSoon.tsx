import { Construction } from 'lucide-react'
import type { ToolDefinition } from '../data/tools'

export function ComingSoon({ tool }: { tool: ToolDefinition }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center dark:border-slate-600 dark:bg-slate-800/40">
      <Construction className="h-10 w-10 text-slate-400" />
      <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{tool.name}</h4>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{tool.desc}</p>
      <span className="mt-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
        Coming soon · Phase 1 backlog
      </span>
      <p className="text-[11px] text-slate-400">
        Processing mode planned: {tool.processing === 'client' ? 'in-browser' : 'secure API'}
      </p>
    </div>
  )
}
