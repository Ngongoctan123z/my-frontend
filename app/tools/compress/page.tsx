import { CompressClient } from './CompressClient'

export async function generateMetadata() {
  return getRouteMetadata(
    '/tools/compress/page.tsx',
    'Nén Ảnh & File (ZIP) Miễn Phí',
    'Công cụ nén ảnh (giảm dung lượng) và nén nhiều file thành một file .zip hoàn toàn trên trình duyệt, không cần tải lên server, an toàn 100%.'
  )
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Nén Ảnh & File ZIP",
  "operatingSystem": "Web",
  "applicationCategory": "UtilitiesApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "VND"
  }
};

export default function CompressPage() {
  return (
    <main className="min-h-screen bg-surface p-4 md:p-10 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
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
        
        {/* SEO Content Box */}
        <section className="mt-16 pt-12 border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Hướng Dẫn Nén Ảnh & Đóng Gói File ZIP Toàn Diện</h2>
            <p className="mb-6 text-slate-600 text-center leading-relaxed">
              Việc tối ưu hóa dung lượng lưu trữ là cực kỳ quan trọng. Công cụ <strong>Nén Ảnh và Tạo File ZIP</strong> của VNDocs là giải pháp hoàn hảo để chia sẻ tệp tin dung lượng lớn mà không làm giảm chất lượng.
            </p>

            <div className="space-y-4">
              <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
                <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                  1. Lợi Ích Của Việc Nén Ảnh & ZIP File
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Giảm dung lượng:</strong> Các file ảnh (JPG, PNG) thường có kích thước rất lớn. Tính năng nén ảnh của chúng tôi giúp giảm tối đa dung lượng mà vẫn giữ được độ nét tự nhiên.</li>
                    <li><strong>Dễ dàng chia sẻ:</strong> Thay vì phải đính kèm từng file rời rạc vào email, bạn có thể gom toàn bộ chúng thành một file ZIP gọn gàng duy nhất để gửi đi nhanh chóng.</li>
                    <li><strong>Tiết kiệm băng thông:</strong> Upload và download file ZIP sẽ tốn ít thời gian và dữ liệu mạng hơn rất nhiều so với file gốc.</li>
                  </ul>
                </div>
              </details>

              <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
                <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                  2. Khả Năng Hoạt Động Hoàn Toàn Offline
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                  <p>Với công nghệ WebAssembly tiên tiến, VNDocs biến trình duyệt của bạn thành một phần mềm nén file thực thụ. Bạn chỉ cần tải trang web một lần, sau đó toàn bộ quá trình nén và đóng gói ZIP sẽ được thực hiện <strong>trực tiếp trên máy tính của bạn</strong>. Dữ liệu tuyệt đối không bị tải lên bất kỳ máy chủ nào, đảm bảo bảo mật 100%.</p>
                </div>
              </details>

              <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
                <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                  3. Hướng Dẫn Sử Dụng Chi Tiết
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Kéo thả hoặc chọn các file ảnh/tài liệu bạn cần xử lý vào khu vực tải lên.</li>
                    <li>Điều chỉnh thanh trượt mức độ nén ảnh (ví dụ: 80% là mức cân bằng giữa dung lượng và chất lượng).</li>
                    <li>Bấm nút <strong>Tạo File ZIP</strong> để đóng gói.</li>
                    <li>Tải xuống file .zip thành phẩm với dung lượng đã được tối ưu tối đa.</li>
                  </ol>
                </div>
              </details>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
