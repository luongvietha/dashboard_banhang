# 🔧 Setup Guide

Dashboard có 3 tab dữ liệu (Bán Hàng, Sản Xuất, Thành Phẩm), đọc từ nhiều sheet (tab) khác nhau trong cùng 1 Google Sheets file — Bán Hàng gộp từ 2 sheet, Sản Xuất từ 1 sheet, Thành Phẩm từ 2 sheet (Trạm Đá + Trạm Cát).

---

## 1. Cấu trúc dữ liệu cần có

### Sheet Bán Hàng

| Cột | Mô Tả | Ví Dụ |
|-----|-------|-------|
| ThoiGian | Ngày giờ đơn hàng | 27/07/2026 14:30 |
| MaPhieuBanHang | Mã phiếu bán hàng | PBH-0012 |
| KhachHang | Tên/mã khách hàng | Khách A |
| SanPham | Tên sản phẩm | C1, C2, D12... |
| XuatKho | Kho xuất hàng | Kho Cát |
| SoLuong | Số lượng (m³) | 15.5 |
| DonGia | Đơn giá (VND) | 250000 |
| ThanhTien | Thành tiền (VND) | 3875000 |
| LoaiDonHang | Loại đơn | Hợp Đồng / Bán Lẻ |

### Sheet Sản Xuất

| Cột | Mô Tả | Ví Dụ |
|-----|-------|-------|
| NGÀY | Ngày sản xuất | 02/01/2026 |
| MÃ TRẠM | Mã trạm | TRAMCAT2 |
| TÊN TRẠM | Tên trạm | TRẠM CÁT2 |
| MÃ SP | Mã sản phẩm | DHH, CPT1 |
| Tên Sản Phẩm | Tên đầy đủ sản phẩm | Đá hỗn hợp sau nổ mìn (kho: NK) |
| BIỂN SỐ XE | Biển số xe vận chuyển | 85C-01514 |
| SỐ CHUYẾN | Số chuyến trong ngày | 20 |
| TỔNG KHỐI LƯỢNG (m3) | Tổng khối lượng, dùng dấu phẩy thập phân | 310,0 |
| GHI CHÚ | Ghi chú (tùy chọn) | |

### Sheet Thành Phẩm (Trạm Đá / Trạm Cát)

2 sheet dạng **"rộng"** riêng biệt (mỗi dòng = 1 lô sản xuất, nhiều cặp cột Mã/Khối Lượng trên cùng 1 dòng thay vì 1 dòng/sản phẩm) — cấu trúc khác hẳn 2 sheet ở trên nên không liệt kê bảng cột ở đây. Chi tiết cấu trúc cột (theo chỉ số 0-based, không theo tên) và ý nghĩa từng sheet xem [`FEATURES-THANHPHAM.md`](FEATURES-THANHPHAM.md#nguồn-dữ-liệu--2-sheet-công-thức-sản-xuất-theo-lô). Nếu đổi cấu trúc cột của 2 sheet này, phải sửa `inputPairs`/`outputPairs` trong `js/finished-products-dashboard.js` (hàm `fetchFromSheet()`), không chỉ đổi link.

**Lưu ý chung:**
- Hàng đầu tiên phải là tên cột (header) — riêng 2 sheet Thành Phẩm có 2 dòng tiêu đề (dòng nhóm cột gộp + dòng tên cột), code tự bỏ qua 2 dòng đầu
- Không để hàng trống xen giữa dữ liệu
- Cột số của sheet Bán Hàng dùng dấu chấm thập phân bình thường; cột khối lượng của sheet Sản Xuất và Thành Phẩm dùng **dấu phẩy** kiểu Việt Nam (vd `310,0`) — code đã tự xử lý việc này (hàm `parseVNNumber` trong từng file)
- Tên cột của sheet Sản Xuất không cần khớp tuyệt đối 100% (code tự dò cột theo từ khóa), nhưng nên giữ đúng các từ khóa: NGÀY, TÊN TRẠM, Sản Phẩm, BIỂN SỐ, SỐ CHUYẾN, TỔNG KHỐI LƯỢNG

---

## 2. Chia sẻ Google Sheet (quyền xem)

1. Mở Google Sheet
2. Click **"Share"** (góc trên phải)
3. Chọn **"Anyone with the link"**
4. Đặt quyền: **"Viewer"** (chỉ xem — không cho sửa)
5. Lấy **Sheet ID** trong URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_NẰM_Ở_ĐÂY/edit
   ```
6. Nếu Sản Xuất nằm ở 1 tab (sheet con) khác trong cùng file, lấy thêm `gid` trong URL khi mở đúng tab đó:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=GID_NẰM_Ở_ĐÂY
   ```

---

## 3. Cập nhật link Sheet trong code

**Sheet Bán Hàng** — mở file `js/sales-dashboard.js`, đầu file. Dữ liệu được **gộp từ 2 gid** rồi lọc trùng theo `MaPhieuBanHang` (lý do: dữ liệu cũ nằm ở 1 sheet, dữ liệu bổ sung nằm ở sheet khác):

```javascript
const SHEET_URL_MAIN = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=618992108';
const SHEET_URL_SUPPLEMENT = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=1674192120';
```

**Sheet Sản Xuất (chuyến xe)** — mở file `js/production-dashboard.js`, dòng đầu tiên:

```javascript
const SHEET_URL_SANXUAT = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=1120375259';
```

**Sheet Thành Phẩm (Trạm Đá / Trạm Cát)** — mở file `js/finished-products-dashboard.js`, đầu file:

```javascript
const SHEET_URL_TRAMDA = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=1255295556';
const SHEET_URL_TRAMCAT = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=18320018';
```

Thay `SHEET_ID` và `gid` tương ứng nếu bạn đổi sang Sheet khác. Muốn biết gid của 1 tab: mở tab đó trong Google Sheets, xem số sau `gid=` trên URL trình duyệt.

---

## 4. Deploy lên GitHub Pages

1. Push toàn bộ file lên GitHub repository (qua GitHub Desktop: Commit → Push)
2. Vào **Settings** → **Pages**
3. Chọn **Branch: main**, **Folder: / (root)**
4. Click **Save**
5. Chờ 1-2 phút, link sẽ hiện dạng:
   ```
   https://<username>.github.io/<repo>/
   ```

Link hiện tại: **https://luongvietha.github.io/dashboard_banhang/**

---

## 5. Kiểm tra hoạt động

- [ ] Mở link dashboard, trang load được
- [ ] Tab "📦 Bán Hàng": KPI + 4 biểu đồ + bảng có dữ liệu
- [ ] Tab "🏭 Sản Xuất": bấm vào tab, dữ liệu tự tải, KPI + 4 biểu đồ + bảng Tổng Hợp Theo Loại Trạm có dữ liệu
- [ ] Tab "🧱 Thành Phẩm": bấm vào tab, dữ liệu tự tải, KPI + 4 biểu đồ + bảng Tổng Hợp Theo Loại Trạm + bảng Báo Cáo Hiệu Suất có dữ liệu
- [ ] Đổi bộ lọc ngày/khách/sản phẩm/trạm/xe — các ô lọc khác tự thu hẹp theo (lọc chéo, multi-select)
- [ ] Nút "🔄 Cập nhật Dữ Liệu" ở mỗi tab hoạt động, không báo lỗi

---

## Troubleshooting

**Lỗi "Failed to fetch" / không tải được dữ liệu:**
- Kiểm tra Sheet đã share **"Anyone with the link" → Viewer** chưa
- Kiểm tra Sheet ID / gid trong `js/sales-dashboard.js`, `js/production-dashboard.js`, hoặc `js/finished-products-dashboard.js` đúng chưa

**Không thấy dữ liệu dù đã share đúng:**
- Kiểm tra tên cột trong Sheet có khớp với bảng ở mục 1 không
- Kiểm tra không có hàng trống ở đầu Sheet

**CSS không load / dashboard bị vỡ layout:**
- Kiểm tra `css/styles.css` có tồn tại đúng đường dẫn `css/styles.css` không
- Kiểm tra `index.html` có dòng `<link rel="stylesheet" href="css/styles.css?v=...">` trong `<head>`

**Tab Sản Xuất / Thành Phẩm không tự tải dữ liệu:**
- Dữ liệu 2 tab này chỉ tải khi bấm vào tab lần đầu (lazy-load, xem `js/app.js` → `switchView()`) — đây là hành vi cố ý để trang load nhanh hơn, không phải lỗi

**Sửa xong không thấy thay đổi khi mở lại trang:**
- Trình duyệt có thể đang cache `index.html`/`css`/`js` cũ — `index.html` đã gắn query-string version (`?v=yyyymmddX`) vào mọi link CSS/script để tránh việc này; nếu vẫn không thấy thay đổi, tăng số version đó lên rồi thử lại
