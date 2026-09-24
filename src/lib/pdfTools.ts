import { PDFDocument } from 'pdf-lib'

/**
 * Xóa các trang cụ thể từ một file PDF và trả về Blob.
 * @param file File PDF gốc
 * @param pagesToDelete Mảng chỉ số các trang CẦN XÓA (0-indexed)
 * @returns Blob của file PDF mới
 */
export async function removePDFPages(file: File, pagesToDelete: number[]): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  // Xóa từ trang cuối lên trang đầu để không làm thay đổi index của các trang chưa xóa
  const sortedToDelete = [...pagesToDelete].sort((a, b) => b - a)
  
  for (const pageIndex of sortedToDelete) {
    pdfDoc.removePage(pageIndex)
  }
  
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
}

/**
 * Gộp nhiều file PDF thành 1 file duy nhất.
 * @param files Mảng các File PDF
 * @returns Blob của file PDF mới
 */
export async function mergePDFs(files: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create()
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
    copiedPages.forEach((page) => mergedPdf.addPage(page))
  }
  
  const pdfBytes = await mergedPdf.save()
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
}
