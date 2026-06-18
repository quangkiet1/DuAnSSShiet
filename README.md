# GradeSync - Hệ Thống So Sánh Bảng Điểm Excel

## Khởi động dự án

### Backend (Port 5000)
```bash
cd gradesync-backend
npm install
npm run dev   # development với nodemon
npm run start # production
```

### Frontend (Port 5173)
```bash
cd gradesync-frontend
npm install
npm run dev
```

Truy cập: **http://localhost:5173**

---

## Cấu trúc dự án

```
gradesync-backend/
├── server.js                    # Entry point
├── src/
│   ├── controllers/
│   │   ├── comparison.controller.js   # Upload, analyze, run, download
│   │   └── template.controller.js     # CRUD template
│   ├── services/
│   │   ├── excel/
│   │   │   ├── excelReader.js         # Đọc file Excel (SheetJS)
│   │   │   └── excelWriter.js         # Xuất kết quả (ExcelJS, 8 sheets)
│   │   ├── analyzer/
│   │   │   ├── headerDetector.js      # Tự dò dòng header
│   │   │   └── columnAnalyzer.js      # Nhận diện loại cột + confidence
│   │   ├── comparator/
│   │   │   └── gradeComparator.js     # So sánh O(n+m) bằng hash map
│   │   └── normalizer/
│   │       └── dataNormalizer.js      # Chuẩn hóa MSSV, HoTen, Lop, Diem
│   ├── routes/
│   │   ├── comparison.routes.js
│   │   └── template.routes.js
│   ├── middlewares/
│   │   ├── upload.middleware.js        # Multer, kiểm tra file security
│   │   └── error.middleware.js
│   └── utils/
│       ├── jobStore.js                # In-memory job tracking (MVP)
│       └── templateStore.js           # In-memory template storage (MVP)

gradesync-frontend/
├── src/
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── ComparePage.jsx            # Wizard 8 bước
│   │   ├── HistoryPage.jsx
│   │   └── TemplatesPage.jsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   └── wizard/
│   │       ├── WizardSteps.jsx
│   │       ├── Step1Upload.jsx        # Drag & drop upload
│   │       ├── Step2Sheet.jsx         # Chọn sheet
│   │       ├── Step3Analyze.jsx       # Preview + column detection
│   │       ├── Step4Identity.jsx      # Mapping MSSV/HoTen/Lop
│   │       ├── Step5ScoreMapping.jsx  # Mapping điểm
│   │       ├── Step6Config.jsx        # Cấu hình quy tắc
│   │       ├── Step7Processing.jsx    # Progress bar real-time
│   │       └── Step8Results.jsx       # Thống kê + Download
│   └── services/
│       └── api.js                     # Axios API service
```

---

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | Health check |
| POST | `/api/comparisons/upload` | Upload 2 file Excel |
| GET | `/api/comparisons/:id/sheets` | Danh sách sheets |
| POST | `/api/comparisons/:id/analyze` | Phân tích + gợi ý mapping |
| POST | `/api/comparisons/:id/run` | Tạo job so sánh |
| GET | `/api/comparisons/jobs/:jobId/status` | Trạng thái job |
| GET | `/api/comparisons/jobs/:jobId/download` | Tải file Excel kết quả |
| GET | `/api/comparisons/history` | Lịch sử |
| GET | `/api/templates` | Danh sách template |
| POST | `/api/templates` | Tạo template |
| DELETE | `/api/templates/:id` | Xóa template |

---

## File Excel Kết Quả (8 sheets)

| Sheet | Nội dung |
|-------|---------|
| TONG_QUAN | Thống kê tổng hợp |
| KHAC_DIEM | Các dòng điểm khác nhau (highlight đỏ) |
| SAI_THONG_TIN_SV | SV cùng MSSV nhưng khác tên/lớp |
| THIEU_SINH_VIEN | SV có trong A nhưng không có B |
| DU_SINH_VIEN | SV có trong B nhưng không có A |
| TRUNG_MSSV | MSSV bị trùng |
| FILE_A_HIGHLIGHT | Dữ liệu gốc file A với màu |
| FILE_B_HIGHLIGHT | Dữ liệu gốc file B với màu |

---

## Roadmap

### Phase 1 - MVP ✅ (Hiện tại)
- Upload, phân tích, so sánh, xuất Excel kết quả
- Wizard 8 bước
- Tự nhận diện cột với confidence score

### Phase 2 - Production
- PostgreSQL lưu lịch sử và template
- Template matching tự động
- File cleanup định kỳ

### Phase 3 - Advanced
- BullMQ + Redis queue xử lý nền
- Phân quyền Admin/Staff
- Dashboard thống kê
- Python worker cho file > 50MB
