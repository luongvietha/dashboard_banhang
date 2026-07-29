# ✨ Tính Năng — Tab Sản Xuất

File logic: [`js/production-dashboard.js`](../js/production-dashboard.js) · Vùng HTML: `#view-sanxuat` trong `index.html`

---

## KPI Cards

| Card | Nội dung | Ghi chú |
|------|----------|---------|
| Tổng Khối Lượng (M³) | Tổng `TỔNG KHỐI LƯỢNG` trong khoảng lọc | Kèm % so với tổng toàn bộ dữ liệu |
| Tổng Số Chuyến | Tổng `SỐ CHUYẾN` | Kèm trung bình m³/chuyến |
| Trạm Hoạt Động | Số trạm (`TÊN TRẠM`) độc nhất | |
| Xe Hoạt Động | Số xe (`BIỂN SỐ XE`) độc nhất | |

## Biểu đồ

1. **Xu Hướng Khối Lượng Theo Ngày** (line) — tổng khối lượng m³ mỗi ngày
2. **Top 10 Trạm Theo Khối Lượng** (bar ngang)
3. **Top 10 Xe Theo Khối Lượng** (bar ngang)
4. **Phân Bố Theo Sản Phẩm** (doughnut) — theo `Tên Sản Phẩm` (vd Đá hỗn hợp, Cấp phối thường loại 1...)

## Bộ lọc — lọc chéo (cùng cơ chế với tab Bán Hàng)

6 bộ lọc: Từ ngày, Đến ngày, Tháng, Trạm, Sản phẩm, Xe — mỗi dropdown chỉ hiện giá trị còn khớp với các filter khác đang chọn. Vd chọn 1 Trạm → Xe chỉ hiện những xe từng chạy ở trạm đó trong khoảng ngày đang lọc.

Xem chi tiết cơ chế trong [`FEATURES-BANHANG.md`](FEATURES-BANHANG.md#bộ-lọc--cơ-chế-lọc-chéo-faceted-filtering) — logic giống hệt, chỉ khác tên trường dữ liệu.

## Bảng chi tiết

Cột: Ngày, Trạm, Sản Phẩm, Xe, Số Chuyến, Khối Lượng (m³), Ghi Chú.

- Click header cột (trừ cột Ghi Chú) để sort
- Phân trang 20 dòng/trang

## Xử lý số liệu đặc thù

Cột khối lượng trong Sheet dùng **dấu phẩy thập phân** kiểu Việt Nam (vd `310,0` nghĩa là 310.0), khác với sheet Bán Hàng dùng dấu chấm bình thường. Hàm `parseVNNumber()` trong `production-dashboard.js` tự chuyển đổi: bỏ dấu chấm (phân cách nghìn nếu có), đổi dấu phẩy thành dấu chấm, rồi parse số.

Tên cột trong Sheet Sản Xuất cũng không cần khớp tuyệt đối — hàm `findKey()` dò cột theo từ khóa (vd tìm cột chứa cả "TÊN" và "TRẠM") để tránh lỗi khi khoảng trắng/viết hoa trong Sheet không đồng nhất.

## Cập nhật & tải dữ liệu

Khác với tab Bán Hàng, tab Sản Xuất **không tự fetch dữ liệu khi trang vừa load** — chỉ fetch lần đầu tiên khi người dùng bấm vào tab "🏭 Sản Xuất" (biến `loaded` trong `ProductionDashboard`, kích hoạt qua `switchView()` ở `js/app.js`). Mục đích: trang mở nhanh hơn, không tải dữ liệu không cần thiết nếu người dùng chỉ xem Bán Hàng.

Sau lần tải đầu, nút "🔄 Cập nhật Dữ Liệu" trong tab dùng để fetch lại dữ liệu mới nhất bất cứ lúc nào.
