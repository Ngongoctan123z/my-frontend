import { TOEIC_PAIRED_SETS, TOEIC_RESPOND_FALLBACKS } from '../data/fallbackPrompts'
import { TOEIC_PICTURE_SETS, type ToeicPictureSet } from '../data/toeicWriting'

export type ToeicPrompt = { id?: string; content: string; imageUrl?: string | null }
export type CompleteToeicSet = {
  id: string | number; title: string; picturePromptId?: string; pictures: ToeicPictureSet
  part1: ToeicPrompt; email7: ToeicPrompt; part2: ToeicPrompt
}
export function fallbackToeicExamSets(): CompleteToeicSet[] {
  return TOEIC_PAIRED_SETS.map((set,index) => ({ ...set, id: `fallback-toeic-${set.id}`,
    pictures: TOEIC_PICTURE_SETS[index % TOEIC_PICTURE_SETS.length],
    email7: TOEIC_RESPOND_FALLBACKS.find(p => p.content !== set.part1.content) || TOEIC_RESPOND_FALLBACKS[0] }))
}
