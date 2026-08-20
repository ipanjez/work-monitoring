'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, LayoutDashboard, ListTodo, CheckCircle2, 
  Users, CalendarDays, Kanban, 
  ChevronDown, Settings, AlertCircle, Printer, KeyRound,
  FileText, BarChart3, Clock, Shield, Download, Upload,
  MousePointerClick, ArrowRight, Zap, Eye, Bell, Search,
  Filter, Globe, Palette, Database, UserCheck, Lock,
  FileSpreadsheet, MapPin, Tag, Copy, Sparkles, Sliders,
  ChevronsUpDown, Check, HelpCircle
} from 'lucide-react';

const FeatureVisual = ({ children, gradient, interactiveMockup }: { children: React.ReactNode; gradient: string; interactiveMockup?: React.ReactNode }) => (
  <div style={{
    marginTop: '16px',
    padding: '20px',
    borderRadius: '14px',
    background: gradient,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    border: '1px solid var(--border-color)',
    alignItems: 'center'
  }}>
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%'
    }}>
      {children}
    </div>
    {interactiveMockup && (
      <div style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-color)', borderRadius: '12px', padding: '14px', border: '1px solid var(--border-color)', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.1)' }}>
        {interactiveMockup}
      </div>
    )}
  </div>
);

const InteractiveKanbanMockup = () => {
  return (
    <div style={{ display: 'flex', gap: '8px', height: '150px' }}>
      <div style={{ flex: 1, background: 'var(--surface-color)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>To Do</div>
        <motion.div 
          style={{ background: 'var(--bg-color)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', height: '52px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          animate={{ x: [0, 0, 140, 140, 280, 280, 0], y: [0, 0, 0, 0, 0, 0, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div style={{ width: '40%', height: '5px', background: '#3b82f6', borderRadius: '3px', marginBottom: '6px' }} />
          <div style={{ width: '80%', height: '4px', background: 'var(--border-color)', borderRadius: '2px', marginBottom: '4px' }} />
          <div style={{ width: '55%', height: '4px', background: 'var(--border-color)', borderRadius: '2px' }} />
        </motion.div>
      </div>
      <div style={{ flex: 1, background: 'var(--surface-color)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>In Progress</div>
      </div>
      <div style={{ flex: 1, background: 'var(--surface-color)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Done</div>
      </div>
    </div>
  );
};

const InteractiveChartMockup = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px', padding: '16px 8px 0 8px' }}>
      {[35, 75, 50, 95, 65].map((h, i) => (
        <motion.div
          key={i}
          style={{ width: '14%', background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '4px 4px 0 0' }}
          animate={{ height: [0, h, h, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

const MiniCard = ({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    minWidth: '85px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    textAlign: 'center'
  }}>
    <div style={{ color, display: 'flex' }}>{icon}</div>
    <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
  </div>
);

const FlowArrow = () => (
  <ArrowRight size={16} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
);

const StepBadge = ({ step }: { step: number }) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    color: 'white',
    fontSize: '11.5px',
    fontWeight: 700,
    flexShrink: 0
  }}>
    {step}
  </div>
);

const TipBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    marginTop: '14px',
    padding: '12px 14px',
    borderRadius: '10px',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    fontSize: '12.5px',
    color: 'var(--text-primary)',
    lineHeight: 1.5
  }}>
    <Zap size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
    <div>{children}</div>
  </div>
);

export default function GuidePage() {
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    'auth': true,
    'dashboard': false,
    'monitoring-board': false,
    'daftar-pekerjaan': false,
    'smart-add': false,
    'excel-import-export': false,
    'kalender': false,
    'tim': false,
    'settings': false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleAll = () => {
    const anyOpen = Object.values(openAccordions).some(v => v);
    const newState: Record<string, boolean> = {};
    sections.forEach(s => {
      newState[s.id] = !anyOpen;
    });
    setOpenAccordions(newState);
  };

  const sections = [
    {
      id: 'auth',
      shortTitle: 'Akun & Login',
      icon: <KeyRound size={20} />,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      title: '1. Login & Manajemen Akun',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', fontSize: '13px' }}>
            Aplikasi menggunakan sistem autentikasi berbasis <strong>NPK (Nomor Pokok Karyawan)</strong> yang aman dan terintegrasi dengan sistem peran (*Role-Based Access Control*):
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <StepBadge step={1} />
              <div><strong>Halaman Login:</strong> Masukkan NPK dan Password yang telah didaftarkan oleh Administrator, lalu klik <em>Masuk</em>.</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <StepBadge step={2} />
              <div><strong>Lupa Password:</strong> Klik tautan <em>Lupa Password?</em> pada layar login. Masukkan NPK Anda untuk mengirim permintaan reset langsung ke panel Administrator.</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <StepBadge step={3} />
              <div><strong>Profil & Keamanan:</strong> Klik foto profil/nama di pojok kanan atas untuk memperbarui nama tampilan, email notifikasi, avatar foto, dan mengganti password pribadi.</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <StepBadge step={4} />
              <div><strong>Tingkatan Peran (Role):</strong> Sistem membagi peran menjadi <em>ADMIN</em> (kelola penuh), <em>MEMBER</em> (tambah, edit, dan kelola tugas), serta <em>VIEWER</em> (khusus monitoring).</div>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(139,92,246,0.05), rgba(59,130,246,0.05))">
            <MiniCard icon={<Lock size={18} />} label="Input NPK" color="#8b5cf6" />
            <FlowArrow />
            <MiniCard icon={<KeyRound size={18} />} label="Verifikasi Sesi" color="#3b82f6" />
            <FlowArrow />
            <MiniCard icon={<UserCheck size={18} />} label="Dashboard" color="#10b981" />
          </FeatureVisual>
          <TipBox>
            <strong>Tips:</strong> Jika akun Anda berstatus <em>PENDING</em>, hubungi Administrator untuk aktivasi akun dan penetapan role.
          </TipBox>
        </>
      )
    },
    {
      id: 'dashboard',
      shortTitle: 'Dashboard KPI',
      icon: <LayoutDashboard size={20} />,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      title: '2. Dashboard & Analitik Kinerja',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', fontSize: '13px' }}>
            Dashboard adalah <strong>pusat visualisasi dan metrik kinerja</strong> yang menyajikan ringkasan progres secara real-time:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Kartu KPI Utama:</strong> Menampilkan total pekerjaan aktif, pekerjaan selesai (Done), pekerjaan tertunda, dan perbandingan persentase performa terhadap periode sebelumnya.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Filter Universal:</strong> Menyaring data secara instan berdasarkan rentang tanggal, PIC, kategori, status, dan tingkat prioritas.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Grafik Tren & Distribusi:</strong> Visualisasi grafik penyelesaian bulanan dan pembagian beban kerja per PIC dalam bentuk diagram interaktif.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Tabel Pekerjaan Terkini:</strong> Daftar cepat tugas prioritas dengan status progress, tenggat waktu, dan aksi sekali klik untuk melihat detail.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(59,130,246,0.05), rgba(16,185,129,0.05))" interactiveMockup={<InteractiveChartMockup />}>
            <MiniCard icon={<BarChart3 size={18} />} label="Grafik Tren" color="#3b82f6" />
            <MiniCard icon={<Filter size={18} />} label="Filter Data" color="#8b5cf6" />
            <MiniCard icon={<Eye size={18} />} label="Modal Detail" color="#10b981" />
            <MiniCard icon={<Search size={18} />} label="Pencarian" color="#f59e0b" />
          </FeatureVisual>
        </>
      )
    },
    {
      id: 'monitoring-board',
      shortTitle: 'Kanban Board',
      icon: <Kanban size={20} />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      title: '3. Monitoring Board (Kanban)',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', fontSize: '13px' }}>
            Papan <strong>Kanban visual</strong> sangat efektif digunakan untuk rapat koordinasi rutin dan melacak tahapan eksekusi:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Drag & Drop Cepat:</strong> Pindahkan kartu pekerjaan antar kolom status (To Do, In Progress, Review, Done) secara lancar melalui gesture geser.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Informasi Lengkap pada Kartu:</strong> Setiap kartu menampilkan lencana prioritas berwarna, foto PIC utama, badge jumlah PIC tambahan, checklist subtask, dan batas tenggat.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Opsi Pengurutan Kolom:</strong> Atur urutan kartu di setiap kolom berdasarkan Tenggat Terdekat, Prioritas Tertinggi, atau Pembaruan Terbaru.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(245,158,11,0.05), rgba(239,68,68,0.05))" interactiveMockup={<InteractiveKanbanMockup />}>
            <MiniCard icon={<ListTodo size={18} />} label="To Do" color="#6b7280" />
            <FlowArrow />
            <MiniCard icon={<Clock size={18} />} label="In Progress" color="#f59e0b" />
            <FlowArrow />
            <MiniCard icon={<CheckCircle2 size={18} />} label="Done" color="#10b981" />
          </FeatureVisual>
          <TipBox>
            <strong>Tips:</strong> Memindahkan kartu ke kolom &quot;Done&quot; otomatis mengubah progress pekerjaan menjadi 100% dan mencatat riwayat log penyelesaian.
          </TipBox>
        </>
      )
    },
    {
      id: 'daftar-pekerjaan',
      shortTitle: 'Daftar Pekerjaan',
      icon: <ListTodo size={20} />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      title: '4. Daftar Pekerjaan & Sub-Tugas',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', fontSize: '13px' }}>
            Halaman <strong>Daftar Pekerjaan</strong> menyediakan tabel komprehensif untuk manajemen tugas harian, checklist sub-tugas, dan log audit:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Sub-Tugas (Checklist Bertingkat):</strong> Pecah pekerjaan besar menjadi sub-pekerjaan spesifik. Setiap sub-tugas memiliki PIC mandiri dan tanggal tenggat waktu tersendiri.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Multi-PIC & Tag Selector:</strong> Tetapkan 1 PIC Utama beserta banyak PIC Tambahan dengan chip tag yang rapi dan terhubung ke Master Data.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Multi-File Attachments:</strong> Unggah banyak dokumen eviden (PDF, Excel, Word, Gambar) ke satu pekerjaan dengan pratinjau file interaktif.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Duplikasi 1-ke-1:</strong> Tombol duplikasi menyalin seluruh data pekerjaan (termasuk sub-tugas dan PIC) untuk mempercepat pembuatan tugas berulang.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Edit Massal (Bulk Actions):</strong> Centang beberapa baris untuk mengubah PIC, Kategori, Prioritas, atau Status secara serentak.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))">
            <MiniCard icon={<FileText size={18} />} label="Detail Tugas" color="#10b981" />
            <MiniCard icon={<MousePointerClick size={18} />} label="Edit Massal" color="#3b82f6" />
            <MiniCard icon={<Copy size={18} />} label="Duplikasi" color="#f59e0b" />
            <MiniCard icon={<Bell size={18} />} label="Email Reminder" color="#ef4444" />
          </FeatureVisual>
        </>
      )
    },
    {
      id: 'smart-add',
      shortTitle: 'Smart Add (AI)',
      icon: <Zap size={20} />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      title: '5. Tambah Cepat (Smart Add / AI Parser)',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', fontSize: '13px' }}>
            Fitur <strong>Smart Add / AI Parser</strong> memungkinkan pembuatan banyak tugas sekaligus hanya dengan menyalin teks agenda, memo, atau notula rapat bebas:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <StepBadge step={1} />
              <div><strong>Salin & Tempel Teks:</strong> Tempel teks agenda dari WhatsApp, email, atau dokumen (memuat Judul, Hari/Tanggal, Waktu, Tempat/Zoom, PIC, Kategori).</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <StepBadge step={2} />
              <div><strong>Ekstraksi Cerdas Otomatis:</strong> Parser otomatis mendeteksi Tanggal Mulai/Selesai, Jam Kerja, PIC Utama, PIC Tambahan, Master Lokasi, Kategori, dan Prioritas.</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <StepBadge step={3} />
              <div><strong>Tinjau & Edit Cepat:</strong> Setiap pekerjaan ditampilkan dalam kartu yang dapat diedit langsung. Tersedia <em>Dropdown PIC Tambahan</em> dengan sistem tag chip dan <em>Dropdown Master Lokasi</em>.</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <StepBadge step={4} />
              <div><strong>Aksi Massal & Simpan:</strong> Terapkan PIC atau Kategori ke seluruh baris yang diekstrak dengan 1 klik, lalu simpan semua ke database.</div>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(245,158,11,0.05), rgba(139,92,246,0.05))">
            <MiniCard icon={<FileText size={18} />} label="Paste Teks" color="#f59e0b" />
            <FlowArrow />
            <MiniCard icon={<Sparkles size={18} />} label="AI Parser" color="#8b5cf6" />
            <FlowArrow />
            <MiniCard icon={<Database size={18} />} label="Simpan Sekaligus" color="#10b981" />
          </FeatureVisual>
          <TipBox>
            <strong>Tips:</strong> Manfaatkan tombol <em>Contoh Template Cepat</em> di dalam modal Smart Add untuk melihat contoh format teks yang optimal.
          </TipBox>
        </>
      )
    },
    {
      id: 'excel-import-export',
      shortTitle: 'Rich Excel',
      icon: <FileSpreadsheet size={20} />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      title: '6. Template Excel & Impor/Ekspor Data',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', fontSize: '13px' }}>
            Aplikasi mendukung integrasi penuh dengan Microsoft Excel melalui format <strong>Rich Excel</strong> yang terhubung langsung ke Master Data:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Unduh Template Excel Interaktif:</strong> Template Excel yang diunduh sudah dilengkapi <em>Dropdown Data Validation</em> otomatis untuk PIC Utama, Kategori, Prioritas, Status, dan Master Lokasi.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Dukungan Sub-Pekerjaan & Multi-PIC:</strong> Tulis sub-tugas dengan format <code>[Status] Nama Sub | PIC: Nama | Tenggat: YYYY-MM-DD</code> di dalam satu sel Excel.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Pratinjau Impor Interaktif:</strong> Sebelum data Excel masuk ke database, modal pratinjau menampilkan tabel validasi baris lengkap dengan dropdown untuk mengubah lokasi atau menghapus baris keliru.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Ekspor Excel Berwarna:</strong> Ekspor data pekerjaan aktif ke Excel berformat rapi dengan pewarnaan sel dinamis sesuai status dan prioritas.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))">
            <MiniCard icon={<Download size={18} />} label="Unduh Template" color="#10b981" />
            <MiniCard icon={<FileSpreadsheet size={18} />} label="Dropdown Validasi" color="#3b82f6" />
            <MiniCard icon={<Upload size={18} />} label="Pratinjau Impor" color="#f59e0b" />
          </FeatureVisual>
        </>
      )
    },
    {
      id: 'kalender',
      shortTitle: 'Kalender & Sync',
      icon: <CalendarDays size={20} />,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      title: '7. Kalender & Integrasi Jadwal',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', fontSize: '13px' }}>
            Pantau seluruh jadwal pekerjaan dalam tampilan <strong>kalender multi-mode</strong> yang fleksibel dan terintegrasi:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Tampilan Multi-Mode:</strong> Pilih mode tampilan Kalender Bulan, Minggu, Hari, atau format List Agenda sesuai preferensi.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Hari Libur Nasional Indonesia:</strong> Kalender secara otomatis mendeteksi dan menandai hari libur nasional serta cuti bersama.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Google Calendar & ICS Sync:</strong> Sinkronkan jadwal pekerjaan langsung ke Google Calendar atau unduh file <code>.ics</code> untuk Outlook / Apple Calendar.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(6,182,212,0.05), rgba(139,92,246,0.05))">
            <MiniCard icon={<CalendarDays size={18} />} label="Mode Bulan" color="#06b6d4" />
            <MiniCard icon={<Clock size={18} />} label="Mode Jam/Hari" color="#8b5cf6" />
            <MiniCard icon={<Globe size={18} />} label="Libur Nasional" color="#ef4444" />
          </FeatureVisual>
        </>
      )
    },
    {
      id: 'tim',
      shortTitle: 'Tim & Beban',
      icon: <Users size={20} />,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.1)',
      title: '8. Manajemen Tim & Analisis Beban Kerja',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', fontSize: '13px' }}>
            Halaman <strong>Tim</strong> menyajikan metrik beban kerja komprehensif per PIC untuk memastikan distribusi pekerjaan yang adil dan terukur:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Kartu Statistik PIC:</strong> Pantau jumlah tugas aktif, tugas urgent, tingkat penyelesaian (Done rate), dan rata-rata waktu penyelesaian tugas per individu.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Kalkulasi Multi-PIC:</strong> Sistem secara cerdas menghitung kontribusi tugas baik saat PIC menjadi penanggung jawab utama maupun PIC tambahan.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Quick Drawer / Filter Tugas:</strong> Klik kartu PIC untuk memunculkan panel pekerjaan yang sedang dipegang beserta status rincinya.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(236,72,153,0.05), rgba(245,158,11,0.05))">
            <MiniCard icon={<Users size={18} />} label="Daftar PIC" color="#ec4899" />
            <MiniCard icon={<BarChart3 size={18} />} label="Beban Kerja" color="#f59e0b" />
            <MiniCard icon={<Shield size={18} />} label="Matriks Peran" color="#3b82f6" />
          </FeatureVisual>
        </>
      )
    },
    {
      id: 'settings',
      shortTitle: 'Master & Hak Akses',
      icon: <Settings size={20} />,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      title: '9. Pengaturan Master Data, Hak Akses & Backup',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', fontSize: '13px' }}>
            Menu <strong>Pengaturan</strong> memberikan kontrol penuh bagi Administrator untuk menyesuaikan alur kerja, keamanan, dan cadangan data:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Master Data Terpusat:</strong> Kelola daftar Master PIC, Kategori, Prioritas, Status, dan Master Lokasi (Online Zoom & Offline Ruang Rapat). Seluruh form dan template Excel tersinkronisasi 100% ke data ini.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Matriks Hak Akses (Role Permissions):</strong> Atur izin detail (tambah tugas, edit status, hapus, unggah eviden, ekspor data) untuk setiap role (Admin, Member, Viewer).</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Personalisasi Branding & Warna:</strong> Ganti nama aplikasi, sub-judul departemen, logo, serta warna label status secara fleksibel.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Cadangan & Pemulihan (1-Click Backup / Restore):</strong> Unduh file cadangan lengkap (.zip) yang mencakup seluruh database dan file lampiran. Pulihkan kapan saja dengan 1 klik.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(239,68,68,0.05), rgba(139,92,246,0.05))">
            <MiniCard icon={<Palette size={18} />} label="Warna & Tema" color="#ef4444" />
            <MiniCard icon={<MapPin size={18} />} label="Master Lokasi" color="#3b82f6" />
            <MiniCard icon={<Database size={18} />} label="Backup ZIP" color="#10b981" />
            <MiniCard icon={<Sliders size={18} />} label="Hak Akses" color="#8b5cf6" />
          </FeatureVisual>
          <TipBox>
            <strong>Tips:</strong> Lakukan backup ZIP secara berkala dan simpan di media penyimpanan aman untuk menjamin kelangsungan data pekerjaan.
          </TipBox>
        </>
      )
    },
  ];

  const filteredSections = sections.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.shortTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrintPDF = () => {
    window.print();
  };

  const isAllOpen = Object.values(openAccordions).every(Boolean);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          #web-area, header, nav, aside, .sidebar, .header-actions-container, .mobile-header, .focus-mode-toggle { display: none !important; }
          @page { margin: 12mm 15mm; size: A4 portrait; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          #print-area { display: block !important; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; }
          .print-cover { height: 95vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; }
          .print-title { font-size: 30px; font-weight: bold; color: #1e3a8a; margin-bottom: 14px; line-height: 1.3; }
          .print-subtitle { font-size: 15px; color: #4b5563; margin-bottom: 30px; }
          .print-toc { page-break-after: always; padding: 30px 0; }
          .print-toc h2 { font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 20px; color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; }
          .print-toc-item { font-size: 14px; margin-bottom: 8px; border-bottom: 1px dotted #d1d5db; padding-bottom: 5px; color: #374151; display: flex; justify-content: space-between; }
          .print-section { page-break-inside: avoid; margin-bottom: 24px; padding: 18px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fafafa; }
          .print-section h2 { font-size: 18px; color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 6px; margin-bottom: 12px; margin-top: 0; }
          .print-section p { font-size: 12.5px; line-height: 1.6; color: #374151; margin-bottom: 10px; }
          .print-section ul { padding-left: 18px; margin-top: 6px; margin-bottom: 6px; }
          .print-section li { font-size: 12.5px; line-height: 1.5; margin-bottom: 6px; color: #374151; }
          .print-footer { text-align: center; font-size: 10.5px; color: #9ca3af; margin-top: 14px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
        }
        @media screen { #print-area { display: none !important; } }
      `}} />

      {/* ================== WEB AREA ================== */}
      <div 
        id="web-area"
        ref={contentRef}
        style={{ maxWidth: '1080px', margin: '0 auto' }}
      >
        {/* Top Header Card */}
        <div 
          className="glass"
          style={{
            padding: '24px 28px',
            borderRadius: '16px',
            marginBottom: '20px',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)'
            }}>
              <BookOpen size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Dokumentasi Resmi
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>• 9 Modul Panduan</span>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Panduan Aplikasi Monitoring Pekerjaan
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Panduan praktis seluruh alur kerja, Smart Add AI, Rich Excel, Kanban, kalender, dan hak akses.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={handleToggleAll}
              className="btn btn-secondary glass"
              style={{ padding: '8px 14px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
            >
              <ChevronsUpDown size={15} />
              {isAllOpen ? 'Tutup Semua' : 'Buka Semua'}
            </button>
            <button 
              onClick={handlePrintPDF}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            >
              <Printer size={15} />
              Unduh PDF (A4)
            </button>
          </div>
        </div>

        {/* Search & Topic Quick Grid */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            position: 'relative',
            marginBottom: '12px'
          }}>
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik atau modul panduan (contoh: Smart Add, Excel, PIC, Kalender, Backup)..."
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '14px',
                height: '42px',
                fontSize: '13px',
                borderRadius: '12px',
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)'
              }}
            />
          </div>

          {/* Quick Navigator Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
            gap: '8px'
          }}>
            {sections.map((s, idx) => {
              const isOpen = openAccordions[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setOpenAccordions(prev => ({ ...prev, [s.id]: true }));
                    setTimeout(() => {
                      const el = document.getElementById(`section-${s.id}`);
                      if (el) {
                        const y = el.getBoundingClientRect().top + window.scrollY - 80; // offset untuk header
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                    }, 280); // tunggu animasi expand selesai
                  }}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: isOpen ? `1.5px solid ${s.color}` : '1px solid var(--border-color)',
                    background: isOpen ? s.bg : 'var(--surface-color)',
                    color: isOpen ? s.color : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? `0 2px 8px ${s.color}25` : 'none'
                  }}
                >
                  <div style={{ color: s.color, display: 'flex' }}>
                    {React.cloneElement(s.icon as React.ReactElement<any>, { size: 16 })}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {idx + 1}. {s.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Accordions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredSections.map((section) => {
            const isOpen = openAccordions[section.id];
            return (
              <div 
                key={section.id} 
                id={`section-${section.id}`}
                className="glass" 
                style={{ 
                  borderRadius: '14px', 
                  overflow: 'hidden', 
                  background: 'var(--surface-color)', 
                  border: isOpen ? `1px solid ${section.color}50` : '1px solid var(--border-color)', 
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: isOpen ? '0 4px 16px -4px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <button
                  onClick={() => toggleAccordion(section.id)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isOpen ? section.bg : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ 
                      padding: '8px', 
                      background: isOpen ? 'var(--surface-color)' : section.bg, 
                      borderRadius: '10px', 
                      color: section.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${section.color}30`
                    }}>
                      {section.icon}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChevronDown size={18} color="var(--text-secondary)" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '16px 20px 20px 20px', borderTop: '1px solid var(--border-color)' }}>
                        {section.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        
        {/* Support Alert Box */}
        <div style={{ marginTop: '24px', padding: '18px 20px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>Pusat Bantuan & Kendala Teknis</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', lineHeight: 1.5, margin: 0 }}>
              Jika Anda mengalami kendala operasional, gunakan tombol <strong>Bantuan & Support</strong> di pojok kanan bawah atau hubungi Administrator sistem untuk bantuan lebih lanjut.
            </p>
          </div>
        </div>
      </div>

      {/* ================== PRINT AREA (PDF EXPORT) ================== */}
      <div id="print-area">
        <div className="print-cover">
          <div style={{ fontSize: '50px', marginBottom: '14px' }}>📖</div>
          <h1 className="print-title">Buku Panduan Penggunaan Lengkap<br/>Aplikasi Monitoring Pekerjaan</h1>
          <p className="print-subtitle">Dokumentasi Standar Operasional — Pembaruan {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div style={{ marginTop: '36px', color: '#6b7280', fontSize: '12.5px', maxWidth: '440px', lineHeight: 1.6 }}>
            Buku panduan ini merangkum seluruh fitur, modul Kanban, checklist sub-tugas, AI Parser Smart Add, integrasi Rich Excel, kalender, manajemen tim, dan administrasi hak akses.
          </div>
        </div>

        <div className="print-toc">
          <h2>Daftar Isi Panduan</h2>
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            {sections.map(sec => (
              <div key={sec.id} className="print-toc-item">
                <span>{sec.title}</span>
                <span style={{ color: '#9ca3af' }}>Halaman {sections.indexOf(sec) + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {sections.map(sec => (
          <div key={sec.id} className="print-section">
            <h2>{sec.title}</h2>
            {sec.id === 'auth' && (
              <>
                <p>Aplikasi menggunakan sistem autentikasi berbasis NPK (Nomor Pokok Karyawan) dengan Role-Based Access Control (Admin, Member, Viewer).</p>
                <ul>
                  <li><strong>Login Sistem:</strong> Masukkan NPK dan kata sandi yang telah didaftarkan oleh Administrator.</li>
                  <li><strong>Lupa Password:</strong> Kirim permintaan reset password secara langsung ke panel Admin melalui tautan di halaman login.</li>
                  <li><strong>Profil & Keamanan:</strong> Ubah nama, email notifikasi, avatar, dan kata sandi pribadi dari menu profil pengguna.</li>
                </ul>
              </>
            )}
            {sec.id === 'dashboard' && (
              <>
                <p>Dashboard menyajikan ringkasan kinerja, kartu KPI, dan analisis grafik distribusi tugas secara real-time.</p>
                <ul>
                  <li><strong>Kartu KPI:</strong> Total tugas, penyelesaian (Done), tugas tertunda, dan tren performa bulanan.</li>
                  <li><strong>Filter Universal:</strong> Filter data dinamis berdasarkan rentang tanggal, PIC, kategori, status, dan prioritas.</li>
                  <li><strong>Grafik Tren & Distribusi:</strong> Visualisasi beban kerja per PIC dan tren penyelesaian pekerjaan.</li>
                </ul>
              </>
            )}
            {sec.id === 'monitoring-board' && (
              <>
                <p>Papan Kanban interaktif untuk pemantauan alur kerja, koordinasi tim, dan pembagian tugas harian.</p>
                <ul>
                  <li><strong>Drag & Drop:</strong> Geser kartu antar kolom status (To Do, In Progress, Review, Done).</li>
                  <li><strong>Informasi Kartu:</strong> Menampilkan prioritas, avatar PIC, jumlah PIC tambahan, dan progress checklist.</li>
                  <li><strong>Pengurutan:</strong> Urutkan kartu per kolom berdasarkan tenggat terdekat, prioritas, atau waktu pembaruan.</li>
                </ul>
              </>
            )}
            {sec.id === 'daftar-pekerjaan' && (
              <>
                <p>Tabel detail untuk pengelolaan tugas secara menyeluruh, checklist sub-pekerjaan, dan audit log.</p>
                <ul>
                  <li><strong>Sub-Tugas (Checklist):</strong> Pemecahan pekerjaan menjadi sub-tugas dengan PIC dan tenggat mandiri.</li>
                  <li><strong>Multi-PIC & Tag:</strong> Penugasan ke 1 PIC Utama beserta beberapa PIC Tambahan berbasis tag chip.</li>
                  <li><strong>Multi-File Eviden:</strong> Lampirkan banyak file dokumen eviden dengan viewer pratinjau file.</li>
                  <li><strong>Duplikasi 1-ke-1 & Bulk Action:</strong> Duplikasi lengkap tugas dan edit massal beberapa baris sekaligus.</li>
                </ul>
              </>
            )}
            {sec.id === 'smart-add' && (
              <>
                <p>Modul cerdas Smart Add (AI Parser) untuk mengekstrak teks agenda atau notula rapat menjadi tugas terstruktur.</p>
                <ul>
                  <li><strong>Ekstraksi Otomatis:</strong> Mendeteksi tanggal, waktu kerja, PIC utama, PIC tambahan, master lokasi, kategori, dan prioritas.</li>
                  <li><strong>Dropdown PIC Tambahan:</strong> Pemilihan PIC tambahan dengan sistem chip tag yang terhubung ke Master PIC.</li>
                  <li><strong>Integrasi Master Lokasi:</strong> Pemilihan lokasi online (Link Zoom/Meet) atau offline (Ruang Rapat) secara otomatis.</li>
                  <li><strong>Aksi Massal:</strong> Terapkan PIC atau Kategori ke seluruh hasil ekstraksi sebelum disimpan ke database.</li>
                </ul>
              </>
            )}
            {sec.id === 'excel-import-export' && (
              <>
                <p>Integrasi format Rich Excel dua arah dengan validasi data master dan pratinjau interaktif.</p>
                <ul>
                  <li><strong>Template Excel dengan Dropdown:</strong> Dropdown otomatis untuk PIC, Kategori, Prioritas, Status, dan Lokasi.</li>
                  <li><strong>Format Sub-Pekerjaan:</strong> Mendukung penulisan sub-tugas dan PIC multi-baris di dalam satu sel Excel.</li>
                  <li><strong>Modal Pratinjau Impor:</strong> Verifikasi data, koreksi lokasi dengan dropdown, dan hapus baris keliru sebelum disimpan.</li>
                  <li><strong>Ekspor Excel Berwarna:</strong> Ekspor tabel lengkap dengan styling warna sel sesuai status dan prioritas.</li>
                </ul>
              </>
            )}
            {sec.id === 'kalender' && (
              <>
                <p>Visualisasi jadwal kerja dalam tampilan kalender multi-mode terintegrasi.</p>
                <ul>
                  <li><strong>Multi-Mode:</strong> Tampilan kalender Bulan, Minggu, Hari, dan Agenda.</li>
                  <li><strong>Libur Nasional:</strong> Penandaan otomatis hari libur nasional Indonesia.</li>
                  <li><strong>Sinkronisasi Kalender:</strong> Integrasi langsung ke Google Calendar atau unduhan file .ics.</li>
                </ul>
              </>
            )}
            {sec.id === 'tim' && (
              <>
                <p>Analisis distribusi beban kerja per PIC untuk memastikan alokasi sumber daya yang seimbang.</p>
                <ul>
                  <li><strong>Statistik PIC:</strong> Total tugas, tugas urgent, dan rasio penyelesaian per anggota tim.</li>
                  <li><strong>Kalkulasi Multi-PIC:</strong> Memperhitungkan peran PIC Utama dan PIC Tambahan secara proporsional.</li>
                  <li><strong>Quick View:</strong> Akses cepat daftar pekerjaan aktif yang ditangani masing-masing individu.</li>
                </ul>
              </>
            )}
            {sec.id === 'settings' && (
              <>
                <p>Pengaturan master data, personalisasi aplikasi, konfigurasi hak akses, dan manajemen cadangan.</p>
                <ul>
                  <li><strong>Master Data:</strong> Kelola opsi Master PIC, Kategori, Prioritas, Status, dan Master Lokasi (Online/Offline).</li>
                  <li><strong>Matriks Hak Akses:</strong> Pengaturan izin spesifik per peran (Admin, Member, Viewer).</li>
                  <li><strong>Cadangan ZIP (1-Click):</strong> Backup dan pemulihan database beserta seluruh file lampiran.</li>
                </ul>
              </>
            )}
            <div className="print-footer">
              Buku Panduan Aplikasi Monitoring Pekerjaan — Halaman {sections.indexOf(sec) + 1} dari {sections.length}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
