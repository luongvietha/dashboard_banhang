# ✨ Tính Năng — Tab Sản Xuất

File logic: [`js/production-dashboard.js`](../js/production-dashboard.js) · Vùng HTML: `#view-sanxuat` trong `index.html`

---

## KPI Cards

| Card | Nội dung | Ghi chú |
|------|----------|---------|
| Tổng Đầu Vào (M³) | Tổng khối lượng các dòng `LoaiKho = 'Đầu vào'` (nguyên liệu nhập kho, tag `(kho: NK)`) | |
| Tổng Đầu Ra (M³) | Tổng khối lượng các dòng `LoaiKho = 'Đầu ra'` (thành phẩm, tag `(kho: TP)`) | |
| Hiệu Suất Chuyển Đổi | `Tổng Đầu Ra / Tổng Đầu Vào × 100%` | Đo hao hụt/hiệu quả chế biến trong khoảng lọc |
| Tổng Số Chuyến | Tổng `SỐ CHUYẾN` | Kèm trung bình m³ đầu ra/chuyến |
| Trạm Hoạt Động | Số trạm (`TÊN TRẠM`) độc nhất | |

*(Đã bỏ card "Xe Hoạt Động" — thông tin xe vẫn còn ở bộ lọc và bảng chi tiết, chỉ không còn ở vị trí nổi bật.)*

## Phân loại Đầu Vào / Đầu Ra

Cột `Tên Sản Phẩm` trong Sheet gắn hậu tố kho ngay trong tên, vd `"Đá hỗn hợp sau nổ mìn (kho: NK)"` hoặc `"Cấp phối thường loại 1 (kho: TP)"`. Hàm `classifyKho()` trong `production-dashboard.js` đọc tag trong ngoặc:

- `NK` (nhập kho nguyên liệu) → **Đầu vào**
- `TP` (thành phẩm) → **Đầu ra**
- Không có tag (vd "Đất tầng phủ") → **Khác**

Hàm `cleanProductName()` bỏ hậu tố `(kho: ..)` khi hiển thị tên sản phẩm cho gọn (bảng chi tiết, chart phân bố). Cột "Loại" trong bảng chi tiết hiển thị badge màu tương ứng (Đầu vào/Đầu ra/Khác).

## Ca làm việc

Cột `Ca` trong Sheet do nhập tay nên có nhiều biến thể chính tả/khoảng trắng (vd `"Ca 1 ( 7h00 - 16h30)"`, `"Ca 1 từ 7h-16h30"`...). Hàm `normalizeCa()` chuẩn hoá về 5 nhóm cố định dựa theo nhãn đứng đầu chuỗi (không phụ thuộc giờ giấc ghi kèm, vì giờ giấc ghi không đồng nhất giữa các dòng):

`Ca 1 (Sáng)` · `Ca 2 (Đêm)` · `Ca 3` · `Hành chính` · `Tăng ca`

Khoảng **64% số dòng trong Sheet gốc chưa được nhập Ca** (để trống) — các dòng này được gộp vào nhóm `Không rõ ca`, hiển thị riêng để thấy rõ độ phủ dữ liệu thay vì ẩn đi. `caSortOrder()` giữ thứ tự hiển thị cố định theo ca thay vì sort alphabet.

## Biểu đồ

1. **Xu Hướng Đầu Vào / Đầu Ra Theo Ngày** (line, 2 đường) — so sánh trực tiếp lượng nguyên liệu vào và thành phẩm ra mỗi ngày
2. **Đầu Vào vs Đầu Ra Theo Trạm** (bar ngang, 2 nhóm cột) — mọi trạm có dữ liệu trong khoảng lọc, sắp theo tổng giảm dần
3. **Khối Lượng Theo Ca Làm Việc** (bar chồng Đầu vào/Đầu ra) — trả lời trực tiếp câu hỏi "ca nào sản xuất nhiều nhất"
4. **Phân Bố Theo Sản Phẩm** (doughnut) — theo tên sản phẩm đã làm sạch (vd Đá hỗn hợp, Cấp phối thường loại 1...)

*(Đã bỏ "Top 10 Trạm Theo Khối Lượng" và "Top 10 Xe Theo Khối Lượng" — thay bằng 2 biểu đồ trên, tập trung vào đầu vào/đầu ra và ca thay vì xếp hạng đơn thuần.)*

## Năng Lực Sản Xuất Theo Trạm (bảng mới)

Bảng riêng, tính lại theo `filteredData` (tôn trọng mọi bộ lọc đang chọn) — mỗi dòng 1 trạm:

| Cột | Cách tính |
|-----|-----------|
| Số Ngày Hoạt Động | Số ngày distinct có khối lượng > 0 (vào hoặc ra) tại trạm đó |
| Tổng Đầu Vào / Tổng Đầu Ra | Tổng theo `LoaiKho` trong khoảng lọc |
| Hiệu Suất (%) | Đầu ra / Đầu vào — đo mức hao hụt chế biến của từng trạm |
| TB Đầu Ra/Ngày | Tổng đầu ra ÷ số ngày hoạt động — sản lượng bình quân |
| Đỉnh Đầu Ra/Ngày | Ngày có đầu ra cao nhất tại trạm đó — proxy cho công suất tối đa quan sát được |

Sắp xếp mặc định theo Tổng Đầu Ra giảm dần. Dùng bảng này để so sánh năng lực thực tế giữa các trạm (không chỉ tổng sản lượng mà cả hiệu suất và mức ổn định).

## Bộ lọc — lọc chéo (cùng cơ chế với tab Bán Hàng)

7 bộ lọc: Từ ngày, Đến ngày, Tháng, Trạm, Sản phẩm, Xe, Ca — mỗi dropdown chỉ hiện giá trị còn khớp với các filter khác đang chọn. Vd chọn 1 Trạm → Xe/Ca chỉ hiện những xe/ca từng hoạt động ở trạm đó trong khoảng ngày đang lọc.

Xem chi tiết cơ chế trong [`FEATURES-BANHANG.md`](FEATURES-BANHANG.md#bộ-lọc--cơ-chế-lọc-chéo-faceted-filtering) — logic giống hệt, chỉ khác tên trường dữ liệu.

## Bảng chi tiết

Cột: Ngày, Trạm, Sản Phẩm, Loại (badge Đầu vào/Đầu ra/Khác), Ca, Xe, Số Chuyến, Khối Lượng (m³), Ghi Chú.

- Click header cột (trừ Loại và Ghi Chú) để sort
- Phân trang 20 dòng/trang

## Xử lý số liệu đặc thù

Cột khối lượng trong Sheet dùng **dấu phẩy thập phân** kiểu Việt Nam (vd `310,0` nghĩa là 310.0), khác với sheet Bán Hàng dùng dấu chấm bình thường. Hàm `parseVNNumber()` trong `production-dashboard.js` tự chuyển đổi: bỏ dấu chấm (phân cách nghìn nếu có), đổi dấu phẩy thành dấu chấm, rồi parse số.

Tên cột trong Sheet Sản Xuất cũng không cần khớp tuyệt đối — hàm `findKey()` dò cột theo từ khóa (vd tìm cột chứa cả "TÊN" và "TRẠM") để tránh lỗi khi khoảng trắng/viết hoa trong Sheet không đồng nhất.

## Cập nhật & tải dữ liệu

Khác với tab Bán Hàng, tab Sản Xuất **không tự fetch dữ liệu khi trang vừa load** — chỉ fetch lần đầu tiên khi người dùng bấm vào tab "🏭 Sản Xuất" (biến `loaded` trong `ProductionDashboard`, kích hoạt qua `switchView()` ở `js/app.js`). Mục đích: trang mở nhanh hơn, không tải dữ liệu không cần thiết nếu người dùng chỉ xem Bán Hàng.

Sau lần tải đầu, nút "🔄 Cập nhật Dữ Liệu" trong tab dùng để fetch lại dữ liệu mới nhất bất cứ lúc nào.

---

## Thành Phẩm Theo Trạm (bổ sung)

File logic: [`js/finished-products-dashboard.js`](../js/finished-products-dashboard.js) · Vùng HTML: cuối `#view-sanxuat`, dưới bảng "Chi Tiết Sản Xuất"

### Nguồn dữ liệu

2 sheet riêng, khác với sheet chuyến xe ở trên — đây là dữ liệu **đầu ra thành phẩm vào kho** của từng trạm sản xuất:

- Trạm Đá (`gid=1255295556`): mỗi dòng = 1 lượt sản xuất của 1 trạm (`TRAMDA1`, `TRAMDA2-350`, `TRAMDA3-500`, `TRAMDA4-350`), ra tối đa 5 sản phẩm/dòng theo tỉ lệ cố định: `D12`, `D24`, `MB`, `MS`, `CPT1`.
- Trạm Cát (`gid=18320018`): mỗi dòng = 1 lượt sản xuất của 1 trạm (`TRAMCAT1`, `TRAMCAT2`, `TRAMCAT3`), ra tối đa 3 sản phẩm/dòng, thực tế đang dùng 2 mã: `C1`, `C3`.

Cả 2 sheet đều là dữ liệu **dạng "rộng"** (nhiều cặp cột Mã SP / KL SP trên cùng 1 dòng), khác với sheet chuyến xe vốn đã ở dạng "dài" (1 dòng = 1 sản phẩm). Hàm `parseWideCSV()` dò theo **chỉ số cột cố định** (không dò theo tên cột như `production-dashboard.js`, vì dòng tiêu đề của 2 sheet này có nhiều dòng gộp/xuống dòng gây khó khớp tên) để chuyển mỗi cặp Mã SP/KL SP thành 1 bản ghi riêng.

### Trạm nào ra sản phẩm gì

Bảng "🧱 Trạm Sản Xuất Ra Sản Phẩm Gì?" liệt kê mọi mã sản phẩm từng xuất hiện ở mỗi trạm (kể cả những ngày khối lượng = 0 — vì 0 chỉ có nghĩa ngày đó không ra hàng, không có nghĩa trạm không có khả năng ra sản phẩm đó). Danh sách này được dựng tự động từ dữ liệu (`buildStationProducts()`), không hard-code, nên luôn khớp với sheet nguồn.

### Biểu đồ theo ngày lựa chọn

Bộ chọn "Chọn ngày" (mặc định = ngày mới nhất có dữ liệu) lọc riêng cho khối này, độc lập với 6 bộ lọc phía trên:

1. **Khối Lượng Theo Trạm (chồng theo sản phẩm)** — bar chart, mỗi cột là 1 trạm, chồng theo từng mã sản phẩm trạm đó ra trong ngày.
2. **Tỷ Trọng Theo Mã Sản Phẩm** — doughnut, tổng khối lượng từng mã sản phẩm trong ngày, gộp tất cả trạm.

Kèm 4 KPI: Tổng thành phẩm, Đá các loại, Cát các loại, Số trạm hoạt động (khối lượng > 0) trong ngày đã chọn.

### Số liệu

Cùng quy ước dấu phẩy thập phân kiểu Việt Nam như sheet chuyến xe (`parseVNNumber()` trong file này là bản riêng, logic giống hệt bản trong `production-dashboard.js`).

### Tải dữ liệu

Cũng lazy-load: chỉ fetch khi vào tab "🏭 Sản Xuất" lần đầu (`finishedProductsDashboard.loaded`, kích hoạt cùng lúc với `prodDashboard` trong `switchView()`).
