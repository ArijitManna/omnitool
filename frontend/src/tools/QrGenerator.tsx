import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { RefreshCw } from 'lucide-react'
import { ResultPreview } from '../components/ResultPreview'
import { downloadDataUrl } from '../lib/utils'

export function QrGenerator() {
  const [text, setText] = useState('https://example.com')
  const [size, setSize] = useState(256)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [byteSize, setByteSize] = useState<number | undefined>()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    const value = text.trim()
    if (!value) {
      setError('Enter text or a URL to encode.')
      return
    }
    setError(null)
    setProcessing(true)
    try {
      const url = await QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'M',
      })
      setDataUrl(url)
      // approximate PNG size from base64
      const head = 'data:image/png;base64,'
      const approx = Math.round(((url.length - head.length) * 3) / 4)
      setByteSize(approx)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'QR generation failed')
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    void generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial preview only
  }, [])

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          QR content
        </h4>

        <div>
          <label className="mb-1 block text-xs font-semibold">Text / URL</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-600 dark:bg-slate-700"
            placeholder="https://… or any text"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Size: {size}px</label>
          <input
            type="range"
            min={128}
            max={512}
            step={32}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={generate}
          disabled={processing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          Generate QR
        </button>
        <p className="text-[11px] text-slate-500">Generated entirely in your browser. Nothing is uploaded.</p>
      </div>

      <ResultPreview
        resultSize={byteSize}
        resultPreview={dataUrl}
        resultLabel="QR preview"
        processing={processing}
        onDownload={
          dataUrl
            ? () => downloadDataUrl(dataUrl, 'omnifile-qr.png')
            : undefined
        }
        downloadLabel="Download PNG"
      />
    </div>
  )
}
