'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, LayoutDashboard, ListTodo, CheckCircle2, 
  Users, CalendarDays, Kanban, Download, 
  ChevronDown, Settings, AlertCircle, PlayCircle, Eye, EyeOff, BarChart3, KeyRound, Printer
} from 'lucide-react';

export default function GuidePage() {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('auth');

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const sections = [
    {
      id: 'auth',
      icon: <KeyRound size={24} />,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      title: '1. Login & Manajemen Akun',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Aplikasi menggunakan sistem autentikasi berbasis NPK (Nomor Pokok Karyawan) atau Email.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Login Default:</strong> Jika Anda baru pertama kali menggunakan aplikasi atau akun Anda direset, Anda dapat login menggunakan kredensial default yang telah diberikan oleh Administrator.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Lupa Password:</strong> Di halaman Login, klik tombol "Lupa Password?". Anda akan diminta memasukkan NPK. Permintaan reset password akan dikirimkan dan menunggu persetujuan Administrator (Status "PENDING").</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Profil Pengguna:</strong> Anda dapat mengubah nama, email, avatar, dan password kapan saja melalui menu Profil di pojok kanan atas.</span>
            </li>
          </ul>
          
          <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <img src="/guides/login_demo.png" alt="Ilustrasi Login" style={{ width: '100%', height: 'auto', display: 'block', maxWidth: '800px' }} />
          </div>
        </>
      )
    },
    {
      id: 'dashboard',
      icon: <LayoutDashboard size={24} />,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      title: '2. Dashboard & Analitik',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Dashboard adalah pusat informasi yang memberikan ringkasan seluruh metrik dan kinerja secara visual.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Statistik Kinerja (KPI):</strong> Lihat total pekerjaan, tugas selesai, dan tugas tertunda. Indikator persentase menunjukkan perbandingan performa bulan ini dengan bulan lalu.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Filter Global:</strong> Filter data yang ditampilkan di Dashboard berdasarkan <strong>Waktu</strong>, <strong>PIC</strong>, dan <strong>Kategori</strong> untuk menganalisis data secara spesifik.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Grafik Tren & Distribusi:</strong> Terdapat grafik bar untuk penyelesaian bulanan (Tren Penyelesaian Tugas) dan grafik donat untuk distribusi beban kerja per PIC (Distribusi PIC).</span>
            </li>
          </ul>

          <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <img src="/guides/dashboard_demo.png" alt="Ilustrasi Dashboard" style={{ width: '100%', height: 'auto', display: 'block', maxWidth: '800px' }} />
          </div>
        </>
      )
    },
    {
      id: 'monitoring-board',
      icon: <Kanban size={24} />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      title: '3. Monitoring Board (Kanban)',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Visualisasi pekerjaan dalam bentuk papan Kanban. Sangat cocok untuk rapat koordinasi dan melacak pergerakan progres (To Do 👉 In Progress 👉 Done).
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Drag and Drop Status:</strong> Pindahkan tugas dari satu tahap ke tahap lainnya cukup dengan menggeser kartu. Jika dipindah ke kolom "Selesai", progress otomatis menjadi 100%.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Pengurutan Kustom (Sort By):</strong> Tiap kolom Kanban memiliki opsi pengurutan (Sort By) untuk menyusun kartu berdasarkan "Terbaru", "Prioritas", atau "Tenggat Waktu Terdekat".</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Tampilan Kartu Dinamis:</strong> Setiap kartu akan menampilkan indikator warna prioritas, foto avatar PIC (jika ada), tenggat waktu, serta label progress bar sub-tugas.</span>
            </li>
          </ul>

          <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <img src="/guides/kanban_demo.png" alt="Ilustrasi Kanban Board" style={{ width: '100%', height: 'auto', display: 'block', maxWidth: '800px' }} />
          </div>
        </>
      )
    },
    {
      id: 'daftar-pekerjaan',
      icon: <ListTodo size={24} />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      title: '4. Daftar Pekerjaan & Sub-Tugas',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Daftar Pekerjaan menampilkan tabel detail untuk setiap tugas. Ideal untuk pengelolaan massal dan melihat detail spesifik dari setiap data.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Sub-Tugas (Checklist):</strong> Di dalam detail pekerjaan, Anda dapat memecah tugas besar menjadi bagian kecil (Sub-Tugas). Setiap sub-tugas memiliki penanggung jawab (PIC) dan tenggat waktu (Tgl Mulai & Tgl Selesai) secara terpisah.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Edit Massal (Bulk Edit):</strong> Centang beberapa baris sekaligus, lalu klik "Edit Terpilih" untuk mengubah PIC, Status, Kategori, atau Jadwal & Waktu untuk banyak pekerjaan dalam 1 klik.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Log Perubahan (History):</strong> Aplikasi secara otomatis merekam jejak (Audit Trail) kapan sebuah pekerjaan dibuat, diedit, atau dipindahkan, beserta nama penggunanya.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Ekspor Excel Berwarna:</strong> Daftar pekerjaan dapat diekspor ke Excel dengan format warna sel (berdasarkan Status/Prioritas) yang sudah disesuaikan secara otomatis.</span>
            </li>
          </ul>

          <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <img src="/guides/task_list_demo.png" alt="Ilustrasi Daftar Pekerjaan" style={{ width: '100%', height: 'auto', display: 'block', maxWidth: '800px' }} />
          </div>
        </>
      )
    },
    {
      id: 'settings',
      icon: <Settings size={24} />,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      title: '5. Pengaturan, Master Data & Backup',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Administrator memiliki akses penuh untuk mengatur master data aplikasi agar semua input dari user tetap terstandarisasi.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Master Dropdown:</strong> Tambah, edit, atau hapus pilihan untuk PIC, Kategori, Prioritas, dan Status. Dropdown di seluruh aplikasi akan merujuk ke data master ini secara ketat.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Warna Kustom & Progress:</strong> Tentukan warna untuk masing-masing label Status/Kategori. Anda juga dapat menentukan "Persentase Progress Otomatis" untuk setiap tahapan Status.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Mode Fokus (Zen Mode):</strong> Sembunyikan sidebar navigasi agar layar terlihat penuh. Sangat berguna untuk presentasi atau saat dijalankan di layar beresolusi kecil/HP.</span>
            </li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)' }}><strong>Backup & Restore Utuh:</strong> Anda bisa mengunduh file cadangan (*backup*) berformat JSON. File ini menyimpan tidak hanya Pekerjaan, melainkan seluruh Master Pengaturan. Gunakan tombol "Restore" untuk memulihkan seluruh data dalam 1 klik.</span>
            </li>
          </ul>

          <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <img src="/guides/settings_demo.png" alt="Ilustrasi Settings" style={{ width: '100%', height: 'auto', display: 'block', maxWidth: '800px' }} />
          </div>
        </>
      )
    },
  ];

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* ================== PRINT STYLES UNTUK PDF ================== */
        @media print {
          /* Sembunyikan Web UI biasa saat mencetak */
          #web-area, header, nav, aside {
            display: none !important;
          }
          
          /* Atur margin halaman */
          @page {
            margin: 20mm;
            size: A4 portrait;
          }

          body {
            background: white !important;
            color: black !important;
          }

          /* Tampilkan area khusus Print */
          #print-area {
            display: block !important;
            width: 100%;
          }

          .print-cover {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-after: always;
          }
          
          .print-title {
            font-size: 36px;
            font-weight: bold;
            color: #1e3a8a; /* Biru tua untuk cover */
            margin-bottom: 24px;
          }
          
          .print-subtitle {
            font-size: 20px;
            color: #4b5563;
          }
          
          .print-section {
            page-break-before: always;
            margin-bottom: 40px;
          }
          
          .print-section h2 {
            font-size: 24px;
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 16px;
            margin-top: 20px;
          }

          .print-list-item {
            margin-bottom: 12px;
            font-size: 14px;
            line-height: 1.6;
          }

          .print-toc-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .print-toc-item {
            font-size: 16px;
            margin-bottom: 12px;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 4px;
          }

          .print-img-placeholder {
            margin-top: 16px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #ccc;
          }
        }

        /* Saat di web biasa, Print Area disembunyikan */
        @media screen {
          #print-area {
            display: none !important;
          }
        }
      `}} />

      {/* ================== WEB AREA (Interactive UI) ================== */}
      <motion.div 
        id="web-area"
        className="glass" 
        style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', borderRadius: '16px' }}
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
            Pelajari semua fungsionalitas dan fitur terbaik dari aplikasi ini. Klik pada setiap bagian di bawah ini untuk melihat rincian secara interaktif.
          </p>
          
          <button 
            onClick={handlePrintPDF}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '12px', boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)' }}
          >
            <Printer size={20} />
            Unduh Panduan PDF (Buku Lengkap)
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sections.map((section) => (
            <div key={section.id} className="glass" style={{ borderRadius: '16px', overflow: 'hidden', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => toggleAccordion(section.id)}
                style={{
                  width: '100%',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: activeAccordion === section.id ? 'var(--bg-color)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s'
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
              Jika Anda mengalami kendala teknis atau memiliki pertanyaan yang belum terjawab pada panduan ini, Anda dapat menyalin (copy) <strong>Error Clipboard</strong> apabila muncul notifikasi error sistem, dan mengirimkannya ke tim dukungan IT untuk penanganan cepat.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ================== PRINT AREA (Hidden in web, visible in PDF) ================== */}
      <div id="print-area">
        {/* Halaman Sampul (Cover) */}
        <div className="print-cover">
          <BookOpen size={64} color="#1e3a8a" style={{ marginBottom: '24px' }} />
          <h1 className="print-title">Buku Panduan Penggunaan<br/>Aplikasi Monitoring Pekerjaan</h1>
          <p className="print-subtitle">Versi Resmi - {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <div style={{ marginTop: '60px', color: '#6b7280', fontSize: '14px' }}>
            <p>Dokumen ini merangkum seluruh instruksi penggunaan modul, fitur, pengaturan, dan mekanisme aplikasi.</p>
          </div>
        </div>

        {/* Daftar Isi (TOC) */}
        <div style={{ pageBreakAfter: 'always', margin: '40px 0' }}>
          <h2 className="print-toc-title">Daftar Isi</h2>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {sections.map(sec => (
              <div key={sec.id} className="print-toc-item">
                {sec.title}
              </div>
            ))}
          </div>
        </div>

        {/* Konten Utama (Bab-bab) */}
        {sections.map(sec => (
          <div key={sec.id} className="print-section">
            <h2>{sec.title}</h2>
            
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {sec.id === 'auth' && (
                <>
                  <p>Aplikasi menggunakan sistem autentikasi berbasis NPK (Nomor Pokok Karyawan) atau Email.</p>
                  <ul>
                    <li className="print-list-item"><strong>Login Default:</strong> Jika Anda baru pertama kali menggunakan aplikasi atau akun Anda direset, Anda dapat login menggunakan kredensial default yang telah diberikan oleh Administrator.</li>
                    <li className="print-list-item"><strong>Lupa Password:</strong> Di halaman Login, klik tombol "Lupa Password?". Anda akan diminta memasukkan NPK. Permintaan reset password akan dikirimkan dan menunggu persetujuan Administrator (Status "PENDING").</li>
                    <li className="print-list-item"><strong>Profil Pengguna:</strong> Anda dapat mengubah nama, email, avatar, dan password kapan saja melalui menu Profil di pojok kanan atas.</li>
                  </ul>
                  <div className="print-img-placeholder"><img src="/guides/login_demo.png" alt="Login" style={{ width: '100%', display: 'block' }} /></div>
                </>
              )}

              {sec.id === 'dashboard' && (
                <>
                  <p>Dashboard adalah pusat informasi yang memberikan ringkasan seluruh metrik dan kinerja secara visual.</p>
                  <ul>
                    <li className="print-list-item"><strong>Statistik Kinerja (KPI):</strong> Lihat total pekerjaan, tugas selesai, dan tugas tertunda. Indikator persentase menunjukkan perbandingan performa bulan ini dengan bulan lalu.</li>
                    <li className="print-list-item"><strong>Filter Global:</strong> Filter data yang ditampilkan di Dashboard berdasarkan <strong>Waktu</strong>, <strong>PIC</strong>, dan <strong>Kategori</strong> untuk menganalisis data secara spesifik.</li>
                    <li className="print-list-item"><strong>Grafik Tren & Distribusi:</strong> Terdapat grafik bar untuk penyelesaian bulanan (Tren Penyelesaian Tugas) dan grafik donat untuk distribusi beban kerja per PIC (Distribusi PIC).</li>
                  </ul>
                  <div className="print-img-placeholder"><img src="/guides/dashboard_demo.png" alt="Dashboard" style={{ width: '100%', display: 'block' }} /></div>
                </>
              )}

              {sec.id === 'monitoring-board' && (
                <>
                  <p>Visualisasi pekerjaan dalam bentuk papan Kanban. Sangat cocok untuk rapat koordinasi dan melacak pergerakan progres (To Do 👉 In Progress 👉 Done).</p>
                  <ul>
                    <li className="print-list-item"><strong>Drag and Drop Status:</strong> Pindahkan tugas dari satu tahap ke tahap lainnya cukup dengan menggeser kartu. Jika dipindah ke kolom "Selesai", progress otomatis menjadi 100%.</li>
                    <li className="print-list-item"><strong>Pengurutan Kustom (Sort By):</strong> Tiap kolom Kanban memiliki opsi pengurutan (Sort By) untuk menyusun kartu berdasarkan "Terbaru", "Prioritas", atau "Tenggat Waktu Terdekat".</li>
                    <li className="print-list-item"><strong>Tampilan Kartu Dinamis:</strong> Setiap kartu akan menampilkan indikator warna prioritas, foto avatar PIC (jika ada), tenggat waktu, serta label progress bar sub-tugas.</li>
                  </ul>
                  <div className="print-img-placeholder"><img src="/guides/kanban_demo.png" alt="Kanban" style={{ width: '100%', display: 'block' }} /></div>
                </>
              )}

              {sec.id === 'daftar-pekerjaan' && (
                <>
                  <p>Daftar Pekerjaan menampilkan tabel detail untuk setiap tugas. Ideal untuk pengelolaan massal dan melihat detail spesifik dari setiap data.</p>
                  <ul>
                    <li className="print-list-item"><strong>Sub-Tugas (Checklist):</strong> Di dalam detail pekerjaan, Anda dapat memecah tugas besar menjadi bagian kecil (Sub-Tugas). Setiap sub-tugas memiliki penanggung jawab (PIC) dan tenggat waktu (Tgl Mulai & Tgl Selesai) secara terpisah.</li>
                    <li className="print-list-item"><strong>Edit Massal (Bulk Edit):</strong> Centang beberapa baris sekaligus, lalu klik "Edit Terpilih" untuk mengubah PIC, Status, Kategori, atau Jadwal & Waktu untuk banyak pekerjaan dalam 1 klik.</li>
                    <li className="print-list-item"><strong>Log Perubahan (History):</strong> Aplikasi secara otomatis merekam jejak (Audit Trail) kapan sebuah pekerjaan dibuat, diedit, atau dipindahkan, beserta nama penggunanya.</li>
                    <li className="print-list-item"><strong>Ekspor Excel Berwarna:</strong> Daftar pekerjaan dapat diekspor ke Excel dengan format warna sel (berdasarkan Status/Prioritas) yang sudah disesuaikan secara otomatis.</li>
                  </ul>
                  <div className="print-img-placeholder"><img src="/guides/task_list_demo.png" alt="Task List" style={{ width: '100%', display: 'block' }} /></div>
                </>
              )}

              {sec.id === 'settings' && (
                <>
                  <p>Administrator memiliki akses penuh untuk mengatur master data aplikasi agar semua input dari user tetap terstandarisasi.</p>
                  <ul>
                    <li className="print-list-item"><strong>Master Dropdown:</strong> Tambah, edit, atau hapus pilihan untuk PIC, Kategori, Prioritas, dan Status. Dropdown di seluruh aplikasi akan merujuk ke data master ini secara ketat.</li>
                    <li className="print-list-item"><strong>Warna Kustom & Progress:</strong> Tentukan warna untuk masing-masing label Status/Kategori. Anda juga dapat menentukan "Persentase Progress Otomatis" untuk setiap tahapan Status.</li>
                    <li className="print-list-item"><strong>Mode Fokus (Zen Mode):</strong> Sembunyikan sidebar navigasi agar layar terlihat penuh. Sangat berguna untuk presentasi atau saat dijalankan di layar beresolusi kecil/HP.</li>
                    <li className="print-list-item"><strong>Backup & Restore Utuh:</strong> Anda bisa mengunduh file cadangan (*backup*) berformat JSON. File ini menyimpan tidak hanya Pekerjaan, melainkan seluruh Master Pengaturan. Gunakan tombol "Restore" untuk memulihkan seluruh data dalam 1 klik.</li>
                  </ul>
                  <div className="print-img-placeholder"><img src="/guides/settings_demo.png" alt="Settings" style={{ width: '100%', display: 'block' }} /></div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
