# 🏗️ Cấu Trúc Dự Án

## Sơ đồ thư mục

```
dashboard_banhang/
├── index.html                    # Cấu trúc HTML thuần — KHÔNG chứa CSS/JS
├── .gitignore
├── README.md                     # Trang chủ, link tới toàn bộ docs
├── FOLDER_STRUCTURE.md           # (cũ) → xem file này thay thế
├── DEVELOPMENT.md                # (cũ) → xem docs/DEVELOPMENT.md
├── FEATURES.md                   # (cũ) → xem docs/FEATURES-*.md
├── css/
│   └── styles.css                # Toàn bộ giao diện: 2 dashboard + menu nav
├── js/
│   ├── sales-dashboard.js        # class Dashboard — logic tab Bán Hàng
│   ├── production-dashboard.js   # class ProductionDashboard — logic tab Sản Xuất
│   └── app.js                    # switchView() + khởi tạo dashboard/prodDashboard
└── docs/
    ├── SETUP.md                  # Cấu hình Google Sheet + deploy
    ├── ARCHITECTURE.md           # File này
    ├── FEATURES-BANHANG.md       # Tính năng tab Bán Hàng
    ├── FEATURES-SANXUAT.md       # Tính năng tab Sản Xuất
    ├── DEVELOPMENT.md            # Hướng dẫn thêm filter/chart/cột
    └── STYLING.md                # Biến CSS, cách đổi giao diện
```

---

## Trách nhiệm từng file

### `index.html`
Chỉ chứa cấu trúc HTML: 2 khối `<div class="dashboard-wrapper view-section">` (một cho Bán Hàng id=`view-banhang`, một cho Sản Xuất id=`view-sanxuat`), menu `<nav class="main-nav">` ở đầu `<body>`, và 3 thẻ `<script src="...">` ở cuối `<body>` để nạp logic. Không có `<style>` hay code JS nhúng trực tiếp — mọi thay đổi giao diện/logic đều sửa ở `css/` hoặc `js/`, không đụng vào file này trừ khi cần thêm/bớt phần tử HTML.

### `css/styles.css`
Một file CSS duy nhất dùng chung cho cả 2 tab (vì giao diện 2 tab giống hệt nhau về layout — chỉ khác nội dung/id). Bao gồm: biến màu (`:root`), style header/filter/KPI/chart/table/pagination, responsive breakpoints, và phần menu nav (`.main-nav`, `.nav-btn`, `.view-section`).

### `js/sales-dashboard.js`
Định nghĩa `const SHEET_URL` (link CSV Bán Hàng) và `class Dashboard`. Class này tự fetch dữ liệu ngay khi khởi tạo (constructor gọi `init()` → `fetchFromSheet()`). Chịu trách nhiệm toàn bộ: parse CSV, lọc dữ liệu (kể cả lọc chéo giữa các dropdown), render KPI/chart/bảng, sort, phân trang.

### `js/production-dashboard.js`
Tương tự `sales-dashboard.js` nhưng cho tab Sản Xuất — định nghĩa `SHEET_URL_SANXUAT` và `class ProductionDashboard`. Khác biệt chính: không tự fetch ngay lúc khởi tạo (`loaded = false`), chỉ fetch khi người dùng bấm vào tab lần đầu — để trang tải nhanh hơn lúc mở dashboard.

### `js/app.js`
File nhỏ nhất, chỉ có 2 việc:
1. `switchView(view)` — hàm được gọi từ `onclick` trên 2 nút menu, ẩn/hiện đúng section và trigger fetch Sản Xuất nếu cần
2. Khởi tạo 2 instance toàn cục: `const dashboard = new Dashboard();` và `const prodDashboard = new ProductionDashboard();`

Phải nạp **sau cùng** trong `index.html` (sau 2 file class ở trên) vì nó gọi `new Dashboard()` / `new ProductionDashboard()`.

---

## Vì sao tách như vậy

- Sửa giao diện (màu sắc, spacing, responsive) → chỉ đụng `css/styles.css`, không sợ làm hỏng logic
- Sửa logic Bán Hàng → chỉ đụng `sales-dashboard.js`, không ảnh hưởng Sản Xuất
- Sửa logic Sản Xuất → chỉ đụng `production-dashboard.js`
- Thêm tab thứ 3 trong tương lai → tạo thêm 1 file `js/xxx-dashboard.js` theo cùng khuôn mẫu, thêm 1 khối HTML `view-section` mới, thêm 1 nút nav — không phải sửa lại toàn bộ file dài hàng nghìn dòng như trước

Xem hướng dẫn thao tác cụ thể ở [`DEVELOPMENT.md`](DEVELOPMENT.md).
