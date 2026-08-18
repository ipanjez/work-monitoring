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
  FileSpreadsheet, MapPin, Tag, Copy, Sparkles, Sliders
} from 'lucide-react';

const FeatureVisual = ({ children, gradient, interactiveMockup }: { children: React.ReactNode; gradient: string; interactiveMockup?: React.ReactNode }) => (
  <div style={{
    marginTop: '20px',
    padding: '24px',
    borderRadius: '16px',
    background: gradient,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    border: '1px solid var(--border-color)',
    alignItems: 'center'
  }}>
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%'
    }}>
      {children}
    </div>
    {interactiveMockup && (
      <div style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-color)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        {interactiveMockup}
      </div>
    )}
  </div>
);

const InteractiveKanbanMockup = () => {
  return (
    <div style={{ display: 'flex', gap: '10px', height: '180px' }}>
      {/* Column 1 */}
      <div style={{ flex: 1, background: 'var(--surface-color)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>To Do</div>
        <motion.div 
          style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', height: '60px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
          animate={{ x: [0, 0, 160, 160, 320, 320, 0], y: [0, 0, 0, 0, 0, 0, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div style={{ width: '40%', height: '6px', background: '#3b82f6', borderRadius: '3px', marginBottom: '8px' }} />
          <div style={{ width: '80%', height: '4px', background: 'var(--border-color)', borderRadius: '2px', marginBottom: '4px' }} />
          <div style={{ width: '60%', height: '4px', background: 'var(--border-color)', borderRadius: '2px' }} />
        </motion.div>
      </div>
      {/* Column 2 */}
      <div style={{ flex: 1, background: 'var(--surface-color)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>In Progress</div>
      </div>
      {/* Column 3 */}
      <div style={{ flex: 1, background: 'var(--surface-color)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Done</div>
      </div>
    </div>
  );
};

const InteractiveChartMockup = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '140px', padding: '20px 10px 0 10px' }}>
      {[40, 70, 45, 90, 60].map((h, i) => (
        <motion.div
          key={i}
          style={{ width: '15%', background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '4px 4px 0 0' }}
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
            Aplikasi menggunakan sistem autentikasi berbasis <strong>NPK (Nomor Pokok Karyawan)</strong> yang aman dan terintegrasi dengan sistem peran (*Role-Based Access Control*):
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <StepBadge step={1} />
              <div><strong>Halaman Login:</strong> Masukkan NPK dan Password yang telah didaftarkan oleh Administrator, lalu klik <em>Masuk</em>.</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <StepBadge step={2} />
              <div><strong>Lupa Password:</strong> Klik tautan <em>Lupa Password?</em> pada layar login. Masukkan NPK Anda untuk mengirim permintaan reset langsung ke panel Administrator.</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <StepBadge step={3} />
              <div><strong>Profil & Keamanan:</strong> Klik foto profil/nama di pojok kanan atas untuk memperbarui nama tampilan, email notifikasi, avatar foto, dan mengganti password pribadi.</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <StepBadge step={4} />
              <div><strong>Tingkatan Peran (Role):</strong> Sistem membagi peran menjadi <em>ADMIN</em> (kelola penuh), <em>MEMBER</em> (tambah, edit, dan kelola tugas), serta <em>VIEWER</em> (khusus monitoring).</div>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(139,92,246,0.05), rgba(59,130,246,0.05))">
            <MiniCard icon={<Lock size={20} />} label="Input NPK" color="#8b5cf6" />
            <FlowArrow />
            <MiniCard icon={<KeyRound size={20} />} label="Verifikasi Sesi" color="#3b82f6" />
            <FlowArrow />
            <MiniCard icon={<UserCheck size={20} />} label="Akses Dashboard" color="#10b981" />
          </FeatureVisual>
          <TipBox>
            <strong>Tips:</strong> Jika akun berstatus <em>PENDING</em>, hubungi Administrator untuk aktivasi akun dan penetapan role.
          </TipBox>
        </>
      )
    },
    {
      id: 'dashboard',
      icon: <LayoutDashboard size={24} />,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      title: '2. Dashboard & Analitik Kinerja',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Dashboard adalah <strong>pusat visualisasi dan metrik kinerja</strong> yang menyajikan ringkasan progres secara real-time:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Kartu KPI Utama:</strong> Menampilkan total pekerjaan aktif, pekerjaan selesai (Done), pekerjaan tertunda, dan perbandingan persentase performa terhadap periode sebelumnya.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Filter Universal:</strong> Menyaring data secara instan berdasarkan rentang tanggal, PIC, kategori, status, dan tingkat prioritas.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Grafik Tren & Distribusi Beban:</strong> Visualisasi grafik penyelesaian bulanan dan pembagian beban kerja per PIC dalam bentuk diagram interaktif.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Tabel Pekerjaan Terkini:</strong> Daftar cepat tugas prioritas dengan status progress, tenggat waktu, dan aksi sekali klik untuk melihat detail.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(59,130,246,0.05), rgba(16,185,129,0.05))" interactiveMockup={<InteractiveChartMockup />}>
            <MiniCard icon={<BarChart3 size={20} />} label="Grafik Tren" color="#3b82f6" />
            <MiniCard icon={<Filter size={20} />} label="Filter Universal" color="#8b5cf6" />
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
            Papan <strong>Kanban visual</strong> sangat efektif digunakan untuk rapat koordinasi rutin dan melacak tahapan eksekusi:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Drag & Drop Cepat:</strong> Pindahkan kartu pekerjaan antar kolom status (To Do, In Progress, Review, Done) secara lancar melalui gesture geser.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Informasi Lengkap pada Kartu:</strong> Setiap kartu menampilkan lencana prioritas berwarna, foto PIC utama, jumlah PIC tambahan, indikator subtask, dan batas tenggat waktu.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Opsi Pengurutan Kolom:</strong> Atur urutan kartu di setiap kolom berdasarkan Tenggat Terdekat, Prioritas Tertinggi, atau Pembaruan Terbaru.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(245,158,11,0.05), rgba(239,68,68,0.05))" interactiveMockup={<InteractiveKanbanMockup />}>
            <MiniCard icon={<ListTodo size={20} />} label="To Do" color="#6b7280" />
            <FlowArrow />
            <MiniCard icon={<Clock size={20} />} label="In Progress" color="#f59e0b" />
            <FlowArrow />
            <MiniCard icon={<CheckCircle2 size={20} />} label="Done" color="#10b981" />
          </FeatureVisual>
          <TipBox>
            <strong>Tips:</strong> Memindahkan kartu ke kolom &quot;Done&quot; otomatis mengubah progress pekerjaan menjadi 100% dan mencatat riwayat log penyelesaian.
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
            Halaman <strong>Daftar Pekerjaan</strong> menyediakan tabel komprehensif untuk manajemen tugas harian, checklist sub-tugas, dan log audit:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Sub-Tugas (Checklist Bertingkat):</strong> Bagi pekerjaan besar menjadi sub-pekerjaan spesifik. Setiap sub-tugas dapat memiliki PIC mandiri, PIC tambahan, dan tanggal tenggat waktu tersendiri.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Multi-PIC & Tag Selector:</strong> Tetapkan 1 PIC Utama beserta beberapa PIC Tambahan dengan chip tag yang rapi dan terhubung ke Master Data.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Multi-File Attachments:</strong> Unggah banyak dokumen eviden (PDF, Excel, Word, Gambar) ke satu pekerjaan dengan pratinjau file interaktif.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Duplikasi 1-ke-1:</strong> Tombol duplikasi menyalin seluruh data pekerjaan (termasuk sub-tugas dan PIC) untuk mempercepat pembuatan tugas berulang.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Edit Massal (Bulk Actions):</strong> Pilih beberapa pekerjaan untuk mengubah PIC, Kategori, Prioritas, atau Status secara serentak.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))">
            <MiniCard icon={<FileText size={20} />} label="Detail Tugas" color="#10b981" />
            <MiniCard icon={<MousePointerClick size={20} />} label="Edit Massal" color="#3b82f6" />
            <MiniCard icon={<Copy size={20} />} label="Duplikasi" color="#f59e0b" />
            <MiniCard icon={<Bell size={20} />} label="Email Reminder" color="#ef4444" />
          </FeatureVisual>
        </>
      )
    },
    {
      id: 'smart-add',
      icon: <Zap size={24} />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      title: '5. Tambah Cepat (Smart Add / AI Parser)',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Fitur <strong>Smart Add / AI Parser</strong> memungkinkan pembuatan banyak tugas sekaligus hanya dengan menyalin teks agenda, memo, atau notula rapat bebas:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <StepBadge step={1} />
              <div><strong>Salin & Tempel Teks:</strong> Tempel teks agenda dari WhatsApp, email, atau dokumen (contoh format memuat Judul, Hari/Tanggal, Waktu, Tempat/Zoom, PIC, Kategori).</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <StepBadge step={2} />
              <div><strong>Ekstraksi Cerdas Otomatis:</strong> Parser otomatis mendeteksi Tanggal Mulai/Selesai, Jam Kerja, PIC Utama, PIC Tambahan, Master Lokasi, Kategori, dan Prioritas.</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <StepBadge step={3} />
              <div><strong>Tinjau & Edit Cepat:</strong> Setiap pekerjaan ditampilkan dalam kartu yang dapat diedit langsung. Tersedia <em>Dropdown PIC Tambahan</em> dengan sistem tag chip dan <em>Dropdown Master Lokasi</em>.</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <StepBadge step={4} />
              <div><strong>Aksi Massal & Simpan:</strong> Terapkan PIC atau Kategori ke seluruh baris yang diekstrak dengan 1 klik, lalu simpan semua ke database.</div>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(245,158,11,0.05), rgba(139,92,246,0.05))">
            <MiniCard icon={<FileText size={20} />} label="Paste Teks" color="#f59e0b" />
            <FlowArrow />
            <MiniCard icon={<Sparkles size={20} />} label="AI Parser" color="#8b5cf6" />
            <FlowArrow />
            <MiniCard icon={<Database size={20} />} label="Simpan Sekaligus" color="#10b981" />
          </FeatureVisual>
          <TipBox>
            <strong>Tips:</strong> Manfaatkan tombol <em>Contoh Template Cepat</em> di dalam modal Smart Add untuk melihat contoh format teks yang optimal.
          </TipBox>
        </>
      )
    },
    {
      id: 'excel-import-export',
      icon: <FileSpreadsheet size={24} />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      title: '6. Template Excel & Impor/Ekspor Data',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Aplikasi mendukung integrasi penuh dengan Microsoft Excel melalui format <strong>Rich Excel</strong> yang terhubung langsung ke Master Data:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Unduh Template Excel Interaktif:</strong> Template Excel yang diunduh sudah dilengkapi <em>Dropdown Data Validation</em> otomatis untuk PIC Utama, Kategori, Prioritas, Status, dan Master Lokasi.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Dukungan Sub-Pekerjaan & Multi-PIC di Excel:</strong> Anda dapat menulis sub-tugas dengan format <code>[Status] Nama Sub | PIC: Nama | Tenggat: YYYY-MM-DD</code> di dalam satu sel Excel (gunakan Alt+Enter untuk baris baru).</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Pratinjau Impor Interaktif:</strong> Sebelum data Excel masuk ke database, modal pratinjau menampilkan tabel validasi baris lengkap dengan dropdown untuk mengubah lokasi atau menghapus baris keliru.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Ekspor Excel Berwarna:</strong> Ekspor data pekerjaan aktif ke Excel berformat rapi dengan pewarnaan sel dinamis sesuai warna tema status dan prioritas.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))">
            <MiniCard icon={<Download size={20} />} label="Unduh Template" color="#10b981" />
            <MiniCard icon={<FileSpreadsheet size={20} />} label="Dropdown Validasi" color="#3b82f6" />
            <MiniCard icon={<Upload size={20} />} label="Pratinjau Impor" color="#f59e0b" />
          </FeatureVisual>
        </>
      )
    },
    {
      id: 'kalender',
      icon: <CalendarDays size={24} />,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      title: '7. Kalender & Integrasi Jadwal',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Pantau seluruh jadwal pekerjaan dalam tampilan <strong>kalender multi-mode</strong> yang fleksibel dan terintegrasi:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Tampilan Multi-Mode:</strong> Pilih mode tampilan Kalender Bulan, Minggu, Hari, atau format List Agenda sesuai preferensi.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Hari Libur Nasional Indonesia:</strong> Kalender secara otomatis mendeteksi dan menandai hari libur nasional serta cuti bersama.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Google Calendar & ICS Sync:</strong> Sinkronkan jadwal pekerjaan langsung ke Google Calendar atau unduh file <code>.ics</code> untuk Outlook / Apple Calendar.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(6,182,212,0.05), rgba(139,92,246,0.05))">
            <MiniCard icon={<CalendarDays size={20} />} label="Mode Bulan" color="#06b6d4" />
            <MiniCard icon={<Clock size={20} />} label="Mode Jam/Hari" color="#8b5cf6" />
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
      title: '8. Manajemen Tim & Analisis Beban Kerja',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Halaman <strong>Tim</strong> menyajikan metrik beban kerja komprehensif per PIC untuk memastikan distribusi pekerjaan yang adil dan terukur:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Kartu Statistik PIC:</strong> Pantau jumlah tugas aktif, tugas urgent, tingkat penyelesaian (Done rate), dan rata-rata waktu penyelesaian tugas per individu.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Kalkulasi Multi-PIC:</strong> Sistem secara cerdas menghitung kontribusi tugas baik saat PIC menjadi penanggung jawab utama maupun PIC tambahan.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Quick Drawer / Filter Tugas:</strong> Klik kartu PIC untuk memunculkan panel pekerjaan yang sedang dipegang beserta status rincinya.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(236,72,153,0.05), rgba(245,158,11,0.05))">
            <MiniCard icon={<Users size={20} />} label="Daftar PIC" color="#ec4899" />
            <MiniCard icon={<BarChart3 size={20} />} label="Beban Kerja" color="#f59e0b" />
            <MiniCard icon={<Shield size={20} />} label="Matriks Peran" color="#3b82f6" />
          </FeatureVisual>
        </>
      )
    },
    {
      id: 'settings',
      icon: <Settings size={24} />,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      title: '9. Pengaturan Master Data, Hak Akses & Backup',
      content: (
        <>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            Menu <strong>Pengaturan</strong> memberikan kontrol penuh bagi Administrator untuk menyesuaikan alur kerja, keamanan, dan cadangan data:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Master Data Terpusat:</strong> Kelola daftar Master PIC, Kategori, Prioritas, Status, dan Master Lokasi (Online Zoom & Offline Ruang Rapat). Seluruh form dan template Excel tersinkronisasi 100% ke data ini.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Matriks Hak Akses (Role Permissions):</strong> Atur izin detail (tambah tugas, edit status, hapus, unggah eviden, ekspor data) untuk setiap role (Admin, Member, Viewer).</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Personalisasi Branding & Warna:</strong> Ganti nama aplikasi, sub-judul departemen, logo, serta warna label status secara fleksibel.</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span><strong>Cadangan & Pemulihan (1-Click Backup / Restore):</strong> Unduh file cadangan lengkap (.zip) yang mencakup seluruh database dan file lampiran. Pulihkan kapan saja dengan 1 klik.</span>
            </div>
          </div>
          <FeatureVisual gradient="linear-gradient(135deg, rgba(239,68,68,0.05), rgba(139,92,246,0.05))">
            <MiniCard icon={<Palette size={20} />} label="Warna & Tema" color="#ef4444" />
            <MiniCard icon={<MapPin size={20} />} label="Master Lokasi" color="#3b82f6" />
            <MiniCard icon={<Database size={20} />} label="Backup ZIP" color="#10b981" />
            <MiniCard icon={<Sliders size={20} />} label="Hak Akses" color="#8b5cf6" />
          </FeatureVisual>
          <TipBox>
            <strong>Tips:</strong> Lakukan backup ZIP secara berkala dan simpan di media penyimpanan aman untuk menjamin kelangsungan data pekerjaan.
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
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '10px' }}>Panduan Aplikasi Monitoring Pekerjaan</h1>
          <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', marginBottom: '22px', lineHeight: 1.6 }}>
            Pelajari seluruh alur kerja, modul manajemen tugas, integrasi Excel, Smart Add AI Parser, kalender, hingga pengaturan hak akses sistem.
          </p>
          
          <button 
            onClick={handlePrintPDF}
            className="btn btn-primary"
            style={{ padding: '11px 22px', fontSize: '14.5px', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '12px', boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)' }}
          >
            <Printer size={18} />
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
                  padding: '18px 22px',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '9px', background: section.bg, borderRadius: '12px', color: section.color }}>
                    {section.icon}
                  </div>
                  <h2 style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    {section.title}
                  </h2>
                </div>
                <motion.div
                  animate={{ rotate: activeAccordion === section.id ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={20} color="var(--text-secondary)" />
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
                    <div style={{ padding: '0 22px 22px 22px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
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
            <h3 style={{ fontSize: '15.5px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '5px' }}>Pusat Bantuan & Kendala Teknis</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
              Jika Anda mengalami kendala operasional, gunakan tombol <strong>Bantuan & Support</strong> di pojok kanan bawah atau hubungi Administrator sistem untuk bantuan lebih lanjut.
            </p>
          </div>
        </div>
      </motion.div>

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
