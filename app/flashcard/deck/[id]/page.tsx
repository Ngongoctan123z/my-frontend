import { Metadata } from 'next'
import { getDeckById } from '@/src/services/flashcardService'
import { FlashcardStudyClient } from './FlashcardStudyClient'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const deck = await getDeckById(Number(id))
  if (!deck) return { title: 'Không tìm thấy bộ thẻ' }
  return {
    title: `Học Flashcard: ${deck.title} | VNDocs`,
  }
}

export default async function DeckStudyPage({ params }: Props) {
  const { id } = await params
  const deckId = Number(id)
  
  const deck = await getDeckById(deckId)
  if (!deck) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 min-h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">{deck.title}</h1>
        <div className="flex gap-3 text-sm font-semibold">
          <span className="text-blue-600">Mới: {deck.newCards}</span>
          <span className="text-orange-600">Ôn: {deck.dueCards}</span>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col">
        <FlashcardStudyClient deckId={deckId} />
      </div>
    </div>
  )
}
