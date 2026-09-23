import './globals.css'
import { Providers } from '../src/components/Providers'
import { Layout as AppLayout } from '../src/components/common/Layout'

export const metadata = {
  title: 'Kho Đề Thi - Đề thi THCS, THPT miễn phí',
  description: 'Kho lưu trữ đề thi, tài liệu học tập THCS, THPT miễn phí. Tải xuống định dạng PDF, Word cực kỳ nhanh chóng.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning className="scroll-smooth">
      <body suppressHydrationWarning>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  )
}
