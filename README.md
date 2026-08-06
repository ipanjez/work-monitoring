# 📊 Dashboard Monitoring Pekerjaan 📋

Selamat datang di **Dashboard Monitoring Pekerjaan**! Sebuah aplikasi web modern dan responsif yang dirancang untuk memonitor, mengelola, dan melacak daftar pekerjaan harian, proyek, serta aktivitas tim secara efisien. 🚀

Proyek ini dilengkapi dengan antarmuka yang sangat estetik, manajemen data yang terpusat melalui API dan Database SQLite, serta dilengkapi dengan fitur penjadwalan dan pelaporan *real-time* untuk membantu tim Anda tetap produktif. 🏆

---

## ✨ Fitur Unggulan

- 🎮 **Manajemen Pekerjaan & Kalender:** Mengelola tugas dengan *kanban/list style* serta visualisasi di kalender yang interaktif. Kini dengan fitur unggah *multiple file attachments* yang dinamis.
- 👥 **Kolaborasi Multi-PIC:** Memungkinkan penugasan pekerjaan ke satu Penanggung Jawab utama beserta banyak PIC tambahan secara bersamaan, lengkap dengan kalkulasi beban kerja masing-masing individu secara otomatis.
- ☁️ **Sistem Database Sentral:** Menggunakan *Prisma ORM* dengan database pilihan untuk penyimpanan data lokal yang solid, cepat, dan tersinkronisasi di berbagai perangkat dalam jaringan lokal Anda.
- 📱 **Desain Responsif & Modern:** Tampilan antarmuka kelas atas dengan mode terang/gelap (Dark Mode), UI konsisten di seluruh halaman, dibangun menggunakan keandalan **React**, **Next.js**, dan Vanilla CSS (*Glassmorphism* & animasi mulus).
- 📈 **Pelaporan & Ekspor Pintar:** Statistik langsung tentang pekerjaan harian, ekspor data ke PDF dan Excel (mendukung *bulk import* dengan format Excel/CSV yang otomatis mendeteksi Multi-PIC dan Sub-Pekerjaan), serta integrasi feed Google Calendar.
- 🔒 **Keamanan Sesi Terpusat:** Dilengkapi fitur *Auto-Logout Inaktivitas Fisik* setelah 10 menit demi keamanan layar saat perangkat ditinggalkan, lengkap dengan penghitung waktu mundur pada *sidebar*.
- 🔑 **Kustomisasi Global Password:** Anda kini dapat mengubah kata sandi masuk (Global Password) secara langsung melalui menu Pengaturan tanpa harus mengubah file `.env`. Saat Anda mengatur sandi baru, sistem akan mendahulukannya dari konfigurasi default.
- ⚙️ **Personalisasi Dinamis:** Nama departemen pada dasbor dapat dikustomisasi dan tersimpan otomatis tanpa perlu memuat ulang halaman (*real-time update*).
- 🧪 **Impor Excel Pintar & Otomatis:** Saat mengimpor Excel, apabila terdapat Nama PIC atau Kategori yang belum terdaftar di pengaturan, sistem akan **secara otomatis mendaftarkannya** ke dalam Master Data Pengaturan Anda. Template Excel beserta lembar panduannya dapat Anda unduh langsung dari dalam aplikasi.

---

## 🚀 Cara Penggunaan & Instalasi

Ikuti langkah-langkah mudah berikut untuk menjalankan proyek ini di perangkat atau jaringan Anda:

1. **Clone repositori ini** ke direktori lokal Anda:
   ```bash
   git clone https://github.com/ipanjez/work-monitoring.git
   ```
2. **Instal Dependensi:** 
   Jalankan instalasi di dalam root direktori:
   ```bash
   npm install
   ```
3. **Konfigurasi Lingkungan:**
   Buat file `.env` di *root folder* dengan isi kredensial *database* SQLite Anda, misalnya:
   ```env
   DATABASE_URL="file:./dev.db"
   ```
4. **Jalankan Migrasi Database:**
   Siapkan tabel-tabel pada database dengan Prisma:
   ```bash
   npx prisma db push
   ```
5. **Mulai Server:**
   Jalankan perintah ini untuk mengaktifkan aplikasi di jaringan lokal Anda (bisa diakses perangkat lain):
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
   Cukup buka alamat IP komputer Anda di *browser* (contoh: `http://192.168.1.10:3000`) untuk langsung mulai berkolaborasi!

---

## 👨‍💻 Kredit & Pembuat

Proyek ini dirancang dan dikembangkan dengan penuh semangat oleh **ipanjez**. 

Mari terhubung, berdiskusi, dan berkolaborasi bersama saya melalui platform di bawah ini:

[![GitHub](https://img.shields.io/badge/GitHub-ipanjez-181717?style=flat&logo=github)](https://github.com/ipanjez)
[![Instagram](https://img.shields.io/badge/Instagram-ipanjez-E4405F?style=flat&logo=instagram)](https://instagram.com/ipanjez)
[![Facebook](https://img.shields.io/badge/Facebook-ipanjez-1877F2?style=flat&logo=facebook)](https://facebook.com/ipanjez)
[![Gravatar](https://img.shields.io/badge/Gravatar-ipanjez-1E8CBE?style=flat&logo=gravatar)](https://gravatar.com/ipanjez)
