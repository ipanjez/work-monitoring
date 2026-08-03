'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, LayoutDashboard, ListTodo, FileText, CheckCircle2, 
  Users, Shield, CalendarDays, Kanban, Download, Upload, 
  ChevronDown, Settings, AlertCircle, FileSpreadsheet, PlayCircle, Eye, EyeOff
} from 'lucide-react';
import 'driver.js/dist/driver.css';

export default function GuidePage() {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('monitoring-board');
  const [useHighlight, setUseHighlight] = useState(true);

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const sections = [
    {
      id: 'monitoring-board',
      icon: <Kanban size={24} />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      title: '1. Monitoring Board',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Visualisasi pekerjaan dalam bentuk papan Kanban per departemen. Sangat cocok untuk rapat stand-up dan memantau perpindahan status pekerjaan.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Drag and Drop Status:</strong> Pindahkan kartu pekerjaan dari satu kolom status ke kolom lainnya hanya dengan menggeser (drag & drop) kartu tersebut. Status akan otomatis diperbarui.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Urutkan Kartu Manual (Drag per Card):</strong> Di dalam satu kolom, Anda bisa mengurutkan prioritas pekerjaan dengan menarik (drag) kartu ke atas atau ke bawah secara manual.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Filter Dinamis:</strong> Board ini dilengkapi dengan fitur pencarian dan Filter (berdasarkan kategori atau urutan Abjad/Tenggat Waktu) sehingga Anda bisa menampilkan Kanban khusus yang relevan.</span>
            </li>
          </ul>
        </>
      )
    },
    {
      id: 'dashboard',
      icon: <LayoutDashboard size={24} />,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      title: '2. Dashboard',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Dashboard adalah pusat kendali analitik Anda. Di sini Anda dapat melihat ringkasan metrik kinerja secara real-time.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Filter Global:</strong> Gunakan menu filter (Kategori, PIC, Waktu) untuk menyaring seluruh data pada dashboard secara instan.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Notifikasi & Aktivitas (Baru):</strong> Ikon lonceng notifikasi di pojok kanan atas untuk memantau semua perubahan. Anda kini dapat memfilter berdasarkan status baca atau aksi spesifik (seperti 'Pekerjaan Diperbarui').</span>
            </li>
          </ul>
        </>
      )
    },
    {
      id: 'daftar-pekerjaan',
      icon: <ListTodo size={24} />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      title: '3. Daftar Pekerjaan (Task List)',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Modul utama untuk mengelola pekerjaan secara tabular (tabel). Cocok untuk melihat data dalam jumlah banyak dan melakukan aksi massal.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Edit Massal (Bulk Edit) Lanjutan (Baru):</strong> Centang beberapa tugas sekaligus dan ubah status, kategori, PIC, deskripsi, atau bahkan <strong>Jadwal & Waktu</strong> secara bersamaan.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Sub-Pekerjaan & Komentar:</strong> Pecah pekerjaan besar menjadi to-do list kecil. Tambahkan komentar dengan log riwayat lengkap.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Pekerjaan Berulang (Repetisi) (Baru):</strong> Tugas berulang harian, mingguan, atau bulanan dihitung secara akurat dalam kalender tanpa membuat tumpukan peristiwa tak terhingga.</span>
            </li>
          </ul>
        </>
      )
    },
    {
      id: 'calendar',
      icon: <CalendarDays size={24} />,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      title: '4. Kalender',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Lihat beban kerja Anda dalam format Kalender (Bulan, Minggu, Hari). Sangat membantu untuk mengetahui tenggat waktu (deadline).
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Perbaikan Performa (Baru):</strong> Algoritma kalender telah diperbarui untuk mencegah tumpang tindih dari peristiwa perulangan jangka panjang (misal dari impor Excel yang kurang tepat).</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Edit Drag and Drop:</strong> Anda dapat menggeser event di dalam kalender ke hari lain, atau memanjangkan durasinya secara langsung.</span>
            </li>
          </ul>
        </>
      )
    },
    {
      id: 'reports',
      icon: <BarChart3 size={24} />,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      title: '5. Analisis Laporan',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Modul pelaporan komprehensif berisi grafik kinerja mendalam untuk evaluasi tingkat manajerial.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Grafik Kinerja Dinamis (Baru):</strong> Terdapat grafik tambahan seperti Rata-rata Progress per Kategori, Kepatuhan Tenggat Waktu, dan Distribusi Pekerjaan.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Render Dinamis Label Data (Baru):</strong> Distribusi warna bagan dan labelnya (seperti Doughnut Chart) kini secara cerdas merender berdasarkan kategori yang sebenarnya ada di data Anda.</span>
            </li>
          </ul>
        </>
      )
    },
    {
      id: 'team',
      icon: <Users size={24} />,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.1)',
      title: '6. Manajemen Tim',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Pantau kinerja dan beban kerja masing-masing individu (PIC) di dalam tim Anda.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Produktivitas Individu:</strong> Lihat persentase penyelesaian tugas (Done vs Total Tugas) untuk setiap PIC.</span>
            </li>
          </ul>
        </>
      )
    },
    {
      id: 'settings',
      icon: <Settings size={24} />,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      title: '7. Pengaturan (Settings)',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Area kontrol untuk menyesuaikan aplikasi dengan kebutuhan spesifik organisasi Anda.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Kustomisasi Master Warna & Ikon (Baru):</strong> Anda bebas memilih warna dan ikon spesifik untuk merepresentasikan status, kategori, dan prioritas, yang langsung diterapkan di seluruh UI!</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Panduan Interaktif (Baru):</strong> Tutorial interaktif bergaya penyorotan area ini, yang juga memiliki opsi untuk mematikan efek redup (highlight).</span>
            </li>
          </ul>
        </>
      )
    }
  ];

  const startTutorial = async () => {
    const { driver } = await import('driver.js');
    const driverObj = driver({
      showProgress: true,
      animate: useHighlight,
      opacity: useHighlight ? 0.75 : 0,
      nextBtnText: 'Selanjutnya',
      prevBtnText: 'Sebelumnya',
      doneBtnText: 'Selesai',
      progressText: 'Langkah {{current}} dari {{total}}',
      steps: [
        { 
          element: '#menu-monitoring', 
          popover: { 
            title: 'Monitoring Board', 
            description: 'Selamat datang! Ini adalah tampilan utama pemantauan per-departemen yang memungkinkan Anda melihat seluruh status aktivitas.', 
            side: "right", align: 'start' 
          }
        },
        { 
          element: '#menu-dashboard', 
          popover: { 
            title: 'Dashboard Executive', 
            description: 'Lihat ringkasan dan metrik kinerja seluruh tugas Anda secara visual dan real-time di sini.', 
            side: "right", align: 'start' 
          }
        },
        { 
          element: '#menu-tasks', 
          popover: { 
            title: 'Daftar Pekerjaan', 
            description: 'Kelola seluruh daftar pekerjaan Anda dalam bentuk tabel interaktif. Anda bisa menambah, mengedit massal, dan mengunduh data di sini.', 
            side: "right", align: 'start' 
          }
        },
        { 
          element: '#menu-kanban', 
          popover: { 
            title: 'Papan Kanban', 
            description: 'Visualisasikan alur kerja (workflow) tim Anda. Pindahkan pekerjaan antar status semudah drag and drop!', 
            side: "right", align: 'start' 
          }
        },
        { 
          element: '#menu-calendar', 
          popover: { 
            title: 'Kalender & Jadwal', 
            description: 'Pantau tenggat waktu, waktu mulai, serta hari libur nasional secara langsung dalam format kalender bulanan/mingguan.', 
            side: "right", align: 'start' 
          }
        },
        { 
          element: '#menu-teams', 
          popover: { 
            title: 'Manajemen Tim & PIC', 
            description: 'Pantau beban kerja dan performa setiap penanggung jawab (PIC) secara komprehensif.', 
            side: "right", align: 'start' 
          }
        },
        { 
          element: '#menu-reports', 
          popover: { 
            title: 'Analisis & Laporan', 
            description: 'Akses berbagai grafik tingkat lanjut dan ekspor keseluruhan kinerja aplikasi sebagai laporan resmi.', 
            side: "right", align: 'start' 
          }
        },
        { 
          element: '#menu-settings', 
          popover: { 
            title: 'Master Pengaturan', 
            description: 'Sesuaikan kategori, kustomisasi palet warna, dan tentukan alur status pekerjaan yang sesuai dengan gaya perusahaan Anda.', 
            side: "right", align: 'start' 
          }
        },
        { 
          element: '#filter-pic', 
          popover: { 
            title: 'Filter Global PIC', 
            description: 'Pilih PIC di sini untuk memfilter seluruh data aplikasi (Dashboard, Tabel, Kanban, Grafik) HANYA untuk PIC tersebut.', 
            side: "right", align: 'start' 
          }
        },
        { 
          element: '#filter-target', 
          popover: { 
            title: 'Filter Rentang Waktu', 
            description: 'Tentukan rentang tanggal secara global (misal: "Bulan Ini" atau kustom) untuk membatasi ruang lingkup laporan kerja Anda.', 
            side: "right", align: 'start' 
          }
        },
        {
          popover: {
            title: '🎉 Tutorial Selesai!',
            description: 'Anda sudah siap menggunakan aplikasi ini secara maksimal. Jika Anda butuh bantuan, menu Panduan ini akan selalu tersedia.',
          }
        }
      ]
    });
    driverObj.drive();
  };

  return (
    <motion.div 
      style={{ padding: '32px 0', maxWidth: '1000px', margin: '0 auto' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: 'white', marginBottom: '16px' }}>
          <BookOpen size={32} />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>Panduan Aplikasi Lengkap</h1>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', marginBottom: '24px' }}>
          Selamat datang di buku panduan interaktif. Klik pada setiap bagian di bawah ini untuk mempelajari fungsionalitas dan fitur terbaik dari aplikasi ini.
        </p>
        <button 
          onClick={startTutorial}
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '12px', boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)' }}
        >
          <PlayCircle size={20} />
          🚀 Mulai Tutorial Interaktif
        </button>
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <button 
            onClick={() => setUseHighlight(!useHighlight)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: useHighlight ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}
          >
            {useHighlight ? <Eye size={16} /> : <EyeOff size={16} />}
            {useHighlight ? 'Efek Gelap (Highlight) Aktif' : 'Efek Gelap (Highlight) Nonaktif'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sections.map((section, index) => (
          <div key={section.id} className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <button
              onClick={() => toggleAccordion(section.id)}
              style={{
                width: '100%',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: section.bg, borderRadius: '12px', color: section.color }}>
                  {section.icon}
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                  {section.title}
                </h2>
              </div>
              <motion.div
                animate={{ rotate: activeAccordion === section.id ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={24} color="var(--text-secondary)" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {activeAccordion === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                    {section.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '40px', padding: '24px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <AlertCircle size={24} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>Punya Pertanyaan Lain?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
            Jika Anda mengalami kendala teknis atau memiliki pertanyaan yang belum terjawab pada panduan ini, Anda selalu dapat memanfaatkan pesan <strong>Error Clipboard</strong>. Jika terjadi error sistem, aplikasi akan memunculkan detail pesan yang dapat Anda salin (copy) dan kirim ke tim pengembang untuk penanganan cepat.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
