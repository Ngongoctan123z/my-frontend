# Build và triển khai VNDocs

## Luồng hiện tại

- GitHub Actions `.github/workflows/ci.yml` chạy 40 regression tests và full
  Next.js/OpenNext build trên Node 24.
- Cloudflare Workers Builds nhận commit trên `main` từ kết nối GitHub App
  hiện có và triển khai Worker `my-frontend`.
- `wrangler.jsonc` dùng đúng tên Worker và compatibility date `2026-09-23`,
  phù hợp với workerd đã được cài trong lockfile.
- Không có luồng deploy thứ hai trong GitHub Actions.

Cloudflare đã xác nhận luồng Git hoạt động bằng check
[Workers Builds: my-frontend](https://github.com/Ngongoctan123z/my-frontend/commit/fd24d0588b24e104143b7d3f004725e346b40f8c/checks),
với version `355395d7-3181-495c-8437-57768436ec6c` của bản sửa API đầu tiên.

## Các lỗi đã xử lý

1. Bỏ `--skipNextBuild` để sinh đầy đủ `.next/server/middleware-manifest.json`.
2. Dùng Node 24 cho các phiên bản Wrangler/pdfjs đang cài.
3. Sửa tên Worker cũ `exam-web-frontend` thành `my-frontend` theo metadata
   của check do Cloudflare Workers and Pages phát hành.
4. Bỏ luồng deploy Actions dùng credential/đích riêng đã gây lỗi 403; giữ
   Cloudflare Workers Builds làm luồng triển khai qua Git.
5. SEO dùng `getOptionalDb()`: nếu giai đoạn dựng trang tĩnh chưa có binding D1,
   metadata dùng dữ liệu mặc định mà không phát sinh exception. Khi có D1,
   SEO vẫn đọc cấu hình admin. Các API vẫn dùng `getDb()` bắt buộc và tiếp tục
   báo lỗi nếu thiếu binding; lỗi truy vấn D1 bất thường của SEO vẫn được ghi log.

## Chạy kiểm tra

Dùng Node 24:

```sh
npm ci
npm run test:api-rotation
npm run test:grader-submissions
npm run test:build-seo
npm run pages:build
```

`npm run build` tiếp tục gọi `next build`; việc dựng trang không phụ thuộc
vào cờ môi trường tạm thời hoặc binding database của production.
`getOptionalDb()` và `getDb()` đều phân giải binding theo từng request,
không cache D1 binding ở module scope.

Cảnh báo deprecation từ dependencies không phải lỗi compile. Các dependency
chính chưa được nâng major đồng loạt vì cần một đợt kiểm thử tương thích riêng.
