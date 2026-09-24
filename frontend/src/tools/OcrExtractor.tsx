import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { ocrFile } from '../lib/ocrClient'
import { downloadBlob, formatBytes } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

export function OcrExtractor({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles
      .filter(
        (f) =>
          f.type.startsWith('image/') ||
          f.type === 'application/pdf' ||
          f.name.toLowerCase().endsWith('.pdf'),
      )
      .slice(0, 1),
  )
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [text, setText] = useState<string>('')
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)

  const file = files[0]

  const process = async () => {
    if (!file) {
      setError('Select an image or PDF.')
      return
    }
    setError(null)
    setProcessing(true)
    setProgress(5)
    setText('')
    setResultBlob(null)
    try {
      const result = await ocrFile(file, (s, p) => {
        setStatus(s)
        setProgress(Math.round(p * 100))
      })
      setText(result.text)
      const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' })
      setResultBlob(blob)
      setResultSize(blob.size)
      setProgress(100)
      setStatus(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OCR failed')
    } finally {
      setProcessing(false)
      setProgress(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          OCR text extract
        </h4>

        <FileDropzone
          accept="image/*,application/pdf,.pdf"
          files={files}
          onFiles={(f) => setFiles(f.slice(0, 1))}
          hint="English OCR via Tesseract — runs in your browser (can be slow)"
        />

        {file && (
          <p className="text-xs text-slate-500">Source · {formatBytes(file.size)}</p>
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
          Run OCR
        </button>
      </div>

      <div className="space-y-3">
        <ResultPreview
          originalSize={file?.size}
          resultSize={resultSize}
          resultLabel="Text"
          processing={processing}
          progress={progress}
          onDownload={
            resultBlob
              ? () =>
                  downloadBlob(
                    resultBlob,
                    `${(file?.name ?? 'ocr').replace(/\.[^.]+$/, '')}-ocr.txt`,
                  )
              : undefined
          }
          downloadLabel="Download .txt"
        />
        {text && (
          <textarea
            readOnly
            value={text}
            rows={12}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        )}
      </div>
    </div>
  )
}
