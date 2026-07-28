# 📁 Cách Tổ Chức Folder Dashboard

## Bước 1: Tạo Folder Structure trên GitHub

GitHub có sẵn giao diện để tạo folder. Làm theo các bước này:

### Trên GitHub Web

```
dashboard-banhang/
├── index.html                    # Dashboard chính
├── README.md                     # Documentation
├── .gitignore                    # (tạo thêm)
├── css/
│   └── styles.css               # Stylesheet riêng
├── js/
│   ├── main.js                  # Khởi tạo app
│   ├── dashboard.js             # Dashboard class
│   ├── api.js                   # API functions
│   └── utils.js                 # Utility functions
├── docs/
│   ├── SETUP.md                 # Setup guide
│   ├── FEATURES.md              # Chi tiết tính năng
│   └── DEVELOPMENT.md           # Hướng dẫn phát triển
└── data/
    └── sample-data.csv          # Dữ liệu sample (optional)
```

## Bước 2: Upload File trên GitHub

### Cách 1: Web Interface (Dễ nhất)

**Tạo folder `css/`:**
1. Trong repo, click "Add file" → "Create new file"
2. Nhập: `css/styles.css`
3. Paste code từ file `styles.css` (ở dưới)
4. Click "Commit changes"

**Tạo folder `js/`:**
1. Click "Add file" → "Create new file"
2. Nhập: `js/main.js`
3. Paste code
4. Repeat cho `api.js`, `dashboard.js`, `utils.js`

**Tạo folder `docs/`:**
1. Repeat tương tự cho `SETUP.md`, `FEATURES.md`, `DEVELOPMENT.md`

### Cách 2: Dùng Git (Advanced - nếu bạn quen Git)

```bash
# Clone repo
git clone https://github.com/username/dashboard-banhang.git
cd dashboard-banhang

# Tạo folder structure
mkdir -p css js docs data

# Copy files
cp styles.css css/
cp main.js js/
# ... etc

# Push lên GitHub
git add .
git commit -m "Add modular structure"
git push origin main
```

## File Contents

Dưới đây là nội dung từng file để bạn copy:

---

### 📄 css/styles.css
[Xem file: styles.css]

---

### 📄 js/main.js

```javascript
// Dashboard - Main Init
(function() {
    'use strict';

    // Khởi tạo dashboard
    document.addEventListener('DOMContentLoaded', async () => {
        const dashboard = new Dashboard();
        window.dashboard = dashboard; // Global reference
    });

    // Config
    const CONFIG = {
        SHEET_ID: '1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs',
        API_KEY: '', // Update từ Google Cloud Console
        API_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
        RANGE: 'Sheet1!A:Z' // Update tên sheet nếu cần
    };

    window.CONFIG = CONFIG;
})();
```

---

### 📄 js/api.js

```javascript
// API - Google Sheets Functions
class SheetAPI {
    constructor(apiKey, sheetId) {
        this.apiKey = apiKey;
        this.sheetId = sheetId;
    }

    async fetchData(range = 'Sheet1!A:Z') {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${range}?key=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch');
            return await response.json();
        } catch (error) {
            throw new Error('API Error: ' + error.message);
        }
    }

    parseData(values) {
        if (!values || values.length < 2) return [];
        
        const headers = values[0];
        return values.slice(1).map(row => {
            let obj = {};
            headers.forEach((header, i) => {
                obj[header] = row[i] || '';
            });
            return obj;
        }).filter(row => Object.values(row).some(v => v)); // Loại hàng trống
    }
}
```

---

### 📄 js/utils.js

```javascript
// Utils - Helper Functions
class Utils {
    static formatCurrency(value) {
        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
        if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
        return Math.round(value).toLocaleString('vi-VN');
    }

    static formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split(' ')[0].split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    }

    static formatMonth(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split(' ')[0].split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}`;
        }
        return dateStr;
    }

    static showMessage(message, type = 'success', duration = 5000) {
        const el = document.getElementById('status-message');
        if (!el) return;
        
        el.textContent = message;
        el.className = `status-message show ${type}`;
        setTimeout(() => el.classList.remove('show'), duration);
    }

    static escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}
```

---

### 📄 js/dashboard.js

```javascript
// Dashboard - Main Class
class Dashboard {
    constructor() {
        this.rawData = [];
        this.filteredData = [];
        this.charts = {};
        this.currentPage = 0;
        this.pageSize = 20;
        this.sortCol = 'ThoiGian';
        this.sortDir = 'desc';
        this.api = new SheetAPI(CONFIG.API_KEY, CONFIG.SHEET_ID);
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.fetchFromSheet();
    }

    setupEventListeners() {
        // Filter events
        document.getElementById('filter-start')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-end')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-thang')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-loai')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-khach')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-sanpham')?.addEventListener('change', () => this.applyFilters());
    }

    async fetchFromSheet() {
        const btn = document.getElementById('refresh-btn');
        btn?.classList.add('loading');

        try {
            const response = await this.api.fetchData(CONFIG.RANGE);
            const rawData = this.api.parseData(response.values);

            this.rawData = rawData.map(row => ({
                ...row,
                SoLuong: parseFloat(row.SoLuong) || 0,
                DonGia: parseFloat(row.DonGia) || 0,
                ThanhTien: parseFloat(row.ThanhTien) || 0,
                date: Utils.formatDate(row.ThoiGian),
                thang: Utils.formatMonth(row.ThoiGian)
            }));

            this.setDefaultDates();
            this.populateFilters();
            this.applyFilters();
            
            Utils.showMessage('✓ Dữ liệu đã được cập nhật thành công', 'success');
            document.getElementById('update-time').textContent = new Date().toLocaleString('vi-VN');

        } catch (error) {
            Utils.showMessage('✗ Lỗi: ' + error.message, 'error');
            console.error('Fetch error:', error);
        } finally {
            btn?.classList.remove('loading');
        }
    }

    // ... Các method khác (setDefaultDates, populateFilters, applyFilters, renderKPIs, renderCharts, renderTable, etc.)
    // [Copy từ dashboard_banhang_v3.html]
}
```

---

### 📄 docs/SETUP.md

```markdown
# Setup Guide

## 1. Google Sheets API Setup
[Copy từ README.md phần Setup]

## 2. Update Configuration
Trong `js/main.js`, cập nhật:
```javascript
const CONFIG = {
    SHEET_ID: 'YOUR_SHEET_ID',
    API_KEY: 'YOUR_API_KEY',
    RANGE: 'Sheet1!A:Z'
};
```

## 3. File Structure
Đảm bảo folder structure đúng:
- index.html (main)
- css/styles.css
- js/main.js, api.js, utils.js, dashboard.js

## 4. Upload lên GitHub
[Xem hướng dẫn ở trên]
```

---

### 📄 docs/DEVELOPMENT.md

```markdown
# Development Guide

## Thêm Tính Năng Mới

### 1. Thêm Filter Mới
Trong `js/dashboard.js`, method `populateFilters()`:
```javascript
const newField = [...new Set(this.rawData.map(d => d.NewField).filter(d => d))].sort();
const newSelect = document.getElementById('filter-new');
// ... populate options
```

### 2. Thêm Chart Mới
Copy method `renderCharts()`, thêm chart mới:
```javascript
const ctx = document.getElementById('chart-new').getContext('2d');
new Chart(ctx, { ... });
```

### 3. Thêm Cột Dữ Liệu
1. Thêm cột vào Google Sheet
2. Update `CONFIG.RANGE` nếu cần
3. Dashboard sẽ tự động nhận (vì dùng headers)

## Testing

1. Dùng `data/sample-data.csv` để test locally
2. Test filters, charts, pagination
3. Check console (F12) cho errors

## Best Practices

- Giữ code modular (1 concern per file)
- Comment code cho logic phức tạp
- Test trước khi deploy
```

---

## Bước 3: Update index.html

Thay đổi link CSS và JS:

```html
<!-- Từ: -->
<style>
  /* styles inline */
</style>

<!-- Thành: -->
<link rel="stylesheet" href="css/styles.css">

<!-- Từ: -->
<script>
  // code inline
</script>

<!-- Thành: -->
<script src="js/main.js"></script>
<script src="js/utils.js"></script>
<script src="js/api.js"></script>
<script src="js/dashboard.js"></script>
```

---

## Tóm Tắt

✅ **Lợi ích của structure này:**
- Dễ maintain & debug
- Dễ thêm tính năng
- Code reusable
- Professional & scalable

✅ **Quy trình upload:**
1. Tạo folder trên GitHub (Web interface)
2. Upload từng file
3. Update `index.html` link
4. Test online

Bạn muốn tôi tạo các file JS tách biệt đầy đủ không? 🚀
