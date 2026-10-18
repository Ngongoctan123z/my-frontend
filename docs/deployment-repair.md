# Build và triển khai VNDocs

## Luồng hiện tại

- GitHub Actions `.github/workflows/ci.yml` chạy 36 regression tests và full
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
5. Khi `next build` dựng trang tĩnh, SEO trả dữ liệu mặc định và không gọi D1.
   Cờ `VNDOCS_STATIC_BUILD=1` chỉ được đặt cho tiến trình con của build.
   Khi chạy website, SEO vẫn truy vấn D1; thiếu binding thật vẫn được báo lỗi.

## Chạy kiểm tra

Dùng Node 24:

```sh
npm ci
npm run test:api-rotation
npm run test:grader-submissions
npm run test:build-seo
npm run pages:build
```

`npm run build` gọi wrapper trong `scripts/build-next.mjs` để đặt cờ build
chỉ cho Next.js. Không đặt cờ này trong Cloudflare runtime variables hoặc
`next.config.env`.

Cảnh báo deprecation từ dependencies không phải lỗi compile. Các dependency
chính chưa được nâng major đồng loạt vì cần một đợt kiểm thử tương thích riêng.
