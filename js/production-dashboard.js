// ================= DASHBOARD SẢN XUẤT =================
// Lưu ý: đây là sheet "chuyến xe" (ghi nhận từng chuyến vận chuyển) — KHÔNG dùng để tính khối lượng
// đầu vào/đầu ra hay hiệu suất trạm (số liệu không khớp 1:1 với từng lô sản xuất, và không có đủ
// mã sản phẩm đầu ra của trạm cát). Phân tích đầu vào/đầu ra + hiệu suất + năng lực sản xuất nằm ở
// khối "Thành Phẩm Theo Trạm" (js/finished-products-dashboard.js), lấy từ sheet công thức sản xuất
// theo từng lô — nguồn dữ liệu đáng tin cậy hơn cho việc đó. Sheet này chỉ dùng cho: tổng khối lượng
// vận chuyển, top trạm, phân bố sản phẩm, và phân tích theo ca làm việc (chỉ sheet này có cột Ca).
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
        this.msTram = null;    // MultiSelect — Trạm (xem js/utils.js)
        this.msSanPham = null; // MultiSelect — Sản phẩm
        this.msXe = null;      // MultiSelect — Xe
        this.msCa = null;      // MultiSelect — Ca
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
                const kCa = this.findKey(keys, ['CA']);
                const kXe = this.findKey(keys, ['BIỂN', 'XE']);
                const kChuyen = this.findKey(keys, ['SỐ CHUYẾN']);
                const kTongKL = this.findKey(keys, ['TỔNG', 'KHỐI']);
                const kGhiChu = this.findKey(keys, ['GHI CHÚ']);

                this.rawData = results.data.map(row => ({
                    NgayGoc: row[kDate],
                    TenTram: row[kTenTram],
                    TenSanPham: this.cleanProductName(row[kTenSP]),
                    Ca: this.normalizeCa(row[kCa]),
                    BienSoXe: row[kXe],
                    SoChuyen: parseInt(row[kChuyen]) || 0,
                    TongKhoiLuong: this.parseVNNumber(row[kTongKL]),
                    GhiChu: row[kGhiChu],
                    date: this.extractDate(row[kDate]),
                    thang: this.extractMonth(row[kDate])
                })).filter(r => r.NgayGoc);

                this.setDefaultDates();
                this.initFilters();
                this.updateFilterOptions();
                this.applyFilters();
                document.getElementById('sx-update-time').textContent = new Date().toLocaleString('vi-VN');
            },
            error: (error) => {
                throw new Error('Lỗi parse CSV: ' + error.message);
            }
        });
    }

    // Bỏ hậu tố "(kho: NK)" / "(kho: TP)" khỏi tên sản phẩm để hiển thị gọn hơn
    cleanProductName(str) {
        if (!str) return '';
        return String(str).replace(/\s*\(kho:[^)]*\)/i, '').trim();
    }

    // Cột "Ca" trong Sheet nhập tay nên có nhiều biến thể ("Ca 1 ( 7h00 - 16h30)", "Ca 1 từ 7h-16h30"...).
    // Chuẩn hoá về 5 ca cố định theo nhãn đứng đầu chuỗi. ~64% số dòng chưa được nhập Ca → "Không rõ ca".
    normalizeCa(str) {
        const s = String(str || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (!s) return 'Không rõ ca';
        if (s.startsWith('ca 1')) return 'Ca 1 (Sáng)';
        if (s.startsWith('ca 2')) return 'Ca 2 (Đêm)';
        if (s.startsWith('ca 3')) return 'Ca 3';
        if (s.startsWith('hành chính')) return 'Hành chính';
        if (s.startsWith('tăng ca')) return 'Tăng ca';
        return String(str).trim(); // giá trị lạ, giữ nguyên để không mất dữ liệu
    }

    // Thứ tự hiển thị cố định cho các ca (thay vì sắp xếp theo alphabet)
    caSortOrder(ca) {
        const order = ['Ca 1 (Sáng)', 'Ca 2 (Đêm)', 'Ca 3', 'Hành chính', 'Tăng ca', 'Không rõ ca'];
        const idx = order.indexOf(ca);
        return idx === -1 ? order.length : idx;
    }

    // Phân loại trạm theo tên (Đá / Cát / Khác) — cùng quy ước với js/finished-products-dashboard.js
    classifyLoaiTram(tenTram) {
        const t = (tenTram || '').toUpperCase();
        if (t.includes('CAT')) return 'Cát';
        if (t.includes('DA')) return 'Đá';
        return 'Khác';
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
        if (parts.length === 3) {
            const pad = n => String(n).padStart(2, '0');
            return `${parts[2]}-${pad(parts[1])}-${pad(parts[0])}`;
        }
        return timeStr;
    }

    extractMonth(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(' ')[0].split('/');
        if (parts.length === 3) {
            const pad = n => String(n).padStart(2, '0');
            return `${parts[2]}-${pad(parts[1])}`;
        }
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

    // sel.length === 0 nghĩa là chưa chọn gì trong MultiSelect → hiểu là "tất cả" (không lọc)
    matchSel(ms, val) {
        const sel = ms ? ms.getSelected() : [];
        return sel.length === 0 || sel.includes(val);
    }

    // Dữ liệu đã áp toàn bộ filter, TRỪ các key trong excludeKeys — dùng để dựng option cho từng
    // MultiSelect/dropdown (lọc chéo, giống hệt cơ chế bên tab Thành Phẩm).
    getFilteredData(excludeKeys = []) {
        const startDate = document.getElementById('sx-filter-start').value;
        const endDate = document.getElementById('sx-filter-end').value;
        const thang = document.getElementById('sx-filter-thang').value;

        return this.rawData.filter(row => {
            if (startDate && row.date < startDate) return false;
            if (endDate && row.date > endDate) return false;
            if (!excludeKeys.includes('thang') && thang !== 'all' && row.thang !== thang) return false;
            if (!excludeKeys.includes('tram') && !this.matchSel(this.msTram, row.TenTram)) return false;
            if (!excludeKeys.includes('sanpham') && !this.matchSel(this.msSanPham, row.TenSanPham)) return false;
            if (!excludeKeys.includes('xe') && !this.matchSel(this.msXe, row.BienSoXe)) return false;
            if (!excludeKeys.includes('ca') && !this.matchSel(this.msCa, row.Ca)) return false;
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

    // Khởi tạo 4 ô multi-select (chỉ 1 lần khi có dữ liệu) — Tháng vẫn là <select> đơn thường
    initFilters() {
        if (!this.msTram) {
            this.msTram = new MultiSelect('sx-filter-tram', { allLabel: 'Tất cả trạm', onChange: () => this.onFilterChange() });
        }
        if (!this.msSanPham) {
            this.msSanPham = new MultiSelect('sx-filter-sanpham', { allLabel: 'Tất cả', onChange: () => this.onFilterChange() });
        }
        if (!this.msXe) {
            this.msXe = new MultiSelect('sx-filter-xe', { allLabel: 'Tất cả xe', onChange: () => this.onFilterChange() });
        }
        if (!this.msCa) {
            this.msCa = new MultiSelect('sx-filter-ca', { allLabel: 'Tất cả ca', onChange: () => this.onFilterChange() });
        }
        this.updateFacetOptions();
    }

    // Tháng vẫn dùng <select> đơn (không multi-select, vì đã có Từ ngày/Đến ngày + bộ lọc nhanh)
    updateFilterOptions() {
        this.populateSelect('sx-filter-thang',
            [...new Set(this.getFilteredData(['thang']).map(d => d.thang).filter(d => d))].sort().reverse(),
            'Tất cả tháng');
    }

    // Lọc chéo (faceted): mỗi ô multi-select chỉ hiện các giá trị còn khớp với 3 ô kia + khoảng ngày/tháng
    // đang chọn — giống hệt cơ chế bên tab Thành Phẩm (updateFacetOptions() trong finished-products-dashboard.js).
    updateFacetOptions() {
        this.msTram.setOptions(
            [...new Set(this.getFilteredData(['tram']).map(d => d.TenTram).filter(d => d))].sort());
        this.msSanPham.setOptions(
            [...new Set(this.getFilteredData(['sanpham']).map(d => d.TenSanPham).filter(d => d))].sort());
        this.msXe.setOptions(
            [...new Set(this.getFilteredData(['xe']).map(d => d.BienSoXe).filter(d => d))].sort());
        this.msCa.setOptions(
            [...new Set(this.getFilteredData(['ca']).map(d => d.Ca).filter(d => d))].sort((a, b) => this.caSortOrder(a) - this.caSortOrder(b)));
    }

    onFilterChange() {
        this.updateFilterOptions();
        this.updateFacetOptions();
        this.applyFilters();
    }

    applyFilters() {
        this.filteredData = this.getFilteredData();
        this.currentPage = 0;
        this.renderKPIs();
        this.renderLoaiTramSummary();
        this.renderCharts();
        this.renderTable();
    }

    // Tổng hợp sản lượng vận chuyển tách riêng theo LOẠI TRẠM (Đá / Cát), tính trên this.filteredData
    // (tức là tôn trọng toàn bộ filter đang chọn, kể cả Trạm/Sản phẩm/Xe/Ca — khác bảng hiệu suất bên
    // tab Thành Phẩm vốn cố định bỏ qua bộ lọc SP, vì ở đây không có khái niệm "hiệu suất vào/ra").
    // Năng Suất TB = tổng sản lượng của nhóm ÷ số NGÀY THỰC SỰ có sản lượng > 0 trong nhóm đó (không
    // chia cho tổng số ngày lịch, cùng quy ước với "Sản Lượng TB/Ngày" bên tab Thành Phẩm) — cho biết
    // tốc độ sản xuất/vận chuyển bình quân mỗi ngày hoạt động, khác với Tổng Sản Lượng (chỉ là cộng dồn).
    renderLoaiTramSummary() {
        const body = document.getElementById('sx-loaitram-body');
        if (!body) return;

        const groups = {};
        this.filteredData.forEach(row => {
            const loai = this.classifyLoaiTram(row.TenTram);
            if (!groups[loai]) groups[loai] = { khoiluong: 0, chuyen: 0, trams: new Set(), days: new Set() };
            groups[loai].khoiluong += row.TongKhoiLuong;
            groups[loai].chuyen += row.SoChuyen;
            if (row.TenTram) groups[loai].trams.add(row.TenTram);
            if (row.date && row.TongKhoiLuong > 0) groups[loai].days.add(row.date);
        });

        const tongKL = this.filteredData.reduce((s, r) => s + r.TongKhoiLuong, 0);
        const order = ['Đá', 'Cát', 'Khác'];
        const rows = order.filter(k => groups[k]).map(loai => {
            const g = groups[loai];
            const pct = tongKL > 0 ? (g.khoiluong / tongKL * 100) : 0;
            const nangSuat = g.days.size > 0 ? (g.khoiluong / g.days.size) : 0;
            return `<tr>
                <td>${loai}</td>
                <td>${g.trams.size}</td>
                <td>${formatSmartNumber(g.khoiluong, 'volume')}</td>
                <td>${g.chuyen.toLocaleString('vi-VN')}</td>
                <td>${pct.toFixed(1)}%</td>
                <td>${formatSmartNumber(nangSuat, 'volume')}</td>
            </tr>`;
        });

        body.innerHTML = rows.join('') || '<tr><td colspan="6">Không có dữ liệu trong khoảng lọc hiện tại</td></tr>';
    }

    renderKPIs() {
        const khoiluong = this.filteredData.reduce((s, r) => s + r.TongKhoiLuong, 0);
        const chuyen = this.filteredData.reduce((s, r) => s + r.SoChuyen, 0);
        const trams = [...new Set(this.filteredData.map(d => d.TenTram).filter(d => d))].length;
        const cas = [...new Set(this.filteredData.map(d => d.Ca).filter(d => d && d !== 'Không rõ ca'))].length;

        document.getElementById('sx-kpi-khoiluong').textContent = formatSmartNumber(khoiluong, 'volume');
        document.getElementById('sx-kpi-khoiluong-sub').textContent = `${this.rawData.length > 0 ? (this.filteredData.length / this.rawData.length * 100).toFixed(0) : 0}% của tổng`;

        document.getElementById('sx-kpi-chuyen').textContent = chuyen.toLocaleString('vi-VN');
        document.getElementById('sx-kpi-chuyen-sub').textContent = `TB: ${(khoiluong / chuyen || 0).toFixed(1)} m³/chuyến`;

        document.getElementById('sx-kpi-tram').textContent = trams;
        document.getElementById('sx-kpi-ca').textContent = cas;
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

        // Khối lượng theo ca làm việc
        const caList = [...new Set(this.filteredData.map(r => r.Ca).filter(c => c))].sort((a, b) => this.caSortOrder(a) - this.caSortOrder(b));
        const caGroups = {};
        this.filteredData.forEach(row => {
            if (!row.Ca) return;
            caGroups[row.Ca] = (caGroups[row.Ca] || 0) + row.TongKhoiLuong;
        });

        const ctx3 = document.getElementById('sx-chart-ca').getContext('2d');
        if (this.charts.ca) this.charts.ca.destroy();
        this.charts.ca = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: caList,
                datasets: [{
                    label: 'Khối lượng (m³)',
                    data: caList.map(c => caGroups[c] || 0),
                    backgroundColor: colors.map(c => c + 'CC'),
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Khối lượng (m³)' } } }
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
            html += `<td>${row.Ca || '-'}</td>`;
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

    // Bộ lọc nhanh: 'yesterday' | '7days' | 'thisMonth' | 'lastMonth' | 'reset'
    // Dùng "Hôm qua" thay vì "Hôm nay" vì dữ liệu chuyến xe cũng cập nhật muộn hơn 1 ngày (giống khối thành phẩm).
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
