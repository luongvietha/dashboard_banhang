// ================= APP: MENU ĐIỀU HƯỚNG + KHỞI TẠO =================

function switchView(view) {
    document.getElementById('nav-banhang').classList.toggle('active', view === 'banhang');
    document.getElementById('nav-sanxuat').classList.toggle('active', view === 'sanxuat');
    document.getElementById('view-banhang').classList.toggle('active', view === 'banhang');
    document.getElementById('view-sanxuat').classList.toggle('active', view === 'sanxuat');
    if (view === 'sanxuat' && !prodDashboard.loaded) {
        prodDashboard.fetchFromSheet();
    }
    if (view === 'sanxuat' && !finishedProductsDashboard.loaded) {
        finishedProductsDashboard.fetchFromSheet();
    }
}

applyChartDefaults();
const dashboard = new Dashboard();
const prodDashboard = new ProductionDashboard();
const finishedProductsDashboard = new FinishedProductsDashboard();
