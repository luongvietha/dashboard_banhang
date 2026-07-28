# 🔧 Setup Guide - Dashboard Bán Hàng

## 1. Chuẩn Bị Google Sheet

Đảm bảo Google Sheet của bạn có các cột sau (đúng tên, đúng thứ tự không bắt buộc):

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

**Lưu ý:**
- Hàng đầu tiên phải là tên cột (header)
- Không để hàng trống xen giữa dữ liệu
- `SoLuong`, `DonGia`, `ThanhTien` phải là số

---

## 2. Chia Sẻ Google Sheet (Quyền Xem)

1. Mở Google Sheet
2. Click **"Share"** (góc trên phải)
3. Chọn **"Anyone with the link"**
4. Đặt quyền: **"Viewer"** (chỉ xem — không cho sửa)
5. Copy link, lấy **Sheet ID** trong URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_NẰM_Ở_ĐÂY/edit
   ```

---

## 3. Cập Nhật Sheet ID Trong Dashboard

Mở file `index.html`, tìm dòng:

```javascript
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv';
```

Thay `1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs` bằng **Sheet ID** của bạn (nếu dùng sheet khác).

---

## 4. Deploy Lên GitHub Pages

1. Push toàn bộ file lên GitHub repository
2. Vào **Settings** → **Pages**
3. Chọn **Branch: main**, **Folder: / (root)**
4. Click **Save**
5. Chờ 1-2 phút, link sẽ hiện dạng:
   ```
   https://username.github.io/dashboard-banhang/
   ```

---

## 5. Kiểm Tra Hoạt Động

- [ ] Mở link dashboard, trang load được
- [ ] KPI cards hiển thị số liệu
- [ ] 4 biểu đồ hiển thị đúng
- [ ] Filter theo ngày/khách/sản phẩm hoạt động
- [ ] Nút "🔄 Cập nhật Dữ Liệu" hoạt động, không báo lỗi

---

## Troubleshooting

**Lỗi "Failed to fetch" / không tải được dữ liệu:**
- Kiểm tra Sheet đã share **"Anyone with the link" → Viewer** chưa
- Kiểm tra Sheet ID trong `index.html` đúng chưa

**Không thấy dữ liệu dù đã share đúng:**
- Kiểm tra tên cột trong Sheet có khớp với bảng ở mục 1 không
- Kiểm tra không có hàng trống ở đầu Sheet

**CSS không load / dashboard bị vỡ layout:**
- Kiểm tra file `css/styles.css` đã upload đúng đường dẫn chưa
- Kiểm tra `index.html` có dòng `<link rel="stylesheet" href="css/styles.css">` trong `<head>`

