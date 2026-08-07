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

// ---- Multi-select dạng dropdown checkbox (dùng khi cần chọn nhiều giá trị cho 1 bộ lọc) ----
// Cách dùng:
//   const ms = new MultiSelect('container-id', { allLabel: 'Tất cả trạm', onChange: () => ... });
//   ms.setOptions(['A', 'B', 'C']);   // gọi lại mỗi khi danh sách lựa chọn hợp lệ thay đổi (lọc chéo)
//   ms.getSelected();                 // [] nghĩa là "tất cả" (không lọc), ngược lại là mảng giá trị đã chọn
class MultiSelect {
    constructor(containerId, { allLabel = 'Tất cả', onChange = null } = {}) {
        this.container = document.getElementById(containerId);
        this.allLabel = allLabel;
        this.onChange = onChange;
        this.options = [];
        this.selected = new Set(); // rỗng = chọn tất cả
        this.isOpen = false;
        if (!this.container) return;
        this.container.classList.add('multiselect');
        this.container.innerHTML = `
            <button type="button" class="multiselect-btn"></button>
            <div class="multiselect-list" style="display:none;"></div>
        `;
        this.btnEl = this.container.querySelector('.multiselect-btn');
        this.listEl = this.container.querySelector('.multiselect-list');
        this.btnEl.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target)) this.close();
        });
        this.renderButton();
    }

    // Cập nhật danh sách lựa chọn hợp lệ (vd sau khi các bộ lọc khác thay đổi) — tự bỏ các giá trị
    // đã chọn trước đó nhưng nay không còn hợp lệ, để "gọn" danh sách hiển thị như tab Bán Hàng.
    setOptions(options) {
        this.options = options;
        this.selected = new Set([...this.selected].filter(v => options.includes(v)));
        this.renderButton();
        if (this.isOpen) this.renderList();
    }

    getSelected() {
        return [...this.selected];
    }

    toggle() { this.isOpen ? this.close() : this.openList(); }

    openList() {
        this.isOpen = true;
        this.renderList();
        this.listEl.style.display = 'block';
    }

    close() {
        this.isOpen = false;
        if (this.listEl) this.listEl.style.display = 'none';
    }

    renderButton() {
        if (!this.btnEl) return;
        if (this.selected.size === 0) this.btnEl.textContent = this.allLabel;
        else if (this.selected.size === 1) this.btnEl.textContent = [...this.selected][0];
        else this.btnEl.textContent = `${this.selected.size} đã chọn`;
    }

    renderList() {
        if (!this.listEl) return;
        let html = `<div class="multiselect-actions">
            <button type="button" data-act="all">Chọn tất cả</button>
            <button type="button" data-act="none">Bỏ chọn</button>
        </div>`;
        if (this.options.length === 0) {
            html += `<div class="multiselect-empty">Không có lựa chọn phù hợp</div>`;
        } else {
            html += this.options.map(opt => `
                <label class="multiselect-item">
                    <input type="checkbox" value="${opt}" ${this.selected.has(opt) ? 'checked' : ''}>
                    <span>${opt}</span>
                </label>
            `).join('');
        }
        this.listEl.innerHTML = html;

        this.listEl.querySelectorAll('input[type=checkbox]').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) this.selected.add(cb.value); else this.selected.delete(cb.value);
                this.renderButton();
                if (this.onChange) this.onChange();
            });
        });
        const btnAll = this.listEl.querySelector('[data-act="all"]');
        const btnNone = this.listEl.querySelector('[data-act="none"]');
        if (btnAll) btnAll.addEventListener('click', () => {
            this.options.forEach(o => this.selected.add(o));
            this.renderList(); this.renderButton();
            if (this.onChange) this.onChange();
        });
        if (btnNone) btnNone.addEventListener('click', () => {
            this.selected.clear();
            this.renderList(); this.renderButton();
            if (this.onChange) this.onChange();
        });
    }
}
