# 🔧 Development Guide

## Thêm Tính Năng Mới

### 1. Thêm Filter Mới

**File:** `js/dashboard.js` → `populateFilters()` method

```javascript
// Ví dụ: Thêm filter Nhân Viên
const nhânViên = [...new Set(this.rawData.map(d => d.NhanVien).filter(d => d))].sort();
const nhanVienSelect = document.getElementById('filter-nhanvien');
nhânViên.forEach(nv => {
    const option = document.createElement('option');
    option.value = nv;
    option.textContent = nv;
    nhanVienSelect.appendChild(option);
});
```

**HTML:** Thêm select element
```html
<div class="filter-group">
    <label for="filter-nhanvien">Nhân viên</label>
    <select id="filter-nhanvien" onchange="dashboard.applyFilters()">
        <option value="all">Tất cả</option>
    </select>
</div>
```

**Logic filter:** Cập nhật `applyFilters()` method
```javascript
const nhanvien = document.getElementById('filter-nhanvien').value;
// ...
if (nhanvien !== 'all' && row.NhanVien !== nhanvien) return false;
```

### 2. Thêm Biểu Đồ Mới

**File:** `js/dashboard.js` → `renderCharts()` method

```javascript
// Ví dụ: Top Doanh Thu Theo Khách Hàng
const khachGroups = {};
this.filteredData.forEach(row => {
    if (!khachGroups[row.KhachHang]) khachGroups[row.KhachHang] = 0;
    khachGroups[row.KhachHang] += row.ThanhTien;
});

const topKhach = Object.entries(khachGroups)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 10);

const ctx = document.getElementById('chart-khach-revenue').getContext('2d');
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: topKhach.map(x => x[0]),
        datasets: [{
            label: 'Doanh thu',
            data: topKhach.map(x => x[1]),
            backgroundColor: '#4CAF50'
        }]
    },
    options: { /* Chart.js options */ }
});
```

**HTML:** Thêm canvas element
```html
<div class="chart-card">
    <h3>💰 Top Khách Hàng Theo Doanh Thu</h3>
    <div class="chart-wrapper">
        <canvas id="chart-khach-revenue"></canvas>
    </div>
</div>
```

### 3. Thêm Cột Dữ Liệu Mới

**Bước 1:** Thêm cột vào Google Sheet

**Bước 2:** Update `CONFIG.RANGE` nếu cần
```javascript
CONFIG.RANGE = 'Sheet1!A:AA' // Tăng nếu có column mới
```

**Bước 3:** Dashboard sẽ **tự động nhận** vì dùng CSV headers!

Không cần code thêm - khá tiện lợi 👍

### 4. Thêm KPI Card Mới

**File:** `js/dashboard.js` → `renderKPIs()` method

```javascript
// Ví dụ: Tính tổng giờ bán hàng
const totalHours = this.filteredData.length;
document.getElementById('kpi-hours').textContent = totalHours;
```

**HTML:**
```html
<div class="kpi-card">
    <div class="kpi-label">Tổng Giao Dịch</div>
    <div class="kpi-value" id="kpi-hours">0</div>
    <div class="kpi-subtext">Số lượt</div>
</div>
```

## Testing

### Local Testing
1. Mở `index.html` bằng Chrome
2. F12 → Console để xem errors
3. Test tất cả filters & charts
4. Kiểm tra responsive (F12 → Device mode)

### Testing Checklist
- [ ] Filters hoạt động đúng
- [ ] Charts update khi filter
- [ ] Sorting table OK
- [ ] Pagination OK
- [ ] Cập nhật dữ liệu OK
- [ ] Mobile responsive OK

## Best Practices

### Code Organization
```
js/
├── main.js          # Khởi tạo, config
├── api.js           # Google Sheets API calls
├── utils.js         # Helper functions
└── dashboard.js     # Main Dashboard class
```

### Naming Convention
- Functions: `camelCase` (getDashboardData)
- Constants: `UPPER_CASE` (API_KEY)
- Elements: `kebab-case` id (filter-start)
- Classes: `PascalCase` (Dashboard)

### Comments
```javascript
// Tính toán tổng doanh thu
const total = data.reduce((sum, row) => sum + row.amount, 0);

// IMPORTANT: Google Sheets API có rate limit 500 requests/100 seconds
```

### Performance Tips
- Cache DOM queries: `const el = document.getElementById('...')`
- Debounce filters nếu data lớn
- Use `const` không dùng `var`
- Tránh global variables ngoài cần thiết

## Deployment Checklist

Trước khi push lên production:

- [ ] Update CONFIG (API_KEY, SHEET_ID)
- [ ] Test filters & charts
- [ ] Check console có errors không
- [ ] Update docs (README, DEVELOPMENT)
- [ ] Test link online
- [ ] Chia sẻ cho team

## Common Issues & Fixes

### Issue: "Failed to fetch"
**Cause:** API Key sai hoặc Sheet không share
**Fix:** Kiểm tra API Key, Sheet share settings

### Issue: "No data"
**Cause:** CSV headers không khớp
**Fix:** Kiểm tra cột: ThoiGian, KhachHang, SanPham, etc.

### Issue: Chart không hiển thị
**Cause:** Canvas element không tìm thấy
**Fix:** Kiểm tra ID canvas, reload trang

## Roadmap

### V2.0
- [ ] Export CSV/Excel
- [ ] Dark mode
- [ ] Filter theo nhân viên
- [ ] Biểu đồ doanh thu theo khách

### V3.0
- [ ] Mobile app
- [ ] Real-time notifications
- [ ] Predictive analytics
- [ ] Multi-language support

## Support

Có vấn đề? Xem:
1. Console log (F12)
2. Docs (DEVELOPMENT.md này)
3. README troubleshooting
