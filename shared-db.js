/**
 * ============================================================================
 * ISTIQOMAH BULUSARI STOCK - CORE DATABASE, AUDIO SYNTHESIZER & SYNC ENGINE
 * ============================================================================
 * - Cabang: Istiqomah Grosir Bulusari
 * - Struktur: 3 Lantai Fisik (Lantai 1, Lantai 2, Lantai 3)
 * - Akun Utama: Fahri (Super Admin - Akses Semua Lantai & Kendali Penuh)
 * - Multi-Akun Petugas: Akses Tersegmentasi per Lantai (L1, L2, L3, atau ALL)
 * - 100% Offline-First (LocalStorage + File Snapshot JSON / CSV / ZIP)
 * - Sinkronisasi Satu Sinyal Wi-Fi / LAN (Mobile :3000 <-> Desktop :3001)
 * - Velvet Acoustic Web Audio Synthesizer (Scan Beep, Chime, Clicks)
 * - Pure Vector SVG Icons (Zero Emojis)
 * ============================================================================
 */

// ============================================================================
// 1. PURE VECTOR SVG ICON CATALOG (ZERO EMOJIS)
// ============================================================================
const ICONS = {
  menu: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`,
  close: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  grid: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
  layers: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  box: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  scan: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`,
  search: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7.5"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>`,
  plus: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  transfer: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3L4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/></svg>`,
  users: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  user: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  database: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  download: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  upload: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  wifi: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  sync: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6"/><path d="M2.5 22v-6h6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`,
  alert: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  print: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
  edit: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  tag: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  check: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  clipboard: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
  logout: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  lock: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  unlock: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
  shield: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  fileText: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  soundOn: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  soundOff: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  eye: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  arrowRight: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  moon: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  sun: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  history: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  refresh: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`
};

// ============================================================================
// 2. VELVET ACOUSTIC WEB AUDIO SYNTHESIZER (FROM KETANGGUNGAN FINAL ARCHITECTURE)
// Soft Low-Pass Filtered Tactile Tap & Chimes (No Harsh Buzzer/Sawtooth)
// ============================================================================
class IstiqomahAudioEngine {
  constructor() {
    this.ctx = null;
    const stored = (typeof localStorage !== 'undefined') ? localStorage.getItem('istiqomah_sound_enabled') : 'true';
    this.soundActive = stored !== 'false';
  }

  isSoundEnabled() {
    return this.soundActive;
  }

  setSoundEnabled(enabled) {
    this.soundActive = !!enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('istiqomah_sound_enabled', this.soundActive ? 'true' : 'false');
    }
  }

  toggleSound() {
    this.setSoundEnabled(!this.soundActive);
    if (this.soundActive) this.playClick();
    return this.soundActive;
  }

  initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
  }

  ensureRunning() {
    if (!this.soundActive) return false;
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return !!this.ctx;
  }

  // 1. Soft velvet micro-tap for UI buttons (Clean, gentle, mechanical keyboard switch feel)
  playClick() {
    if (!this.ensureRunning()) return;
    try {
      const now = this.ctx.currentTime;
      if (this._lastClick && now - this._lastClick < 0.035) return;
      this._lastClick = now;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.022);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.022, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.024);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(6);
      }
    } catch (e) {}
  }

  // 2. Ultra-smooth velvet blip for barcode scanner (Warm Sine Marimba)
  playScanBeep() {
    if (!this.ensureRunning()) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.045); // E6

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.095);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch (e) {}
  }

  // 3. Smooth warm ascending chord when stock is added (+)
  playStockAdd() {
    if (!this.ensureRunning()) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const start = now + idx * 0.03;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, start);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.035, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.14);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (e) {}
  }

  // 4. Smooth warm descending tone when stock is reduced (-)
  playStockSubtract() {
    if (!this.ensureRunning()) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [783.99, 659.25]; // G5 -> E5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const start = now + idx * 0.035;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, start);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.032, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.12);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (e) {}
  }

  // 5. Harmonious smooth velvet chord for success / save
  playSuccess() {
    if (!this.ensureRunning()) return;
    try {
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C Major Chord (C5, E5, G5, C6)
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const start = now + idx * 0.025;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, start);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.03, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.19);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.19);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([10, 10]);
      }
    } catch (e) {}
  }

  // 6. Subtle wood latch click when locking/logging out
  playLock() {
    if (!this.ensureRunning()) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (e) {}
  }

  // 7. Soft two-note pleasant chime when unlocking/logging in
  playUnlock() {
    if (!this.ensureRunning()) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [587.33, 880]; // D5 -> A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const start = now + idx * 0.045;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, start);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.045, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.16);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch (e) {}
  }

  // 8. Soft polite descending two-note minor tone for error/alert (Velvet, never harsh or boomy)
  playError() {
    if (!this.ensureRunning()) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [349.23, 261.63]; // F4 -> C4
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const start = now + idx * 0.05;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, start);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.03, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.11);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([12, 10]);
      }
    } catch (e) {}
  }

  // Handy Aliases & Ketanggungan compatibility
  playClickSound() { this.playClick(); }
  playSuccessSound() { this.playSuccess(); }
  playErrorSound() { this.playError(); }
  playLockSound() { this.playLock(); }
  playUnlockSound() { this.playUnlock(); }
  playLevelCompleted() { this.playSuccess(); }
  playBackupSent() { this.playSuccess(); }
  beep() { this.playScanBeep(); }
  click() { this.playClick(); }
  chime() { this.playSuccess(); }
  error() { this.playError(); }
  lock() { this.playLock(); }
  unlock() { this.playUnlock(); }
}

const IstiqomahSound = new IstiqomahAudioEngine();

// ============================================================================
// 3. MASTER BULUSARI DATA STRUCTURE (3 LANTAI DENGAN KATEGORI & SEED REALISTIS)
// ============================================================================
const ISTIQOMAH_INITIAL_DB = {
  version: '5.0.0-bulusari-enterprise',
  revision: 1,
  branch: 'Istiqomah Grosir Bulusari',
  lastModified: new Date().toISOString(),
  lastModifiedBy: 'Fahri',
  floors: [
    {
      id: 'L1',
      name: 'Lantai 1',
      slots: [
        'Sembako & Beras',
        'Minyak & Bumbu',
        'Sabun & Pembersih',
        'Popok & Tissue',
        'Susu, Kopi & Minuman'
      ]
    },
    {
      id: 'L2',
      name: 'Lantai 2',
      slots: [
        'Gamis & Dress Muslim',
        'Koko & Sarung Pria',
        'Busana Muslim Anak',
        'Hijab & Pashmina',
        'Mukena & Perlengkapan Sholat'
      ]
    },
    {
      id: 'L3',
      name: 'Lantai 3',
      slots: [
        'Alat Masak & Dapur',
        'Peralatan Makan & Minum',
        'Kebersihan & Sanitasi',
        'Wadah & Box Storage',
        'Lampu & Elektronik Rumah'
      ]
    }
  ],
  users: [
    {
      id: 'usr_fahri',
      username: 'fahri',
      name: 'Fahri',
      password: '819',
      role: 'ADMIN',
      floorAccess: 'ALL',
      assignedFloors: ['L1', 'L2', 'L3'],
      createdAt: '2026-10-30',
      lastLogin: '2026-10-31 08:00'
    },
    {
      id: 'usr_eza',
      username: 'eza',
      name: 'Eza (Koordinator)',
      password: '123',
      role: 'STAFF',
      floorAccess: 'ALL',
      assignedFloors: ['L1', 'L2', 'L3'],
      createdAt: '2026-10-30',
      lastLogin: '2026-10-30 16:00'
    },
    {
      id: 'usr_hasan',
      username: 'hasan',
      name: 'Hasan',
      password: '123',
      role: 'STAFF',
      floorAccess: 'L1',
      assignedFloors: ['L1'],
      createdAt: '2026-10-30',
      lastLogin: '2026-10-30 14:00'
    },
    {
      id: 'usr_amal',
      username: 'amal',
      name: 'Amal',
      password: '123',
      role: 'STAFF',
      floorAccess: 'L2',
      assignedFloors: ['L2'],
      createdAt: '2026-10-30',
      lastLogin: '2026-10-30 13:00'
    },
    {
      id: 'usr_erpan',
      username: 'erpan',
      name: 'Erpan',
      password: '123',
      role: 'STAFF',
      floorAccess: 'L3',
      assignedFloors: ['L3'],
      createdAt: '2026-10-30',
      lastLogin: '2026-10-30 12:00'
    },
    {
      id: 'usr_hendra',
      username: 'hendra',
      name: 'Hendra (Auditor)',
      password: '123',
      role: 'VIEWER',
      floorAccess: 'ALL',
      assignedFloors: ['L1', 'L2', 'L3'],
      createdAt: '2026-10-30',
      lastLogin: '2026-10-30 10:00'
    }
  ],
  items: [
    // --- LANTAI 1 (Kebutuhan & Sembako) ---
    { id: 'it_101', floorId: 'L1', category: 'Popok & Tissue', name: 'MamyPoko Pants Standar L28', sku: 'BRG-101', barcode: '89912345001', stock: 38, minStock: 10, unit: 'Pack', location: 'Rak 1A', updatedAt: '2026-10-31 07:30' },
    { id: 'it_102', floorId: 'L1', category: 'Popok & Tissue', name: 'Sweety Silver Pants M30', sku: 'BRG-102', barcode: '89912345002', stock: 24, minStock: 8, unit: 'Pack', location: 'Rak 1B', updatedAt: '2026-10-31 07:45' },
    { id: 'it_103', floorId: 'L1', category: 'Sabun & Pembersih', name: 'Lifebuoy Total 10 Refill 400ml', sku: 'BRG-103', barcode: '89912345003', stock: 45, minStock: 12, unit: 'Pcs', location: 'Rak 2A', updatedAt: '2026-10-31 08:00' },
    { id: 'it_104', floorId: 'L1', category: 'Sabun & Pembersih', name: 'Rinso Molto Cair 750ml', sku: 'BRG-104', barcode: '89912345004', stock: 4, minStock: 15, unit: 'Pcs', location: 'Rak 2B', updatedAt: '2026-10-31 08:15' },
    { id: 'it_105', floorId: 'L1', category: 'Minyak & Bumbu', name: 'Minyak Goreng SunCo 2L Pouch', sku: 'BRG-105', barcode: '89912345005', stock: 62, minStock: 20, unit: 'Pcs', location: 'Rak 3A', updatedAt: '2026-10-31 08:20' },
    { id: 'it_106', floorId: 'L1', category: 'Minyak & Bumbu', name: 'Minyak Goreng Bimoli Klasik 2L', sku: 'BRG-106', barcode: '89912345006', stock: 0, minStock: 15, unit: 'Pcs', location: 'Rak 3B', updatedAt: '2026-10-31 08:30' },
    { id: 'it_107', floorId: 'L1', category: 'Sembako & Beras', name: 'Beras Pandan Wangi Premium 5kg', sku: 'BRG-107', barcode: '89912345007', stock: 22, minStock: 8, unit: 'Karung', location: 'Palet 4A', updatedAt: '2026-10-31 08:35' },
    { id: 'it_108', floorId: 'L1', category: 'Sembako & Beras', name: 'Indomie Goreng Original (Karton 40s)', sku: 'BRG-108', barcode: '89912345008', stock: 35, minStock: 12, unit: 'Dus', location: 'Palet 4B', updatedAt: '2026-10-31 08:40' },
    { id: 'it_109', floorId: 'L1', category: 'Susu, Kopi & Minuman', name: 'Susu UHT Ultra Milk Cokelat 1L', sku: 'BRG-109', barcode: '89912345009', stock: 28, minStock: 10, unit: 'Dus', location: 'Rak 5A', updatedAt: '2026-10-31 08:45' },
    { id: 'it_110', floorId: 'L1', category: 'Susu, Kopi & Minuman', name: 'Kopi Kapal Api Spesial Mix 10x24g', sku: 'BRG-110', barcode: '89912345010', stock: 50, minStock: 15, unit: 'Renceng', location: 'Rak 5B', updatedAt: '2026-10-31 08:50' },
    { id: 'it_111', floorId: 'L1', category: 'Minyak & Bumbu', name: 'Garam Beryodium Cap Kapal 250g', sku: 'BRG-111', barcode: '', stock: 45, minStock: 10, unit: 'Pack', location: 'Rak 2C', updatedAt: '2026-10-31 08:55' },
    { id: 'it_112', floorId: 'L1', category: 'Minyak & Bumbu', name: 'Kecap Manis Bango Pouch 550ml', sku: 'BRG-112', barcode: '', stock: 20, minStock: 5, unit: 'Pcs', location: 'Rak 3C', updatedAt: '2026-10-31 08:56' },

    // --- LANTAI 2 (Busana & Tekstil Muslim) ---
    { id: 'it_201', floorId: 'L2', category: 'Gamis & Dress Muslim', name: 'Gamis Syari Ceruty Babydoll XL', sku: 'BRG-201', barcode: '89912345011', stock: 18, minStock: 5, unit: 'Pcs', location: 'Gantungan A1', updatedAt: '2026-10-31 08:10' },
    { id: 'it_202', floorId: 'L2', category: 'Gamis & Dress Muslim', name: 'Gamis Katun Toyobo Fodu L', sku: 'BRG-202', barcode: '89912345012', stock: 3, minStock: 6, unit: 'Pcs', location: 'Gantungan A2', updatedAt: '2026-10-31 08:15' },
    { id: 'it_203', floorId: 'L2', category: 'Koko & Sarung Pria', name: 'Baju Koko Kurta Pria Toyobo L', sku: 'BRG-203', barcode: '89912345013', stock: 0, minStock: 6, unit: 'Pcs', location: 'Rak B1', updatedAt: '2026-10-31 08:20' },
    { id: 'it_204', floorId: 'L2', category: 'Koko & Sarung Pria', name: 'Sarung Wadimor Manise Motif Polos', sku: 'BRG-204', barcode: '89912345014', stock: 40, minStock: 10, unit: 'Pcs', location: 'Rak B2', updatedAt: '2026-10-31 08:25' },
    { id: 'it_205', floorId: 'L2', category: 'Hijab & Pashmina', name: 'Pashmina Ceruty Hitam Jetblack', sku: 'BRG-205', barcode: '89912345015', stock: 65, minStock: 15, unit: 'Pcs', location: 'Display C1', updatedAt: '2026-10-31 08:30' },
    { id: 'it_206', floorId: 'L2', category: 'Hijab & Pashmina', name: 'Jilbab Bella Square Aneka Warna', sku: 'BRG-206', barcode: '89912345016', stock: 82, minStock: 20, unit: 'Pcs', location: 'Display C2', updatedAt: '2026-10-31 08:35' },
    { id: 'it_207', floorId: 'L2', category: 'Mukena & Perlengkapan Sholat', name: 'Mukena Silk Premium Renda Putih', sku: 'BRG-207', barcode: '89912345017', stock: 16, minStock: 5, unit: 'Set', location: 'Rak D1', updatedAt: '2026-10-31 08:40' },
    { id: 'it_208', floorId: 'L2', category: 'Busana Muslim Anak', name: 'Setelan Koko Anak Usia 6-8 Thn', sku: 'BRG-208', barcode: '89912345018', stock: 2, minStock: 6, unit: 'Set', location: 'Gantungan E1', updatedAt: '2026-10-31 08:45' },
    { id: 'it_209', floorId: 'L2', category: 'Koko & Sarung Pria', name: 'Songkok Peci Nasional Hitam AC No 8', sku: 'BRG-209', barcode: '', stock: 25, minStock: 5, unit: 'Pcs', location: 'Rak B3', updatedAt: '2026-10-31 08:50' },

    // --- LANTAI 3 (Perabotan & Elektronik Rumah) ---
    { id: 'it_301', floorId: 'L3', category: 'Alat Masak & Dapur', name: 'Wajan Wok Pan Teflon 30cm Anti Lengket', sku: 'BRG-301', barcode: '89912345019', stock: 14, minStock: 5, unit: 'Pcs', location: 'Rak A1', updatedAt: '2026-10-31 08:15' },
    { id: 'it_302', floorId: 'L3', category: 'Alat Masak & Dapur', name: 'Panci Presto Stainless 8 Liter', sku: 'BRG-302', barcode: '89912345020', stock: 8, minStock: 3, unit: 'Pcs', location: 'Rak A2', updatedAt: '2026-10-31 08:20' },
    { id: 'it_303', floorId: 'L3', category: 'Peralatan Makan & Minum', name: 'Set Piring Keramik Marmer 6 Pcs', sku: 'BRG-303', barcode: '89912345021', stock: 20, minStock: 6, unit: 'Set', location: 'Rak B1', updatedAt: '2026-10-31 08:25' },
    { id: 'it_304', floorId: 'L3', category: 'Kebersihan & Sanitasi', name: 'Set Sapu Nagata & Pengki Komplit', sku: 'BRG-304', barcode: '89912345022', stock: 26, minStock: 8, unit: 'Set', location: 'Rak B2', updatedAt: '2026-10-31 08:30' },
    { id: 'it_305', floorId: 'L3', category: 'Wadah & Box Storage', name: 'Kontainer Box Plastik Roda 60L', sku: 'BRG-305', barcode: '89912345023', stock: 0, minStock: 5, unit: 'Pcs', location: 'Palet C1', updatedAt: '2026-10-31 08:35' },
    { id: 'it_306', floorId: 'L3', category: 'Lampu & Elektronik Rumah', name: 'Lampu LED Hannochs Premier 15W Putih', sku: 'BRG-306', barcode: '89912345024', stock: 2, minStock: 10, unit: 'Pcs', location: 'Rak D1', updatedAt: '2026-10-31 08:40' },
    { id: 'it_307', floorId: 'L3', category: 'Kebersihan & Sanitasi', name: 'Gayung Plastik Mandi Tebal Hijau', sku: 'BRG-307', barcode: '', stock: 35, minStock: 8, unit: 'Pcs', location: 'Rak B3', updatedAt: '2026-10-31 08:45' }
  ],
  mutations: [
    { id: 'MUT-001', timestamp: '2026-10-31 07:15', itemId: 'it_105', itemName: 'Minyak Goreng SunCo 2L Pouch', type: 'IN', qty: 25, unit: 'Pcs', floorId: 'L1', user: 'Fahri', note: 'Restock masuk dari distributor' },
    { id: 'MUT-002', timestamp: '2026-10-31 07:45', itemId: 'it_108', itemName: 'Indomie Goreng Original (Karton 40s)', type: 'OUT', qty: 10, unit: 'Dus', floorId: 'L1', user: 'Hasan', note: 'Pengeluaran display toko' },
    { id: 'MUT-003', timestamp: '2026-10-31 08:10', itemId: 'it_204', itemName: 'Sarung Wadimor Manise Motif Polos', type: 'OPNAME', qty: 40, unit: 'Pcs', floorId: 'L2', user: 'Fahri', note: 'Penyesuaian audit opname pagi' },
    { id: 'MUT-004', timestamp: '2026-10-31 08:30', itemId: 'it_301', itemName: 'Wajan Wok Pan Teflon 30cm Anti Lengket', type: 'IN', qty: 6, unit: 'Pcs', floorId: 'L3', user: 'Erpan', note: 'Penerimaan kiriman ekspedisi' }
  ],
  soGroups: [
    {
      id: 'SO_L1',
      name: 'OPNAME HARIAN LANTAI 1',
      floorId: 'L1',
      createdAt: '2026-10-31 07:00',
      entries: [
        { id: 'soe_1', barcode: '89912345001', sku: 'BRG-101', name: 'MamyPoko Pants Standar L28', systemQty: 38, countedQty: 38, scanCount: 3, lastDelta: 10, prevQty: 28 },
        { id: 'soe_2', barcode: '89912345004', sku: 'BRG-104', name: 'Rinso Molto Cair 750ml', systemQty: 5, countedQty: 4, scanCount: 1, lastDelta: 4, prevQty: 0 }
      ]
    },
    {
      id: 'SO_L2',
      name: 'OPNAME HARIAN LANTAI 2',
      floorId: 'L2',
      createdAt: '2026-10-31 07:30',
      entries: [
        { id: 'soe_3', barcode: '89912345014', sku: 'BRG-204', name: 'Sarung Wadimor Manise Motif Polos', systemQty: 40, countedQty: 40, scanCount: 2, lastDelta: 20, prevQty: 20 }
      ]
    },
    {
      id: 'SO_L3',
      name: 'OPNAME HARIAN LANTAI 3',
      floorId: 'L3',
      createdAt: '2026-10-31 08:00',
      entries: [
        { id: 'soe_4', barcode: '89912345019', sku: 'BRG-301', name: 'Wajan Wok Pan Teflon 30cm Anti Lengket', systemQty: 14, countedQty: 14, scanCount: 1, lastDelta: 14, prevQty: 0 }
      ]
    }
  ]
};

// ============================================================================
// 4. PURE JS ZIP BUILDER FOR STANDALONE OFFLINE ARCHIVE
// ============================================================================
const IstiqomahZipBuilder = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function createZipBlob(files) {
    const encoder = new TextEncoder();
    const fileEntries = [];
    let byteOffset = 0;
    const parts = [];
    files.forEach(f => {
      const nameBytes = encoder.encode(f.name);
      const dataBytes = typeof f.content === 'string' ? encoder.encode(f.content) : f.content;
      const crc = crc32(dataBytes);
      const size = dataBytes.length;
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const view = new DataView(localHeader.buffer);
      view.setUint32(0, 0x04034B50, true);
      view.setUint16(4, 20, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, size, true);
      view.setUint32(22, size, true);
      view.setUint16(26, nameBytes.length, true);
      localHeader.set(nameBytes, 30);
      parts.push(localHeader, dataBytes);
      fileEntries.push({ nameBytes, crc, size, offset: byteOffset });
      byteOffset += localHeader.length + dataBytes.length;
    });
    const centralDirStart = byteOffset;
    let centralDirSize = 0;
    fileEntries.forEach(entry => {
      const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
      const view = new DataView(cdHeader.buffer);
      view.setUint32(0, 0x02014B50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 20, true);
      view.setUint32(16, entry.crc, true);
      view.setUint32(20, entry.size, true);
      view.setUint32(24, entry.size, true);
      view.setUint16(28, entry.nameBytes.length, true);
      view.setUint32(42, entry.offset, true);
      cdHeader.set(entry.nameBytes, 46);
      parts.push(cdHeader);
      centralDirSize += cdHeader.length;
    });
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054B50, true);
    eocdView.setUint16(8, fileEntries.length, true);
    eocdView.setUint16(10, fileEntries.length, true);
    eocdView.setUint32(12, centralDirSize, true);
    eocdView.setUint32(16, centralDirStart, true);
    parts.push(eocd);
    return new Blob(parts, { type: 'application/zip' });
  }
  return { createZipBlob };
})();

// ============================================================================
// 5. VECTOR CODE-128 BARCODE SVG & UTILITIES
// ============================================================================
const IstiqomahUtils = {
  generateBarcodeSvg(text, height = 44) {
    const cleanText = String(text || '89912345000').replace(/[^A-Za-z0-9_-]/g, '');
    let barsSvg = '';
    let x = 8;
    barsSvg += `<rect x="${x}" y="0" width="2.2" height="${height + 6}" fill="#0F172A" />`;
    x += 4.5;
    barsSvg += `<rect x="${x}" y="0" width="2.2" height="${height + 6}" fill="#0F172A" />`;
    x += 4.5;
    for (let i = 0; i < cleanText.length; i++) {
      const charCode = cleanText.charCodeAt(i);
      const pattern = [(charCode % 3) + 1, ((charCode >> 1) % 2) + 1, ((charCode >> 2) % 3) + 1, ((charCode >> 3) % 2) + 1];
      pattern.forEach((w, pIdx) => {
        if (pIdx % 2 === 0) barsSvg += `<rect x="${x}" y="0" width="${w * 2.2}" height="${height}" fill="#0F172A" />`;
        x += w * 2.2;
      });
    }
    barsSvg += `<rect x="${x}" y="0" width="2.2" height="${height + 6}" fill="#0F172A" />`;
    x += 4.5;
    barsSvg += `<rect x="${x}" y="0" width="2.2" height="${height + 6}" fill="#0F172A" />`;
    x += 8;
    return `<svg width="${x}" height="${height + 6}" viewBox="0 0 ${x} ${height + 6}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%; height:auto;">${barsSvg}</svg>`;
  },

  formatNow() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  formatDateOnly() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  },

  playBeep(success = true) {
    if (success) IstiqomahSound.beep();
    else IstiqomahSound.error();
  }
};

// ============================================================================
// 6. MASTER DATABASE STORAGE & LAN SYNC ENGINE
// ============================================================================
class IstiqomahDataEngine {
  constructor(platformName) {
    this.platformName = platformName;
    this.storageKey = 'istiqomah_bulusari_master_v50';
    this.wifiSyncKey = 'istiqomah_bulusari_wifi_sync_enabled';
    this.currentUserKey = 'istiqomah_bulusari_current_user';
    this.authSessionKey = 'istiqomah_bulusari_auth_session_' + platformName;

    const savedWifi = localStorage.getItem(this.wifiSyncKey);
    this.wifiSyncEnabled = savedWifi === null ? true : savedWifi === 'true';
    this.wifiConnected = false;
    this.lastSyncAt = null;
    this.listeners = [];

    this.startOptionalWifiSyncLoop();
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure strictly 3 floors with proper names
        parsed.floors = [
          {
            id: 'L1',
            name: 'Lantai 1',
            slots: ['Sembako & Beras', 'Minyak & Bumbu', 'Sabun & Pembersih', 'Popok & Tissue', 'Susu, Kopi & Minuman']
          },
          {
            id: 'L2',
            name: 'Lantai 2',
            slots: ['Gamis & Dress Muslim', 'Koko & Sarung Pria', 'Busana Muslim Anak', 'Hijab & Pashmina', 'Mukena & Perlengkapan Sholat']
          },
          {
            id: 'L3',
            name: 'Lantai 3',
            slots: ['Alat Masak & Dapur', 'Peralatan Makan & Minum', 'Kebersihan & Sanitasi', 'Wadah & Box Storage', 'Lampu & Elektronik Rumah']
          }
        ];
        if (!parsed.users || parsed.users.length === 0) {
          parsed.users = JSON.parse(JSON.stringify(ISTIQOMAH_INITIAL_DB.users));
        }
        return parsed;
      }
    } catch (e) {}
    const init = JSON.parse(JSON.stringify(ISTIQOMAH_INITIAL_DB));
    localStorage.setItem(this.storageKey, JSON.stringify(init));
    return init;
  }

  saveState(state, modifiedBy = 'Fahri') {
    state.revision = (state.revision || 1) + 1;
    state.lastModified = new Date().toISOString();
    state.lastModifiedBy = modifiedBy;
    localStorage.setItem(this.storageKey, JSON.stringify(state));

    if (this.wifiSyncEnabled) {
      this.pushWifiSync(state);
    }
  }

  getCurrentUser(state) {
    try {
      const savedId = localStorage.getItem(this.currentUserKey);
      if (savedId) {
        const found = state.users.find(u => u.id === savedId || u.username === savedId);
        if (found) return found;
      }
    } catch (e) {}
    return state.users[0]; // Default: Fahri (Super Admin)
  }

  setCurrentUser(userId) {
    localStorage.setItem(this.currentUserKey, userId);
    sessionStorage.setItem(this.authSessionKey, 'true');
  }

  isAuthenticated() {
    return sessionStorage.getItem(this.authSessionKey) === 'true';
  }

  setAuthenticated(val) {
    if (val) {
      sessionStorage.setItem(this.authSessionKey, 'true');
    } else {
      sessionStorage.removeItem(this.authSessionKey);
    }
  }

  setWifiSyncEnabled(enabled) {
    this.wifiSyncEnabled = !!enabled;
    localStorage.setItem(this.wifiSyncKey, this.wifiSyncEnabled ? 'true' : 'false');
    if (this.wifiSyncEnabled) {
      this.pushWifiSync(this.loadState());
    }
  }

  async pushWifiSync(state) {
    if (!this.wifiSyncEnabled) return false;
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, source: this.platformName })
      });
      if (res.ok) {
        this.wifiConnected = true;
        this.lastSyncAt = IstiqomahUtils.formatNow();
        return true;
      }
    } catch (e) {
      this.wifiConnected = false;
    }
    return false;
  }

  async pullWifiSync() {
    if (!this.wifiSyncEnabled) return false;
    try {
      const res = await fetch('/api/state?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return false;
      const remote = await res.json();
      this.wifiConnected = true;
      const local = this.loadState();

      if (remote && remote.version === '5.0.0-bulusari-enterprise' && remote.revision > (local.revision || 0)) {
        localStorage.setItem(this.storageKey, JSON.stringify(remote));
        this.lastSyncAt = IstiqomahUtils.formatNow();
        this.listeners.forEach(cb => cb(remote));
        return true;
      } else if (!remote || remote.version !== '5.0.0-bulusari-enterprise' || (local.revision || 0) > (remote.revision || 0)) {
        await this.pushWifiSync(local);
      }
    } catch (e) {
      this.wifiConnected = false;
    }
    return false;
  }

  startOptionalWifiSyncLoop() {
    setTimeout(() => this.pullWifiSync(), 250);
    setInterval(() => {
      if (this.wifiSyncEnabled) this.pullWifiSync();
    }, 1500);
  }

  onRemoteUpdate(cb) {
    this.listeners.push(cb);
  }
}

// Global attach
window.ICONS = ICONS;
window.IstiqomahSound = IstiqomahSound;
window.ISTIQOMAH_INITIAL_DB = ISTIQOMAH_INITIAL_DB;
window.IstiqomahZipBuilder = IstiqomahZipBuilder;
window.IstiqomahUtils = IstiqomahUtils;
window.IstiqomahDataEngine = IstiqomahDataEngine;
