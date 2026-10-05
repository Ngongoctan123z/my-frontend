import { Metadata } from 'next'
import { CompressClient } from './CompressClient'

export const metadata: Metadata = {
  title: 'Nén Ảnh & File (ZIP) Miễn Phí',
  description: 'Công cụ nén ảnh (giảm dung lượng) và nén nhiều file thành một file .zip hoàn toàn trên trình duyệt, không cần tải lên server, an toàn 100%.',
}

export default function CompressPage() {
  return (
    <main className="min-h-screen bg-surface p-4 md:p-10 font-sans">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-[900] tracking-tight text-ink md:text-4xl mb-3">
            Nén Ảnh & Tạo File ZIP
          </h1>
          <p className="text-ink-muted text-[15px] max-w-2xl mx-auto leading-relaxed">
            Nén giảm dung lượng ảnh hoặc gom nhiều file thành 1 file .zip duy nhất. 
            Mọi thao tác xử lý hoàn toàn <strong className="text-ink font-bold">trên trình duyệt của bạn</strong>, 
            không tải bất kỳ dữ liệu nào lên server, đảm bảo an toàn & riêng tư tuyệt đối!
          </p>
        </header>

        <CompressClient />
      </div>
    </main>
  )
}
