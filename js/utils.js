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
