export type ToolCategory = 'image' | 'pdf' | 'doc' | 'app' | 'qr' | 'file'

export type ProcessingMode = 'client' | 'server'

export interface ToolDefinition {
  id: string
  name: string
  cat: ToolCategory
  mvp: boolean
  icon: string
  desc: string
  badge?: string
  /** Whether this Phase-0 tool is implemented */
  live: boolean
  processing: ProcessingMode
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: 'img-compressor',
    name: 'Image Compressor',
    cat: 'image',
    mvp: true,
    icon: 'Minimize2',
    desc: 'Reduce image size while maintaining visual quality.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'img-target-kb',
    name: 'Reduce Image to Target KB',
    cat: 'image',
    mvp: true,
    icon: 'Target',
    desc: 'Compress image precisely to a target file size (e.g., 50KB, 100KB, 200KB).',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'img-resizer',
    name: 'Image Resizer',
    cat: 'image',
    mvp: true,
    icon: 'Scaling',
    desc: 'Resize image dimensions by custom pixels or percentages.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'img-converter',
    name: 'JPG / PNG / WebP Converter',
    cat: 'image',
    mvp: true,
    icon: 'Repeat',
    desc: 'Convert image formats seamlessly between JPG, PNG, and WEBP.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'img-heic-jpg',
    name: 'HEIC → JPG',
    cat: 'image',
    mvp: true,
    icon: 'Smartphone',
    desc: 'Convert iPhone HEIC/HEIF photos to JPG.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'img-to-pdf',
    name: 'Image to PDF',
    cat: 'image',
    mvp: true,
    icon: 'FileText',
    desc: 'Combine single or multiple images into a clean PDF document.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'img-passport',
    name: 'Passport Photo Generator',
    cat: 'app',
    mvp: true,
    icon: 'UserCheck',
    desc: 'Create standard size photos for official job and college applications.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'img-signature',
    name: 'Signature Resizer',
    cat: 'app',
    mvp: true,
    icon: 'PenTool',
    desc: 'Prepare and resize digital signatures to required dimensions and target KB.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'doc-scanner',
    name: 'Document Scanner',
    cat: 'app',
    mvp: true,
    icon: 'Scan',
    desc: 'Clean up document photos with enhance, grayscale, or black & white modes.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'img-cropper',
    name: 'Image Cropper',
    cat: 'image',
    mvp: false,
    icon: 'Crop',
    desc: 'Crop unwanted areas from your photos effortlessly.',
    live: false,
    processing: 'client',
  },
  {
    id: 'pdf-compressor',
    name: 'PDF Compressor',
    cat: 'pdf',
    mvp: true,
    icon: 'FileDigit',
    desc: 'Reduce large PDF file sizes for easy email sharing.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'pdf-target-kb',
    name: 'PDF Target Size Compressor',
    cat: 'pdf',
    mvp: true,
    icon: 'FileSliders',
    desc: 'Compress PDF to specific KB target limit.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'pdf-merge',
    name: 'PDF Merge',
    cat: 'pdf',
    mvp: true,
    icon: 'Layers',
    desc: 'Combine multiple PDF documents into a single organized file.',
    badge: 'Live',
    live: true,
    processing: 'server',
  },
  {
    id: 'pdf-split',
    name: 'PDF Split',
    cat: 'pdf',
    mvp: true,
    icon: 'Scissors',
    desc: 'Split a large PDF into smaller separate documents or individual pages.',
    badge: 'Live',
    live: true,
    processing: 'server',
  },
  {
    id: 'pdf-extractor',
    name: 'PDF Page Extractor',
    cat: 'pdf',
    mvp: true,
    icon: 'FileOutput',
    desc: 'Extract specific pages from your PDF file.',
    badge: 'Live',
    live: true,
    processing: 'server',
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word (DOCX)',
    cat: 'pdf',
    mvp: true,
    icon: 'FileType2',
    desc: 'Convert PDF documents into editable Microsoft Word files.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    cat: 'pdf',
    mvp: true,
    icon: 'FileImage',
    desc: 'Extract all pages of a PDF into high quality JPG images.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'doc-word-pdf',
    name: 'Word to PDF',
    cat: 'doc',
    mvp: true,
    icon: 'FileCheck',
    desc: 'Convert Microsoft Word documents (DOCX) to PDF format.',
    badge: 'Live',
    live: true,
    processing: 'server',
  },
  {
    id: 'doc-excel-pdf',
    name: 'Excel to PDF',
    cat: 'doc',
    mvp: true,
    icon: 'Sheet',
    desc: 'Convert Excel spreadsheets (XLSX) to clean PDF reports.',
    badge: 'Live',
    live: true,
    processing: 'server',
  },
  {
    id: 'doc-ppt-pdf',
    name: 'PowerPoint to PDF',
    cat: 'doc',
    mvp: true,
    icon: 'Presentation',
    desc: 'Convert PowerPoint slides to PDF presentations.',
    badge: 'Live',
    live: true,
    processing: 'server',
  },
  {
    id: 'doc-ocr',
    name: 'Image & PDF OCR Text Extractor',
    cat: 'doc',
    mvp: true,
    icon: 'ScanText',
    desc: 'Extract editable text from scanned documents and images.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    cat: 'qr',
    mvp: true,
    icon: 'QrCode',
    desc: 'Generate custom QR codes for Website Links, Wi-Fi, UPI Payments, or vCards.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'barcode-generator',
    name: 'Barcode Generator',
    cat: 'qr',
    mvp: false,
    icon: 'Barcode',
    desc: 'Generate standard barcodes (Code 128, EAN, UPC) for products.',
    live: false,
    processing: 'client',
  },
  {
    id: 'file-json-beautify',
    name: 'JSON Beautifier',
    cat: 'file',
    mvp: true,
    icon: 'Braces',
    desc: 'Pretty-print or minify JSON with validation, copy, and download.',
    badge: 'Live',
    live: true,
    processing: 'client',
  },
  {
    id: 'file-base64',
    name: 'Base64 Encoder & Decoder',
    cat: 'file',
    mvp: false,
    icon: 'Binary',
    desc: 'Encode strings/files to Base64 or decode Base64 data strings.',
    live: false,
    processing: 'client',
  },
  {
    id: 'file-size-calc',
    name: 'File Size Unit Converter',
    cat: 'file',
    mvp: false,
    icon: 'Calculator',
    desc: 'Convert digital storage units between Bytes, KB, MB, GB, and TB.',
    live: false,
    processing: 'client',
  },
]

export const CATEGORIES = [
  { id: 'all' as const, label: 'MVP Featured' },
  { id: 'image' as const, label: 'Image Tools' },
  { id: 'pdf' as const, label: 'PDF Utilities' },
  { id: 'doc' as const, label: 'Documents' },
  { id: 'app' as const, label: 'Submission Tools' },
  { id: 'qr' as const, label: 'QR & Barcode' },
  { id: 'file' as const, label: 'File Utilities' },
]

export type CategoryFilter = (typeof CATEGORIES)[number]['id']

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((t) => t.id === id)
}

export function suggestToolForFile(file: File): string {
  if (file.type.startsWith('image/')) return 'img-compressor'
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return 'pdf-merge'
  }
  if (
    file.type === 'application/json' ||
    file.name.toLowerCase().endsWith('.json')
  ) {
    return 'file-json-beautify'
  }
  return 'img-compressor'
}
