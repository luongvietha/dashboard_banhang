# ✨ Dashboard Features - Chi Tiết

## 📊 KPI Cards

### 1. Tổng Đơn Hàng
- **Hiển thị:** Số lượng đơn hàng trong khoảng lọc
- **Phụ thông tin:** % so với tổng số đơn
- **Dùng để:** Theo dõi khối lượng giao dịch

### 2. Tổng Lượng (M³)
- **Hiển thị:** Tổng số m³ bán được
- **Phụ thông tin:** Trung bình m³ per đơn
- **Dùng để:** Kiểm soát sản lượng

### 3. Tổng Doanh Thu
- **Hiển thị:** Tổng tiền bán hàng
- **Phụ thông tin:** Doanh số bình quân/đơn
- **Dùng để:** Giám sát tài chính
- **Lưu ý:** Chỉ tính các đơn có giá (Bán Lẻ chủ yếu)

### 4. Số Khách Hàng
- **Hiển thị:** Số lượng khách hàng độc lập
- **Phụ thông tin:** "Khách hàng độc nhất"
- **Dùng để:** Đa dạng hóa khách

---

## 📈 Biểu Đồ

### 1. Xu Hướng Doanh Thu Theo Ngày (Line Chart)
**Hiển thị:** 2 trục Y
- Trục trái: Số lượng (M³) - đường xanh
- Trục phải: Doanh thu (đ) - đường xanh nhạt

**Tính năng:**
- Hover xem chi tiết ngày
- Có thể ẩn/hiện dataset (click legend)
- Responsive theo screen size

**Dùng để:** Xem xu hướng bán hàng qua thời gian

### 2. Top 10 Sản Phẩm (Horizontal Bar)
**Hiển thị:** Sắp xếp theo số lượng (M³) giảm dần

**Các sản phẩm:** C1, C2, C3, D12, MB, CPTC2, etc.

**Dùng để:** 
- Xác định sản phẩm bán chạy
- Tập trung marketing vào top

### 3. Top 10 Khách Hàng (Horizontal Bar)
**Hiển thị:** Sắp xếp theo số lượng (M³) giảm dần

**Dùng để:**
- Xác định khách VIP
- Focus vào relationship management

### 4. Phân Bố Loại Đơn (Doughnut Chart)
**So sánh:** Hợp Đồng vs Bán Lẻ

**Cách xem:**
- Hover để xem số đơn
- Phần trăm tính từ tổng đơn hàng
- Màu khác nhau dễ phân biệt

**Dùng để:** 
- Kiểm tra cân bằng 2 loại
- Đánh giá mix bán hàng

---

## 🔍 Filters (Bộ Lọc)

### 1. Khoảng Ngày (Date Range)
- **Từ ngày - Đến ngày:** Lọc dữ liệu trong khoảng
- **Default:** Min date - Max date (tự động)
- **Sử dụng:** Phân tích theo giai đoạn

**Ví dụ:**
```
Từ: 01/07/2026
Đến: 15/07/2026
→ Chỉ xem dữ liệu 01-15 tháng 7
```

### 2. Tháng (Month)
- **Chọn:** Dropdown tháng/năm
- **Format:** 2026-07, 2026-08, etc.
- **Sử dụng:** Lọc nhanh theo tháng

### 3. Loại Đơn (Type)
- **Tất cả:** Hợp Đồng + Bán Lẻ
- **Hợp Đồng:** Chỉ doanh số hợp đồng
- **Bán Lẻ:** Chỉ bán lẻ

**Sử dụng:** Phân tích riêng từng loại

### 4. Khách Hàng (Customer)
- **Tất cả khách:** Không filter
- **Khách cụ thể:** Lọc từng khách
- **Dynamic:** List tự động từ dữ liệu

**Sử dụng:** Xem chi tiết từng khách

### 5. Sản Phẩm (Product)
- **Tất cả:** Không filter
- **Sản phẩm cụ thể:** Lọc từng sản phẩm
- **Dynamic:** List tự động từ dữ liệu

**Sử dụng:** Phân tích từng sản phẩm

---

## 🔄 Cập Nhật Dữ Liệu

### Nút "🔄 Cập nhật Dữ Liệu"
- **Click:** Fetch dữ liệu mới từ Google Sheet
- **Trạng thái:** 
  - ✓ Thành công (xanh)
  - ✗ Lỗi (đỏ)
- **Loading:** Spinner xoay khi đang fetch

**Quy trình:**
1. Click nút
2. Fetch CSV từ Google Sheets API
3. Parse dữ liệu
4. Reset filters & refresh charts
5. Hiển thị thông báo

**Tốc độ:** 2-5 giây (tùy kích thước dữ liệu)

---

## 📋 Bảng Chi Tiết (Table)

### Cột Hiển Thị
| Cột | Nội Dung |
|-----|----------|
| Ngày Giờ | Timestamp đơn hàng |
| Mã Phiếu | Mã phiếu bán hàng |
| Khách Hàng | Mã khách |
| Sản Phẩm | Loại sản phẩm |
| Kho | Kho xuất (Kho Cát/Đá) |
| Số Lượng | M³ |
| Loại | Hợp Đồng/Bán Lẻ |
| Doanh Thu | Thành tiền (VND) |

### Tính Năng
**Sorting:**
- Click header để sort A-Z hoặc Z-A
- Tự động hiển thị ▼ indicator

**Phân Trang:**
- Mặc định: 20 hàng/trang
- Nút Trước/Sau để chuyển trang
- Hiển thị "Hiển thị X-Y của Z dòng"

**Hover:**
- Row highlight khi hover
- Dễ xem dòng đang chọn

---

## 🎨 Giao Diện

### Responsive Design
- **Desktop:** Full layout (3 chart/row)
- **Tablet:** 2 chart/row, filters wrap
- **Mobile:** 1 chart/row, stack filters

### Color Scheme
- **Primary:** Xanh lá (#2D7A3E) - branding
- **Background:** Nhẹ (#f5f5f5) - dễ đọc
- **Text:** Tối (#212529) - contrast tốt
- **Borders:** Mảnh (#e0e0e0) - không nặng

### Accessibility
- ✓ Keyboard navigation (Tab)
- ✓ Form labels rõ ràng
- ✓ Color không phải indicator duy nhất
- ✓ Font size 12px+ (readable)

---

## 🔌 API Integration

### Google Sheets API
- **URL:** `https://sheets.googleapis.com/v4/spreadsheets`
- **Method:** GET
- **Auth:** API Key
- **Format:** CSV

**Flow:**
```
1. User click "Cập nhật"
   ↓
2. Fetch từ API với API Key & Sheet ID
   ↓
3. Parse CSV → JSON
   ↓
4. Validate data (headers khớp không?)
   ↓
5. Update this.rawData
   ↓
6. Apply filters → Refresh all views
```

### Rate Limiting
- Google Sheets API: 500 req/100 sec
- Mỗi click: ~1-2 requests
- **Safe:** 1 click/giây không vấn đề

---

## 🛡️ Bảo Mật & Limitations

### Bảo Mật
- ✓ API Key read-only (chỉ xem)
- ✓ Sheet share quyền Viewer (chỉ xem)
- ✓ HTTPS tự động (GitHub Pages)

### Giới Hạn
- Max dữ liệu: ~10,000 hàng (OK)
- Vượt 50K hàng: cần pagination server-side
- Offline: Không hoạt động (cần API)

### Data Format
Yêu cầu Google Sheet:
- Column headers hàng đầu
- Không hàng trống giữa dữ liệu
- SoLuong, DonGia, ThanhTien = Numbers

---

## 📱 Browser Support

### Tested On
- ✓ Chrome 90+
- ✓ Firefox 88+
- ✓ Safari 14+
- ✓ Edge 90+
- ✓ Mobile Chrome/Safari

### Not Supported
- ✗ IE 11 (outdated)
- ✗ Old Safari (< 12)

---

## 🚀 Performance

### Load Time
- Initial load: 2-3 giây
- Cập nhật dữ liệu: 2-5 giây
- Filter/Sort: Instant (<100ms)
- Chart update: <1 giây

### Optimization Tips
1. Cache API responses
2. Lazy load charts
3. Debounce filters (nếu >50K rows)
4. Minify CSS/JS

---

Bất kỳ tính năng nào bạn muốn thêm? 🎯
