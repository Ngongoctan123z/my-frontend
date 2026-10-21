import { notFound } from 'next/navigation'
export const metadata = { title: 'Nội dung đã được gỡ | VNDocs', robots: { index: false, follow: false, noarchive: true } }
export default function RetiredPage(): never { notFound() }
