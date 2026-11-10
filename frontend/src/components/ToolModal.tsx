import { ShieldCheck, X } from 'lucide-react'
import type { ToolDefinition } from '../data/tools'
import { ToolIcon } from './ToolIcon'
import { ComingSoon } from '../tools/ComingSoon'
import { DocumentScanner } from '../tools/DocumentScanner'
import { ExcelToPdf } from '../tools/ExcelToPdf'
import { HeicToJpg } from '../tools/HeicToJpg'
import { ImageCompressor } from '../tools/ImageCompressor'
import { ImageConverter } from '../tools/ImageConverter'
import { ImageResizer } from '../tools/ImageResizer'
import { ImageTargetKb } from '../tools/ImageTargetKb'
import { ImageToPdf } from '../tools/ImageToPdf'
import { JsonBeautifier } from '../tools/JsonBeautifier'
import { OcrExtractor } from '../tools/OcrExtractor'
import { PassportPhoto } from '../tools/PassportPhoto'
import { PdfCompressor } from '../tools/PdfCompressor'
import { PdfExtractor } from '../tools/PdfExtractor'
import { PdfMerge } from '../tools/PdfMerge'
import { PdfSplit } from '../tools/PdfSplit'
import { PdfTargetSize } from '../tools/PdfTargetSize'
import { PdfToJpg } from '../tools/PdfToJpg'
import { PdfToWord } from '../tools/PdfToWord'
import { PptToPdf } from '../tools/PptToPdf'
import { QrGenerator } from '../tools/QrGenerator'
import { SignatureResizer } from '../tools/SignatureResizer'
import { WordToPdf } from '../tools/WordToPdf'

interface ToolModalProps {
  tool: ToolDefinition
  initialFiles: File[]
  onClose: () => void
}

export function ToolModal({ tool, initialFiles, onClose }: ToolModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-3 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        className="relative my-auto flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300">
              <ToolIcon name={tool.icon} className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tool.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tool.desc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {tool.id === 'img-compressor' && <ImageCompressor initialFiles={initialFiles} />}
          {tool.id === 'img-target-kb' && <ImageTargetKb initialFiles={initialFiles} />}
          {tool.id === 'img-resizer' && <ImageResizer initialFiles={initialFiles} />}
          {tool.id === 'img-converter' && <ImageConverter initialFiles={initialFiles} />}
          {tool.id === 'img-heic-jpg' && <HeicToJpg initialFiles={initialFiles} />}
          {tool.id === 'img-to-pdf' && <ImageToPdf initialFiles={initialFiles} />}
          {tool.id === 'img-passport' && <PassportPhoto initialFiles={initialFiles} />}
          {tool.id === 'img-signature' && <SignatureResizer initialFiles={initialFiles} />}
          {tool.id === 'doc-scanner' && <DocumentScanner initialFiles={initialFiles} />}
          {tool.id === 'pdf-compressor' && <PdfCompressor initialFiles={initialFiles} />}
          {tool.id === 'pdf-target-kb' && <PdfTargetSize initialFiles={initialFiles} />}
          {tool.id === 'pdf-merge' && <PdfMerge initialFiles={initialFiles} />}
          {tool.id === 'pdf-split' && <PdfSplit initialFiles={initialFiles} />}
          {tool.id === 'pdf-extractor' && <PdfExtractor initialFiles={initialFiles} />}
          {tool.id === 'pdf-to-jpg' && <PdfToJpg initialFiles={initialFiles} />}
          {tool.id === 'pdf-to-word' && <PdfToWord initialFiles={initialFiles} />}
          {tool.id === 'doc-word-pdf' && <WordToPdf initialFiles={initialFiles} />}
          {tool.id === 'doc-excel-pdf' && <ExcelToPdf initialFiles={initialFiles} />}
          {tool.id === 'doc-ppt-pdf' && <PptToPdf initialFiles={initialFiles} />}
          {tool.id === 'doc-ocr' && <OcrExtractor initialFiles={initialFiles} />}
          {tool.id === 'qr-generator' && <QrGenerator />}
          {tool.id === 'file-json-beautify' && (
            <JsonBeautifier initialFiles={initialFiles} />
          )}
          {!tool.live && <ComingSoon tool={tool} />}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            {tool.processing === 'client'
              ? 'Client-side processing — files stay on your device'
              : 'Secure API processing — temps deleted after use'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
