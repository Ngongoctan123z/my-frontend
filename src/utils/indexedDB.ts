export interface GradedEssayHistory {
  email: string
  id: string
  examType: string
  prompt: string
  essay: string
  result: any
  timestamp: number
}

// Fallback to fetch from server if possible
export const saveEssayHistory = async (essay: Omit<GradedEssayHistory, 'id' | 'timestamp'>): Promise<void> => {
  try {
    await fetch('/api/essay-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(essay)
    });
  } catch (error) {
    console.error('Lỗi khi lưu lịch sử:', error);
  }
}

export const getEssayHistory = async (email: string): Promise<GradedEssayHistory[]> => {
  try {
    const res = await fetch('/api/essay-history');
    if (res.ok) {
      const data = await res.json();
      return data.history || [];
    }
  } catch (error) {
    console.error('Lỗi khi tải lịch sử:', error);
  }
  return [];
}

export const clearEssayHistory = async (email: string): Promise<void> => {
  try {
    await fetch('/api/essay-history', {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Lỗi khi xoá lịch sử:', error);
  }
}
