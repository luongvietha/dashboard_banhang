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
│   └── styles.css                # Toàn bộ giao diện: 3 dashboard + menu nav + multi-select
├── js/
│   ├── utils.js                  # Tiện ích dùng chung: formatSmartNumber, getQuickRange, class MultiSelect
│   ├── sales-dashboard.js        # class Dashboard — logic tab Bán Hàng
│   ├── production-dashboard.js   # class ProductionDashboard — logic tab Sản Xuất (chuyến xe)
│   ├── finished-products-dashboard.js # class FinishedProductsDashboard — logic tab Thành Phẩm
│   └── app.js                    # switchView() + khởi tạo dashboard/prodDashboard/finishedProductsDashboard
└── docs/
    ├── SETUP.md                  # Cấu hình Google Sheet + deploy
    ├── ARCHITECTURE.md           # File này
    ├── FEATURES-BANHANG.md       # Tính năng tab Bán Hàng
    ├── FEATURES-SANXUAT.md       # Tính năng tab Sản Xuất (chuyến xe)
    ├── FEATURES-THANHPHAM.md     # Tính năng tab Thành Phẩm (đầu vào/ra, hiệu suất)
    ├── DEVELOPMENT.md            # Hướng dẫn thêm filter/chart/cột
    └── STYLING.md                # Biến CSS, cách đổi giao diện
```

---

## Trách nhiệm từng file

### `index.html`
Chỉ chứa cấu trúc HTML: 3 khối `<div class="dashboard-wrapper view-section">` (Bán Hàng id=`view-banhang`, Sản Xuất id=`view-sanxuat`, Thành Phẩm id=`view-thanhpham`), menu `<nav class="main-nav">` ở đầu `<body>` với 3 nút (`nav-banhang`, `nav-sanxuat`, `nav-thanhpham`), và 5 thẻ `<script src="...">` ở cuối `<body>` để nạp logic theo đúng thứ tự phụ thuộc (`utils.js` → `sales-dashboard.js` → `production-dashboard.js` → `finished-products-dashboard.js` → `app.js`). Không có `<style>` hay code JS nhúng trực tiếp — mọi thay đổi giao diện/logic đều sửa ở `css/` hoặc `js/`, không đụng vào file này trừ khi cần thêm/bớt phần tử HTML.

### `css/styles.css`
Một file CSS duy nhất dùng chung cho cả 3 tab (vì giao diện các tab giống hệt nhau về layout — chỉ khác nội dung/id). Bao gồm: biến màu (`:root`), style header/filter/KPI/chart/table/pagination, responsive breakpoints, phần menu nav (`.main-nav`, `.nav-btn`, `.view-section`), và style cho component `MultiSelect` (`.multiselect*`).

### `js/utils.js`
Tiện ích dùng chung cho mọi tab, nạp **đầu tiên** vì các file dashboard đều gọi tới nó:
- `formatSmartNumber(value, type)` — định dạng số kiểu Việt Nam (Tỷ/Triệu cho tiền, m³ cho khối lượng)
- `getQuickRange(preset)` — trả về `{start, end}` cho bộ lọc nhanh (`yesterday`, `7days`, `thisMonth`, `lastMonth`)
- `class MultiSelect` — dropdown checkbox nhiều lựa chọn, dùng cho mọi bộ lọc multi-select ở cả 3 tab

### `js/sales-dashboard.js`
Định nghĩa `const SHEET_URL` (link CSV Bán Hàng) và `class Dashboard`. Class này tự fetch dữ liệu ngay khi khởi tạo (constructor gọi `init()` → `fetchFromSheet()`). Chịu trách nhiệm toàn bộ: parse CSV, lọc dữ liệu (kể cả lọc chéo giữa các dropdown), render KPI/chart/bảng, sort, phân trang.

### `js/production-dashboard.js`
Tương tự `sales-dashboard.js` nhưng cho tab Sản Xuất (sheet chuyến xe) — định nghĩa `SHEET_URL_SANXUAT` và `class ProductionDashboard`. Khác biệt chính: không tự fetch ngay lúc khởi tạo (`loaded = false`), chỉ fetch khi người dùng bấm vào tab lần đầu — để trang tải nhanh hơn lúc mở dashboard. Bộ lọc Trạm/Sản phẩm/Xe/Ca dùng `MultiSelect` (từ `utils.js`) với lọc chéo (`updateFacetOptions()`).

### `js/finished-products-dashboard.js`
Logic tab Thành Phẩm — định nghĩa `SHEET_URL_TRAMDA`/`SHEET_URL_TRAMCAT` và `class FinishedProductsDashboard`, đọc 2 sheet "công thức sản xuất theo lô" (khác nguồn với sheet chuyến xe). Tính đầu vào/đầu ra, hiệu suất, năng suất — cả theo từng trạm và gộp theo loại trạm (Đá/Cát). Cũng lazy-load như `production-dashboard.js`, kích hoạt độc lập khi vào tab "🧱 Thành Phẩm". Chi tiết đầy đủ ở [`FEATURES-THANHPHAM.md`](FEATURES-THANHPHAM.md).

### `js/app.js`
File nhỏ nhất, chỉ có 2 việc:
1. `switchView(view)` — hàm được gọi từ `onclick` trên 3 nút menu (`'banhang'`/`'sanxuat'`/`'thanhpham'`), ẩn/hiện đúng section và trigger fetch lazy-load tương ứng nếu chưa `loaded`
2. Khởi tạo 3 instance toàn cục: `dashboard`, `prodDashboard`, `finishedProductsDashboard`

Phải nạp **sau cùng** trong `index.html` (sau các file class ở trên) vì nó gọi `new Dashboard()` / `new ProductionDashboard()` / `new FinishedProductsDashboard()`.

---

## Vì sao tách như vậy

- Sửa giao diện (màu sắc, spacing, responsive) → chỉ đụng `css/styles.css`, không sợ làm hỏng logic
- Sửa logic Bán Hàng → chỉ đụng `sales-dashboard.js`, không ảnh hưởng 2 tab kia
- Sửa logic Sản Xuất (chuyến xe) → chỉ đụng `production-dashboard.js`
- Sửa logic Thành Phẩm (đầu vào/ra, hiệu suất) → chỉ đụng `finished-products-dashboard.js`
- Thêm tab mới trong tương lai → tạo thêm 1 file `js/xxx-dashboard.js` theo cùng khuôn mẫu (tham khảo `finished-products-dashboard.js` làm ví dụ gần nhất), thêm 1 khối HTML `view-section` mới, thêm 1 nút nav, thêm 1 dòng lazy-load trong `switchView()` — không phải sửa lại toàn bộ file dài hàng nghìn dòng như trước

Xem hướng dẫn thao tác cụ thể ở [`DEVELOPMENT.md`](DEVELOPMENT.md).
