import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { downloadBlob, formatBytes } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

type SplitMode = 'each' | 'chunk' | 'ranges'

export function PdfSplit({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    ).slice(0, 1),
  )
  const [mode, setMode] = useState<SplitMode>('each')
  const [chunkSize, setChunkSize] = useState(2)
  const [ranges, setRanges] = useState('1-2')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [partCount, setPartCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const file = files[0]

  const process = async () => {
    if (!file) {
      setError('Select a PDF to split.')
      return
    }
    setError(null)
    setProcessing(true)
    setProgress(25)
    setResultBlob(null)
    setResultSize(undefined)
    setPartCount(null)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('mode', mode)
      if (mode === 'chunk') form.append('chunkSize', String(chunkSize))
      if (mode === 'ranges') form.append('ranges', ranges)

      setProgress(55)
      const res = await fetch('/api/pdf/split', { method: 'POST', body: form })
      setProgress(85)

      if (!res.ok) {
        let message = `Split failed (${res.status})`
        try {
          const data = (await res.json()) as { error?: string }
          if (data.error) message = data.error
        } catch {
          /* ignore */
        }
        throw new Error(message)
      }

      const countHeader = res.headers.get('X-Part-Count')
      if (countHeader) setPartCount(Number(countHeader))

      const blob = await res.blob()
      setResultBlob(blob)
      setResultSize(blob.size)
      setProgress(100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Split failed')
    } finally {
      setProcessing(false)
      setProgress(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Split options
        </h4>

        <FileDropzone
          accept="application/pdf,.pdf"
          files={files}
          onFiles={(f) => setFiles(f.slice(0, 1))}
          hint="One PDF — split via secure API, download as ZIP"
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold">Mode</label>
          {(
            [
              { id: 'each', label: 'Each page → separate PDF' },
              { id: 'chunk', label: 'Groups of N pages' },
              { id: 'ranges', label: 'Custom page ranges' },
            ] as const
          ).map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-600"
            >
              <input
                type="radio"
                name="split-mode"
                checked={mode === opt.id}
                onChange={() => setMode(opt.id)}
                className="accent-brand-600"
              />
              {opt.label}
            </label>
          ))}
        </div>

        {mode === 'chunk' && (
          <div>
            <label className="mb-1 block text-xs font-semibold">Pages per file</label>
            <input
              type="number"
              min={1}
              max={100}
              value={chunkSize}
              onChange={(e) => setChunkSize(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none dark:border-slate-600 dark:bg-slate-700"
            />
          </div>
        )}

        {mode === 'ranges' && (
          <div>
            <label className="mb-1 block text-xs font-semibold">Ranges</label>
            <input
              type="text"
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="e.g. 1-3,5,7-9"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none dark:border-slate-600 dark:bg-slate-700"
            />
            <p className="mt-1 text-[11px] text-slate-500">1-based page numbers. Comma-separated.</p>
          </div>
        )}

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
          Split PDF
        </button>
      </div>

      <div className="space-y-4">
        <ResultPreview
          originalSize={file?.size}
          resultSize={resultSize}
          resultLabel={partCount != null ? `ZIP (${partCount} parts)` : 'ZIP result'}
          processing={processing}
          progress={progress}
          onDownload={
            resultBlob
              ? () =>
                  downloadBlob(
                    resultBlob,
                    `${(file?.name ?? 'document').replace(/\.pdf$/i, '')}-split.zip`,
                  )
              : undefined
          }
          downloadLabel="Download ZIP"
        />
        {resultBlob && (
          <p className="text-center text-xs text-slate-500">
            Split complete. Temporary server files were removed after processing.
          </p>
        )}
      </div>
    </div>
  )
}
