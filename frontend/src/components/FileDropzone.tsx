import { useCallback, useState, type DragEvent, type ReactNode } from 'react'
import { UploadCloud } from 'lucide-react'

interface FileDropzoneProps {
  accept?: string
  multiple?: boolean
  files: File[]
  onFiles: (files: File[]) => void
  hint?: string
  children?: ReactNode
}

export function FileDropzone({
  accept,
  multiple = false,
  files,
  onFiles,
  hint,
  children,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false)

  const takeFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return
      const next = Array.from(list)
      onFiles(multiple ? next : [next[0]])
    },
    [multiple, onFiles],
  )

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    takeFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-2">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragging(false)
        }}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragging
            ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/30'
            : 'border-slate-300 bg-white/60 hover:border-brand-500 dark:border-slate-600 dark:bg-slate-800/40'
        }`}
      >
        <UploadCloud className="mb-2 h-8 w-8 text-brand-600 dark:text-brand-400" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Drag & drop, or <span className="text-brand-600 underline">browse</span>
        </p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        <input
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            takeFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>
      {files.length > 0 && (
        <ul className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800/60">
          {files.map((f) => (
            <li key={`${f.name}-${f.size}-${f.lastModified}`} className="truncate text-slate-600 dark:text-slate-300">
              {f.name}{' '}
              <span className="text-slate-400">({(f.size / 1024).toFixed(1)} KB)</span>
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>
  )
}
