# ✨ Tính Năng — Tab Bán Hàng

File logic: [`js/sales-dashboard.js`](../js/sales-dashboard.js) · Vùng HTML: `#view-banhang` trong `index.html`

---

## KPI Cards

| Card | Nội dung | Ghi chú |
|------|----------|---------|
| Tổng Đơn Hàng | Số đơn trong khoảng lọc | Kèm % so với tổng toàn bộ dữ liệu |
| Tổng Lượng (M³) | Tổng số lượng bán được | Kèm trung bình M³/đơn |
| Tổng Doanh Thu | Tổng thành tiền | Chỉ tính đơn có giá; hiển thị rút gọn (K/M) |
| Khách Hàng | Số khách hàng độc nhất | |

## Biểu đồ

1. **Xu Hướng Doanh Thu Theo Ngày** (line, 2 trục Y) — trục trái: số lượng M³, trục phải: doanh thu
2. **Top 10 Sản Phẩm** (bar ngang) — theo tổng số lượng
3. **Top 10 Khách Hàng** (bar ngang) — theo tổng số lượng
4. **Phân Bố Loại Đơn Hàng** (doughnut) — Hợp Đồng vs Bán Lẻ

## Bộ lọc — cơ chế lọc chéo (faceted filtering)

6 bộ lọc: Từ ngày, Đến ngày, Tháng, Loại, Khách, Sản phẩm.

Khác với version cũ (dropdown luôn hiện tất cả), mỗi dropdown giờ chỉ hiện **giá trị còn khớp với tất cả filter khác đang chọn**:

- Đổi khoảng ngày → Tháng/Loại/Khách/Sản phẩm tự thu hẹp chỉ còn giá trị nằm trong khoảng ngày đó
- Chọn 1 Khách hàng → Sản phẩm chỉ hiện những mặt hàng khách đó từng mua (trong khoảng ngày đang chọn)
- Chọn 1 Sản phẩm → Khách hàng chỉ hiện những ai từng mua sản phẩm đó

Cơ chế nằm ở hàm `getFilteredData(excludeKeys)` trong `sales-dashboard.js`: khi tính option cho 1 dropdown, nó áp toàn bộ filter khác trừ chính dropdown đó ra, rồi lấy danh sách giá trị duy nhất còn lại. Nếu lựa chọn hiện tại không còn hợp lệ sau khi đổi filter khác, dropdown tự reset về "Tất cả".

## Bảng chi tiết

Cột: Ngày Giờ, Mã Phiếu, Khách Hàng, Sản Phẩm, Kho, Số Lượng, Loại, Doanh Thu.

- Click header cột để sort tăng/giảm dần
- Phân trang 20 dòng/trang, nút Trước/Sau

## Cập nhật dữ liệu

Nút "🔄 Cập nhật Dữ Liệu" fetch lại CSV từ `SHEET_URL` (Google Sheet Bán Hàng), parse lại toàn bộ, reset filter mặc định về khoảng ngày min–max của dữ liệu, và render lại tất cả. Hiển thị thông báo thành công/lỗi trong 5 giây.

Tab Bán Hàng tự fetch dữ liệu **ngay khi trang load xong** (khác với tab Sản Xuất chỉ fetch khi bấm vào).
