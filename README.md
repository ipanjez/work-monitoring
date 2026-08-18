# 📊 Dashboard Monitoring Pekerjaan 📋

Selamat datang di **Dashboard Monitoring Pekerjaan**! Sebuah aplikasi web fullstack modern dan responsif yang dirancang untuk memonitor, mengelola, dan melacak daftar pekerjaan harian, sub-tugas proyek, serta aktivitas tim secara efisien dan real-time. 🚀

Proyek ini mendukung **dua mode operasi**: deployment cloud melalui Vercel + Neon PostgreSQL, maupun server lokal berbasis SQLite untuk jaringan LAN kantor. Dilengkapi dengan antarmuka yang sangat estetik (*Glassmorphism*, Dark/Light mode), manajemen master data terpusat, fitur ekstraksi teks cerdas (*AI Parser Smart Add*), serta integrasi kalender dan Excel interaktif. 🏆

---

## ✨ Fitur Unggulan

- ⚡ **Tambah Cepat (Smart Add / AI Parser):** Ekstraksi teks agenda/memo bebas secara otomatis menjadi daftar tugas terstruktur, mencakup Tanggal, Jam Kerja, PIC Utama, PIC Tambahan, Master Lokasi (Zoom/Ruang Rapat), Kategori, dan Prioritas. Dilengkapi template cepat dan aksi massal.
- 👥 **Kolaborasi Multi-PIC & Chip Tag:** Penugasan pekerjaan ke satu PIC Utama beserta banyak PIC Tambahan berbasis tag interaktif, lengkap dengan kalkulasi beban kerja tim secara otomatis dan adil.
- 📍 **Integrasi Master Lokasi Pintar:** Master lokasi terpusat dengan deteksi otomatis tipe Online (Link Zoom / Google Meet / Teams) vs Offline (Ruang Rapat / Gedung Fisik) pada form manual, Smart Add, dan Excel.
- 📊 **Rich Excel Template & Interactive Import Preview:**
  - Unduh template Excel dengan *Data Validation Dropdown* otomatis untuk PIC, Kategori, Prioritas, Status, dan Lokasi.
  - Pratinjau impor Excel interaktif dengan dropdown untuk koreksi lokasi atau penghapusan baris keliru sebelum disimpan ke database.
  - Ekspor Excel berwarna dengan format warna dinamis sesuai status dan prioritas tugas.
- 🎮 **Monitoring Board (Kanban) & Daftar Pekerjaan:** Mengelola tugas dengan *kanban drag & drop*, filter universal, sorting dinamis, sub-tugas (*checklist* bertingkat), duplikasi 1-ke-1, dan *multi-file attachments*.
- 📅 **Kalender Interaktif & Google Calendar Sync:** Tampilan kalender multi-mode (Bulan, Minggu, Hari, Agenda), penandaan otomatis Hari Libur Nasional Indonesia, serta sinkronisasi ke Google Calendar dan file `.ics`.
- ☁️ **Dual-Mode Database & Storage:** 
  - **Cloud (Vercel):** Menggunakan PostgreSQL (Neon) & Vercel Blob untuk penyimpanan file online.
  - **Lokal (LAN):** Menggunakan SQLite & *Local Disk Storage* (file tersimpan langsung di hard disk, 100% independen tanpa kuota internet).
  - Keduanya terisolasi dan bisa dijalankan bergantian dengan aman (`npm run dev:local` untuk lokal).
- 🔒 **Keamanan & Otorisasi Enterprise (RBAC):** 
  - *Role-Based Access Control* (Admin, Member, Viewer) dengan Matriks Hak Akses (*Role Permissions Matrix*) yang dapat dikonfigurasi.
  - Sistem autentikasi berbasis NPK dengan fitur alur Reset Password ke panel Admin.
  - *Global Middleware / Proxy Route Protection* untuk mengamankan API rahasia.
  - Sanitasi HTML (Anti-XSS DOMPurify) dan *whitelist* ekstensi file unggahan.
- 📖 **Buku Panduan Terintegrasi & Ekspor PDF:** Halaman panduan interaktif lengkap dengan navigasi bab dan fungsi cetak/unduh PDF resmi (`window.print`) berformat A4 yang siap dicetak.
- 📦 **Backup & Restore 1-Klik:** Unduh cadangan database dan file lampiran dalam satu file `.zip` serta pemulihan instan kapan saja.

---

## 🛠️ Tech Stack

| Teknologi | Fungsi |
|-----------|--------|
| **Next.js (React 19 / App Router)** | Framework Fullstack (Frontend UI + API Routes) |
| **Prisma ORM** | Abstraksi Database (PostgreSQL & SQLite) |
| **PostgreSQL (Neon)** | Database Cloud untuk Deployment Vercel |
| **SQLite** | Database Lokal untuk Server LAN Kantor |
| **NextAuth.js** | Autentikasi Berbasis Sesi & NPK |
| **Framer Motion** | Animasi & Transisi Interaktif Halus |
| **Lucide React** | Ikon Modern & Konsisten |
| **XLSX (SheetJS)** | Pengolahan, Validasi, & Ekspor/Impor Rich Excel |
| **Vanilla CSS** | Styling Modern (Glassmorphism, Dark/Light Theme) |

---

## 🚀 Cara Penggunaan & Instalasi

Ikuti langkah-langkah berikut untuk menjalankan proyek di perangkat lokal atau server kantor:

### 1. Clone Repositori
```bash
git clone https://github.com/ipanjez/work-monitoring.git
cd work-monitoring
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Buat file `.env` di direktori utama:

**Mode Lokal (SQLite):**
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

**Mode Cloud (PostgreSQL/Neon):**
```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host-unpooled/database?sslmode=require"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Sinkronisasi Database
```bash
npx prisma db push
```

### 5. Menjalankan Server

Tersedia **dua perintah utama**:

| Perintah | Mode | Database | Keterangan |
|----------|------|----------|------------|
| `npm run dev:local` | 🖥️ **Lokal (LAN)** | SQLite | Data & file tersimpan di hard disk lokal. Bisa diakses seluruh tim di jaringan LAN tanpa internet. |
| `npm run dev` | 🌐 **Cloud** | PostgreSQL (Neon) | Data tersimpan di cloud Neon. Memerlukan koneksi internet. |

Untuk server lokal kantor (direkomendasikan):
```bash
npm run dev:local
```

### 6. Akses Aplikasi
- **Komputer Utama:** Buka `http://localhost:3000`
- **Perangkat Lain di Jaringan LAN:** Buka `http://<IP-Komputer-Anda>:3000` (contoh: `http://192.168.1.100:3000`)

---

## 🔄 Arsitektur Dual-Mode

```
┌─────────────────────────────────────────────────────┐
│              GitHub Repository (main)                │
│         schema.prisma → PostgreSQL (default)         │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   ☁️ Vercel (Cloud)  │     🖥️ Lokal (LAN)          │
│   ─────────────────  │     ───────────────          │
│   PostgreSQL (Neon)  │     SQLite (dev.db)          │
│   Auto-deploy dari   │     npm run dev:local        │
│   GitHub push        │     Otomatis switch schema   │
│                      │                              │
│   Akses:             │     Akses:                   │
│   https://<domain>-  │     http://192.168.x.x:3000  │
│   .vercel.app        │     (Jaringan LAN kantor)    │
└──────────────────────┴──────────────────────────────┘
```

---

## 📦 Cadangan & Pemulihan Data (1-Click Backup / Restore)

1. Buka menu **/settings** di aplikasi.
2. Pada bagian **Cadangan & Export Data Database**, klik **Unduh Backup** untuk mengunduh arsip `.zip` yang memuat seluruh database dan file lampiran.
3. Untuk memulihkan data pada server lain atau mode SQLite lokal, klik **Pulihkan dari Backup** dan unggah file `.zip` tersebut.

---

## 📝 Riwayat Pembaruan Terkini (Changelog)

- ✨ **Smart Add & Multi-PIC Dropdown:** Penambahan selector dropdown PIC Tambahan dengan chip tag dan integrasi master lokasi otomatis pada AI Parser.
- 📍 **Master Lokasi Terintegrasi:** Deteksi cerdas Online (Zoom) vs Offline (Ruang Rapat) di seluruh form tambah/edit, Smart Add, dan modal pratinjau impor Excel.
- 📊 **Excel Data Validation & Preview Modal:** Template Excel kini memuat dropdown validasi data otomatis untuk Master PIC, Kategori, Prioritas, Status, dan Lokasi. Pratinjau impor dilengkapi dropdown pengeditan langsung.
- 🔒 **Role Permissions Matrix & User PIC Sync:** Pemisahan ketat antara Master PIC kerja dan akun login pengguna untuk integritas data tim.
- 📖 **Buku Panduan Lengkap & Cetak PDF:** Penyempurnaan 9 bab panduan aplikasi serta layout cetak PDF resmi berstandar A4.

---

## 👨‍💻 Kredit & Pengembang

Proyek ini dirancang dan dikembangkan oleh **ipanjez**.

[![GitHub](https://img.shields.io/badge/GitHub-ipanjez-181717?style=flat&logo=github)](https://github.com/ipanjez)
[![Instagram](https://img.shields.io/badge/Instagram-ipanjez-E4405F?style=flat&logo=instagram)](https://instagram.com/ipanjez)
[![Facebook](https://img.shields.io/badge/Facebook-ipanjez-1877F2?style=flat&logo=facebook)](https://facebook.com/ipanjez)
