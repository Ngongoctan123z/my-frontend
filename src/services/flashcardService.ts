import { apiFetch } from './api'

export type Deck = {
  id: number
  title: string
  description: string
  type: 'IELTS' | 'TOEIC'
  totalCards: number
  dueCards: number
  newCards: number
}

export type Flashcard = {
  id: number
  deckId: number
  frontHtml: string
  backHtml: string
  audioUrl?: string
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

export async function getDecks(type: 'IELTS' | 'TOEIC'): Promise<Deck[]> {
  // We will call the backend, e.g. /flashcards/decks?type=IELTS
  // For now, if backend isn't ready, we fallback or just let it fetch
  try {
    return await apiFetch<Deck[]>(`/flashcards/decks?type=${type}`)
  } catch (error) {
    // Tạm thời trả về mock data để test UI nếu API chưa có
    return [
      {
        id: 1,
        title: `Từ vựng ${type} cốt lõi phần 1`,
        description: `Bộ từ vựng cơ bản và quan trọng nhất cho bài thi ${type}.`,
        type,
        totalCards: 500,
        dueCards: 20,
        newCards: 15
      },
      {
        id: 2,
        title: `Thành ngữ và Cụm từ ${type}`,
        description: `Tổng hợp idioms và collocations ăn điểm.`,
        type,
        totalCards: 300,
        dueCards: 5,
        newCards: 0
      }
    ]
  }
}

export async function getDeckById(id: number): Promise<Deck | null> {
  try {
    return await apiFetch<Deck>(`/flashcards/decks/${id}`)
  } catch (error) {
    return {
      id,
      title: `Bộ từ vựng Demo`,
      description: `Mô tả chi tiết bộ từ vựng.`,
      type: 'IELTS',
      totalCards: 100,
      dueCards: 10,
      newCards: 5
    }
  }
}

// Lấy danh sách thẻ cần học (due) và thẻ mới (new) hôm nay
export async function getStudySession(deckId: number, limit: number = 20): Promise<Flashcard[]> {
  try {
    return await apiFetch<Flashcard[]>(`/flashcards/decks/${deckId}/study?limit=${limit}`)
  } catch (error) {
    return [
      {
        id: 101,
        deckId,
        frontHtml: "<h2 style='text-align: center;'>Ubiquitous (adj)</h2>",
        backHtml: "<p><strong>Nghĩa:</strong> Có mặt ở khắp mọi nơi (rất phổ biến).</p><p><strong>Ví dụ:</strong> Smartphones have become ubiquitous in modern society.</p>"
      },
      {
        id: 102,
        deckId,
        frontHtml: "<h2 style='text-align: center;'>Meticulous (adj)</h2>",
        backHtml: "<p><strong>Nghĩa:</strong> Tỉ mỉ, quá kỹ càng.</p><p><strong>Ví dụ:</strong> He is very meticulous about his work.</p>"
      },
      {
        id: 103,
        deckId,
        frontHtml: "<h2 style='text-align: center;'>To take something for granted</h2>",
        backHtml: "<p><strong>Nghĩa:</strong> Coi điều gì đó là hiển nhiên, không biết trân trọng.</p><p><strong>Ví dụ:</strong> We often take our health for granted until we get sick.</p>"
      }
    ]
  }
}

// Gửi kết quả đánh giá (SM-2 logic) về server
export async function submitCardReview(cardId: number, grade: ReviewGrade): Promise<{ nextReview: string }> {
  try {
    return await apiFetch<{ nextReview: string }>(`/flashcards/cards/${cardId}/review`, {
      method: 'POST',
      body: JSON.stringify({ grade })
    })
  } catch (error) {
    // Mock response
    return { nextReview: new Date(Date.now() + 86400000).toISOString() }
  }
}
