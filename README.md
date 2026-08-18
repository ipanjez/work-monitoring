# 📊 Dashboard Monitoring Pekerjaan 📋

Selamat datang di **Dashboard Monitoring Pekerjaan**! Sebuah platform web modern, tangguh, dan responsif yang dirancang untuk memonitor, mengelola, dan melacak seluruh daftar pekerjaan harian, proyek tim, serta agenda kerja departemen secara terpusat dan *real-time*. 🚀

Proyek ini mendukung **dua mode operasi penuh**: *cloud deployment* (Vercel + Neon PostgreSQL) maupun *on-premise server* lokal (SQLite) untuk jaringan LAN kantor. Dilengkapi dengan antarmuka berestetika tinggi (*Glassmorphism*, Dark/Light Mode), sistem otorisasi berbasis peran (RBAC), integrasi kalender otomatis, serta ekspor laporan eksekutif. 🏆

---

## ✨ Fitur Unggulan

- 🎮 **Universal Action Bar & Filter Terpadu:** Seluruh menu (Monitoring Board, Dashboard, Daftar Pekerjaan, Kalender, Analisis Laporan, dan Manajemen Tim) kini dilengkapi dengan *Universal Action Bar* yang seragam (Export Excel, Export PDF, Salin Gambar, dan Sinkronisasi Kalender).
- 🗓️ **Sinkronisasi Kalender Otomatis (iCal / Google Calendar / Outlook):** Berlangganan agenda kerja langsung ke Google Calendar, Apple Calendar, atau Microsoft Outlook melalui URL Feed terenkripsi token rahasia dengan filter personalisasi per PIC dan Kategori.
- 👥 **Manajemen Tim & Analisis Beban Kerja:** Menghitung kapasitas beban kerja per PIC secara otomatis (Beban Tinggi, Optimal, Ringan), matriks KPI penyelesaian tugas, skor kepatuhan tenggat, serta visualisasi grafik *Workload Bar Chart* dengan avatar dinamis.
- 🎨 **Identitas Warna Master PIC Melingkar:** Setiap personil memiliki identitas warna Master PIC kustom yang otomatis terimplementasi sebagai cincin lingkar luar (*outline/border ring*) pada seluruh foto profil, kartu tim, menu profil, dan grafik.
- ✉️ **Pengiriman Email Estetik & Kartu HTML:** Mengirim rincian tugas ke seluruh PIC melalui email dengan pratinjau kartu HTML visual modern yang dapat disalin dengan 1-klik (*copy-paste*) ke Gmail atau Outlook.
- ⏰ **Pengingat Pencadangan Database Berkala (Global Backup Reminder):** Sistem notifikasi pop-up otomatis yang mengingatkan Admin untuk mencadangkan database dan lampiran berkas secara rutin (setiap login, mingguan, bulanan, atau jadwal kustom) dengan dukungan penuh Dark Mode.
- 🤖 **Smart Add Modal (NLP Task Parser):** Penambahan tugas cepat dengan teks natural yang otomatis mengekstraksi judul, tenggat waktu, PIC, prioritas, dan kategori secara cerdas.
- 🔒 **Sistem Hak Akses Peran (Granular RBAC):** Pengaturan hak akses peran (*Role Permissions Matrix*) yang fleksibel (Admin, Member, Viewer, Supervisor, Guest) untuk melindungi fitur operasional, pengaturan sistem, dan administrasi akun.
- ☁️ **Dual-Mode Database & Storage:** 
  - **Cloud (Vercel):** PostgreSQL (Neon) & Vercel Blob untuk penyimpanan file online.
  - **Lokal (LAN):** SQLite & *Local Disk Storage* (tersimpan langsung di hard disk tanpa ketergantungan internet).
- 🌙 **Dukungan Dark Mode & Light Mode:** Antarmuka responsif dengan transisi warna halus, font *Outfit*, dan rasio kontras visual yang nyaman di mata.

---

## 🛠️ Tech Stack

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Frontend & Backend** | [Next.js](https://nextjs.org/) (React 19 / App Router) | Fullstack React framework & Server Actions |
| **ORM & Database** | [Prisma ORM](https://www.prisma.io/) | PostgreSQL (Neon Cloud) & SQLite (Lokal) |
| **Autentikasi** | [NextAuth.js](https://next-auth.js.org/) | Manajemen sesi, enkripsi kata sandi, dan proteksi rute |
| **Visualisasi Grafik** | [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/) | Diagram Donat, Batang, dan Garis dengan plugin avatar kustom |
| **Styling & Animasi** | Vanilla CSS Tokens & [Framer Motion](https://www.framer.com/motion/) | Glassmorphism, Micro-animations, dan Dark/Light Mode |
| **Ekspor & Utilitas** | `xlsx`, `jspdf`, `html2canvas`, `date-fns` | Pembuatan laporan Excel kaya format, PDF, dan gambar |

---

## 🚀 Panduan Instalasi & Penggunaan

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
Buat file `.env` di direktori utama sesuai kebutuhan mode Anda:

**Mode Lokal (SQLite - Rekomendasi Jaringan Kantor):**
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="kunci-rahasia-anda-yang-aman"
NEXTAUTH_URL="http://localhost:3000"
```

**Mode Cloud (PostgreSQL / Neon):**
```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host-unpooled/database?sslmode=require"
NEXTAUTH_SECRET="kunci-rahasia-anda-yang-aman"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Sinkronisasi Database
```bash
npx prisma db push
```

### 5. Menjalankan Server

Pilih salah satu mode server:

| Perintah | Lingkungan | Basis Data | Deskripsi |
|---|---|---|---|
| `npm run dev:local` | 🖥️ **Lokal (LAN)** | SQLite (`dev.db`) | Berjalan 100% di hard disk lokal, dapat diakses via WiFi/LAN kantor tanpa kuota internet. |
| `npm run dev` | 🌐 **Cloud** | PostgreSQL (Neon) | Menggunakan database cloud online. |

### 6. Mengakses Aplikasi
- **Dari komputer lokal:** Buka [http://localhost:3000](http://localhost:3000)
- **Dari perangkat lain di jaringan WiFi/LAN yang sama:** Buka `http://<IP-Komputer-Anda>:3000` (contoh: `http://192.168.1.10:3000`)

---

## 🔄 Arsitektur Dual-Mode & Penyimpanan

```
┌────────────────────────────────────────────────────────┐
│               GitHub Repository (Branch: main)         │
│          schema.prisma → PostgreSQL (Cloud Default)    │
├──────────────────────────┬─────────────────────────────┤
│                          │                             │
│   ☁️ Vercel Deployment   │     🖥️ Server Lokal (LAN)   │
│   ───────────────────    │     ────────────────────    │
│   PostgreSQL (Neon)      │     SQLite (dev.db)         │
│   Vercel Blob Storage    │     Local Disk Storage      │
│   Akses: Domain Cloud    │     Akses: IP LAN (192.168) │
│                          │     Perintah: dev:local     │
└──────────────────────────┴─────────────────────────────┘
```

- Skrip `npm run dev:local` secara otomatis membuat *schema* SQLite bayangan (`schema.sqlite.prisma`) tanpa mengubah file sumber asli, menjamin keamanan Git dan menghindari konflik saat *push*.
- File lampiran pada mode lokal disimpan langsung di direktori `public/uploads/` sehingga bebas biaya *bandwidth* dan kuota *cloud storage*.

---

## 📦 Pencadangan & Pemulihan Data (1-Click Backup & Restore)

1. **Unduh Backup (.zip):** Buka menu **Pengaturan** > **Cadangan & Export Data Database** > Klik **Unduh Backup (.zip)**. Paket zip akan mencakup seluruh arsip data JSON (`database.json`) beserta berkas lampiran fisik dan foto profil.
2. **Pemulihan (*Restore*):** Klik tombol **Restore Database**, unggah berkas `.zip` cadangan, dan sistem akan merekonstruksi seluruh pekerjaan, akun pengguna, hak akses, serta master data secara instan.

---

## 👨‍💻 Kontributor & Pengembang

Platform ini dikembangkan dan dipelihara secara aktif oleh **ipanjez**.

[![GitHub](https://img.shields.io/badge/GitHub-ipanjez-181717?style=flat&logo=github)](https://github.com/ipanjez)
[![Instagram](https://img.shields.io/badge/Instagram-ipanjez-E4405F?style=flat&logo=instagram)](https://instagram.com/ipanjez)
[![Facebook](https://img.shields.io/badge/Facebook-ipanjez-1877F2?style=flat&logo=facebook)](https://facebook.com/ipanjez)
