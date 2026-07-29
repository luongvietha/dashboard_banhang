# 📊 Dashboard Bán Hàng & Sản Xuất

Dashboard online, real-time, kết nối trực tiếp với 2 Google Sheet (Bán Hàng + Sản Xuất). Không cần backend, không cần API key — chỉ cần Sheet ở chế độ share "Anyone with the link → Viewer".

**🌐 Link Online:** https://luongvietha.github.io/dashboard_banhang/

---

## Tài liệu chi tiết

Toàn bộ hướng dẫn được chia theo từng chủ đề trong thư mục `docs/` để dễ tra cứu và chỉnh sửa:

| File | Nội dung |
|------|----------|
| [`docs/SETUP.md`](docs/SETUP.md) | Cấu hình Google Sheet, deploy GitHub Pages, đổi link Sheet |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Cấu trúc thư mục/file, file nào chịu trách nhiệm gì |
| [`docs/FEATURES-BANHANG.md`](docs/FEATURES-BANHANG.md) | Tính năng tab Bán Hàng (KPI, biểu đồ, filter, bảng) |
| [`docs/FEATURES-SANXUAT.md`](docs/FEATURES-SANXUAT.md) | Tính năng tab Sản Xuất |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Hướng dẫn thêm filter/biểu đồ/cột mới |
| [`docs/STYLING.md`](docs/STYLING.md) | Bảng màu, biến CSS, cách đổi giao diện |
| [`docs/UPGRADE-IDEAS.md`](docs/UPGRADE-IDEAS.md) | Đề xuất nâng cấp UI đã đánh giá + checklist triển khai |

---

## Tổng quan nhanh

Dashboard có 2 tab chuyển bằng menu trên cùng:

- **📦 Bán Hàng** — đơn hàng, doanh thu, khách hàng, sản phẩm
- **🏭 Sản Xuất** — sản lượng theo trạm, xe vận chuyển, số chuyến

Mỗi tab có: KPI cards, 4 biểu đồ, bộ lọc lọc chéo (ngày/tháng/loại/khách/sản phẩm... đều tự thu hẹp lẫn nhau), bảng chi tiết có sort + phân trang, nút "Cập nhật Dữ Liệu" để lấy dữ liệu mới nhất từ Google Sheet.

## Cấu trúc file (tóm tắt)

```
dashboard_banhang/
├── index.html                    # Cấu trúc HTML (không chứa CSS/JS)
├── css/styles.css                # Toàn bộ giao diện
├── js/
│   ├── sales-dashboard.js        # Logic tab Bán Hàng
│   ├── production-dashboard.js   # Logic tab Sản Xuất
│   └── app.js                    # Menu chuyển tab + khởi tạo
└── docs/                         # Tài liệu chi tiết (xem bảng trên)
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
**Last Updated:** 29/07/2026
