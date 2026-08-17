# ✨ Tính Năng — Tab 🏭 Sản Xuất (chuyến xe)

File logic: [`js/production-dashboard.js`](../js/production-dashboard.js) · Vùng HTML: `#view-sanxuat` trong `index.html`

Tab này dùng sheet **"chuyến xe"** (`gid=1120375259`, mỗi dòng = 1 chuyến vận chuyển). Dùng cho: tổng sản lượng vận chuyển, top trạm, phân bố sản phẩm, tổng hợp theo loại trạm, và **phân tích theo ca làm việc** (chỉ sheet này có cột Ca).

**Không dùng để tính đầu vào/đầu ra hay hiệu suất trạm** — sheet chuyến xe không map 1:1 với từng lô sản xuất và không ghi nhận đủ mã sản phẩm đầu ra của trạm cát. Việc đó nằm ở tab riêng 🧱 Thành Phẩm — xem [`FEATURES-THANHPHAM.md`](FEATURES-THANHPHAM.md) (mục "Vì sao tách khỏi sheet chuyến xe" giải thích rõ lý do).

---

## KPI Cards

| Card | Nội dung |
|------|----------|
| Tổng Sản Lượng (m³) | Tổng `TỔNG KHỐI LƯỢNG` trong khoảng lọc, kèm % so với tổng toàn bộ dữ liệu |
| Tổng Số Lượt Vận Chuyển | Tổng `SỐ CHUYẾN`, kèm trung bình m³/chuyến |
| Số Trạm Vận Hành | Số trạm (`TÊN TRẠM`) độc nhất |
| Ca Vận Hành | Số loại ca (trong 5 nhóm chuẩn hoá) có dữ liệu trong khoảng lọc, không tính "Không rõ ca" |

**Bộ lọc nhanh** — Hôm qua / 7 Ngày qua / Tháng này / Tháng trước / Xóa bộ lọc (`applyQuickRange()`). Dùng **"Hôm qua"** thay vì "Hôm nay" vì dữ liệu chuyến xe cũng cập nhật muộn hơn 1 ngày so với ngày thực tế, giống tab Thành Phẩm.

## Bộ lọc — multi-select + lọc chéo

Trạm / Sản phẩm / Xe / Ca dùng chung component `MultiSelect` (`js/utils.js`) — cùng cơ chế với tab Thành Phẩm: chọn được nhiều giá trị cùng lúc (không chọn gì = "tất cả"), và **lọc chéo** (`updateFacetOptions()`) — chọn trước 1 Trạm thì Sản phẩm/Xe/Ca chỉ còn hiện giá trị từng xuất hiện ở trạm đó trong khoảng ngày/tháng đang lọc, giúp danh sách gọn lại thay vì liệt kê hết. Riêng **Tháng** vẫn là `<select>` đơn thường (không multi-select) vì đã có Từ ngày/Đến ngày + bộ lọc nhanh làm việc đó rồi.

## Tổng hợp theo loại trạm (Đá / Cát)

Bảng "📊 Tổng Hợp Theo Loại Trạm" (`renderLoaiTramSummary()`, tbody `sx-loaitram-body`) gộp sản lượng vận chuyển theo nhóm trạm — trạm được phân loại Đá/Cát bằng cách so khớp chuỗi `"CAT"`/`"DA"` trong tên trạm (`classifyLoaiTram()`, cùng quy ước với `finished-products-dashboard.js`). Tính trên `this.filteredData`, tức tôn trọng **toàn bộ** filter đang chọn (kể cả Trạm/Sản phẩm/Xe/Ca) — khác bảng hiệu suất bên tab Thành Phẩm vốn cố định bỏ qua bộ lọc sản phẩm.

| Cột | Cách tính |
|-----|-----------|
| Số Trạm | Số trạm distinct trong nhóm có phát sinh dữ liệu trong khoảng lọc |
| Tổng Sản Lượng (m³) | Cộng dồn `TongKhoiLuong` của mọi dòng trong nhóm |
| Số Chuyến | Cộng dồn `SoChuyen` của mọi dòng trong nhóm |
| % Trên Tổng Sản Lượng | Tỉ trọng sản lượng của nhóm so với tổng sản lượng đã lọc (2 nhóm cộng lại = 100%) |
| Năng Suất TB (m³/ngày) | Tổng sản lượng của nhóm ÷ số ngày **thực sự có sản lượng > 0** trong nhóm đó (không chia cho tổng số ngày lịch) — cho biết tốc độ vận chuyển bình quân mỗi ngày hoạt động, khác với cột Tổng Sản Lượng (chỉ là số cộng dồn, không phản ánh tốc độ) |

## Ca làm việc

Cột `Ca` trong Sheet do nhập tay nên có nhiều biến thể chính tả/khoảng trắng (vd `"Ca 1 ( 7h00 - 16h30)"`, `"Ca 1 từ 7h-16h30"`...). Hàm `normalizeCa()` chuẩn hoá về 5 nhóm cố định dựa theo nhãn đứng đầu chuỗi (không phụ thuộc giờ giấc ghi kèm, vì giờ giấc ghi không đồng nhất giữa các dòng):

`Ca 1 (Sáng)` · `Ca 2 (Đêm)` · `Ca 3` · `Hành chính` · `Tăng ca`

Khoảng **64% số dòng trong Sheet gốc chưa được nhập Ca** (để trống) — các dòng này được gộp vào nhóm `Không rõ ca`, hiển thị riêng để thấy rõ độ phủ dữ liệu thay vì ẩn đi. `caSortOrder()` giữ thứ tự hiển thị cố định theo ca thay vì sort alphabet.

Hàm `cleanProductName()` bỏ hậu tố `(kho: NK)`/`(kho: TP)` khỏi tên sản phẩm khi hiển thị (bảng chi tiết, chart phân bố) — hậu tố này **không** dùng để phân loại đầu vào/đầu ra ở tab này (xem `FEATURES-THANHPHAM.md`).

## Biểu đồ

1. **Xu Hướng Sản Lượng Theo Ngày** (line) — tổng sản lượng m³ mỗi ngày
2. **Top 10 Trạm Theo Sản Lượng** (bar ngang)
3. **Sản Lượng Theo Ca Làm Việc** (bar) — trả lời câu hỏi "ca nào vận chuyển nhiều nhất"
4. **Cơ Cấu Sản Lượng Theo Sản Phẩm** (doughnut) — theo tên sản phẩm đã làm sạch

*(Đã bỏ "Top 10 Xe Theo Khối Lượng" theo yêu cầu — thông tin xe vẫn còn ở bộ lọc và bảng chi tiết.)*

## Bảng chi tiết (Nhật Ký Sản Xuất & Vận Chuyển)

Cột: Ngày, Trạm, Sản Phẩm, Ca, Mã Xe, Số Chuyến, Sản Lượng (m³), Ghi Chú. Click header (trừ Ghi Chú) để sort. Phân trang 20 dòng/trang.

## Xử lý số liệu đặc thù

Cột khối lượng dùng **dấu phẩy thập phân** kiểu Việt Nam (vd `310,0` = 310.0). Hàm `parseVNNumber()` tự chuyển đổi. Tên cột cũng không cần khớp tuyệt đối — hàm `findKey()` dò theo từ khóa.

## Cập nhật & tải dữ liệu

Không tự fetch khi trang vừa load — chỉ fetch lần đầu khi bấm vào tab "🏭 Sản Xuất" (biến `loaded`, kích hoạt qua `switchView()` ở `js/app.js`). Nút "🔄 Cập nhật Dữ Liệu" fetch lại bất cứ lúc nào.
