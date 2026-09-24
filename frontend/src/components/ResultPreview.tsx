import { Download } from 'lucide-react'
import { compressionPercent, formatBytes } from '../lib/utils'

interface ResultPreviewProps {
  originalSize?: number
  resultSize?: number
  originalPreview?: string | null
  resultPreview?: string | null
  resultLabel?: string
  onDownload?: () => void
  downloadLabel?: string
  processing?: boolean
  progress?: number | null
}

export function ResultPreview({
  originalSize,
  resultSize,
  originalPreview,
  resultPreview,
  resultLabel = 'Result',
  onDownload,
  downloadLabel = 'Download',
  processing,
  progress,
}: ResultPreviewProps) {
  const saved =
    originalSize != null && resultSize != null
      ? compressionPercent(originalSize, resultSize)
      : null

  return (
    <div className="flex h-full flex-col justify-between space-y-4">
      {(originalPreview !== undefined || resultPreview !== undefined) && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Preview</h4>
            {saved != null && resultSize != null && (
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  saved >= 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {saved >= 0 ? `Reduced ${saved}%` : `Larger ${Math.abs(saved)}%`}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <PreviewBox
              title="Original"
              src={originalPreview}
              size={originalSize}
              empty="No file"
            />
            <PreviewBox
              title={resultLabel}
              src={resultPreview}
              size={resultSize}
              empty={processing ? 'Processing…' : 'Awaiting process'}
              accent
            />
          </div>
        </div>
      )}

      {processing && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${progress ?? 35}%` }}
            />
          </div>
          <p className="text-center text-xs text-slate-500">Processing…</p>
        </div>
      )}

      {onDownload && resultSize != null && (
        <button
          type="button"
          onClick={onDownload}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" />
          {downloadLabel}
        </button>
      )}
    </div>
  )
}

function PreviewBox({
  title,
  src,
  size,
  empty,
  accent,
}: {
  title: string
  src?: string | null
  size?: number
  empty: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
      <p
        className={`mb-1 text-[11px] font-semibold ${
          accent ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'
        }`}
      >
        {title}
      </p>
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
        {src ? (
          <img src={src} alt={title} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-slate-400">{empty}</span>
        )}
      </div>
      <p
        className={`mt-1 text-[11px] font-medium ${
          accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        {size != null ? formatBytes(size) : '—'}
      </p>
    </div>
  )
}
