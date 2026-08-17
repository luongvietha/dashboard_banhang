# 📊 Dashboard Bán Hàng & Sản Xuất & Thành Phẩm

Dashboard online, real-time, kết nối trực tiếp với các Google Sheet (Bán Hàng, chuyến xe Sản Xuất, công thức sản xuất theo lô). Không cần backend, không cần API key — chỉ cần Sheet ở chế độ share "Anyone with the link → Viewer".

**🌐 Link Online:** https://luongvietha.github.io/dashboard_banhang/

---

## Tài liệu chi tiết

Toàn bộ hướng dẫn được chia theo từng chủ đề trong thư mục `docs/` để dễ tra cứu và chỉnh sửa:

| File | Nội dung |
|------|----------|
| [`docs/SETUP.md`](docs/SETUP.md) | Cấu hình Google Sheet, deploy GitHub Pages, đổi link Sheet |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Cấu trúc thư mục/file, file nào chịu trách nhiệm gì |
| [`docs/FEATURES-BANHANG.md`](docs/FEATURES-BANHANG.md) | Tính năng tab Bán Hàng (KPI, biểu đồ, filter, bảng) |
| [`docs/FEATURES-SANXUAT.md`](docs/FEATURES-SANXUAT.md) | Tính năng tab Sản Xuất (chuyến xe) |
| [`docs/FEATURES-THANHPHAM.md`](docs/FEATURES-THANHPHAM.md) | Tính năng tab Thành Phẩm (đầu vào/ra, hiệu suất theo trạm) |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Hướng dẫn thêm filter/biểu đồ/cột mới |
| [`docs/STYLING.md`](docs/STYLING.md) | Bảng màu, biến CSS, cách đổi giao diện |
| [`docs/UPGRADE-IDEAS.md`](docs/UPGRADE-IDEAS.md) | Đề xuất nâng cấp UI đã đánh giá + checklist triển khai |

---

## Tổng quan nhanh

Dashboard có 3 tab chuyển bằng menu trên cùng:

- **📦 Bán Hàng** — đơn hàng, doanh thu, khách hàng, sản phẩm
- **🏭 Sản Xuất** — sản lượng vận chuyển theo trạm/ca làm việc (sheet chuyến xe)
- **🧱 Thành Phẩm** — đầu vào/đầu ra, hiệu suất, năng suất theo trạm và theo loại trạm Đá/Cát (sheet công thức sản xuất theo lô)

Mỗi tab có: KPI cards, biểu đồ, bộ lọc lọc chéo — đa số dùng multi-select (chọn nhiều giá trị cùng lúc, tự thu hẹp lẫn nhau), bảng chi tiết có sort + phân trang, nút "Cập nhật Dữ Liệu" để lấy dữ liệu mới nhất từ Google Sheet.

## Cấu trúc file (tóm tắt)

```
dashboard_banhang/
├── index.html                       # Cấu trúc HTML (không chứa CSS/JS)
├── css/styles.css                   # Toàn bộ giao diện
├── js/
│   ├── utils.js                     # Tiện ích dùng chung: format số, MultiSelect, bộ lọc nhanh
│   ├── sales-dashboard.js           # Logic tab Bán Hàng
│   ├── production-dashboard.js      # Logic tab Sản Xuất (chuyến xe)
│   ├── finished-products-dashboard.js # Logic tab Thành Phẩm (đầu vào/ra, hiệu suất)
│   └── app.js                       # Menu chuyển tab + khởi tạo
└── docs/                            # Tài liệu chi tiết (xem bảng trên)
```

Chi tiết đầy đủ: xem [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Cập nhật code

Repo này đã được kết nối để chỉnh sửa trực tiếp qua Claude (Cowork). Sau khi có thay đổi:

1. Mở **GitHub Desktop**
2. Xem danh sách file thay đổi
3. Gõ mô tả ngắn → **Commit to main** → **Push origin**
4. Chờ ~1 phút, GitHub Pages tự cập nhật

## License

Tự do sử dụng, chỉnh sửa, chia sẻ nội bộ. Không cần credit.

---
**Last Updated:** 17/08/2026
