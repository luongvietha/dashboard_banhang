# 🔧 Development Guide

Trước khi sửa, xem [`ARCHITECTURE.md`](ARCHITECTURE.md) để biết file nào chịu trách nhiệm gì. Quy tắc chung: **sửa CSS → `css/styles.css`**, **sửa logic Bán Hàng → `js/sales-dashboard.js`**, **sửa logic Sản Xuất → `js/production-dashboard.js`**, **sửa cấu trúc HTML → `index.html`**.

---

## 1. Thêm filter mới

Ví dụ: thêm filter "Nhân viên" cho tab Bán Hàng.

**Bước 1 — `index.html`:** thêm select trong `.filters-container` của `#view-banhang`:
```html
<div class="filter-group">
    <label for="filter-nhanvien">Nhân viên</label>
    <select id="filter-nhanvien" onchange="dashboard.onFilterChange()">
        <option value="all">Tất cả</option>
    </select>
</div>
```

**Bước 2 — `js/sales-dashboard.js`:**
- Trong `getFilteredData(excludeKeys)`: đọc giá trị filter mới và thêm điều kiện lọc
```javascript
const nhanvien = document.getElementById('filter-nhanvien').value;
// ...
if (!excludeKeys.includes('nhanvien') && nhanvien !== 'all' && row.NhanVien !== nhanvien) return false;
```
- Trong `updateFilterOptions()`: thêm dòng populate cho dropdown mới
```javascript
this.populateSelect('filter-nhanvien',
    [...new Set(this.getFilteredData(['nhanvien']).map(d => d.NhanVien).filter(d => d))].sort(),
    'Tất cả');
```
- Trong `applyFilters()`: thêm điều kiện lọc tương ứng (giống `getFilteredData` nhưng không có excludeKeys)

Áp dụng tương tự cho tab Sản Xuất, chỉ thay file thành `js/production-dashboard.js` và các id filter là `sx-filter-...`.

---

## 2. Thêm biểu đồ mới

Ví dụ: thêm "Doanh thu theo khách hàng" cho tab Bán Hàng.

**Bước 1 — `index.html`:** thêm 1 khối `.chart-card` mới trong `.charts-grid`:
```html
<div class="chart-card">
    <h3>💰 Doanh Thu Theo Khách Hàng</h3>
    <div class="chart-wrapper">
        <canvas id="chart-doanhthu-khach"></canvas>
    </div>
</div>
```

**Bước 2 — `js/sales-dashboard.js`:** thêm logic vẽ chart trong hàm `renderCharts()`, theo mẫu các chart có sẵn:
```javascript
const khachRevenue = {};
this.filteredData.forEach(row => {
    if (!khachRevenue[row.KhachHang]) khachRevenue[row.KhachHang] = 0;
    khachRevenue[row.KhachHang] += row.ThanhTien;
});
const topKhachRevenue = Object.entries(khachRevenue).sort((a, b) => b[1] - a[1]).slice(0, 10);

const ctx5 = document.getElementById('chart-doanhthu-khach').getContext('2d');
if (this.charts.doanhthuKhach) this.charts.doanhthuKhach.destroy();
this.charts.doanhthuKhach = new Chart(ctx5, {
    type: 'bar',
    data: {
        labels: topKhachRevenue.map(x => x[0]),
        datasets: [{ label: 'Doanh thu', data: topKhachRevenue.map(x => x[1]), backgroundColor: '#4CAF50' }]
    },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
});
```

Luôn nhớ gọi `.destroy()` chart cũ trước khi tạo mới (tránh chart chồng lên nhau khi filter thay đổi).

---

## 3. Thêm cột dữ liệu mới

1. Thêm cột vào Google Sheet tương ứng
2. Với sheet **Bán Hàng**: dashboard tự nhận cột mới vì `parseCSV()` dùng spread `...row` để giữ nguyên mọi cột CSV — không cần sửa code nếu chỉ muốn hiển thị ở bảng
3. Với sheet **Sản Xuất**: `parseCSV()` chỉ trích các trường cụ thể (không dùng spread), nên cần thêm dòng ánh xạ cột mới trong `parseCSV()` nếu muốn dùng cột đó cho filter/chart
4. Muốn dùng cột mới cho filter/chart/KPI → xem mục 1 và 2 ở trên

---

## 4. Thêm tab (dashboard) thứ 3

1. Tạo `js/xxx-dashboard.js` theo khuôn class của `production-dashboard.js` (copy làm mẫu, đổi tên field/id)
2. Thêm 1 khối `<div class="dashboard-wrapper view-section" id="view-xxx">...</div>` trong `index.html`
3. Thêm 1 nút nav: `<button class="nav-btn" id="nav-xxx" onclick="switchView('xxx')">...</button>`
4. Cập nhật `switchView()` trong `js/app.js` để toggle thêm section/nav mới, và khởi tạo `const xxxDashboard = new XxxDashboard();`
5. Thêm `<script src="js/xxx-dashboard.js"></script>` vào `index.html` trước `app.js`

---

## Testing checklist

- [ ] Mở `index.html` bằng Chrome (double-click hoặc kéo vào trình duyệt)
- [ ] F12 → Console: không có lỗi đỏ
- [ ] Cả 2 tab load được, chuyển tab mượt
- [ ] Filter lọc chéo hoạt động đúng ở cả 2 tab
- [ ] Sort bảng, phân trang hoạt động
- [ ] Nút "Cập nhật Dữ Liệu" chạy được, không lỗi
- [ ] Responsive: thu nhỏ cửa sổ / F12 → Device mode, kiểm tra mobile

## Naming convention

- Function/method: `camelCase` (`getFilteredData`)
- Hằng số cấu hình: `UPPER_CASE` (`SHEET_URL`, `SHEET_URL_SANXUAT`)
- id/class trong HTML: `kebab-case` (`filter-start`, `sx-kpi-tram`)
- Class JS: `PascalCase` (`Dashboard`, `ProductionDashboard`)
- Tab Sản Xuất luôn tiền tố `sx-` cho id để không đụng với tab Bán Hàng

## Common issues & fixes

| Vấn đề | Nguyên nhân thường gặp | Fix |
|---|---|---|
| "Failed to fetch" | Sheet chưa share Viewer / sai Sheet ID | Xem [`SETUP.md`](SETUP.md) |
| Dropdown luôn trống | Tên cột trong Sheet không khớp | Kiểm tra tên cột đúng theo [`SETUP.md`](SETUP.md) |
| Chart không hiển thị | Sai id canvas, hoặc chart cũ chưa `.destroy()` | Kiểm tra id, đảm bảo gọi destroy trước khi tạo Chart mới |
| CSS không áp dụng | Đường dẫn `css/styles.css` sai, hoặc cache trình duyệt | Ctrl+Shift+R để hard refresh |

## Roadmap

- [ ] Export dữ liệu ra Excel/CSV
- [ ] Dark mode
- [ ] So sánh kỳ trước (YoY / MoM)
- [ ] Thêm tab thứ 3 (vd Công nợ, Kho)
