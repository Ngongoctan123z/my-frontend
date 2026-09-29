export function getSmartRoute(query: string): string {
  let lowerQ = query.toLowerCase().trim()
  if (!lowerQ) return '/tai-lieu'

  // --- AI Grader / IELTS / TOEIC / HSK / TOPIK ---
  if (lowerQ.includes('ielts') || lowerQ.includes('writing ielts') || lowerQ.includes('chấm ielts') || lowerQ.includes('chấm điểm ielts') || lowerQ.includes('chữa ielts')) {
    return '/ai-grader'
  }
  if (lowerQ.includes('toeic') || lowerQ.includes('chấm toeic') || lowerQ.includes('chữa toeic') || lowerQ.includes('writing toeic') || lowerQ.includes('toeic writing')) {
    return '/ai-grader/toeic'
  }
  if (lowerQ.includes('hsk') || lowerQ.includes('tiếng trung') || lowerQ.includes('tieng trung') || lowerQ.includes('chấm hsk') || lowerQ.includes('writing hsk')) {
    return '/ai-grader/hsk'
  }
  if (lowerQ.includes('topik') || lowerQ.includes('tiếng hàn') || lowerQ.includes('tieng han') || lowerQ.includes('chấm topik') || lowerQ.includes('writing topik')) {
    return '/ai-grader/topik'
  }
  if (lowerQ.includes('chấm điểm') || lowerQ.includes('chấm writing') || lowerQ.includes('ai grader') || lowerQ.includes('ai chấm') || lowerQ.includes('sửa bài') || lowerQ.includes('chữa bài') || lowerQ.includes('chữa lỗi') || lowerQ.includes('viết đoạn văn') || lowerQ.includes('viết bài') || lowerQ.includes('ngữ pháp')) {
    return '/ai-grader'
  }

  // --- Tools ---
  if (lowerQ.includes('casio') || lowerQ.includes('máy tính') || lowerQ.includes('may tinh') || lowerQ.includes('calculator') || lowerQ.includes('tính toán') || lowerQ.includes('giải toán')) {
    return '/tools/casio'
  }
  if (lowerQ.includes('đổi ảnh') || lowerQ.includes('doi anh') || lowerQ.includes('chuyển định dạng ảnh') || lowerQ.includes('convert') || lowerQ.includes('png') || lowerQ.includes('jpg') || lowerQ.includes('đổi đuôi') || lowerQ.includes('chuyển ảnh')) {
    return '/tools/convert'
  }
  if (lowerQ.includes('khóa file') || lowerQ.includes('khoa file') || lowerQ.includes('khóa pdf') || lowerQ.includes('mật khẩu') || lowerQ.includes('lock') || lowerQ.includes('bảo mật') || lowerQ.includes('đặt pass') || lowerQ.includes('mở khóa') || lowerQ.includes('unlock')) {
    return '/tools/lock'
  }
  if (lowerQ.includes('xóa trang') || lowerQ.includes('xoa trang') || lowerQ.includes('cắt file') || lowerQ.includes('cat file') || lowerQ.includes('remove page') || lowerQ.includes('cắt pdf') || lowerQ.includes('chia file')) {
    return '/tools/remove-pages'
  }
  if (lowerQ.includes('gộp file') || lowerQ.includes('gop file') || lowerQ.includes('nối file') || lowerQ.includes('merge') || lowerQ.includes('ghép file') || lowerQ.includes('gộp pdf')) {
    return '/tools/merge-files'
  }
  if (lowerQ.includes('công cụ') || lowerQ.includes('cong cu') || lowerQ.includes('tiện ích') || lowerQ.includes('tools') || lowerQ.includes('pdf')) {
    return '/tools'
  }

  // --- Documents / Exams ---
  const params = new URLSearchParams()
  let hasIntent = false

  // Exam Type extraction
  if (lowerQ.match(/thpt|đại học|dai hoc|tốt nghiệp|tot nghiep|lớp 12|lop 12|thi quốc gia|quốc gia/)) {
    params.set('examType', 'THPT')
    hasIntent = true
    lowerQ = lowerQ.replace(/thpt|đại học|dai hoc|tốt nghiệp|tot nghiep|lớp 12|lop 12|thi quốc gia|quốc gia/g, '')
  } else if (lowerQ.match(/vào 10|vao 10|lớp 10|lop 10|tuyển sinh 10|cấp 3|cap 3|chuyên/)) {
    params.set('examType', 'VAO_10')
    hasIntent = true
    lowerQ = lowerQ.replace(/vào 10|vao 10|lớp 10|lop 10|tuyển sinh 10|cấp 3|cap 3|chuyên/g, '')
  }

  // Subject extraction
  if (lowerQ.match(/toán|toan/)) {
    params.set('subject', 'Toán')
    hasIntent = true
    lowerQ = lowerQ.replace(/toán|toan/g, '')
  } else if (lowerQ.match(/ngữ văn|văn|van/)) {
    params.set('subject', 'Ngữ văn')
    hasIntent = true
    lowerQ = lowerQ.replace(/ngữ văn|văn|van/g, '')
  } else if (lowerQ.match(/tiếng anh|tieng anh|anh văn/)) {
    params.set('subject', 'Tiếng Anh')
    hasIntent = true
    lowerQ = lowerQ.replace(/tiếng anh|tieng anh|anh văn/g, '')
  } else if (lowerQ.match(/vật lý|vat ly|lý|ly /)) {
    params.set('subject', 'Vật lý')
    hasIntent = true
    lowerQ = lowerQ.replace(/vật lý|vat ly|lý|ly /g, '')
  } else if (lowerQ.match(/hóa học|hoa hoc|hóa|hoa /)) {
    params.set('subject', 'Hóa học')
    hasIntent = true
    lowerQ = lowerQ.replace(/hóa học|hoa hoc|hóa|hoa /g, '')
  } else if (lowerQ.match(/sinh học|sinh hoc|sinh /)) {
    params.set('subject', 'Sinh học')
    hasIntent = true
    lowerQ = lowerQ.replace(/sinh học|sinh hoc|sinh /g, '')
  } else if (lowerQ.match(/lịch sử|lich su|sử|su /)) {
    params.set('subject', 'Lịch sử')
    hasIntent = true
    lowerQ = lowerQ.replace(/lịch sử|lich su|sử|su /g, '')
  } else if (lowerQ.match(/địa lý|dia ly|địa|dia /)) {
    params.set('subject', 'Địa lý')
    hasIntent = true
    lowerQ = lowerQ.replace(/địa lý|dia ly|địa|dia /g, '')
  } else if (lowerQ.match(/gdcd|công dân|cong dan/)) {
    params.set('subject', 'GDCD')
    hasIntent = true
    lowerQ = lowerQ.replace(/gdcd|công dân|cong dan/g, '')
  }

  // Year extraction
  const yearMatch = lowerQ.match(/20\d{2}/)
  if (yearMatch) {
    params.set('year', yearMatch[0])
    hasIntent = true
    lowerQ = lowerQ.replace(yearMatch[0], '')
  }

  // Cleanup leftover words like "đề thi", "đề", "ôn thi", "tỉnh", "thành phố"
  lowerQ = lowerQ.replace(/đề thi|de thi|đề|de|ôn thi|on thi|tỉnh|tinh|thành phố|thanh pho|năm|nam|bài thi/g, '')

  // What remains can be considered the specific search query (like "hà nội", "nam định")
  const leftoverQ = lowerQ.trim().replace(/\s+/g, ' ')
  
  if (hasIntent) {
    if (leftoverQ) {
      params.set('q', leftoverQ)
    }
    return `/tai-lieu?${params.toString()}`
  }

  // Default fallback if no known intents match
  return `/tai-lieu?q=${encodeURIComponent(query.trim())}`
}
