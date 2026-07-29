// ================= DASHBOARD SẢN XUẤT =================
const SHEET_URL_SANXUAT = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=1120375259';

class ProductionDashboard {
    constructor() {
        this.rawData = [];
        this.filteredData = [];
        this.charts = {};
        this.currentPage = 0;
        this.pageSize = 20;
        this.sortCol = 'NgayGoc';
        this.sortDir = 'desc';
        this.loaded = false;
    }

    async fetchFromSheet() {
        const btn = document.getElementById('sx-refresh-btn');
        const statusMsg = document.getElementById('sx-status-message');

        btn.classList.add('loading');
        statusMsg.classList.remove('show', 'success', 'error');
        statusMsg.textContent = '';

        try {
            const response = await fetch(SHEET_URL_SANXUAT);
            if (!response.ok) throw new Error('Không thể tải dữ liệu từ Google Sheet');

            const csv = await response.text();
            this.parseCSV(csv);
            this.loaded = true;

            this.showStatus('✓ Dữ liệu đã được cập nhật thành công', 'success');
        } catch (error) {
            console.error('Lỗi:', error);
            this.showStatus('✗ Lỗi: ' + error.message, 'error');
        } finally {
            btn.classList.remove('loading');
        }
    }

    // Tìm tên cột thực tế trong CSV theo các từ khóa (tránh lệ thuộc khoảng trắng/viết hoa tuyệt đối)
    findKey(keys, patterns) {
        return keys.find(k => patterns.every(p => k.toUpperCase().includes(p))) || patterns[0];
    }

    parseCSV(csv) {
        Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data.length === 0) { this.rawData = []; return; }
                const keys = Object.keys(results.data[0]);
                const kDate = this.findKey(keys, ['NGÀY']);
                const kTenTram = this.findKey(keys, ['TÊN', 'TRẠM']);
                const kTenSP = this.findKey(keys, ['SẢN PHẨM']);
                const kXe = this.findKey(keys, ['BIỂN', 'XE']);
                const kChuyen = this.findKey(keys, ['SỐ CHUYẾN']);
                const kTongKL = this.findKey(keys, ['TỔNG', 'KHỐI']);
                const kGhiChu = this.findKey(keys, ['GHI CHÚ']);

                this.rawData = results.data.map(row => ({
                    NgayGoc: row[kDate],
                    TenTram: row[kTenTram],
                    TenSanPham: row[kTenSP],
                    BienSoXe: row[kXe],
                    SoChuyen: parseInt(row[kChuyen]) || 0,
                    TongKhoiLuong: this.parseVNNumber(row[kTongKL]),
                    GhiChu: row[kGhiChu],
                    date: this.extractDate(row[kDate]),
                    thang: this.extractMonth(row[kDate])
                })).filter(r => r.NgayGoc);

                this.setDefaultDates();
                this.updateFilterOptions();
                this.applyFilters();
                document.getElementById('sx-update-time').textContent = new Date().toLocaleString('vi-VN');
            },
            error: (error) => {
                throw new Error('Lỗi parse CSV: ' + error.message);
            }
        });
    }

    // Số kiểu Việt Nam dùng dấu phẩy thập phân, vd "310,0" → 310.0
    parseVNNumber(str) {
        if (!str) return 0;
        const cleaned = String(str).trim().replace(/\./g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    }

    extractDate(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(' ')[0].split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return timeStr;
    }

    extractMonth(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(' ')[0].split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}`;
        return timeStr;
    }

    showStatus(message, type) {
        const statusMsg = document.getElementById('sx-status-message');
        statusMsg.textContent = message;
        statusMsg.className = `status-message show ${type}`;
        setTimeout(() => statusMsg.classList.remove('show'), 5000);
    }

    setDefaultDates() {
        if (this.rawData.length === 0) return;
        const dates = this.rawData.map(d => d.date).filter(d => d).sort();
        document.getElementById('sx-filter-start').value = dates[0] || '';
        document.getElementById('sx-filter-end').value = dates[dates.length - 1] || '';
    }

    // Dữ liệu đã áp toàn bộ filter, TRỪ các key trong excludeKeys — dùng để dựng option cho từng dropdown (lọc chéo)
    getFilteredData(excludeKeys = []) {
        const startDate = document.getElementById('sx-filter-start').value;
        const endDate = document.getElementById('sx-filter-end').value;
        const thang = document.getElementById('sx-filter-thang').value;
        const tram = document.getElementById('sx-filter-tram').value;
        const sanpham = document.getElementById('sx-filter-sanpham').value;
        const xe = document.getElementById('sx-filter-xe').value;

        return this.rawData.filter(row => {
            if (startDate && row.date < startDate) return false;
            if (endDate && row.date > endDate) return false;
            if (!excludeKeys.includes('thang') && thang !== 'all' && row.thang !== thang) return false;
            if (!excludeKeys.includes('tram') && tram !== 'all' && row.TenTram !== tram) return false;
            if (!excludeKeys.includes('sanpham') && sanpham !== 'all' && row.TenSanPham !== sanpham) return false;
            if (!excludeKeys.includes('xe') && xe !== 'all' && row.BienSoXe !== xe) return false;
            return true;
        });
    }

    populateSelect(id, values, allLabel) {
        const select = document.getElementById(id);
        const currentValue = select.value;
        select.innerHTML = `<option value="all">${allLabel}</option>`;
        values.forEach(v => {
            const option = document.createElement('option');
            option.value = v;
            option.textContent = v;
            select.appendChild(option);
        });
        select.value = (currentValue !== 'all' && values.includes(currentValue)) ? currentValue : 'all';
    }

    updateFilterOptions() {
        this.populateSelect('sx-filter-thang',
            [...new Set(this.getFilteredData(['thang']).map(d => d.thang).filter(d => d))].sort().reverse(),
            'Tất cả tháng');
        this.populateSelect('sx-filter-tram',
            [...new Set(this.getFilteredData(['tram']).map(d => d.TenTram).filter(d => d))].sort(),
            'Tất cả trạm');
        this.populateSelect('sx-filter-sanpham',
            [...new Set(this.getFilteredData(['sanpham']).map(d => d.TenSanPham).filter(d => d))].sort(),
            'Tất cả');
        this.populateSelect('sx-filter-xe',
            [...new Set(this.getFilteredData(['xe']).map(d => d.BienSoXe).filter(d => d))].sort(),
            'Tất cả xe');
    }

    onFilterChange() {
        this.updateFilterOptions();
        this.applyFilters();
    }

    applyFilters() {
        this.filteredData = this.getFilteredData();
        this.currentPage = 0;
        this.renderKPIs();
        this.renderCharts();
        this.renderTable();
    }

    renderKPIs() {
        const khoiluong = this.filteredData.reduce((s, r) => s + r.TongKhoiLuong, 0);
        const chuyen = this.filteredData.reduce((s, r) => s + r.SoChuyen, 0);
        const trams = [...new Set(this.filteredData.map(d => d.TenTram).filter(d => d))].length;
        const xes = [...new Set(this.filteredData.map(d => d.BienSoXe).filter(d => d))].length;

        document.getElementById('sx-kpi-khoiluong').textContent = khoiluong.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
        document.getElementById('sx-kpi-khoiluong-sub').textContent = `${this.rawData.length > 0 ? (this.filteredData.length / this.rawData.length * 100).toFixed(0) : 0}% của tổng`;

        document.getElementById('sx-kpi-chuyen').textContent = chuyen.toLocaleString('vi-VN');
        document.getElementById('sx-kpi-chuyen-sub').textContent = `TB: ${(khoiluong / chuyen || 0).toFixed(1)} m³/chuyến`;

        document.getElementById('sx-kpi-tram').textContent = trams;
        document.getElementById('sx-kpi-xe').textContent = xes;
    }

    renderCharts() {
        const colors = ['#2D7A3E', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#66BB6A', '#43A047', '#FFA726', '#EF5350', '#AB47BC'];

        // Xu hướng theo ngày
        const trendData = {};
        this.filteredData.forEach(row => {
            if (!trendData[row.date]) trendData[row.date] = 0;
            trendData[row.date] += row.TongKhoiLuong;
        });
        const sortedDates = Object.keys(trendData).sort();

        const ctx1 = document.getElementById('sx-chart-trend').getContext('2d');
        if (this.charts.trend) this.charts.trend.destroy();
        this.charts.trend = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Khối lượng (m³)',
                    data: sortedDates.map(d => trendData[d]),
                    borderColor: colors[0],
                    backgroundColor: colors[0] + '15',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Khối lượng (m³)' } } }
            }
        });

        // Top trạm
        const tramGroups = {};
        this.filteredData.forEach(row => {
            if (!row.TenTram) return;
            if (!tramGroups[row.TenTram]) tramGroups[row.TenTram] = 0;
            tramGroups[row.TenTram] += row.TongKhoiLuong;
        });
        const topTram = Object.entries(tramGroups).sort((a, b) => b[1] - a[1]).slice(0, 10);

        const ctx2 = document.getElementById('sx-chart-tram').getContext('2d');
        if (this.charts.tram) this.charts.tram.destroy();
        this.charts.tram = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: topTram.map(x => x[0]),
                datasets: [{
                    label: 'Khối lượng (m³)',
                    data: topTram.map(x => x[1]),
                    backgroundColor: colors.map(c => c + 'CC'),
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }
            }
        });

        // Top xe
        const xeGroups = {};
        this.filteredData.forEach(row => {
            if (!row.BienSoXe) return;
            if (!xeGroups[row.BienSoXe]) xeGroups[row.BienSoXe] = 0;
            xeGroups[row.BienSoXe] += row.TongKhoiLuong;
        });
        const topXe = Object.entries(xeGroups).sort((a, b) => b[1] - a[1]).slice(0, 10);

        const ctx3 = document.getElementById('sx-chart-xe').getContext('2d');
        if (this.charts.xe) this.charts.xe.destroy();
        this.charts.xe = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: topXe.map(x => x[0]),
                datasets: [{
                    label: 'Khối lượng (m³)',
                    data: topXe.map(x => x[1]),
                    backgroundColor: colors.map(c => c + 'CC'),
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }
            }
        });

        // Phân bố theo sản phẩm
        const spGroups = {};
        this.filteredData.forEach(row => {
            if (!row.TenSanPham) return;
            if (!spGroups[row.TenSanPham]) spGroups[row.TenSanPham] = 0;
            spGroups[row.TenSanPham] += row.TongKhoiLuong;
        });

        const ctx4 = document.getElementById('sx-chart-sanpham').getContext('2d');
        if (this.charts.sanpham) this.charts.sanpham.destroy();
        this.charts.sanpham = new Chart(ctx4, {
            type: 'doughnut',
            data: {
                labels: Object.keys(spGroups),
                datasets: [{
                    data: Object.values(spGroups),
                    backgroundColor: colors.slice(0, Object.keys(spGroups).length).map(c => c + 'CC'),
                    borderColor: '#fff',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, padding: 20 } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)} m³` } }
                }
            }
        });
    }

    renderTable() {
        const start = this.currentPage * this.pageSize;
        const end = Math.min(start + this.pageSize, this.filteredData.length);
        const pageData = this.filteredData.slice(start, end);

        let html = '';
        pageData.forEach(row => {
            html += '<tr>';
            html += `<td>${row.NgayGoc || '-'}</td>`;
            html += `<td>${row.TenTram || '-'}</td>`;
            html += `<td>${row.TenSanPham || '-'}</td>`;
            html += `<td>${row.BienSoXe || '-'}</td>`;
            html += `<td>${row.SoChuyen || '-'}</td>`;
            html += `<td>${row.TongKhoiLuong ? formatSmartNumber(row.TongKhoiLuong, 'volume') : '-'}</td>`;
            html += `<td>${row.GhiChu || '-'}</td>`;
            html += '</tr>';
        });
        document.getElementById('sx-table-body').innerHTML = html;

        const total = this.filteredData.length;
        const pages = Math.ceil(total / this.pageSize);
        let pagination = `<span>Hiển thị ${total === 0 ? 0 : start + 1}-${end} của ${total} dòng</span>`;
        if (pages > 1) {
            pagination += ' | ';
            if (this.currentPage > 0) pagination += `<button onclick="prodDashboard.goPage(${this.currentPage - 1})">← Trước</button>`;
            pagination += ` Trang ${this.currentPage + 1}/${pages} `;
            if (this.currentPage < pages - 1) pagination += `<button onclick="prodDashboard.goPage(${this.currentPage + 1})">Sau →</button>`;
        }
        document.getElementById('sx-pagination').innerHTML = pagination;
    }

    sortTable(col) {
        if (this.sortCol === col) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortCol = col;
            this.sortDir = 'desc';
        }
        this.filteredData.sort((a, b) => {
            let aVal = a[col], bVal = b[col];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            let cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return this.sortDir === 'asc' ? cmp : -cmp;
        });
        this.currentPage = 0;
        this.renderTable();
    }

    goPage(page) {
        this.currentPage = page;
        this.renderTable();
    }

    // Bộ lọc nhanh: 'today' | '7days' | 'thisMonth' | 'lastMonth' | 'reset'
    applyQuickRange(preset) {
        if (preset === 'reset') {
            this.setDefaultDates();
        } else {
            const range = getQuickRange(preset);
            document.getElementById('sx-filter-start').value = range.start;
            document.getElementById('sx-filter-end').value = range.end;
        }
        this.onFilterChange();
    }
}
