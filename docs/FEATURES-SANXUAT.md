# ✨ Tính Năng — Tab Sản Xuất

Tab này gồm 2 khối độc lập, dùng 3 sheet nguồn khác nhau:

1. **Dashboard Sản Xuất** (`js/production-dashboard.js`) — dữ liệu **chuyến xe** (mỗi dòng = 1 chuyến vận chuyển). Dùng cho: tổng khối lượng vận chuyển, top trạm, phân bố sản phẩm, và **phân tích theo ca làm việc** (chỉ sheet này có cột Ca).
2. **Đầu Vào / Đầu Ra Theo Trạm** (`js/finished-products-dashboard.js`) — dữ liệu **công thức sản xuất theo lô** (mỗi dòng = 1 lượt sản xuất, có cả khối lượng nguyên liệu vào và khối lượng từng sản phẩm ra trong cùng 1 dòng). Dùng cho: khối lượng đầu vào/đầu ra, hiệu suất, năng lực sản xuất, biến thiên theo trạm/sản phẩm.

**Vì sao tách riêng:** ban đầu khối lượng đầu vào/đầu ra và hiệu suất được tính từ sheet chuyến xe (dựa vào tag `(kho: NK)`/`(kho: TP)` trong tên sản phẩm), nhưng cách này sai lệch — sheet chuyến xe không map 1:1 với từng lô sản xuất (xe chở có thể trễ/sớm hơn thời điểm sản xuất thực tế), và **không ghi nhận đủ mã sản phẩm đầu ra của trạm cát** (C1, C3) dưới dạng phân biệt được, nên "tổng đầu ra" tính từ sheet đó bị thiếu, không phản ánh đúng tổng của cả đá và cát. Sheet công thức sản xuất theo lô không có vấn đề này vì khối lượng vào/ra nằm ngay trên cùng 1 dòng theo đúng tỉ lệ quy đổi thật của trạm.

---

# 1. Dashboard Sản Xuất (chuyến xe)

File logic: [`js/production-dashboard.js`](../js/production-dashboard.js) · Vùng HTML: đầu `#view-sanxuat` trong `index.html`

## KPI Cards

| Card | Nội dung |
|------|----------|
| Tổng Sản Lượng (m³) | Tổng `TỔNG KHỐI LƯỢNG` trong khoảng lọc, kèm % so với tổng toàn bộ dữ liệu |
| Tổng Số Lượt Vận Chuyển | Tổng `SỐ CHUYẾN`, kèm trung bình m³/chuyến |
| Số Trạm Vận Hành | Số trạm (`TÊN TRẠM`) độc nhất |
| Ca Vận Hành | Số loại ca (trong 5 nhóm chuẩn hoá) có dữ liệu trong khoảng lọc, không tính "Không rõ ca" |

## Ca làm việc

Cột `Ca` trong Sheet do nhập tay nên có nhiều biến thể chính tả/khoảng trắng (vd `"Ca 1 ( 7h00 - 16h30)"`, `"Ca 1 từ 7h-16h30"`...). Hàm `normalizeCa()` chuẩn hoá về 5 nhóm cố định dựa theo nhãn đứng đầu chuỗi (không phụ thuộc giờ giấc ghi kèm, vì giờ giấc ghi không đồng nhất giữa các dòng):

`Ca 1 (Sáng)` · `Ca 2 (Đêm)` · `Ca 3` · `Hành chính` · `Tăng ca`

Khoảng **64% số dòng trong Sheet gốc chưa được nhập Ca** (để trống) — các dòng này được gộp vào nhóm `Không rõ ca`, hiển thị riêng để thấy rõ độ phủ dữ liệu thay vì ẩn đi. `caSortOrder()` giữ thứ tự hiển thị cố định theo ca thay vì sort alphabet.

Hàm `cleanProductName()` bỏ hậu tố `(kho: NK)`/`(kho: TP)` khỏi tên sản phẩm khi hiển thị (bảng chi tiết, chart phân bố) — hậu tố này **không** còn được dùng để phân loại đầu vào/đầu ra ở khối này nữa (xem phần "Vì sao tách riêng" ở trên).

## Biểu đồ

1. **Xu Hướng Khối Lượng Theo Ngày** (line) — tổng khối lượng m³ mỗi ngày
2. **Top 10 Trạm Theo Khối Lượng** (bar ngang)
3. **Khối Lượng Theo Ca Làm Việc** (bar) — trả lời câu hỏi "ca nào vận chuyển nhiều nhất"
4. **Phân Bố Theo Sản Phẩm** (doughnut) — theo tên sản phẩm đã làm sạch

*(Đã bỏ "Top 10 Xe Theo Khối Lượng" theo yêu cầu — thông tin xe vẫn còn ở bộ lọc và bảng chi tiết.)*

## Bộ lọc — lọc chéo (cùng cơ chế với tab Bán Hàng)

7 bộ lọc: Từ ngày, Đến ngày, Tháng, Trạm, Sản phẩm, Xe, Ca — mỗi dropdown chỉ hiện giá trị còn khớp với các filter khác đang chọn.

Xem chi tiết cơ chế trong [`FEATURES-BANHANG.md`](FEATURES-BANHANG.md#bộ-lọc--cơ-chế-lọc-chéo-faceted-filtering) — logic giống hệt, chỉ khác tên trường dữ liệu.

## Bảng chi tiết

Cột: Ngày, Trạm, Sản Phẩm, Ca, Xe, Số Chuyến, Khối Lượng (m³), Ghi Chú. Click header (trừ Ghi Chú) để sort. Phân trang 20 dòng/trang.

## Xử lý số liệu đặc thù

Cột khối lượng dùng **dấu phẩy thập phân** kiểu Việt Nam (vd `310,0` = 310.0). Hàm `parseVNNumber()` tự chuyển đổi. Tên cột cũng không cần khớp tuyệt đối — hàm `findKey()` dò theo từ khóa.

## Cập nhật & tải dữ liệu

Không tự fetch khi trang vừa load — chỉ fetch lần đầu khi bấm vào tab "🏭 Sản Xuất" (biến `loaded`, kích hoạt qua `switchView()` ở `js/app.js`). Nút "🔄 Cập nhật Dữ Liệu" fetch lại bất cứ lúc nào.

---

# 2. Đầu Vào / Đầu Ra Theo Trạm

File logic: [`js/finished-products-dashboard.js`](../js/finished-products-dashboard.js) · Vùng HTML: cuối `#view-sanxuat`, dưới bảng chi tiết của khối 1

## Nguồn dữ liệu — 2 sheet "công thức sản xuất theo lô"

- **Trạm Đá** (`gid=1255295556`): mỗi dòng = 1 lô sản xuất của 1 trạm (`TRAMDA1`, `TRAMDA2-350`, `TRAMDA3-500`, `TRAMDA4-350`), có **1 nguyên liệu đầu vào** (`Mã HC`, luôn là `DHH` — đá hỗn hợp sau nổ mìn) và ra tối đa 5 sản phẩm: `D12`, `D24`, `MB`, `MS`, `CPT1`. Tổng đầu ra ≈ 100% đầu vào (không hao hụt theo quy ước).
- **Trạm Cát** (`gid=18320018`): mỗi dòng = 1 lô sản xuất của 1 trạm (`TRAMCAT1`, `TRAMCAT2`, `TRAMCAT3`), có **tối đa 3 nguyên liệu đầu vào** (khác nhau giữa các lô: `DHH`, `CPT1`, `MB`, `MS`, `DTP`...) và ra tối đa 3 sản phẩm, thực tế dùng 2 mã: `C1`, `C3`. Tổng đầu ra ≈ **90%** đầu vào — **10% hao hụt** theo quy ước (đã kiểm chứng khớp với dữ liệu thật, vd lô 310,00 m³ vào → 248,00 + 31,00 = 279,00 m³ ra = đúng 90%).

Cả 2 sheet ở dạng **"rộng"** (nhiều cặp cột Mã/KL trên 1 dòng). Hàm `parseWideCSV()` dò theo **chỉ số cột cố định** (không theo tên cột, vì dòng tiêu đề có nhiều dòng gộp/xuống dòng khó khớp tên) để dựng mảng **lô** (`this.lots`), rồi "nổ" ra 2 mảng chi tiết: `outputRows` (1 dòng/sản phẩm) và `inputRows` (1 dòng/nguyên liệu).

## Trạm nào ra sản phẩm gì

Bảng "🧱 Danh Mục Sản Phẩm Theo Trạm" liệt kê mọi mã sản phẩm từng xuất hiện ở mỗi trạm (kể cả ngày sản lượng = 0). Dựng tự động từ dữ liệu (`buildStationProducts()`), không hard-code.

## Bộ lọc — multi-select + lọc chéo

- **Từ ngày / Đến ngày** — mặc định = toàn bộ khoảng có dữ liệu
- **Trạm**, **SP Đầu Ra**, **SP Đầu Vào** — dạng **multi-select** (dropdown checkbox, component `MultiSelect` dùng chung trong [`js/utils.js`](../js/utils.js)), cho phép chọn nhiều giá trị cùng lúc thay vì chỉ 1. Không chọn gì = hiểu là "tất cả".

Nút bấm hiện "Tất cả trạm" khi chưa chọn gì, hiện thẳng tên khi chọn đúng 1 giá trị, hoặc "N đã chọn" khi chọn nhiều. Trong danh sách sổ xuống có nút "Chọn tất cả" / "Bỏ chọn" để thao tác nhanh.

**Lọc chéo (giống tab Bán Hàng):** `updateFacetOptions()` tính lại danh sách lựa chọn hợp lệ cho từng ô mỗi khi 1 trong 3 ô (hoặc khoảng ngày) thay đổi — vd chọn trước 1 Trạm thì SP Đầu Ra/Đầu Vào chỉ còn hiện các mã từng xuất hiện ở trạm đó trong khoảng ngày đang lọc, danh sách gọn lại thay vì liệt kê hết mọi mã trong toàn bộ dữ liệu. Giá trị đã chọn trước đó nhưng không còn hợp lệ sẽ tự bị bỏ (`MultiSelect.setOptions()`).

**Lưu ý:** bộ lọc SP Đầu Ra chỉ ảnh hưởng số liệu/biểu đồ **đầu ra**, bộ lọc SP Đầu Vào chỉ ảnh hưởng số liệu/biểu đồ **đầu vào** — hai chiều lọc độc lập. Riêng **bảng Năng Lực Sản Xuất luôn tính trên toàn bộ lô** (không áp 2 bộ lọc sản phẩm này), để hiệu suất phản ánh đúng tỉ lệ quy đổi thật của cả trạm thay vì bị méo do chỉ xem 1 sản phẩm con.

## KPI Cards

| Card | Nội dung |
|------|----------|
| Tổng Đầu Vào (M³) | Tổng `inputRows` đã lọc |
| Tổng Đầu Ra (M³) | Tổng `outputRows` đã lọc — **gồm cả sản phẩm đá và cát cộng chung**, khắc phục lỗi thiếu đầu ra cát ở cách tính cũ |
| Sản Lượng TB/Ngày (M³) | Tổng đầu ra đã lọc ÷ số ngày **thực sự có sản lượng ra** trong khoảng lọc (không chia cho tổng số ngày lịch, vì trạm không chạy liên tục mọi ngày) — kèm chú thích số ngày dùng để tính |
| Số Trạm Vận Hành | Số trạm có lô trong khoảng lọc |
| Số Lượt Sản Xuất | Số lô (`this.filteredLots.length`) |

## Biểu đồ xu hướng (theo yêu cầu "xem sự biến thiên")

1. **Xu Hướng Sản Lượng Đầu Ra Theo Trạm** (line, nhiều đường — mỗi trạm 1 đường màu riêng) — thấy rõ trạm nào tăng/giảm/bất ổn theo ngày
2. **Xu Hướng Sản Lượng Theo Sản Phẩm** (line, nhiều đường — mỗi mã sản phẩm 1 đường) — thấy rõ sản phẩm nào tăng/giảm theo ngày, không phụ thuộc trạm nào sản xuất

Cả 2 chart dùng chung `outputRows` đã lọc (theo ngày/trạm/SP Đầu Ra), màu được gán cố định theo `colorFor(index)` để nhất quán giữa các lần vẽ lại.

## Biểu đồ cơ cấu (toàn khoảng lọc)

3. **Cơ Cấu Sản Lượng Đầu Ra** (doughnut)
4. **Cơ Cấu Nguyên Liệu Đầu Vào** (doughnut)

## Báo Cáo Hiệu Suất Vận Hành Theo Trạm (bảng)

Mỗi dòng 1 trạm, tính từ `filteredLots` (chỉ lọc theo ngày + trạm, **không** theo SP Đầu Ra/Vào):

| Cột | Cách tính |
|-----|-----------|
| Số Ngày Hoạt Động | Số ngày distinct có khối lượng vào hoặc ra > 0 tại trạm đó |
| Tổng Đầu Vào / Tổng Đầu Ra | Tổng `khoiLuongVao`/`khoiLuongRa` của các lô |
| Hiệu Suất (%) | Đầu ra ÷ Đầu vào — kỳ vọng **~100% ở trạm đá, ~90% ở trạm cát** (10% hao hụt); số liệu lệch xa khỏi mức này là dấu hiệu cần kiểm tra dữ liệu |
| Sản Lượng TB/Ngày | Tổng đầu ra ÷ số ngày hoạt động |
| Sản Lượng Cực Đại/Ngày | Ngày có đầu ra cao nhất tại trạm đó — proxy cho công suất tối đa quan sát được |

Sắp xếp mặc định theo Tổng Đầu Ra giảm dần.

## Số liệu

Cùng quy ước dấu phẩy thập phân kiểu Việt Nam (`parseVNNumber()`, bản riêng trong file này). Ngày trong 2 sheet nguồn không đồng nhất định dạng (`05/01/2026` lẫn `13/1/2026`) — `toISODate()` tự pad về `yyyy-mm-dd`.

## Tải dữ liệu

Lazy-load: chỉ fetch khi vào tab "🏭 Sản Xuất" lần đầu (`finishedProductsDashboard.loaded`, kích hoạt cùng lúc với `prodDashboard` trong `switchView()`).
