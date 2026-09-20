import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold">Không tìm thấy trang</h1>
      <p className="text-ink-muted mt-3">Đường dẫn không tồn tại hoặc đề thi đã bị gỡ.</p>
      <Link to="/" className="mt-6 inline-block">
        <Button>Về trang chủ</Button>
      </Link>
    </div>
  )
}
