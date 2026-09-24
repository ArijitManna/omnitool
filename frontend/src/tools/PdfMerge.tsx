import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { downloadBlob, formatBytes } from '../lib/utils'

interface PdfMergeProps {
  initialFiles?: File[]
}

export function PdfMerge({ initialFiles = [] }: PdfMergeProps) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    ),
  )
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)

  const originalTotal = files.reduce((sum, f) => sum + f.size, 0)

  const process = async () => {
    if (files.length < 2) {
      setError('Select at least two PDF files to merge.')
      return
    }
    setError(null)
    setProcessing(true)
    setProgress(20)
    setResultBlob(null)
    setResultSize(undefined)

    try {
      const form = new FormData()
      files.forEach((f) => form.append('files', f))

      setProgress(50)
      const res = await fetch('/api/pdf/merge', {
        method: 'POST',
        body: form,
      })

      setProgress(80)

      if (!res.ok) {
        let message = `Merge failed (${res.status})`
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
      setError(e instanceof Error ? e.message : 'Merge failed')
    } finally {
      setProcessing(false)
      setProgress(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Merge PDFs
        </h4>

        <FileDropzone
          accept="application/pdf,.pdf"
          multiple
          files={files}
          onFiles={setFiles}
          hint="Upload 2+ PDFs — merged on the secure API, temps deleted after"
        />

        {files.length > 0 && (
          <p className="text-xs text-slate-500">
            {files.length} file{files.length === 1 ? '' : 's'} · total{' '}
            {formatBytes(originalTotal)}
          </p>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={process}
          disabled={processing || files.length < 2}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          Merge PDFs
        </button>
      </div>

      <div className="space-y-4">
        <ResultPreview
          originalSize={files.length ? originalTotal : undefined}
          resultSize={resultSize}
          resultLabel="Merged PDF"
          processing={processing}
          progress={progress}
          onDownload={
            resultBlob
              ? () => downloadBlob(resultBlob, 'merged.pdf')
              : undefined
          }
          downloadLabel="Download merged.pdf"
        />
        {resultBlob && (
          <p className="text-center text-xs text-slate-500">
            Merge complete. Temporary server files were removed after processing.
          </p>
        )}
      </div>
    </div>
  )
}
