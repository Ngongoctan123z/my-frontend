'use client'

import Link from 'next/link'

import { Button } from '../components/ui/Button'

export function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold">Không tìm thấy trang</h1>
      <p className="text-ink-muted mt-3">Nội dung không tồn tại hoặc đã được gỡ.</p>
      <Link prefetch={false} href="/" className="mt-6 inline-block">
        <Button>Về trang chủ</Button>
      </Link>
    </div>
  )
}
