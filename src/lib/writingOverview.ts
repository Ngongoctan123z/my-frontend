export type WritingOverviewExam = 'IELTS' | 'TOEIC' | 'TOPIK' | 'HSK'

export type WritingOverviewSet = {
  id: string
  title: string
  status: 'complete' | 'broken' | 'hidden'
  published: boolean
  children: Record<string, string>
  issues: string[]
}

export type WritingOverviewLevel = {
  totalSets: number
  completeSets: number
  brokenSets: number
  unlinkedPrompts: number
}

export type WritingOverviewCategory = WritingOverviewLevel & {
  exam: WritingOverviewExam
  relationMode: 'stored' | 'legacy' | 'independent'
  componentCounts: Record<string, number>
  /** All unpublished parents; an unpublished parent may also be broken. */
  hiddenSets: number
  /** Complete includes valid unpublished parents. Counts never compare pool sizes. */
  sets: WritingOverviewSet[]
  levels?: Record<'HSK_5' | 'HSK_6', WritingOverviewLevel>
  legacyPairableSets?: number
  legacyLearnerSets?: number
  note?: string
}

export type WritingOverview = {
  source: 'database'
  categories: Record<WritingOverviewExam, WritingOverviewCategory>
}
