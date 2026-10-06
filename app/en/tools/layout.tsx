import { ToolsBanner } from '@/src/components/tools/ToolsBanner'

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <ToolsBanner />
      {children}
    </div>
  )
}
