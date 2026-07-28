# 📊 Dashboard Bán Hàng Online

Dashboard phân tích dữ liệu bán hàng real-time, kết nối trực tiếp với Google Sheet. Hỗ trợ filter theo ngày, khách hàng, sản phẩm và loại đơn hàng.

**🌐 Link Online:** [Truy cập Dashboard](https://username.github.io/dashboard-banhang)  
*Thay `username` bằng username GitHub của bạn*

---

## ✨ Tính Năng

### 📈 Hiển Thị Dữ Liệu
- **KPI Cards**: Tổng đơn hàng, tổng lượng (M³), doanh thu, số khách hàng
- **Biểu đồ Trend**: Xu hướng doanh thu theo ngày (line chart)
- **Top 10 Sản Phẩm**: Bar chart theo số lượng
- **Top 10 Khách Hàng**: Bar chart theo số lượng
- **Phân Bố Loại Đơn**: Doughnut chart (Hợp Đồng vs Bán Lẻ)
- **Bảng Chi Tiết**: Danh sách đầy đủ với sort & phân trang

### 🔍 Bộ Lọc (Filters)
- **Khoảng Ngày**: Từ ngày - Đến ngày (date range)
- **Tháng**: Chọn nhanh theo tháng/năm
- **Loại Đơn**: Hợp Đồng / Bán Lẻ / Tất cả
- **Khách Hàng**: Dropdown danh sách khách
- **Sản Phẩm**: Dropdown danh sách sản phẩm

### 🔄 Cập Nhật Dữ Liệu
- **Nút "Cập nhật Dữ Liệu"**: Fetch dữ liệu mới nhất từ Google Sheet
- **Real-time**: Không cần refresh trang thủ công
- **Status Message**: Hiển thị khi cập nhật thành công/lỗi

---

## 🚀 Setup & Cài Đặt

### 1. Yêu Cầu
- Google Sheet (công khai hoặc share với quyền Viewer)
- Google Sheets API Key (miễn phí)
- GitHub Account (để host dashboard)

### 2. Tạo Google Sheets API Key

**Bước 1:** Vào https://console.cloud.google.com/

**Bước 2:** Tạo Project mới
- Dropdown ở trên → "NEW PROJECT"
- Tên: "Dashboard Bán Hàng"
- Click "CREATE"

**Bước 3:** Enable Google Sheets API
- Search: "Google Sheets API"
- Click "ENABLE"

**Bước 4:** Tạo API Key
- Menu trái → "Credentials"
- "CREATE CREDENTIALS" → "API Key"
- Copy key (dạng `AIzaSy...`)

**Bước 5:** Chia sẻ Google Sheet
- Mở Google Sheet → "Share"
- Chọn "Viewer"
- Link → Copy (Sheet ID: phần giữa URL)

**Bước 6:** Lấy Sheet ID
```
URL: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
Lấy phần: [SHEET_ID]
```

### 3. Update Dashboard

**Mở file** `dashboard_banhang_v3.html` với text editor:

```javascript
// Tìm dòng này (khoảng dòng 200):
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv';

// Thay Sheet ID:
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv';
```

**Lưu file** → Upload lên GitHub

---

## 📋 Cấu Trúc Dữ Liệu Google Sheet

Dashboard yêu cầu Google Sheet có các cột sau:

| Cột | Kiểu | Ví Dụ | Ghi Chú |
|-----|------|-------|--------|
| `ThoiGian` | Text | `01/07/2026 06:53:19` | Ngày giờ đơn hàng |
| `MaPhieuBanHang` | Text | `T7_C1_1` | Mã phiếu bán hàng |
| `KhachHang` | Text | `AVAN` | Mã khách hàng (không dấu) |
| `TenKhachHang` | Text | `CÔNG TY TNHH...` | Tên đầy đủ khách hàng |
| `SanPham` | Text | `C1`, `D12` | Mã sản phẩm |
| `XuatKho` | Text | `Kho Cát`, `Kho Đá` | Kho xuất |
| `SoLuong` | Number | `24.2` | Số lượng (M³) |
| `DonGia` | Number | `450000` | Đơn giá (VND) |
| `ThanhTien` | Number | `2025000` | Thành tiền (VND) |
| `LoaiDonHang` | Text | `Hợp Đồng`, `Bán Lẻ` | Phân loại đơn |

### ⚠️ Lưu Ý
- Column headers phải **chính xác** (case-sensitive)
- `SoLuong`, `DonGia`, `ThanhTien` phải là **số** (không text)
- `ThoiGian` định dạng: `DD/MM/YYYY HH:MM:SS`
- Không có hàng trống giữa dữ liệu

---

## 📖 Cách Sử Dụng

### Trên Dashboard

1. **Cập nhật dữ liệu mới**
   - Click nút "🔄 Cập nhật Dữ Liệu" ở header
   - Chờ message "✓ Dữ liệu đã được cập nhật"

2. **Lọc dữ liệu**
   - Chọn ngày: "Từ ngày" → "Đến ngày"
   - Chọn tháng: dropdown "Tháng"
   - Chọn loại: "Loại Đơn"
   - Chọn khách/sản phẩm từ dropdown

3. **Xem chi tiết**
   - Scroll xuống bảng "Chi Tiết Đơn Hàng"
   - Click header cột để sort (A-Z hoặc Z-A)
   - Dùng nút "Trước" / "Sau" để phân trang

4. **Chia sẻ**
   - Copy URL dashboard
   - Gửi cho team/khách hàng xem

---

## 🔧 Phát Triển & Cập Nhật

### Thêm Tính Năng Mới

**Cách 1: Thêm Filter**
```javascript
// Trong phần populateFilters():
// Tìm nơi tạo dropdown khách hàng
// Thêm tương tự cho nhân viên, khu vực, etc.

const nhânViên = [...new Set(this.rawData.map(d => d.NhanVien).filter(d => d))].sort();
```

**Cách 2: Thêm Biểu Đồ Mới**
```javascript
// Copy phần renderCharts()
// Tạo chart mới, ví dụ: Doanh thu theo khách hàng
const khachGroups = {};
this.filteredData.forEach(row => {
  if (!khachGroups[row.KhachHang]) khachGroups[row.KhachHang] = 0;
  khachGroups[row.KhachHang] += row.ThanhTien;
});
```

**Cách 3: Thêm Cột Dữ Liệu Mới**
1. Thêm cột vào Google Sheet
2. Dashboard sẽ **tự động nhận** (vì dùng CSV headers)
3. Cập nhật JavaScript nếu cần logic mới

### Testing Trước Deploy
1. Download file HTML
2. Mở bằng Chrome/Firefox (local)
3. Test filter, chart, cập nhật
4. Xong → Upload lên GitHub

---

## 📊 Cấu Trúc File

```
dashboard-banhang/
├── index.html              # Dashboard chính
├── README.md              # Documentation này
├── .gitignore             # (optional) Bỏ qua files
└── CHANGELOG.md           # (optional) Lịch sử cập nhật
```

---

## 🐛 Troubleshooting

### Lỗi: "Failed to fetch"
**Nguyên nhân:** API Key hoặc Sheet ID sai, hoặc Sheet không share công khai

**Fix:**
```javascript
// 1. Kiểm tra Sheet ID (phần giữa URL)
// 2. Kiểm tra API Key: Settings → APIs & Services → Credentials
// 3. Kiểm tra Sheet share: Share → "Anyone"
```

### Lỗi: "No data" (Bảng trống)
**Nguyên nhân:** Column headers không khớp, hoặc Sheet không có dữ liệu

**Fix:**
1. Kiểm tra tên cột: `ThoiGian`, `KhachHang`, `SanPham`, etc.
2. Kiểm tra dữ liệu: có hàng trống không?
3. Mở Chrome DevTools (F12) → Console, xem error gì

### Dashboard load chậm
**Fix:**
- Check Google Sheet: có quá nhiều hàng (>10,000) không?
- Chia nhỏ thành multiple sheets
- Hoặc filter dữ liệu cũ

---

## 🎯 Roadmap Tính Năng

### V2.0 (Sắp tới)
- [ ] Thêm filter theo nhân viên bán hàng
- [ ] Thêm biểu đồ doanh thu theo khách hàng
- [ ] Export dữ liệu thành CSV/Excel
- [ ] Thêm so sánh kỳ trước (YoY)

### V3.0 (Dài hạn)
- [ ] Dark mode
- [ ] Mobile app
- [ ] Thông báo (notification) khi có đơn hàng mới
- [ ] Sync với accounting software (QuickBooks, Wave)
- [ ] Dự báo bán hàng (trend analysis)

---

## 🔐 Bảo Mật

### API Key
- ⚠️ API Key sẽ **hiển thị trong HTML** (mọi người có thể thấy)
- ✅ Nhưng chỉ read-only (chỉ xem dữ liệu)
- ✅ Không thể xóa, sửa, hoặc làm gì đó nguy hiểm

### Google Sheet
- ✅ Share với quyền "Viewer" → an toàn
- ⚠️ Nếu Sheet có dữ liệu nhạy cảm, tạo Sheet riêng để share

### Cách tăng bảo mật (Optional)
1. Tạo API Key thứ 2 cho dashboard
2. Vào Google Cloud → Credentials → API Key
3. Click key → "Application restrictions"
4. Chọn "Google Sheets API" only
5. Giới hạn theo IP nếu cần (advanced)

---

## 📞 Support & Liên Hệ

Có vấn đề gì? Cách fix nhanh:

1. **Xóa cache browser:** Ctrl+Shift+Delete
2. **Refresh page:** Ctrl+F5
3. **Kiểm tra console:** F12 → Console tab
4. **Thử incognito mode:** Ctrl+Shift+N

---

## 📝 License

Tự do sử dụng, modify, share. Không cần credit.

---

**Last Updated:** 28/07/2026  
**Version:** 3.0  
**Status:** Production Ready ✅
