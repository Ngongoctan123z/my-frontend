import { jsPDF } from 'jspdf'

/**
 * Chuyển đổi một file ảnh (PNG, JPG, JPEG, WEBP) sang file PDF chuẩn A4 / kích thước thực.
 */
export async function convertImageToPdf(imageFile: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width
          const height = img.naturalHeight || img.height
          const isLandscape = width > height

          // Dùng kích thước thực của ảnh để giữ độ nét tối đa
          const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'pt',
            format: [width, height],
          })

          const format = imageFile.type.includes('png') ? 'PNG' : 'JPEG'
          pdf.addImage(img, format, 0, 0, width, height)

          const blob = pdf.output('blob')
          const pdfFileName = imageFile.name.replace(/\.[^/.]+$/, '') + '.pdf'
          const pdfFile = new File([blob], pdfFileName, { type: 'application/pdf' })
          resolve(pdfFile)
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh để chuyển đổi PDF'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('Lỗi khi đọc file ảnh'))
    reader.readAsDataURL(imageFile)
  })
}

/**
 * Kiểm tra file có phải là ảnh
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)
}

/**
 * Kiểm tra file có phải là Word
 */
export function isWordFile(file: File): boolean {
  return (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword' ||
    /\.(docx?)$/i.test(file.name)
  )
}
