import { useEffect, useMemo, useState } from 'react'
import { CategoryTabs } from './components/CategoryTabs'
import { Header } from './components/Header'
import { HeroDropzone } from './components/HeroDropzone'
import { ToolGrid } from './components/ToolGrid'
import { ToolModal } from './components/ToolModal'
import {
  getToolById,
  suggestToolForFile,
  TOOL_REGISTRY,
  type CategoryFilter,
  type ToolDefinition,
} from './data/tools'

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      localStorage.getItem('omnifile-theme') === 'dark' ||
      (!localStorage.getItem('omnifile-theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    )
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('omnifile-theme', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark((d) => !d) }
}

export default function App() {
  const { dark, toggle } = useDarkMode()
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [search, setSearch] = useState('')
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null)
  const [seedFiles, setSeedFiles] = useState<File[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>('header input[type="text"]')
        input?.focus()
      }
      if (e.key === 'Escape') {
        setActiveTool(null)
        setSeedFiles([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const tools = useMemo(() => {
    const q = search.toLowerCase().trim()
    return TOOL_REGISTRY.filter((t) => {
      const matchesCat =
        category === 'all' ? t.mvp || t.live : t.cat === category
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q)
      return matchesCat && matchesSearch
    })
  }, [category, search])

  const openTool = (id: string, files: File[] = []) => {
    const tool = getToolById(id)
    if (!tool) return
    setSeedFiles(files)
    setActiveTool(tool)
  }

  const onHeroFiles = (files: File[]) => {
    if (!files.length) return
    openTool(suggestToolForFile(files[0]), files)
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-800 transition-colors duration-200 dark:bg-slate-900 dark:text-slate-100">
      <Header
        dark={dark}
        onToggleDark={toggle}
        search={search}
        onSearch={setSearch}
        onLogoClick={() => {
          setCategory('all')
          setSearch('')
        }}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <HeroDropzone onFiles={onHeroFiles} />

        <section className="space-y-6">
          <CategoryTabs active={category} onChange={setCategory} />
          <ToolGrid tools={tools} onOpen={(id) => openTool(id)} />
        </section>
      </main>

      {activeTool && (
        <ToolModal
          tool={activeTool}
          initialFiles={seedFiles}
          onClose={() => {
            setActiveTool(null)
            setSeedFiles([])
          }}
        />
      )}
    </div>
  )
}
