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

  // A4 Report Hub State (Desktop Exclusive - Full Suite)
  activeReportBranch: 'STOCK_RECAP',
  reportFloorFilter: 'ALL',
  reportCategoryFilter: 'ALL',
  reportPriorityFilter: 'ALL',
  reportStaffFilter: 'ALL',
  reportSearchQuery: '',

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

    // Global keyboard shortcut: Ctrl+K or Cmd+K focuses global search bar
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('globalSearchInput');
        if (input) {
          input.focus();
          input.select();
        }
      }
    });

    setInterval(() => this.updateWifiStatusUI(), 1500);
  },

  injectIcons() {
    const map = {
      icLoginUser: ICONS.user,
      icLoginLock: ICONS.lock,
      icEyeLogin: ICONS.eye,
      icLoginArrow: ICONS.arrowRight,
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
      icTitleSound: IstiqomahSound.isSoundEnabled() ? ICONS.soundOn : ICONS.soundOff,
      icTitleLock: ICONS.lock,
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
      icRbCat: ICONS.tag,
      icRb2: ICONS.alert,
      icRbExec: ICONS.grid,
      icRb4: ICONS.transfer,
      icRb3: ICONS.scan,
      icRb6: ICONS.tag,
      icRb5: ICONS.clipboard
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
    const icon = enabled ? ICONS.soundOn : ICONS.soundOff;
    const label = enabled ? 'Suara On' : 'Suara Off';

    const ic = document.getElementById('icSound');
    const txt = document.getElementById('txtSound');
    if (ic) ic.innerHTML = icon;
    if (txt) txt.textContent = label;

    const icTitle = document.getElementById('icTitleSound');
    const txtTitle = document.getElementById('txtTitleSound');
    if (icTitle) icTitle.innerHTML = icon;
    if (txtTitle) txtTitle.textContent = label;

    this.showToast(enabled ? 'Efek Suara Velvet Diaktifkan' : 'Efek Suara Dibisukan (Mute)');
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

  toggleLoginPasswordVisibility() {
    const input = document.getElementById('loginPasswordInput');
    const eyeBtn = document.getElementById('icEyeLogin');
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    if (eyeBtn) {
      eyeBtn.innerHTML = isPass ? ICONS.eyeOff : ICONS.eye;
    }
  },

  renderLoginOverlay() {
    const users = this.state.users || [];
    const current = this.getCurrentUser();

    const sel = document.getElementById('loginUserSelect');
    if (sel) {
      sel.innerHTML = users.map(u => `
        <option value="${u.id}" ${u.id === current.id ? 'selected' : ''}>
          ${u.name || u.username} (${u.role === 'ADMIN' ? 'Admin' : this.formatAssignedFloors(u)})
        </option>
      `).join('');
      this.onSelectLoginUser(sel.value);
    }
  },

  formatAssignedFloors(user) {
    if (user.role === 'ADMIN') return 'Semua Lantai';
    if (Array.isArray(user.assignedFloors)) {
      if (user.assignedFloors.includes('ALL') || user.assignedFloors.length >= 3) return 'Semua Lantai';
      return user.assignedFloors.map(f => this.floorLabel(f)).join(', ');
    }
    return user.floorAccess === 'ALL' ? 'Semua Lantai' : this.floorLabel(user.floorAccess);
  },

  onSelectLoginUser(userId) {
    const user = (this.state.users || []).find(u => u.id === userId);
    const preview = document.getElementById('loginAccessPreview');
    const pwdInput = document.getElementById('loginPasswordInput');
    if (!user) return;
    if (pwdInput) {
      pwdInput.value = user.password || (user.role === 'ADMIN' ? '819' : '123');
    }
    if (preview) {
      if (user.role === 'ADMIN') {
        preview.innerHTML = `<strong>Akses:</strong> Semua Lantai (Admin)`;
      } else {
        preview.innerHTML = `<strong>Akses:</strong> ${this.formatAssignedFloors(user)}`;
      }
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
      this.showToast('PIN tidak sesuai');
      return;
    }

    user.lastLogin = IstiqomahUtils.formatNow();
    this.engine.setCurrentUser(user.id);
    this.engine.setAuthenticated(true);
    document.getElementById('loginOverlay').classList.add('hidden');
    IstiqomahSound.playSuccess();
    this.renderAll();
    this.showToast(`Masuk sebagai ${user.name || user.username}`);
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
      if (txt) txt.textContent = 'Offline';
      if (badge) { badge.className = 'badge badge-neutral'; badge.textContent = 'Nonaktif'; }
      if (toggleBtn) toggleBtn.textContent = 'Aktifkan Wi-Fi';
    } else if (this.engine.wifiConnected) {
      if (dot) dot.className = 'status-dot';
      if (txt) txt.textContent = 'Wi-Fi Terhubung';
      if (badge) { badge.className = 'badge badge-ok'; badge.textContent = 'Tersambung'; }
      if (toggleBtn) toggleBtn.textContent = 'Matikan Wi-Fi';
    } else {
      if (dot) dot.className = 'status-dot offline';
      if (txt) txt.textContent = 'Offline';
      if (badge) { badge.className = 'badge badge-low'; badge.textContent = 'Mencari'; }
      if (toggleBtn) toggleBtn.textContent = 'Matikan Wi-Fi';
    }
  },
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
      document.getElementById('itemModalTitle').textContent = 'Edit Barang';
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
      document.getElementById('itemModalTitle').textContent = 'Tambah Barang';
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
      'Langkah 1/3: Barcode',
      'Langkah 2/3: Info Produk',
      'Langkah 3/3: Stok & Satuan'
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
      feedback.innerHTML = '';
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
            <span>Barcode Sudah Digunakan!</span>
          </div>
          <div class="duplicate-warning-desc">
            Barcode <strong style="font-family:var(--font-mono); color:var(--text-main);">${code}</strong> sudah dipakai oleh:
          </div>
          <div class="duplicate-existing-item">
            <div>
              <div style="font-weight:800; font-size:13px; color:var(--text-main);">${duplicate.name}</div>
              <div style="font-size:11px; color:var(--text-muted);">${this.floorLabel(duplicate.floorId)} &bull; ${duplicate.location || 'Rak'} &bull; Stok: <strong style="color:var(--text-main);">${duplicate.stock} ${duplicate.unit}</strong></div>
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="DesktopApp.jumpToExistingItem('${duplicate.id}')">
              Buka Produk &rarr;
            </button>
          </div>
        </div>
      `;
      if (btnNext) btnNext.disabled = true;
    } else {
      feedback.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); border-radius:var(--radius-sm); margin-top:10px;">
          <span style="color:var(--success); font-weight:800; font-size:13px;">&check;</span>
          <span style="font-size:12px; color:var(--success); font-weight:700;">Barcode tersedia</span>
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
        <div class="completion-item-card" style="border-left-color:var(--safe-tx); text-align:center; padding:18px;">
          <div style="font-size:14px; font-weight:800; color:var(--text-main);">Semua produk di ${this.floorLabel(this.completionSelectedFloor)} sudah ber-barcode.</div>
        </div>
      `;
      document.getElementById('completionBarcodeInput').disabled = true;
    } else {
      document.getElementById('completionBarcodeInput').disabled = false;
      container.innerHTML = `
        <div class="completion-item-card fl-${activeItem.floorId}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="font-size:16px; font-weight:800; color:var(--text-main); letter-spacing:-0.2px;">${activeItem.name}</div>
              <div style="font-size:12px; color:var(--text-muted); margin-top:3px;">
                <span class="floor-badge ${activeItem.floorId}">${this.floorLabel(activeItem.floorId)}</span>
                <span style="margin-left:6px;">&bull; Lokasi: <strong style="color:var(--text-main);">${activeItem.location || 'Rak'}</strong></span>
                <span style="margin-left:6px;">&bull; Kategori: <strong>${activeItem.category || '-'}</strong></span>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:16px; font-weight:800; color:var(--text-main); font-family:var(--font-mono);">${activeItem.stock} ${activeItem.unit}</div>
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
              <div style="font-weight:800; font-size:12.5px; color:var(--text-main);">${idx + 1}. ${it.name}</div>
              <div style="font-size:11px; color:var(--text-muted);">${this.floorLabel(it.floorId)} &bull; ${it.location || 'Rak'}</div>
            </div>
            <span class="badge-stock ${it.stock > 0 ? 'badge-safe' : 'badge-empty'}">${it.stock} ${it.unit}</span>
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
    this.showToast(`Barcode ${code} tersimpan`);

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
      this.showToast('Hanya Admin yang berwenang menghapus barang');
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
    this.populateReportFilterControls();
    this.renderReport();
  },

  setReportFloorFilter(floorId) {
    IstiqomahSound.playClick();
    this.reportFloorFilter = floorId;
    document.querySelectorAll('#reportFloorPills .seg-pill').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-rfl') === floorId);
    });
    this.populateReportFilterControls();
    this.renderReport();
  },

  setReportCategoryFilter(cat) {
    IstiqomahSound.playClick();
    this.reportCategoryFilter = cat;
    this.renderReport();
  },

  setReportPriorityFilter(pri) {
    IstiqomahSound.playClick();
    this.reportPriorityFilter = pri;
    this.renderReport();
  },

  setReportStaffFilter(staff) {
    IstiqomahSound.playClick();
    this.reportStaffFilter = staff;
    this.renderReport();
  },

  setReportSearchQuery(query) {
    this.reportSearchQuery = (query || '').trim().toLowerCase();
    this.renderReport();
  },

  populateReportFilterControls() {
    const branch = this.activeReportBranch;
    const catWrap = document.getElementById('wrapReportCategory');
    const priWrap = document.getElementById('wrapReportPriority');
    const staffWrap = document.getElementById('wrapReportStaff');
    const catSel = document.getElementById('reportCategorySelect');
    const staffSel = document.getElementById('reportStaffSelect');

    if (catWrap) {
      catWrap.style.display = (branch === 'STOCK_RECAP' || branch === 'CATEGORY' || branch === 'RESTOCK_ORDER' || branch === 'BLANK_WORKSHEET' || branch === 'BARCODE_CATALOG') ? 'flex' : 'none';
    }
    if (priWrap) {
      priWrap.style.display = (branch === 'RESTOCK_ORDER') ? 'flex' : 'none';
    }
    if (staffWrap) {
      staffWrap.style.display = (branch === 'MUTATION_JOURNAL') ? 'flex' : 'none';
    }

    if (catSel) {
      const fl = this.reportFloorFilter;
      const items = (this.state.items || []).filter(i => fl === 'ALL' || i.floorId === fl);
      const catSet = new Set();
      items.forEach(i => {
        if (i.category) catSet.add(i.category.trim());
      });
      const cats = Array.from(catSet).sort((a, b) => a.localeCompare(b));
      const cur = this.reportCategoryFilter;

      catSel.innerHTML = `
        <option value="ALL" ${cur === 'ALL' ? 'selected' : ''}>Semua Kategori / Jenis (${cats.length})</option>
        ${cats.map(c => `<option value="${c}" ${cur === c ? 'selected' : ''}>${c}</option>`).join('')}
      `;
    }

    if (staffSel) {
      const users = this.state.users || [];
      const curStaff = this.reportStaffFilter;
      staffSel.innerHTML = `
        <option value="ALL" ${curStaff === 'ALL' ? 'selected' : ''}>Semua Petugas (${users.length})</option>
        ${users.map(u => `<option value="${u.name || u.username}" ${curStaff === (u.name || u.username) ? 'selected' : ''}>${u.name || u.username}</option>`).join('')}
      `;
    }
  },

  renderReport() {
    const user = this.getCurrentUser();
    const fl = this.reportFloorFilter;
    const cat = this.reportCategoryFilter;
    const pri = this.reportPriorityFilter;
    const staff = this.reportStaffFilter;
    const q = this.reportSearchQuery;
    const flLabel = fl === 'ALL' ? 'Semua Lantai (Lantai 1, Lantai 2, Lantai 3)' : this.floorLabel(fl);

    const dateEl = document.getElementById('a4PrintDate');
    const userEl = document.getElementById('a4PrintUser');
    const sigPreparedEl = document.getElementById('a4SigPrepared');
    if (dateEl) dateEl.textContent = IstiqomahUtils.formatNow();
    if (userEl) userEl.textContent = user.name || user.username;
    if (sigPreparedEl) sigPreparedEl.textContent = `${user.name || user.username} (${user.role})`;

    // Raw dataset matching current floor
    let items = (this.state.items || []).filter(i => fl === 'ALL' || i.floorId === fl);
    let mutations = (this.state.mutations || []).filter(m => fl === 'ALL' || m.floorId === fl);
    let soGroups = (this.state.soGroups || []).filter(g => fl === 'ALL' || g.floorId === fl);

    // Apply search query
    if (q) {
      items = items.filter(i =>
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.barcode && i.barcode.includes(q)) ||
        (i.sku && i.sku.toLowerCase().includes(q)) ||
        (i.location && i.location.toLowerCase().includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q))
      );
      mutations = mutations.filter(m =>
        (m.itemName && m.itemName.toLowerCase().includes(q)) ||
        (m.id && m.id.toLowerCase().includes(q)) ||
        (m.user && m.user.toLowerCase().includes(q)) ||
        (m.note && m.note.toLowerCase().includes(q))
      );
    }

    const summaryEl = document.getElementById('a4KpiSummaryStrip');
    const contentEl = document.getElementById('a4ReportDynamicBody');
    const titleEl = document.getElementById('a4DocMainTitle');
    const subEl = document.getElementById('a4DocSubtitle');
    const badgeEl = document.getElementById('a4DocStamp');
    const regNumEl = document.getElementById('a4DocRegNum');
    const activeBadgeTitle = document.getElementById('reportActiveTitleBadge');
    const countBadge = document.getElementById('reportFilterCountBadge');

    if (subEl) subEl.textContent = `ISTIQOMAH GROSIR BULUSARI — Cakupan: ${flLabel}`;

    // ------------------------------------------------------------------------
    // BRANCH 1: STOK PER LANTAI (STOCK_RECAP)
    // ------------------------------------------------------------------------
    if (this.activeReportBranch === 'STOCK_RECAP') {
      if (cat !== 'ALL') {
        items = items.filter(i => i.category && i.category.trim() === cat);
      }
      badgeEl.textContent = 'JENIS 1 · INVENTARIS STOK PER LANTAI';
      titleEl.textContent = 'LAPORAN REKAPITULASI STOK PER LANTAI';
      regNumEl.textContent = `STK-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Stok per Lantai (${flLabel}${cat !== 'ALL' ? ' · ' + cat : ''})`;
      if (countBadge) countBadge.textContent = `Menampilkan ${items.length} macam barang`;

      const totalUnits = items.reduce((s, i) => s + Number(i.stock || 0), 0);
      const lowCnt = items.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
      const emptyCnt = items.filter(i => Number(i.stock) === 0).length;
      const safeCnt = Math.max(0, items.length - (lowCnt + emptyCnt));

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Total Macam SKU</div><div class="a4-kpi-tile-val">${items.length} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Total Fisik Stok</div><div class="a4-kpi-tile-val">${totalUnits.toLocaleString('id-ID')} Unit</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Stok Menipis</div><div class="a4-kpi-tile-val">${lowCnt} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Stok Habis (0)</div><div class="a4-kpi-tile-val">${emptyCnt} SKU</div></div>
      `;

      contentEl.innerHTML = `
        <table class="a4-official-table">
          <thead>
            <tr>
              <th style="width:38px; text-align:center;">No</th>
              <th style="width:75px;">Lantai</th>
              <th style="width:130px;">Kategori / Jenis</th>
              <th style="width:90px;">Lokasi Rak</th>
              <th style="width:115px;">Barcode / SKU</th>
              <th>Nama Produk</th>
              <th style="width:70px; text-align:right;">Batas Min</th>
              <th style="width:75px; text-align:right;">Fisik Stok</th>
              <th style="width:65px; text-align:center;">Satuan</th>
              <th style="width:80px; text-align:center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${items.length === 0 ? `
              <tr><td colspan="10" style="text-align:center; padding:24px; color:#71717A;">Tidak ada barang yang sesuai dengan filter yang dipilih.</td></tr>
            ` : items.map((it, idx) => {
        const st = it.stock <= 0 ? 'HABIS' : (it.stock <= it.minStock ? 'MENIPIS' : 'AMAN');
        const badgeStyle = st === 'HABIS' ? 'background:#FEF2F2; color:#991B1B; border:1px solid #F87171;' : (st === 'MENIPIS' ? 'background:#FFFBEB; color:#92400E; border:1px solid #FCD34D;' : 'background:#F0FDF4; color:#166534; border:1px solid #86EFAC;');
        return `
                <tr>
                  <td style="text-align:center; font-family:var(--font-mono);">${idx + 1}</td>
                  <td><strong>${this.floorLabel(it.floorId)}</strong></td>
                  <td>${it.category || 'Umum'}</td>
                  <td>${it.location || '-'}</td>
                  <td><code>${it.barcode || it.sku}</code></td>
                  <td><strong>${it.name}</strong></td>
                  <td style="text-align:right; font-family:var(--font-mono);">${it.minStock}</td>
                  <td style="text-align:right; font-family:var(--font-mono); font-weight:800;">${it.stock}</td>
                  <td style="text-align:center;">${it.unit}</td>
                  <td style="text-align:center;"><span style="font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:4px; ${badgeStyle}">${st}</span></td>
                </tr>
              `;
      }).join('')}
          </tbody>
          <tfoot>
            <tr class="a4-subtotal-tr">
              <td colspan="6" style="text-align:right; font-weight:900;">TOTAL KESELURUHAN UNIT FISIK:</td>
              <td colspan="2" style="text-align:right; font-family:var(--font-mono); font-weight:900; font-size:12px;">${totalUnits.toLocaleString('id-ID')} Unit</td>
              <td colspan="2" style="text-align:center; font-weight:800;">${items.length} SKU</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    // ------------------------------------------------------------------------
    // BRANCH 2: LAPORAN PER JENIS / KATEGORI (CATEGORY) - EXACT AS KETANGGUNGAN
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'CATEGORY') {
      badgeEl.textContent = 'JENIS 2 · REKAPITULASI PER JENIS / KATEGORI';
      titleEl.textContent = 'LAPORAN STOK PER JENIS KOMODITAS GROSIR';
      regNumEl.textContent = `CAT-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Laporan per Jenis / Kategori (${flLabel}${cat !== 'ALL' ? ' · ' + cat : ''})`;

      // Filter by selected category if specific
      let targetItems = items;
      if (cat !== 'ALL') {
        targetItems = items.filter(i => i.category && i.category.trim() === cat);
      }

      // Group items by category
      const groupMap = new Map();
      targetItems.forEach(it => {
        const cName = (it.category || 'Umum').trim();
        if (!groupMap.has(cName)) {
          groupMap.set(cName, []);
        }
        groupMap.get(cName).push(it);
      });

      const categoriesSorted = Array.from(groupMap.keys()).sort((a, b) => a.localeCompare(b));
      const grandTotalUnits = targetItems.reduce((s, i) => s + Number(i.stock || 0), 0);
      const grandTotalSKU = targetItems.length;

      if (countBadge) countBadge.textContent = `Menampilkan ${categoriesSorted.length} kategori · ${grandTotalSKU} SKU`;

      // Top category
      let topCategory = '-';
      let topCategoryQty = 0;
      categoriesSorted.forEach(c => {
        const qSum = groupMap.get(c).reduce((s, i) => s + Number(i.stock || 0), 0);
        if (qSum > topCategoryQty) {
          topCategoryQty = qSum;
          topCategory = c;
        }
      });

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Kategori Terdaftar</div><div class="a4-kpi-tile-val">${categoriesSorted.length} Kategori</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Total Macam SKU</div><div class="a4-kpi-tile-val">${grandTotalSKU} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Total Fisik Unit</div><div class="a4-kpi-tile-val">${grandTotalUnits.toLocaleString('id-ID')} Unit</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Kategori Terbesar</div><div class="a4-kpi-tile-val" style="font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${topCategory}</div></div>
      `;

      if (categoriesSorted.length === 0) {
        contentEl.innerHTML = `<div style="text-align:center; padding:36px; color:#71717A; font-weight:700;">Tidak ada kategori barang yang ditemukan dengan filter ini.</div>`;
      } else {
        let htmlTables = '';
        categoriesSorted.forEach((catName, cIdx) => {
          const catList = groupMap.get(catName);
          const catTotalQty = catList.reduce((s, i) => s + Number(i.stock || 0), 0);
          const catLow = catList.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
          const catEmpty = catList.filter(i => Number(i.stock) === 0).length;

          htmlTables += `
            <div style="margin-bottom:24px;">
              <div class="a4-category-header-bar">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="background:var(--neo-black); color:#FFFFFF; padding:2px 7px; border-radius:4px; font-size:10px;">${cIdx + 1}</span>
                  <span>KOMODITAS: ${catName.toUpperCase()}</span>
                </div>
                <div style="font-size:11px; font-weight:800; color:#52525B;">
                  ${catList.length} SKU &bull; Subtotal: <strong style="color:var(--neo-black);">${catTotalQty.toLocaleString('id-ID')} Unit</strong>
                  ${catEmpty > 0 ? ` &bull; <span style="color:#DC2626;">(${catEmpty} Habis)</span>` : ''}
                </div>
              </div>

              <table class="a4-official-table" style="margin-top:6px;">
                <thead>
                  <tr>
                    <th style="width:36px; text-align:center;">No</th>
                    <th style="width:115px;">Barcode / SKU</th>
                    <th>Nama Produk</th>
                    <th style="width:75px;">Lantai</th>
                    <th style="width:90px;">Lokasi Rak</th>
                    <th style="width:65px; text-align:right;">Min</th>
                    <th style="width:75px; text-align:right;">Fisik</th>
                    <th style="width:65px; text-align:center;">Satuan</th>
                    <th style="width:80px; text-align:center;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${catList.map((it, idx) => {
            const st = it.stock <= 0 ? 'HABIS' : (it.stock <= it.minStock ? 'MENIPIS' : 'AMAN');
            const badgeStyle = st === 'HABIS' ? 'background:#FEF2F2; color:#991B1B; border:1px solid #F87171;' : (st === 'MENIPIS' ? 'background:#FFFBEB; color:#92400E; border:1px solid #FCD34D;' : 'background:#F0FDF4; color:#166534; border:1px solid #86EFAC;');
            return `
                      <tr>
                        <td style="text-align:center; font-family:var(--font-mono);">${idx + 1}</td>
                        <td><code>${it.barcode || it.sku}</code></td>
                        <td><strong>${it.name}</strong></td>
                        <td>${this.floorLabel(it.floorId)}</td>
                        <td>${it.location || '-'}</td>
                        <td style="text-align:right; font-family:var(--font-mono);">${it.minStock}</td>
                        <td style="text-align:right; font-family:var(--font-mono); font-weight:800;">${it.stock}</td>
                        <td style="text-align:center;">${it.unit}</td>
                        <td style="text-align:center;"><span style="font-size:9px; font-weight:800; padding:2px 5px; border-radius:3px; ${badgeStyle}">${st}</span></td>
                      </tr>
                    `;
          }).join('')}
                </tbody>
                <tfoot>
                  <tr class="a4-subtotal-tr">
                    <td colspan="5" style="text-align:right; font-weight:900;">Subtotal Kategori ${catName}:</td>
                    <td colspan="2" style="text-align:right; font-family:var(--font-mono); font-weight:900;">${catTotalQty.toLocaleString('id-ID')} Unit</td>
                    <td colspan="2" style="text-align:center; font-size:10.5px;">${catList.length} item</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          `;
        });

        // Append grand total block
        htmlTables += `
          <div style="background:#F4F4F5; border:2.5px solid var(--neo-border); border-radius:8px; padding:12px 18px; margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:13px; font-weight:900; text-transform:uppercase;">TOTAL SELURUH JENIS / KATEGORI (${categoriesSorted.length} Komoditas):</div>
            <div style="font-size:15px; font-weight:900; font-family:var(--font-mono);">${grandTotalUnits.toLocaleString('id-ID')} UNIT (${grandTotalSKU} SKU)</div>
          </div>
        `;

        contentEl.innerHTML = htmlTables;
      }
    }

    // ------------------------------------------------------------------------
    // BRANCH 3: LEMBAR PENGADAAN RESTOCK (RESTOCK_ORDER)
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'RESTOCK_ORDER') {
      badgeEl.textContent = 'JENIS 3 · LEMBAR PENGADAAN & SURAT RESTOCK';
      titleEl.textContent = 'SURAT PESANAN RESTOCK BARANG MENIPIS & HABIS';
      regNumEl.textContent = `RST-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Surat Pesanan Restock (${flLabel})`;

      if (cat !== 'ALL') {
        items = items.filter(i => i.category && i.category.trim() === cat);
      }

      // Priority filter: ALL (stock <= minStock), HABIS (stock <= 0), MENIPIS (stock > 0 && stock <= minStock)
      let restockItems = [];
      if (pri === 'HABIS') {
        restockItems = items.filter(i => Number(i.stock) <= 0);
      } else if (pri === 'MENIPIS') {
        restockItems = items.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.minStock));
      } else {
        restockItems = items.filter(i => Number(i.stock) <= Number(i.minStock));
      }

      const emptyCnt = restockItems.filter(i => Number(i.stock) <= 0).length;
      const lowCnt = restockItems.filter(i => Number(i.stock) > 0).length;
      const recTotal = restockItems.reduce((s, i) => s + Math.max(10, (i.minStock * 3) - i.stock), 0);

      if (countBadge) countBadge.textContent = `Menampilkan ${restockItems.length} SKU perlu restock`;

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Perlu Di-Order</div><div class="a4-kpi-tile-val">${restockItems.length} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Status Habis (0)</div><div class="a4-kpi-tile-val" style="color:#DC2626;">${emptyCnt} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Status Menipis</div><div class="a4-kpi-tile-val" style="color:#D97706;">${lowCnt} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Estimasi Order Unit</div><div class="a4-kpi-tile-val">${recTotal.toLocaleString('id-ID')} Unit</div></div>
      `;

      contentEl.innerHTML = `
        <table class="a4-official-table">
          <thead>
            <tr>
              <th style="width:36px; text-align:center;">No</th>
              <th style="width:75px;">Lantai</th>
              <th style="width:120px;">Kategori</th>
              <th style="width:85px;">Lokasi Rak</th>
              <th style="width:115px;">Barcode / SKU</th>
              <th>Nama Produk</th>
              <th style="width:70px; text-align:right;">Sisa Stok</th>
              <th style="width:65px; text-align:right;">Batas Min</th>
              <th style="width:85px; text-align:right;">Saran Order</th>
              <th style="width:110px; text-align:center;">Order Aktual</th>
            </tr>
          </thead>
          <tbody>
            ${restockItems.length === 0 ? `
              <tr><td colspan="10" style="text-align:center; padding:28px; color:#166534; font-weight:800;">Seluruh stok barang pada lantai ini dalam kondisi cukup. Tidak ada barang yang memerlukan restock mendesak saat ini.</td></tr>
            ` : restockItems.map((it, idx) => {
        const suggest = Math.max(10, (it.minStock * 3) - it.stock);
        const isZero = Number(it.stock) <= 0;
        return `
                <tr>
                  <td style="text-align:center; font-family:var(--font-mono);">${idx + 1}</td>
                  <td><strong>${this.floorLabel(it.floorId)}</strong></td>
                  <td>${it.category || 'Umum'}</td>
                  <td>${it.location || '-'}</td>
                  <td><code>${it.barcode || it.sku}</code></td>
                  <td><strong>${it.name}</strong></td>
                  <td style="text-align:right; font-family:var(--font-mono); font-weight:800; ${isZero ? 'color:#DC2626;' : 'color:#D97706;'}">${it.stock} ${it.unit}</td>
                  <td style="text-align:right; font-family:var(--font-mono);">${it.minStock} ${it.unit}</td>
                  <td style="text-align:right; font-family:var(--font-mono); font-weight:800; color:#1D4ED8;">+${suggest} ${it.unit}</td>
                  <td style="text-align:center; font-family:var(--font-mono); color:#71717A;">...... ${it.unit}</td>
                </tr>
              `;
      }).join('')}
          </tbody>
          <tfoot>
            <tr class="a4-subtotal-tr">
              <td colspan="7" style="text-align:right; font-weight:900;">TOTAL ESTIMASI KEBUTUHAN UNIT RESTOCK:</td>
              <td colspan="2" style="text-align:right; font-family:var(--font-mono); font-weight:900; font-size:12px;">+${recTotal.toLocaleString('id-ID')} Unit</td>
              <td style="text-align:center; font-weight:800;">${restockItems.length} SKU</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    // ------------------------------------------------------------------------
    // BRANCH 4: REKAPITULASI EKSEKUTIF 3 LANTAI (EXECUTIVE_SUMMARY)
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'EXECUTIVE_SUMMARY') {
      badgeEl.textContent = 'JENIS 4 · REKAPITULASI EKSEKUTIF PIMPINAN';
      titleEl.textContent = 'RINGKASAN EKSEKUTIF KESIAPAN STOK 3 LANTAI';
      regNumEl.textContent = `EXC-BLS-ALL-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = 'Rekapitulasi Eksekutif (Lantai 1 - Lantai 3)';

      const allItems = this.state.items || [];
      const totalStoreUnits = allItems.reduce((s, i) => s + Number(i.stock || 0), 0);
      const totalStoreSKU = allItems.length;
      const totalStoreEmpty = allItems.filter(i => Number(i.stock) <= 0).length;
      const totalStoreLow = allItems.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.minStock)).length;
      const totalStoreSafe = Math.max(0, totalStoreSKU - (totalStoreEmpty + totalStoreLow));
      const storeReadyRate = totalStoreSKU > 0 ? Math.round((totalStoreSafe / totalStoreSKU) * 100) : 100;

      if (countBadge) countBadge.textContent = `Kesiapan Gudang: ${storeReadyRate}%`;

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Total Portofolio SKU</div><div class="a4-kpi-tile-val">${totalStoreSKU} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Valuasi Fisik Unit</div><div class="a4-kpi-tile-val">${totalStoreUnits.toLocaleString('id-ID')} Unit</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Tingkat Kesiapan</div><div class="a4-kpi-tile-val" style="color:#166534;">${storeReadyRate}% SIAP</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Defisit Kritis (Habis)</div><div class="a4-kpi-tile-val" style="color:#DC2626;">${totalStoreEmpty} SKU</div></div>
      `;

      // Matrix per Lantai (L1, L2, L3)
      const floors = [
        { id: 'L1', name: 'Lantai 1', dept: 'Sembako, Minyak, Sabun, Popok & Minuman' },
        { id: 'L2', name: 'Lantai 2', dept: 'Fashion Muslim, Gamis, Koko, Sarung & Hijab' },
        { id: 'L3', name: 'Lantai 3', dept: 'Alat Masak, Dapur, Box Storage & Elektronik' }
      ];

      // Top 8 categories across store
      const catVolumeMap = new Map();
      allItems.forEach(i => {
        const c = i.category || 'Umum';
        const cur = catVolumeMap.get(c) || { count: 0, qty: 0 };
        cur.count += 1;
        cur.qty += Number(i.stock || 0);
        catVolumeMap.set(c, cur);
      });
      const top8Categories = Array.from(catVolumeMap.entries())
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 8);

      contentEl.innerHTML = `
        <div style="margin-bottom:20px;">
          <div style="font-size:12px; font-weight:900; text-transform:uppercase; margin-bottom:8px; color:var(--text-main);">
            I. MATRIKS OPERASIONAL TINGKAT LANTAI FISIK (LANTAI 1 S/D 3):
          </div>
          <table class="a4-official-table" style="margin-top:4px;">
            <thead>
              <tr>
                <th style="width:40px; text-align:center;">No</th>
                <th style="width:90px;">Lantai</th>
                <th>Departemen Komoditas</th>
                <th style="width:80px; text-align:right;">Total SKU</th>
                <th style="width:85px; text-align:right;">Unit Fisik</th>
                <th style="width:65px; text-align:right;">Aman</th>
                <th style="width:65px; text-align:right;">Menipis</th>
                <th style="width:65px; text-align:right;">Habis</th>
                <th style="width:85px; text-align:center;">Kesiapan</th>
                <th style="width:80px; text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${floors.map((flDef, idx) => {
        const fItems = allItems.filter(i => i.floorId === flDef.id);
        const fQty = fItems.reduce((s, i) => s + Number(i.stock || 0), 0);
        const fLow = fItems.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.minStock)).length;
        const fEmpty = fItems.filter(i => Number(i.stock) <= 0).length;
        const fSafe = Math.max(0, fItems.length - (fLow + fEmpty));
        const fRate = fItems.length > 0 ? Math.round((fSafe / fItems.length) * 100) : 100;
        const badgeSt = fRate >= 80 ? 'background:#F0FDF4; color:#166534; border:1px solid #86EFAC;' : (fRate >= 60 ? 'background:#FFFBEB; color:#92400E; border:1px solid #FCD34D;' : 'background:#FEF2F2; color:#991B1B; border:1px solid #F87171;');
        const labelSt = fRate >= 80 ? 'PRIMA' : (fRate >= 60 ? 'WASPADA' : 'KRITIS');
        return `
                  <tr>
                    <td style="text-align:center; font-family:var(--font-mono);">${idx + 1}</td>
                    <td><strong>${flDef.name}</strong></td>
                    <td>${flDef.dept}</td>
                    <td style="text-align:right; font-family:var(--font-mono);">${fItems.length}</td>
                    <td style="text-align:right; font-family:var(--font-mono); font-weight:800;">${fQty.toLocaleString('id-ID')}</td>
                    <td style="text-align:right; font-family:var(--font-mono); color:#166534;">${fSafe}</td>
                    <td style="text-align:right; font-family:var(--font-mono); color:#D97706;">${fLow}</td>
                    <td style="text-align:right; font-family:var(--font-mono); color:#DC2626;">${fEmpty}</td>
                    <td style="text-align:center; font-family:var(--font-mono); font-weight:800;">${fRate}%</td>
                    <td style="text-align:center;"><span style="font-size:9.5px; font-weight:900; padding:2px 6px; border-radius:4px; ${badgeSt}">${labelSt}</span></td>
                  </tr>
                `;
      }).join('')}
            </tbody>
            <tfoot>
              <tr class="a4-subtotal-tr">
                <td colspan="3" style="text-align:right; font-weight:900;">KONSOLIDASI 3 LANTAI BULUSARI:</td>
                <td style="text-align:right; font-family:var(--font-mono); font-weight:900;">${totalStoreSKU} SKU</td>
                <td style="text-align:right; font-family:var(--font-mono); font-weight:900;">${totalStoreUnits.toLocaleString('id-ID')} Unit</td>
                <td style="text-align:right; font-family:var(--font-mono); color:#166534; font-weight:900;">${totalStoreSafe}</td>
                <td style="text-align:right; font-family:var(--font-mono); color:#D97706; font-weight:900;">${totalStoreLow}</td>
                <td style="text-align:right; font-family:var(--font-mono); color:#DC2626; font-weight:900;">${totalStoreEmpty}</td>
                <td style="text-align:center; font-family:var(--font-mono); font-weight:900;">${storeReadyRate}%</td>
                <td style="text-align:center; font-weight:900;">SEHAT</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div>
          <div style="font-size:12px; font-weight:900; text-transform:uppercase; margin-bottom:8px; color:var(--text-main);">
            II. TOP 8 KATEGORI / JENIS DENGAN VOLUME FISIK TERBESAR:
          </div>
          <table class="a4-official-table" style="margin-top:4px;">
            <thead>
              <tr>
                <th style="width:40px; text-align:center;">Ranking</th>
                <th>Nama Komoditas / Jenis Barang</th>
                <th style="width:110px; text-align:right;">Jumlah SKU</th>
                <th style="width:120px; text-align:right;">Total Volume Unit</th>
                <th style="width:120px; text-align:right;">Porsi Volume</th>
              </tr>
            </thead>
            <tbody>
              ${top8Categories.map(([cName, cStats], idx) => {
        const pct = totalStoreUnits > 0 ? ((cStats.qty / totalStoreUnits) * 100).toFixed(1) : 0;
        return `
                  <tr>
                    <td style="text-align:center; font-family:var(--font-mono); font-weight:800;">#${idx + 1}</td>
                    <td><strong>${cName}</strong></td>
                    <td style="text-align:right; font-family:var(--font-mono);">${cStats.count} SKU</td>
                    <td style="text-align:right; font-family:var(--font-mono); font-weight:800;">${cStats.qty.toLocaleString('id-ID')} Unit</td>
                    <td style="text-align:right; font-family:var(--font-mono);">${pct}%</td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // ------------------------------------------------------------------------
    // BRANCH 5: JURNAL MUTASI TRANSAKSI (MUTATION_JOURNAL)
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'MUTATION_JOURNAL') {
      badgeEl.textContent = 'JENIS 5 · JURNAL MUTASI & AUDIT STAF';
      titleEl.textContent = 'JURNAL AUDIT MUTASI KELUAR-MASUK & PINDAH LANTAI';
      regNumEl.textContent = `MUT-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Jurnal Mutasi Transaksi (${flLabel})`;

      if (staff !== 'ALL') {
        mutations = mutations.filter(m => m.user && m.user.trim() === staff);
      }

      const inCnt = mutations.filter(m => m.type === 'IN').length;
      const outCnt = mutations.filter(m => m.type === 'OUT').length;
      const opCnt = mutations.filter(m => m.type === 'OPNAME' || m.type === 'TRANSFER').length;

      if (countBadge) countBadge.textContent = `Menampilkan ${mutations.length} catatan mutasi`;

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Total Transaksi</div><div class="a4-kpi-tile-val">${mutations.length} Entri</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Barang Masuk (IN)</div><div class="a4-kpi-tile-val" style="color:#166534;">${inCnt} Entri</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Barang Keluar (OUT)</div><div class="a4-kpi-tile-val" style="color:#DC2626;">${outCnt} Entri</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Opname / Transfer</div><div class="a4-kpi-tile-val" style="color:#1D4ED8;">${opCnt} Entri</div></div>
      `;

      contentEl.innerHTML = `
        <table class="a4-official-table">
          <thead>
            <tr>
              <th style="width:36px; text-align:center;">No</th>
              <th style="width:125px;">Waktu Transaksi</th>
              <th style="width:90px;">Kode Transaksi</th>
              <th style="width:65px; text-align:center;">Jenis</th>
              <th style="width:75px;">Lantai</th>
              <th>Nama Barang</th>
              <th style="width:75px; text-align:right;">Jumlah</th>
              <th style="width:95px;">Petugas</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${mutations.length === 0 ? `
              <tr><td colspan="9" style="text-align:center; padding:24px; color:#71717A;">Belum ada riwayat mutasi barang pada cakupan lantai ini.</td></tr>
            ` : mutations.map((m, idx) => {
        const typeSt = m.type === 'IN' ? 'background:#F0FDF4; color:#166534; border:1px solid #86EFAC;' : (m.type === 'OUT' ? 'background:#FEF2F2; color:#991B1B; border:1px solid #F87171;' : 'background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;');
        return `
                <tr>
                  <td style="text-align:center; font-family:var(--font-mono);">${idx + 1}</td>
                  <td style="font-family:var(--font-mono);">${m.timestamp}</td>
                  <td><code>${m.id}</code></td>
                  <td style="text-align:center;"><span style="font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:4px; ${typeSt}">${m.type}</span></td>
                  <td>${this.floorLabel(m.floorId)}</td>
                  <td><strong>${m.itemName}</strong></td>
                  <td style="text-align:right; font-family:var(--font-mono); font-weight:800;">${m.qty} ${m.unit || ''}</td>
                  <td><strong>${m.user || 'Fahri'}</strong></td>
                  <td>${m.note || '-'}</td>
                </tr>
              `;
      }).join('')}
          </tbody>
        </table>
      `;
    }

    // ------------------------------------------------------------------------
    // BRANCH 6: AUDIT STOCK OPNAME (OPNAME_AUDIT)
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'OPNAME_AUDIT') {
      badgeEl.textContent = 'JENIS 6 · AUDIT STOCK OPNAME';
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

      if (countBadge) countBadge.textContent = `Menampilkan ${rows.length} barang opname`;

      summaryEl.innerHTML = `
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Sesi Opname</div><div class="a4-kpi-tile-val">${soGroups.length} Sesi</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Barang Diaudit</div><div class="a4-kpi-tile-val">${rows.length} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Stok Sesuai (0)</div><div class="a4-kpi-tile-val" style="color:#166534;">${matchCnt} SKU</div></div>
        <div class="a4-kpi-tile"><div class="a4-kpi-tile-lbl">Tingkat Kecocokan</div><div class="a4-kpi-tile-val">${matchRate}%</div></div>
      `;

      contentEl.innerHTML = `
        <table class="a4-official-table">
          <thead>
            <tr>
              <th style="width:36px; text-align:center;">No</th>
              <th style="width:130px;">Kelompok Opname</th>
              <th style="width:75px;">Lantai</th>
              <th style="width:115px;">Barcode / SKU</th>
              <th>Nama Produk</th>
              <th style="width:75px; text-align:right;">Sistem</th>
              <th style="width:75px; text-align:right;">Fisik</th>
              <th style="width:75px; text-align:right;">Selisih (+/-)</th>
              <th style="width:100px; text-align:center;">Status Audit</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length === 0 ? `
              <tr><td colspan="9" style="text-align:center; padding:24px; color:#71717A;">Belum ada sesi hasil scan opname yang tercatat pada cakupan lantai ini.</td></tr>
            ` : rows.map((r, idx) => {
        const diff = Number(r.countedQty) - Number(r.systemQty);
        const status = diff === 0 ? 'COCOK' : (diff > 0 ? 'SELISIH LEBIH' : 'SELISIH KURANG');
        const badgeSt = diff === 0 ? 'background:#F0FDF4; color:#166534; border:1px solid #86EFAC;' : 'background:#FEF2F2; color:#991B1B; border:1px solid #F87171;';
        return `
                <tr>
                  <td style="text-align:center; font-family:var(--font-mono);">${idx + 1}</td>
                  <td>${r.groupName}</td>
                  <td><strong>${this.floorLabel(r.floorId)}</strong></td>
                  <td><code>${r.barcode || r.sku}</code></td>
                  <td><strong>${r.name}</strong></td>
                  <td style="text-align:right; font-family:var(--font-mono);">${r.systemQty}</td>
                  <td style="text-align:right; font-family:var(--font-mono); font-weight:800;">${r.countedQty}</td>
                  <td style="text-align:right; font-family:var(--font-mono); font-weight:800; ${diff !== 0 ? 'color:#DC2626;' : 'color:#166534;'}">${diff > 0 ? '+' + diff : diff}</td>
                  <td style="text-align:center;"><span style="font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:4px; ${badgeSt}">${status}</span></td>
                </tr>
              `;
      }).join('')}
          </tbody>
        </table>
      `;
    }

    // ------------------------------------------------------------------------
    // BRANCH 7: KATALOG BARCODE RAK A4 (BARCODE_CATALOG)
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'BARCODE_CATALOG') {
      badgeEl.textContent = 'JENIS 7 · KATALOG BARCODE RAK';
      titleEl.textContent = 'LEMBAR CETAK STIKER LABEL BARCODE RAK GUDANG';
      regNumEl.textContent = `LBL-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Katalog Label Barcode Rak (${flLabel})`;

      if (cat !== 'ALL') {
        items = items.filter(i => i.category && i.category.trim() === cat);
      }

      if (countBadge) countBadge.textContent = `Menampilkan ${items.length} label barcode`;

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
              <div style="font-size:9.5px; font-weight:800; color:#52525B; text-transform:uppercase;">
                ISTIQOMAH BULUSARI · ${this.floorLabel(it.floorId)} · ${it.location || 'Rak'}
              </div>
              <div style="font-size:12.5px; font-weight:800; color:#18181B; margin:6px 0 8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${it.name}
              </div>
              <div>${IstiqomahUtils.generateBarcodeSvg(it.barcode, 38)}</div>
              <div style="font-family:var(--font-mono); font-size:11px; font-weight:800; margin-top:5px; color:#18181B;">
                ${it.barcode} (${it.sku})
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // ------------------------------------------------------------------------
    // BRANCH 8: LEMBAR KERJA FISIK MANUAL (BLANK_WORKSHEET)
    // ------------------------------------------------------------------------
    else if (this.activeReportBranch === 'BLANK_WORKSHEET') {
      badgeEl.textContent = 'JENIS 8 · LEMBAR KERJA FISIK (CLIPBOARD)';
      titleEl.textContent = 'FORMULIR LEMBAR KERJA STOCK OPNAME MANUAL GUDANG';
      regNumEl.textContent = `WKS-BLS-${fl}-${IstiqomahUtils.formatDateOnly()}`;
      activeBadgeTitle.textContent = `Lembar Kerja Fisik (${flLabel})`;

      if (cat !== 'ALL') {
        items = items.filter(i => i.category && i.category.trim() === cat);
      }

      if (countBadge) countBadge.textContent = `Menampilkan ${items.length} baris lembar kerja`;

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
              <th style="width:36px; text-align:center;">No</th>
              <th style="width:75px;">Lantai</th>
              <th style="width:85px;">Lokasi Rak</th>
              <th style="width:115px;">Barcode / SKU</th>
              <th>Nama Produk</th>
              <th style="width:65px; text-align:center;">Satuan</th>
              <th style="width:75px; text-align:right;">Sistem</th>
              <th style="width:90px; text-align:center;">Hitung Fisik 1</th>
              <th style="width:90px; text-align:center;">Hitung Fisik 2</th>
              <th style="width:95px; text-align:center;">Paraf</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr>
                <td style="text-align:center; font-family:var(--font-mono);">${idx + 1}</td>
                <td><strong>${this.floorLabel(it.floorId)}</strong></td>
                <td>${it.location || '-'}</td>
                <td><code>${it.barcode || it.sku}</code></td>
                <td><strong>${it.name}</strong></td>
                <td style="text-align:center;">${it.unit}</td>
                <td style="text-align:right; font-family:var(--font-mono);">${it.stock}</td>
                <td style="width:85px;">&nbsp;</td>
                <td style="width:85px;">&nbsp;</td>
                <td style="width:90px;">&nbsp;</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
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
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #fff;
            color: #18181B;
            padding: 20px 26px;
            font-size: 10.5pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          .a4-doc-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #18181B; padding-bottom: 12px; margin-bottom: 14px; }
          .a4-doc-stamp { display: inline-block; padding: 2px 8px; background: #F4F4F5; color: #18181B; border: 1.5px solid #18181B; border-radius: 4px; font-size: 8pt; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
          .a4-kpi-summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
          .a4-kpi-tile { background: #FAFAFA; border: 1.5px solid #18181B; border-radius: 6px; padding: 8px 12px; }
          .a4-kpi-tile-lbl { font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #71717A; }
          .a4-kpi-tile-val { font-size: 13pt; font-weight: 900; color: #18181B; margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
          .a4-official-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; border: 2px solid #18181B; font-size: 9.5pt; }
          .a4-official-table th { background: #F4F4F5; color: #18181B; font-size: 8pt; font-weight: 900; text-transform: uppercase; padding: 6px 8px; text-align: left; border: 1.5px solid #18181B; }
          .a4-official-table td { padding: 6px 8px; border: 1px solid #D4D4D8; color: #18181B; vertical-align: middle; }
          .a4-official-table tr:nth-child(even) td { background: #FAFAFA; }
          .a4-category-header-bar { background: #F4F4F5; border: 2px solid #18181B; border-radius: 4px; padding: 6px 12px; font-weight: 900; font-size: 10pt; text-transform: uppercase; display: flex; justify-content: space-between; margin-top: 16px; margin-bottom: 4px; }
          .a4-subtotal-tr td { background: #F4F4F5 !important; font-weight: 900 !important; border-top: 2px solid #18181B !important; border-bottom: 2px solid #18181B !important; }
          .a4-barcode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
          .a4-barcode-cell { border: 1.5px solid #18181B; border-radius: 6px; padding: 10px; text-align: center; page-break-inside: avoid; }
          .a4-signatures-block { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 28px; padding-top: 16px; border-top: 1.5px dashed #A1A1AA; text-align: center; font-size: 9pt; }
          .a4-signature-line { margin-top: 48px; border-top: 1.5px solid #18181B; padding-top: 4px; font-weight: 900; font-size: 10pt; }
          code { font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; font-weight: 700; }
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
    const cat = this.reportCategoryFilter;
    const pri = this.reportPriorityFilter;
    const staff = this.reportStaffFilter;
    const branch = this.activeReportBranch;

    let items = (this.state.items || []).filter(i => fl === 'ALL' || i.floorId === fl);
    if (cat !== 'ALL' && (branch === 'STOCK_RECAP' || branch === 'CATEGORY' || branch === 'RESTOCK_ORDER' || branch === 'BLANK_WORKSHEET' || branch === 'BARCODE_CATALOG')) {
      items = items.filter(i => i.category && i.category.trim() === cat);
    }

    let csv = '';

    if (branch === 'CATEGORY') {
      csv = 'Komoditas/Kategori,Lantai,Lokasi Rak,Barcode,SKU,Nama Produk,Stok Fisik,Batas Min,Satuan,Status\n';
      items.forEach(i => {
        const st = i.stock <= 0 ? 'HABIS' : (i.stock <= i.minStock ? 'MENIPIS' : 'AMAN');
        csv += `"${i.category || 'Umum'}","${this.floorLabel(i.floorId)}","${i.location || '-'}","${i.barcode}","${i.sku}","${i.name}",${i.stock},${i.minStock},"${i.unit}","${st}"\n`;
      });
    } else if (branch === 'RESTOCK_ORDER') {
      let rItems = items;
      if (pri === 'HABIS') {
        rItems = items.filter(i => Number(i.stock) <= 0);
      } else if (pri === 'MENIPIS') {
        rItems = items.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.minStock));
      } else {
        rItems = items.filter(i => Number(i.stock) <= Number(i.minStock));
      }
      csv = 'Lantai,Kategori,Lokasi Rak,SKU,Barcode,Nama Produk,Sisa Stok,Batas Min,Satuan,Saran Order,Rencana Order Aktual\n';
      rItems.forEach(i => {
        const suggest = Math.max(10, (i.minStock * 3) - i.stock);
        csv += `"${this.floorLabel(i.floorId)}","${i.category || 'Umum'}","${i.location || '-'}","${i.sku}","${i.barcode}","${i.name}",${i.stock},${i.minStock},"${i.unit}",${suggest},""\n`;
      });
    } else if (branch === 'MUTATION_JOURNAL') {
      let muts = (this.state.mutations || []).filter(m => fl === 'ALL' || m.floorId === fl);
      if (staff !== 'ALL') {
        muts = muts.filter(m => m.user && m.user.trim() === staff);
      }
      csv = 'Waktu Transaksi,Kode Mutasi,Jenis,Lantai,Nama Barang,Jumlah,Satuan,Petugas,Keterangan\n';
      muts.forEach(m => {
        csv += `"${m.timestamp}","${m.id}","${m.type}","${this.floorLabel(m.floorId)}","${m.itemName}",${m.qty},"${m.unit || ''}","${m.user || 'Fahri'}","${m.note || ''}"\n`;
      });
    } else if (branch === 'OPNAME_AUDIT') {
      csv = 'Kelompok Opname,Lantai,Barcode,SKU,Nama Barang,Stok Sistem,Fisik Dihitung,Selisih,Status Audit\n';
      const soGroups = (this.state.soGroups || []).filter(g => fl === 'ALL' || g.floorId === fl);
      soGroups.forEach(g => {
        (g.entries || []).forEach(r => {
          const diff = Number(r.countedQty) - Number(r.systemQty);
          const st = diff === 0 ? 'COCOK' : (diff > 0 ? 'SELISIH LEBIH' : 'SELISIH KURANG');
          csv += `"${g.name}","${this.floorLabel(g.floorId)}","${r.barcode}","${r.sku}","${r.name}",${r.systemQty},${r.countedQty},${diff},"${st}"\n`;
        });
      });
    } else if (branch === 'EXECUTIVE_SUMMARY') {
      csv = 'Lantai,Departemen,Total SKU,Unit Fisik,Aman,Menipis,Habis,Kesiapan Persen,Status\n';
      const allItems = this.state.items || [];
      [
        { id: 'L1', name: 'Lantai 1', dept: 'Sembako, Minyak, Sabun, Popok & Minuman' },
        { id: 'L2', name: 'Lantai 2', dept: 'Fashion Muslim, Gamis, Koko, Sarung & Hijab' },
        { id: 'L3', name: 'Lantai 3', dept: 'Alat Masak, Dapur, Box Storage & Elektronik' }
      ].forEach(f => {
        const fItems = allItems.filter(i => i.floorId === f.id);
        const fQty = fItems.reduce((s, i) => s + Number(i.stock || 0), 0);
        const fLow = fItems.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.minStock)).length;
        const fEmpty = fItems.filter(i => Number(i.stock) <= 0).length;
        const fSafe = Math.max(0, fItems.length - (fLow + fEmpty));
        const fRate = fItems.length > 0 ? Math.round((fSafe / fItems.length) * 100) : 100;
        csv += `"${f.name}","${f.dept}",${fItems.length},${fQty},${fSafe},${fLow},${fEmpty},"${fRate}%","${fRate >= 80 ? 'PRIMA' : 'WASPADA'}"\n`;
      });
    } else {
      csv = 'Lantai,Kategori,Lokasi Rak,SKU,Barcode,Nama Produk,Stok Fisik,Batas Min,Satuan,Status\n';
      items.forEach(i => {
        const st = i.stock <= 0 ? 'HABIS' : (i.stock <= i.minStock ? 'MENIPIS' : 'AMAN');
        csv += `"${this.floorLabel(i.floorId)}","${i.category || 'Umum'}","${i.location || '-'}","${i.sku}","${i.barcode}","${i.name}",${i.stock},${i.minStock},"${i.unit}","${st}"\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `Laporan_${branch}_${fl}_${IstiqomahUtils.formatDateOnly()}.csv`);
    IstiqomahSound.playSuccess();
    this.showToast(`Laporan diekspor ke CSV`);
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
    this.showToast(this.engine.wifiSyncEnabled ? 'Wi-Fi diaktifkan' : 'Wi-Fi dinonaktifkan');
  },

  async manualWifiSync() {
    IstiqomahSound.playClick();
    this.engine.setWifiSyncEnabled(true);
    const ok = await this.engine.pushWifiSync(this.state);
    await this.engine.pullWifiSync();
    this.updateWifiStatusUI();
    if (ok) {
      IstiqomahSound.playSuccess();
      this.showToast('Data disinkronkan via Wi-Fi');
    } else {
      this.showToast('Server Wi-Fi tidak terhubung');
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
    this.showToast('Cadangan JSON diunduh');
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
    this.showToast(`Cadangan ${this.floorLabel(floorId)} diekspor`);
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
    this.showToast('File CSV diunduh');
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
    this.showToast('Arsip ZIP diunduh');
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
            this.showToast(`Data ${this.floorLabel(fl)} diperbarui (${count} barang)`);
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
            this.showToast('Seluruh database berhasil dipulihkan');
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
            this.showToast(`Berhasil menambahkan ${addedCount} barang baru`);
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
      this.showToast('Hanya Admin yang berwenang mereset stok');
      return;
    }

    const conf = prompt("PERINGATAN!\nSeluruh jumlah stok di Lantai 1, 2, dan 3 akan disetel ke 0.\nKetik 'RESET STOK' untuk melanjutkan:", "");
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
      this.showToast('Semua stok direset ke 0');
    }
  },
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
    this.showToast(`Beralih ke akun ${target.name || target.username}`);
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
      this.showToast('Konfirmasi PIN tidak cocok');
      return;
    }

    const current = this.getCurrentUser();
    current.password = newPass;
    this.engine.saveState(this.state, current.username);
    this.closeModal('passwordModal');
    IstiqomahSound.playSuccess();
    this.showToast('PIN diperbarui');
  },

  openUserModal() {
    IstiqomahSound.playClick();
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      IstiqomahSound.playError();
      this.showToast('Hanya Admin yang dapat menambah akun');
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
      this.showToast(`Username "${username}" sudah digunakan`);
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
    this.showToast(`Akun "${name}" ditambahkan`);
  },

  deleteAccount(userId) {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'ADMIN') {
      IstiqomahSound.playError();
      this.showToast('Hanya Admin yang dapat menghapus akun');
      return;
    }
    if (userId === 'usr_fahri') {
      IstiqomahSound.playError();
      this.showToast('Akun admin utama tidak dapat dihapus');
      return;
    }

    const target = this.state.users.find(u => u.id === userId);
    if (!target) return;
    if (!confirm(`Hapus akun petugas "${target.name || target.username}"?`)) return;

    this.state.users = (this.state.users || []).filter(u => u.id !== userId);
    this.engine.saveState(this.state, currentUser.username);
    IstiqomahSound.playStockSubtract();
    this.renderAll();
    this.showToast(`Akun "${target.name || target.username}" dihapus`);
  },
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
