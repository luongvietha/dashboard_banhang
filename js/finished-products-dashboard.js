// ================= DASHBOARD THÀNH PHẨM THEO TRẠM =================
// Nguồn: 2 sheet "Đầu ra thành phẩm" theo trạm (dạng "rộng": mỗi dòng gồm
// nhiều cặp Mã SP / KL SP). Module này gộp cả 2 sheet, chuyển sang dạng
// "dài" (mỗi dòng = 1 sản phẩm) để dựng bảng "trạm nào ra sản phẩm gì"
// và biểu đồ thành phẩm theo ngày người dùng chọn.
const SHEET_URL_TRAMDA = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=1255295556';
const SHEET_URL_TRAMCAT = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=18320018';

class FinishedProductsDashboard {
    constructor() {
        this.rawData = [];        // {ngayISO, ngayRaw, tenTram, loaiTram, maSanPham, khoiLuong}
        this.stationProducts = {}; // tenTram -> { loaiTram, products: Set }
        this.charts = {};
        this.loaded = false;
    }

    async fetchFromSheet() {
        try {
            const [resDa, resCat] = await Promise.all([fetch(SHEET_URL_TRAMDA), fetch(SHEET_URL_TRAMCAT)]);
            if (!resDa.ok || !resCat.ok) throw new Error('Không thể tải dữ liệu thành phẩm từ Google Sheet');
            const [csvDa, csvCat] = await Promise.all([resDa.text(), resCat.text()]);

            // Trạm Đá: Ngày(0) ... Mã SP1(4)/KL1(5), SP2(6)/KL2(7), SP3(8)/KL3(9), SP4(10)/KL4(11), SP5(12)/KL5(13), Mã Trạm(14)
            const rowsDa = this.parseWideCSV(csvDa, [
                { code: 4, vol: 5 }, { code: 6, vol: 7 }, { code: 8, vol: 9 }, { code: 10, vol: 11 }, { code: 12, vol: 13 }
            ], 0, 14);

            // Trạm Cát: Ngày(0) ... Mã SP1(10)/KL1(11), SP2(12)/KL2(13), SP3(14)/KL3(15), Mã Trạm(16)
            const rowsCat = this.parseWideCSV(csvCat, [
                { code: 10, vol: 11 }, { code: 12, vol: 13 }, { code: 14, vol: 15 }
            ], 0, 16);

            this.rawData = [...rowsDa, ...rowsCat];
            this.buildStationProducts();
            this.renderStationProductsTable();
            this.setDefaultDate();
            this.loaded = true;
            this.applyDate();
        } catch (error) {
            console.error('Lỗi tải dữ liệu thành phẩm:', error);
            const el = document.getElementById('tp-station-products-body');
            if (el) el.innerHTML = `<tr><td colspan="3">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
        }
    }

    // Số kiểu Việt Nam dùng dấu phẩy thập phân, dấu chấm phân cách nghìn — vd "1.183,00" → 1183.00
    parseVNNumber(str) {
        if (!str) return 0;
        const cleaned = String(str).trim().replace(/\./g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    }

    // "05/01/2026" hoặc "13/1/2026" → "2026-01-05" (chuẩn ISO, có padding, để so sánh/lọc đúng)
    toISODate(str) {
        if (!str) return '';
        const parts = String(str).trim().split('/');
        if (parts.length !== 3) return '';
        const pad = n => String(n).padStart(2, '0');
        return `${parts[2]}-${pad(parts[1])}-${pad(parts[0])}`;
    }

    // Chuyển CSV dạng "rộng" (nhiều cặp Mã SP/KL SP trên 1 dòng) → mảng bản ghi "dài", mỗi bản ghi 1 sản phẩm.
    // pairs: [{code, vol}] là chỉ số cột (0-based) của cặp Mã SP / KL SP. dateCol/tramCol: chỉ số cột Ngày / Mã Trạm.
    parseWideCSV(csv, pairs, dateCol, tramCol) {
        const parsed = Papa.parse(csv.trim(), { header: false, skipEmptyLines: true });
        const rows = parsed.data.slice(2); // bỏ 2 dòng tiêu đề (dòng gộp nhóm cột + dòng tên cột)
        const out = [];
        rows.forEach(cols => {
            const ngayISO = this.toISODate(cols[dateCol]);
            const tenTram = (cols[tramCol] || '').trim();
            if (!ngayISO || !tenTram) return;
            const loaiTram = tenTram.toUpperCase().includes('CAT') ? 'Cát'
                : tenTram.toUpperCase().includes('DA') ? 'Đá' : 'Khác';
            pairs.forEach(p => {
                const maSP = (cols[p.code] || '').trim();
                if (!maSP) return;
                out.push({
                    ngayISO,
                    ngayRaw: cols[dateCol],
                    tenTram,
                    loaiTram,
                    maSanPham: maSP,
                    khoiLuong: this.parseVNNumber(cols[p.vol])
                });
            });
        });
        return out;
    }

    // Trạm nào từng có mã sản phẩm nào (kể cả ngày sản lượng = 0) → dùng để trả lời "trạm ra sản phẩm gì"
    buildStationProducts() {
        this.stationProducts = {};
        this.rawData.forEach(r => {
            if (!this.stationProducts[r.tenTram]) {
                this.stationProducts[r.tenTram] = { loaiTram: r.loaiTram, products: new Set() };
            }
            this.stationProducts[r.tenTram].products.add(r.maSanPham);
        });
    }

    renderStationProductsTable() {
        const body = document.getElementById('tp-station-products-body');
        if (!body) return;
        const stations = Object.keys(this.stationProducts).sort();
        body.innerHTML = stations.map(tram => {
            const info = this.stationProducts[tram];
            const products = [...info.products].sort().join(', ');
            return `<tr><td>${tram}</td><td>${info.loaiTram}</td><td>${products}</td></tr>`;
        }).join('');
    }

    setDefaultDate() {
        const el = document.getElementById('tp-filter-date');
        if (!el || this.rawData.length === 0) return;
        const dates = [...new Set(this.rawData.map(r => r.ngayISO))].sort();
        el.value = dates[dates.length - 1] || '';
    }

    onDateChange() {
        this.applyDate();
    }

    applyDate() {
        const date = document.getElementById('tp-filter-date').value;
        const dayData = this.rawData.filter(r => r.ngayISO === date);
        this.renderKPIs(dayData);
        this.renderCharts(dayData);
    }

    renderKPIs(dayData) {
        const tong = dayData.reduce((s, r) => s + r.khoiLuong, 0);
        const da = dayData.filter(r => r.loaiTram === 'Đá').reduce((s, r) => s + r.khoiLuong, 0);
        const cat = dayData.filter(r => r.loaiTram === 'Cát').reduce((s, r) => s + r.khoiLuong, 0);
        const trams = new Set(dayData.filter(r => r.khoiLuong > 0).map(r => r.tenTram)).size;

        document.getElementById('tp-kpi-tong').textContent = formatSmartNumber(tong, 'volume');
        document.getElementById('tp-kpi-da').textContent = formatSmartNumber(da, 'volume');
        document.getElementById('tp-kpi-cat').textContent = formatSmartNumber(cat, 'volume');
        document.getElementById('tp-kpi-tram').textContent = trams;
    }

    renderCharts(dayData) {
        const colors = ['#2D7A3E', '#4CAF50', '#81C784', '#FFA726', '#EF5350', '#42A5F5', '#AB47BC', '#26C6DA'];

        // Khối lượng theo trạm, chồng theo mã sản phẩm (trả lời: trạm nào, ngày này, ra bao nhiêu mỗi loại)
        const stations = [...new Set(dayData.map(r => r.tenTram))].sort();
        const products = [...new Set(dayData.map(r => r.maSanPham))].sort();
        const datasets = products.map((sp, i) => ({
            label: sp,
            data: stations.map(tram => {
                const rec = dayData.find(r => r.tenTram === tram && r.maSanPham === sp);
                return rec ? rec.khoiLuong : 0;
            }),
            backgroundColor: colors[i % colors.length] + 'CC',
            borderColor: colors[i % colors.length],
            borderWidth: 1
        }));

        const ctx1 = document.getElementById('tp-chart-station').getContext('2d');
        if (this.charts.station) this.charts.station.destroy();
        this.charts.station = new Chart(ctx1, {
            type: 'bar',
            data: { labels: stations, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Khối lượng (m³)' } }
                },
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } }
            }
        });

        // Tỷ trọng theo mã sản phẩm trong ngày
        const spGroups = {};
        dayData.forEach(r => {
            if (!spGroups[r.maSanPham]) spGroups[r.maSanPham] = 0;
            spGroups[r.maSanPham] += r.khoiLuong;
        });

        const ctx2 = document.getElementById('tp-chart-product').getContext('2d');
        if (this.charts.product) this.charts.product.destroy();
        this.charts.product = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: Object.keys(spGroups),
                datasets: [{
                    data: Object.values(spGroups),
                    backgroundColor: colors.map(c => c + 'CC'),
                    borderColor: '#fff',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, padding: 16 } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)} m³` } }
                }
            }
        });
    }
}
