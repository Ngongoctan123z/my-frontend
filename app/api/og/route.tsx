import { ImageResponse } from 'next/og'
import { getExamById } from '../../../src/services/examService'
import { examTypeLabel, pathToExamType, slugify } from '../../../src/utils/slug'
import { SUBJECTS, PROVINCES } from '../../../src/utils/constants'
import { NextRequest } from 'next/server'


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
  let title = 'VNDocs'

  const titleParam = searchParams.get('title')
  const descParam = searchParams.get('description')

  let isGeneric = false;

  if (slug.length === 0 && titleParam) {
    isGeneric = true;
    title = titleParam;
  } else {
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
      console.error(e)
    }
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
          padding: '60px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 'bold', marginBottom: 20, color: '#f39c12' }}>
          VNDocs.net
        </div>
        
        <div style={{ fontSize: isGeneric ? 55 : 60, fontWeight: 'bolder', marginBottom: 30, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {title}
        </div>

        {isGeneric ? (
          descParam && (
            <div style={{ fontSize: 30, opacity: 0.9, marginTop: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {descParam.length > 120 ? descParam.substring(0, 120) + '...' : descParam}
            </div>
          )
        ) : (
          <div style={{ display: 'flex', gap: '20px', fontSize: 30 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '10px' }}>
              Môn: {subject}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '10px' }}>
              Nơi: {province}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '10px' }}>
              Năm: {year}
            </div>
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}

