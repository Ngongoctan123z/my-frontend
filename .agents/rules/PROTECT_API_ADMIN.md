---
name: Protect API and Admin Code
description: Quy định nghiêm ngặt về việc chỉnh sửa các file liên quan đến API, Admin và AI logic.
---

# 🛑 BẢO VỆ MÃ NGUỒN CỐT LÕI (API, ADMIN, AI LOGIC)

Dưới đây là những quy định tối quan trọng mà AI **BẮT BUỘC** phải tuân theo khi làm việc trong dự án này:

## 1. Các khu vực CẤM tự ý chỉnh sửa (Vùng Cấm Địa)
Tuyệt đối KHÔNG ĐƯỢC tự ý sửa đổi code trong các tệp và thư mục sau nếu không có lệnh trực tiếp và rõ ràng từ người dùng:
- `src/utils/geminiClient.ts` (Core AI Logic, API keys, Model Fallback)
- `app/quan-tri-he-thong-123/` (Trang quản trị Admin)
- `app/api/` (Các Backend API Routes)

## 2. Quy trình "Nhìn Bản Cũ" (Thận trọng tuyệt đối)
Nếu người dùng yêu cầu chỉnh sửa các file trong vùng cấm địa:
1. **LUÔN LUÔN** đọc kỹ bản code cũ (bằng công cụ `view_file`) để hiểu rõ luồng logic đang hoạt động ổn định.
2. Không bao giờ xóa hoặc ghi đè các tính năng bảo mật, vòng lặp fallback, hoặc các cấu hình an toàn (`safetySettings`).
3. **Ghi chú cẩn thận:** Phải ghi chú rõ trong nội dung phản hồi cho người dùng là "Tôi đã đọc code cũ, nhận thấy logic là X, và sẽ sửa thành Y để đảm bảo an toàn".

## 3. Không phá vỡ luồng Fallback AI
- Luồng `tryGenerateWithFallback` trong `geminiClient.ts` được thiết kế cực kỳ thận trọng để xoay vòng các model khi hết quota hoặc bị rate limit. Tuyệt đối không thay đổi khối `catch` chặn lỗi `resource_exhausted` trừ khi thực sự cần thiết.

> **Ghi nhớ:** Mọi quyết định thay đổi liên quan đến API Gemini và trang Admin đều ảnh hưởng trực tiếp đến sự sống còn và túi tiền của dự án. AI cần hoạt động như một chuyên gia phẫu thuật: Chỉ rạch đúng chỗ cần rạch, không đụng chạm các dây thần kinh xung quanh!
