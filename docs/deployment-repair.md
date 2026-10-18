# GitHub → Cloudflare: chẩn đoán và bản sửa

Run đã kiểm tra:
https://github.com/Ngongoctan123z/my-frontend/actions/runs/39003352929

Job `deploy` cài dependencies thành công, rồi thất bại ở bước
`Build and Deploy OpenNext`. Log xác nhận:

```text
opennextjs-cloudflare build --skipNextBuild
WARN Skipping Next.js build
Error: ENOENT: no such file or directory, open '.../.next/server/middleware-manifest.json'
```

Workflow chưa chạy tới lệnh triển khai Cloudflare. Các dependencies Wrangler,
Miniflare và pdfjs cũng báo Node 20 không đáp ứng phiên bản engine yêu cầu.
Hai biến `CLOUDFLARE_API_TOKEN` và `CLOUDFLARE_ACCOUNT_ID` được truyền vào job
và được che trong log; điều này xác nhận cấu hình đã tồn tại, chưa xác nhận
token còn hợp lệ hoặc có đủ quyền triển khai.

## Thay đổi đã chuẩn bị

- Dùng Node 24 thay cho 20.
- Bỏ `--skipNextBuild`: `pages:build` thực hiện đầy đủ Next.js/OpenNext build.
- Chạy 30 regression tests trước khi build.
- Tách các bước build, kiểm tra biến xác thực có tồn tại và deploy để log rõ lỗi.
- Thêm `workflow_dispatch` để có thể chạy thủ công từ tab Actions.
- Đặt concurrency cho production và timeout 30 phút.
- Giữ tên Worker, tên miền, D1 binding và cấu hình runtime hiện có.

Workflow YAML đã được parse và kiểm tra lệnh/phiên bản Node tại workspace.
Chưa thể chạy full production build hoặc xác nhận deploy thành công ở đây.

## Việc còn bị chặn

Kết nối GitHub của phiên này đọc được mã nguồn/log, nhưng các lệnh ghi trước
đó bị GitHub trả `403 Resource not accessible by integration`. Mạng terminal
cũng không truy cập được proxy; lệnh yêu cầu quyền mạng đã bị hủy.

Cần khôi phục quyền ghi cho ứng dụng GitHub với repo
`Ngongoctan123z/my-frontend`. Chỉnh workflow còn cần quyền cập nhật workflow
của credential phù hợp. Có thể kiểm tra kết nối trong phần Apps của ChatGPT và
https://github.com/settings/installations . Không gửi token hoặc secret vào chat.

Khi credential đã có quyền, đẩy toàn bộ bản vá lên `main`, theo dõi run mới ở
GitHub Actions. Nếu bước deploy khi đó báo lỗi xác thực Cloudflare mới cần
kiểm tra lại Actions secrets hoặc quyền token Cloudflare; chưa có bằng chứng
cần đổi token từ run hiện tại.
