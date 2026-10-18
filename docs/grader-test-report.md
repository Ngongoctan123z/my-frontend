# Báo cáo kiểm thử chấm TOEIC, TOPIK và HSK

Ngày kiểm tra: 2026-10-18. Phiên bản GitHub đối chiếu ban đầu:
`1ef9efa821f64f13cc4c72cd2398cdacbc35d3e6`.

## Phạm vi và kết quả

30/30 ca kiểm thử đạt trong workspace: 15 ca xoay key và 15 ca gửi bài.
Bộ gửi bài thực thi hàm POST, rubric, hậu xử lý điểm và adapter lưu trạng thái
của mã nguồn thật. Next/Auth/Groq/Drizzle là thành phần giả lập; SQLite thực thi
các câu lệnh SQL. Không có yêu cầu nào được gửi tới Groq thật.

Các điểm dưới đây là đầu ra giả lập đã định trước để kiểm tra cấu trúc và
thang điểm. Đây không phải đánh giá chất lượng bài viết do AI thực hiện.

| Bài mẫu | Trạng thái API sau sửa | Điểm giả lập/thang điểm |
| --- | --- | --- |
| TOEIC câu 6–7: trả lời email | HTTP 200 | 4/4 |
| TOEIC câu 8: bài luận hơn 250 từ | HTTP 200 | 5/5 |
| TOPIK câu 51 | HTTP 200 | 8/10 |
| TOPIK câu 52 | HTTP 200 | 8/10 |
| TOPIK câu 53, kèm dữ liệu biểu đồ | HTTP 200 | 24/30 |
| TOPIK câu 54 | HTTP 200 | 40/50 |
| HSK 5: sắp xếp câu, từ khóa, đoạn theo tranh | HTTP 200 | 83/100 |
| HSK 6: tóm tắt tiếng Trung | HTTP 200 | 80/100 |

Bài làm và phản hồi giả lập được lưu trong
`tests/fixtures/gradingSamples.mjs`.

## Lỗi đã tái hiện và sửa trong workspace

1. Chấm trọn bộ lần đầu gửi nhiều yêu cầu song song: bộ đếm ngày đọc rồi
   INSERT riêng lẻ, gây đụng khóa chính `(userId, date)` và lỗi HTTP 500.
   Trước sửa, TOEIC tái hiện `[200, 500]`, TOPIK `[200, 500, 500, 500]`.
   Sau sửa, tất cả yêu cầu trả HTTP 200 và đếm đủ 2/4 lượt. Bộ đếm dùng
   UPSERT có điều kiện và RETURNING, đồng thời giữ nguyên hạn mức tài khoản.
2. API ghi đè kết quả TOPIK thành thang 100. Ví dụ 8/10 thành 8/100 và
   40/50 thành 40/100. Đã giữ thang điểm do bộ hậu xử lý tính ra.
3. Client TOPIK 53 gửi `chartExtra`, trong khi API chỉ đọc `imageDescription`.
   Đã nhận cả hai trường và áp dụng kiểm tra kiểu/độ dài hiện có trước khi chấm.

Các ca bổ sung xác nhận lỗi JSON chuyển sang key kế tiếp; toàn bộ key bị
429 chỉ gọi tối đa một vòng rồi trả thời gian chờ; dữ liệu không hợp lệ hoặc
chưa đăng nhập bị chặn; bốn yêu cầu đồng thời khi còn một lượt chỉ cho phép
một yêu cầu đi tiếp, không vượt hạn mức.

## Cách chạy lại

Yêu cầu Node 22.13 trở lên, khuyến nghị Node 24:

```sh
npm run test:api-rotation
npm run test:grader-submissions
```

Kiểm tra cú pháp các file TypeScript đã sửa cũng đạt. Chưa chạy full Next.js
build hoặc kiểm thử thao tác giao diện trong trình duyệt.

## Trạng thái website thật

Nhánh main trên GitHub vẫn ở commit đối chiếu bên trên; bản vá chưa triển khai.
Trang TOEIC tại https://vndocs.net/ai-grader/toeic mở được qua công cụ web và
yêu cầu đăng nhập Google để làm bài/chấm bài. Các trang TOPIK/HSK không mở được
qua công cụ web; điều này không đủ để kết luận website bị lỗi.

Workspace không có phiên đăng nhập website để gửi bài thật, nên chưa thể xác
nhận chất lượng chấm Groq thực tế.

Cập nhật sau khi khôi phục GitHub App: bản sửa API đã được đẩy trong commit
`fd24d0588b24e104143b7d3f004725e346b40f8c`; Cloudflare Workers Builds đã xác nhận
triển khai thành công vào Worker `my-frontend`. Bộ kiểm thử được bổ sung thêm
6 ca SEO/build, tổng cộng 36 ca. Xem `docs/deployment-repair.md` để biết luồng
build/deploy hiện tại. Việc chấm Groq thật vẫn cần một phiên đăng nhập hợp lệ.
