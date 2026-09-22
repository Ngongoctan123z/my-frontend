import { ImageResponse } from 'next/og'
import { getExamByPath, getExamById } from '../../../src/services/examService'
import { examTypeLabel, pathToExamType, slugify } from '../../../src/utils/slug'
import { SUBJECTS, PROVINCES } from '../../../src/utils/constants'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slugParam = searchParams.get('slug')
  let slug: string[] = []
  if (slugParam) {
    slug = slugParam.split('/')
  }

  let subject = 'Tổng hợp'
  let province = 'Việt Nam'
  let year = ''
  let type = 'Kỳ Thi'
  let title = 'Kho Đề Thi'

  try {
    if (slug.length === 1) {
      const id = Number(slug[0])
      if (!isNaN(id)) {
        const exam = await getExamById(id)
        if (exam) {
          subject = exam.subject
          province = exam.province
          year = String(exam.year)
          type = examTypeLabel(exam.examType)
          title = exam.title || `Đề thi ${subject} ${type} ${province} ${year}`
        }
      }
    } else if (slug.length >= 4) {
      type = examTypeLabel(pathToExamType(slug[0]))
      subject = SUBJECTS.find((item) => slugify(item) === slug[1]) ?? slug[1]
      province = PROVINCES.find((item) => slugify(item) === slug[2]) ?? slug[2]
      year = slug[3]
      title = `Đề thi ${subject} ${type} ${province} ${year}`
    }
  } catch (e) {
    // Ignore errors and use default
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to right, #005c97, #363795)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 'bold', marginBottom: 20, color: '#f39c12' }}>
          KHO ĐỀ THI
        </div>
        
        <div style={{ fontSize: 60, fontWeight: 'bolder', textAlign: 'center', marginBottom: 30 }}>
          {title}
        </div>
        
        <div style={{ display: 'flex', gap: '20px', fontSize: 30 }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '10px' }}>
            Môn: {subject}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '10px' }}>
            Nơi ra đề: {province}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '10px' }}>
            Năm: {year}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
