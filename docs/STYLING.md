# 🎨 Styling Guide

Toàn bộ giao diện nằm trong 1 file: [`css/styles.css`](../css/styles.css). Cả 2 tab (Bán Hàng, Sản Xuất) dùng chung file này vì layout giống hệt nhau, chỉ khác nội dung/id.

---

## Biến màu (CSS variables)

Định nghĩa ở đầu file, trong `:root`:

```css
--primary: #2D7A3E;        /* Xanh lá chính — header border, nút, số KPI */
--primary-light: #4CAF50;  /* Xanh lá nhạt hơn — hover pagination */
--primary-dark: #1B5E20;   /* Xanh lá đậm — tiêu đề, giá trị KPI */
--bg-primary: #f5f5f5;     /* Nền tổng thể trang */
--bg-card: #ffffff;        /* Nền các card (không dùng trực tiếp, để dự phòng) */
--text-dark: #212529;      /* Màu chữ chính */
--text-muted: #6c757d;     /* Màu chữ phụ (label, subtext) */
--border-color: #e0e0e0;   /* Màu viền, đường phân cách */
--gap: 20px;                /* Khoảng cách chuẩn giữa các khối */
--radius: 8px;              /* Bo góc chuẩn cho card */
```

**Đổi màu thương hiệu:** chỉ cần sửa 3 biến `--primary`, `--primary-light`, `--primary-dark` — toàn bộ header, nút, KPI, biểu đồ dùng biến này sẽ tự đổi theo, không cần sửa từng chỗ.

---

## Các khối class chính

| Class | Dùng cho |
|---|---|
| `.dashboard-wrapper` | Bọc ngoài toàn bộ 1 tab (Bán Hàng hoặc Sản Xuất) |
| `.dashboard-header` | Phần header trên cùng: tiêu đề, nút cập nhật, filter |
| `.filters-container` / `.filter-group` | Khu vực bộ lọc |
| `.kpi-row` / `.kpi-card` | 4 thẻ KPI đầu trang |
| `.charts-grid` / `.chart-card` / `.chart-wrapper` | Lưới biểu đồ |
| `.table-card` / `.data-table` / `.pagination` | Bảng chi tiết + phân trang |
| `.status-message` | Thông báo thành công/lỗi khi cập nhật dữ liệu |
| `.footer` | Dòng "Cập nhật lần cuối" |

## Menu điều hướng (thêm khi tách 2 tab)

```css
.main-nav      /* thanh menu trên cùng, chứa 2 nút */
.nav-btn       /* 1 nút menu — có/không class .active */
.view-section  /* bọc ngoài mỗi tab — mặc định display:none */
.view-section.active  /* tab đang được chọn — display:block */
```

`switchView()` trong `js/app.js` chỉ toggle class `.active` trên `.nav-btn` và `.view-section` tương ứng — không có logic ẩn/hiện nào khác trong CSS ngoài 2 rule này.

---

## Responsive breakpoints

- `@media (max-width: 1024px)` — tablet: biểu đồ xuống 1 cột/hàng, KPI 2 cột
- `@media (max-width: 640px)` — mobile: KPI 1 cột, filter xếp dọc, nút full width

Muốn thêm breakpoint mới (vd màn hình rất lớn), thêm 1 khối `@media` mới ở cuối file, theo mẫu 2 khối trên.

---

## Quy tắc khi sửa

- Không tạo file CSS thứ 2 — mọi thứ style vẫn giữ trong `css/styles.css` để tránh phải nhớ "cái này màu ở đâu"
- Ưu tiên dùng biến CSS (`var(--primary)`...) thay vì hardcode màu mới, trừ khi thực sự cần màu khác biệt cho 1 thành phần đặc thù
- File hiện đang minify (không xuống dòng) — nếu muốn dễ đọc hơn khi sửa tay, có thể format lại bằng Prettier, không ảnh hưởng chức năng
