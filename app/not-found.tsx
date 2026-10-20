import { NotFound } from '../src/views/NotFound'

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Không tìm thấy trang | VNDocs',
}

export default function NotFoundPage() {
  return <NotFound />
}


