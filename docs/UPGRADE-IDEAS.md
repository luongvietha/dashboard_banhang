# 🚀 Đề Xuất Nâng Cấp Giao Diện — Đánh Giá Chuyên Gia & Kế Hoạch Triển Khai

Tài liệu này tổng hợp và **hoàn thiện** bản đề xuất bạn gửi (file `.py` chứa `markdown_content` bị cắt cụt giữa chừng — dấu `"""` chưa đóng, mục lục hứa 6 phần nhưng chỉ có phần 1-2, phần 3-6 trống). Tôi đã đánh giá từng đề xuất theo tiêu chí: **có phù hợp với stack thật của dashboard không** (vanilla HTML/CSS/JS, không build tool, không backend, host tĩnh trên GitHub Pages), rồi quyết định Áp dụng / Hoãn / Bỏ qua kèm lý do, và chỉ rõ code đặt vào đúng file nào.

---

## 0. Tóm tắt quyết định

| Đề xuất | Quyết định | Vì sao |
|---|---|---|
| Đổi màu nền/chữ sang tông Slate (`#f8fafc`/`#1e293b`) | ✅ Áp dụng | Chỉ sửa 2 biến CSS, không đụng màu thương hiệu `--primary` (xanh lá), rủi ro gần như 0 |
| Font `Inter` | ✅ Áp dụng | 1 request Google Fonts, nâng cấp thẩm mỹ rõ rệt, chi phí thấp |
| `.dashboard-card`, `.badge`, `.trend-indicator` | ✅ Áp dụng | Class thuần CSS, không phụ thuộc gì, dùng ngay được cho bảng/KPI |
| `formatSmartNumber()` (Tỷ/Tr thay vì M/K) | ✅ Áp dụng | Đúng thói quen đọc số tiền của người Việt, thay thế `formatCurrency()` hiện tại |
| `chartColors` + `Chart.defaults` | ✅ Áp dụng | Đồng bộ màu biểu đồ, không phá vỡ chart hiện có |
| Bộ lọc nhanh (Hôm nay/7 ngày/Tháng này...) | ✅ Áp dụng | Khớp hoàn toàn với cơ chế filter lọc chéo đã có, chỉ cần thêm hàm set ngày |
| Mini sparkline trong KPI card | 🟡 Hoãn (Phase 2) | Có giá trị nhưng cần thêm 8 chart instance nhỏ — làm sau khi các phần trên ổn định |
| Chỉ số tăng/giảm so kỳ trước (MoM/DoD) | 🟡 Hoãn (Phase 2) | Cần logic tính "kỳ trước" — rõ ràng nhưng tốn công hơn, tách riêng đợt sau |
| Tailwind CSS / Bootstrap 5 | ❌ Bỏ qua | Trang không có build step; nhúng qua CDN sẽ tải thêm ~300KB+ JS/CSS không cần thiết, và toàn bộ `css/styles.css` hiện tại (đã có biến CSS, class rõ ràng) sẽ phải viết lại từ đầu — chi phí lớn hơn lợi ích |
| Lucide Icons / FontAwesome | ❌ Bỏ qua (tạm) | Emoji hiện tại (📊💰📈) không tốn dependency, render được trên mọi trình duyệt. Chỉ cân nhắc lại nếu sau này cần icon nhất quán tuyệt đối giữa các hệ điều hành |
| Chuyển Chart.js → ApexCharts/ECharts | ❌ Bỏ qua | Chart.js đang chạy ổn, mọi chart đã viết xong; đổi thư viện là viết lại toàn bộ `renderCharts()` ở cả 2 file dashboard mà không giải quyết vấn đề cụ thể nào đang gặp phải |

---

## 1. Kiến trúc & công nghệ — điều chỉnh cho đúng thực tế

Đề xuất gốc gợi ý Tailwind/Bootstrap + Lucide/FontAwesome + ApexCharts/ECharts + Google Fonts. Với một trang **tĩnh, không build tool, không npm**, tôi giữ lại đúng 1 món: **Google Fonts (Inter)**. Còn lại giữ nguyên vanilla CSS/JS hiện tại vì nó đã được tổ chức tốt (biến CSS, tách file theo `sales-dashboard.js` / `production-dashboard.js` / `app.js`).

Bổ sung 1 file mới mà kiến trúc hiện tại đang thiếu: **`js/utils.js`** — chứa các hàm dùng chung cho cả 2 dashboard (format số, tính khoảng ngày nhanh). Tránh lặp code giữa 2 file dashboard.

```
dashboard_banhang/
├── index.html
├── css/styles.css              # + class mới: dashboard-card, badge, trend-indicator
├── js/
│   ├── utils.js                # MỚI — formatSmartNumber, chartColors, quick-range helpers
│   ├── sales-dashboard.js       # dùng lại hàm trong utils.js
│   ├── production-dashboard.js  # dùng lại hàm trong utils.js
│   └── app.js
└── docs/
```

---

## 2. Giao diện (UI) — code cụ thể, đặt vào `css/styles.css`

### 2.1. Cập nhật biến màu nền/chữ

Sửa `:root` hiện tại — **chỉ đổi 2 giá trị**, giữ nguyên `--primary` (thương hiệu xanh lá không đổi):

```css
:root {
    --primary: #2D7A3E;
    --primary-light: #4CAF50;
    --primary-dark: #1B5E20;
    --bg-primary: #F8FAFC;      /* đổi từ #f5f5f5 → Slate-50, dịu mắt hơn */
    --bg-card: #ffffff;
    --text-dark: #1E293B;       /* đổi từ #212529 → Slate-800 */
    --text-muted: #64748B;      /* đổi từ #6c757d → Slate-500, đồng bộ tông Slate */
    --border-color: #E2E8F0;    /* đổi từ #e0e0e0 → Slate-200 */
    --gap: 20px;
    --radius: 8px;
}
```

### 2.2. Nạp font Inter

Thêm vào `<head>` của `index.html`, **trước** thẻ `<link rel="stylesheet" href="css/styles.css">`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Rồi sửa `body` trong `css/styles.css`, thêm `'Inter'` lên đầu font-stack (giữ nguyên phần còn lại làm fallback):

```css
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;background:var(--bg-primary);color:var(--text-dark);line-height:1.5;}
```

### 2.3. Class mới: card nổi nhẹ, badge, trend indicator

Thêm vào **cuối** `css/styles.css` (append, không thay class cũ):

```css
/* ===== Nâng cấp UI: card, badge, trend (bổ sung 29/07) ===== */
.dashboard-card {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease-in-out;
}
.dashboard-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.badge {
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-block;
}
.badge-success { background-color: #dcfce7; color: #15803d; }
.badge-info { background-color: #e0f2fe; color: #0369a1; }
.badge-warning { background-color: #fef3c7; color: #b45309; }

.trend-indicator {
    font-size: 0.85rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 2px;
}
.trend-up { color: #16a34a; }
.trend-down { color: #dc2626; }
```

**Áp dụng ngay được** (không cần chờ Phase 2):

- `.dashboard-card` → thêm class này vào `.kpi-card`, `.chart-card`, `.table-card` trong `index.html` để có hiệu ứng hover mượt hơn (giữ nguyên class cũ, thêm class mới cạnh bên: `class="kpi-card dashboard-card"`)
- `.badge` → dùng cho cột **Loại** trong bảng Bán Hàng: `Hợp Đồng` → `<span class="badge badge-info">Hợp Đồng</span>`, `Bán Lẻ` → `<span class="badge badge-success">Bán Lẻ</span>` (sửa trong `renderTable()` của `sales-dashboard.js`)
- `.trend-indicator` → dùng khi làm phần % tăng/giảm ở Phase 2 (xem mục 4)

---

## 3. `js/utils.js` (file mới) — format số & màu chart dùng chung

```javascript
// ================= UTILS DÙNG CHUNG CHO CẢ 2 DASHBOARD =================

// Định dạng số thông minh theo thói quen đọc số của người Việt (Tỷ/Triệu)
// thay vì M/K kiểu Tây. Dùng cho mọi nơi hiển thị tiền hoặc khối lượng lớn.
function formatSmartNumber(value, type = 'currency') {
    if (value === 0 || !value) return '0';

    if (type === 'currency') {
        if (value >= 1e9) {
            return (value / 1e9).toFixed(2) + ' Tỷ';
        } else if (value >= 1e6) {
            return (value / 1e6).toFixed(1) + ' Tr';
        } else {
            return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
        }
    }

    if (type === 'volume') {
        return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value) + ' m³';
    }

    return new Intl.NumberFormat('vi-VN').format(value);
}
// Ví dụ:
// formatSmartNumber(1250000000, 'currency') => "1.25 Tỷ"
// formatSmartNumber(3450.5, 'volume')       => "3.450,5 m³"

// Bảng màu chuẩn dùng chung cho biểu đồ (khác với --primary CSS, dùng riêng cho chart)
const chartColors = {
    primary: '#0ea5e9',
    secondary: '#10b981',
    accent: '#f59e0b',
    dark: '#334155',
    gridColor: '#f1f5f9'
};

// Áp style mặc định cho MỌI Chart.js instance (gọi 1 lần khi trang load)
function applyChartDefaults() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';
}

// ---- Bộ lọc nhanh: trả về {start, end} dạng yyyy-mm-dd cho từng preset ----
function getQuickRange(preset) {
    const pad = n => String(n).padStart(2, '0');
    const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const today = new Date();

    if (preset === 'today') {
        return { start: toISO(today), end: toISO(today) };
    }
    if (preset === '7days') {
        const from = new Date(today);
        from.setDate(from.getDate() - 6);
        return { start: toISO(from), end: toISO(today) };
    }
    if (preset === 'thisMonth') {
        const from = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: toISO(from), end: toISO(today) };
    }
    if (preset === 'lastMonth') {
        const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const to = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: toISO(from), end: toISO(to) };
    }
    return null; // 'reset' → xử lý riêng ở nơi gọi (set về min/max của rawData)
}
```

Nạp file này **trước** `sales-dashboard.js` và `production-dashboard.js` trong `index.html`:

```html
<script src="js/utils.js"></script>
<script src="js/sales-dashboard.js"></script>
<script src="js/production-dashboard.js"></script>
<script src="js/app.js"></script>
```

Và gọi `applyChartDefaults()` một lần trong `js/app.js`, trước khi khởi tạo dashboard:

```javascript
applyChartDefaults();
const dashboard = new Dashboard();
const prodDashboard = new ProductionDashboard();
```

**Thay thế** `formatCurrency()` hiện có trong `sales-dashboard.js`: mọi chỗ đang gọi `this.formatCurrency(x)` đổi thành `formatSmartNumber(x, 'currency')`, và bỏ hẳn method `formatCurrency()` cũ (không cần nữa vì đã có trong `utils.js`). Tương tự áp dụng `formatSmartNumber(x, 'volume')` cho các chỗ hiển thị m³.

---

## 4. Bộ lọc nhanh (Quick Presets)

**HTML** — thêm vào `.header-top` (cạnh nút "Cập nhật Dữ Liệu"), lặp lại cho cả 2 tab:

```html
<div class="quick-filters">
    <button onclick="dashboard.applyQuickRange('today')">Hôm nay</button>
    <button onclick="dashboard.applyQuickRange('7days')">7 Ngày qua</button>
    <button onclick="dashboard.applyQuickRange('thisMonth')">Tháng này</button>
    <button onclick="dashboard.applyQuickRange('lastMonth')">Tháng trước</button>
    <button onclick="dashboard.applyQuickRange('reset')">Xóa bộ lọc</button>
</div>
```

**CSS** — thêm vào `css/styles.css`:

```css
.quick-filters { display: flex; gap: 8px; flex-wrap: wrap; }
.quick-filters button {
    padding: 6px 14px; border: 1px solid var(--border-color); background: white;
    border-radius: 9999px; font-size: 12px; font-weight: 600; cursor: pointer;
    transition: all 0.15s;
}
.quick-filters button:hover { background: var(--primary); color: white; border-color: var(--primary); }
```

**JS** — thêm method dùng chung logic cho cả `Dashboard` và `ProductionDashboard` (copy vào cả 2 class, đổi đúng id filter tương ứng — bản dưới là cho `sales-dashboard.js`):

```javascript
applyQuickRange(preset) {
    if (preset === 'reset') {
        this.setDefaultDates(); // đã có sẵn — set về min/max của rawData
    } else {
        const range = getQuickRange(preset); // từ utils.js
        document.getElementById('filter-start').value = range.start;
        document.getElementById('filter-end').value = range.end;
    }
    this.onFilterChange();
}
```

Với `production-dashboard.js`, đổi `filter-start`/`filter-end` thành `sx-filter-start`/`sx-filter-end`.

---

## 5. Tooltip biểu đồ chi tiết hơn

Đề xuất "hiển thị đầy đủ Doanh thu/Khối lượng/% đóng góp khi hover" — áp dụng cho 2 chart bar ngang (Top Sản Phẩm, Top Khách Hàng) trong `sales-dashboard.js`, theo mẫu tooltip đã có sẵn ở chart Trend:

```javascript
options: {
    // ... giữ nguyên các option khác ...
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (ctx) => {
                    const total = topSp.reduce((s, x) => s + x[1], 0);
                    const pct = ((ctx.parsed.x / total) * 100).toFixed(1);
                    return `${formatSmartNumber(ctx.parsed.x, 'volume')} (${pct}% tổng)`;
                }
            }
        }
    },
    scales: { x: { beginAtZero: true } }
}
```

---

## 6. Phase 2 (hoãn) — chi tiết để làm sau

### 6.1. Chỉ số tăng/giảm so kỳ trước (Trend Indicator trên KPI)

Logic: tính lại `applyFilters()` với khoảng ngày **liền trước** khoảng đang chọn (cùng độ dài), lấy tổng doanh thu/lượng kỳ đó, so sánh % với kỳ hiện tại. Hiển thị bằng class `.trend-up`/`.trend-down` đã định nghĩa ở mục 2.3:

```html
<span class="trend-indicator trend-up">▲ 8.5%</span>
```

Cần thêm 1 hàm `getPreviousPeriodData()` tính khoảng ngày trước đó, rồi so sánh — để ở đợt nâng cấp tiếp theo vì cần test kỹ với dữ liệu thật (khoảng ngày không đều, có thể lệch khi filter theo tháng).

### 6.2. Mini Sparkline trong KPI Card

Thêm `<canvas>` nhỏ (cao ~40px) chìm trong mỗi `.kpi-card`, vẽ bằng Chart.js với `options: { plugins: { legend: false }, scales: { x: {display:false}, y: {display:false} } }`, dữ liệu lấy từ chuỗi `trendData` đã tính sẵn trong `renderCharts()`. Không khó về mặt kỹ thuật, nhưng nên làm sau khi các phần Phase 1 đã ổn định và kiểm tra hiệu năng (mỗi lần filter đổi sẽ phải destroy/redraw thêm 4 chart nhỏ/tab).

---

## 7. Checklist triển khai

**Phase 1 — làm ngay, rủi ro thấp:**
- [ ] Đổi 4 biến màu trong `:root` (mục 2.1)
- [ ] Nạp Google Fonts Inter + sửa font-stack (mục 2.2)
- [ ] Thêm class `.dashboard-card`, `.badge`, `.trend-indicator` vào `styles.css` (mục 2.3)
- [ ] Gắn `.dashboard-card` vào các card hiện có
- [ ] Đổi cột "Loại" trong bảng Bán Hàng sang `.badge`
- [ ] Tạo `js/utils.js`, nạp vào `index.html` trước 2 file dashboard
- [ ] Thay `formatCurrency()` bằng `formatSmartNumber()` ở cả 2 dashboard
- [ ] Thêm nút Bộ Lọc Nhanh + method `applyQuickRange()` ở cả 2 tab
- [ ] Nâng cấp tooltip 2 chart bar ngang

**Phase 2 — làm sau khi Phase 1 ổn định:**
- [ ] Chỉ số tăng/giảm so kỳ trước
- [ ] Mini sparkline trong KPI card

**Không làm (đã đánh giá không phù hợp với stack tĩnh hiện tại):**
- Tailwind CSS / Bootstrap 5
- Lucide / FontAwesome
- ApexCharts / ECharts
