import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { compressPdfToTargetKb } from '../lib/pdfClient'
import { downloadBlob, formatBytes } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

const PRESETS = [200, 500, 1000, 2000]

export function PdfTargetSize({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles
      .filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
      .slice(0, 1),
  )
  const [targetKb, setTargetKb] = useState(500)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)

  const file = files[0]

  const process = async () => {
    if (!file) {
      setError('Select a PDF.')
      return
    }
    setError(null)
    setProcessing(true)
    setProgress(10)
    setResultBlob(null)
    try {
      const blob = await compressPdfToTargetKb(file, targetKb, (msg) => {
        setStatus(msg)
        setProgress((p) => Math.min(90, (p ?? 10) + 15))
      })
      setResultBlob(blob)
      setResultSize(blob.size)
      setProgress(100)
      setStatus(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compression failed')
    } finally {
      setProcessing(false)
      setProgress(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Target size (lossy)
        </h4>

        <FileDropzone
          accept="application/pdf,.pdf"
          files={files}
          onFiles={(f) => setFiles(f.slice(0, 1))}
          hint="Aims for ~target KB by adjusting JPEG quality (in-browser)"
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold">Target size (KB)</label>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((kb) => (
              <button
                key={kb}
                type="button"
                onClick={() => setTargetKb(kb)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${
                  targetKb === kb
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {kb >= 1000 ? `${kb / 1000} MB` : `${kb} KB`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={50}
              max={5000}
              value={targetKb}
              onChange={(e) => setTargetKb(Number(e.target.value))}
              className="flex-1 accent-brand-600"
            />
            <input
              type="number"
              min={20}
              value={targetKb}
              onChange={(e) => setTargetKb(Number(e.target.value) || 20)}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
            />
          </div>
        </div>

        {file && (
          <p className="text-xs text-slate-500">Original · {formatBytes(file.size)}</p>
        )}
        {status && <p className="text-xs text-brand-600">{status}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={process}
          disabled={processing || !file}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          Compress to target
        </button>
      </div>

      <ResultPreview
        originalSize={file?.size}
        resultSize={resultSize}
        resultLabel="Result PDF"
        processing={processing}
        progress={progress}
        onDownload={
          resultBlob && file
            ? () =>
                downloadBlob(
                  resultBlob,
                  `${file.name.replace(/\.pdf$/i, '')}-${targetKb}kb.pdf`,
                )
            : undefined
        }
        downloadLabel="Download PDF"
      />
    </div>
  )
}
