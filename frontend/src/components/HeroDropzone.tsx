import { useState, type DragEvent } from 'react'
import { UploadCloud, Zap } from 'lucide-react'

interface HeroDropzoneProps {
  onFiles: (files: File[]) => void
}

export function HeroDropzone({ onFiles }: HeroDropzoneProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const list = e.dataTransfer.files
    if (list.length) onFiles(Array.from(list))
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-brand-50/70 via-white to-slate-50 p-6 shadow-sm sm:p-10 dark:border-slate-800 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-900">
      <div className="mx-auto mb-8 max-w-3xl space-y-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
          <Zap className="h-3.5 w-3.5" />
          Web-Based File Engine · Fast &amp; Private
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
          Your one-stop platform for{' '}
          <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            file &amp; document tools
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
          Compress images and generate QR codes in your browser. Merge PDFs through a secure API
          with automatic temp cleanup — no desktop installs.
        </p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragging(false)
        }}
        onDrop={handleDrop}
        className={`relative block cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center shadow-sm transition-all sm:p-10 ${
          dragging
            ? 'border-brand-500 bg-brand-50/50'
            : 'border-slate-300 bg-white/60 hover:border-brand-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/40'
        }`}
      >
        <input
          type="file"
          className="hidden"
          multiple
          onChange={(e) => {
            if (e.target.files?.length) onFiles(Array.from(e.target.files))
            e.target.value = ''
          }}
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-inner dark:bg-slate-800 dark:text-brand-400">
            <UploadCloud className="h-8 w-8" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Drag &amp; drop files here, or{' '}
              <span className="text-brand-600 underline underline-offset-2 dark:text-brand-400">
                browse your computer
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Images, PDFs &amp; more (up to 100MB)
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 pt-2">
            {['JPG', 'PNG', 'WEBP', 'PDF'].map((t) => (
              <span
                key={t}
                className="rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </label>
    </section>
  )
}
