import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { pdfToDocx } from '../lib/pdfToDocx'
import { downloadBlob, formatBytes } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

export function PdfToWord({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles
      .filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
      .slice(0, 1),
  )
  const [processing, setProcessing] = useState(false)
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
    setProgress(5)
    setResultBlob(null)
    try {
      const blob = await pdfToDocx(file, (done, total) =>
        setProgress(Math.round((done / total) * 95)),
      )
      setResultBlob(blob)
      setResultSize(blob.size)
      setProgress(100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed')
    } finally {
      setProcessing(false)
      setProgress(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          PDF → Word
        </h4>

        <FileDropzone
          accept="application/pdf,.pdf"
          files={files}
          onFiles={(f) => setFiles(f.slice(0, 1))}
          hint="Extracts text into a .docx (layout may differ). Use OCR for scans."
        />

        {file && (
          <p className="text-xs text-slate-500">Source · {formatBytes(file.size)}</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={process}
          disabled={processing || !file}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          Convert to DOCX
        </button>
      </div>

      <ResultPreview
        originalSize={file?.size}
        resultSize={resultSize}
        resultLabel="DOCX"
        processing={processing}
        progress={progress}
        onDownload={
          resultBlob && file
            ? () =>
                downloadBlob(
                  resultBlob,
                  `${file.name.replace(/\.pdf$/i, '')}.docx`,
                )
            : undefined
        }
        downloadLabel="Download DOCX"
      />
    </div>
  )
}
