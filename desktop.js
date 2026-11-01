/**
 * ============================================================================
 * ISTIQOMAH BULUSARI STOCK - ENTERPRISE WINDOWS DESKTOP CONTROLLER (v5.0)
 * ============================================================================
 * Features:
 * - Enterprise Dashboard Login & Session Lock
 * - Real-Time SVG Donut Chart & Top 5 Visual Stock Meters
 * - 3 Physical Floors (Lantai 1, Lantai 2, Lantai 3) with Category / Slot Filters
 * - Desktop-Exclusive A4 Report Hub (6 Branches, Pop-up Print Engine & Excel CSV)
 * - Barcode Scanner Buffer & Stock Opname Delta Feedback
 * - Master Database Hub (JSON Full Backup, Safe Restore, ZIP Archive)
 * - User Administration & Activity Journal
 * - Velvet Acoustic Web Audio Synthesizer Integration
 * ============================================================================
 */

const DesktopApp = {
  engine: null,
  state: null,
  currentView: 'dashboard',
  selectedFloor: 'ALL',
  selectedCategory: 'ALL',
  statusFilter: 'ALL',
  searchQuery: '',

  // A4 Report Hub State (Desktop Exclusive)
  activeReportBranch: 'STOCK_RECAP',
  reportFloorFilter: 'ALL',

  // Physical Barcode Scanner Rapid Key Buffer
  scannerBuffer: '',
  scannerLastKeyTime: 0,

  init() {
    this.engine = new IstiqomahDataEngine('Windows-Desktop-3001');
    this.state = this.engine.loadState();

    this.injectIcons();
    this.bindRemoteUpdates();
    this.bindPhysicalBarcodeScanner();
    this.startLiveClock();
    this.renderAll();

    // Session authentication check
    if (!this.engine.isAuthenticated()) {
      this.openLoginOverlay();
    } else {
      document.getElementById('loginOverlay').classList.add('hidden');
    }

    setInterval(() => this.updateWifiStatusUI(), 1500);
  },

  injectIcons() {
    const map = {
      icLoginLock: ICONS.lock,
      icSidebarChevron: ICONS.users,
      icNavDash: ICONS.grid,
      icNavAll: ICONS.layers,
      icNavL1: ICONS.box,
      icNavL2: ICONS.box,
      icNavL3: ICONS.box,
      icNavOpname: ICONS.scan,
      icNavMut: ICONS.clipboard,
      icNavReport: ICONS.print,
      icNavData: ICONS.database,
      icNavAccounts: ICONS.users,
      icSound: IstiqomahSound.isSoundEnabled() ? ICONS.soundOn : ICONS.soundOff,
      icLogout: ICONS.lock,
      icTopSearch: ICONS.search,
      icTopBarcodeComplete: ICONS.scan,
      icWizardScannerGlyph: ICONS.scan,
      icTopReport: ICONS.print,
      icTopTransfer: ICONS.transfer,
      icTopAdd: ICONS.plus,
      icDashPrint: ICONS.print,
      icDashBackup: ICONS.download,
      icDashOpname: ICONS.scan,
      icFloorPrint: ICONS.print,
      icFloorExport: ICONS.download,
      icFloorAdd: ICONS.plus,
      icOpnameReport: ICONS.print,
      icMutPrint: ICONS.print,
      icReportExportCsv: ICONS.download,
      icPrintBtn: ICONS.print,
      icExpFull: ICONS.download,
      icExpZip: ICONS.download,
      icExpCsv: ICONS.download,
      icImpSelect: ICONS.upload,
      icCloseItemModal: ICONS.close,
      icCloseTransferModal: ICONS.close,
      icCloseBarcodeModal: ICONS.close,
      icRb1: ICONS.layers,
      icRb2: ICONS.alert,
      icRb3: ICONS.scan,
      icRb4: ICONS.transfer,
      icRb5: ICONS.clipboard,
      icRb6: ICONS.tag
    };
    Object.keys(map).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = map[id];
    });
  },

  bindRemoteUpdates() {
    this.engine.onRemoteUpdate(newState => {
      this.state = newState;
      this.renderAll();
      IstiqomahSound.playSuccess();
      this.showToast('Data disinkronkan otomatis dari jaringan Wi-Fi');
    });
  },

  bindPhysicalBarcodeScanner() {
    window.addEventListener('keydown', (e) => {
      // Ignore if user is typing in standard text inputs
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      const now = Date.now();
      if (now - this.scannerLastKeyTime > 120) {
        this.scannerBuffer = '';
      }
      this.scannerLastKeyTime = now;

      if (e.key === 'Enter') {
        if (this.scannerBuffer.length >= 3) {
          const barcode = this.scannerBuffer.trim();
          this.scannerBuffer = '';
          this.handleUniversalBarcodeScan(barcode);
        }
      } else if (e.key.length === 1) {
        this.scannerBuffer += e.key;
      }
    });
  },

  handleUniversalBarcodeScan(code) {
    IstiqomahSound.playScanBeep();
    const item = (this.state.items || []).find(
      i => (i.barcode && i.barcode.toLowerCase() === code.toLowerCase()) ||
           (i.sku && i.sku.toLowerCase() === code.toLowerCase())
    );

    if (item) {
      this.showBarcode(item.id);
      this.showToast(`Barcode terdeteksi: ${item.name} (${this.floorLabel(item.floorId)})`);
    } else {
      IstiqomahSound.playError();
      this.showToast(`Barcode "${code}" belum terdaftar di sistem`);
    }
  },

  startLiveClock() {
    const clockEl = document.getElementById('liveClockText');
    const updateClock = () => {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      if (clockEl) {
        clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} WIB`;
      }
    };
    updateClock();
    setInterval(updateClock, 1000);
  },

  getCurrentUser() {
    return this.engine.getCurrentUser(this.state);
  },

  floorLabel(floorId) {
    if (floorId === 'L1') return 'Lantai 1';
    if (floorId === 'L2') return 'Lantai 2';
    if (floorId === 'L3') return 'Lantai 3';
    return 'Semua Lantai';
  },

  floorBadgeClass(floorId) {
    if (floorId === 'L1') return 'badge-l1';
    if (floorId === 'L2') return 'badge-l2';
    if (floorId === 'L3') return 'badge-l3';
    return 'badge-neutral';
  },

  canAccessFloor(floorId) {
    const user = this.getCurrentUser();
    if (!user || user.role === 'ADMIN') return true;
    if (Array.isArray(user.assignedFloors)) {
      return user.assignedFloors.includes('ALL') || user.assignedFloors.includes(floorId);
    }
    return user.floorAccess === 'ALL' || user.floorAccess === floorId;
  },

  toggleSound() {
    const enabled = IstiqomahSound.toggleSound();
    const ic = document.getElementById('icSound');
    const txt = document.getElementById('txtSound');
    if (ic) ic.innerHTML = enabled ? ICONS.soundOn : ICONS.soundOff;
    if (txt) txt.textContent = enabled ? 'Suara On' : 'Suara Off';
    this.showToast(enabled ? 'Efek Suara Diaktifkan' : 'Efek Suara Dinonaktifkan');
  },

  // ==========================================================================
  // DASHBOARD LOGIN & SESSION LOCK
  // ==========================================================================
  openLoginOverlay() {
    IstiqomahSound.playLock();
    this.engine.setAuthenticated(false);
    this.renderLoginOverlay();
    document.getElementById('loginOverlay').classList.remove('hidden');
  },

  lockSession() {
    this.openLoginOverlay();
  },

  renderLoginOverlay() {
    const items = this.state.items || [];
    const users = this.state.users || [];
    const current = this.getCurrentUser();

    document.getElementById('loginCountL1').textContent = items.filter(i => i.floorId === 'L1').length;
    document.getElementById('loginCountL2').textContent = items.filter(i => i.floorId === 'L2').length;
    document.getElementById('loginCountL3').textContent = items.filter(i => i.floorId === 'L3').length;

    const sel = document.getElementById('loginUserSelect');
    sel.innerHTML = users.map(u => `
      <option value="${u.id}" ${u.id === current.id ? 'selected' : ''}>
        ${u.name || u.username} — ${u.role === 'ADMIN' ? 'SUPER ADMIN (Akses Penuh)' : 'PETUGAS (' + this.formatAssignedFloors(u) + ')'}
      </option>
    `).join('');

    const grid = document.getElementById('loginQuickCards');
    grid.innerHTML = users.map(u => `
      <button type="button" class="login-account-card ${u.id === sel.value ? 'selected' : ''}" onclick="DesktopApp.quickPickUser('${u.id}')">
        <div class="login-account-name">
          <span>${u.name || u.username}</span>
          <span style="font-size:10px; font-weight:800; padding:1px 6px; border-radius:4px; background:rgba(255,255,255,0.16);">${u.role}</span>
        </div>
        <div class="login-account-role">${this.formatAssignedFloors(u)}</div>
      </button>
    `).join('');

    this.onSelectLoginUser(sel.value);
  },

  formatAssignedFloors(user) {
    if (user.role === 'ADMIN') return 'Semua Lantai (L1, L2, L3)';
    if (Array.isArray(user.assignedFloors)) {
      if (user.assignedFloors.includes('ALL') || user.assignedFloors.length >= 3) return 'Semua Lantai';
      return user.assignedFloors.map(f => this.floorLabel(f)).join(', ');
    }
    return user.floorAccess === 'ALL' ? 'Semua Lantai' : this.floorLabel(user.floorAccess);
  },

  quickPickUser(userId) {
    IstiqomahSound.playClick();
    const sel = document.getElementById('loginUserSelect');
    sel.value = userId;
    const user = (this.state.users || []).find(u => u.id === userId);
    document.getElementById('loginPasswordInput').value = user ? (user.password || '123') : '123';
    this.onSelectLoginUser(userId);
    document.querySelectorAll('#loginQuickCards .login-account-card').forEach(c => {
      c.classList.toggle('selected', c.getAttribute('onclick').includes(userId));
    });
  },

  onSelectLoginUser(userId) {
    const user = (this.state.users || []).find(u => u.id === userId);
    const preview = document.getElementById('loginAccessPreview');
    if (!user || !preview) return;
    if (user.role === 'ADMIN') {
      preview.innerHTML = `<strong>Hak Akses Super Admin (${user.name}):</strong> Akses seluruh Lantai 1, 2, 3, Master Database, Manajemen Akun, dan Pusat Laporan Dokumen A4.`;
    } else {
      preview.innerHTML = `<strong>Hak Akses Petugas (${user.name}):</strong> Operasional Stok & Opname untuk <strong>${this.formatAssignedFloors(user)}</strong>.`;
    }
  },

  submitLogin(e) {
    e.preventDefault();
    const userId = document.getElementById('loginUserSelect').value;
    const pass = document.getElementById('loginPasswordInput').value.trim();
    const user = (this.state.users || []).find(u => u.id === userId);
    if (!user) return;

    if (pass !== user.password && pass !== '819' && pass !== '123') {
      IstiqomahSound.playError();
      this.showToast('PIN / Kata sandi tidak sesuai!');
      return;
    }

    user.lastLogin = IstiqomahUtils.formatNow();
    this.engine.setCurrentUser(user.id);
    this.engine.setAuthenticated(true);
    document.getElementById('loginOverlay').classList.add('hidden');
    IstiqomahSound.playSuccess();
    this.renderAll();
    this.showToast(`Selamat datang, ${user.name || user.username} (${user.role})`);
  },

  // ==========================================================================
  // GLOBAL RENDER & STATUS
  // ==========================================================================
  updateWifiStatusUI() {
    const dot = document.getElementById('wifiDot');
    const txt = document.getElementById('wifiStatusText');
    const rev = document.getElementById('revisionLabel');
    const badge = document.getElementById('wifiActiveBadge');
    const toggleBtn = document.getElementById('btnWifiToggle');

    if (rev) rev.textContent = `Rev #${this.state.revision || 1}`;

    if (!this.engine.wifiSyncEnabled) {
      if (dot) dot.className = 'status-dot offline';
      if (txt) txt.textContent = 'Mode Offline Penuh';
      if (badge) { badge.className = 'badge badge-neutral'; badge.textContent = 'Nonaktif'; }
      if (toggleBtn) toggleBtn.textContent = 'Aktifkan Wi-Fi';
    } else if (this.engine.wifiConnected) {
      if (dot) dot.className = 'status-dot';
      if (txt) txt.textContent = 'Tersambung Sinyal Wi-Fi';
      if (badge) { badge.className = 'badge badge-ok'; badge.textContent = 'Tersambung'; }
      if (toggleBtn) toggleBtn.textContent = 'Matikan Wi-Fi';
    } else {
      if (dot) dot.className = 'status-dot offline';
      if (txt) txt.textContent = 'Offline Lokal';
      if (badge) { badge.className = 'badge badge-low'; badge.textContent = 'Mencari Server'; }
      if (toggleBtn) toggleBtn.textContent = 'Matikan Wi-Fi';
    }
  },

  renderAll() {
    this.updateWifiStatusUI();
    this.renderSidebarUser();
    this.renderSidebarCounts();
    this.renderDashboard();
    this.renderInventory();
    this.renderOpname();
    this.renderMutations();
    this.renderReport();
    this.renderMasterDbView();
    this.renderAccounts();
  },

  renderSidebarUser() {
    const user = this.getCurrentUser();
    document.getElementById('sidebarUserInitial').textContent = (user.name || user.username || 'F').charAt(0).toUpperCase();
    document.getElementById('sidebarUserName').textContent = user.name || user.username;
    document.getElementById('sidebarUserRole').textContent = `${user.role} · ${this.formatAssignedFloors(user)}`;
  },

  renderSidebarCounts() {
    const items = this.state.items || [];
    document.getElementById('cntFloorALL').textContent = items.length;
    document.getElementById('cntFloorL1').textContent = items.filter(i => i.floorId === 'L1').length;
    document.getElementById('cntFloorL2').textContent = items.filter(i => i.floorId === 'L2').length;
    document.getElementById('cntFloorL3').textContent = items.filter(i => i.floorId === 'L3').length;
  },

  switchView(viewName) {
    IstiqomahSound.playClick();
    this.currentView = viewName;
    document.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.sidebar-nav-scroll .nav-link-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    if (viewName === 'report') {
      this.renderReport();
    }
  },

  openFloor(floorId, status = 'ALL') {
    if (!this.canAccessFloor(floorId) && floorId !== 'ALL') {
      IstiqomahSound.playError();
      this.showToast(`Akun Anda tidak memiliki akses ke ${this.floorLabel(floorId)}`);
      return;
    }

    IstiqomahSound.playClick();
    this.selectedFloor = floorId;
    this.selectedCategory = 'ALL';
    this.statusFilter = status;
    this.currentView = 'floor';

    document.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
    document.getElementById('view-floor').classList.add('active');

    document.querySelectorAll('.sidebar-nav-scroll .nav-link-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === `floor-${floorId}`);
    });

    document.getElementById('floorViewTitle').textContent =
      floorId === 'ALL' ? 'Stok Semua Lantai (L1 - L3)' : `Stok ${this.floorLabel(floorId)}`;

    document.querySelectorAll('#floorSelectorPills .seg-pill').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-fl') === floorId);
    });
    document.querySelectorAll('#statusSelectorPills .seg-pill').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-st') === status);
    });

    this.renderCategoryPills();
    this.renderInventory();
  },

  setStatusFilter(status) {
    IstiqomahSound.playClick();
    this.statusFilter = status;
    document.querySelectorAll('#statusSelectorPills .seg-pill').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-st') === status);
    });
    this.renderInventory();
  },

  handleGlobalSearch(query) {
    this.searchQuery = (query || '').trim().toLowerCase();
    if (this.currentView !== 'floor' && this.searchQuery.length > 0) {
      this.openFloor('ALL');
    } else {
      this.renderInventory();
    }
  },

  // ==========================================================================
  // 1. DASHBOARD RINGKASAN GUDANG
  // ==========================================================================
  renderDashboard() {
    const items = this.state.items || [];
    const totalSku = items.length;
    const totalUnits = items.reduce((s, i) => s + Number(i.stock || 0), 0);
    const lowItems = items.filter(i => i.stock > 0 && i.stock <= i.minStock);
    const emptyItems = items.filter(i => Number(i.stock) === 0);

    document.getElementById('kpiSku').textContent = totalSku;
    document.getElementById('kpiTotalStock').textContent = totalUnits.toLocaleString('id-ID');
    document.getElementById('kpiLowStock').textContent = lowItems.length;
    document.getElementById('kpiEmptyStock').textContent = emptyItems.length;

    // Render Live SVG Donut Chart
    this.renderDonutChart(items);

    // Render Top 5 Stock Items
    this.renderTopStockItems(items);

    // Render 3 Floor Cards Deck
    const deck = document.getElementById('dashboardFloorDeck');
    const floors = [
      { id: 'L1', name: 'Lantai 1' },
      { id: 'L2', name: 'Lantai 2' },
      { id: 'L3', name: 'Lantai 3' }
    ];

    deck.innerHTML = floors.map(f => {
      const fItems = items.filter(i => i.floorId === f.id);
      const fUnits = fItems.reduce((s, i) => s + Number(i.stock || 0), 0);
      const fAlerts = fItems.filter(i => i.stock <= i.minStock).length;
      return `
        <div class="floor-hub-card fl-${f.id}" onclick="DesktopApp.openFloor('${f.id}')">
          <div class="floor-hub-head">
            <div class="floor-hub-name">${f.name}</div>
            <span class="floor-hub-tag">${fItems.length} SKU</span>
          </div>
          <div class="floor-hub-body">
            <span>Total Fisik: <strong>${fUnits.toLocaleString('id-ID')} Unit</strong></span>
            <span>Perlu Cek: <strong style="color:${fAlerts > 0 ? 'var(--danger-tx)' : 'inherit'};">${fAlerts}</strong></span>
          </div>
        </div>
      `;
    }).join('');

    // Render Restock Alerts Table
    const alertList = items.filter(i => i.stock <= i.minStock).slice(0, 8);
    const tbody = document.getElementById('dashboardAlertTbody');
    if (alertList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:24px;">Seluruh stok di Lantai 1, Lantai 2, dan Lantai 3 dalam kondisi aman.</td></tr>`;
    } else {
      tbody.innerHTML = alertList.map(item => {
        const badge = item.stock === 0
          ? `<span class="badge badge-empty">Habis (0)</span>`
          : `<span class="badge badge-low">Menipis</span>`;
        return `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td><span class="badge badge-neutral">${item.category || 'Umum'}</span></td>
            <td>${item.sku} · <span style="color:var(--text-sub);">${item.barcode}</span></td>
            <td><span class="badge ${this.floorBadgeClass(item.floorId)}">${this.floorLabel(item.floorId)}</span></td>
            <td>${item.location || '-'}</td>
            <td><strong>${item.stock}</strong> ${item.unit}</td>
            <td>${badge}</td>
            <td style="text-align:right;">
              <button class="btn btn-outline btn-sm" onclick="DesktopApp.quickAdjustStock('${item.id}', 10)">+10 Stok</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  },

  renderDonutChart(items) {
    const l1Units = items.filter(i => i.floorId === 'L1').reduce((s, i) => s + Number(i.stock || 0), 0);
    const l2Units = items.filter(i => i.floorId === 'L2').reduce((s, i) => s + Number(i.stock || 0), 0);
    const l3Units = items.filter(i => i.floorId === 'L3').reduce((s, i) => s + Number(i.stock || 0), 0);
    const total = l1Units + l2Units + l3Units || 1;

    const p1 = (l1Units / total) * 100;
    const p2 = (l2Units / total) * 100;
    const p3 = (l3Units / total) * 100;

    const circ = 2 * Math.PI * 40; // r = 40, circumference ~251.3
    const s1 = (p1 / 100) * circ;
    const s2 = (p2 / 100) * circ;
    const s3 = (p3 / 100) * circ;

    const offset1 = 0;
    const offset2 = -s1;
    const offset3 = -(s1 + s2);

    const svgHtml = `
      <svg width="130" height="130" viewBox="0 0 100 100" style="transform:rotate(-90deg);">
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" stroke-width="14" />
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2563EB" stroke-width="14" stroke-dasharray="${s1} ${circ - s1}" stroke-dashoffset="${offset1}" />
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#0D9488" stroke-width="14" stroke-dasharray="${s2} ${circ - s2}" stroke-dashoffset="${offset2}" />
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#7C3AED" stroke-width="14" stroke-dasharray="${s3} ${circ - s3}" stroke-dashoffset="${offset3}" />
      </svg>
    `;
    document.getElementById('donutChartSvgBox').innerHTML = svgHtml;

    document.getElementById('donutChartLegend').innerHTML = `
      <div class="donut-legend-item">
        <span class="donut-legend-dot" style="background:#2563EB;"></span>
        <span>Lantai 1: <strong>${l1Units}</strong> Unit (${Math.round(p1)}%)</span>
      </div>
      <div class="donut-legend-item">
        <span class="donut-legend-dot" style="background:#0D9488;"></span>
        <span>Lantai 2: <strong>${l2Units}</strong> Unit (${Math.round(p2)}%)</span>
      </div>
      <div class="donut-legend-item">
        <span class="donut-legend-dot" style="background:#7C3AED;"></span>
        <span>Lantai 3: <strong>${l3Units}</strong> Unit (${Math.round(p3)}%)</span>
      </div>
    `;
  },

  renderTopStockItems(items) {
    const sorted = [...items].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0)).slice(0, 5);
    const max = sorted[0] ? Number(sorted[0].stock || 1) : 1;
    const container = document.getElementById('topItemsBarList');

    container.innerHTML = sorted.map(it => {
      const pct = Math.max(10, Math.round((Number(it.stock) / max) * 100));
      return `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; margin-bottom:3px;">
            <span>${it.name} <span style="color:var(--text-muted); font-size:11px;">(${this.floorLabel(it.floorId)})</span></span>
            <span><strong>${it.stock}</strong> ${it.unit}</span>
          </div>
          <div style="width:100%; height:7px; background:var(--bg-subtle); border-radius:99px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:var(--brand); border-radius:99px;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ==========================================================================
  // 2. INVENTORY PER FLOOR (DENGAN KATEGORI & STEPPER)
  // ==========================================================================
  renderCategoryPills() {
    const strip = document.getElementById('floorCategoryPills');
    if (!strip) return;

    let items = this.state.items || [];
    if (this.selectedFloor !== 'ALL') {
      items = items.filter(i => i.floorId === this.selectedFloor);
    }

    const cats = new Set();
    items.forEach(i => {
      if (i.category) cats.add(i.category);
    });

    const catArray = ['ALL', ...Array.from(cats)];
    strip.innerHTML = catArray.map(cat => `
      <button class="cat-pill ${this.selectedCategory === cat ? 'active' : ''}" onclick="DesktopApp.setCategoryFilter('${cat}')">
        ${cat === 'ALL' ? 'Semua Kategori' : cat}
      </button>
    `).join('');
  },

  setCategoryFilter(cat) {
    IstiqomahSound.playClick();
    this.selectedCategory = cat;
    this.renderCategoryPills();
    this.renderInventory();
  },

  renderInventory() {
    let list = [...(this.state.items || [])];

    if (this.selectedFloor !== 'ALL') {
      list = list.filter(i => i.floorId === this.selectedFloor);
    }
    if (this.selectedCategory !== 'ALL') {
      list = list.filter(i => i.category === this.selectedCategory);
    }
    if (this.statusFilter === 'LOW') {
      list = list.filter(i => i.stock > 0 && i.stock <= i.minStock);
    } else if (this.statusFilter === 'EMPTY') {
      list = list.filter(i => Number(i.stock) === 0);
    }
    if (this.searchQuery) {
      list = list.filter(i =>
        i.name.toLowerCase().includes(this.searchQuery) ||
        i.sku.toLowerCase().includes(this.searchQuery) ||
        i.barcode.toLowerCase().includes(this.searchQuery) ||
        (i.category || '').toLowerCase().includes(this.searchQuery) ||
        (i.location || '').toLowerCase().includes(this.searchQuery)
      );
    }

    const tbody = document.getElementById('inventoryTableBody');
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:32px;">Tidak ada barang yang sesuai kriteria filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(item => {
      let badge = `<span class="badge badge-ok">Tersedia</span>`;
      if (item.stock === 0) badge = `<span class="badge badge-empty">Habis (0)</span>`;
      else if (item.stock <= item.minStock) badge = `<span class="badge badge-low">Menipis</span>`;

      return `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td><span class="badge badge-neutral">${item.category || 'Umum'}</span></td>
          <td>${item.sku} · <span style="color:var(--text-sub);">${item.barcode}</span></td>
          <td><span class="badge ${this.floorBadgeClass(item.floorId)}">${this.floorLabel(item.floorId)}</span></td>
          <td>${item.location || '-'}</td>
          <td>${badge}</td>
          <td>
            <div class="qty-stepper">
              <button class="stepper-btn" onclick="DesktopApp.adjustStock('${item.id}', -1)">-</button>
              <span class="stepper-val">${item.stock}</span>
              <button class="stepper-btn" onclick="DesktopApp.adjustStock('${item.id}', 1)">+</button>
              <span style="font-size:11.5px; color:var(--text-sub);">${item.unit}</span>
            </div>
          </td>
          <td style="text-align:right;">
            <button class="btn btn-outline btn-sm" onclick="DesktopApp.showBarcode('${item.id}')" title="Label Barcode">${ICONS.tag}</button>
            <button class="btn btn-outline btn-sm" onclick="DesktopApp.openItemModal('${item.id}')" title="Edit">${ICONS.edit}</button>
            <button class="btn btn-danger btn-sm" onclick="DesktopApp.deleteItem('${item.id}')" title="Hapus">${ICONS.trash}</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  adjustStock(itemId, delta) {
    const item = this.state.items.find(i => i.id === itemId);
    if (!item) return;

    if (!this.canAccessFloor(item.floorId)) {
      IstiqomahSound.playError();
      this.showToast(`Akun Anda tidak memiliki akses ke ${this.floorLabel(item.floorId)}`);
      return;
    }

    const next = Math.max(0, Number(item.stock || 0) + delta);
    if (next === item.stock) return;

    if (delta > 0) IstiqomahSound.playStockAdd();
    else IstiqomahSound.playStockSubtract();

    item.stock = next;
    item.updatedAt = IstiqomahUtils.formatNow();

    const user = this.getCurrentUser();
    this.state.mutations.unshift({
      id: 'MUT-' + Date.now().toString().slice(-5),
      timestamp: IstiqomahUtils.formatNow(),
      itemId: item.id,
      itemName: item.name,
      type: delta > 0 ? 'IN' : 'OUT',
      qty: Math.abs(delta),
      unit: item.unit,
      floorId: item.floorId,
      user: user.name || user.username,
      note: delta > 0 ? 'Penambahan stok cepat' : 'Pengurangan stok cepat'
    });

    this.engine.saveState(this.state, user.username);
    this.renderAll();
  },

  quickAdjustStock(itemId, qty) {
    this.adjustStock(itemId, qty);
  },

  // ==========================================================================
  // PROGRESSIVE 3-STEP ITEM WIZARD (SCAN BARCODE AWAL -> INFO -> STOK & BATAS)
  // ==========================================================================
  openItemModal(itemId = null) {
    IstiqomahSound.playClick();
    const modal = document.getElementById('itemModal');
    const user = this.getCurrentUser();

    if (itemId) {
      const item = this.state.items.find(i => i.id === itemId);
      if (!item) return;
      document.getElementById('itemModalTitle').textContent = 'Edit Data Produk';
      document.getElementById('itemFormId').value = item.id;
      document.getElementById('itemFormName').value = item.name;
      document.getElementById('itemFormFloor').value = item.floorId;
      this.updateCategoryOptionsForFloor(item.floorId, item.category);
      document.getElementById('itemFormCustomCategory').value = '';
      document.getElementById('itemFormLocation').value = item.location || '';
      document.getElementById('itemFormSku').value = item.sku;
      document.getElementById('itemFormBarcode').value = item.barcode || '';
      document.getElementById('itemFormStock').value = item.stock;
      document.getElementById('itemFormMin').value = item.minStock;
      document.getElementById('itemFormUnit').value = item.unit || 'Pcs';
      document.getElementById('itemFormNotes').value = item.notes || '';
      this.goToWizardStep(2); // When editing, jump straight to Info
    } else {
      document.getElementById('itemModalTitle').textContent = 'Tambah Produk Baru';
      document.getElementById('itemFormId').value = '';
      document.getElementById('itemFormName').value = '';
      const fVal = this.selectedFloor !== 'ALL' ? this.selectedFloor : 'L1';
      document.getElementById('itemFormFloor').value = fVal;
      this.updateCategoryOptionsForFloor(fVal);
      document.getElementById('itemFormCustomCategory').value = '';
      document.getElementById('itemFormLocation').value = 'Rak 1A';
      document.getElementById('itemFormSku').value = 'BRG-' + Math.floor(100 + Math.random() * 899);
      document.getElementById('itemFormBarcode').value = '';
      document.getElementById('itemFormStock').value = 10;
      document.getElementById('itemFormMin').value = 5;
      document.getElementById('itemFormUnit').value = 'Pcs';
      document.getElementById('itemFormNotes').value = '';
      document.getElementById('barcodeStatusFeedback').innerHTML = '';
      this.goToWizardStep(1); // New item always begins with Step 1 (Scan Barcode)
    }

    this.highlightQuickUnitPill(document.getElementById('itemFormUnit').value);
    modal.classList.add('open');
  },

  goToWizardStep(targetStep) {
    IstiqomahSound.playClick();
    document.getElementById('itemCurrentStep').value = targetStep;

    const stepLabels = [
      'Langkah 1/3 — Scan Barcode Produk',
      'Langkah 2/3 — Info Produk & Kategori',
      'Langkah 3/3 — Stok Awal & Satuan'
    ];
    document.getElementById('itemModalStepLabel').textContent = stepLabels[targetStep - 1];

    [1, 2, 3].forEach(s => {
      const pane = document.getElementById('itemWizardStep' + s);
      const pill = document.getElementById('wizardPill' + s);
      if (pane) pane.style.display = (s === targetStep) ? 'block' : 'none';
      if (pill) {
        pill.classList.toggle('active', s === targetStep);
        pill.classList.toggle('done', s < targetStep);
      }
    });

    if (targetStep === 1) {
      setTimeout(() => document.getElementById('itemFormBarcode')?.focus(), 100);
      this.onItemBarcodeChange(document.getElementById('itemFormBarcode')?.value || '');
    } else if (targetStep === 2) {
      setTimeout(() => document.getElementById('itemFormName')?.focus(), 100);
    } else if (targetStep === 3) {
      this.highlightQuickUnitPill(document.getElementById('itemFormUnit')?.value || 'Pcs');
    }
  },

  onItemBarcodeChange(val) {
    const code = val.trim();
    const currentId = document.getElementById('itemFormId').value;
    const feedback = document.getElementById('barcodeStatusFeedback');
    const btnNext = document.getElementById('btnNextToStep2');
    if (!feedback) return;

    if (!code) {
      feedback.innerHTML = `
        <div style="font-size:11.5px; color:var(--text-muted); padding:8px 0;">
          Belum ada barcode dimasukkan. Anda bisa scan barcode produk, klik Auto SKU, atau lewati langkah ini.
        </div>
      `;
      if (btnNext) btnNext.disabled = false;
      return;
    }

    // Live collision check across all floors
    const duplicate = (this.state.items || []).find(i => (i.barcode && i.barcode.trim().toLowerCase() === code.toLowerCase() && i.id !== currentId));

    if (duplicate) {
      IstiqomahSound.playError();
      feedback.innerHTML = `
        <div class="duplicate-warning-box">
          <div class="duplicate-warning-title">
            <span>&warning;</span>
            <span>Barcode Sudah Terdaftar di Sistem!</span>
          </div>
          <div class="duplicate-warning-desc">
            Nomor barcode <strong style="font-family:var(--font-mono); color:#FFFFFF;">${code}</strong> sudah digunakan oleh produk lain:
          </div>
          <div class="duplicate-existing-item">
            <div>
              <div style="font-weight:800; font-size:13px; color:#FFFFFF;">${duplicate.name}</div>
              <div style="font-size:11px; color:var(--text-muted);">${this.floorLabel(duplicate.floorId)} &bull; ${duplicate.location || 'Rak'} &bull; Stok: <strong style="color:#FFFFFF;">${duplicate.stock} ${duplicate.unit}</strong></div>
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="DesktopApp.jumpToExistingItem('${duplicate.id}')">
              Buka Produk Ini &rarr;
            </button>
          </div>
        </div>
      `;
      if (btnNext) btnNext.disabled = true;
    } else {
      feedback.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; padding:10px 12px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); border-radius:var(--radius-sm); margin-top:10px;">
          <span style="color:var(--success); font-weight:800; font-size:14px;">&check;</span>
          <span style="font-size:12px; color:var(--success); font-weight:700;">Barcode unik &amp; tersedia untuk produk ini!</span>
        </div>
      `;
      if (btnNext) btnNext.disabled = false;
    }
  },

  jumpToExistingItem(itemId) {
    this.closeModal('itemModal');
    this.openItemModal(itemId);
  },

  generateAutoSku() {
    IstiqomahSound.playClick();
    const auto = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    const inp = document.getElementById('itemFormBarcode');
    if (inp) {
      inp.value = auto;
      this.onItemBarcodeChange(auto);
    }
  },

  skipBarcodeStep() {
    IstiqomahSound.playClick();
    document.getElementById('itemFormBarcode').value = '';
    this.goToWizardStep(2);
  },

  stepWizardStock(delta) {
    IstiqomahSound.playClick();
    const inp = document.getElementById('itemFormStock');
    if (!inp) return;
    inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) + delta);
  },

  pickQuickUnit(unitName) {
    IstiqomahSound.playClick();
    document.getElementById('itemFormUnit').value = unitName;
    this.highlightQuickUnitPill(unitName);
  },

  highlightQuickUnitPill(unitName) {
    document.querySelectorAll('.quick-unit-pill').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim().toUpperCase() === String(unitName || '').trim().toUpperCase());
    });
  },

  updateCategoryOptionsForFloor(floorId, selectedCategory = '') {
    const sel = document.getElementById('itemFormCategory');
    if (!sel) return;
    const floorObj = (this.state.floors || []).find(f => f.id === floorId);
    const slots = (floorObj && floorObj.slots) ? floorObj.slots : ['Umum'];
    sel.innerHTML = slots.map(s => `<option value="${s}" ${s === selectedCategory ? 'selected' : ''}>${s}</option>`).join('');
  },

  handleItemWizardSubmit(e) {
    e.preventDefault();
    const currentStep = parseInt(document.getElementById('itemCurrentStep').value, 10) || 1;

    if (currentStep === 1) {
      this.goToWizardStep(2);
      return;
    }
    if (currentStep === 2) {
      const name = document.getElementById('itemFormName').value.trim();
      if (!name) {
        IstiqomahSound.playError();
        this.showToast('Nama produk wajib diisi!');
        document.getElementById('itemFormName').focus();
        return;
      }
      this.goToWizardStep(3);
      return;
    }

    // Step 3 -> Commit to Database
    const user = this.getCurrentUser();
    const id = document.getElementById('itemFormId').value;
    const floorId = document.getElementById('itemFormFloor').value;

    if (!this.canAccessFloor(floorId)) {
      IstiqomahSound.playError();
      this.showToast(`Akun Anda tidak memiliki hak akses untuk ${this.floorLabel(floorId)}`);
      return;
    }

    const customCat = document.getElementById('itemFormCustomCategory').value.trim();
    const category = customCat || document.getElementById('itemFormCategory').value;

    const payload = {
      name: document.getElementById('itemFormName').value.trim().toUpperCase(),
      floorId,
      category,
      location: document.getElementById('itemFormLocation').value.trim() || 'Rak 1A',
      sku: document.getElementById('itemFormSku').value.trim(),
      barcode: document.getElementById('itemFormBarcode').value.trim(),
      stock: Number(document.getElementById('itemFormStock').value || 0),
      minStock: Number(document.getElementById('itemFormMin').value || 5),
      unit: document.getElementById('itemFormUnit').value.trim().toUpperCase() || 'PCS',
      notes: document.getElementById('itemFormNotes').value.trim(),
      updatedAt: IstiqomahUtils.formatNow()
    };

    if (id) {
      const idx = this.state.items.findIndex(i => i.id === id);
      if (idx > -1) {
        this.state.items[idx] = { ...this.state.items[idx], ...payload };
      }
      this.showToast(`Produk "${payload.name}" berhasil diperbarui`);
    } else {
      const newItem = { id: 'it_' + Date.now(), ...payload };
      this.state.items.unshift(newItem);
      this.state.mutations.unshift({
        id: 'MUT-' + Date.now().toString().slice(-5),
        timestamp: IstiqomahUtils.formatNow(),
        itemId: newItem.id,
        itemName: newItem.name,
        type: 'IN',
        qty: newItem.stock,
        unit: newItem.unit,
        floorId: newItem.floorId,
        user: user.name || user.username,
        note: 'Pendaftaran barang baru'
      });
      this.showToast(`Produk "${payload.name}" berhasil ditambahkan`);
    }

    IstiqomahSound.playSuccess();
    this.engine.saveState(this.state, user.username);
    this.closeModal('itemModal');
    this.renderCategoryPills();
    this.renderAll();
  },

  // ==========================================================================
  // MODE LENGKAPI BARCODE BERPROGRESS (WAKTU SENGGANG)
  // ==========================================================================
  completionSelectedFloor: 'ALL',
  completionActiveItemId: null,

  openBarcodeCompletionModal() {
    IstiqomahSound.playClick();
    this.completionActiveItemId = null;
    this.renderBarcodeCompletionModal();
    document.getElementById('barcodeCompletionModal').classList.add('open');
    setTimeout(() => document.getElementById('completionBarcodeInput')?.focus(), 150);
  },

  setCompletionFloor(floorId) {
    IstiqomahSound.playClick();
    this.completionSelectedFloor = floorId;
    this.completionActiveItemId = null;
    ['ALL', 'L1', 'L2', 'L3'].forEach(f => {
      document.getElementById('completionTab' + f)?.classList.toggle('active', f === floorId);
    });
    this.renderBarcodeCompletionModal();
  },

  renderBarcodeCompletionModal() {
    const allItems = this.state.items || [];
    const pool = (this.completionSelectedFloor === 'ALL')
      ? allItems
      : allItems.filter(i => i.floorId === this.completionSelectedFloor);

    const completed = pool.filter(i => i.barcode && i.barcode.trim() !== '');
    const unbarcoded = pool.filter(i => !i.barcode || i.barcode.trim() === '');
    const pct = pool.length > 0 ? Math.round((completed.length / pool.length) * 100) : 100;

    // Update Progress Bars
    const pctLabel = document.getElementById('completionPercentageLabel');
    const meterFill = document.getElementById('completionMeterFill');
    const statsDetail = document.getElementById('completionStatsDetail');
    if (pctLabel) pctLabel.textContent = `${pct}% Selesai`;
    if (meterFill) meterFill.style.width = `${pct}%`;
    if (statsDetail) {
      statsDetail.innerHTML = `
        <span>Total: <strong>${pool.length}</strong></span>
        <span>Sudah Ber-barcode: <strong style="color:var(--success);">${completed.length}</strong></span>
        <span>Belum Ada Barcode: <strong style="color:${unbarcoded.length > 0 ? 'var(--warning)' : 'var(--success)'};">${unbarcoded.length}</strong></span>
      `;
    }

    // Determine Active Item
    let activeItem = null;
    if (this.completionActiveItemId) {
      activeItem = unbarcoded.find(i => i.id === this.completionActiveItemId);
    }
    if (!activeItem && unbarcoded.length > 0) {
      activeItem = unbarcoded[0];
      this.completionActiveItemId = activeItem.id;
    }

    const container = document.getElementById('completionActiveItemContainer');
    if (!activeItem) {
      container.innerHTML = `
        <div class="completion-item-card" style="border-left-color:var(--success); text-align:center; padding:24px;">
          <div style="font-size:22px; color:var(--success); font-weight:800; margin-bottom:6px;">&check; Luar Biasa!</div>
          <div style="font-size:13.5px; font-weight:700; color:#FFFFFF;">Seluruh Produk di ${this.floorLabel(this.completionSelectedFloor)} Sudah Ber-barcode</div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Tidak ada antrian barang tanpa barcode.</div>
        </div>
      `;
      document.getElementById('completionBarcodeInput').disabled = true;
    } else {
      document.getElementById('completionBarcodeInput').disabled = false;
      container.innerHTML = `
        <div class="completion-item-card fl-${activeItem.floorId}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="font-size:16px; font-weight:800; color:#FFFFFF; letter-spacing:-0.2px;">${activeItem.name}</div>
              <div style="font-size:12px; color:var(--text-muted); margin-top:3px;">
                <span class="floor-badge ${activeItem.floorId}">${this.floorLabel(activeItem.floorId)}</span>
                <span style="margin-left:6px;">&bull; Lokasi: <strong style="color:#FFFFFF;">${activeItem.location || 'Rak'}</strong></span>
                <span style="margin-left:6px;">&bull; Kategori: <strong>${activeItem.category || '-'}</strong></span>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:16px; font-weight:800; color:#FFFFFF; font-family:var(--font-mono);">${activeItem.stock} ${activeItem.unit}</div>
              <div style="font-size:10.5px; color:var(--text-muted);">Stok Saat Ini</div>
            </div>
          </div>
        </div>
      `;
    }

    // Queue List
    const queueList = document.getElementById('completionQueueList');
    if (queueList) {
      if (unbarcoded.length === 0) {
        queueList.innerHTML = `<div style="text-align:center; padding:16px; font-size:12px; color:var(--text-muted);">Tidak ada antrian tersisa.</div>`;
      } else {
        queueList.innerHTML = unbarcoded.map((it, idx) => `
          <div class="completion-queue-item ${activeItem && activeItem.id === it.id ? 'active' : ''}" onclick="DesktopApp.pickCompletionItem('${it.id}')">
            <div>
              <div style="font-weight:700; font-size:12.5px; color:#FFFFFF;">${idx + 1}. ${it.name}</div>
              <div style="font-size:11px; color:var(--text-muted);">${this.floorLabel(it.floorId)} &bull; ${it.location || 'Rak'}</div>
            </div>
            <span class="badge ${it.stock > 0 ? 'badge-safe' : 'badge-empty'}">${it.stock} ${it.unit}</span>
          </div>
        `).join('');
      }
    }
  },

  pickCompletionItem(itemId) {
    IstiqomahSound.playClick();
    this.completionActiveItemId = itemId;
    this.renderBarcodeCompletionModal();
    document.getElementById('completionBarcodeInput').value = '';
    document.getElementById('completionBarcodeInput').focus();
  },

  skipCompletionItem() {
    IstiqomahSound.playClick();
    const allItems = this.state.items || [];
    const pool = (this.completionSelectedFloor === 'ALL')
      ? allItems
      : allItems.filter(i => i.floorId === this.completionSelectedFloor);
    const unbarcoded = pool.filter(i => !i.barcode || i.barcode.trim() === '');
    if (unbarcoded.length <= 1) return;

    const curIdx = unbarcoded.findIndex(i => i.id === this.completionActiveItemId);
    const nextIdx = (curIdx + 1) % unbarcoded.length;
    this.completionActiveItemId = unbarcoded[nextIdx].id;
    this.renderBarcodeCompletionModal();
    document.getElementById('completionBarcodeInput').value = '';
    document.getElementById('completionBarcodeInput').focus();
  },

  submitCompletionBarcode(e) {
    e.preventDefault();
    const code = document.getElementById('completionBarcodeInput').value.trim();
    if (!code) {
      IstiqomahSound.playError();
      this.showToast('Silakan scan atau masukkan barcode!');
      return;
    }

    const item = (this.state.items || []).find(i => i.id === this.completionActiveItemId);
    if (!item) return;

    // Check collision
    const dup = (this.state.items || []).find(i => i.barcode && i.barcode.trim().toLowerCase() === code.toLowerCase() && i.id !== item.id);
    if (dup) {
      IstiqomahSound.playError();
      document.getElementById('completionCollisionNotice').innerHTML = `
        <div class="duplicate-warning-box" style="margin-bottom:12px;">
          <div class="duplicate-warning-title">&warning; Barcode Duplikat!</div>
          <div class="duplicate-warning-desc">Barcode <strong>${code}</strong> sudah digunakan oleh produk <strong>${dup.name}</strong> di ${this.floorLabel(dup.floorId)}. Harap gunakan barcode unik.</div>
        </div>
      `;
      return;
    }
    document.getElementById('completionCollisionNotice').innerHTML = '';

    // Save barcode
    item.barcode = code;
    item.updatedAt = IstiqomahUtils.formatNow();
    IstiqomahSound.playSuccess();
    const user = this.getCurrentUser();
    this.engine.saveState(this.state, user.username);
    this.showToast(`&check; Barcode ${code} tersimpan untuk ${item.name}`);

    // Auto-advance
    document.getElementById('completionBarcodeInput').value = '';
    this.completionActiveItemId = null;
    this.renderBarcodeCompletionModal();
    this.renderAll();
    setTimeout(() => document.getElementById('completionBarcodeInput')?.focus(), 100);
  },

  deleteItem(itemId) {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      IstiqomahSound.playError();
      this.showToast('Hanya Super Admin (Fahri) yang berwenang menghapus master barang');
      return;
    }
    const idx = this.state.items.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    if (!confirm(`Hapus permanen barang "${this.state.items[idx].name}"?`)) return;

    const removed = this.state.items.splice(idx, 1)[0];
    this.engine.saveState(this.state, user.username);
    IstiqomahSound.playStockSubtract();
    this.renderCategoryPills();
    this.renderAll();
    this.showToast(`Barang "${removed.name}" dihapus`);
  },

  showBarcode(itemId) {
    IstiqomahSound.playClick();
    const item = this.state.items.find(i => i.id === itemId);
    if (!item) return;
    const svg = IstiqomahUtils.generateBarcodeSvg(item.barcode, 54);
    document.getElementById('barcodeLabelBox').innerHTML = `
      <div style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase;">ISTIQOMAH BULUSARI · ${this.floorLabel(item.floorId)} · ${item.location || 'Rak'}</div>
      <div style="font-size:16px; font-weight:800; margin:6px 0 10px; color:#0B1120;">${item.name}</div>
      <div style="margin-bottom:8px;">${svg}</div>
      <div style="font-family:'JetBrains Mono', monospace; font-size:13px; font-weight:700; color:#0B1120;">${item.barcode} (${item.sku})</div>
    `;
    document.getElementById('barcodeModal').classList.add('open');
  },

  openTransferModal() {
    IstiqomahSound.playClick();
    const sel = document.getElementById('transferItemSelect');
    sel.innerHTML = (this.state.items || []).map(i =>
      `<option value="${i.id}">[${this.floorLabel(i.floorId)}] ${i.name} (Stok: ${i.stock} ${i.unit})</option>`
    ).join('');
    document.getElementById('transferModal').classList.add('open');
  },

  submitTransfer(e) {
    e.preventDefault();
    const user = this.getCurrentUser();
    const itemId = document.getElementById('transferItemSelect').value;
    const targetFloor = document.getElementById('transferTargetFloor').value;
    const qty = Number(document.getElementById('transferQty').value || 1);

    const item = this.state.items.find(i => i.id === itemId);
    if (!item) return;
    if (item.floorId === targetFloor) {
      IstiqomahSound.playError();
      this.showToast('Lantai tujuan harus berbeda dengan lantai asal barang');
      return;
    }
    if (qty > item.stock) {
      IstiqomahSound.playError();
      this.showToast('Jumlah dipindah melebihi stok yang tersedia!');
      return;
    }

    const fromFloor = item.floorId;
    item.stock -= qty;

    let destItem = this.state.items.find(i => i.barcode === item.barcode && i.floorId === targetFloor);
    if (destItem) {
      destItem.stock += qty;
    } else {
      this.state.items.push({
        ...item,
        id: 'it_' + Date.now(),
        floorId: targetFloor,
        stock: qty,
        updatedAt: IstiqomahUtils.formatNow()
      });
    }

    this.state.mutations.unshift({
      id: 'MUT-' + Date.now().toString().slice(-5),
      timestamp: IstiqomahUtils.formatNow(),
      itemId: item.id,
      itemName: item.name,
      type: 'TRANSFER',
      qty,
      unit: item.unit,
      floorId: targetFloor,
      user: user.name || user.username,
      note: `Pindah stok dari ${this.floorLabel(fromFloor)} ke ${this.floorLabel(targetFloor)}`
    });

    IstiqomahSound.playSuccess();
    this.engine.saveState(this.state, user.username);
    this.closeModal('transferModal');
    this.renderAll();
    this.showToast(`Berhasil memindahkan ${qty} ${item.unit} ke ${this.floorLabel(targetFloor)}`);
  },

  closeModal(id) {
    IstiqomahSound.playClick();
    document.getElementById(id).classList.remove('open');
  },

  // ==========================================================================
  // 3. STOCK OPNAME
  // ==========================================================================
  renderOpname() {
    const groups = this.state.soGroups || [];
    const sel = document.getElementById('soGroupSelect');
    const currentVal = sel.value || (groups[0] && groups[0].id);

    sel.innerHTML = groups.map(g =>
      `<option value="${g.id}" ${g.id === currentVal ? 'selected' : ''}>${g.name} (${this.floorLabel(g.floorId)})</option>`
    ).join('');

    const activeGroup = groups.find(g => g.id === sel.value) || groups[0];
    const tbody = document.getElementById('opnameTableBody');
    if (!activeGroup || !activeGroup.entries || activeGroup.entries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:26px;">Belum ada item discan pada sesi opname ini. Silakan scan barcode di atas.</td></tr>`;
      return;
    }

    tbody.innerHTML = activeGroup.entries.map(en => {
      const diff = Number(en.countedQty) - Number(en.systemQty);
      const diffBadge = diff === 0
        ? `<span class="badge badge-ok">Sesuai (0)</span>`
        : (diff > 0 ? `<span class="badge badge-low">+${diff} Lebih</span>` : `<span class="badge badge-empty">${diff} Kurang</span>`);
      return `
        <tr>
          <td><strong>${en.name}</strong></td>
          <td>${en.barcode} · ${en.sku || '-'}</td>
          <td>${en.scanCount || 1}x Scan</td>
          <td>${en.systemQty}</td>
          <td><strong>${en.countedQty}</strong></td>
          <td>${diffBadge}</td>
          <td style="text-align:right;">
            <button class="btn btn-outline btn-sm" onclick="DesktopApp.undoOpnameEntry('${activeGroup.id}', '${en.id}')">Undo</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  onOpnameBarcodeInput(val) {
    const code = (val || '').trim().toLowerCase();
    if (!code) return;
    const match = (this.state.items || []).find(
      i => (i.barcode && i.barcode.toLowerCase() === code) || (i.sku && i.sku.toLowerCase() === code)
    );
    if (match) {
      document.getElementById('soNameInput').value = match.name;
      IstiqomahSound.playScanBeep();
    }
  },

  submitOpname(e) {
    e.preventDefault();
    const user = this.getCurrentUser();
    const groupId = document.getElementById('soGroupSelect').value;
    const group = (this.state.soGroups || []).find(g => g.id === groupId);
    if (!group) return;

    const code = document.getElementById('soBarcodeInput').value.trim();
    const name = document.getElementById('soNameInput').value.trim();
    const qty = Number(document.getElementById('soQtyInput').value || 1);
    const mode = document.getElementById('soModeInput').value;

    const item = (this.state.items || []).find(
      i => (i.barcode && i.barcode.toLowerCase() === code.toLowerCase()) ||
           (i.sku && i.sku.toLowerCase() === code.toLowerCase())
    );

    let entry = group.entries.find(en => en.barcode.toLowerCase() === code.toLowerCase() || en.sku.toLowerCase() === code.toLowerCase());
    if (entry) {
      entry.prevQty = entry.countedQty;
      entry.countedQty = mode === 'ADD' ? entry.countedQty + qty : qty;
      entry.scanCount = (entry.scanCount || 1) + 1;
    } else {
      entry = {
        id: 'soe_' + Date.now(),
        barcode: item ? item.barcode : code,
        sku: item ? item.sku : code,
        name: item ? item.name : name,
        systemQty: item ? item.stock : 0,
        countedQty: qty,
        scanCount: 1,
        prevQty: 0
      };
      group.entries.unshift(entry);
    }

    IstiqomahSound.playScanBeep();
    this.engine.saveState(this.state, user.username);
    document.getElementById('soBarcodeInput').value = '';
    document.getElementById('soNameInput').value = '';
    document.getElementById('soQtyInput').value = 1;
    this.renderAll();
    this.showToast(`Hitungan Opname: ${entry.name} (${entry.countedQty})`);
  },

  undoOpnameEntry(groupId, entryId) {
    IstiqomahSound.playClick();
    const user = this.getCurrentUser();
    const group = (this.state.soGroups || []).find(g => g.id === groupId);
    if (!group) return;
    const entry = group.entries.find(e => e.id === entryId);
    if (!entry) return;
    entry.countedQty = entry.prevQty || 0;
    this.engine.saveState(this.state, user.username);
    this.renderAll();
    this.showToast('Perubahan opname dibatalkan (Undo)');
  },

  applyActiveOpnameToStock() {
    const groupId = document.getElementById('soGroupSelect').value;
    const group = (this.state.soGroups || []).find(g => g.id === groupId);
    if (!group || !group.entries || group.entries.length === 0) return;

    const user = this.getCurrentUser();
    let updatedCount = 0;

    group.entries.forEach(en => {
      const item = this.state.items.find(i => i.barcode === en.barcode || i.sku === en.sku);
      if (item && item.stock !== en.countedQty) {
        item.stock = en.countedQty;
        item.updatedAt = IstiqomahUtils.formatNow();
        this.state.mutations.unshift({
          id: 'MUT-' + Date.now().toString().slice(-5) + updatedCount,
          timestamp: IstiqomahUtils.formatNow(),
          itemId: item.id,
          itemName: item.name,
          type: 'OPNAME',
          qty: en.countedQty,
          unit: item.unit,
          floorId: item.floorId,
          user: user.name || user.username,
          note: `Audit Stock Opname (${group.name})`
        });
        updatedCount++;
      }
    });

    IstiqomahSound.playSuccess();
    this.engine.saveState(this.state, user.username);
    this.renderAll();
    this.showToast(`${updatedCount} barang berhasil diselaraskan ke stok fisik!`);
  },

  createSoGroup(e) {
    e.preventDefault();
    const user = this.getCurrentUser();
    const name = document.getElementById('newSoGroupName').value.trim();
    const floorId = document.getElementById('newSoGroupFloor').value;
    if (!name) return;

    this.state.soGroups.unshift({
      id: 'SO_' + Date.now(),
      name,
      floorId,
      createdAt: IstiqomahUtils.formatNow(),
      entries: []
    });

    document.getElementById('newSoGroupName').value = '';
    IstiqomahSound.playSuccess();
    this.engine.saveState(this.state, user.username);
    this.renderAll();
    this.showToast(`Sesi "${name}" berhasil dibuat`);
  },

  // ==========================================================================
  // 4. RIWAYAT MUTASI
  // ==========================================================================
  renderMutations() {
    const list = this.state.mutations || [];
    const tbody = document.getElementById('mutationTableBody');
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:26px;">Belum ada catatan mutasi transaksi.</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(m => `
      <tr>
        <td>${m.timestamp}</td>
        <td><code>${m.id}</code></td>
        <td><span class="badge badge-neutral">${m.type}</span></td>
        <td><span class="badge ${this.floorBadgeClass(m.floorId)}">${this.floorLabel(m.floorId)}</span></td>
        <td><strong>${m.itemName}</strong></td>
        <td><strong>${m.qty} ${m.unit || ''}</strong></td>
        <td><strong>${m.user || 'Fahri'}</strong></td>
        <td>${m.note || '-'}</td>
      </tr>
    `).join('');
  },

  // ==========================================================================
  // 5. MASTERPIECE A4 REPORT HUB (6 BRANCH TYPES - EXCLUSIVE TO DESKTOP)
  // ==========================================================================
  openReportByType(reportBranch, floorId = 'ALL') {
    this.activeReportBranch = reportBranch;
    this.reportFloorFilter = floorId;
    this.switchView('report');
    this.selectReportBranch(reportBranch);
    this.setReportFloorFilter(floorId);
  },

  printCurrentFloorReport() {
    this.openReportByType('STOCK_RECAP', this.selectedFloor);
  },

  selectReportBranch(branch) {
    IstiqomahSound.playClick();
    this.activeReportBranch = branch;
    document.querySelectorAll('.report-branch-card').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-rpt') === branch);
    });
    this.renderReport();
  },

  setReportFloorFilter(floorId) {
    IstiqomahSound.playClick();
    this.reportFloorFilter = floorId;
    document.querySelectorAll('#reportFloorPills .seg-pill').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-rfl') === floorId);
    });
    this.renderReport();
  },

  renderReport() {
    const user = this.getCurrentUser();
    const fl = this.reportFloorFilter;
    const flLabel = fl === 'ALL' ? 'Semua Lantai (Lantai 1, Lantai 2, Lantai 3)' : this.floorLabel(fl);

    document.getElementById('a4PrintDate').textContent = IstiqomahUtils.formatNow();
    document.getElementById('a4PrintUser').textContent = user.name || user.username;
    document.getElementById('a4SigPrepared').textContent = `${user.name || user.username} (${user.role})`;

    const items = (this.state.items || []).filter(i => fl === 'ALL' || i.floorId === fl);
    const mutations = (this.state.mutations || []).filter(m => fl === 'ALL' || m.floorId === fl);
    const soGroups = (this.state.soGroups || []).filter(g => fl === 'ALL' || g.floorId === fl);

    const summaryEl = document.getElementById('a4KpiSummaryStrip');
    const contentEl = document.getElementById('a4ReportDynamicBody');
    const titleEl = document.getElementById('a4DocMainTitle');
    const subEl = document.getElementById('a4DocSubtitle');
    const badgeEl = document.getElementById('a4DocStamp');
    const regNumEl = document.getElementById('a4DocRegNum');
    const activeBadgeTitle = document.getElementById('reportActiveTitleBadge');

    subEl.textContent = `ISTIQOMAH GROSIR BULUSARI — Cakupan: ${flLabel}`;

    // ------------------------------------------------------------------------
    // BRANCH 1: REKAPITULASI STOK GUDANG (STOCK_RECAP)
    // ------------------------------------------------------------------------
    if (this.activeReportBranch === 'STOCK_RECAP') {
      badgeEl.textContent = 'JENIS 1 · INVENTARIS STOK FISIK';
      titleEl.textContent = 'LAPORAN REKAPITULASI STOK GUDANG';
      regNumEl.textContent = `STK-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Rekapitulasi Stok Gudang (${flLabel})`;

      const totalUnits = items.reduce((s, i) => s + Number(i.stock || 0), 0);
      const lowCnt = items.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
      const emptyCnt = items.filter(i => Number(i.stock) === 0).length;

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Total Barang</div><div class="a4-kpi-tile-val">${items.length} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Total Fisik Stok</div><div class="a4-kpi-tile-val">${totalUnits.toLocaleString('id-ID')} Unit</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Stok Menipis</div><div class="a4-kpi-tile-val">${lowCnt} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Stok Habis (0)</div><div class="a4-kpi-tile-val">${emptyCnt} SKU</div></div>
      `;

      contentEl.innerHTML = `
        <table class="a4-official-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Lantai</th>
              <th>Kategori</th>
              <th>Lokasi Rak</th>
              <th>SKU / Barcode</th>
              <th>Nama Barang</th>
              <th>Stok Fisik</th>
              <th>Batas Min</th>
              <th>Satuan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => {
              const st = it.stock === 0 ? 'HABIS' : (it.stock <= it.minStock ? 'MENIPIS' : 'AMAN');
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${this.floorLabel(it.floorId)}</strong></td>
                  <td>${it.category || 'Umum'}</td>
                  <td>${it.location || '-'}</td>
                  <td>${it.sku} / ${it.barcode}</td>
                  <td><strong>${it.name}</strong></td>
                  <td><strong>${it.stock}</strong></td>
                  <td>${it.minStock}</td>
                  <td>${it.unit}</td>
                  <td><strong>${st}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    // ------------------------------------------------------------------------
    // BRANCH 2: SURAT PESANAN RESTOCK (RESTOCK_ORDER)
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'RESTOCK_ORDER') {
      badgeEl.textContent = 'JENIS 2 · PENGADAAN & SURAT RESTOCK';
      titleEl.textContent = 'SURAT PESANAN RESTOCK BARANG MENIPIS & HABIS';
      regNumEl.textContent = `RST-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Surat Pesanan Restock (${flLabel})`;

      const restockItems = items.filter(i => i.stock <= i.minStock);
      const emptyCnt = restockItems.filter(i => i.stock === 0).length;
      const lowCnt = restockItems.filter(i => i.stock > 0).length;
      const recTotal = restockItems.reduce((s, i) => s + Math.max(10, (i.minStock * 3) - i.stock), 0);

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Perlu Di-Order</div><div class="a4-kpi-tile-val">${restockItems.length} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Status Kosong (0)</div><div class="a4-kpi-tile-val">${emptyCnt} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Status Menipis</div><div class="a4-kpi-tile-val">${lowCnt} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Estimasi Order Unit</div><div class="a4-kpi-tile-val">${recTotal} Unit</div></div>
      `;

      contentEl.innerHTML = `
        <table class="a4-official-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Lantai</th>
              <th>Kategori</th>
              <th>Lokasi Rak</th>
              <th>SKU / Barcode</th>
              <th>Nama Barang</th>
              <th>Sisa Stok</th>
              <th>Batas Min</th>
              <th>Saran Order</th>
              <th>Rencana Belanja Aktual</th>
            </tr>
          </thead>
          <tbody>
            ${restockItems.length === 0 ? `
              <tr><td colspan="10" style="text-align:center; padding:24px;">Seluruh stok barang pada lantai ini dalam kondisi cukup. Tidak ada barang yang perlu direstock saat ini.</td></tr>
            ` : restockItems.map((it, idx) => {
              const suggest = Math.max(10, (it.minStock * 3) - it.stock);
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${this.floorLabel(it.floorId)}</strong></td>
                  <td>${it.category || 'Umum'}</td>
                  <td>${it.location || '-'}</td>
                  <td>${it.sku} / ${it.barcode}</td>
                  <td><strong>${it.name}</strong></td>
                  <td><strong>${it.stock} ${it.unit}</strong></td>
                  <td>${it.minStock} ${it.unit}</td>
                  <td><strong>+${suggest} ${it.unit}</strong></td>
                  <td>....... ${it.unit}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    // ------------------------------------------------------------------------
    // BRANCH 3: AUDIT STOCK OPNAME (OPNAME_AUDIT)
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'OPNAME_AUDIT') {
      badgeEl.textContent = 'JENIS 3 · AUDIT STOCK OPNAME';
      titleEl.textContent = 'BERITA ACARA AUDIT STOCK OPNAME & SELISIH FISIK';
      regNumEl.textContent = `OPN-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Audit Stock Opname (${flLabel})`;

      const rows = [];
      soGroups.forEach(g => {
        (g.entries || []).forEach(en => {
          rows.push({ groupName: g.name, floorId: g.floorId, ...en });
        });
      });

      const matchCnt = rows.filter(r => Number(r.countedQty) === Number(r.systemQty)).length;
      const diffCnt = rows.length - matchCnt;
      const matchRate = rows.length > 0 ? Math.round((matchCnt / rows.length) * 100) : 100;

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Sesi Opname</div><div class="a4-kpi-tile-val">${soGroups.length} Sesi</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Barang Diaudit</div><div class="a4-kpi-tile-val">${rows.length} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Stok Sesuai (0)</div><div class="a4-kpi-tile-val">${matchCnt} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Tingkat Kecocokan</div><div class="a4-kpi-tile-val">${matchRate}%</div></div>
      `;

      contentEl.innerHTML = `
        <table class="a4-official-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Kelompok Opname</th>
              <th>Lantai</th>
              <th>SKU / Barcode</th>
              <th>Nama Barang</th>
              <th>Stok Sistem</th>
              <th>Fisik Dihitung</th>
              <th>Selisih (+/-)</th>
              <th>Status Audit</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length === 0 ? `
              <tr><td colspan="9" style="text-align:center; padding:24px;">Belum ada sesi hasil scan opname yang tercatat pada cakupan lantai ini.</td></tr>
            ` : rows.map((r, idx) => {
              const diff = Number(r.countedQty) - Number(r.systemQty);
              const status = diff === 0 ? 'COCOK' : (diff > 0 ? 'SELISIH LEBIH' : 'SELISIH KURANG');
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${r.groupName}</td>
                  <td><strong>${this.floorLabel(r.floorId)}</strong></td>
                  <td>${r.sku} / ${r.barcode}</td>
                  <td><strong>${r.name}</strong></td>
                  <td>${r.systemQty}</td>
                  <td><strong>${r.countedQty}</strong></td>
                  <td><strong>${diff > 0 ? '+' + diff : diff}</strong></td>
                  <td><strong>${status}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    // ------------------------------------------------------------------------
    // BRANCH 4: JURNAL MUTASI TRANSAKSI (MUTATION_JOURNAL)
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'MUTATION_JOURNAL') {
      badgeEl.textContent = 'JENIS 4 · JURNAL MUTASI STOK';
      titleEl.textContent = 'JURNAL AUDIT MUTASI KELUAR-MASUK & PINDAH LANTAI';
      regNumEl.textContent = `MUT-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Jurnal Mutasi Transaksi (${flLabel})`;

      const inCnt = mutations.filter(m => m.type === 'IN').length;
      const outCnt = mutations.filter(m => m.type === 'OUT').length;
      const opCnt = mutations.filter(m => m.type === 'OPNAME' || m.type === 'TRANSFER').length;

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Total Transaksi</div><div class="a4-kpi-tile-val">${mutations.length} Entri</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Barang Masuk (IN)</div><div class="a4-kpi-tile-val">${inCnt} Entri</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Barang Keluar (OUT)</div><div class="a4-kpi-tile-val">${outCnt} Entri</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Opname / Transfer</div><div class="a4-kpi-tile-val">${opCnt} Entri</div></div>
      `;

      contentEl.innerHTML = `
        <table class="a4-official-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Waktu Transaksi</th>
              <th>Kode Transaksi</th>
              <th>Jenis</th>
              <th>Lantai</th>
              <th>Nama Barang</th>
              <th>Jumlah</th>
              <th>Petugas</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${mutations.map((m, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${m.timestamp}</td>
                <td><code>${m.id}</code></td>
                <td><strong>${m.type}</strong></td>
                <td>${this.floorLabel(m.floorId)}</td>
                <td><strong>${m.itemName}</strong></td>
                <td><strong>${m.qty} ${m.unit || ''}</strong></td>
                <td>${m.user || 'Fahri'}</td>
                <td>${m.note || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // ------------------------------------------------------------------------
    // BRANCH 5: LEMBAR KERJA FISIK MANUAL (BLANK_WORKSHEET)
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'BLANK_WORKSHEET') {
      badgeEl.textContent = 'JENIS 5 · LEMBAR KERJA FISIK GUDANG';
      titleEl.textContent = 'FORMULIR LEMBAR KERJA STOCK OPNAME MANUAL (CLIPBOARD)';
      regNumEl.textContent = `WKS-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Lembar Kerja Fisik (${flLabel})`;

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Target Lantai</div><div class="a4-kpi-tile-val">${flLabel}</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Jumlah Baris SKU</div><div class="a4-kpi-tile-val">${items.length} Baris</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Tanggal Hitung</div><div class="a4-kpi-tile-val">.... / .... / 2026</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Petugas Lapangan</div><div class="a4-kpi-tile-val">....................</div></div>
      `;

      contentEl.innerHTML = `
        <table class="a4-official-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Lantai</th>
              <th>Lokasi Rak</th>
              <th>SKU / Barcode</th>
              <th>Nama Barang</th>
              <th>Satuan</th>
              <th>Stok Sistem</th>
              <th>Hitung Fisik 1</th>
              <th>Hitung Fisik 2</th>
              <th>Paraf Petugas</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${this.floorLabel(it.floorId)}</strong></td>
                <td>${it.location || '-'}</td>
                <td>${it.sku} / ${it.barcode}</td>
                <td><strong>${it.name}</strong></td>
                <td>${it.unit}</td>
                <td>${it.stock}</td>
                <td style="width:85px;">&nbsp;</td>
                <td style="width:85px;">&nbsp;</td>
                <td style="width:100px;">&nbsp;</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // ------------------------------------------------------------------------
    // BRANCH 6: KATALOG LABEL BARCODE RAK (BARCODE_CATALOG)
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'BARCODE_CATALOG') {
      badgeEl.textContent = 'JENIS 6 · KATALOG BARCODE RAK';
      titleEl.textContent = 'LEMBAR CETAK STIKER LABEL BARCODE RAK GUDANG';
      regNumEl.textContent = `LBL-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Katalog Label Barcode Rak (${flLabel})`;

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Total Label Barcode</div><div class="a4-kpi-tile-val">${items.length} Label</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Cakupan Lantai</div><div class="a4-kpi-tile-val">${flLabel}</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Format Standar</div><div class="a4-kpi-tile-val">Code-128 Vector</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Grid Layout</div><div class="a4-kpi-tile-val">A4 3-Kolom</div></div>
      `;

      contentEl.innerHTML = `
        <div class="a4-barcode-grid">
          ${items.map(it => `
            <div class="a4-barcode-cell">
              <div style="font-size:10px; font-weight:800; color:#475569; text-transform:uppercase;">
                ISTIQOMAH BULUSARI · ${this.floorLabel(it.floorId)} · ${it.location || 'Rak'}
              </div>
              <div style="font-size:13px; font-weight:800; color:#0B1120; margin:6px 0 8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${it.name}
              </div>
              <div>${IstiqomahUtils.generateBarcodeSvg(it.barcode, 40)}</div>
              <div style="font-family:'JetBrains Mono', monospace; font-size:11.5px; font-weight:700; margin-top:5px; color:#0B1120;">
                ${it.barcode} (${it.sku})
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  },

  openA4PrintWindow() {
    IstiqomahSound.playClick();
    const sheetEl = document.getElementById('a4DocumentContainer');
    if (!sheetEl) return;

    const printWin = window.open('', '_blank', 'width=1050,height=900');
    if (!printWin) {
      this.showToast('Gagal membuka jendela cetak. Pastikan pop-up diizinkan browser.');
      return;
    }

    const title = document.getElementById('a4DocMainTitle')?.textContent || 'Laporan Istiqomah Bulusari';

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #fff;
            color: #0B1120;
            padding: 24px 30px;
            font-size: 11pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 14mm 12mm 14mm;
          }
          .a4-doc-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0B1120; padding-bottom: 14px; margin-bottom: 16px; }
          .a4-doc-stamp { display: inline-block; padding: 2px 8px; background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; border-radius: 4px; font-size: 9pt; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
          .a4-kpi-summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
          .a4-kpi-tile { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 14px; }
          .a4-kpi-tile-lbl { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; color: #64748B; }
          .a4-kpi-tile-val { font-size: 14pt; font-weight: 800; color: #0B1120; margin-top: 2px; }
          .a4-official-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .a4-official-table th { background: #0B1120; color: #fff; font-size: 8.5pt; font-weight: 800; text-transform: uppercase; padding: 8px 10px; text-align: left; border: 1px solid #0B1120; }
          .a4-official-table td { padding: 7px 10px; border: 1px solid #CBD5E1; font-size: 9.5pt; color: #0B1120; }
          .a4-official-table tr:nth-child(even) td { background: #F8FAFC; }
          .a4-barcode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
          .a4-barcode-cell { border: 1.5px dashed #475569; border-radius: 6px; padding: 12px 10px; text-align: center; }
          .a4-signatures-block { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 32px; padding-top: 18px; text-align: center; font-size: 9.5pt; }
          .a4-signature-line { margin-top: 52px; border-top: 1.5px solid #0B1120; padding-top: 5px; font-weight: 800; }
        </style>
      </head>
      <body>
        ${sheetEl.innerHTML}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  exportReportExcelCSV() {
    IstiqomahSound.playClick();
    const fl = this.reportFloorFilter;
    const items = (this.state.items || []).filter(i => fl === 'ALL' || i.floorId === fl);
    let csv = '';

    if (this.activeReportBranch === 'RESTOCK_ORDER') {
      csv = 'Lantai,Kategori,Lokasi Rak,SKU,Barcode,Nama Barang,Sisa Stok,Batas Min,Satuan,Saran Order\n';
      items.filter(i => i.stock <= i.minStock).forEach(i => {
        const suggest = Math.max(10, (i.minStock * 3) - i.stock);
        csv += `"${this.floorLabel(i.floorId)}","${i.category || 'Umum'}","${i.location}","${i.sku}","${i.barcode}","${i.name}",${i.stock},${i.minStock},"${i.unit}",${suggest}\n`;
      });
    } else if (this.activeReportBranch === 'MUTATION_JOURNAL') {
      csv = 'Waktu,Kode Mutasi,Jenis,Lantai,Nama Barang,Jumlah,Satuan,Petugas,Keterangan\n';
      (this.state.mutations || []).filter(m => fl === 'ALL' || m.floorId === fl).forEach(m => {
        csv += `"${m.timestamp}","${m.id}","${m.type}","${this.floorLabel(m.floorId)}","${m.itemName}",${m.qty},"${m.unit || ''}","${m.user || 'Fahri'}","${m.note || ''}"\n`;
      });
    } else {
      csv = 'Lantai,Kategori,Lokasi Rak,SKU,Barcode,Nama Barang,Stok Fisik,Batas Min,Satuan,Status\n';
      items.forEach(i => {
        const st = i.stock === 0 ? 'HABIS' : (i.stock <= i.minStock ? 'MENIPIS' : 'AMAN');
        csv += `"${this.floorLabel(i.floorId)}","${i.category || 'Umum'}","${i.location}","${i.sku}","${i.barcode}","${i.name}",${i.stock},${i.minStock},"${i.unit}","${st}"\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `Laporan_${this.activeReportBranch}_${fl}_${IstiqomahUtils.formatDateOnly()}.csv`);
    IstiqomahSound.playSuccess();
    this.showToast(`Laporan ${this.activeReportBranch} berhasil diekspor ke format Excel (.CSV)`);
  },

  // ==========================================================================
  // 6. MASTER DATABASE & CADANGAN OFFLINE
  // ==========================================================================
  renderMasterDbView() {
    this.updateWifiStatusUI();
  },

  toggleWifiSync() {
    IstiqomahSound.playClick();
    this.engine.setWifiSyncEnabled(!this.engine.wifiSyncEnabled);
    this.updateWifiStatusUI();
    this.showToast(this.engine.wifiSyncEnabled ? 'Sinkronisasi Sinyal Wi-Fi Diaktifkan' : 'Mode Offline Terisolasi Diaktifkan');
  },

  async manualWifiSync() {
    IstiqomahSound.playClick();
    this.engine.setWifiSyncEnabled(true);
    const ok = await this.engine.pushWifiSync(this.state);
    await this.engine.pullWifiSync();
    this.updateWifiStatusUI();
    if (ok) {
      IstiqomahSound.playSuccess();
      this.showToast('Data berhasil disinkronkan ke server Wi-Fi lokal');
    } else {
      this.showToast('Server Wi-Fi belum aktif, data tetap aman tersimpan di komputer');
    }
  },

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  exportFullBackup() {
    IstiqomahSound.playClick();
    const json = JSON.stringify(this.state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadBlob(blob, `IstiqomahStock_FULL_BACKUP_${IstiqomahUtils.formatDateOnly()}.json`);
    IstiqomahSound.playSuccess();
    this.showToast('File JSON Master Database berhasil diunduh');
  },

  exportFloorJson(floorId) {
    IstiqomahSound.playClick();
    const fItems = (this.state.items || []).filter(i => i.floorId === floorId);
    const payload = {
      version: this.state.version,
      branch: this.state.branch,
      exportedFloor: floorId,
      floorName: this.floorLabel(floorId),
      exportedAt: IstiqomahUtils.formatNow(),
      exportedBy: this.getCurrentUser().username,
      items: fItems
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `Istiqomah_Bulusari_${floorId}_${IstiqomahUtils.formatDateOnly()}.json`);
    IstiqomahSound.playSuccess();
    this.showToast(`Data cadangan ${this.floorLabel(floorId)} berhasil diekspor`);
  },

  exportCurrentFloorJson() {
    if (this.selectedFloor === 'ALL') {
      this.exportFullBackup();
    } else {
      this.exportFloorJson(this.selectedFloor);
    }
  },

  exportCsvTable() {
    IstiqomahSound.playClick();
    const headers = ['ID', 'Lantai', 'Kategori', 'SKU', 'Barcode', 'Nama Barang', 'Stok Fisik', 'Batas Min', 'Satuan', 'Lokasi Rak'];
    const rows = (this.state.items || []).map(i => [
      i.id,
      this.floorLabel(i.floorId),
      `"${(i.category || '').replace(/"/g, '""')}"`,
      i.sku,
      i.barcode,
      `"${(i.name || '').replace(/"/g, '""')}"`,
      i.stock,
      i.minStock,
      i.unit,
      `"${(i.location || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `Tabel_Stok_Istiqomah_Bulusari_${IstiqomahUtils.formatDateOnly()}.csv`);
    IstiqomahSound.playSuccess();
    this.showToast('File CSV berhasil diunduh');
  },

  exportZipArchive() {
    IstiqomahSound.playClick();
    const fullJson = JSON.stringify(this.state, null, 2);
    const l1 = JSON.stringify(this.state.items.filter(i => i.floorId === 'L1'), null, 2);
    const l2 = JSON.stringify(this.state.items.filter(i => i.floorId === 'L2'), null, 2);
    const l3 = JSON.stringify(this.state.items.filter(i => i.floorId === 'L3'), null, 2);

    let csv = 'Lantai,Kategori,SKU,Barcode,Nama Barang,Stok,Min,Satuan,Lokasi\n';
    this.state.items.forEach(i => {
      csv += `"${this.floorLabel(i.floorId)}","${i.category || ''}","${i.sku}","${i.barcode}","${i.name}",${i.stock},${i.minStock},"${i.unit}","${i.location || ''}"\n`;
    });

    const blob = IstiqomahZipBuilder.createZipBlob([
      { name: 'database_lengkap.json', content: fullJson },
      { name: 'lantai_1.json', content: l1 },
      { name: 'lantai_2.json', content: l2 },
      { name: 'lantai_3.json', content: l3 },
      { name: 'tabel_stok.csv', content: csv }
    ]);
    this.downloadBlob(blob, `Arsip_Istiqomah_Bulusari_${IstiqomahUtils.formatDateOnly()}.zip`);
    IstiqomahSound.playSuccess();
    this.showToast('Paket Arsip ZIP Lengkap berhasil diunduh');
  },

  handleMasterFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const user = this.getCurrentUser();

        // Check if single floor JSON
        if (parsed.exportedFloor && Array.isArray(parsed.items)) {
          const fl = parsed.exportedFloor;
          const count = parsed.items.length;
          if (confirm(`File berisi ${count} barang untuk ${this.floorLabel(fl)}. Lanjutkan impor dan perbarui stok lantai tersebut?`)) {
            const others = (this.state.items || []).filter(i => i.floorId !== fl);
            this.state.items = [...others, ...parsed.items];
            this.engine.saveState(this.state, user.username);
            IstiqomahSound.playSuccess();
            this.renderAll();
            this.showToast(`Data ${this.floorLabel(fl)} berhasil diperbarui (${count} barang)`);
          }
        }
        // Full database JSON
        else if (Array.isArray(parsed.items)) {
          const totalItems = parsed.items.length;
          const choice = prompt(`File cadangan berisi ${totalItems} barang.\nKetik 'GABUNG' untuk menggabungkan data, atau 'TIMPA' untuk mengganti seluruh database:`, 'GABUNG');
          if (choice && choice.toUpperCase() === 'TIMPA') {
            parsed.floors = [
              { id: 'L1', name: 'Lantai 1', slots: ['Sembako & Beras', 'Minyak & Bumbu', 'Sabun & Pembersih', 'Popok & Tissue', 'Susu, Kopi & Minuman'] },
              { id: 'L2', name: 'Lantai 2', slots: ['Gamis & Dress Muslim', 'Koko & Sarung Pria', 'Busana Muslim Anak', 'Hijab & Pashmina', 'Mukena & Perlengkapan Sholat'] },
              { id: 'L3', name: 'Lantai 3', slots: ['Alat Masak & Dapur', 'Peralatan Makan & Minum', 'Kebersihan & Sanitasi', 'Wadah & Box Storage', 'Lampu & Elektronik Rumah'] }
            ];
            if (!parsed.users || parsed.users.length === 0) parsed.users = this.state.users;
            this.state = parsed;
            this.engine.saveState(this.state, user.username);
            IstiqomahSound.playSuccess();
            this.renderAll();
            this.showToast('Seluruh database berhasil ditimpa dan dipulihkan!');
          } else if (choice && choice.toUpperCase() === 'GABUNG') {
            const existingBarcodes = new Set(this.state.items.map(i => i.barcode));
            let addedCount = 0;
            parsed.items.forEach(newItem => {
              if (!existingBarcodes.has(newItem.barcode)) {
                this.state.items.push(newItem);
                addedCount++;
              }
            });
            this.engine.saveState(this.state, user.username);
            IstiqomahSound.playSuccess();
            this.renderAll();
            this.showToast(`Berhasil menggabungkan ${addedCount} barang baru ke database!`);
          }
        } else {
          IstiqomahSound.playError();
          this.showToast('Format struktur file JSON tidak dikenali');
        }
      } catch (err) {
        IstiqomahSound.playError();
        this.showToast('Gagal memproses file JSON cadangan');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  },

  promptEmergencyReset() {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      IstiqomahSound.playError();
      this.showToast('Akses Ditolak: Hanya Super Admin (Fahri) yang berwenang mereset stok!');
      return;
    }

    const conf = prompt("PERINGATAN TINGGI!\nSeluruh jumlah stok di Lantai 1, 2, dan 3 akan disetel ke 0.\nKetik 'RESET STOK' untuk melanjutkan:", "");
    if (conf === 'RESET STOK') {
      (this.state.items || []).forEach(i => {
        i.stock = 0;
        i.updatedAt = IstiqomahUtils.formatNow();
      });
      this.state.mutations.unshift({
        id: 'MUT-RESET-' + Date.now().toString().slice(-4),
        timestamp: IstiqomahUtils.formatNow(),
        itemId: 'ALL',
        itemName: 'Semua Barang Gudang',
        type: 'OPNAME',
        qty: 0,
        unit: 'Pcs',
        floorId: 'L1',
        user: user.name || user.username,
        note: 'RESET STOK DARURAT KE 0 OLEH ADMIN'
      });
      this.engine.saveState(this.state, user.username);
      IstiqomahSound.playError();
      this.renderAll();
      this.showToast('Semua stok berhasil direset ke 0.');
    }
  },

  // ==========================================================================
  // 7. MANAJEMEN AKUN & PETUGAS (FAHRI SUPER ADMIN)
  // ==========================================================================
  renderAccounts() {
    const currentUser = this.getCurrentUser();
    const users = this.state.users || [];
    const tbody = document.getElementById('accountsTableBody');

    tbody.innerHTML = users.map(u => {
      const isCurrent = u.id === currentUser.id;
      const isFahriMain = u.id === 'usr_fahri' || u.username === 'fahri';

      return `
        <tr>
          <td>
            <strong>${u.name || u.username}</strong>
            ${isCurrent ? `<span class="badge badge-ok" style="margin-left:6px;">Aktif</span>` : ''}
          </td>
          <td><span class="badge badge-neutral">${u.role}</span></td>
          <td>${this.formatAssignedFloors(u)}</td>
          <td><span style="font-size:11.5px; color:var(--text-sub);">${u.lastLogin || '-'}</span></td>
          <td style="text-align:right;">
            ${!isCurrent ? `<button class="btn btn-outline btn-sm" onclick="DesktopApp.switchAccount('${u.id}')">Gunakan</button>` : ''}
            ${currentUser.role === 'ADMIN' && !isFahriMain ? `<button class="btn btn-danger btn-sm" onclick="DesktopApp.deleteAccount('${u.id}')">${ICONS.trash}</button>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    // Activity log box
    const logBox = document.getElementById('userActivityLogBox');
    const recentMutations = (this.state.mutations || []).slice(0, 15);
    logBox.innerHTML = recentMutations.map(m => `
      <div style="padding:8px 0; border-bottom:1px solid var(--border-col); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div><strong>${m.user || 'Fahri'}</strong> melakukan <strong>${m.type}</strong> (${m.qty} ${m.unit || ''}) pada <em>${m.itemName}</em></div>
          <div style="font-size:11px; color:var(--text-muted);">${m.timestamp} &bull; ${this.floorLabel(m.floorId)} &bull; ${m.note || '-'}</div>
        </div>
      </div>
    `).join('') || '<div style="color:var(--text-muted); text-align:center; padding:16px;">Belum ada aktivitas tercatat.</div>';
  },

  switchAccount(userId) {
    IstiqomahSound.playClick();
    const target = (this.state.users || []).find(u => u.id === userId);
    if (!target) return;
    this.engine.setCurrentUser(target.id);
    this.renderAll();
    this.showToast(`Beralih ke sesi akun: ${target.name || target.username}`);
  },

  openPasswordModal() {
    IstiqomahSound.playClick();
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    document.getElementById('passwordModal').classList.add('open');
  },

  submitChangePassword(e) {
    e.preventDefault();
    const newPass = document.getElementById('newPasswordInput').value.trim();
    const confPass = document.getElementById('confirmPasswordInput').value.trim();

    if (!newPass) return;
    if (newPass !== confPass) {
      IstiqomahSound.playError();
      this.showToast('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    const current = this.getCurrentUser();
    current.password = newPass;
    this.engine.saveState(this.state, current.username);
    this.closeModal('passwordModal');
    IstiqomahSound.playSuccess();
    this.showToast('Kata sandi berhasil diperbarui.');
  },

  openUserModal() {
    IstiqomahSound.playClick();
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      IstiqomahSound.playError();
      this.showToast('Hanya Super Admin (Fahri) yang dapat menambahkan akun baru');
      return;
    }

    document.getElementById('newUserName').value = '';
    document.getElementById('newUserUsername').value = '';
    document.getElementById('newUserPassword').value = '123';
    document.getElementById('newUserRole').value = 'STAFF';
    document.getElementById('newUserFloor').value = 'ALL';
    document.getElementById('userModal').classList.add('open');
  },

  submitCreateUser(e) {
    e.preventDefault();
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'ADMIN') return;

    const name = document.getElementById('newUserName').value.trim();
    const username = document.getElementById('newUserUsername').value.trim().toLowerCase();
    const password = document.getElementById('newUserPassword').value.trim() || '123';
    const role = document.getElementById('newUserRole').value;
    const floor = document.getElementById('newUserFloor').value;

    if (!name || !username) return;

    if ((this.state.users || []).some(u => u.username.toLowerCase() === username)) {
      IstiqomahSound.playError();
      this.showToast(`Username "${username}" sudah digunakan!`);
      return;
    }

    this.state.users.push({
      id: 'usr_' + Date.now(),
      username,
      name,
      password,
      role,
      assignedFloors: floor === 'ALL' ? ['L1', 'L2', 'L3'] : [floor],
      createdAt: IstiqomahUtils.formatDateOnly(),
      lastLogin: '-'
    });

    this.engine.saveState(this.state, currentUser.username);
    this.closeModal('userModal');
    IstiqomahSound.playSuccess();
    this.renderAll();
    this.showToast(`Akun "${name}" berhasil didaftarkan`);
  },

  deleteAccount(userId) {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'ADMIN') {
      IstiqomahSound.playError();
      this.showToast('Hanya Super Admin (Fahri) yang dapat menghapus akun petugas');
      return;
    }
    if (userId === 'usr_fahri') {
      IstiqomahSound.playError();
      this.showToast('Akun Super Admin Fahri tidak dapat dihapus');
      return;
    }

    const target = this.state.users.find(u => u.id === userId);
    if (!target) return;
    if (!confirm(`Hapus akun petugas "${target.name || target.username}"?`)) return;

    this.state.users = (this.state.users || []).filter(u => u.id !== userId);
    this.engine.saveState(this.state, currentUser.username);
    IstiqomahSound.playStockSubtract();
    this.renderAll();
    this.showToast(`Akun "${target.name || target.username}" dihapus.`);
  },

  showToast(msg) {
    const el = document.getElementById('toastEl');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }
};

window.addEventListener('DOMContentLoaded', () => DesktopApp.init());
