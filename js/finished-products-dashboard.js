// ================= ĐẦU VÀO / ĐẦU RA / NĂNG LỰC SẢN XUẤT THEO TRẠM =================
// Nguồn: 2 sheet "công thức sản xuất" theo từng LÔ (mỗi dòng = 1 lượt sản xuất), khác với sheet
// chuyến xe ở khối "Dashboard Sản Xuất" phía trên. Đây là nguồn đáng tin cậy để tính khối lượng
// đầu vào/đầu ra và hiệu suất, vì trong CÙNG 1 dòng đã có cả khối lượng nguyên liệu vào và khối
// lượng từng sản phẩm ra theo đúng tỉ lệ quy đổi của trạm đó (đá ~100%, cát ~90%, 10% hao hụt).
const SHEET_URL_TRAMDA = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=1255295556';
const SHEET_URL_TRAMCAT = 'https://docs.google.com/spreadsheets/d/1FejLW-ATQVmbGp9g0jy1WSyke5J5oP15x3jgw2LWyvs/export?format=csv&gid=18320018';

class FinishedProductsDashboard {
    constructor() {
        this.lots = [];          // {ngayISO, tenTram, loaiTram, khoiLuongVao, khoiLuongRa, inputs:[{ma,kl}], outputs:[{ma,kl}]}
        this.outputRows = [];    // nổ ra theo từng sản phẩm: {ngayISO, tenTram, loaiTram, maSanPham, khoiLuong}
        this.inputRows = [];     // nổ ra theo từng nguyên liệu: {ngayISO, tenTram, loaiTram, maNguyenLieu, khoiLuong}
        this.stationProducts = {}; // tenTram -> { loaiTram, products: Set }
        this.charts = {};
        this.msTram = null;      // MultiSelect — Trạm (xem js/utils.js)
        this.msSpRa = null;      // MultiSelect — Sản phẩm đầu ra
        this.msSpVao = null;     // MultiSelect — Sản phẩm đầu vào
        this.loaded = false;
    }

    async fetchFromSheet() {
        const btn = document.getElementById('tp-refresh-btn');
        if (btn) btn.classList.add('loading');

        try {
            const [resDa, resCat] = await Promise.all([fetch(SHEET_URL_TRAMDA), fetch(SHEET_URL_TRAMCAT)]);
            if (!resDa.ok || !resCat.ok) throw new Error('Không thể tải dữ liệu thành phẩm từ Google Sheet');
            const [csvDa, csvCat] = await Promise.all([resDa.text(), resCat.text()]);

            // Trạm Đá: Ngày(0), Mã HC(1)/KL Đầu Vào(2) [1 nguyên liệu duy nhất],
            //          Mã SP1(4)/KL1(5), SP2(6)/KL2(7), SP3(8)/KL3(9), SP4(10)/KL4(11), SP5(12)/KL5(13), Mã Trạm(14)
            const lotsDa = this.parseWideCSV(csvDa, {
                dateCol: 0, tramCol: 14,
                inputPairs: [{ code: 1, vol: 2 }],
                outputPairs: [{ code: 4, vol: 5 }, { code: 6, vol: 7 }, { code: 8, vol: 9 }, { code: 10, vol: 11 }, { code: 12, vol: 13 }]
            });

            // Trạm Cát: Ngày(0), 3 nguyên liệu: SP NL1(1)/KL1(2), NL2(4)/KL2(5), NL3(7)/KL3(8),
            //           Mã SP1(10)/KL1(11), SP2(12)/KL2(13), SP3(14)/KL3(15), Mã Trạm(16)
            const lotsCat = this.parseWideCSV(csvCat, {
                dateCol: 0, tramCol: 16,
                inputPairs: [{ code: 1, vol: 2 }, { code: 4, vol: 5 }, { code: 7, vol: 8 }],
                outputPairs: [{ code: 10, vol: 11 }, { code: 12, vol: 13 }, { code: 14, vol: 15 }]
            });

            this.lots = [...lotsDa, ...lotsCat];
            this.explodeRows();
            this.buildStationProducts();
            this.renderStationProductsTable();
            this.setDefaultDates();
            this.initFilters();
            this.loaded = true;
            this.applyFilters();
            const timeEl = document.getElementById('tp-update-time');
            if (timeEl) timeEl.textContent = new Date().toLocaleString('vi-VN');
        } catch (error) {
            console.error('Lỗi tải dữ liệu thành phẩm:', error);
            const el = document.getElementById('tp-station-products-body');
            if (el) el.innerHTML = `<tr><td colspan="3">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
        } finally {
            if (btn) btn.classList.remove('loading');
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

    // Chuyển CSV dạng "rộng" (nhiều cặp cột Mã/KL trên 1 dòng = 1 lô sản xuất) → mảng "lô".
    // cfg: {dateCol, tramCol, inputPairs:[{code,vol}], outputPairs:[{code,vol}]} — chỉ số cột 0-based.
    parseWideCSV(csv, cfg) {
        const parsed = Papa.parse(csv.trim(), { header: false, skipEmptyLines: true });
        const rows = parsed.data.slice(2); // bỏ 2 dòng tiêu đề (dòng gộp nhóm cột + dòng tên cột)
        const lots = [];
        rows.forEach(cols => {
            const ngayISO = this.toISODate(cols[cfg.dateCol]);
            const tenTram = (cols[cfg.tramCol] || '').trim();
            if (!ngayISO || !tenTram) return;
            const loaiTram = tenTram.toUpperCase().includes('CAT') ? 'Cát'
                : tenTram.toUpperCase().includes('DA') ? 'Đá' : 'Khác';

            const inputs = [];
            cfg.inputPairs.forEach(p => {
                const ma = (cols[p.code] || '').trim();
                if (!ma) return;
                inputs.push({ ma, kl: this.parseVNNumber(cols[p.vol]) });
            });
            const outputs = [];
            cfg.outputPairs.forEach(p => {
                const ma = (cols[p.code] || '').trim();
                if (!ma) return;
                outputs.push({ ma, kl: this.parseVNNumber(cols[p.vol]) });
            });

            lots.push({
                ngayISO, tenTram, loaiTram,
                khoiLuongVao: inputs.reduce((s, x) => s + x.kl, 0),
                khoiLuongRa: outputs.reduce((s, x) => s + x.kl, 0),
                inputs, outputs
            });
        });
        return lots;
    }

    explodeRows() {
        this.outputRows = [];
        this.inputRows = [];
        this.lots.forEach(lot => {
            lot.outputs.forEach(o => this.outputRows.push({
                ngayISO: lot.ngayISO, tenTram: lot.tenTram, loaiTram: lot.loaiTram, maSanPham: o.ma, khoiLuong: o.kl
            }));
            lot.inputs.forEach(i => this.inputRows.push({
                ngayISO: lot.ngayISO, tenTram: lot.tenTram, loaiTram: lot.loaiTram, maNguyenLieu: i.ma, khoiLuong: i.kl
            }));
        });
    }

    // Trạm nào từng có mã sản phẩm nào (kể cả ngày sản lượng = 0) → dùng để trả lời "trạm ra sản phẩm gì"
    buildStationProducts() {
        this.stationProducts = {};
        this.outputRows.forEach(r => {
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

    setDefaultDates() {
        const startEl = document.getElementById('tp-filter-start');
        const endEl = document.getElementById('tp-filter-end');
        if (!startEl || !endEl || this.lots.length === 0) return;
        const dates = [...new Set(this.lots.map(l => l.ngayISO))].sort();
        startEl.value = dates[0] || '';
        endEl.value = dates[dates.length - 1] || '';
    }

    // Khởi tạo 3 ô multi-select (chỉ 1 lần khi có dữ liệu) rồi dựng danh sách lựa chọn ban đầu
    initFilters() {
        if (!this.msTram) {
            this.msTram = new MultiSelect('tp-filter-tram', { allLabel: 'Tất cả trạm', onChange: () => this.onFilterChange() });
        }
        if (!this.msSpRa) {
            this.msSpRa = new MultiSelect('tp-filter-spra', { allLabel: 'Tất cả', onChange: () => this.onFilterChange() });
        }
        if (!this.msSpVao) {
            this.msSpVao = new MultiSelect('tp-filter-spvao', { allLabel: 'Tất cả', onChange: () => this.onFilterChange() });
        }
        this.updateFacetOptions();
    }

    getDateRange() {
        return {
            start: document.getElementById('tp-filter-start').value,
            end: document.getElementById('tp-filter-end').value
        };
    }

    inRange(ngayISO, f) {
        if (f.start && ngayISO < f.start) return false;
        if (f.end && ngayISO > f.end) return false;
        return true;
    }

    matchSel(ms, val) {
        const sel = ms ? ms.getSelected() : [];
        return sel.length === 0 || sel.includes(val);
    }

    // Lọc chéo (faceted): mỗi ô multi-select chỉ hiện các giá trị còn khớp với 2 bộ lọc kia + khoảng
    // ngày đang chọn — giống cơ chế bên tab Bán Hàng, giúp danh sách luôn gọn thay vì liệt kê hết.
    updateFacetOptions() {
        const f = this.getDateRange();

        // Trạm: trạm nào còn xuất hiện trong output (theo SP Đầu Ra đang chọn) hoặc input (theo SP Đầu Vào đang chọn)
        const tramFromOut = this.outputRows.filter(r => this.inRange(r.ngayISO, f) && this.matchSel(this.msSpRa, r.maSanPham)).map(r => r.tenTram);
        const tramFromIn = this.inputRows.filter(r => this.inRange(r.ngayISO, f) && this.matchSel(this.msSpVao, r.maNguyenLieu)).map(r => r.tenTram);
        this.msTram.setOptions([...new Set([...tramFromOut, ...tramFromIn])].sort());

        // SP Đầu Ra: mã sản phẩm còn xuất hiện ở trạm đang chọn, trong khoảng ngày đang chọn
        const spRaOptions = this.outputRows
            .filter(r => this.inRange(r.ngayISO, f) && this.matchSel(this.msTram, r.tenTram))
            .map(r => r.maSanPham);
        this.msSpRa.setOptions([...new Set(spRaOptions)].sort());

        // SP Đầu Vào: mã nguyên liệu còn xuất hiện ở trạm đang chọn, trong khoảng ngày đang chọn
        const spVaoOptions = this.inputRows
            .filter(r => this.inRange(r.ngayISO, f) && this.matchSel(this.msTram, r.tenTram))
            .map(r => r.maNguyenLieu);
        this.msSpVao.setOptions([...new Set(spVaoOptions)].sort());
    }

    onFilterChange() {
        this.updateFacetOptions();
        this.applyFilters();
    }

    // Bộ lọc nhanh: 'yesterday' | '7days' | 'thisMonth' | 'lastMonth' | 'reset'
    // Dùng "Hôm qua" thay vì "Hôm nay" vì dữ liệu thành phẩm thường cập nhật muộn hơn 1 ngày.
    applyQuickRange(preset) {
        if (preset === 'reset') {
            this.setDefaultDates();
        } else {
            const range = getQuickRange(preset);
            document.getElementById('tp-filter-start').value = range.start;
            document.getElementById('tp-filter-end').value = range.end;
        }
        this.onFilterChange();
    }

    applyFilters() {
        const f = this.getDateRange();

        // Lô trong khoảng ngày + trạm đã chọn (dùng cho KPI số lượt, và cho bảng năng lực — LUÔN tính
        // trên toàn bộ lô, không phụ thuộc bộ lọc SP Đầu ra/Đầu vào, để hiệu suất phản ánh đúng tỉ lệ quy đổi thật).
        this.filteredLots = this.lots.filter(l => this.inRange(l.ngayISO, f) && this.matchSel(this.msTram, l.tenTram));

        // Output/Input đã áp thêm bộ lọc sản phẩm tương ứng — dùng cho KPI vào/ra, chart biến thiên, chart tỷ trọng
        this.filteredOutputRows = this.outputRows.filter(r => this.inRange(r.ngayISO, f) && this.matchSel(this.msTram, r.tenTram) && this.matchSel(this.msSpRa, r.maSanPham));
        this.filteredInputRows = this.inputRows.filter(r => this.inRange(r.ngayISO, f) && this.matchSel(this.msTram, r.tenTram) && this.matchSel(this.msSpVao, r.maNguyenLieu));

        this.renderKPIs();
        this.renderLoaiTramSummary();
        this.renderTrendCharts();
        this.renderDistributionCharts();
        this.renderCapacityTable();
    }

    // Tổng hợp Đầu Vào/Đầu Ra/Hiệu Suất bình quân tách riêng theo LOẠI TRẠM (Đá / Cát) — cùng
    // nguồn (filteredLots, chỉ lọc theo ngày + trạm) và cùng công thức hiệu suất (tổng ra ÷ tổng vào)
    // với bảng "Báo Cáo Hiệu Suất Vận Hành Theo Trạm", chỉ khác là gộp theo nhóm thay vì từng trạm.
    // Năng Suất TB = tổng đầu ra của nhóm ÷ số NGÀY THỰC SỰ có đầu ra > 0 trong nhóm đó (không chia
    // cho tổng số ngày lịch) — cho biết tốc độ sản xuất bình quân mỗi ngày hoạt động của cả nhóm.
    renderLoaiTramSummary() {
        const body = document.getElementById('tp-loaitram-body');
        if (!body) return;

        const groups = {};
        this.filteredLots.forEach(l => {
            if (!groups[l.loaiTram]) groups[l.loaiTram] = { vao: 0, ra: 0, trams: new Set(), luot: 0, days: new Set() };
            const g = groups[l.loaiTram];
            g.vao += l.khoiLuongVao;
            g.ra += l.khoiLuongRa;
            g.luot++;
            if (l.tenTram) g.trams.add(l.tenTram);
            if (l.ngayISO && l.khoiLuongRa > 0) g.days.add(l.ngayISO);
        });

        const order = ['Đá', 'Cát', 'Khác'];
        const rows = order.filter(k => groups[k]).map(loai => {
            const g = groups[loai];
            const hieuSuat = g.vao > 0 ? (g.ra / g.vao * 100) : null;
            const nangSuat = g.days.size > 0 ? (g.ra / g.days.size) : 0;
            return `<tr>
                <td>${loai}</td>
                <td>${g.trams.size}</td>
                <td>${formatSmartNumber(g.vao, 'volume')}</td>
                <td>${formatSmartNumber(g.ra, 'volume')}</td>
                <td>${hieuSuat === null ? '--' : hieuSuat.toFixed(1) + '%'}</td>
                <td>${formatSmartNumber(nangSuat, 'volume')}</td>
                <td>${g.luot.toLocaleString('vi-VN')}</td>
            </tr>`;
        });

        body.innerHTML = rows.join('') || '<tr><td colspan="7">Không có dữ liệu trong khoảng lọc hiện tại</td></tr>';
    }

    renderKPIs() {
        const tongVao = this.filteredInputRows.reduce((s, r) => s + r.khoiLuong, 0);
        const tongRa = this.filteredOutputRows.reduce((s, r) => s + r.khoiLuong, 0);
        const trams = new Set(this.filteredLots.map(l => l.tenTram)).size;

        // Sản lượng TB/ngày = tổng đầu ra ÷ số ngày THỰC SỰ có sản lượng ra trong khoảng đã lọc
        // (không chia cho tổng số ngày lịch, vì trạm không hoạt động liên tục mọi ngày).
        const ngayCoSanLuong = new Set(this.filteredOutputRows.filter(r => r.khoiLuong > 0).map(r => r.ngayISO));
        const tbSanLuongNgay = ngayCoSanLuong.size > 0 ? tongRa / ngayCoSanLuong.size : 0;

        document.getElementById('tp-kpi-vao').textContent = formatSmartNumber(tongVao, 'volume');
        document.getElementById('tp-kpi-ra').textContent = formatSmartNumber(tongRa, 'volume');
        document.getElementById('tp-kpi-tbngay').textContent = formatSmartNumber(tbSanLuongNgay, 'volume');
        document.getElementById('tp-kpi-tbngay-sub').textContent = `Trên ${ngayCoSanLuong.size} ngày có sản xuất`;
        document.getElementById('tp-kpi-tram').textContent = trams;
        document.getElementById('tp-kpi-luot').textContent = this.filteredLots.length.toLocaleString('vi-VN');
    }

    // Gán màu cố định theo thứ tự alphabet của danh sách khoá (trạm hoặc mã sản phẩm) để màu ổn định giữa các lần vẽ lại
    colorFor(index) {
        const palette = ['#2D7A3E', '#42A5F5', '#FFA726', '#AB47BC', '#EF5350', '#26C6DA', '#8D6E63', '#78909C', '#EC407A', '#7CB342'];
        return palette[index % palette.length];
    }

    renderTrendCharts() {
        // ---- Biến thiên sản lượng đầu ra theo TRẠM ----
        const trams = [...new Set(this.filteredOutputRows.map(r => r.tenTram))].sort();
        const datesTram = [...new Set(this.filteredOutputRows.map(r => r.ngayISO))].sort();
        const dsTram = trams.map((tram, i) => {
            const byDate = {};
            this.filteredOutputRows.filter(r => r.tenTram === tram).forEach(r => { byDate[r.ngayISO] = (byDate[r.ngayISO] || 0) + r.khoiLuong; });
            const c = this.colorFor(i);
            return {
                label: tram,
                data: datesTram.map(d => byDate[d] || 0),
                borderColor: c, backgroundColor: c + '15',
                borderWidth: 2, tension: 0.3, pointRadius: 2, fill: false
            };
        });

        const ctxTram = document.getElementById('tp-chart-trend-tram').getContext('2d');
        if (this.charts.trendTram) this.charts.trendTram.destroy();
        this.charts.trendTram = new Chart(ctxTram, {
            type: 'line',
            data: { labels: datesTram, datasets: dsTram },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Khối lượng (m³)' } } }
            }
        });

        // ---- Biến thiên theo SẢN PHẨM đầu ra ----
        const products = [...new Set(this.filteredOutputRows.map(r => r.maSanPham))].sort();
        const datesSp = datesTram; // cùng tập dữ liệu đã lọc
        const dsSp = products.map((sp, i) => {
            const byDate = {};
            this.filteredOutputRows.filter(r => r.maSanPham === sp).forEach(r => { byDate[r.ngayISO] = (byDate[r.ngayISO] || 0) + r.khoiLuong; });
            const c = this.colorFor(i);
            return {
                label: sp,
                data: datesSp.map(d => byDate[d] || 0),
                borderColor: c, backgroundColor: c + '15',
                borderWidth: 2, tension: 0.3, pointRadius: 2, fill: false
            };
        });

        const ctxSp = document.getElementById('tp-chart-trend-sp').getContext('2d');
        if (this.charts.trendSp) this.charts.trendSp.destroy();
        this.charts.trendSp = new Chart(ctxSp, {
            type: 'line',
            data: { labels: datesSp, datasets: dsSp },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Khối lượng (m³)' } } }
            }
        });
    }

    renderDistributionCharts() {
        // ---- Tỷ trọng theo sản phẩm đầu ra (toàn khoảng lọc) ----
        const spGroups = {};
        this.filteredOutputRows.forEach(r => { spGroups[r.maSanPham] = (spGroups[r.maSanPham] || 0) + r.khoiLuong; });
        const spLabels = Object.keys(spGroups).sort();

        const ctxSp = document.getElementById('tp-chart-product').getContext('2d');
        if (this.charts.product) this.charts.product.destroy();
        this.charts.product = new Chart(ctxSp, {
            type: 'doughnut',
            data: {
                labels: spLabels,
                datasets: [{
                    data: spLabels.map(l => spGroups[l]),
                    backgroundColor: spLabels.map((_, i) => this.colorFor(i) + 'CC'),
                    borderColor: '#fff', borderWidth: 3
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '65%',
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, padding: 16 } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)} m³` } }
                }
            }
        });

        // ---- Tỷ trọng theo nguyên liệu đầu vào (toàn khoảng lọc) ----
        const nlGroups = {};
        this.filteredInputRows.forEach(r => { nlGroups[r.maNguyenLieu] = (nlGroups[r.maNguyenLieu] || 0) + r.khoiLuong; });
        const nlLabels = Object.keys(nlGroups).sort();

        const ctxNl = document.getElementById('tp-chart-input').getContext('2d');
        if (this.charts.input) this.charts.input.destroy();
        this.charts.input = new Chart(ctxNl, {
            type: 'doughnut',
            data: {
                labels: nlLabels,
                datasets: [{
                    data: nlLabels.map(l => nlGroups[l]),
                    backgroundColor: nlLabels.map((_, i) => this.colorFor(i) + 'CC'),
                    borderColor: '#fff', borderWidth: 3
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '65%',
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, padding: 16 } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)} m³` } }
                }
            }
        });
    }

    // Năng lực sản xuất theo trạm — LUÔN tính trên toàn bộ lô (this.filteredLots), không phụ thuộc
    // bộ lọc SP Đầu ra/Đầu vào, để hiệu suất phản ánh đúng tỉ lệ quy đổi thật của từng trạm
    // (đá ~100%, cát ~90%/10% hao hụt) thay vì bị méo do chỉ chọn 1 sản phẩm con.
    renderCapacityTable() {
        const body = document.getElementById('tp-capacity-body');
        if (!body) return;

        const trams = [...new Set(this.filteredLots.map(l => l.tenTram))];
        const rows = trams.map(tram => {
            const lotsOfTram = this.filteredLots.filter(l => l.tenTram === tram);
            const loaiTram = lotsOfTram[0] ? lotsOfTram[0].loaiTram : '';
            const tongVao = lotsOfTram.reduce((s, l) => s + l.khoiLuongVao, 0);
            const tongRa = lotsOfTram.reduce((s, l) => s + l.khoiLuongRa, 0);
            const hieuSuat = tongVao > 0 ? (tongRa / tongVao * 100) : null;

            const ngayHoatDong = new Set(lotsOfTram.filter(l => l.khoiLuongVao > 0 || l.khoiLuongRa > 0).map(l => l.ngayISO));
            const soNgayHD = ngayHoatDong.size;
            const tbRaMoiNgay = soNgayHD > 0 ? tongRa / soNgayHD : 0;

            const raTheoNgay = {};
            lotsOfTram.forEach(l => { raTheoNgay[l.ngayISO] = (raTheoNgay[l.ngayISO] || 0) + l.khoiLuongRa; });
            const dinhRa = Object.values(raTheoNgay).reduce((max, v) => Math.max(max, v), 0);

            return { tram, loaiTram, tongVao, tongRa, hieuSuat, soNgayHD, tbRaMoiNgay, dinhRa };
        }).sort((a, b) => b.tongRa - a.tongRa);

        body.innerHTML = rows.map(r => `
            <tr>
                <td>${r.tram}</td>
                <td>${r.loaiTram}</td>
                <td>${r.soNgayHD}</td>
                <td>${formatSmartNumber(r.tongVao, 'volume')}</td>
                <td>${formatSmartNumber(r.tongRa, 'volume')}</td>
                <td>${r.hieuSuat === null ? '--' : r.hieuSuat.toFixed(1) + '%'}</td>
                <td>${formatSmartNumber(r.tbRaMoiNgay, 'volume')}</td>
                <td>${formatSmartNumber(r.dinhRa, 'volume')}</td>
            </tr>
        `).join('') || '<tr><td colspan="8">Không có dữ liệu trong khoảng lọc hiện tại</td></tr>';
    }
}
