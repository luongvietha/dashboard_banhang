// ================= APP: MENU ĐIỀU HƯỚNG + KHỞI TẠO =================

function switchView(view) {
    document.getElementById('nav-banhang').classList.toggle('active', view === 'banhang');
    document.getElementById('nav-sanxuat').classList.toggle('active', view === 'sanxuat');
    document.getElementById('nav-thanhpham').classList.toggle('active', view === 'thanhpham');
    document.getElementById('view-banhang').classList.toggle('active', view === 'banhang');
    document.getElementById('view-sanxuat').classList.toggle('active', view === 'sanxuat');
    document.getElementById('view-thanhpham').classList.toggle('active', view === 'thanhpham');
    if (view === 'sanxuat' && !prodDashboard.loaded) {
        prodDashboard.fetchFromSheet();
    }
    if (view === 'thanhpham' && !finishedProductsDashboard.loaded) {
        finishedProductsDashboard.fetchFromSheet();
    }
}

applyChartDefaults();
const dashboard = new Dashboard();
const prodDashboard = new ProductionDashboard();
const finishedProductsDashboard = new FinishedProductsDashboard();
