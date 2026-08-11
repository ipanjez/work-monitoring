'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, LayoutDashboard, ListTodo, CheckCircle2, 
  Users, CalendarDays, Kanban, 
  ChevronDown, Settings, AlertCircle, Printer, KeyRound,
  FileText, BarChart3, Clock, Shield, Download, Upload,
  MousePointerClick, ArrowRight, Zap, Eye, Bell, Search,
  Filter, Globe, Palette, Database, UserCheck, Lock
} from 'lucide-react';

/* ─── Inline mini-illustration component ─── */
const FeatureVisual = ({ children, gradient }: { children: React.ReactNode; gradient: string }) => (
  <div style={{
    marginTop: '20px',
    padding: '24px',
    borderRadius: '16px',
    background: gradient,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid var(--border-color)'
  }}>
    {children}
  </div>
);

const MiniCard = ({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '14px 18px',
    borderRadius: '12px',
    background: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    minWidth: '100px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}>
    <div style={{ color, display: 'flex' }}>{icon}</div>
    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</span>
  </div>
);

const FlowArrow = () => (
  <ArrowRight size={20} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
);

const StepBadge = ({ step }: { step: number }) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    color: 'white',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0
  }}>
    {step}
  </div>
);

const TipBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    marginTop: '16px',
    padding: '14px 16px',
    borderRadius: '12px',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: 1.5
  }}>
    <Zap size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
    <div>{children}</div>
  </div>
);

export default function GuidePage() {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('auth');
  const contentRef = useRef<HTMLDivElement>(null);

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
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Aplikasi menggunakan sistem autentikasi berbasis <strong>NPK (Nomor Pokok Karyawan)</strong>. Berikut alur aksesnya:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <StepBadge step={1} />
              <div><strong>Buka halaman Login</strong> — Masukkan NPK dan Password yang telah diberikan oleh Administrator, lalu klik <em>Masuk</em>.</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <StepBadge step={2} />
              <div><strong>Lupa Password?</strong> — Klik link &quot;Lupa Password&quot; di halaman Login. Masukkan NPK Anda, dan permintaan reset akan dikirim ke Admin untuk disetujui.</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <StepBadge step={3} />
              <div><strong>Profil Pengguna</strong> — Setelah login, klik foto/nama Anda di pojok kanan atas untuk mengubah nama, email, avatar, dan password kapan saja.</div>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(139,92,246,0.05), rgba(59,130,246,0.05))">
            <MiniCard icon={<Lock size={20} />} label="Masukkan NPK" color="#8b5cf6" />
            <FlowArrow />
            <MiniCard icon={<KeyRound size={20} />} label="Verifikasi" color="#3b82f6" />
            <FlowArrow />
            <MiniCard icon={<UserCheck size={20} />} label="Login Berhasil" color="#10b981" />
          </FeatureVisual>
          <TipBox>
            <strong>Tips:</strong> Jika akun Anda berstatus <em>PENDING</em>, hubungi Admin untuk mengaktifkannya terlebih dahulu.
          </TipBox>
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
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Dashboard adalah <strong>pusat kontrol</strong> yang menampilkan ringkasan seluruh metrik kinerja dan pekerjaan secara visual dan real-time.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Kartu KPI:</strong> Lihat total pekerjaan, tugas selesai, dan tugas tertunda. Persentase perbandingan performa bulan ini vs bulan lalu.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Filter Global:</strong> Filter berdasarkan <em>Waktu</em>, <em>PIC</em>, <em>Prioritas</em>, <em>Kategori</em>, dan <em>Status</em> untuk drill-down analisis data.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Grafik Tren & Distribusi:</strong> Grafik bar penyelesaian bulanan dan grafik donat distribusi beban kerja per PIC.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Tabel Ringkasan:</strong> Daftar pekerjaan aktif dengan kolom yang dapat di-sort (nama, PIC, kategori, status, tenggat).</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(59,130,246,0.05), rgba(16,185,129,0.05))">
            <MiniCard icon={<BarChart3 size={20} />} label="Grafik Tren" color="#3b82f6" />
            <MiniCard icon={<Filter size={20} />} label="Filter Global" color="#8b5cf6" />
            <MiniCard icon={<Eye size={20} />} label="Detail Modal" color="#10b981" />
            <MiniCard icon={<Search size={20} />} label="Pencarian" color="#f59e0b" />
          </FeatureVisual>
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
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Visualisasi pekerjaan dalam bentuk <strong>papan Kanban</strong>. Sangat cocok untuk rapat koordinasi dan melacak pergerakan progres tugas.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Drag & Drop:</strong> Pindahkan kartu antar kolom status cukup dengan menggeser. Jika dipindah ke kolom &quot;Selesai&quot;, progress otomatis 100%.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Sort & Filter Kolom:</strong> Setiap kolom memiliki opsi pengurutan (Terbaru, Prioritas, Tenggat Terdekat).</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Kartu Dinamis:</strong> Setiap kartu menampilkan indikator prioritas, avatar PIC, tenggat waktu, dan progress bar sub-tugas.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(245,158,11,0.05), rgba(239,68,68,0.05))">
            <MiniCard icon={<ListTodo size={20} />} label="To Do" color="#6b7280" />
            <FlowArrow />
            <MiniCard icon={<Clock size={20} />} label="In Progress" color="#f59e0b" />
            <FlowArrow />
            <MiniCard icon={<CheckCircle2 size={20} />} label="Done" color="#10b981" />
          </FeatureVisual>
          <TipBox>
            <strong>Tips:</strong> Klik kartu untuk membuka detail lengkap, termasuk sub-tugas, komentar, dan file lampiran.
          </TipBox>
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
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Halaman <strong>Daftar Pekerjaan</strong> menampilkan tabel detail lengkap. Ideal untuk pengelolaan massal dan melihat detail spesifik setiap tugas.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Sub-Tugas (Checklist):</strong> Pecah pekerjaan menjadi item-item kecil. Setiap sub-tugas memiliki PIC, tanggal mulai, dan tenggat tersendiri.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Edit Massal (Bulk Edit):</strong> Centang beberapa baris, lalu klik &quot;Edit Terpilih&quot; untuk mengubah PIC, Status, Kategori, atau Jadwal sekaligus.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Log Perubahan (Audit Trail):</strong> Setiap perubahan dicatat otomatis — siapa, kapan, dan apa yang berubah.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Ekspor Excel Berwarna:</strong> Ekspor ke Excel dengan format warna sel otomatis berdasarkan Status/Prioritas.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))">
            <MiniCard icon={<FileText size={20} />} label="Detail Tugas" color="#10b981" />
            <MiniCard icon={<MousePointerClick size={20} />} label="Edit Massal" color="#3b82f6" />
            <MiniCard icon={<Download size={20} />} label="Ekspor Excel" color="#f59e0b" />
            <MiniCard icon={<Bell size={20} />} label="Notifikasi" color="#ef4444" />
          </FeatureVisual>
        </>
      )
    },
    {
      id: 'kalender',
      icon: <CalendarDays size={24} />,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      title: '5. Kalender & Integrasi',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Lihat seluruh pekerjaan dalam tampilan <strong>kalender bulanan/mingguan/harian</strong> untuk perencanaan jadwal yang lebih intuitif.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Tampilan Multi-Mode:</strong> Pilih tampilan Bulan, Minggu, Hari, atau Agenda sesuai kebutuhan Anda.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Hari Libur Nasional:</strong> Kalender otomatis menampilkan hari libur nasional Indonesia dengan warna merah.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Google Calendar & ICS:</strong> Dari modal detail pekerjaan, Anda dapat menambahkan ke Google Calendar atau mengunduh file .ics.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(6,182,212,0.05), rgba(139,92,246,0.05))">
            <MiniCard icon={<CalendarDays size={20} />} label="Tampilan Bulan" color="#06b6d4" />
            <MiniCard icon={<Clock size={20} />} label="Tampilan Hari" color="#8b5cf6" />
            <MiniCard icon={<Globe size={20} />} label="Libur Nasional" color="#ef4444" />
          </FeatureVisual>
        </>
      )
    },
    {
      id: 'tim',
      icon: <Users size={24} />,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.1)',
      title: '6. Manajemen Tim & Beban Kerja',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Halaman <strong>Tim</strong> menampilkan statistik beban kerja per PIC agar distribusi tugas dapat dimonitor secara adil dan merata.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Kartu PIC:</strong> Lihat jumlah total, urgent, dan status distribusi tugas per anggota tim.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Quick View:</strong> Klik nama PIC untuk melihat daftar pekerjaan yang ditangani.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(236,72,153,0.05), rgba(245,158,11,0.05))">
            <MiniCard icon={<Users size={20} />} label="Daftar PIC" color="#ec4899" />
            <MiniCard icon={<BarChart3 size={20} />} label="Beban Kerja" color="#f59e0b" />
            <MiniCard icon={<Shield size={20} />} label="Hak Akses" color="#3b82f6" />
          </FeatureVisual>
        </>
      )
    },
    {
      id: 'settings',
      icon: <Settings size={24} />,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      title: '7. Pengaturan & Master Data',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Administrator memiliki akses penuh untuk mengatur <strong>master data</strong>, konfigurasi aplikasi, dan backup.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Master Dropdown:</strong> Kelola opsi PIC, Kategori, Prioritas, Status, dan Lokasi. Semua dropdown di aplikasi merujuk ke data ini.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Warna & Ikon Kustom:</strong> Tetapkan warna dan ikon untuk setiap label Status/Kategori agar mudah dibedakan secara visual.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Batas Waktu Sesi:</strong> Atur durasi auto-logout (1 jam s.d. 30 hari) dari menu Pengaturan Umum.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Backup & Restore:</strong> Unduh file cadangan JSON yang mencakup seluruh data dan pengaturan. Restore dengan 1 klik.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(239,68,68,0.05), rgba(139,92,246,0.05))">
            <MiniCard icon={<Palette size={20} />} label="Warna & Tema" color="#ef4444" />
            <MiniCard icon={<Database size={20} />} label="Backup Data" color="#3b82f6" />
            <MiniCard icon={<Upload size={20} />} label="Restore" color="#10b981" />
            <MiniCard icon={<Shield size={20} />} label="Hak Akses" color="#8b5cf6" />
          </FeatureVisual>
          <TipBox>
            <strong>Tips:</strong> Lakukan backup berkala (misalnya setiap minggu) untuk mencegah kehilangan data.
          </TipBox>
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
        @media print {
          #web-area, header, nav, aside, .sidebar, .header-actions-container, .mobile-header, .focus-mode-toggle { display: none !important; }
          @page { margin: 15mm; size: A4 portrait; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          #print-area { display: block !important; width: 100%; font-family: 'Segoe UI', sans-serif; }
          .print-cover { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; }
          .print-title { font-size: 32px; font-weight: bold; color: #1e3a8a; margin-bottom: 16px; line-height: 1.3; }
          .print-subtitle { font-size: 16px; color: #4b5563; margin-bottom: 40px; }
          .print-toc { page-break-after: always; padding: 40px 0; }
          .print-toc h2 { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 24px; color: #1e40af; }
          .print-toc-item { font-size: 15px; margin-bottom: 10px; border-bottom: 1px dotted #d1d5db; padding-bottom: 6px; color: #374151; }
          .print-section { page-break-before: always; margin-bottom: 20px; }
          .print-section h2 { font-size: 22px; color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; margin-bottom: 16px; margin-top: 0; }
          .print-section p { font-size: 13px; line-height: 1.7; color: #374151; margin-bottom: 12px; }
          .print-section ul { padding-left: 20px; }
          .print-section li { font-size: 13px; line-height: 1.6; margin-bottom: 8px; color: #374151; }
          .print-footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        }
        @media screen { #print-area { display: none !important; } }
      `}} />

      {/* ================== WEB AREA ================== */}
      <motion.div 
        id="web-area"
        ref={contentRef}
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
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>Panduan Aplikasi</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', marginBottom: '24px', lineHeight: 1.6 }}>
            Pelajari semua fitur dan fungsionalitas aplikasi monitoring pekerjaan ini. Klik setiap bagian untuk melihat detail.
          </p>
          
          <button 
            onClick={handlePrintPDF}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '12px', boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)' }}
          >
            <Printer size={20} />
            Unduh Panduan PDF
          </button>
        </div>

        {/* Quick Navigation */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
          {sections.map((s) => (
            <button 
              key={s.id}
              onClick={() => { setActiveAccordion(s.id); }}
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: activeAccordion === s.id ? `2px solid ${s.color}` : '1px solid var(--border-color)',
                background: activeAccordion === s.id ? s.bg : 'var(--surface-color)',
                color: activeAccordion === s.id ? s.color : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {s.icon && React.cloneElement(s.icon as React.ReactElement<any>, { size: 14 })}
              {s.title.replace(/^\d+\.\s*/, '')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sections.map((section) => (
            <div key={section.id} className="glass" style={{ borderRadius: '16px', overflow: 'hidden', background: 'var(--surface-color)', border: activeAccordion === section.id ? `1px solid ${section.color}40` : '1px solid var(--border-color)', transition: 'border-color 0.3s' }}>
              <button
                onClick={() => toggleAccordion(section.id)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: activeAccordion === section.id ? section.bg : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '10px', background: section.bg, borderRadius: '12px', color: section.color }}>
                    {section.icon}
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    {section.title}
                  </h2>
                </div>
                <motion.div
                  animate={{ rotate: activeAccordion === section.id ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={22} color="var(--text-secondary)" />
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
                    <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                      {section.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '32px', padding: '20px 24px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <AlertCircle size={22} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>Punya Pertanyaan?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
              Jika Anda mengalami kendala teknis, salin <strong>Error Clipboard</strong> apabila muncul notifikasi error, dan kirimkan ke tim IT untuk penanganan cepat.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ================== PRINT AREA ================== */}
      <div id="print-area">
        <div className="print-cover">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
          <h1 className="print-title">Buku Panduan Penggunaan<br/>Aplikasi Monitoring Pekerjaan</h1>
          <p className="print-subtitle">Versi Resmi — {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div style={{ marginTop: '40px', color: '#6b7280', fontSize: '13px', maxWidth: '400px', lineHeight: 1.6 }}>
            Dokumen ini merangkum seluruh instruksi penggunaan modul, fitur, pengaturan, dan mekanisme aplikasi.
          </div>
        </div>

        <div className="print-toc">
          <h2>Daftar Isi</h2>
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            {sections.map(sec => (
              <div key={sec.id} className="print-toc-item">{sec.title}</div>
            ))}
          </div>
        </div>

        {sections.map(sec => (
          <div key={sec.id} className="print-section">
            <h2>{sec.title}</h2>
            {sec.id === 'auth' && (
              <>
                <p>Aplikasi menggunakan sistem autentikasi berbasis NPK (Nomor Pokok Karyawan).</p>
                <ul>
                  <li><strong>Login:</strong> Masukkan NPK dan Password yang diberikan Administrator, lalu klik Masuk.</li>
                  <li><strong>Lupa Password:</strong> Klik &quot;Lupa Password?&quot; di halaman Login. Masukkan NPK, permintaan reset akan dikirim ke Admin.</li>
                  <li><strong>Profil Pengguna:</strong> Klik nama/foto Anda di pojok kanan atas untuk mengubah nama, email, avatar, dan password.</li>
                </ul>
              </>
            )}
            {sec.id === 'dashboard' && (
              <>
                <p>Dashboard adalah pusat kontrol yang menampilkan ringkasan metrik kinerja secara visual dan real-time.</p>
                <ul>
                  <li><strong>Kartu KPI:</strong> Total pekerjaan, tugas selesai, tugas tertunda, dengan persentase perbandingan bulan ini vs bulan lalu.</li>
                  <li><strong>Filter Global:</strong> Filter berdasarkan Waktu, PIC, Prioritas, Kategori, dan Status.</li>
                  <li><strong>Grafik Tren &amp; Distribusi:</strong> Grafik bar penyelesaian bulanan dan donat distribusi PIC.</li>
                  <li><strong>Tabel Ringkasan:</strong> Daftar pekerjaan aktif yang dapat di-sort berdasarkan berbagai kolom.</li>
                </ul>
              </>
            )}
            {sec.id === 'monitoring-board' && (
              <>
                <p>Visualisasi pekerjaan dalam bentuk papan Kanban untuk rapat koordinasi dan pelacakan progres.</p>
                <ul>
                  <li><strong>Drag &amp; Drop:</strong> Pindahkan kartu antar kolom. Jika ke &quot;Selesai&quot;, progress otomatis 100%.</li>
                  <li><strong>Sort Kolom:</strong> Tiap kolom memiliki pengurutan (Terbaru, Prioritas, Tenggat Terdekat).</li>
                  <li><strong>Kartu Dinamis:</strong> Menampilkan prioritas, avatar PIC, tenggat waktu, dan progress bar.</li>
                </ul>
              </>
            )}
            {sec.id === 'daftar-pekerjaan' && (
              <>
                <p>Tabel detail untuk pengelolaan massal dan melihat detail spesifik setiap tugas.</p>
                <ul>
                  <li><strong>Sub-Tugas:</strong> Pecah pekerjaan menjadi item kecil dengan PIC dan tenggat terpisah.</li>
                  <li><strong>Edit Massal:</strong> Centang beberapa baris dan ubah PIC, Status, Kategori, atau Jadwal sekaligus.</li>
                  <li><strong>Log Perubahan:</strong> Audit trail otomatis — siapa, kapan, dan apa yang berubah.</li>
                  <li><strong>Ekspor Excel:</strong> Ekspor dengan format warna sel otomatis berdasarkan Status/Prioritas.</li>
                </ul>
              </>
            )}
            {sec.id === 'kalender' && (
              <>
                <p>Lihat seluruh pekerjaan dalam tampilan kalender bulanan/mingguan/harian.</p>
                <ul>
                  <li><strong>Multi-Mode:</strong> Tampilan Bulan, Minggu, Hari, atau Agenda.</li>
                  <li><strong>Hari Libur:</strong> Hari libur nasional Indonesia ditampilkan otomatis.</li>
                  <li><strong>Google Calendar &amp; ICS:</strong> Tambah ke Google Calendar atau unduh file .ics dari modal detail.</li>
                </ul>
              </>
            )}
            {sec.id === 'tim' && (
              <>
                <p>Statistik beban kerja per PIC untuk distribusi tugas yang adil dan merata.</p>
                <ul>
                  <li><strong>Kartu PIC:</strong> Jumlah total, urgent, dan distribusi status per anggota tim.</li>
                  <li><strong>Quick View:</strong> Klik nama PIC untuk melihat daftar pekerjaannya.</li>
                </ul>
              </>
            )}
            {sec.id === 'settings' && (
              <>
                <p>Administrator memiliki akses penuh untuk mengatur master data dan konfigurasi aplikasi.</p>
                <ul>
                  <li><strong>Master Dropdown:</strong> Kelola opsi PIC, Kategori, Prioritas, Status, Lokasi.</li>
                  <li><strong>Warna &amp; Ikon:</strong> Tetapkan warna dan ikon untuk setiap label.</li>
                  <li><strong>Batas Waktu Sesi:</strong> Atur durasi auto-logout (1 jam s.d. 30 hari).</li>
                  <li><strong>Backup &amp; Restore:</strong> Unduh/pulihkan file cadangan JSON seluruh data.</li>
                </ul>
              </>
            )}
            <div className="print-footer">
              Panduan Aplikasi Monitoring Pekerjaan — Halaman {sections.indexOf(sec) + 1} dari {sections.length}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
