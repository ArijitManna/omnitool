import { Document, Packer, Paragraph, TextRun } from 'docx'
import { loadPdfDocument } from './pdfClient'

/** Extract selectable text from a PDF via pdf.js and build a simple DOCX. */
export async function pdfToDocx(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const pdf = await loadPdfDocument(file)
  const children: Paragraph[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const strings = content.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .filter(Boolean)

    const pageText = strings.join(' ').replace(/\s+/g, ' ').trim()

    if (pageNum > 1) {
      children.push(
        new Paragraph({
          children: [new TextRun({ break: 1 })],
        }),
      )
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `— Page ${pageNum} —`,
            bold: true,
            size: 20,
            color: '64748B',
          }),
        ],
      }),
    )

    if (pageText) {
      // Split into paragraphs roughly by periods for readability
      const chunks = pageText.split(/(?<=\.)\s+/).filter(Boolean)
      for (const chunk of chunks) {
        children.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: chunk, size: 22 })],
          }),
        )
      }
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '[No extractable text on this page — use OCR for scanned PDFs]',
              italics: true,
              size: 20,
              color: '94A3B8',
            }),
          ],
        }),
      )
    }

    onProgress?.(pageNum, pdf.numPages)
  }

  const doc = new Document({
    sections: [{ children }],
  })

  return Packer.toBlob(doc)
}
