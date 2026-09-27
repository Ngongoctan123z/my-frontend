

type Props = {
  src: string
  title: string
}

export function DocxViewer({ src, title }: Props) {
  return (
    <div id="docx-preview" className="bg-surface border-line flex flex-col overflow-hidden rounded-2xl border">
      <div className="border-line flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-medium">Nội dung tài liệu (Word) - {title}</p>
      </div>

      <div className="bg-page relative w-full h-[70vh] md:h-[75vh]">
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(src)}&embedded=true`}
          className="w-full h-full border-none"
          title={title}
          loading="lazy"
        />
      </div>
    </div>
  )
}
