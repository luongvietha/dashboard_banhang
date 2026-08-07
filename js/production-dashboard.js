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
                const kCa = this.findKey(keys, ['CA']);
                const kXe = this.findKey(keys, ['BIỂN', 'XE']);
                const kChuyen = this.findKey(keys, ['SỐ CHUYẾN']);
                const kTongKL = this.findKey(keys, ['TỔNG', 'KHỐI']);
                const kGhiChu = this.findKey(keys, ['GHI CHÚ']);

                this.rawData = results.data.map(row => {
                    const tenSPRaw = row[kTenSP] || '';
                    return {
                        NgayGoc: row[kDate],
                        TenTram: row[kTenTram],
                        TenSanPham: this.cleanProductName(tenSPRaw),
                        LoaiKho: this.classifyKho(tenSPRaw),
                        Ca: this.normalizeCa(row[kCa]),
                        BienSoXe: row[kXe],
                        SoChuyen: parseInt(row[kChuyen]) || 0,
                        TongKhoiLuong: this.parseVNNumber(row[kTongKL]),
                        GhiChu: row[kGhiChu],
                        date: this.extractDate(row[kDate]),
                        thang: this.extractMonth(row[kDate])
                    };
                }).filter(r => r.NgayGoc);

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

    // Bỏ hậu tố "(kho: NK)" / "(kho: TP)" khỏi tên sản phẩm để hiển thị gọn hơn
    cleanProductName(str) {
        if (!str) return '';
        return String(str).replace(/\s*\(kho:[^)]*\)/i, '').trim();
    }

    // Phân loại Đầu vào (NK = nhập kho nguyên liệu) / Đầu ra (TP = thành phẩm) dựa vào hậu tố "(kho: ..)"
    // trong cột Tên Sản Phẩm. Không có hậu tố (vd "Đất tầng phủ") → xếp loại "Khác".
    classifyKho(str) {
        if (!str) return 'Khác';
        const m = String(str).match(/\(kho:\s*([^)]+)\)/i);
        if (!m) return 'Khác';
        const tag = m[1].trim().toUpperCase();
        if (tag === 'NK') return 'Đầu vào';
        if (tag === 'TP') return 'Đầu ra';
        return 'Khác';
    }

    // Cột "Ca" trong Sheet nhập tay nên có nhiều biến thể ("Ca 1 ( 7h00 - 16h30)", "Ca 1 từ 7h-16h30"...).
    // Chuẩn hoá về 5 ca cố định theo số/nhãn đứng đầu chuỗi. ~64% số dòng chưa được nhập Ca (để trống trong Sheet gốc) → "Không rõ ca".
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

    // Dữ liệu đã áp toàn bộ filter, TRỪ các key trong excludeKeys — dùng để dựng option cho từng dropdown (lọc chéo)
    getFilteredData(excludeKeys = []) {
        const startDate = document.getElementById('sx-filter-start').value;
        const endDate = document.getElementById('sx-filter-end').value;
        const thang = document.getElementById('sx-filter-thang').value;
        const tram = document.getElementById('sx-filter-tram').value;
        const sanpham = document.getElementById('sx-filter-sanpham').value;
        const xe = document.getElementById('sx-filter-xe').value;
        const ca = document.getElementById('sx-filter-ca').value;

        return this.rawData.filter(row => {
            if (startDate && row.date < startDate) return false;
            if (endDate && row.date > endDate) return false;
            if (!excludeKeys.includes('thang') && thang !== 'all' && row.thang !== thang) return false;
            if (!excludeKeys.includes('tram') && tram !== 'all' && row.TenTram !== tram) return false;
            if (!excludeKeys.includes('sanpham') && sanpham !== 'all' && row.TenSanPham !== sanpham) return false;
            if (!excludeKeys.includes('xe') && xe !== 'all' && row.BienSoXe !== xe) return false;
            if (!excludeKeys.includes('ca') && ca !== 'all' && row.Ca !== ca) return false;
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
        this.populateSelect('sx-filter-ca',
            [...new Set(this.getFilteredData(['ca']).map(d => d.Ca).filter(d => d))].sort((a, b) => this.caSortOrder(a) - this.caSortOrder(b)),
            'Tất cả ca');
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
        this.renderCapacityTable();
        this.renderTable();
    }

    renderKPIs() {
        const inputRows = this.filteredData.filter(r => r.LoaiKho === 'Đầu vào');
        const outputRows = this.filteredData.filter(r => r.LoaiKho === 'Đầu ra');
        const tongVao = inputRows.reduce((s, r) => s + r.TongKhoiLuong, 0);
        const tongRa = outputRows.reduce((s, r) => s + r.TongKhoiLuong, 0);
        const hieuSuat = tongVao > 0 ? (tongRa / tongVao * 100) : 0;
        const chuyen = this.filteredData.reduce((s, r) => s + r.SoChuyen, 0);
        const trams = [...new Set(this.filteredData.map(d => d.TenTram).filter(d => d))].length;

        document.getElementById('sx-kpi-khoiluong-vao').textContent = formatSmartNumber(tongVao, 'volume');
        document.getElementById('sx-kpi-khoiluong-ra').textContent = formatSmartNumber(tongRa, 'volume');
        document.getElementById('sx-kpi-hieusuat').textContent = tongVao > 0 ? hieuSuat.toFixed(1) + '%' : '--';
        document.getElementById('sx-kpi-hieusuat-sub').textContent = 'Đầu ra / Đầu vào';

        document.getElementById('sx-kpi-chuyen').textContent = chuyen.toLocaleString('vi-VN');
        document.getElementById('sx-kpi-chuyen-sub').textContent = `TB: ${(tongRa / chuyen || 0).toFixed(1)} m³/chuyến`;

        document.getElementById('sx-kpi-tram').textContent = trams;
    }

    renderCharts() {
        const colors = ['#2D7A3E', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#66BB6A', '#43A047', '#FFA726', '#EF5350', '#AB47BC'];
        const colorVao = '#42A5F5';
        const colorRa = '#2D7A3E';

        // ---- 1. Xu hướng Đầu Vào / Đầu Ra theo ngày ----
        const trendVao = {}, trendRa = {};
        this.filteredData.forEach(row => {
            if (row.LoaiKho === 'Đầu vào') trendVao[row.date] = (trendVao[row.date] || 0) + row.TongKhoiLuong;
            if (row.LoaiKho === 'Đầu ra') trendRa[row.date] = (trendRa[row.date] || 0) + row.TongKhoiLuong;
        });
        const sortedDates = [...new Set([...Object.keys(trendVao), ...Object.keys(trendRa)])].sort();

        const ctx1 = document.getElementById('sx-chart-trend').getContext('2d');
        if (this.charts.trend) this.charts.trend.destroy();
        this.charts.trend = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [
                    {
                        label: 'Đầu vào (m³)',
                        data: sortedDates.map(d => trendVao[d] || 0),
                        borderColor: colorVao,
                        backgroundColor: colorVao + '15',
                        borderWidth: 3, fill: true, tension: 0.4, pointRadius: 3
                    },
                    {
                        label: 'Đầu ra (m³)',
                        data: sortedDates.map(d => trendRa[d] || 0),
                        borderColor: colorRa,
                        backgroundColor: colorRa + '15',
                        borderWidth: 3, fill: true, tension: 0.4, pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'bottom' } },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Khối lượng (m³)' } } }
            }
        });

        // ---- 2. Đầu Vào vs Đầu Ra theo Trạm ----
        const tramVao = {}, tramRa = {};
        this.filteredData.forEach(row => {
            if (!row.TenTram) return;
            if (row.LoaiKho === 'Đầu vào') tramVao[row.TenTram] = (tramVao[row.TenTram] || 0) + row.TongKhoiLuong;
            if (row.LoaiKho === 'Đầu ra') tramRa[row.TenTram] = (tramRa[row.TenTram] || 0) + row.TongKhoiLuong;
        });
        const allTrams = [...new Set([...Object.keys(tramVao), ...Object.keys(tramRa)])]
            .sort((a, b) => ((tramVao[b] || 0) + (tramRa[b] || 0)) - ((tramVao[a] || 0) + (tramRa[a] || 0)));

        const ctx2 = document.getElementById('sx-chart-tram').getContext('2d');
        if (this.charts.tram) this.charts.tram.destroy();
        this.charts.tram = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: allTrams,
                datasets: [
                    { label: 'Đầu vào (m³)', data: allTrams.map(t => tramVao[t] || 0), backgroundColor: colorVao + 'CC', borderColor: colorVao, borderWidth: 1, borderRadius: 4 },
                    { label: 'Đầu ra (m³)', data: allTrams.map(t => tramRa[t] || 0), backgroundColor: colorRa + 'CC', borderColor: colorRa, borderWidth: 1, borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: true, position: 'bottom' } },
                scales: { x: { beginAtZero: true } }
            }
        });

        // ---- 3. Khối lượng theo Ca làm việc (chồng Đầu vào / Đầu ra) ----
        const caList = [...new Set(this.filteredData.map(r => r.Ca).filter(c => c))].sort((a, b) => this.caSortOrder(a) - this.caSortOrder(b));
        const caVao = {}, caRa = {};
        this.filteredData.forEach(row => {
            if (!row.Ca) return;
            if (row.LoaiKho === 'Đầu vào') caVao[row.Ca] = (caVao[row.Ca] || 0) + row.TongKhoiLuong;
            if (row.LoaiKho === 'Đầu ra') caRa[row.Ca] = (caRa[row.Ca] || 0) + row.TongKhoiLuong;
        });

        const ctx3 = document.getElementById('sx-chart-ca').getContext('2d');
        if (this.charts.ca) this.charts.ca.destroy();
        this.charts.ca = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: caList,
                datasets: [
                    { label: 'Đầu vào (m³)', data: caList.map(c => caVao[c] || 0), backgroundColor: colorVao + 'CC', borderColor: colorVao, borderWidth: 1, borderRadius: 4, stack: 's' },
                    { label: 'Đầu ra (m³)', data: caList.map(c => caRa[c] || 0), backgroundColor: colorRa + 'CC', borderColor: colorRa, borderWidth: 1, borderRadius: 4, stack: 's' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'bottom' } },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Khối lượng (m³)' } }
                }
            }
        });

        // ---- 4. Phân bố theo sản phẩm ----
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

    // Năng lực sản xuất theo trạm: tổng đầu vào/ra, hiệu suất chuyển đổi, số ngày hoạt động,
    // sản lượng đầu ra trung bình/ngày và đỉnh sản lượng/ngày quan sát được (proxy cho công suất tối đa).
    renderCapacityTable() {
        const body = document.getElementById('sx-capacity-body');
        if (!body) return;

        const trams = [...new Set(this.filteredData.map(r => r.TenTram).filter(t => t))];
        const rows = trams.map(tram => {
            const rowsOfTram = this.filteredData.filter(r => r.TenTram === tram);
            const vao = rowsOfTram.filter(r => r.LoaiKho === 'Đầu vào');
            const ra = rowsOfTram.filter(r => r.LoaiKho === 'Đầu ra');
            const tongVao = vao.reduce((s, r) => s + r.TongKhoiLuong, 0);
            const tongRa = ra.reduce((s, r) => s + r.TongKhoiLuong, 0);
            const hieuSuat = tongVao > 0 ? (tongRa / tongVao * 100) : null;

            const ngayHoatDong = new Set(rowsOfTram.filter(r => r.TongKhoiLuong > 0).map(r => r.date));
            const soNgayHD = ngayHoatDong.size;
            const tbRaMoiNgay = soNgayHD > 0 ? tongRa / soNgayHD : 0;

            const raTheoNgay = {};
            ra.forEach(r => { raTheoNgay[r.date] = (raTheoNgay[r.date] || 0) + r.TongKhoiLuong; });
            const dinhRa = Object.values(raTheoNgay).reduce((max, v) => Math.max(max, v), 0);

            return { tram, tongVao, tongRa, hieuSuat, soNgayHD, tbRaMoiNgay, dinhRa };
        }).sort((a, b) => b.tongRa - a.tongRa);

        body.innerHTML = rows.map(r => `
            <tr>
                <td>${r.tram}</td>
                <td>${r.soNgayHD}</td>
                <td>${formatSmartNumber(r.tongVao, 'volume')}</td>
                <td>${formatSmartNumber(r.tongRa, 'volume')}</td>
                <td>${r.hieuSuat === null ? '--' : r.hieuSuat.toFixed(1) + '%'}</td>
                <td>${formatSmartNumber(r.tbRaMoiNgay, 'volume')}</td>
                <td>${formatSmartNumber(r.dinhRa, 'volume')}</td>
            </tr>
        `).join('') || '<tr><td colspan="7">Không có dữ liệu trong khoảng lọc hiện tại</td></tr>';
    }

    khoBadge(loai) {
        if (loai === 'Đầu vào') return `<span class="badge badge-info">Đầu vào</span>`;
        if (loai === 'Đầu ra') return `<span class="badge badge-success">Đầu ra</span>`;
        return `<span class="badge badge-warning">Khác</span>`;
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
            html += `<td>${this.khoBadge(row.LoaiKho)}</td>`;
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
