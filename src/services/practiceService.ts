import { apiFetch } from './api'

export type PracticeTopic = {
  id: string
  name: string
  description: string
}

export type PracticeLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type PracticePrompt = {
  id: number
  topicId: string
  level: PracticeLevel
  vietnameseText: string
  context: string
}

export async function getTopics(): Promise<PracticeTopic[]> {
  try {
    return await apiFetch<PracticeTopic[]>('/practice/topics')
  } catch (error) {
    return [
      { id: 'family', name: 'Gia đình', description: 'Các tình huống giao tiếp trong gia đình' },
      { id: 'education', name: 'Giáo dục & Học tập', description: 'Chủ đề trường lớp, thi cử' },
      { id: 'shopping', name: 'Mua sắm', description: 'Giao tiếp khi đi siêu thị, mua đồ' },
      { id: 'directions', name: 'Chỉ đường', description: 'Hỏi và chỉ đường trên phố' },
      { id: 'work', name: 'Công sở', description: 'Giao tiếp chuyên nghiệp nơi làm việc' },
      { id: 'factory', name: 'Dưới xưởng', description: 'Từ vựng và tình huống trong nhà máy, công xưởng' },
      { id: 'travel', name: 'Du lịch', description: 'Sân bay, khách sạn, nhà hàng' }
    ]
  }
}

export async function getPrompt(topicId: string, level: PracticeLevel): Promise<PracticePrompt> {
  try {
    return await apiFetch<PracticePrompt>(`/practice/prompts?topic=${topicId}&level=${level}`)
  } catch (error) {
    // Mock dữ liệu phong phú dựa trên topic và level
    const mockPrompts: Record<string, Record<string, PracticePrompt>> = {
      family: {
        A1: { id: 1, topicId: 'family', level: 'A1', vietnameseText: 'Gia đình tôi có 4 người.', context: 'Giới thiệu bản thân cơ bản.' },
        B2: { id: 2, topicId: 'family', level: 'B2', vietnameseText: 'Dù bận rộn đến mấy, bố mẹ tôi vẫn cố gắng dành thời gian ăn tối cùng nhau để gắn kết tình cảm.', context: 'Nói về sự gắn kết gia đình trong đời sống hiện đại.' }
      },
      work: {
        B1: { id: 3, topicId: 'work', level: 'B1', vietnameseText: 'Chúng tôi cần hoàn thành báo cáo này trước thứ Sáu tuần sau.', context: 'Thảo luận về deadline trong cuộc họp.' },
        C1: { id: 4, topicId: 'work', level: 'C1', vietnameseText: 'Để tối ưu hóa quy trình làm việc, chúng ta cần tái cấu trúc lại cách phân bổ nguồn lực hiện tại thay vì chỉ chạy theo doanh số ngắn hạn.', context: 'Đề xuất chiến lược trong cuộc họp cấp cao.' }
      },
      factory: {
        A2: { id: 5, topicId: 'factory', level: 'A2', vietnameseText: 'Làm ơn đội mũ bảo hiểm và mặc áo phản quang khi vào khu vực sản xuất.', context: 'Nhắc nhở an toàn lao động cơ bản.' },
        B2: { id: 6, topicId: 'factory', level: 'B2', vietnameseText: 'Dây chuyền lắp ráp số 3 đang bị đình trệ do thiếu hụt linh kiện nhập từ nhà cung cấp phụ.', context: 'Báo cáo sự cố sản xuất cho quản lý.' }
      }
    }

    const fallback: PracticePrompt = {
      id: 999,
      topicId,
      level,
      vietnameseText: `Đây là một câu mẫu giả lập cho chủ đề ${topicId} ở trình độ ${level}. Bạn hãy thử diễn đạt lại bằng tiếng Anh nhé!`,
      context: 'Tình huống giao tiếp chung.'
    }

    if (mockPrompts[topicId] && mockPrompts[topicId][level]) {
      return mockPrompts[topicId][level]
    }
    
    // Fallback if specific combo not found in mock
    const availableLevels = mockPrompts[topicId] ? Object.keys(mockPrompts[topicId]) : []
    if (availableLevels.length > 0) {
       return mockPrompts[topicId][availableLevels[0]] // return any available level for that topic
    }

    return fallback
  }
}
