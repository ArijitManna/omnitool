import { ArrowRight, SearchX } from 'lucide-react'
import type { ToolDefinition } from '../data/tools'
import { ToolIcon } from './ToolIcon'

interface ToolGridProps {
  tools: ToolDefinition[]
  onOpen: (id: string) => void
}

export function ToolGrid({ tools, onOpen }: ToolGridProps) {
  if (tools.length === 0) {
    return (
      <div className="col-span-full py-12 text-center">
        <SearchX className="mx-auto mb-2 h-12 w-12 text-slate-400" />
        <h4 className="text-base font-semibold">No tools found</h4>
        <p className="text-xs text-slate-500">Try another search or category.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => onOpen(tool.id)}
          className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 text-left transition-all duration-200 hover:border-brand-500/50 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800/90 dark:hover:border-brand-500/50"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform group-hover:scale-105 dark:bg-slate-700 dark:text-brand-300">
                <ToolIcon name={tool.icon} className="h-5 w-5" />
              </div>
              {tool.live ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  Live
                </span>
              ) : tool.badge ? (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400">
                  {tool.badge}
                </span>
              ) : (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Soon
                </span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                {tool.name}
              </h4>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                {tool.desc}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-brand-600 dark:border-slate-700/50 dark:text-brand-400">
            <span>{tool.live ? 'Open utility' : 'View details'}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      ))}
    </div>
  )
}
