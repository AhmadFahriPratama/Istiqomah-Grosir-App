# Istiqomah Grosir Bulusari — Sistem Manajemen Stok Fisik 3 Lantai (v5.0 Enterprise)

Sistem manajemen inventaris dan stok gudang modern untuk **Istiqomah Grosir Cabang Bulusari** dengan arsitektur **Offline-First**, dukungan ekspor/impor mandiri, opsi sinkronisasi satu jaringan Wi-Fi, antarmuka mobile warehouse, serta konsol desktop enterprise lengkap dengan wizard pendaftaran barang berprogress dan mode pelengkap barcode.

---

## Akses Aplikasi Live Preview

| Antarmuka | Port & URL | Deskripsi & Fokus Perangkat |
| :--- | :--- | :--- |
| **Mobile Warehouse View** | **`http://localhost:3000`** | Dioptimalkan untuk layar ponsel staf gudang: scan barcode cepat, wizard input barang 3 tahap, mutasi in/out, audit stock opname per aisle, dan mode lengkapi barcode. |
| **Desktop Enterprise Console** | **`http://localhost:3001`** | Dioptimalkan untuk monitor PC/Laptop admin: master tabel multi-filter, stasiun rekonsiliasi SO, manajemen akun pengguna, dan pusat cetak laporan resmi standar A4. |

---

## Karakteristik Khusus Cabang Bulusari

1. **Struktur 3 Lantai Sederhana & Bersih**:
   - Berbeda dari cabang Ketanggungan, cabang Bulusari memiliki struktur fisik **3 Lantai**:
     - **Lantai 1**
     - **Lantai 2**
     - **Lantai 3**
   - Tanpa label klasifikasi komoditas yang membingungkan atau berantakan; penamaan lantai lugas dan terstandarisasi.

2. **Hierarki Akun & Super Admin Fahri**:
   - Akun Super Admin default: **`Fahri`** (PIN Cepat: `819` atau `123`).
   - Super Admin memiliki hak penuh membuat akun operator lantai, mengatur hak akses per lantai, mereset PIN, dan mengelola database.

3. **Operasional Offline Total & Opsi Sinkron Wi-Fi**:
   - **Offline Total (Air-Gapped)**: Aplikasi dapat berjalan sepenuhnya tanpa koneksi internet dengan metode ekspor dan impor data terenkripsi JSON serta arsip cadangan ZIP.
   - **Sinkronisasi Satu Jaringan (Wi-Fi)**: Tersedia toggle mode Wi-Fi untuk menghubungkan perangkat HP staf dan PC kasir/admin di satu router yang sama secara nirkabel tanpa server cloud pihak ketiga.

4. **Progressive 3-Step Wizard (Scan Barcode di Awal)**:
   - Terinspirasi dari alur kerja efisien gudang grosir:
     - **Tahap 1 — Scan Barcode**: Memindai barcode fisik di awal via kamera atau scanner USB dengan deteksi tabrakan (duplicate collision detection) seketika dan tombol Auto-SKU.
     - **Tahap 2 — Info Produk**: Nama produk otomatis kapital, pemilihan Lantai (1, 2, atau 3), posisi rak, dan kode SKU.
     - **Tahap 3 — Stok & Satuan**: Penyesuaian stok awal menggunakan stepper cepat (-5, -1, +1, +5, +10) dan pill satuan instan (PCS, PACK, DUS, KARUNG, KARTON, UNIT, LUSIN, SET).

5. **Mode Lengkapi Barcode Berprogress (Waktu Senggang)**:
   - Fitur khusus saat staf memiliki waktu luang untuk melengkapi barang-barang yang belum memiliki barcode.
   - Dilengkapi meteran persentase kelengkapan live (0–100%), filter per lantai, kartu produk aktif, scanner otomatis berpindah (auto-advance), dan daftar antrean barang.

6. **Pusat Cetak Laporan Resmi A4 (Desktop Only)**:
   - Laporan cetak difokuskan secara eksklusif pada desktop untuk memastikan tata letak kertas A4 proporsional:
     - Laporan Master Inventaris Lengkap
     - Laporan Peringatan Stok Menipis & Habis
     - Rekapitulasi Stok per Lantai (L1, L2, L3)
     - Laporan Rekonsiliasi Hasil Stock Opname (SO)
     - Log Riwayat Mutasi Barang Masuk & Keluar
     - Cetak Lembar Stiker Barcode Rak Standar A4 (Grid 3 Kolom)

7. **Desain Bersih & Standar Industri**:
   - 100% Bebas Emoji: Seluruh antarmuka menggunakan ikon vektor garis SVG profesional.
   - Palet warna kontras tinggi bernuansa Slate & Indigo yang ramah mata untuk pencahayaan gudang.

---

## Menjalankan Server Lokal

Jalankan perintah PowerShell berikut di direktori proyek:

```powershell
powershell -ExecutionPolicy Bypass -File .\Start-Server.ps1
```

Server otomatis melayani dua antarmuka sekaligus:
- **Port 3000**: Antarmuka Mobile
- **Port 3001**: Antarmuka Desktop

---

## Lisensi & Kepemilikan

Dikembangkan khusus untuk **Istiqomah Grosir Cabang Bulusari**.
Hak Cipta (c) 2026 Istiqomah Grosir.
