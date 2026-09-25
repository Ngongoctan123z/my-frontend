import { Metadata } from 'next'
import Link from 'next/link'
import { getDecks } from '@/src/services/flashcardService'
import { BookOpen, Play, CheckCircle2, Inbox } from 'lucide-react'

type Props = {
  params: Promise<{ type: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  const upperType = type.toUpperCase()
  return {
    title: `Học Flashcard ${upperType} | VNDocs`,
    description: `Hệ thống học từ vựng Flashcard ${upperType} áp dụng thuật toán lặp lại ngắt quãng (Spaced Repetition).`
  }
}

export default async function FlashcardListPage({ params }: Props) {
  const { type } = await params
  const upperType = type.toUpperCase() as 'IELTS' | 'TOEIC'
  
  const decks = await getDecks(upperType)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Flashcard <span className="text-blue-600">{upperType}</span>
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Ứng dụng thuật toán Spaced Repetition (SRS) giúp bạn ghi nhớ từ vựng sâu hơn và lâu hơn. Chọn một bộ bài để bắt đầu ôn tập.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map(deck => (
          <div key={deck.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-2">{deck.title}</h3>
            <p className="text-sm text-slate-500 mb-6 flex-grow">{deck.description}</p>
            
            <div className="flex gap-4 text-sm font-medium mb-5">
              <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <Inbox size={16} /> {deck.newCards} mới
              </div>
              <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded">
                <BookOpen size={16} /> {deck.dueCards} cần ôn
              </div>
            </div>

            <Link 
              href={`/flashcard/deck/${deck.id}`}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              <Play size={16} /> Bắt đầu học
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
