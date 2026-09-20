import { BookOpen, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Breadcrumb } from '../components/common/Breadcrumb'
import { Card } from '../components/ui/Card'

export function CategorySelect() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Chọn kỳ thi' }]} />
      <h1 className="mb-6 text-3xl font-bold">Chọn loại đề</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link to="/category/vao-10">
          <Card className="exam-card h-full">
            <GraduationCap className="mb-3 text-[var(--color-primary)]" size={32} />
            <h2 className="text-2xl font-semibold">Vào 10</h2>
            <p className="text-ink-muted mt-2">Đề thi tuyển sinh vào lớp 10 theo tỉnh thành.</p>
          </Card>
        </Link>
        <Link to="/category/thpt">
          <Card className="exam-card h-full">
            <BookOpen className="mb-3 text-[var(--color-accent)]" size={32} />
            <h2 className="text-2xl font-semibold">THPT</h2>
            <p className="text-ink-muted mt-2">Đề thi tốt nghiệp THPT và ôn tập.</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
