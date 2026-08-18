'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Sparkles, BookOpen, MessageSquare, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotifications } from '@/context/NotificationContext';
import 'driver.js/dist/driver.css';

export default function HelpSupportButton() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'PIC';
  const { addActivityLog } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const driverRef = useRef<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Clean up driver.js instance on component unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch (e) {
          console.error('Error destroying driver instance:', e);
        }
      }
    };
  }, []);

  const handleStartTour = async () => {
    setIsOpen(false);

    // 1. Force destroy any existing active driver instance
    if (driverRef.current) {
      try {
        driverRef.current.destroy();
      } catch (e) {
        // ignore
      }
      driverRef.current = null;
    }

    // 2. Clean up any remaining driver.js DOM elements from previous crashed runs to prevent duplicates
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.driver-popover, .driver-overlay, .driver-stage').forEach(el => el.remove());
    }

    // 3. Dynamic import driver.js to keep initial bundle size small
    const { driver } = await import('driver.js');

    const isAdmin = userRole === 'ADMIN';
    let steps: any[] = [];

    // Define page-specific tour steps. Each tour starts by highlighting its own active sidebar menu.
    if (pathname === '/') {
      steps = [
        {
          element: '#menu-monitoring',
          popover: {
            title: 'Monitoring Board',
            description: isAdmin
              ? 'Menu aktif saat ini. Papan Kanban interaktif (Akses Admin) untuk memantau, memindahkan status (drag & drop), dan menyusun prioritas semua tugas PIC.'
              : 'Menu aktif saat ini. Papan Kanban interaktif (Akses Staff). Pantau seluruh progres tugas departemen dan status tugas Anda sendiri.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#universal-filter-bar',
          popover: {
            title: 'Filter & Pencarian Board',
            description: 'Gunakan panel ini untuk mencari tugas secara langsung, atau menyaring papan berdasarkan Kategori, Prioritas, PIC, Status, dan Tanggal Tenggat.',
            side: 'bottom'
          }
        },
        {
          element: '#universal-action-bar',
          popover: {
            title: 'Aksi Papan',
            description: 'Ekspor papan saat ini ke file Excel, unduh sebagai dokumen PDF landscape, salin gambar papan ke clipboard, atau salin agenda tim secara tertulis.',
            side: 'bottom'
          }
        },
        {
          element: '#global-add-btn-container',
          popover: {
            title: 'Tambah Pekerjaan Baru',
            description: 'Tambahkan tugas secara instan. Arahkan kursor ke tombol ini untuk memilih mode: Tambah Manual, Tambah Cepat (Smart Add), Download Template Excel, atau Import langsung dari Excel.',
            side: 'left'
          }
        },
        {
          element: '#notification-bell-container',
          popover: {
            title: 'Notifikasi & Laporan Aktivitas',
            description: 'Menerima pemberitahuan langsung ketika ada pembaruan status tugas, komentar baru, atau penyelesaian pekerjaan oleh tim.',
            side: 'bottom'
          }
        },
        {
          element: '#user-profile-btn-container',
          popover: {
            title: 'Profil & Sesi Pengguna',
            description: 'Melihat nama akun, peran saat ini (Admin/Supervisor/PIC), melakukan perubahan profil, dan opsi keluar dari sesi aplikasi.',
            side: 'bottom'
          }
        },
        {
          element: '.kanban-board-wrapper',
          popover: {
            title: 'Area Papan Kanban',
            description: 'Area interaktif utama. Anda dapat menyeret (drag & drop) kartu tugas antar kolom untuk memperbarui status pengerjaan secara real-time.',
            side: 'bottom'
          }
        },
        {
          element: '.kanban-col:nth-child(1)',
          popover: {
            title: 'Kolom status: To Do',
            description: 'Menampung daftar tugas baru yang telah direncanakan tetapi belum dimulai pengerjaannya.',
            side: 'right'
          }
        },
        {
          element: '.kanban-col:nth-child(2)',
          popover: {
            title: 'Kolom status: In Progress',
            description: 'Menampung tugas-tugas yang saat ini sedang aktif dikerjakan oleh masing-masing PIC.',
            side: 'right'
          }
        },
        {
          element: '.kanban-col:nth-child(3)',
          popover: {
            title: 'Kolom status: Review',
            description: 'Menampung tugas yang telah rampung dan sedang menunggu tinjauan, verifikasi hasil, atau persetujuan supervisor.',
            side: 'right'
          }
        },
        {
          element: '.kanban-col:nth-child(4)',
          popover: {
            title: 'Kolom status: Done',
            description: 'Menampung seluruh tugas yang telah dinyatakan selesai dengan persentase progress 100%.',
            side: 'left'
          }
        },
        {
          element: '.kanban-card:first-child',
          popover: {
            title: 'Kartu Pekerjaan (Kanban Card)',
            description: 'Kartu tugas individu. Klik kartu ini untuk melihat rincian deskripsi kaya format (Rich Text), checklist sub-tugas beserta log progresnya, lampiran file berkas, dan ruang diskusi komentar tim.',
            side: 'bottom'
          }
        }
      ];
    } else if (pathname === '/dashboard') {
      steps = [
        {
          element: '#menu-dashboard',
          popover: {
            title: 'Dashboard Executive',
            description: 'Menu aktif saat ini. Menyajikan visualisasi metrik utama performa kerja secara ringkas, interaktif, dan real-time.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#universal-filter-bar',
          popover: {
            title: 'Filter & Pencarian Dashboard',
            description: 'Saring data dashboard berdasarkan Kategori, Prioritas, PIC, Status, atau Rentang Tanggal. Seluruh grafik dan kartu metrik akan ter-update otomatis secara langsung!',
            side: 'bottom'
          }
        },
        {
          element: '#universal-action-bar',
          popover: {
            title: 'Ekspor Data Ringkasan',
            description: 'Unduh laporan ringkasan dalam format Excel, PDF landscape, atau salin grafik dashboard langsung ke clipboard Anda sebagai gambar.',
            side: 'bottom'
          }
        },
        {
          element: '#dashboard-kpi-cards',
          popover: {
            title: 'Kartu KPI Ringkasan Utama',
            description: 'Menampilkan metrik agregat penting: Jumlah Total Pekerjaan, sebaran kuantitas per Status Pekerjaan (To Do, In Progress, Review, Done), serta rata-rata persentase Progress pengerjaan tim.',
            side: 'bottom'
          }
        },
        {
          element: '#dashboard-charts-doughnuts',
          popover: {
            title: 'Grafik Distribusi Status & Prioritas',
            description: 'Visualisasi lingkaran (Doughnut Chart) yang menunjukkan porsi status pekerjaan saat ini serta komposisi tingkat prioritas (Low, Medium, High, Critical) dari seluruh tugas.',
            side: 'top'
          }
        },
        {
          element: '#dashboard-chart-pic',
          popover: {
            title: 'Grafik Beban Kerja PIC',
            description: 'Diagram batang interaktif yang membandingkan volume tugas antar PIC beserta status pengerjaannya. Memudahkan monitoring pemerataan beban kerja.',
            side: 'top'
          }
        },
        {
          element: '#dashboard-chart-category',
          popover: {
            title: 'Grafik Sebaran Kategori',
            description: 'Melihat klasifikasi jumlah tugas berdasarkan kategori pengerjaan (seperti Umum, Rapat, IT, dll.) untuk mengetahui fokus aktivitas tim.',
            side: 'top'
          }
        },
        {
          element: '#dashboard-chart-timeline',
          popover: {
            title: 'Grafik Tren Tenggat Waktu',
            description: 'Memetakan akumulasi batas waktu (deadline) tugas per hari. Membantu mengantisipasi puncak beban tugas yang akan datang.',
            side: 'top'
          }
        },
        {
          element: '#dashboard-active-table',
          popover: {
            title: 'Tabel Detail Pekerjaan Aktif',
            description: 'Daftar rincian pekerjaan yang sedang berjalan (belum selesai). Dilengkapi dengan fitur pencarian teks, pengurutan kolom, status sub-pekerjaan, tautan berkas lampiran, dan shortcut untuk membuka modal detail pengerjaan.',
            side: 'top'
          }
        }
      ];
    } else if (pathname === '/tasks') {
      steps = [
        {
          element: '#menu-tasks',
          popover: {
            title: 'Daftar Pekerjaan (Task List)',
            description: isAdmin
              ? 'Menu aktif saat ini. Kelola data tugas tabular (Akses Admin) dengan akses penuh CRUD, buat tugas dengan Smart Add, dan lakukan aksi massal (Bulk Edit).'
              : 'Menu aktif saat ini. Kelola data tugas tabular (Akses Staff). Anda dapat menambahkan tugas baru atau mengedit tugas yang didelegasikan kepada Anda.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#universal-filter-bar',
          popover: {
            title: 'Filter & Pencarian Daftar Tugas',
            description: 'Saring daftar pekerjaan secara presisi menggunakan bar filter pencarian ini.',
            side: 'bottom'
          }
        },
        {
          element: '#universal-action-bar',
          popover: {
            title: 'Aksi Ekspor Daftar Tugas',
            description: 'Ekspor tabel daftar pekerjaan terpilih atau seluruhnya ke format Excel maupun PDF secara cepat.',
            side: 'bottom'
          }
        },
        {
          element: '#task-bulk-bar',
          popover: {
            title: 'Aksi Edit Massal (Bulk Edit)',
            description: 'Ketika Anda mencentang satu atau lebih checkbox tugas di tabel, bar ini akan muncul. Memungkinkan Anda memperbarui status, kategori, PIC, jadwal pengerjaan, atau menghapus banyak tugas sekaligus secara massal!',
            side: 'top'
          }
        },
        {
          element: '#task-table-container',
          popover: {
            title: 'Tabel Data Pekerjaan',
            description: 'Tabel ringkas yang menyajikan informasi detail pekerjaan secara terstruktur. Klik judul kolom untuk mengurutkan data, atau klik salah satu baris tugas untuk mengedit/membuka detail modal.',
            side: 'top'
          }
        }
      ];
    } else if (pathname === '/calendar') {
      steps = [
        {
          element: '#menu-calendar',
          popover: {
            title: 'Kalender & Jadwal',
            description: 'Menu aktif saat ini. Memvisualisasikan beban jadwal kerja dan deadline tugas tim Anda dalam format kalender bulanan/mingguan.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '.rbc-toolbar',
          popover: {
            title: 'Kontrol Tampilan Kalender',
            description: 'Navigasi kalender. Gunakan tombol Hari Ini, Sebelumnya, dan Selanjutnya untuk berpindah waktu. Serta beralih mode tampilan antara Bulan, Minggu, Hari, atau Agenda list.',
            side: 'bottom'
          }
        },
        {
          element: '.rbc-calendar',
          popover: {
            title: 'Kalender & Jadwal Libur',
            description: 'Menampilkan event tugas tim Anda. Mendukung interaksi drag & drop (geser-lepas) event tugas untuk memindahkan tanggal pengerjaan secara langsung dan instan.',
            side: 'top'
          }
        }
      ];
    } else if (pathname === '/reports') {
      steps = [
        {
          element: '#menu-reports',
          popover: {
            title: 'Analisis & Laporan',
            description: 'Menu aktif saat ini. Analisis mendalam mengenai tingkat kepatuhan tenggat waktu (SLA) dan rasio penyelesaian tugas karyawan.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#universal-filter-bar',
          popover: {
            title: 'Saring Filter Laporan',
            description: 'Saring analisis berdasarkan PIC, kategori, prioritas, status, atau durasi pengerjaan. Seluruh laporan performa akan disinkronkan secara instan.',
            side: 'bottom'
          }
        },
        {
          element: '#universal-action-bar',
          popover: {
            title: 'Ekspor Laporan Kinerja',
            description: 'Cetak hasil analisis kinerja ke dalam file Excel terformat, dokumen PDF lengkap, atau salin grafik sebagai gambar ke clipboard.',
            side: 'bottom'
          }
        },
        {
          element: '#reports-kpi-cards',
          popover: {
            title: 'Kartu Metrik SLA & Progress',
            description: 'Memantau indikator kinerja utama (KPI) tim, termasuk Tingkat Penyelesaian tepat waktu (SLA), Rata-rata kemajuan progress (%), serta akumulasi kuantitas status tugas saat ini.',
            side: 'bottom'
          }
        },
        {
          element: '#reports-chart-status',
          popover: {
            title: 'Grafik Status Pekerjaan',
            description: 'Grafik lingkaran (Doughnut) yang memperlihatkan rasio sebaran status pekerjaan (To Do, In Progress, Review, Done).',
            side: 'right'
          }
        },
        {
          element: '#reports-chart-pic',
          popover: {
            title: 'Grafik Beban Kerja per PIC',
            description: 'Diagram batang yang mendeteksi kontribusi dan volume tugas dari 10 PIC teratas beserta status pekerjaannya untuk evaluasi beban kerja individual.',
            side: 'left'
          }
        },
        {
          element: '#reports-chart-priority',
          popover: {
            title: 'Grafik Sebaran Prioritas',
            description: 'Menganalisis perbandingan porsi tugas berdasarkan tingkat prioritasnya (Low, Medium, High, Critical).',
            side: 'right'
          }
        },
        {
          element: '#reports-chart-category-progress',
          popover: {
            title: 'Grafik Rata-rata Progress per Kategori',
            description: 'Melihat tingkat kemajuan rata-rata tugas dalam persen (%) untuk masing-masing kategori pekerjaan.',
            side: 'left'
          }
        },
        {
          element: '#reports-chart-deadline',
          popover: {
            title: 'Grafik Kepatuhan Tenggat Waktu (SLA)',
            description: 'Mengukur rasio penyelesaian tugas yang diselesaikan Tepat Waktu (On Time) vs Terlambat (Overdue) dari batas deadline yang ditentukan.',
            side: 'right'
          }
        },
        {
          element: '#reports-chart-category-distribution',
          popover: {
            title: 'Grafik Distribusi per Kategori',
            description: 'Visualisasi porsi jumlah tugas per kategori pekerjaan (seperti Umum, Rapat, IT, dll.) dalam tim.',
            side: 'left'
          }
        }
      ];
    } else if (pathname === '/team') {
      steps = [
        {
          element: '#menu-team',
          popover: {
            title: 'Manajemen Tim',
            description: 'Menu aktif saat ini. Pantau beban kerja secara transparan. Lihat persentase tugas selesai vs total tugas untuk setiap PIC.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#universal-filter-bar',
          popover: {
            title: 'Filter Tim & PIC',
            description: 'Menyaring kontribusi personil berdasarkan Kategori, Status, Prioritas, atau rentang Waktu.',
            side: 'bottom'
          }
        },
        {
          element: '#universal-action-bar',
          popover: {
            title: 'Ekspor Kinerja Tim',
            description: 'Unduh laporan performa tim ke file Excel atau PDF, atau salin visualisasi ke clipboard.',
            side: 'bottom'
          }
        },
        {
          element: '#team-cards-grid',
          popover: {
            title: 'Daftar Kartu Beban Kerja PIC',
            description: 'Menyajikan profil seluruh PIC terdaftar, persentase rasio penyelesaian tugas (%), serta ringkasan kuantitas tugas aktif mereka berdasarkan status. Klik salah satu kartu PIC untuk menganalisis daftar tugas spesifik mereka!',
            side: 'top'
          }
        },
        {
          element: '#team-pic-detail-table',
          popover: {
            title: 'Daftar Tugas PIC Terpilih',
            description: 'Menampilkan detail list tugas yang sedang dikerjakan oleh PIC yang Anda pilih di atas. Klik salah satu judul tugas untuk membuka modal dialog rincian / mengedit tugas tersebut secara langsung.',
            side: 'top'
          }
        }
      ];
    } else if (pathname === '/users') {
      steps = [
        {
          element: '#menu-users',
          popover: {
            title: 'Sistem User & Hak Akses',
            description: isAdmin
              ? 'Menu aktif saat ini. Pengaturan Akun (Akses Admin). Tambahkan pengguna baru, kelola permohonan reset password, lacak log aktivitas sistem, dan tentukan hak akses peran (Admin/SPV/PIC).'
              : 'Akses dibatasi. Halaman ini hanya dapat diakses oleh Administrator.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#users-tabs-container',
          popover: {
            title: 'Navigasi Tab Akun',
            description: 'Berpindah tab untuk mengelola daftar akun (Daftar User), menyetujui permintaan reset password user (Reset Requests), melacak sistem log aktivitas (Sistem Logs), atau melihat info hak akses role (Edit Role).',
            side: 'bottom'
          }
        },
        {
          element: '#users-search-container',
          popover: {
            title: 'Pencarian Cepat Pengguna',
            description: 'Cari akun terdaftar berdasarkan NPK unik atau nama lengkap secara instan.',
            side: 'bottom'
          }
        },
        {
          element: '#users-export-btn',
          popover: {
            title: 'Ekspor Data Excel',
            description: 'Ekspor daftar seluruh pengguna saat ini beserta statusnya ke file Excel secara instan.',
            side: 'bottom'
          }
        },
        {
          element: '#users-add-btn',
          popover: {
            title: 'Tambah User Baru',
            description: 'Buat akun pengguna baru dengan mengisi NPK unik, nama lengkap, role, dan password awal.',
            side: 'bottom'
          }
        },
        {
          element: '#users-bulk-bar',
          popover: {
            title: 'Aksi Massal Pengguna',
            description: 'Centang checkbox di tabel untuk memilih beberapa pengguna. Bar aksi ini akan muncul untuk mengaktifkan status, menonaktifkan status, atau menghapus massal.',
            side: 'top'
          }
        },
        {
          element: '#users-table-container',
          popover: {
            title: 'Tabel Pengguna Terdaftar',
            description: 'Menampilkan data NPK, nama, role, status aktif, dan tombol aksi (edit profil, reset password, nonaktifkan, atau hapus user).',
            side: 'top'
          }
        }
      ];
    } else if (pathname === '/settings') {
      steps = [
        {
          element: '#menu-settings',
          popover: {
            title: 'Pengaturan Master',
            description: isAdmin
              ? 'Menu aktif saat ini. Area Kontrol Master (Akses Admin). Atur identitas web, tema warna, master data opsi form, profil, pengaturan umum, sinkronisasi kalender feed, serta backup database.'
              : 'Informasi Konfigurasi (Akses Staff). Ubah tema warna, personalisasi profil akun Anda, dan atur sinkronisasi kalender.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#settings-app-identity',
          popover: {
            title: 'Identitas Aplikasi & Logo',
            description: 'Ganti nama aplikasi, subjudul departemen, dan unggah file logo baru untuk mengubah header web secara langsung.',
            side: 'bottom'
          }
        },
        {
          element: '#settings-theme',
          popover: {
            title: 'Tampilan & Tema Warna',
            description: 'Personalisasikan antarmuka: pilih mode gelap/terang, warna aksen tombol utama, ubah kerapatan spasi (Nyaman/Comfortable vs Padat/Compact), serta aktifkan Mode Fokus (Zen Mode).',
            side: 'bottom'
          }
        },
        {
          element: '#settings-categories',
          popover: {
            title: 'Master Kategori Dropdown',
            description: 'Kelola opsi kategori pekerjaan default (seperti Rapat, Projek, Audit, IT) yang muncul otomatis saat pengisian form tugas.',
            side: 'bottom'
          }
        },
        {
          element: '#settings-pics',
          popover: {
            title: 'Master PIC / Personil',
            description: 'Kelola daftar nama personil default yang dapat dipilih sebagai penanggung jawab pengerjaan tugas.',
            side: 'bottom'
          }
        },
        {
          element: '#settings-statuses',
          popover: {
            title: 'Master Status Pekerjaan',
            description: 'Atur tahapan progress kerja (Kanban columns). Anda dapat menambah status baru, menyusun urutan prioritas kolom, serta memetakan bobot persentase progress default masing-masing status.',
            side: 'bottom'
          }
        },
        {
          element: '#settings-priorities',
          popover: {
            title: 'Master Prioritas Pekerjaan',
            description: 'Kelola pilihan tingkat urgensi pekerjaan (seperti Low, Medium, High, Critical) dalam form tugas.',
            side: 'bottom'
          }
        },
        {
          element: '#settings-general',
          popover: {
            title: 'Pengaturan Sistem & Limitasi',
            description: 'Mengonfigurasi nama departemen, batas maksimal ukuran unggahan file (file upload size limit), alokasi kapasitas storage keseluruhan, serta batas waktu sesi aktif login (auto logout).',
            side: 'bottom'
          }
        },
        {
          element: '#settings-calendar-sync',
          popover: {
            title: 'Sinkronisasi Kalender Otomatis',
            description: 'Salin URL feed kalender (.ics) dan tempel di Google Calendar atau Outlook Anda. Memungkinkan jadwal di HP atau laptop Anda sinkron otomatis dengan sistem monitoring secara real-time!',
            side: 'bottom'
          }
        },
        {
          element: '#settings-backup',
          popover: {
            title: 'Cadangan & Pemulihan Database',
            description: 'Ekspor database lengkap ke file JSON untuk cadangan berkala yang aman, atau pulihkan (restore) database dari file backup yang telah diunduh sebelumnya.',
            side: 'top'
          }
        }
      ];
    } else if (pathname === '/users/profile') {
      steps = [
        {
          element: '#user-profile-btn-container',
          popover: {
            title: 'Profil Saya',
            description: 'Halaman aktif saat ini. Kelola informasi data personal dan keamanan akses Anda.',
            side: 'bottom'
          }
        },
        {
          element: '.glass:first-of-type',
          popover: {
            title: 'Foto Profil',
            description: 'Ubah atau ganti foto profil Anda di sini. Cukup klik tombol kamera atau Unggah Foto Baru untuk memotong dan memperbarui avatar secara instan.',
            side: 'bottom'
          }
        },
        {
          element: '#settings-account',
          popover: {
            title: 'Formulir Data Diri',
            description: 'Perbarui nama lengkap, verifikasi NPK Anda, atau ubah kata sandi dengan mengisi kolom password baru beserta konfirmasinya di sini.',
            side: 'top'
          }
        }
      ];
    }

    // Filter out steps where elements don't exist in the current DOM to prevent errors
    const finalSteps = steps.filter(step => {
      if (!step.element) return true;
      try {
        const el = document.querySelector(step.element);
        return el !== null;
      } catch (e) {
        return false;
      }
    });

    if (finalSteps.length === 0) {
      toast('Tidak ada elemen panduan yang ditemukan di halaman ini.', { icon: 'ℹ️' });
      return;
    }

    const driverObj = driver({
      showProgress: true,
      animate: true,
      stagePadding: 10,
      stageRadius: 16,
      overlayColor: 'rgba(15, 23, 42, 0.85)',
      allowClose: true,
      nextBtnText: 'Selanjutnya',
      prevBtnText: 'Sebelumnya',
      doneBtnText: 'Selesai',
      progressText: 'Langkah {{current}} dari {{total}}',
      steps: finalSteps,
      onDestroyed: () => {
        driverRef.current = null;
      }
    });

    driverRef.current = driverObj;
    driverObj.drive();
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      toast.error('Umpan balik tidak boleh kosong');
      return;
    }
    setSubmittingFeedback(true);

    try {
      if (addActivityLog) {
        const sender = session?.user?.name ? `${session.user.name} (${(session.user as any)?.npk || ''})` : 'Anonim';
        await addActivityLog(
          'SUBMIT_FEEDBACK', 
          'Umpan Balik Baru', 
          `Feedback dari ${sender}: "${feedbackText.trim()}"`, 
          'success'
        );
      }
      toast.success('Umpan balik Anda telah berhasil dikirim! Terima kasih.');
      setFeedbackText('');
      setIsFeedbackOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengirimkan umpan balik');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <>
      <div id="help-support-btn-container" style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            background: isOpen ? 'var(--accent-primary)' : 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isOpen ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            transition: 'all 0.2s',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (!isOpen) {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.color = 'var(--accent-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
          title="Bantuan & Panduan"
        >
          <HelpCircle size={22} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                top: '52px',
                right: '0',
                width: '280px',
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                zIndex: 9999,
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                Bantuan & Dukungan
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Interactive Tour option */}
                <button
                  onClick={handleStartTour}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--input-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Tutorial Interaktif</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tour guide langkah demi langkah</div>
                  </div>
                </button>

                {/* Documentation option */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/guide');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--input-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Dokumentasi & Panduan</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Panduan lengkap penggunaan aplikasi</div>
                  </div>
                </button>

                {/* Feedback option */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsFeedbackOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--input-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Kirim Umpan Balik</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Laporkan masalah atau beri saran</div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feedback Dialog Modal */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '24px',
                width: '100%',
                maxWidth: '450px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setIsFeedbackOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%'
                }}
              >
                <X size={18} />
              </button>

              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} color="#f59e0b" /> Kirim Umpan Balik
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Saran atau laporan masalah Anda sangat berharga bagi kami untuk terus meningkatkan performa DeptMonitor.
              </p>

              <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Pengirim</label>
                  <input
                    type="text"
                    value={session?.user?.name ? `${session.user.name} (${(session.user as any)?.npk || ''})` : 'Anonim'}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'not-allowed',
                      opacity: 0.8
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Umpan Balik / Laporan</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tuliskan saran, pertanyaan, atau laporan bug Anda di sini..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="btn btn-primary"
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    marginTop: '8px',
                    cursor: submittingFeedback ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Send size={14} /> {submittingFeedback ? 'Mengirim...' : 'Kirim Sekarang'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
