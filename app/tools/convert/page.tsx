import type { Metadata } from 'next'
import FileConverterWrapper from './FileConverterWrapper'

export const metadata: Metadata = {
  title: 'Chuyển Đổi Định Dạng Ảnh | VNDocs',
  description: 'Chuyển đổi ảnh giữa các định dạng JPG, PNG, WEBP, BMP, GIF, ICO miễn phí và nhanh chóng.',
  alternates: {
    canonical: 'https://vndocs.net/tools/convert',
  },
  openGraph: {
    title: 'Chuyển Đổi Định Dạng Ảnh | VNDocs',
    description: 'Chuyển đổi ảnh giữa các định dạng JPG, PNG, WEBP, BMP, GIF, ICO miễn phí và nhanh chóng.',
    url: 'https://vndocs.net/tools/convert',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chuyển Đổi Định Dạng Ảnh | VNDocs',
    description: 'Chuyển đổi ảnh giữa các định dạng JPG, PNG, WEBP, BMP, GIF, ICO miễn phí và nhanh chóng.',
  }
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Chuyển Đổi Định Dạng Ảnh",
  "operatingSystem": "Web",
  "applicationCategory": "UtilitiesApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "VND"
  }
};

export default function ConvertImagePage() {
  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Chuyển Đổi Định Dạng Ảnh</h1>
        <p className="text-slate-500 font-medium max-w-3xl mx-auto">
          Chuyển đổi hình ảnh giữa các định dạng phổ biến như JPG, PNG, WEBP, BMP, GIF, ICO hoàn toàn miễn phí. Hỗ trợ thao tác hàng loạt, xử lý cục bộ ngay trên trình duyệt giúp bảo mật tuyệt đối dữ liệu.
        </p>
      </div>

      <FileConverterWrapper />

      <section className="mt-16 pt-12 border-t border-gray-100">
        <article className="max-w-4xl mx-auto prose prose-slate">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Công Cụ Chuyển Đổi Định Dạng Ảnh Nhanh Chóng & An Toàn</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Trong môi trường làm việc kỹ thuật số, việc thay đổi định dạng hình ảnh là nhu cầu diễn ra thường xuyên. Cho dù bạn cần định dạng <strong>WEBP</strong> để tối ưu tốc độ tải trang web, định dạng <strong>PNG</strong> để giữ lại nền trong suốt, hay định dạng <strong>JPG</strong> thông dụng để gửi cho đối tác, công cụ của VNDocs đều đáp ứng đầy đủ và hoàn toàn miễn phí.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">1. Tại sao nên sử dụng công cụ của VNDocs?</h3>
          <ul>
            <li><strong>Chuyển đổi siêu tốc không cần mạng:</strong> Mọi quy trình chuyển đổi được thực hiện bằng sức mạnh xử lý ngay trên thiết bị của bạn. Quá trình này diễn ra ngay lập tức mà không phải chờ đợi máy chủ xử lý hay xếp hàng tải xuống.</li>
            <li><strong>Bảo vệ quyền riêng tư 100%:</strong> Hình ảnh cá nhân, tài liệu công ty sẽ <strong>không bao giờ bị tải lên internet</strong>. Chúng tôi tôn trọng sự riêng tư và cam kết công cụ hoạt động hoàn toàn trong chế độ Offline Mode trên trình duyệt của bạn.</li>
            <li><strong>Chất lượng hiển thị nguyên bản:</strong> Các thuật toán tối ưu tiên tiến giúp chuyển đổi qua lại giữa JPG, PNG, WEBP mà vẫn giữ được độ sắc nét và màu sắc trung thực nhất có thể.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">2. Hướng dẫn sử dụng</h3>
          <p>Quy trình vô cùng đơn giản, được thiết kế tối giản hóa tối đa:</p>
          <ol>
            <li><strong>Thêm File:</strong> Kéo và thả nhiều hình ảnh vào khu vực quy định, hoặc click vào nút tải ảnh lên.</li>
            <li><strong>Tùy chọn đầu ra:</strong> Chọn định dạng bạn muốn xuất (ví dụ: chuyển từ PNG sang WEBP hoặc JPG).</li>
            <li><strong>Tải xuống:</strong> Nhấn nút "Chuyển đổi", hình ảnh sẽ được xử lý trong chớp mắt. Bạn có thể tải từng ảnh hoặc bấm Tải tất cả dưới dạng file ZIP.</li>
          </ol>
          
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">3. Sự khác biệt giữa các định dạng</h3>
          <p>
            Mỗi định dạng ảnh có ưu nhược điểm riêng. <strong>JPG</strong> phù hợp cho ảnh chụp nhiều màu sắc, nén tốt giúp giảm dung lượng. <strong>PNG</strong> lý tưởng cho ảnh cần độ nét cao hoặc có nền trong suốt (logo, icon). <strong>WEBP</strong> là định dạng thế hệ mới của Google, giúp ảnh nhẹ hơn JPG và PNG đáng kể nhưng chất lượng không hề thua kém, cực kì thích hợp làm SEO và tăng tốc độ tải website.
          </p>
        </article>
      </section>
    </div>
  )
}
