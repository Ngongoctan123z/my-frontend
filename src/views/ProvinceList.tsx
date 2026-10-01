'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Breadcrumb } from '../components/common/Breadcrumb'
import { Card } from '../components/ui/Card'
import { getProvinces } from '../services/examService'
import { SUBJECTS } from '../utils/constants'
import { examTypeLabel, pathToExamType, slugify } from '../utils/slug'

export function ProvinceList() {
  const params = useParams() as { examType?: string; subject?: string; province?: string; year?: string };
  const examType = params?.examType || 'vao-10';
  const subject = params?.subject || 'toan';
  const province = params?.province || 'nam-dinh';
  const type = pathToExamType(examType)
  const subjectLabel = SUBJECTS.find((item) => slugify(item) === subject) ?? subject
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'name' | 'years'>('name')

  const provinces = useQuery({
    queryKey: ['provinces', type, subjectLabel],
    queryFn: () => getProvinces(type, subjectLabel),
  })

  const items = useMemo(() => {
    const list = [...(provinces.data ?? [])].filter((item) =>
      item.province.toLowerCase().includes(query.toLowerCase()),
    )
    list.sort((a, b) =>
      sort === 'years' ? b.yearCount - a.yearCount : a.province.localeCompare(b.province, 'vi'),
    )
    return list
  }, [provinces.data, query, sort])

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: examTypeLabel(type), to: `/category/${examType}` },
          { label: subjectLabel },
        ]}
      />
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h1 className="text-3xl font-bold">
          {subjectLabel} - {examTypeLabel(type)}
        </h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tỉnh"
            className="border-line bg-surface min-h-11 rounded-xl border px-3"
          />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as 'name' | 'years')}
            className="border-line bg-surface min-h-11 rounded-xl border px-3"
          >
            <option value="name">Sắp xếp: Tên</option>
            <option value="years">Sắp xếp: Số năm</option>
          </select>
        </div>
      </div>
      {provinces.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Link key={index} prefetch={false} href={`/exams/${examType}/${subject}/${slugify(item.province)}`}>
              <Card className="exam-card fade-in" style={{ animationDelay: `${index * 40}ms` }}>
                <h2 className="text-xl font-semibold">{item.province}</h2>
                <p className="text-ink-muted mt-2 text-sm">{item.yearCount} năm đề</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
