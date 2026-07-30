'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, LayoutDashboard, ListTodo, FileText, CheckCircle2, 
  Users, Shield, CalendarDays, Kanban, Download, Upload, 
  ChevronDown, Settings, AlertCircle, FileSpreadsheet
} from 'lucide-react';

export default function GuidePage() {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('dashboard');

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const sections = [
    {
      id: 'dashboard',
      icon: <LayoutDashboard size={24} />,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      title: '1. Dashboard Executive',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Dashboard adalah pusat kendali analitik Anda. Di sini Anda dapat melihat ringkasan seluruh metrik penting secara real-time.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Filter Global:</strong> Gunakan menu sidebar (Kategori, PIC, Waktu) untuk memfilter seluruh data pada dashboard secara instan.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Interaktivitas Grafik:</strong> Klik elemen pada grafik (misal: bagian status "In Progress" di Donut Chart) untuk difilter dan diarahkan ke rincian tugas.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Dinamis:</strong> Label status pekerjaan dan prioritas yang ditampilkan mengikuti pengaturan (Settings) yang Anda buat.</span>
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
      title: '2. Daftar Pekerjaan (Task List)',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Modul utama untuk mengelola pekerjaan secara tabular (tabel). Cocok untuk melihat data dalam jumlah banyak dan melakukan aksi massal.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Pembuatan Pekerjaan:</strong> Klik tombol "+ Pekerjaan Baru" untuk menambah pekerjaan. Anda dapat menentukan Deskripsi, PIC Utama, PIC Tambahan (jika lebih dari satu orang), Kategori, Status, dan Prioritas.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Sub-Pekerjaan (To-Do List):</strong> Pecah pekerjaan besar menjadi beberapa sub-pekerjaan kecil agar mudah dipantau persentasenya.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Fitur Komentar (Baru):</strong> Setiap pekerjaan kini dilengkapi dengan kolom komentar di bagian detailnya. Anda dapat berdiskusi dan melihat riwayat (log) perubahan tugas.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Pekerjaan Berulang (Repetisi):</strong> Anda bisa mengatur agar tugas berulang harian, mingguan, atau bulanan secara otomatis.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Upload size={18} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Import/Export Excel:</strong> <br/>
              - <strong>Export:</strong> Klik ikon Excel untuk mengunduh seluruh pekerjaan ke format `.xlsx`. <br/>
              - <strong>Import (Template):</strong> Unduh template kosong terlebih dahulu, isi data pekerjaan beserta Sub-Pekerjaannya, lalu unggah kembali untuk membuat banyak tugas sekaligus.</span>
            </li>
          </ul>
        </>
      )
    },
    {
      id: 'board',
      icon: <Kanban size={24} />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      title: '3. Monitoring Board (Kanban)',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Visualisasi pekerjaan dalam bentuk papan Kanban. Sangat cocok untuk rapat stand-up dan memantau perpindahan status pekerjaan.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Drag and Drop Status:</strong> Pindahkan kartu pekerjaan dari satu kolom status ke kolom lainnya hanya dengan menggeser (drag & drop) kartu tersebut. Status akan otomatis diperbarui.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Urutkan Kartu Manual (Drag per Card):</strong> Di dalam satu kolom, Anda bisa mengurutkan prioritas pekerjaan dengan menarik kartu ke atas atau ke bawah.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Filter Dinamis:</strong> Board ini juga terhubung dengan Sidebar Filter, sehingga Anda bisa menampilkan Kanban khusus untuk PIC tertentu.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Kolom Dinamis:</strong> Jumlah dan nama kolom Kanban (To Do, Review, dsb) akan menyesuaikan dengan Master Status yang ada di menu Pengaturan.</span>
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
      title: '4. Kalender & Sinkronisasi (.ics)',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Lihat beban kerja Anda dalam format Kalender (Bulan, Minggu, Hari). Sangat membantu untuk mengetahui tenggat waktu (deadline).
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Tampilan Kalender:</strong> Klik salah satu acara (event) di kalender untuk melihat detail pekerjaan, mengedit, atau menambah komentar.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <FileSpreadsheet size={18} color="#8b5cf6" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Apa itu Sinkronisasi (.ics)?</strong> <br/>
              Format `.ics` (iCalendar) adalah standar format file untuk menyimpan data acara kalender. Hampir semua aplikasi kalender populer (Google Calendar, Apple Calendar, Microsoft Outlook) mendukung format ini.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Cara Menggunakan .ics:</strong> <br/>
              Klik tombol berlogo Kalender (Download .ics) pada detail tugas. File `task.ics` akan terunduh. Buka file tersebut, maka aplikasi Kalender di HP atau Laptop Anda akan otomatis terbuka untuk menyimpan pengingat pekerjaan tersebut.</span>
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
      title: '5. Manajemen Tim',
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
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Status Pekerjaan per PIC:</strong> Statistik status pekerjaan (sesuai Master Status) akan ditampilkan pada kartu setiap individu. Klik kartu PIC untuk memunculkan tabel rincian pekerjaan di bawahnya.</span>
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
      title: '6. Pengaturan (Settings)',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Area kontrol untuk menyesuaikan aplikasi dengan kebutuhan spesifik organisasi Anda. <strong>Aplikasi ini bersifat 100% dinamis!</strong>
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Master Kategori & PIC:</strong> Tambahkan atau hapus daftar Kategori Pekerjaan dan nama-nama Person In Charge (PIC). Perubahan di sini akan tercermin di seluruh form pilihan.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Master Status & Prioritas (Baru):</strong> Tidak ada lagi status statis! Anda bebas mendefinisikan tahapan kerja Anda sendiri (misal: "Backlog", "Sedang Dikerjakan", "Menunggu Verifikasi", "Selesai"). Seluruh grafik, filter, dan form akan menyesuaikan secara otomatis.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Auto-Logout:</strong> Demi keamanan, jika Anda membiarkan layar tanpa aktivitas selama beberapa menit (sesuai aturan), sistem akan mengeluarkan Anda (logout) secara otomatis.</span>
            </li>
          </ul>
        </>
      )
    }
  ];

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
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Selamat datang di buku panduan interaktif. Klik pada setiap bagian di bawah ini untuk mempelajari fungsionalitas dan fitur terbaik dari aplikasi ini.
        </p>
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
