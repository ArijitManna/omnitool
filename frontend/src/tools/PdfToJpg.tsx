import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { imagesZip, pdfToImages } from '../lib/pdfClient'
import { downloadBlob, formatBytes } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

export function PdfToJpg({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles
      .filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
      .slice(0, 1),
  )
  const [scale, setScale] = useState(1.5)
  const [quality, setQuality] = useState(0.85)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [pageCount, setPageCount] = useState<number | null>(null)
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
    setPreviewUrl(null)
    try {
      const pages = await pdfToImages(file, {
        scale,
        format: 'image/jpeg',
        quality,
        onProgress: (done, total) => setProgress(Math.round((done / total) * 90)),
      })
      setPageCount(pages.length)
      if (pages[0]) setPreviewUrl(pages[0].dataUrl)
      const zip = await imagesZip(pages, 'jpg')
      setResultBlob(zip)
      setResultSize(zip.size)
      setProgress(100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF to JPG failed')
    } finally {
      setProcessing(false)
      setProgress(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          PDF → JPG
        </h4>

        <FileDropzone
          accept="application/pdf,.pdf"
          files={files}
          onFiles={(f) => setFiles(f.slice(0, 1))}
          hint="Each page → JPG, downloaded as ZIP (in-browser)"
        />

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Resolution scale: {scale.toFixed(1)}×
          </label>
          <input
            type="range"
            min={0.8}
            max={2.5}
            step={0.1}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            JPG quality: {Math.round(quality * 100)}%
          </label>
          <input
            type="range"
            min={40}
            max={95}
            value={Math.round(quality * 100)}
            onChange={(e) => setQuality(Number(e.target.value) / 100)}
            className="w-full accent-brand-600"
          />
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
          Convert pages
        </button>
      </div>

      <ResultPreview
        originalSize={file?.size}
        resultSize={resultSize}
        resultPreview={previewUrl}
        resultLabel={pageCount != null ? `ZIP · ${pageCount} pages` : 'ZIP'}
        processing={processing}
        progress={progress}
        onDownload={
          resultBlob && file
            ? () =>
                downloadBlob(
                  resultBlob,
                  `${file.name.replace(/\.pdf$/i, '')}-pages.zip`,
                )
            : undefined
        }
        downloadLabel="Download ZIP"
      />
    </div>
  )
}
