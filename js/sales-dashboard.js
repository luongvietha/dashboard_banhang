// ================= DASHBOARD BÁN HÀNG =================
// Dữ liệu bán hàng được gộp từ 2 sheet:
// - "Trang tính3" (gid=618992108): dữ liệu từ 01/07/2026 trở đi (sheet gốc)
// - "BH_T1-T6" (gid=1674192120): sheet bổ sung, dữ liệu 02/01/2026 - 30/06/2026
// (trước đây SHEET_URL không có gid nên mặc định trỏ vào sheet đầu tiên - dễ vỡ khi thêm/xoá tab;
// nay trỏ đích danh gid để tránh lấy nhầm sheet)
const SHEET_URL_MAIN = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=618992108';
const SHEET_URL_SUPPLEMENT = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=1674192120';

class Dashboard {
    constructor() {
        this.rawData = [];
        this.filteredData = [];
        this.charts = {};
        this.currentPage = 0;
        this.pageSize = 20;
        this.sortCol = 'ThoiGian';
        this.sortDir = 'desc';
        this.init();
    }

    init() {
        this.fetchFromSheet();
    }

    async fetchFromSheet() {
        const btn = document.getElementById('refresh-btn');
        const statusMsg = document.getElementById('status-message');

        btn.classList.add('loading');
        statusMsg.classList.remove('show', 'success', 'error');
        statusMsg.textContent = '';

        try {
            const [resMain, resSupp] = await Promise.all([
                fetch(SHEET_URL_MAIN),
                fetch(SHEET_URL_SUPPLEMENT)
            ]);
            if (!resMain.ok || !resSupp.ok) throw new Error('Không thể tải dữ liệu từ Google Sheet');

            const [csvMain, csvSupp] = await Promise.all([resMain.text(), resSupp.text()]);
            await this.parseCSV(csvMain, csvSupp);

            this.showStatus('✓ Dữ liệu đã được cập nhật thành công', 'success');

        } catch (error) {
            console.error('Lỗi:', error);
            this.showStatus('✗ Lỗi: ' + error.message, 'error');
        } finally {
            btn.classList.remove('loading');
        }
    }

    // Parse 1 chuỗi CSV thành mảng object (Promise hoá Papa.parse để gộp được nhiều sheet)
    parseOneCSV(csv) {
        return new Promise((resolve, reject) => {
            Papa.parse(csv, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (error) => reject(new Error('Lỗi parse CSV: ' + error.message))
            });
        });
    }

    // Gộp dữ liệu từ sheet chính (Trang tính3, từ 01/07 trở đi) + sheet bổ sung (BH_T1-T6, 01/01 - 30/06)
    async parseCSV(csvMain, csvSupplement) {
        const [mainRows, suppRows] = await Promise.all([
            this.parseOneCSV(csvMain),
            this.parseOneCSV(csvSupplement)
        ]);

        // Loại trùng theo MaPhieuBanHang, phòng trường hợp 2 sheet có dữ liệu giao nhau
        const seen = new Set();
        const merged = [];
        [...suppRows, ...mainRows].forEach(row => {
            const key = row.MaPhieuBanHang || null;
            if (key) {
                if (seen.has(key)) return;
                seen.add(key);
            }
            merged.push(row);
        });

        this.rawData = merged.map(row => ({
            ...row,
            SoLuong: parseFloat(row.SoLuong) || 0,
            DonGia: parseFloat(row.DonGia) || 0,
            ThanhTien: parseFloat(row.ThanhTien) || 0,
            date: this.extractDate(row.ThoiGian),
            thang: this.extractMonth(row.ThoiGian)
        })).filter(r => r.ThoiGian); // Loại hàng trống

        this.setDefaultDates();
        this.updateFilterOptions();
        this.applyFilters();
        document.getElementById('update-time').textContent = new Date().toLocaleString('vi-VN');
    }

    extractDate(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(' ')[0].split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return timeStr;
    }

    extractMonth(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(' ')[0].split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}`;
        }
        return timeStr;
    }

    showStatus(message, type) {
        const statusMsg = document.getElementById('status-message');
        statusMsg.textContent = message;
        statusMsg.className = `status-message show ${type}`;
        setTimeout(() => {
            statusMsg.classList.remove('show');
        }, 5000);
    }

    setDefaultDates() {
        if (this.rawData.length === 0) return;
        const dates = this.rawData.map(d => d.date).filter(d => d).sort();
        const minDate = dates[0];
        const maxDate = dates[dates.length - 1];
        document.getElementById('filter-start').value = minDate || '';
        document.getElementById('filter-end').value = maxDate || '';
    }

    // Trả về dữ liệu đã áp toàn bộ filter hiện tại, TRỪ các key liệt kê trong excludeKeys.
    // Dùng để tính option cho 1 dropdown dựa trên các lựa chọn còn lại (lọc chéo - faceted filtering).
    getFilteredData(excludeKeys = []) {
        const startDate = document.getElementById('filter-start').value;
        const endDate = document.getElementById('filter-end').value;
        const thang = document.getElementById('filter-thang').value;
        const loai = document.getElementById('filter-loai').value;
        const khach = document.getElementById('filter-khach').value;
        const sanpham = document.getElementById('filter-sanpham').value;

        return this.rawData.filter(row => {
            if (startDate && row.date < startDate) return false;
            if (endDate && row.date > endDate) return false;
            if (!excludeKeys.includes('thang') && thang !== 'all' && row.thang !== thang) return false;
            if (!excludeKeys.includes('loai') && loai !== 'all' && row.LoaiDonHang !== loai) return false;
            if (!excludeKeys.includes('khach') && khach !== 'all' && row.KhachHang !== khach) return false;
            if (!excludeKeys.includes('sanpham') && sanpham !== 'all' && row.SanPham !== sanpham) return false;
            return true;
        });
    }

    // Cập nhật lại danh sách trong 1 dropdown, giữ nguyên lựa chọn hiện tại nếu vẫn còn hợp lệ
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

    // Xây lại cả 4 dropdown: mỗi dropdown chỉ hiện giá trị còn khớp với TẤT CẢ filter khác
    // (ngày + 3 dropdown còn lại). Vd: chọn Khách A → Sản phẩm chỉ hiện SP mà khách A từng mua
    // trong khoảng ngày đang chọn; đổi ngày → Khách/Sản phẩm cũng thu hẹp theo ngày đó.
    updateFilterOptions() {
        this.populateSelect('filter-thang',
            [...new Set(this.getFilteredData(['thang']).map(d => d.thang).filter(d => d))].sort().reverse(),
            'Tất cả tháng');
        this.populateSelect('filter-loai',
            [...new Set(this.getFilteredData(['loai']).map(d => d.LoaiDonHang).filter(d => d))].sort(),
            'Tất cả');
        this.populateSelect('filter-khach',
            [...new Set(this.getFilteredData(['khach']).map(d => d.KhachHang).filter(d => d))].sort(),
            'Tất cả khách');
        this.populateSelect('filter-sanpham',
            [...new Set(this.getFilteredData(['sanpham']).map(d => d.SanPham).filter(d => d))].sort(),
            'Tất cả');
    }

    // Gọi khi người dùng đổi bất kỳ filter nào (ngày, tháng, loại, khách, sản phẩm)
    onFilterChange() {
        this.updateFilterOptions();
        this.applyFilters();
    }

    applyFilters() {
        const startDate = document.getElementById('filter-start').value;
        const endDate = document.getElementById('filter-end').value;
        const thang = document.getElementById('filter-thang').value;
        const loai = document.getElementById('filter-loai').value;
        const khach = document.getElementById('filter-khach').value;
        const sanpham = document.getElementById('filter-sanpham').value;

        this.filteredData = this.rawData.filter(row => {
            if (startDate && row.date < startDate) return false;
            if (endDate && row.date > endDate) return false;
            if (thang !== 'all' && row.thang !== thang) return false;
            if (loai !== 'all' && row.LoaiDonHang !== loai) return false;
            if (khach !== 'all' && row.KhachHang !== khach) return false;
            if (sanpham !== 'all' && row.SanPham !== sanpham) return false;
            return true;
        });

        this.currentPage = 0;
        this.renderKPIs();
        this.renderCharts();
        this.renderTable();
    }

    renderKPIs() {
        const count = this.filteredData.length;
        const luong = this.filteredData.reduce((s, r) => s + r.SoLuong, 0);
        const doanhtu = this.filteredData.reduce((s, r) => s + r.ThanhTien, 0);
        const khachs = [...new Set(this.filteredData.map(d => d.KhachHang).filter(d => d))].length;

        document.getElementById('kpi-donhang').textContent = count.toLocaleString('vi-VN');
        document.getElementById('kpi-donhang-sub').textContent = `${this.rawData.length > 0 ? (count / this.rawData.length * 100).toFixed(0) : 0}% của tổng`;

        document.getElementById('kpi-luong').textContent = luong.toFixed(1);
        document.getElementById('kpi-luong-sub').textContent = `Trung bình: ${(luong / count || 0).toFixed(1)} M³`;

        document.getElementById('kpi-doanhtu').textContent = formatSmartNumber(doanhtu, 'currency');
        document.getElementById('kpi-doanhtu-sub').textContent = doanhtu > 0 ? `${(doanhtu / count || 0).toFixed(0)} / đơn` : 'Chưa có giá';

        document.getElementById('kpi-khach').textContent = khachs.toLocaleString('vi-VN');
        document.getElementById('kpi-khach-sub').textContent = `Khách hàng độc nhất`;
    }

    renderCharts() {
        const colors = ['#2D7A3E', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#66BB6A', '#43A047', '#FFA726', '#EF5350', '#AB47BC'];

        // Chart 1: Trend
        const trendData = {};
        this.filteredData.forEach(row => {
            if (!trendData[row.date]) trendData[row.date] = { luong: 0, doanhtu: 0 };
            trendData[row.date].luong += row.SoLuong;
            trendData[row.date].doanhtu += row.ThanhTien;
        });
        const sortedDates = Object.keys(trendData).sort();
        const trendLuong = sortedDates.map(d => trendData[d].luong);
        const trendDoanhTu = sortedDates.map(d => trendData[d].doanhtu);

        const ctx1 = document.getElementById('chart-trend').getContext('2d');
        if (this.charts.trend) this.charts.trend.destroy();
        this.charts.trend = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [
                    {
                        label: 'Số lượng (M³)',
                        data: trendLuong,
                        borderColor: colors[0],
                        backgroundColor: colors[0] + '15',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Doanh thu (đ)',
                        data: trendDoanhTu,
                        borderColor: colors[1],
                        backgroundColor: colors[1] + '15',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        yAxisID: 'y1',
                        hidden: trendDoanhTu.every(v => v === 0)
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y > 1000000 ? (ctx.parsed.y / 1000000).toFixed(1) + 'M' : ctx.parsed.y.toFixed(1)}` } }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Số lượng (M³)' } },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: 'Doanh thu (đ)' } }
                }
            }
        });

        // Chart 2: Top sản phẩm
        const spGroups = {};
        this.filteredData.forEach(row => {
            if (!spGroups[row.SanPham]) spGroups[row.SanPham] = 0;
            spGroups[row.SanPham] += row.SoLuong;
        });
        const topSp = Object.entries(spGroups).sort((a, b) => b[1] - a[1]).slice(0, 10);

        const ctx2 = document.getElementById('chart-sanpham').getContext('2d');
        if (this.charts.sanpham) this.charts.sanpham.destroy();
        this.charts.sanpham = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: topSp.map(x => x[0]),
                datasets: [{
                    label: 'Số lượng',
                    data: topSp.map(x => x[1]),
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

        // Chart 3: Top khách
        const khGroups = {};
        this.filteredData.forEach(row => {
            if (!khGroups[row.KhachHang]) khGroups[row.KhachHang] = 0;
            khGroups[row.KhachHang] += row.SoLuong;
        });
        const topKh = Object.entries(khGroups).sort((a, b) => b[1] - a[1]).slice(0, 10);

        const ctx3 = document.getElementById('chart-khach').getContext('2d');
        if (this.charts.khach) this.charts.khach.destroy();
        this.charts.khach = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: topKh.map(x => x[0]),
                datasets: [{
                    label: 'Số lượng',
                    data: topKh.map(x => x[1]),
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

        // Chart 4: Loại đơn
        const loaiGroups = {};
        this.filteredData.forEach(row => {
            if (!loaiGroups[row.LoaiDonHang]) loaiGroups[row.LoaiDonHang] = 0;
            loaiGroups[row.LoaiDonHang]++;
        });

        const ctx4 = document.getElementById('chart-loai').getContext('2d');
        if (this.charts.loai) this.charts.loai.destroy();
        this.charts.loai = new Chart(ctx4, {
            type: 'doughnut',
            data: {
                labels: Object.keys(loaiGroups),
                datasets: [{
                    data: Object.values(loaiGroups),
                    backgroundColor: colors.slice(0, Object.keys(loaiGroups).length).map(c => c + 'CC'),
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
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} đơn` } }
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
            html += `<td>${row.ThoiGian || '-'}</td>`;
            html += `<td>${row.MaPhieuBanHang || '-'}</td>`;
            html += `<td>${row.KhachHang || '-'}</td>`;
            html += `<td>${row.SanPham || '-'}</td>`;
            html += `<td>${row.XuatKho || '-'}</td>`;
            html += `<td>${row.SoLuong ? formatSmartNumber(row.SoLuong, 'volume') : '-'}</td>`;
            html += `<td>${row.LoaiDonHang ? `<span class="badge ${row.LoaiDonHang === 'Hợp Đồng' ? 'badge-info' : 'badge-success'}">${row.LoaiDonHang}</span>` : '-'}</td>`;
            html += `<td>${row.ThanhTien > 0 ? formatSmartNumber(row.ThanhTien, 'currency') : '-'}</td>`;
            html += '</tr>';
        });
        document.getElementById('table-body').innerHTML = html;

        const total = this.filteredData.length;
        const pages = Math.ceil(total / this.pageSize);
        let pagination = `<span>Hiển thị ${start + 1}-${end} của ${total} dòng</span>`;
        if (pages > 1) {
            pagination += ' | ';
            if (this.currentPage > 0) pagination += `<button onclick="dashboard.goPage(${this.currentPage - 1})">← Trước</button>`;
            pagination += ` Trang ${this.currentPage + 1}/${pages} `;
            if (this.currentPage < pages - 1) pagination += `<button onclick="dashboard.goPage(${this.currentPage + 1})">Sau →</button>`;
        }
        document.getElementById('pagination').innerHTML = pagination;
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
            document.getElementById('filter-start').value = range.start;
            document.getElementById('filter-end').value = range.end;
        }
        this.onFilterChange();
    }
}
