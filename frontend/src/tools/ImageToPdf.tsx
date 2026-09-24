import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { imagesToPdf, type PageSize } from '../lib/imagesToPdf'
import { downloadBlob, formatBytes } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

export function ImageToPdf({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter((f) => f.type.startsWith('image/')),
  )
  const [pageSize, setPageSize] = useState<PageSize>('a4')
  const [processing, setProcessing] = useState(false)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)

  const total = files.reduce((s, f) => s + f.size, 0)

  const process = async () => {
    if (!files.length) {
      setError('Add one or more images.')
      return
    }
    setError(null)
    setProcessing(true)
    try {
      const blob = await imagesToPdf(files, { pageSize, marginMm: 10 })
      setResultBlob(blob)
      setResultSize(blob.size)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF creation failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Images → PDF
        </h4>

        <FileDropzone
          accept="image/*"
          multiple
          files={files}
          onFiles={setFiles}
          hint="Multiple images → one PDF (one image per page), in-browser"
        />

        <div>
          <label className="mb-1 block text-xs font-semibold">Page size</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as PageSize)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none dark:border-slate-600 dark:bg-slate-700"
          >
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
            <option value="fit">Fit to image</option>
          </select>
        </div>

        {files.length > 0 && (
          <p className="text-xs text-slate-500">
            {files.length} image{files.length === 1 ? '' : 's'} · {formatBytes(total)}
          </p>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={process}
          disabled={processing || !files.length}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          Create PDF
        </button>
      </div>

      <ResultPreview
        originalSize={files.length ? total : undefined}
        resultSize={resultSize}
        resultLabel="PDF"
        processing={processing}
        progress={processing ? 40 : null}
        onDownload={
          resultBlob ? () => downloadBlob(resultBlob, 'images.pdf') : undefined
        }
        downloadLabel="Download PDF"
      />
    </div>
  )
}
