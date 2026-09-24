import {
  Binary,
  FileSpreadsheet,
  FileText,
  Image,
  QrCode,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { CATEGORIES, type CategoryFilter } from '../data/tools'

const ICONS: Record<CategoryFilter, typeof Sparkles> = {
  all: Sparkles,
  image: Image,
  pdf: FileText,
  doc: FileSpreadsheet,
  app: UserCheck,
  qr: QrCode,
  file: Binary,
}

interface CategoryTabsProps {
  active: CategoryFilter
  onChange: (cat: CategoryFilter) => void
}

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="overflow-x-auto border-b border-slate-200 pb-2 dark:border-slate-800">
      <nav className="flex min-w-max space-x-2 sm:space-x-4">
        {CATEGORIES.map((cat) => {
          const Icon = ICONS[cat.id]
          const isActive = active === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                isActive
                  ? 'bg-brand-600 font-semibold text-white shadow-sm'
                  : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon className="mr-1.5 inline h-4 w-4" />
              {cat.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
