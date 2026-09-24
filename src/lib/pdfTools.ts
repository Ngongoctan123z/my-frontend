import { PDFDocument } from 'pdf-lib'

/**
 * Tách các trang cụ thể từ một file PDF và trả về Blob.
 * @param file File PDF gốc
 * @param pageIndices Mảng chỉ số các trang cần trích xuất (0-indexed)
 * @returns Blob của file PDF mới
 */
export async function extractPDFPages(file: File, pageIndices: number[]): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  const newPdfDoc = await PDFDocument.create()
  const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices)
  copiedPages.forEach((page) => newPdfDoc.addPage(page))
  const pdfBytes = await newPdfDoc.save()
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
}
