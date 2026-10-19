import { ImageResponse } from 'next/og'
import { retiredSectionResponse, hasRetiredSeo } from '@/src/lib/siteSections'
import { NextRequest } from 'next/server'


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  if (searchParams.has('slug') || hasRetiredSeo(searchParams.get('title')) || hasRetiredSeo(searchParams.get('description'))) return retiredSectionResponse()
  const title = searchParams.get('title') || 'VNDocs — Writing & Speaking'
  const descParam = searchParams.get('description')
  const isGeneric = true

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

        {descParam && <div style={{ fontSize: 30, opacity: 0.9, marginTop: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>{descParam.length > 120 ? descParam.substring(0, 120) + '...' : descParam}</div>}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}

