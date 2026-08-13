# 📊 Dashboard Monitoring Pekerjaan 📋

Selamat datang di **Dashboard Monitoring Pekerjaan**! Sebuah aplikasi web modern dan responsif yang dirancang untuk memonitor, mengelola, dan melacak daftar pekerjaan harian, proyek, serta aktivitas tim secara efisien. 🚀

Proyek ini mendukung **dua mode operasi**: deployment cloud melalui Vercel + Neon PostgreSQL, maupun server lokal berbasis SQLite untuk jaringan LAN kantor. Dilengkapi dengan antarmuka yang sangat estetik, manajemen data terpusat melalui API, serta fitur penjadwalan dan pelaporan *real-time* untuk membantu tim Anda tetap produktif. 🏆

---

## ✨ Fitur Unggulan

- 🎮 **Manajemen Pekerjaan & Kalender:** Mengelola tugas dengan *kanban/list style* serta visualisasi di kalender yang interaktif. Kini dengan fitur unggah *multiple file attachments* yang dinamis.
- 👥 **Kolaborasi Multi-PIC:** Memungkinkan penugasan pekerjaan ke satu Penanggung Jawab utama beserta banyak PIC tambahan secara bersamaan, lengkap dengan kalkulasi beban kerja masing-masing individu secara otomatis.
- ☁️ **Dual-Mode Database & Storage:** 
  - **Cloud (Vercel):** Menggunakan PostgreSQL (Neon) & Vercel Blob untuk penyimpanan file online.
  - **Lokal (LAN):** Menggunakan SQLite & *Local Disk Storage* (file tersimpan langsung di hard disk laptop Anda, 100% independen tanpa internet).
  - Keduanya bisa berjalan bersamaan tanpa konfigurasi manual (cukup jalankan `npm run dev:local` untuk lokal).
- 📱 **Desain Responsif & Modern:** Tampilan antarmuka kelas atas dengan mode terang/gelap (Dark Mode), UI konsisten di seluruh halaman, dibangun menggunakan keandalan **React**, **Next.js**, dan Vanilla CSS (*Glassmorphism* & animasi mulus).
- 📈 **Pelaporan & Ekspor Pintar:** Statistik langsung tentang pekerjaan harian, ekspor data ke PDF dan Excel (mendukung *bulk import* dengan format Excel/CSV yang otomatis mendeteksi Multi-PIC dan Sub-Pekerjaan), integrasi feed Google Calendar yang dilindungi Token Rahasia, serta **Kirim Email Otomatis** ke seluruh PIC langsung dari detail pekerjaan.
- 🔒 **Keamanan & Otorisasi Tingkat Tinggi (Enterprise-Grade Security):** 
  - *Role-Based Access Control* (RBAC) dengan pemisahan akses Admin, Member, dan Viewer.
  - *Global Middleware / Proxy Route Protection* untuk mengunci API rahasia.
  - Sanitasi HTML (Anti-XSS) dengan DOMPurify.
  - *Whitelist* ekstensi file pada fitur unggah (Anti-Malware).
  - Enjeksi *HTTP Security Headers* (Anti-Clickjacking & MIME-sniffing).
  - *Auto-Logout Inaktivitas Fisik* setelah 10 menit demi keamanan layar saat perangkat ditinggalkan.
- 🔑 **Kustomisasi Global Password & Pengaturan:** Anda dapat mengubah kata sandi masuk (Global Password) dan mengelola akun PIC/User (termasuk Role & Email) secara langsung melalui menu Pengaturan tanpa mengubah kode sumber.
- ⚙️ **Personalisasi Dinamis:** Nama departemen pada dasbor dapat dikustomisasi dan tersimpan otomatis tanpa perlu memuat ulang halaman (*real-time update*).
- 🧪 **Impor Excel Pintar & Otomatis:** Saat mengimpor Excel, apabila terdapat Nama PIC atau Kategori yang belum terdaftar di pengaturan, sistem akan **secara otomatis mendaftarkannya** ke dalam Master Data Pengaturan Anda. Template Excel beserta lembar panduannya dapat Anda unduh langsung dari dalam aplikasi.

---

## 🛠️ Tech Stack

| Teknologi | Fungsi |
|-----------|--------|
| **Next.js (React)** | Framework fullstack (frontend + API routes) |
| **Prisma ORM** | Abstraksi database (PostgreSQL & SQLite) |
| **PostgreSQL (Neon)** | Database cloud untuk Vercel |
| **SQLite** | Database lokal untuk server LAN |
| **NextAuth.js** | Autentikasi & manajemen sesi |
| **Vercel** | Hosting & deployment otomatis |
| **Vanilla CSS** | Styling (Glassmorphism, Dark Mode, animasi) |

---

## 🚀 Cara Penggunaan & Instalasi

Ikuti langkah-langkah mudah berikut untuk menjalankan proyek ini di perangkat atau jaringan Anda:

### 1. Clone Repositori
```bash
git clone https://github.com/ipanjez/work-monitoring.git
cd work-monitoring
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan
Buat file `.env` di *root folder*. Isi sesuai mode yang ingin Anda gunakan:

**Mode Lokal (SQLite):**
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

**Mode Cloud (PostgreSQL/Neon):**
```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host-unpooled/database?sslmode=require"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

> ⚠️ **Catatan:** File `.env` sudah termasuk dalam `.gitignore` dan tidak akan ter-upload ke GitHub.

### 4. Siapkan Database
```bash
npx prisma db push
```

### 5. Jalankan Server

Terdapat **dua mode** menjalankan server:

| Perintah | Mode | Database | Keterangan |
|----------|------|----------|------------|
| `npm run dev:local` | 🖥️ **Lokal (LAN)** | SQLite | Data tersimpan di laptop, otomatis bisa diakses via LAN. Tidak butuh internet. |
| `npm run dev` | 🌐 **Cloud** | PostgreSQL (Neon) | Data tersimpan di cloud Neon. Butuh koneksi internet. |

**Untuk server lokal (direkomendasikan untuk jaringan kantor):**
```bash
npm run dev:local
```
Script ini secara otomatis mengatur schema ke SQLite, menjalankan server, dan mengembalikan schema ke PostgreSQL saat dihentikan (`Ctrl+C`).

**Untuk server cloud:**
```bash
npm run dev
```

### 6. Akses Aplikasi
- **Dari komputer sendiri:** Buka `http://localhost:3000`
- **Dari perangkat lain di jaringan LAN:** Buka `http://<IP-komputer-Anda>:3000` (contoh: `http://192.168.1.10:3000`)

> 💡 **Tips:** Untuk mengetahui IP komputer Anda, jalankan `ipconfig` di terminal (Windows) atau `ifconfig` (Mac/Linux).

---

## 🔄 Arsitektur Dual-Mode

Aplikasi ini dirancang untuk mendukung dua lingkungan secara bersamaan:

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

- **`schema.prisma`** di kode sumber selalu dikhususkan untuk **PostgreSQL** agar Vercel berjalan normal tanpa hambatan.
- Saat Anda menjalankan `npm run dev:local`, script `dev-local.js` tidak akan merusak atau mengedit file asli. Melainkan, ia akan **otomatis membuat file *schema* sementara (`schema.sqlite.prisma`)** secara transparan, lalu mengarahkan mesin Prisma dan Next.js untuk menggunakan file tersebut beserta database `dev.db`.
- Kedua mode ini sangat stabil, 100% terisolasi, dan **tidak akan memicu konflik Git** ataupun error saat dihentikan secara paksa!

---

## 💸 Biaya & Konsekuensi Penggunaan Database Neon (Vercel)

Jika Anda memilih menggunakan **PostgreSQL (Neon)** untuk *deployment* di Vercel, Anda tunduk pada kebijakan harga dari Neon. Berdasarkan integrasi Vercel, berikut adalah rincian biayanya:

### 1. Free Plan (Gratis)
Cocok untuk uji coba atau tim kecil dengan penggunaan sangat minim.
- **Penyimpanan (Storage):** Maksimal 0.5 GB per proyek.
- **Compute Time:** Dibatasi 100 CU-hours (Compute Unit hours) per proyek setiap bulannya.
- *Konsekuensi:* Jika Anda melebihi 0.5 GB atau sering mengakses database secara intensif hingga limit CU habis, database akan dikunci sementara hingga bulan berikutnya (atau Anda harus upgrade).

### 2. Launch Plan (Berbayar - Direkomendasikan untuk Produksi)
Cocok untuk tim menengah yang menggunakan aplikasi setiap hari.
- **Penyimpanan (Storage):** $0.35 (sekitar Rp 5.500) per GB per bulan.
- **Compute Time:** $0.106 (sekitar Rp 1.600) per CU-hour.
- **Performa:** Mendukung hingga 16 CU dan 64 GB RAM (jauh lebih cepat dan sanggup menampung banyak *request* bersamaan).
- *Contoh Kasus:* Jika database Anda besarnya 2 GB dan aplikasi digunakan aktif selama jam kerja (asumsi memakan 200 CU-hour sebulan), biayanya kira-kira: 
  - Storage: 2 GB × $0.35 = $0.70
  - Compute: 200 × $0.106 = $21.20
  - Total: ~$21.90/bulan (sekitar Rp 350.000/bulan).

### 3. Scale Plan (Enterprise)
Untuk perusahaan besar dengan beban kerja yang sangat tinggi.
- **Penyimpanan:** $0.35 per GB per bulan.
- **Compute Time:** $0.222 per CU-hour.
- **Performa:** Super masif hingga 56 CU dan 224 GB RAM. Bisa menampung ribuan *request* tanpa hambatan.

> **💡 Solusi Hemat 100% Gratis:** Jika Anda tidak ingin memikirkan biaya bulanan Neon, sangat disarankan untuk menjalankan aplikasi ini secara lokal di komputer server kantor Anda menggunakan mode `npm run dev:local` (SQLite). Data akan tersimpan di *hard disk* Anda sendiri dengan kapasitas tanpa batas (gratis)!

---

## ☁️ Biaya & Batasan Vercel Blob (Penyimpanan File Cloud)

Jika Anda melakukan *deployment* di Vercel, lampiran file (PDF, gambar, dll) akan disimpan di **Vercel Blob Storage**. Berdasarkan kebijakan Vercel, berikut batasannya:

### 1. Hobby Plan (Gratis)
- **Penyimpanan (Storage):** Maksimal **500 MB** total file tersimpan.
- **Ukuran per file:** Maksimal **500 MB**.
- **Bandwidth/Network (Download/Upload):** Maksimal **5 GB per bulan**.
- *Konsekuensi:* Jika total file Anda melebihi 500 MB, Anda tidak bisa lagi mengunggah file baru. Jika file Anda sering diunduh oleh banyak user dan *bandwidth* melebihi 5 GB/bulan, akses unduh/upload akan diblokir oleh Vercel hingga bulan berikutnya (atau akun bisa disuspend).

### 2. Pro Plan (Berbayar)
- **Harga Dasar:** $20 per bulan per pengguna (akun Vercel Pro).
- **Blob Add-on:** Storage dan Bandwidth di luar kuota gratis akan dikenakan biaya tambahan per GB ($0.15/GB untuk storage, dan tarif terpisah untuk bandwidth/egress).
- *Konsekuensi:* Harga dapat membengkak secara tidak terprediksi apabila ada lonjakan *download* file berukuran besar secara terus-menerus.

> **💡 Solusi Hemat 100% Gratis:** Jalankan aplikasi mode lokal (`npm run dev:local`). Mode ini memiliki fitur **Local File System** di mana seluruh file yang diunggah akan disimpan **langsung ke hard disk laptop/PC Anda** di folder `public/uploads/`. Sama sekali tidak menggunakan kuota internet ataupun layanan berbayar Vercel Blob!

---

## 📦 Migrasi Data (Neon ↔ Lokal)

### Backup & Restore Otomatis (1-Click)
Anda tidak perlu lagi menggunakan alat pihak ketiga (seperti DBeaver) untuk memindahkan data. Gunakan fitur bawaan aplikasi:

**Langkah 1: Export dari Vercel (Neon / Cloud)**
1. Buka `https://<domain-aplikasi-anda>.vercel.app/settings`
2. Scroll ke bagian **Cadangan & Export Data Database**
3. Klik **📥 Unduh Backup** 
   *(Sistem akan mengunduh file `.zip` yang berisi `database.json` beserta seluruh folder `uploads` yang berisi lampiran file dan foto profil dari Vercel Blob/Server).*

**Langkah 2: Import ke Lokal (SQLite) atau sebaliknya**
1. Jalankan aplikasi di lingkungan target Anda (misal `npm run dev:local`).
2. Buka halaman `/settings`.
3. Scroll ke bagian **Cadangan & Export Data Database**
4. Klik **📤 Pulihkan dari Backup** dan pilih file `.zip` yang tadi diunduh.
   *(Sistem akan memulihkan data ke database dan otomatis mengunggah kembali file-file lampiran ke sistem penyimpanan yang aktif).*
> *Catatan: Jika database lokal masih kosong sama sekali, Anda bisa melakukan import tanpa perlu login.*

### Import dari Excel
1. Buka aplikasi di browser.
2. Klik tombol **+** (Tambah Pekerjaan) → **Download Template Excel**.
3. Isi data sesuai format template.
4. Klik tombol **+** → **Import dari Excel** → pilih file Anda.

---

## 📝 Changelog / Riwayat Pembaruan Terkini

Berbagai peningkatan dan perbaikan bug terus dilakukan. Berikut adalah *update* utama yang baru saja diproses ke repositori:

- 🐛 **Fix Filter Dropdown**: Menghapus duplikasi opsi "All" pada filter PIC dan Kategori di Dashboard serta menyelaraskan urutan dropdown agar 100% konsisten dengan pengaturan Master Data.
- ✨ **Sort Lampiran**: Menambahkan fitur interaktif untuk mengurutkan daftar pekerjaan berdasarkan jumlah lampiran terbanyak/tersedikit secara langsung dari *header* tabel.
- ⚡ **Optimasi Cloud Restore**: Mencegah *timeout* saat restore database besar dengan memparalelkan proses upload Blob, menambahkan mekanisme *retry* otomatis jika gagal (*blob fetch retry*), dan meningkatkan *maxDuration* fungsi API.
- 📱 **Mobile UI & Portal**: Menggunakan teknologi React Portals untuk Modal Tambah/Edit Pekerjaan guna mencegah bug hilangnya modal saat transisi UI di layar HP, serta merapikan info profil di tampilan mobile.
- 🛠️ **Error Handling**: Memperjelas pesan error dari sisi klien jika file ZIP yang direstore korup, log error ekstraksi *blob*, serta memperluas dukungan deteksi *MIME type* ZIP (*cross-platform*).

---

## 👨‍💻 Kredit & Pembuat

Proyek ini dirancang dan dikembangkan dengan penuh semangat oleh **ipanjez**. 

Mari terhubung, berdiskusi, dan berkolaborasi bersama saya melalui platform di bawah ini:

[![GitHub](https://img.shields.io/badge/GitHub-ipanjez-181717?style=flat&logo=github)](https://github.com/ipanjez)
[![Instagram](https://img.shields.io/badge/Instagram-ipanjez-E4405F?style=flat&logo=instagram)](https://instagram.com/ipanjez)
[![Facebook](https://img.shields.io/badge/Facebook-ipanjez-1877F2?style=flat&logo=facebook)](https://facebook.com/ipanjez)
[![Gravatar](https://img.shields.io/badge/Gravatar-ipanjez-1E8CBE?style=flat&logo=gravatar)](https://gravatar.com/ipanjez)
