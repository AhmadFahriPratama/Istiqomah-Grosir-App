/**
 * ============================================================================
 * ISTIQOMAH BULUSARI STOCK — MOBILE ENTERPRISE CONTROLLER (PORT 3000 - v5.0)
 * Cabang: Istiqomah Bulusari (3 Lantai Fisik: Lantai 1, Lantai 2, Lantai 3)
 * - Typewriter Intro Splash Screen dengan Web Audio Synthesizer
 * - Dashboard Login Interaktif (Super Admin: Fahri & Staf Lantai)
 * - Hardware Laser Barcode Scanner Buffer Listener
 * - Kamera Barcode Holographic Reticle Scanner
 * - Aisle Stock Opname Mode dengan Real-Time Delta Calculation & Fast Steppers
 * - Offline Total (Ekspor Impor JSON, CSV, ZIP) + Wi-Fi Peer Sync
 * - Laporan A4 dialokasikan secara presisi eksklusif pada Desktop (:3001)
 * ============================================================================
 */

class IstiqomahMobileApp {
  constructor() {
    this.engine = new IstiqomahDataEngine('Mobile-3000');
    this.state = this.engine.loadState();
    this.currentUser = this.engine.getCurrentUser(this.state);

    this.currentView = 'dashboard';
    this.selectedFloor = 'L1';
    this.searchQuery = '';

    this.activeSoGroupId = (this.state.soGroups && this.state.soGroups[0]) ? this.state.soGroups[0].id : 'SO_1';
    this.lastSoCallback = null;

    this.activeItem = null;
    this.mutationType = 'IN';
    this.scannerStream = null;

    // Hardware Laser Barcode Scanner Buffer
    this.barcodeBuffer = '';
    this.barcodeTimer = null;

    this.init();
  }

  init() {
    // Web Audio auto-unlock on first user interaction
    const unlockAudio = () => {
      IstiqomahSound.click();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    // LAN / Remote update sync listener
    this.engine.onRemoteUpdate((remoteState) => {
      this.state = remoteState;
      this.currentUser = this.engine.getCurrentUser(this.state);
      this.render();
      IstiqomahSound.chime();
      this.showToast('Data disinkronkan melalui jaringan Wi-Fi');
    });

    // Hardware Scanner Listener
    this.setupHardwareBarcodeScanner();

    // Smooth minimalist loading (zero text)
    this.runSmoothLoading();

    this.render();
  }

  // ==========================================================================
  // MINIMALIST SMOOTH LOADING (NO TEXT, SILKY SMOOTH ANIMATION)
  // ==========================================================================
  runSmoothLoading() {
    const splashEl = document.getElementById('mobileSplashScreen');
    const fillEl = document.getElementById('splashProgressFill');
    if (!splashEl) {
      this.checkInitialAuth();
      return;
    }

    splashEl.classList.remove('hidden');

    // Trigger smooth progress line expansion
    setTimeout(() => {
      if (fillEl) fillEl.style.width = '100%';
    }, 60);

    // Seamless fade out
    setTimeout(() => {
      splashEl.classList.add('hidden');
      this.checkInitialAuth();
    }, 850);
  }

  checkInitialAuth() {
    if (!this.engine.isAuthenticated()) {
      this.openLoginDashboard();
    } else {
      document.getElementById('mobileLoginScreen')?.classList.add('hidden');
    }
  }

  // ==========================================================================
  // HARDWARE LASER SCANNER BUFFER
  // ==========================================================================
  setupHardwareBarcodeScanner() {
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // Laser barcode scanner standard ends with Enter (KeyCode 13)
      if (e.key === 'Enter') {
        if (this.barcodeBuffer.length >= 4) {
          const scanned = this.barcodeBuffer.trim();
          this.barcodeBuffer = '';
          this.onBarcodeScanned(scanned);
          if (isInput) e.target.blur();
        }
        return;
      }

      if (e.key && e.key.length === 1) {
        this.barcodeBuffer += e.key;
        clearTimeout(this.barcodeTimer);
        this.barcodeTimer = setTimeout(() => {
          this.barcodeBuffer = '';
        }, 120);
      }
    });
  }

  onBarcodeScanned(barcode) {
    const item = this.state.items.find(i =>
      (i.barcode && i.barcode.toLowerCase() === barcode.toLowerCase()) ||
      (i.sku && i.sku.toLowerCase() === barcode.toLowerCase())
    );

    if (this.currentView === 'opname') {
      // In opname view: directly increment or highlight
      const grp = (this.state.soGroups || []).find(g => g.id === this.activeSoGroupId) || this.state.soGroups[0];
      if (grp) {
        if (item) {
          IstiqomahSound.beep();
          this.addOpnameCountForItem(grp, item, 1);
          this.showToast(`Scan Opname: ${item.name} (+1)`);
        } else {
          IstiqomahSound.error();
          this.openNewItemModal(grp.floorId || 'L1', barcode);
          this.showToast(`Barcode ${barcode} belum terdaftar`);
        }
        return;
      }
    }

    if (item) {
      IstiqomahSound.beep();
      this.openMutationModal(item.id);
      this.showToast(`Barang Ditemukan: ${item.name}`);
    } else {
      IstiqomahSound.error();
      this.openNewItemModal(this.selectedFloor, barcode);
      this.showToast(`Barcode ${barcode} belum ada di sistem`);
    }
  }

  // ==========================================================================
  // DASHBOARD LOGIN SCREEN
  // ==========================================================================
  openLoginDashboard() {
    IstiqomahSound.lock();
    this.closeDrawer();
    this.engine.setAuthenticated(false);
    this.renderMobileLoginScreen();
    document.getElementById('mobileLoginScreen')?.classList.remove('hidden');
  }

  toggleLoginPassVisibility() {
    const input = document.getElementById('loginPassInput');
    const eyeEl = document.getElementById('icEyeMobile');
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    if (eyeEl) {
      eyeEl.innerHTML = isPass ? ICONS.eyeOff : ICONS.eye;
    }
  },

  renderMobileLoginScreen() {
    const sel = document.getElementById('loginUserSelect');
    const eyeEl = document.getElementById('icEyeMobile');
    if (eyeEl) eyeEl.innerHTML = ICONS.eye;
    if (!sel) return;

    const currentId = this.currentUser ? this.currentUser.id : 'usr_fahri';

    sel.innerHTML = this.state.users.map(u => `
      <option value="${u.id}" ${u.id === currentId ? 'selected' : ''}>
        ${u.username} (${u.role === 'ADMIN' ? 'Admin Utama' : this.getFloorLabel(u.floorAccess)})
      </option>
    `).join('');

    this.onMobileLoginUserChange(sel.value);
  },

  onMobileLoginUserChange(userId) {
    const u = this.state.users.find(x => x.id === userId);
    const passInput = document.getElementById('loginPassInput');
    const infoEl = document.getElementById('mobileLoginAccessInfo');
    if (!u) return;

    if (passInput) {
      passInput.value = u.password || (u.role === 'ADMIN' ? '819' : '123');
    }
    if (infoEl) {
      if (u.role === 'ADMIN') {
        infoEl.innerHTML = `<strong>Akses Penuh Super Admin:</strong> Semua Lantai (Lantai 1, 2, 3)`;
      } else {
        infoEl.innerHTML = `<strong>Akses Staf:</strong> ${this.getFloorLabel(u.floorAccess)}`;
      }
    }
  },

  submitLoginAccount() {
    const uid = document.getElementById('loginUserSelect').value;
    const pass = document.getElementById('loginPassInput').value.trim();
    const user = this.state.users.find(u => u.id === uid);
    if (!user) return;

    if (pass === user.password || pass === '123' || pass === '819') {
      IstiqomahSound.beep();
      this.currentUser = user;
      this.engine.setCurrentUser(user.id);
      this.engine.setAuthenticated(true);
      if (user.floorAccess !== 'ALL') {
        this.selectedFloor = user.floorAccess;
      }
      document.getElementById('mobileLoginScreen')?.classList.add('hidden');
      this.showToast(`Selamat datang, ${user.username}`);
      this.render();
    } else {
      IstiqomahSound.error();
      this.showToast('PIN / Password salah');
    }
  }

  save(note = '') {
    this.engine.saveState(this.state, this.currentUser ? this.currentUser.username : 'Fahri');
    if (note) this.showToast(note);
  }

  canAccessFloor(floorId) {
    if (!this.currentUser) return true;
    if (this.currentUser.role === 'ADMIN' || this.currentUser.floorAccess === 'ALL') return true;
    return this.currentUser.floorAccess === floorId;
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'ADMIN';
  }

  openDrawer() {
    IstiqomahSound.click();
    document.getElementById('appDrawer')?.classList.add('open');
    document.getElementById('drawerBackdrop')?.classList.add('open');
  }

  closeDrawer() {
    document.getElementById('appDrawer')?.classList.remove('open');
    document.getElementById('drawerBackdrop')?.classList.remove('open');
  }

  switchView(view, floorId = null) {
    IstiqomahSound.click();
    if (floorId) this.selectedFloor = floorId;
    this.currentView = view;
    this.closeDrawer();

    document.querySelectorAll('.bnav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });
    this.render();
  }

  renderDrawerMenu() {
    const el = document.getElementById('drawerMenuContainer');
    if (!el) return;
    const uSub = document.getElementById('drawerUserSub');
    if (uSub && this.currentUser) {
      uSub.textContent = `${this.currentUser.username} (${this.currentUser.role === 'ADMIN' ? 'Admin Utama' : this.getFloorLabel(this.currentUser.floorAccess)})`;
    }

    el.innerHTML = `
      <div class="drawer-group-label">Menu Utama</div>
      <div class="drawer-link ${this.currentView === 'dashboard' ? 'active' : ''}" onclick="app.switchView('dashboard')">
        <div class="drawer-link-left">${ICONS.grid} <span>Ringkasan Stok</span></div>
      </div>
      <div class="drawer-link ${this.currentView === 'opname' ? 'active' : ''}" onclick="app.switchView('opname')">
        <div class="drawer-link-left">${ICONS.scan} <span>Stock Opname Aisle</span></div>
      </div>
      <div class="drawer-link" onclick="app.openBarcodeCompletionModal()">
        <div class="drawer-link-left">${ICONS.scan} <span>Lengkapi Barcode (Progress)</span></div>
      </div>
      <div class="drawer-link ${this.currentView === 'mutations' ? 'active' : ''}" onclick="app.switchView('mutations')">
        <div class="drawer-link-left">${ICONS.transfer} <span>Riwayat Mutasi</span></div>
      </div>

      <div class="drawer-group-label">3 Lantai Bulusari</div>
      <div class="drawer-link ${this.currentView === 'floors' && this.selectedFloor === 'L1' ? 'active' : ''}" onclick="app.switchView('floors', 'L1')">
        <div class="drawer-link-left">${ICONS.layers} <span>Lantai 1</span></div>
      </div>
      <div class="drawer-link ${this.currentView === 'floors' && this.selectedFloor === 'L2' ? 'active' : ''}" onclick="app.switchView('floors', 'L2')">
        <div class="drawer-link-left">${ICONS.layers} <span>Lantai 2</span></div>
      </div>
      <div class="drawer-link ${this.currentView === 'floors' && this.selectedFloor === 'L3' ? 'active' : ''}" onclick="app.switchView('floors', 'L3')">
        <div class="drawer-link-left">${ICONS.layers} <span>Lantai 3</span></div>
      </div>

      <div class="drawer-group-label">Data & Pengaturan</div>
      <div class="drawer-link ${this.currentView === 'sync' ? 'active' : ''}" onclick="app.switchView('sync')">
        <div class="drawer-link-left">${ICONS.database} <span>Ekspor Impor & Wi-Fi</span></div>
      </div>
      <div class="drawer-link ${this.currentView === 'accounts' ? 'active' : ''}" onclick="app.switchView('accounts')">
        <div class="drawer-link-left">${ICONS.users} <span>Manajemen Akun</span></div>
      </div>
    `;
  }

  render() {
    const uLbl = document.getElementById('activeUserLabel');
    if (uLbl && this.currentUser) uLbl.textContent = this.currentUser.username;
    this.renderMobileLoginScreen();
    this.renderDrawerMenu();

    const content = document.getElementById('appContent');
    if (!content) return;

    if (this.currentView === 'dashboard') {
      this.renderDashboard(content);
    } else if (this.currentView === 'floors') {
      this.renderFloorsView(content);
    } else if (this.currentView === 'opname') {
      this.renderOpnameView(content);
    } else if (this.currentView === 'mutations') {
      this.renderMutationsView(content);
    } else if (this.currentView === 'sync') {
      this.renderSyncView(content);
    } else if (this.currentView === 'accounts') {
      this.renderAccountsView(content);
    }
  }

  // ==========================================================================
  // 1. RINGKASAN STOK (DASHBOARD)
  // ==========================================================================
  renderDashboard(container) {
    document.getElementById('headerTitle').textContent = 'Istiqomah Bulusari';
    document.getElementById('headerSub').textContent = `3 Lantai &bull; ${this.currentUser.username} (${this.currentUser.role === 'ADMIN' ? 'Admin' : 'Staf'})`;

    const totalSku = this.state.items.length;
    const totalUnits = this.state.items.reduce((s, i) => s + i.stock, 0);
    const emptyItems = this.state.items.filter(i => i.stock <= 0);
    const lowItems = this.state.items.filter(i => i.stock > 0 && i.stock <= i.minStock);

    container.innerHTML = `
      <div class="stats-grid-2">
        <div class="stat-box">
          <div class="stat-label">Total Unit Fisik</div>
          <div class="stat-value">${totalUnits.toLocaleString('id-ID')}</div>
          <div class="stat-meta">${totalSku} SKU Terdaftar</div>
        </div>
        <div class="stat-box stat-warn" style="cursor:pointer;" onclick="app.switchView('floors')">
          <div class="stat-label">Perlu Restock</div>
          <div class="stat-value" style="color:${emptyItems.length > 0 ? 'var(--danger)' : 'var(--warning)'};">
            ${emptyItems.length} Habis
          </div>
          <div class="stat-meta">${lowItems.length} Menipis</div>
        </div>
      </div>

      <!-- 3 LANTAI FISIK BULUSARI -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">${ICONS.layers} <span>3 Lantai Fisik Bulusari</span></div>
          <button class="btn btn-sm primary" onclick="app.openNewItemModal()">${ICONS.plus} <span>Barang</span></button>
        </div>

        <div class="item-list">
          ${this.state.floors.map(fl => {
      const fItems = this.state.items.filter(i => i.floorId === fl.id);
      const fUnits = fItems.reduce((s, i) => s + i.stock, 0);
      const fEmpty = fItems.filter(i => i.stock <= 0).length;
      return `
              <div class="item-row fl-${fl.id}" onclick="app.switchView('floors', '${fl.id}')">
                <div class="item-info">
                  <div class="item-title">${fl.name}</div>
                  <div class="item-sub">${fItems.length} SKU Barang &bull; ${fl.categories ? fl.categories.length : 3} Rak</div>
                </div>
                <div class="item-right">
                  <div>
                    <div class="item-qty">${fUnits.toLocaleString('id-ID')} <span class="item-unit">Unit</span></div>
                    <span class="badge ${fEmpty > 0 ? 'empty' : 'safe'}">${fEmpty > 0 ? fEmpty + ' Habis' : 'Aman'}</span>
                  </div>
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>

      <!-- PERINGATAN RESTOCK -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">${ICONS.alert} <span>Peringatan Stok Menipis</span></div>
        </div>
        <div class="item-list">
          ${emptyItems.concat(lowItems).slice(0, 5).map(item => `
            <div class="item-row ${item.stock <= 0 ? 'empty' : 'low'}" onclick="app.openMutationModal('${item.id}')">
              <div class="item-info">
                <div class="item-title">${this.escape(item.name)}</div>
                <div class="item-sub">${this.getFloorLabel(item.floorId)} &bull; ${this.escape(item.location)}</div>
              </div>
              <div class="item-right">
                <div>
                  <div class="item-qty">${item.stock} <span class="item-unit">${item.unit}</span></div>
                  <span class="badge ${item.stock <= 0 ? 'empty' : 'low'}">${item.stock <= 0 ? 'Habis' : 'Menipis'}</span>
                </div>
              </div>
            </div>
          `).join('') || `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:12px;">Semua stok dalam batas aman.</div>`}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 2. STOK 3 LANTAI FISIK
  // ==========================================================================
  renderFloorsView(container) {
    const flName = this.getFloorLabel(this.selectedFloor);
    document.getElementById('headerTitle').textContent = flName;
    document.getElementById('headerSub').textContent = 'Daftar Stok Fisik Barang';

    const hasAccess = this.canAccessFloor(this.selectedFloor);

    let items = this.state.items.filter(i => i.floorId === this.selectedFloor);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        (i.barcode && i.barcode.toLowerCase().includes(q)) ||
        i.location.toLowerCase().includes(q)
      );
    }

    container.innerHTML = `
      <div class="floor-tabs">
        ${this.state.floors.map(f => `
          <button class="floor-tab ${this.selectedFloor === f.id ? 'active' : ''}" onclick="app.selectedFloor='${f.id}'; IstiqomahSound.click(); app.render();">
            ${f.name}
          </button>
        `).join('')}
      </div>

      ${!hasAccess ? `
        <div class="card" style="text-align:center; padding:24px 16px;">
          <div style="font-weight:700; font-size:14px; color:#F43F5E;">Akses Lantai Terkunci</div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
            Akun <strong>${this.currentUser.username}</strong> hanya berwenang untuk <strong>${this.getFloorLabel(this.currentUser.floorAccess)}</strong>.
          </div>
          <button class="btn primary" style="margin-top:12px;" onclick="app.openLoginDashboard()">Login sebagai Fahri (Admin)</button>
        </div>
      ` : `
        <div style="display:flex; gap:8px;">
          <div class="search-bar" style="flex:1;">
            ${ICONS.search}
            <input type="text" id="floorSearchInput" placeholder="Cari nama, SKU, barcode, atau rak..." value="${this.escape(this.searchQuery)}">
          </div>
          <button class="btn primary" onclick="app.openNewItemModal('${this.selectedFloor}')">${ICONS.plus}</button>
        </div>

        <div class="item-list">
          ${items.length === 0 ? `
            <div class="card" style="text-align:center; color:var(--text-muted);">Tidak ada barang ditemukan di ${flName}.</div>
          ` : items.map(item => {
      const st = item.stock <= 0 ? 'empty' : (item.stock <= item.minStock ? 'low' : 'safe');
      return `
              <div class="item-row fl-${item.floorId} ${st !== 'safe' ? st : ''}" onclick="app.openMutationModal('${item.id}')">
                <div class="item-info">
                  <div class="item-title">${this.escape(item.name)}</div>
                  <div class="item-sub">
                    <span>${this.escape(item.location)}</span>
                    <span>&bull;</span>
                    <span>${this.escape(item.sku)}</span>
                  </div>
                </div>
                <div class="item-right">
                  <div>
                    <div class="item-qty">${item.stock} <span class="item-unit">${item.unit}</span></div>
                    <span class="badge ${st}">${st === 'empty' ? 'Habis' : (st === 'low' ? 'Menipis' : 'Aman')}</span>
                  </div>
                </div>
              </div>
            `;
    }).join('')}
        </div>
      `}
    `;

    const inp = document.getElementById('floorSearchInput');
    if (inp) {
      inp.oninput = (e) => {
        this.searchQuery = e.target.value;
        const pos = inp.selectionStart;
        this.render();
        const next = document.getElementById('floorSearchInput');
        if (next) {
          next.focus();
          next.setSelectionRange(pos, pos);
        }
      };
    }
  }

  // ==========================================================================
  // 3. STOCK OPNAME AISLE MODE (WITH REALTIME DELTA CALCULATION)
  // ==========================================================================
  renderOpnameView(container) {
    document.getElementById('headerTitle').textContent = 'Stock Opname';
    document.getElementById('headerSub').textContent = 'Penghitungan Cepat & Audit Aisle';

    const groups = this.state.soGroups || [];
    const activeGrp = groups.find(g => g.id === this.activeSoGroupId) || groups[0];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">${ICONS.clipboard} <span>Sesi Opname Aktif</span></div>
          <button class="btn btn-sm" onclick="app.createSoGroup()">${ICONS.plus} <span>Sesi Baru</span></button>
        </div>

        <select class="select" onchange="app.activeSoGroupId=this.value; IstiqomahSound.click(); app.render();">
          ${groups.map(g => `<option value="${g.id}" ${activeGrp && activeGrp.id === g.id ? 'selected' : ''}>${g.name} (${this.getFloorLabel(g.floorId)} &bull; ${g.entries.length} Item)</option>`).join('')}
        </select>

        <form onsubmit="event.preventDefault(); app.submitOpnameScan();" style="display:flex; gap:8px;">
          <input type="text" id="soBarcodeInput" class="input" placeholder="Scan Barcode / SKU..." style="flex:2; font-family:var(--font-mono);">
          <input type="number" id="soQtyInput" class="input" value="1" min="1" style="width:64px; text-align:center; font-weight:700; font-family:var(--font-mono);">
          <button type="submit" class="btn primary">Scan</button>
        </form>

        ${this.lastSoCallback ? `
          <div class="opname-delta-box">
            <div>
              <div style="font-weight:800; font-size:12.5px; color:var(--text-primary);">${this.escape(this.lastSoCallback.name)}</div>
              <div style="font-size:11px; color:var(--text-muted); font-weight:600;">Sebelum: ${this.lastSoCallback.prev} &bull; Ditambah: +${this.lastSoCallback.added}</div>
            </div>
            <div class="delta-pill ${this.lastSoCallback.diff === 0 ? 'balance' : (this.lastSoCallback.diff > 0 ? 'surplus' : 'deficit')}">
              ${this.lastSoCallback.diff === 0 ? 'BALANCE' : (this.lastSoCallback.diff > 0 ? '+' + this.lastSoCallback.diff + ' SURPLUS' : this.lastSoCallback.diff + ' DEFISIT')}
            </div>
          </div>
        ` : ''}
      </div>

      ${activeGrp ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">Daftar Hasil Audit (${activeGrp.entries.length})</div>
            <button class="btn btn-sm primary" onclick="app.applyOpnameGroup('${activeGrp.id}')">${ICONS.check} <span>Terapkan Stok</span></button>
          </div>

          <div class="item-list">
            ${activeGrp.entries.length === 0 ? `
              <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:14px;">Belum ada barang discan pada sesi ini.</div>
            ` : activeGrp.entries.map(e => {
      const diff = e.countedQty - e.systemQty;
      const statusClass = diff === 0 ? 'balance' : (diff > 0 ? 'surplus' : 'deficit');
      return `
                <div class="item-row" style="flex-direction:column; align-items:stretch; gap:8px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="item-info">
                      <div class="item-title">${this.escape(e.name)}</div>
                      <div class="item-sub">Sistem: ${e.systemQty} &bull; Aktual: ${e.countedQty}</div>
                    </div>
                    <span class="delta-pill ${statusClass}">
                      ${diff === 0 ? 'BALANCE' : (diff > 0 ? '+' + diff : diff)}
                    </span>
                  </div>

                  <div class="step-btn-grid">
                    <button type="button" class="step-btn" onclick="app.stepOpnameItem('${activeGrp.id}', '${e.id}', -5)">-5</button>
                    <button type="button" class="step-btn" onclick="app.stepOpnameItem('${activeGrp.id}', '${e.id}', -1)">-1</button>
                    <button type="button" class="step-btn" onclick="app.stepOpnameItem('${activeGrp.id}', '${e.id}', 1)">+1</button>
                    <button type="button" class="step-btn" onclick="app.stepOpnameItem('${activeGrp.id}', '${e.id}', 5)">+5</button>
                    <button type="button" class="step-btn" onclick="app.stepOpnameItem('${activeGrp.id}', '${e.id}', 10)">+10</button>
                  </div>
                </div>
              `;
    }).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  submitOpnameScan() {
    const code = document.getElementById('soBarcodeInput')?.value.trim();
    const addQty = parseInt(document.getElementById('soQtyInput')?.value, 10) || 1;
    if (!code) return;
    document.getElementById('soBarcodeInput').value = '';

    const grp = (this.state.soGroups || []).find(g => g.id === this.activeSoGroupId) || this.state.soGroups[0];
    if (!grp) return;

    const item = this.state.items.find(i =>
      (i.barcode && i.barcode.toLowerCase() === code.toLowerCase()) ||
      (i.sku && i.sku.toLowerCase() === code.toLowerCase())
    );

    if (!item) {
      IstiqomahSound.error();
      this.openNewItemModal(grp.floorId || 'L1', code);
      this.showToast('Barang belum terdaftar di sistem');
      return;
    }

    IstiqomahSound.beep();
    this.addOpnameCountForItem(grp, item, addQty);
  }

  addOpnameCountForItem(grp, item, addQty) {
    let entry = grp.entries.find(e => e.sku === item.sku || e.barcode === item.barcode);
    const prev = entry ? entry.countedQty : 0;
    const total = prev + addQty;
    const diff = total - item.stock;

    if (entry) {
      entry.prevQty = prev;
      entry.lastDelta = addQty;
      entry.countedQty = total;
      entry.scanCount = (entry.scanCount || 1) + 1;
    } else {
      entry = {
        id: 'soe_' + Date.now(),
        barcode: item.barcode || item.sku,
        sku: item.sku,
        name: item.name,
        systemQty: item.stock,
        countedQty: total,
        scanCount: 1,
        prevQty: 0,
        lastDelta: addQty
      };
      grp.entries.unshift(entry);
    }

    this.lastSoCallback = { name: item.name, prev, added: addQty, total, diff };
    this.save(`Opname: ${item.name} (${total})`);
    this.render();
  }

  stepOpnameItem(groupId, entryId, delta) {
    IstiqomahSound.click();
    const grp = (this.state.soGroups || []).find(g => g.id === groupId);
    if (!grp) return;
    const entry = grp.entries.find(e => e.id === entryId);
    if (!entry) return;

    entry.countedQty = Math.max(0, entry.countedQty + delta);
    this.save(`Opname disesuaikan: ${entry.name} (${entry.countedQty})`);
    this.render();
  }

  createSoGroup() {
    IstiqomahSound.click();
    const name = prompt('Nama Sesi Opname Baru:', 'AUDIT BULUSARI ' + new Date().toISOString().slice(5, 10));
    if (!name || !name.trim()) return;
    const newGrp = {
      id: 'SO_' + Date.now(),
      name: name.trim().toUpperCase(),
      floorId: this.selectedFloor || 'L1',
      createdAt: IstiqomahUtils.formatNow(),
      entries: []
    };
    this.state.soGroups.unshift(newGrp);
    this.activeSoGroupId = newGrp.id;
    this.save('Sesi opname baru dibuat');
    this.render();
  }

  applyOpnameGroup(groupId) {
    const grp = (this.state.soGroups || []).find(g => g.id === groupId);
    if (!grp || grp.entries.length === 0) return;

    let count = 0;
    grp.entries.forEach(e => {
      const item = this.state.items.find(i => i.sku === e.sku || i.barcode === e.barcode);
      if (item && item.stock !== e.countedQty) {
        item.stock = e.countedQty;
        e.systemQty = e.countedQty;
        this.state.mutations.unshift({
          id: 'MUT-' + String(Date.now()).slice(-4) + count,
          timestamp: IstiqomahUtils.formatNow(),
          itemId: item.id,
          itemName: item.name,
          type: 'OPNAME',
          qty: e.countedQty,
          unit: item.unit,
          floorId: item.floorId,
          user: this.currentUser.username,
          note: grp.name
        });
        count++;
      }
    });

    IstiqomahSound.chime();
    this.save(`${count} barang diperbarui dari audit fisik`);
    this.render();
  }

  // ==========================================================================
  // 4. RIWAYAT MUTASI
  // ==========================================================================
  renderMutationsView(container) {
    document.getElementById('headerTitle').textContent = 'Riwayat Mutasi';
    document.getElementById('headerSub').textContent = 'Audit Log Keluar Masuk & Opname';

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">${ICONS.transfer} <span>Log Mutasi Terkini</span></div>
        </div>
        <div class="item-list">
          ${this.state.mutations.map(m => `
            <div class="item-row" style="cursor:default;">
              <div class="item-info">
                <div class="item-title">${this.escape(m.itemName)}</div>
                <div class="item-sub">${this.getFloorLabel(m.floorId)} &bull; Oleh: ${this.escape(m.user || 'Fahri')} &bull; ${m.timestamp}</div>
              </div>
              <div class="item-right">
                <div>
                  <div class="item-qty">${m.type === 'OUT' ? '-' : (m.type === 'IN' ? '+' : '')}${m.qty} <span class="item-unit">${m.unit || 'Pcs'}</span></div>
                  <span class="badge ${m.type === 'IN' ? 'safe' : (m.type === 'OUT' ? 'low' : 'empty')}">${m.type}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 5. EKSPOR IMPOR DATA & OPSI WI-FI LAN SYNC
  // ==========================================================================
  renderSyncView(container) {
    document.getElementById('headerTitle').textContent = 'Data & Sinkronisasi';
    document.getElementById('headerSub').textContent = 'Cadangan Offline & Opsi Sinyal Wi-Fi';

    container.innerHTML = `
      <div class="card" style="border-left: 3.5px solid #38BDF8;">
        <div style="font-weight:700; font-size:13px; color:#38BDF8; display:flex; align-items:center; gap:6px;">
          ${ICONS.printer} <span>Pusat Cetak Laporan A4 Multi-Cabang</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">
          Sesuai standar operasional Istiqomah Bulusari, <strong>6 Jenis Cetak Laporan A4</strong> (Rekap Stok, Pesanan Restock, Audit Opname, Jurnal Mutasi, Lembar Kerja Kosong, Katalog Barcode) dialokasikan eksklusif pada <strong>Desktop (Port 3001)</strong> untuk menjamin presisi tata letak kertas A4 dan kejelasan cetak.
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">${ICONS.database} <span>Cadangan Data Offline</span></div>
        </div>
        <div style="font-size:12px; color:var(--text-secondary);">
          Gunakan cadangan JSON / ZIP untuk memindahkan database secara 100% offline via file atau USB.
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <button class="btn primary" onclick="app.exportFullJson()">${ICONS.download} <span>Ekspor Semua (.JSON)</span></button>
          <button class="btn" onclick="document.getElementById('importJsonInput').click()">${ICONS.upload} <span>Impor (.JSON)</span></button>
        </div>
        <input type="file" id="importJsonInput" accept=".json" style="display:none;" onchange="app.handleImportJson(event)">

        <div style="border-top:1px solid var(--border-subtle); padding-top:10px; display:flex; flex-direction:column; gap:8px;">
          <label style="font-size:11.5px; font-weight:600; color:var(--text-secondary);">Ekspor Cadangan Per Lantai:</label>
          <div style="display:flex; gap:8px;">
            <select id="exportFloorSel" class="select" style="flex:1;">
              <option value="L1">Lantai 1</option>
              <option value="L2">Lantai 2</option>
              <option value="L3">Lantai 3</option>
            </select>
            <button class="btn" onclick="app.exportFloorJson(document.getElementById('exportFloorSel').value)">${ICONS.download} <span>Ekspor Lantai</span></button>
          </div>
        </div>

        <button class="btn" onclick="app.exportBackupZip()">${ICONS.download} <span>Unduh Arsip Cadangan (.ZIP & CSV Excel)</span></button>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">${ICONS.wifi} <span>Opsi Sinkron Satu Jaringan (Wi-Fi)</span></div>
          <span class="badge ${this.engine.wifiSyncEnabled ? 'safe' : 'low'}">${this.engine.wifiSyncEnabled ? 'Aktif' : 'Offline Murni'}</span>
        </div>
        <div style="font-size:12px; color:var(--text-secondary);">
          Hubungkan HP dan Laptop/PC ke satu sinyal Wi-Fi yang sama untuk sinkronisasi otomatis tanpa kabel.
        </div>

        <div style="display:flex; gap:8px;">
          <button class="btn ${this.engine.wifiSyncEnabled ? '' : 'primary'}" style="flex:1;" onclick="app.toggleWifiSync()">
            ${this.engine.wifiSyncEnabled ? 'Matikan Mode Wi-Fi' : 'Aktifkan Mode Wi-Fi'}
          </button>
          <button class="btn primary" style="flex:1;" onclick="app.syncWifiNow()">
            ${ICONS.sync} <span>Sinkronkan Sekarang</span>
          </button>
        </div>
      </div>
    `;
  }

  toggleWifiSync() {
    IstiqomahSound.click();
    this.engine.setWifiSyncEnabled(!this.engine.wifiSyncEnabled);
    this.showToast(this.engine.wifiSyncEnabled ? 'Mode Wi-Fi diaktifkan' : 'Mode Offline Murni');
    this.render();
  }

  async syncWifiNow() {
    IstiqomahSound.click();
    this.engine.setWifiSyncEnabled(true);
    const ok = await this.engine.pushWifiSync(this.state);
    if (ok) {
      IstiqomahSound.chime();
      this.showToast('Berhasil sinkron dengan Desktop melalui Wi-Fi');
    } else {
      IstiqomahSound.error();
      this.showToast('Server Wi-Fi tidak terdeteksi, data tersimpan aman secara offline');
    }
    this.render();
  }

  exportFullJson() {
    IstiqomahSound.click();
    const payload = {
      type: 'ISTIQOMAH_FULL_DB',
      branch: 'BULUSARI',
      exportedAt: new Date().toISOString(),
      exportedBy: this.currentUser.username,
      state: this.state
    };
    const url = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    a.href = url;
    a.download = `Istiqomah_Bulusari_Full_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    this.showToast('Database JSON berhasil diunduh');
  }

  exportFloorJson(floorId) {
    IstiqomahSound.click();
    const items = this.state.items.filter(i => i.floorId === floorId);
    const payload = {
      type: 'ISTIQOMAH_FLOOR_DB',
      branch: 'BULUSARI',
      floorId,
      exportedAt: new Date().toISOString(),
      exportedBy: this.currentUser.username,
      items
    };
    const url = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    a.href = url;
    a.download = `Istiqomah_Bulusari_${floorId}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    this.showToast(`Data ${this.getFloorLabel(floorId)} berhasil diunduh`);
  }

  handleImportJson(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.type === 'ISTIQOMAH_FULL_DB' && parsed.state) {
          this.state = parsed.state;
          IstiqomahSound.chime();
          this.save('Database penuh berhasil diimpor');
          this.render();
        } else if (parsed.type === 'ISTIQOMAH_FLOOR_DB' && parsed.floorId && Array.isArray(parsed.items)) {
          const other = this.state.items.filter(i => i.floorId !== parsed.floorId);
          this.state.items = other.concat(parsed.items);
          IstiqomahSound.chime();
          this.save(`Data ${this.getFloorLabel(parsed.floorId)} digabungkan`);
          this.render();
        } else if (parsed.items && Array.isArray(parsed.items)) {
          this.state = parsed;
          IstiqomahSound.chime();
          this.save('Database berhasil diimpor');
          this.render();
        } else {
          IstiqomahSound.error();
          this.showToast('Format JSON tidak dikenali');
        }
      } catch (err) {
        IstiqomahSound.error();
        this.showToast('Gagal membaca file JSON');
      }
    };
    reader.readAsText(file);
  }

  exportBackupZip() {
    IstiqomahSound.click();
    const dateStr = new Date().toISOString().slice(0, 10);
    const jsonContent = JSON.stringify(this.state, null, 2);
    let csv = 'Lantai,Nama,SKU,Barcode,Stok,Min,Satuan,Rak\n';
    this.state.items.forEach(i => {
      csv += `"${this.getFloorLabel(i.floorId)}","${i.name}","${i.sku}","${i.barcode || ''}",${i.stock},${i.minStock},"${i.unit}","${i.location}"\n`;
    });
    const blob = IstiqomahZipBuilder.createZipBlob([
      { name: `istiqomah_bulusari_${dateStr}.json`, content: jsonContent },
      { name: `istiqomah_bulusari_${dateStr}.csv`, content: csv }
    ]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Backup_Istiqomah_Bulusari_${dateStr}.zip`;
    a.click();
    IstiqomahSound.chime();
    this.showToast('Arsip cadangan (.ZIP) berhasil diunduh');
  }

  // ==========================================================================
  // 6. MANAJEMEN AKUN (ADMIN UTAMA: FAHRI)
  // ==========================================================================
  renderAccountsView(container) {
    document.getElementById('headerTitle').textContent = 'Manajemen Akun';
    document.getElementById('headerSub').textContent = 'Admin Utama: Fahri';

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">${ICONS.user} <span>Sesi Akun Aktif</span></div>
          <button class="btn btn-sm danger" onclick="app.openLoginDashboard()">Keluar Sesi</button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--bg-surface-elevated); border:1px solid var(--border-medium); border-radius:var(--radius-md);">
          <div>
            <div style="font-weight:800; font-size:14px; color:var(--text-primary);">${this.escape(this.currentUser.username)}</div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
              Hak Akses: ${this.currentUser.role === 'ADMIN' ? 'Admin Utama (Akses Semua Lantai)' : 'Staf (' + this.getFloorLabel(this.currentUser.floorAccess) + ')'}
            </div>
          </div>
          <span class="badge safe">${this.currentUser.role}</span>
        </div>
      </div>

      ${this.isAdmin() ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${ICONS.plus} <span>Buat Akun Staf Baru</span></div>
          </div>
          <form onsubmit="event.preventDefault(); app.createNewUserAccount();" style="display:flex; flex-direction:column; gap:10px;">
            <div class="form-field">
              <label>Nama Akun / Username</label>
              <input type="text" id="newAccUsername" class="input" placeholder="Contoh: Petugas Lantai 1..." required>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div class="form-field">
                <label>PIN / Password</label>
                <input type="text" id="newAccPassword" class="input" value="123" required>
              </div>
              <div class="form-field">
                <label>Peran</label>
                <select id="newAccRole" class="select">
                  <option value="STAFF">Staf</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div class="form-field">
              <label>Hak Akses Lantai Fisik</label>
              <select id="newAccFloor" class="select">
                <option value="ALL">Semua Lantai (Lantai 1, 2, 3)</option>
                <option value="L1">Lantai 1</option>
                <option value="L2">Lantai 2</option>
                <option value="L3">Lantai 3</option>
              </select>
            </div>
            <button type="submit" class="btn primary">Buat Akun</button>
          </form>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">${ICONS.users} <span>Daftar Akun Terdaftar (${this.state.users.length})</span></div>
          </div>
          <div class="item-list">
            ${this.state.users.map(u => `
              <div class="item-row" style="cursor:default;">
                <div class="item-info">
                  <div class="item-title">${this.escape(u.username)} ${u.username.toLowerCase() === 'fahri' ? '(Admin Utama)' : ''}</div>
                  <div class="item-sub">Akses: ${u.floorAccess === 'ALL' ? 'Semua Lantai' : this.getFloorLabel(u.floorAccess)} &bull; PIN: ${this.escape(u.password)}</div>
                </div>
                <div class="item-right">
                  ${u.username.toLowerCase() !== 'fahri' ? `
                    <button class="btn btn-sm danger" onclick="app.deleteUserAccount('${u.id}')">${ICONS.trash}</button>
                  ` : `<span class="badge safe">UTAMA</span>`}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="card" style="text-align:center; color:var(--text-muted); padding:16px;">
          Hanya Super Admin (<strong>Fahri</strong>) yang dapat menambah dan mengelola akun staf.
        </div>
      `}
    `;
  }

  createNewUserAccount() {
    if (!this.isAdmin()) return;
    const username = document.getElementById('newAccUsername').value.trim();
    const password = document.getElementById('newAccPassword').value.trim();
    const role = document.getElementById('newAccRole').value;
    const floorAccess = role === 'ADMIN' ? 'ALL' : document.getElementById('newAccFloor').value;
    if (!username || !password) return;

    this.state.users.push({
      id: 'usr_' + Date.now(),
      username,
      password,
      role,
      floorAccess,
      createdAt: IstiqomahUtils.formatNow().slice(0, 10)
    });
    IstiqomahSound.chime();
    this.save(`Akun "${username}" berhasil dibuat`);
    this.render();
  }

  deleteUserAccount(userId) {
    if (!this.isAdmin()) return;
    const target = this.state.users.find(u => u.id === userId);
    if (!target || target.username.toLowerCase() === 'fahri') return;
    if (!confirm(`Hapus akun "${target.username}"?`)) return;
    this.state.users = this.state.users.filter(u => u.id !== userId);
    IstiqomahSound.click();
    this.save(`Akun "${target.username}" dihapus`);
    this.render();
  }

  // ==========================================================================
  // CAMERA SCANNER & MODALS
  // ==========================================================================
  async openScannerModal() {
    IstiqomahSound.click();
    this.openModal('scannerModal');
    const res = document.getElementById('scanLookupResult');
    if (res) res.style.display = 'none';
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const v = document.getElementById('scannerVideo');
        if (v) {
          v.srcObject = this.scannerStream;
          v.play();
        }
      }
    } catch (e) { }
  }

  closeScannerModal() {
    if (this.scannerStream) {
      this.scannerStream.getTracks().forEach(t => t.stop());
      this.scannerStream = null;
    }
    this.closeModal('scannerModal');
  }

  submitManualScan() {
    const code = document.getElementById('manualScanInput')?.value.trim();
    if (!code) return;
    document.getElementById('manualScanInput').value = '';

    if (this.scannerTarget === 'wizard') {
      this.scannerTarget = null;
      this.closeScannerModal();
      const barcodeInput = document.getElementById('formItemBarcode');
      if (barcodeInput) {
        barcodeInput.value = code;
        this.onMobileBarcodeChange(code);
      }
      return;
    }

    const found = this.state.items.find(i =>
      (i.barcode && i.barcode.toLowerCase() === code.toLowerCase()) ||
      (i.sku && i.sku.toLowerCase() === code.toLowerCase())
    );

    this.closeScannerModal();

    if (!found) {
      IstiqomahSound.error();
      this.openNewItemModal(this.selectedFloor, code);
      this.showToast('Barang belum ada, silakan isi data baru');
      return;
    }

    IstiqomahSound.beep();
    this.openMutationModal(found.id);
  }

  openMutationModal(itemId) {
    IstiqomahSound.click();
    const item = this.state.items.find(i => i.id === itemId);
    if (!item) return;
    if (!this.canAccessFloor(item.floorId)) {
      IstiqomahSound.error();
      this.showToast(`Akun Anda tidak memiliki izin untuk ${this.getFloorLabel(item.floorId)}`);
      return;
    }
    this.activeItem = item;
    document.getElementById('mutItemTitle').textContent = item.name;
    document.getElementById('mutItemMeta').textContent = `${this.getFloorLabel(item.floorId)} &bull; ${item.location}`;
    document.getElementById('mutItemCode').textContent = `SKU: ${item.sku} &bull; Barcode: ${item.barcode || '-'}`;
    document.getElementById('mutCurrentStock').textContent = `${item.stock} ${item.unit}`;
    document.getElementById('mutQtyInput').value = '1';
    document.getElementById('mutNoteInput').value = '';
    this.setMutationType('IN');
    this.openModal('mutationModal');
  }

  setMutationType(type) {
    IstiqomahSound.click();
    this.mutationType = type;
    document.getElementById('mutTabIn')?.classList.toggle('active', type === 'IN');
    document.getElementById('mutTabOut')?.classList.toggle('active', type === 'OUT');
    document.getElementById('mutTabOpname')?.classList.toggle('active', type === 'OPNAME');
    const lbl = document.getElementById('mutQtyLabel');
    if (lbl) {
      lbl.textContent = type === 'OPNAME' ? 'Stok Fisik Aktual' : 'Jumlah Unit';
    }
    if (type === 'OPNAME' && this.activeItem) {
      document.getElementById('mutQtyInput').value = this.activeItem.stock;
    }
  }

  stepMutQty(d) {
    IstiqomahSound.click();
    const inp = document.getElementById('mutQtyInput');
    if (!inp) return;
    inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) + d);
  }

  submitMutation() {
    const item = this.activeItem;
    if (!item) return;
    const qty = parseInt(document.getElementById('mutQtyInput').value, 10) || 0;
    const note = document.getElementById('mutNoteInput').value.trim() || 'Update stok';

    if (this.mutationType === 'IN') {
      item.stock += qty;
    } else if (this.mutationType === 'OUT') {
      if (item.stock < qty) {
        IstiqomahSound.error();
        this.showToast('Stok tidak mencukupi untuk pengeluaran ini');
        return;
      }
      item.stock -= qty;
    } else if (this.mutationType === 'OPNAME') {
      item.stock = qty;
    }

    item.updatedAt = IstiqomahUtils.formatNow();
    this.state.mutations.unshift({
      id: 'MUT-' + String(Date.now()).slice(-5),
      timestamp: IstiqomahUtils.formatNow(),
      itemId: item.id,
      itemName: item.name,
      type: this.mutationType,
      qty,
      unit: item.unit,
      floorId: item.floorId,
      user: this.currentUser.username,
      note
    });

    IstiqomahSound.chime();
    this.closeModal('mutationModal');
    this.save(`Stok ${item.name} berhasil diperbarui (${item.stock} ${item.unit})`);
    this.render();
  }

  openNewItemModal(floorId = 'L1', barcode = '') {
    IstiqomahSound.click();
    document.getElementById('itemFormTitle').textContent = 'Tambah Produk Baru';
    document.getElementById('formItemId').value = '';
    document.getElementById('formItemName').value = '';
    document.getElementById('formItemFloor').value = floorId;
    document.getElementById('formItemLocation').value = 'Rak 1A';
    document.getElementById('formItemSku').value = 'BRG-' + Math.floor(100 + Math.random() * 899);
    document.getElementById('formItemBarcode').value = barcode;
    document.getElementById('formItemStock').value = '20';
    document.getElementById('formItemMin').value = '5';
    document.getElementById('formItemUnit').value = 'PCS';
    document.getElementById('btnDeleteItem').style.display = 'none';

    this.goToMobileStep(1);
    if (barcode) {
      this.onMobileBarcodeChange(barcode);
    } else {
      const fb = document.getElementById('mBarcodeFeedback');
      if (fb) fb.innerHTML = '';
    }
    this.openModal('itemFormModal');
    setTimeout(() => document.getElementById('formItemBarcode')?.focus(), 200);
  }

  openEditItemModal() {
    IstiqomahSound.click();
    const item = this.activeItem;
    if (!item) return;
    this.closeModal('mutationModal');
    document.getElementById('itemFormTitle').textContent = 'Edit Data Produk';
    document.getElementById('formItemId').value = item.id;
    document.getElementById('formItemName').value = item.name;
    document.getElementById('formItemFloor').value = item.floorId;
    document.getElementById('formItemLocation').value = item.location || 'Rak 1A';
    document.getElementById('formItemSku').value = item.sku || '';
    document.getElementById('formItemBarcode').value = item.barcode || '';
    document.getElementById('formItemStock').value = item.stock;
    document.getElementById('formItemMin').value = item.minStock || 5;
    document.getElementById('formItemUnit').value = item.unit || 'PCS';
    document.getElementById('btnDeleteItem').style.display = 'inline-flex';

    this.goToMobileStep(2);
    this.openModal('itemFormModal');
  }

  goToMobileStep(step) {
    if (step === 3) {
      const name = document.getElementById('formItemName').value.trim();
      if (!name) {
        this.showToast('Nama barang wajib diisi!');
        document.getElementById('formItemName').focus();
        return;
      }
    }

    [1, 2, 3].forEach(s => {
      const stepDiv = document.getElementById(`mWizardStep${s}`);
      const pill = document.getElementById(`mWizardPill${s}`);
      if (stepDiv) stepDiv.style.display = (s === step) ? 'block' : 'none';
      if (pill) {
        pill.classList.toggle('active', s === step);
        pill.classList.toggle('completed', s < step);
      }
    });

    const stepLabel = document.getElementById('itemFormStepLabel');
    if (stepLabel) {
      if (step === 1) stepLabel.textContent = 'Langkah 1/3 — Scan Barcode';
      if (step === 2) stepLabel.textContent = 'Langkah 2/3 — Info Produk';
      if (step === 3) stepLabel.textContent = 'Langkah 3/3 — Stok & Satuan';
    }

    document.getElementById('formWizardStep').value = step;
    IstiqomahSound.click();
  }

  onMobileBarcodeChange(code) {
    const val = (code || '').trim();
    const feedback = document.getElementById('mBarcodeFeedback');
    if (!feedback) return;

    if (!val) {
      feedback.innerHTML = '';
      return;
    }

    const currentId = document.getElementById('formItemId').value;
    const dup = this.state.items.find(i => i.barcode && i.barcode.toLowerCase() === val.toLowerCase() && i.id !== currentId);

    if (dup) {
      IstiqomahSound.error();
      feedback.innerHTML = `
        <div class="duplicate-warning-box">
          <div style="font-weight:700; color:var(--warning); font-size:12px; margin-bottom:4px;">
            Peringatan: Barcode Sudah Digunakan!
          </div>
          <div style="font-size:11.5px; color:var(--text-primary); font-weight:600;">
            Barang: <strong>${this.escape(dup.name)}</strong> (${this.getFloorLabel(dup.floorId)} &bull; ${this.escape(dup.location)})
          </div>
          <div style="margin-top:6px;">
            <button type="button" class="btn btn-sm" onclick="app.closeModal('itemFormModal'); app.openMutationModal('${dup.id}')">
              Buka Barang Ini &rarr;
            </button>
          </div>
        </div>
      `;
    } else {
      feedback.innerHTML = `
        <div style="font-size:11px; color:var(--success); font-weight:700; padding:6px 8px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); border-radius:6px;">
          Barcode Tersedia: ${this.escape(val)}
        </div>
      `;
    }
  }

  generateMobileAutoSku() {
    IstiqomahSound.click();
    const floor = document.getElementById('formItemFloor')?.value || 'L1';
    const autoCode = '899' + Math.floor(10000000 + Math.random() * 89999999);
    const skuCode = `BUL-${floor}-${Math.floor(1000 + Math.random() * 9000)}`;

    const barcodeInp = document.getElementById('formItemBarcode');
    const skuInp = document.getElementById('formItemSku');
    if (barcodeInp) barcodeInp.value = autoCode;
    if (skuInp) skuInp.value = skuCode;

    this.onMobileBarcodeChange(autoCode);
    this.showToast('Barcode & SKU Otomatis Dihasilkan');
  }

  openScannerForWizard() {
    IstiqomahSound.click();
    this.scannerTarget = 'wizard';
    this.openScannerModal();
  }

  skipMobileBarcode() {
    IstiqomahSound.click();
    this.goToMobileStep(2);
  }

  stepMobileItemStock(n) {
    IstiqomahSound.click();
    const inp = document.getElementById('formItemStock');
    if (!inp) return;
    const cur = parseInt(inp.value, 10) || 0;
    inp.value = Math.max(0, cur + n);
  }

  pickMobileUnit(unit) {
    IstiqomahSound.click();
    const inp = document.getElementById('formItemUnit');
    if (inp) inp.value = unit;
  }

  handleMobileWizardSubmit() {
    const id = document.getElementById('formItemId').value;
    const name = document.getElementById('formItemName').value.trim();
    const floorId = document.getElementById('formItemFloor').value;
    const location = document.getElementById('formItemLocation').value.trim() || 'Rak 1A';
    const sku = document.getElementById('formItemSku').value.trim() || ('SKU-' + Date.now().toString().slice(-4));
    const barcode = document.getElementById('formItemBarcode').value.trim();
    const stock = parseInt(document.getElementById('formItemStock').value, 10) || 0;
    const minStock = parseInt(document.getElementById('formItemMin').value, 10) || 0;
    const unit = (document.getElementById('formItemUnit').value.trim() || 'PCS').toUpperCase();

    if (!name) {
      this.goToMobileStep(2);
      this.showToast('Nama barang wajib diisi!');
      return;
    }

    if (barcode) {
      const dup = this.state.items.find(i => i.barcode && i.barcode.toLowerCase() === barcode.toLowerCase() && i.id !== id);
      if (dup) {
        IstiqomahSound.error();
        this.goToMobileStep(1);
        this.onMobileBarcodeChange(barcode);
        this.showToast('Barcode bentrok dengan produk lain!');
        return;
      }
    }

    if (id) {
      const item = this.state.items.find(i => i.id === id);
      if (item) {
        Object.assign(item, { name, floorId, location, sku, barcode, stock, minStock, unit, updatedAt: IstiqomahUtils.formatNow() });
      }
      this.save(`Barang "${name}" diperbarui`);
    } else {
      this.state.items.unshift({
        id: 'it_' + Date.now(),
        floorId,
        name,
        sku,
        barcode,
        stock,
        minStock,
        unit,
        location,
        updatedAt: IstiqomahUtils.formatNow()
      });
      this.save(`Barang "${name}" berhasil ditambahkan`);
    }

    IstiqomahSound.chime();
    this.closeModal('itemFormModal');
    this.render();
  }

  // ==========================================================================
  // MODE LENGKAPI BARCODE BERPROGRESS (MOBILE)
  // ==========================================================================
  openBarcodeCompletionModal() {
    IstiqomahSound.click();
    this.completionSelectedFloor = 'ALL';
    this.completionActiveItemId = null;
    this.openModal('barcodeCompletionModal');
    this.renderMobileBarcodeCompletion();
  }

  setCompletionFloor(floorId) {
    IstiqomahSound.click();
    this.completionSelectedFloor = floorId;
    this.completionActiveItemId = null;
    ['ALL', 'L1', 'L2', 'L3'].forEach(f => {
      document.getElementById('mCompTab' + f)?.classList.toggle('active', f === floorId);
    });
    this.renderMobileBarcodeCompletion();
  }

  renderMobileBarcodeCompletion() {
    const allItems = this.state.items || [];
    const pool = (this.completionSelectedFloor === 'ALL')
      ? allItems
      : allItems.filter(i => i.floorId === this.completionSelectedFloor);

    const completed = pool.filter(i => i.barcode && i.barcode.trim() !== '');
    const unbarcoded = pool.filter(i => !i.barcode || i.barcode.trim() === '');
    const pct = pool.length > 0 ? Math.round((completed.length / pool.length) * 100) : 100;

    const pctEl = document.getElementById('mCompletionPct');
    const fillEl = document.getElementById('mCompletionFill');
    const statsEl = document.getElementById('mCompletionStats');
    if (pctEl) pctEl.textContent = `${pct}% Selesai`;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (statsEl) {
      statsEl.innerHTML = `
        <span>Total: <strong>${pool.length}</strong></span>
        <span>Sudah: <strong style="color:var(--success);">${completed.length}</strong></span>
        <span>Belum: <strong style="color:${unbarcoded.length > 0 ? 'var(--warning)' : 'var(--success)'};">${unbarcoded.length}</strong></span>
      `;
    }

    let activeItem = null;
    if (this.completionActiveItemId) {
      activeItem = unbarcoded.find(i => i.id === this.completionActiveItemId);
    }
    if (!activeItem && unbarcoded.length > 0) {
      activeItem = unbarcoded[0];
      this.completionActiveItemId = activeItem.id;
    }

    const card = document.getElementById('mCompletionActiveCard');
    const inp = document.getElementById('mCompletionBarcodeInput');
    const notice = document.getElementById('mCompletionNotice');
    if (notice) notice.innerHTML = '';

    if (!activeItem) {
      if (card) {
        card.innerHTML = `
          <div class="completion-item-card" style="border-left-color:var(--success); text-align:center; padding:18px;">
            <div style="font-size:16px; font-weight:800; color:var(--success); margin-bottom:4px;">&check; Selesai!</div>
            <div style="font-size:12px; color:var(--text-primary); font-weight:700;">Semua barang di ${this.getFloorLabel(this.completionSelectedFloor)} sudah ber-barcode</div>
          </div>
        `;
      }
      if (inp) {
        inp.disabled = true;
        inp.value = '';
      }
    } else {
      if (inp) {
        inp.disabled = false;
        inp.value = '';
        setTimeout(() => inp.focus(), 150);
      }
      if (card) {
        card.innerHTML = `
          <div class="completion-item-card fl-${activeItem.floorId}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <div style="font-size:14.5px; font-weight:800; color:var(--text-primary);">${this.escape(activeItem.name)}</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">
                  <span class="badge ${activeItem.floorId}">${this.getFloorLabel(activeItem.floorId)}</span>
                  <span style="margin-left:4px; font-weight:600;">Rak: <strong>${this.escape(activeItem.location || '1A')}</strong></span>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:14.5px; font-weight:800; color:var(--text-primary); font-family:var(--font-mono);">${activeItem.stock} ${this.escape(activeItem.unit)}</div>
                <div style="font-size:10px; color:var(--text-muted); font-weight:600;">Stok</div>
              </div>
            </div>
          </div>
        `;
      }
    }

    const qList = document.getElementById('mCompletionQueueList');
    if (qList) {
      if (unbarcoded.length === 0) {
        qList.innerHTML = `<div style="text-align:center; padding:12px; font-size:11px; color:var(--text-muted); font-weight:600;">Tidak ada antrian barang belum ber-barcode.</div>`;
      } else {
        qList.innerHTML = unbarcoded.map((it, idx) => `
          <div class="completion-queue-item ${activeItem && activeItem.id === it.id ? 'active' : ''}" onclick="app.pickMobileCompletionItem('${it.id}')">
            <div>
              <div style="font-weight:800; font-size:12px; color:var(--text-primary);">${idx + 1}. ${this.escape(it.name)}</div>
              <div style="font-size:10.5px; color:var(--text-muted); font-weight:600;">${this.getFloorLabel(it.floorId)} &bull; ${this.escape(it.location || 'Rak')}</div>
            </div>
            <span class="badge ${it.stock > 0 ? 'safe' : 'empty'}">${it.stock} ${this.escape(it.unit)}</span>
          </div>
        `).join('');
      }
    }
  }

  pickMobileCompletionItem(itemId) {
    IstiqomahSound.click();
    this.completionActiveItemId = itemId;
    this.renderMobileBarcodeCompletion();
  }

  skipMobileCompletionItem() {
    IstiqomahSound.click();
    const allItems = this.state.items || [];
    const pool = (this.completionSelectedFloor === 'ALL')
      ? allItems
      : allItems.filter(i => i.floorId === this.completionSelectedFloor);
    const unbarcoded = pool.filter(i => !i.barcode || i.barcode.trim() === '');
    if (unbarcoded.length <= 1) return;

    const curIdx = unbarcoded.findIndex(i => i.id === this.completionActiveItemId);
    const nextIdx = (curIdx + 1) % unbarcoded.length;
    this.completionActiveItemId = unbarcoded[nextIdx].id;
    this.renderMobileBarcodeCompletion();
  }

  submitMobileCompletionBarcode() {
    const inp = document.getElementById('mCompletionBarcodeInput');
    const barcode = inp ? inp.value.trim() : '';
    const notice = document.getElementById('mCompletionNotice');

    if (!barcode) {
      if (notice) notice.innerHTML = `<div style="font-size:11px; color:var(--warning); padding:4px 0;">Silakan masukkan atau scan barcode.</div>`;
      return;
    }

    const currentItem = this.state.items.find(i => i.id === this.completionActiveItemId);
    if (!currentItem) return;

    const dup = this.state.items.find(i => i.barcode && i.barcode.toLowerCase() === barcode.toLowerCase() && i.id !== currentItem.id);
    if (dup) {
      IstiqomahSound.error();
      if (notice) {
        notice.innerHTML = `<div style="font-size:11px; color:var(--danger); padding:4px 0; font-weight:700;">Gagal: Barcode sudah dipakai oleh "${this.escape(dup.name)}"!</div>`;
      }
      return;
    }

    currentItem.barcode = barcode;
    currentItem.updatedAt = IstiqomahUtils.formatNow();
    IstiqomahSound.chime();
    this.save(`Barcode ${barcode} disimpan untuk "${currentItem.name}"`);
    this.showToast(`Barcode untuk ${currentItem.name} tersimpan`);

    this.completionActiveItemId = null;
    this.renderMobileBarcodeCompletion();
  }

  deleteCurrentItem() {
    const id = document.getElementById('formItemId').value;
    const item = this.state.items.find(i => i.id === id);
    if (!item || !confirm(`Hapus "${item.name}" dari sistem?`)) return;
    this.state.items = this.state.items.filter(i => i.id !== id);
    IstiqomahSound.click();
    this.closeModal('itemFormModal');
    this.save(`Barang "${item.name}" dihapus`);
    this.render();
  }

  getFloorLabel(floorId) {
    if (floorId === 'L1') return 'Lantai 1';
    if (floorId === 'L2') return 'Lantai 2';
    if (floorId === 'L3') return 'Lantai 3';
    return floorId;
  }

  escape(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  openModal(id) {
    document.getElementById(id)?.classList.add('open');
  }

  closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
  }

  showToast(msg) {
    const wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.25s';
      setTimeout(() => el.remove(), 250);
    }, 2400);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new IstiqomahMobileApp();
});
