# VNDOCS - AI DEVELOPMENT FLOW & IMPLEMENTATION GUIDE

Tài liệu này là bản chỉ dẫn chi tiết từng bước cho AI tiếp tục phát triển các tính năng Tool trên VNDocs.

---

## I. QUYẾT ĐỊNH ARCHITECTURE TRƯỚC KHI CODE

### 1. Frontend Stack (KHÔNG THAY ĐỔI)
```
NextJS 14+ (App Router)
├─ TypeScript
├─ Tailwind CSS
├─ React 18+
└─ Layout riêng: app/tools/layout.tsx (ToolsBanner.tsx)
```

### 2. Backend Stack (KHÔNG THAY ĐỔI)
```
Java Spring Boot 3.x
├─ MySQL (BLOB storage cho file)
├─ CORS: https://vndocs.net & https://www.vndocs.net
└─ REST API (JSON response)
```

### 3. Deploy / Hosting
- Frontend: Northflank (vndocs.net via Cloudflare)
- Backend: TBD - kiểm tra infrastructure hiện tại

---

## II. PRIORITY & EXECUTION ORDER

### Phase 1: PDF Tools (HIGH PRIORITY)
Những tool này tạo giá trị cao nhất cho user.

#### 1.1 Split/Merge PDF (`/tools/split-merge`) - **FIRST**
**Tại sao viên trước:** User thường cần tách/gộp đề thi PDF nhiều nhất.

**Frontend Flow:**
```
/app/tools/split-merge/page.tsx
├─ Drag & Drop Zone (accept .pdf)
├─ Preview PDF pages (thumbnail)
├─ Select pages to split (checkboxes)
├─ Options: "Split All" | "Merge Selected" | "Custom Range"
├─ Download button
└─ Layout: ToolsBanner.tsx (header) + Grid layout
```

**Implementation Detail:**
- Lib: `react-pdf` (preview) + `pdfjs-dist` (pdf.js)
- State: Selected pages, file metadata
- UX: Progress bar khi xử lý file lớn

**Backend (nếu file > 50MB):**
- Endpoint: `POST /api/tools/pdf-split-merge`
- Input: File PDF + page ranges (JSON)
- Output: Blob PDF hoặc stream để download
- Lib: Apache PDFBox hoặc iText
- **MỤC TIÊU:** Xử lý xong < 5s cho file 50MB

**Browser-side Priority:**
- Nếu file < 20MB: Dùng `pdf-lib` (NPM package) xử lý 100% trên browser
- Nếu file > 20MB: Call backend API

---

#### 1.2 Lock/Unlock PDF (`/tools/lock`) - **SECOND**
**Tại sao:** Đơn giản, không cần backend.

**Frontend ONLY:**
```
/app/tools/lock/page.tsx
├─ Upload PDF
├─ Input password
├─ Action buttons: "Encrypt" | "Decrypt"
└─ Download
```

**Implementation:**
- Lib: `pdf-lib` (NPM)
- 100% browser-side, không gọi API backend
- Xử lý AES encryption cho PDF

**Code Structure:**
```typescript
// lib/pdfTools.ts
export async function encryptPDF(file: File, password: string): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
  // encryption logic
  return new Blob([await pdfDoc.save()], { type: 'application/pdf' });
}
```

---

### Phase 2: Conversion Tools (MEDIUM PRIORITY)

#### 2.1 PDF ↔ Word (`/tools/convert`) - **THIRD**
**Tại sao sau PDF tools:** Phức tạp hơn, cần third-party lib hoặc API.

**Frontend Flow:**
```
/app/tools/convert/page.tsx
├─ Dropdown: Source format (PDF/Word)
├─ Upload file
├─ Download converted file
└─ Status: Processing...
```

**Backend + Frontend:**
- Endpoint: `POST /api/tools/convert`
- Input: File + source format + target format
- Library options:
  - PDF → Word: LibreOffice headless OR Aspose (paid) OR `pdf2docx` (Python wrapper)
  - Word → PDF: Apache POI + iText
- **Trade-off Decision:**
  - Nếu cost không yếu tố: Dùng Aspose.Words (quality tốt nhất)
  - Nếu low-cost: Dùng LibreOffice + docker container
  - Nếu cần nhanh: Call external API (Cloudconvert, etc.)

---

#### 2.2 Other Formats (Image ↔ PDF, etc.) - **LAST**
- Dành cho sau khi các tool chính ổn định.

---

### Phase 3: Utility Tools (LOW PRIORITY)

#### 3.1 Virtual Casio Calculator (`/tools/casio`) - **OPTIONAL**
**Frontend ONLY:**
```
/app/tools/casio/page.tsx
├─ CSS-based Casio design
├─ JS math engine (math.js library)
├─ Solve: Linear equations, quadratic, matrix, etc.
└─ Display: LCD screen simulation
```

**Không cần backend.** Chỉ xử lý toán học trên browser.

---

## III. FILE STRUCTURE & LAYOUT

### Frontend Folder Structure
```
src/app/
├─ tools/
│  ├─ layout.tsx                 (shared layout cho /tools/*)
│  ├─ page.tsx                   (index, list all tools)
│  ├─ split-merge/
│  │  └─ page.tsx
│  ├─ lock/
│  │  └─ page.tsx
│  ├─ convert/
│  │  └─ page.tsx
│  └─ casio/
│     └─ page.tsx
├─ components/
│  ├─ ToolsBanner.tsx            (header for all tools)
│  ├─ FileUpload.tsx             (reusable drag-drop)
│  └─ ToolCard.tsx               (card layout)
├─ lib/
│  └─ pdfTools.ts                (utilities)
└─ styles/
   └─ tools.css                  (tailwind + custom)
```

### Backend Folder Structure
```
src/main/java/com/vndocs/
├─ controller/
│  └─ ToolsController.java       (POST /api/tools/*)
├─ service/
│  ├─ PdfService.java            (split, merge, encrypt logic)
│  ├─ ConvertService.java        (PDF ↔ Word)
│  └─ FileService.java           (upload, temp storage)
├─ model/
│  ├─ ToolRequest.java
│  └─ ToolResponse.java
└─ config/
   └─ ToolsConfig.java           (file upload limits, timeouts)
```

---

## IV. STEP-BY-STEP IMPLEMENTATION CHECKLIST

### Sprint 1: Split/Merge PDF
- [ ] **Frontend:**
  - [ ] Create `/app/tools/split-merge/page.tsx`
  - [ ] Add react-pdf + pdf-lib dependencies
  - [ ] Build drag-drop upload component
  - [ ] PDF preview (thumbnail grid)
  - [ ] Page selection UI
  - [ ] Browser-side split/merge (pdf-lib)
  - [ ] Download functionality
  - [ ] Error handling & file size validation

- [ ] **Backend (if needed):**
  - [ ] Create ToolsController
  - [ ] POST `/api/tools/pdf-split-merge`
  - [ ] PDFBox integration
  - [ ] Temp file management
  - [ ] Stream response for download

- [ ] **Testing:**
  - [ ] Test with 50MB PDF
  - [ ] Test with multi-page selection
  - [ ] Test error scenarios (corrupted file, etc.)

### Sprint 2: Lock/Unlock PDF
- [ ] **Frontend ONLY:**
  - [ ] Create `/app/tools/lock/page.tsx`
  - [ ] Password input (show/hide toggle)
  - [ ] Encrypt/Decrypt buttons
  - [ ] pdf-lib integration
  - [ ] Download

- [ ] **Testing:**
  - [ ] Test password protection works
  - [ ] Test both encrypt & decrypt flow

### Sprint 3: PDF ↔ Word Convert
- [ ] **Frontend:**
  - [ ] Create `/app/tools/convert/page.tsx`
  - [ ] Format selector dropdown
  - [ ] File upload
  - [ ] Call backend API

- [ ] **Backend:**
  - [ ] Decide on library (Aspose? LibreOffice?)
  - [ ] POST `/api/tools/convert`
  - [ ] Implement conversion logic
  - [ ] Return converted file

- [ ] **Testing:**
  - [ ] Test PDF → Word quality
  - [ ] Test Word → PDF quality
  - [ ] Large file handling

---

## V. DEVELOPMENT RULES (STRICT)

### ✅ DO
1. **Code trong `/app/tools/` ONLY** - không động vào `/app/exams/`
2. **Browser-side first** - Dùng JS/React nếu được, backend nếu cần
3. **TypeScript strict mode** - tsconfig: `strict: true`
4. **Tailwind + custom CSS** - Style consistent với theme
5. **Error boundaries** - React Error Boundary cho tools
6. **File validation** - Check MIME type, size, integrity (before processing)
7. **Progress UX** - Loading state, progress bar cho long-running tasks
8. **Responsive design** - Mobile-friendly (Tailwind grid)

### ❌ DON'T
1. **Không modify `/app/exams/` hay shared components** (nếu không cần thiết)
2. **Không deploy test files/fixtures** - cleanup sau dev
3. **Không hardcode API URL** - Dùng env vars: `NEXT_PUBLIC_API_URL`
4. **Không lưu user files trên server** - Upload → Process → Download (delete after)
5. **Không dùng external CDN cho PDF libs** - Import via NPM
6. **Không bypass CORS** - Backend CORS config đúng

---

## VI. ENV VARIABLES & CONFIG

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.vndocs.net
NEXT_PUBLIC_MAX_FILE_SIZE=52428800  # 50MB
NEXT_PUBLIC_TIMEOUT=60000           # 60s
```

### Backend (application.yml)
```yaml
app:
  upload:
    max-size: 52428800
    temp-dir: /tmp/vndocs-tools
  tools:
    timeout: 60
cors:
  allowed-origins:
    - https://vndocs.net
    - https://www.vndocs.net
```

---

## VII. COMMON PITFALLS & SOLUTIONS

| Problem | Cause | Solution |
|---------|-------|----------|
| PDF lib size too large | Importing whole pdf.js | Use `pdfjs-dist/build/pdf.worker.min.js` for worker |
| Memory leak on large files | Not cleaning up Blob | Use `URL.revokeObjectURL()` after download |
| CORS error from backend | Backend not configured | Check CORS middleware, restart server |
| PDF corrupt after processing | PDFBox version conflict | Use PDFBox 3.0+, test encoding |
| Convert quality bad (PDF→Word) | Wrong library settings | Test Aspose font embedding options |
| Browser crash on 100MB+ file | Trying to load all in RAM | Stream file, process chunks (backend only) |

---

## VIII. TESTING STRATEGY

### Unit Tests
```typescript
// __tests__/lib/pdfTools.test.ts
describe('PDF Tools', () => {
  test('should split PDF correctly', async () => {
    const result = await splitPDF(mockFile, [1, 2, 3]);
    expect(result).toBeInstanceOf(Blob);
  });
});
```

### Integration Tests
- Test with real PDF files from `/app/exams/` dataset
- Test 1MB, 10MB, 50MB file sizes
- Test browser compatibility (Chrome, Firefox, Safari)

### Performance Benchmarks
- Split 10-page PDF: < 2s (browser)
- Merge 5 PDFs (100 pages): < 5s
- Encrypt PDF: < 1s

---

## IX. DEPLOYMENT CHECKLIST

- [ ] All tests passing (unit + integration)
- [ ] Lighthouse score > 80
- [ ] No console errors/warnings
- [ ] CORS headers verified
- [ ] File temp cleanup working
- [ ] Download filename correct & sanitized
- [ ] Mobile responsive (tested on iPhone + Android)
- [ ] Error messages user-friendly
- [ ] Rate limiting configured (if needed)
- [ ] Deploy to staging first
- [ ] Monitor backend logs for errors

---

## X. HANDOFF NOTES FOR NEXT AI

1. **Current Status:** Basic Next.js scaffold exists, no tools implemented yet.
2. **Dependencies to Add:**
   ```bash
   npm install pdf-lib pdfjs-dist react-pdf math.js
   npm install -D @types/pdf-lib @types/pdfjs-dist
   ```
3. **Backend Ready?** Check if Spring Boot server is deployed & CORS working.
4. **Test Data:** 700+ PDFs in DB, ready for testing.
5. **Brand:** Keep "VNDocs" branding, colors/fonts consistent.
6. **Questions?** Refer to this document first before asking.

---

**Document Version:** 1.0  
**Last Updated:** 2026-09-24
**Maintained By:** VNDocs Dev Team
