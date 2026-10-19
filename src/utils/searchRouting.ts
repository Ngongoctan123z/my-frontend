export function getSmartRoute(query: string): string {
  const value = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
  if (/speaking|luyen noi|noi tieng|ghi am/.test(value)) return '/speaking'
  if (/toeic|toiec/.test(value)) return '/ai-grader/toeic'
  if (/topik|tieng han/.test(value)) return '/ai-grader/topik'
  if (/hsk|tieng trung/.test(value)) return '/ai-grader/hsk'
  if (/ielts|ietls|ietsl/.test(value)) return '/ai-grader/ielts'
  return '/ai-grader'
}
