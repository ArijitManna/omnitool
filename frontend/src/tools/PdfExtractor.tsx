import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { downloadBlob, formatBytes } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

export function PdfExtractor({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles
      .filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
      .slice(0, 1),
  )
  const [pages, setPages] = useState('1')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)

  const file = files[0]

  const process = async () => {
    if (!file) {
      setError('Select a PDF file.')
      return
    }
    if (!pages.trim()) {
      setError('Enter pages to extract (e.g. 1-3,5).')
      return
    }
    setError(null)
    setProcessing(true)
    setProgress(30)
    setResultBlob(null)
    setResultSize(undefined)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('pages', pages.trim())

      setProgress(60)
      const res = await fetch('/api/pdf/extract', { method: 'POST', body: form })
      setProgress(85)

      if (!res.ok) {
        let message = `Extract failed (${res.status})`
        try {
          const data = (await res.json()) as { error?: string }
          if (data.error) message = data.error
        } catch {
          /* ignore */
        }
        throw new Error(message)
      }

      const blob = await res.blob()
      setResultBlob(blob)
      setResultSize(blob.size)
      setProgress(100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extract failed')
    } finally {
      setProcessing(false)
      setProgress(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Extract pages
        </h4>

        <FileDropzone
          accept="application/pdf,.pdf"
          files={files}
          onFiles={(f) => setFiles(f.slice(0, 1))}
          hint="Selected pages → one PDF via secure API"
        />

        <div>
          <label className="mb-1 block text-xs font-semibold">Pages</label>
          <input
            type="text"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="e.g. 1-3,5,8"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none dark:border-slate-600 dark:bg-slate-700"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            1-based. Ranges and single pages, comma-separated. Order is preserved.
          </p>
        </div>

        {file && (
          <p className="text-xs text-slate-500">Source · {formatBytes(file.size)}</p>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={process}
          disabled={processing || !file}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          Extract pages
        </button>
      </div>

      <div className="space-y-4">
        <ResultPreview
          originalSize={file?.size}
          resultSize={resultSize}
          resultLabel="Extracted PDF"
          processing={processing}
          progress={progress}
          onDownload={
            resultBlob
              ? () =>
                  downloadBlob(
                    resultBlob,
                    `${(file?.name ?? 'document').replace(/\.pdf$/i, '')}-extract.pdf`,
                  )
              : undefined
          }
          downloadLabel="Download PDF"
        />
      </div>
    </div>
  )
}
