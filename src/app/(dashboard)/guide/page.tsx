'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, LayoutDashboard, ListTodo, FileText, CheckCircle2, ArrowRight, Zap, Users, Shield } from 'lucide-react';

export default function GuidePage() {
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
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>Panduan Aplikasi</h1>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Pelajari cara menggunakan DeptMonitor untuk memaksimalkan produktivitas tim Anda, melacak pekerjaan, dan menganalisis performa.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Section 1: Dashboard */}
        <div className="glass" style={{ display: 'flex', flexWrap: 'wrap', overflow: 'hidden', borderRadius: '16px' }}>
          <div style={{ flex: '1 1 400px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6' }}>
                <LayoutDashboard size={24} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>1. Dashboard Executive</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Dashboard adalah pusat kendali Anda. Di sini Anda dapat melihat ringkasan seluruh metrik penting secara real-time.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}><strong>Filter Global:</strong> Gunakan dropdown Kategori, PIC, dan Waktu di bagian atas untuk memfilter data pada seluruh grafik secara bersamaan.</span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}><strong>Klik Grafik:</strong> Anda dapat mengklik elemen pada grafik (misal: bagian "To Do" pada chart donat) untuk langsung diarahkan ke detail pekerjaan yang bersangkutan.</span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}><strong>Export Laporan:</strong> Tombol Export PDF dan Excel memungkinkan Anda mengunduh ringkasan data yang sedang difilter.</span>
              </li>
            </ul>
          </div>
          <div style={{ flex: '1 1 300px', background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(139,92,246,0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', borderLeft: '1px solid var(--border-color)' }}>
            <div style={{ width: '200px', height: '200px', borderRadius: '50%', border: '24px solid rgba(59, 130, 246, 0.2)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-24px', left: '-24px', width: '200px', height: '200px', borderRadius: '50%', border: '24px solid transparent', borderTopColor: '#3b82f6', borderRightColor: '#3b82f6', transform: 'rotate(45deg)' }}></div>
              <div style={{ position: 'absolute', top: '-24px', left: '-24px', width: '200px', height: '200px', borderRadius: '50%', border: '24px solid transparent', borderBottomColor: '#10b981', transform: 'rotate(15deg)' }}></div>
            </div>
          </div>
        </div>

        {/* Section 2: Manajemen Tugas */}
        <div className="glass" style={{ display: 'flex', flexWrap: 'wrap-reverse', overflow: 'hidden', borderRadius: '16px' }}>
          <div style={{ flex: '1 1 300px', background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(59,130,246,0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '70%' }}>
              <div style={{ height: '40px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', width: '100%' }}></div>
              <div style={{ height: '40px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '8px', width: '80%' }}></div>
              <div style={{ height: '40px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '8px', width: '90%' }}></div>
            </div>
          </div>
          <div style={{ flex: '1 1 400px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10b981' }}>
                <ListTodo size={24} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>2. Daftar Pekerjaan</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Menu ini digunakan untuk membuat, mengedit, dan melacak detail tugas operasional maupun proyek.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}><strong>Pekerjaan Berulang:</strong> Anda dapat mengatur Repetisi (Harian, Mingguan, Bulanan) agar sistem membuat tugas baru otomatis.</span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}><strong>Multi-PIC:</strong> Tambahkan PIC Utama, dan jika butuh rekan kerja lain, gunakan fitur PIC Tambahan (+).</span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}><strong>Lampiran & Riwayat:</strong> Unggah file terkait pekerjaan. Sistem juga mencatat riwayat pembaruan status dan komentar secara otomatis.</span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}><strong>Import/Export Excel:</strong> Unduh template Excel (beserta baris contoh format Sub-Pekerjaan), isi secara massal, dan impor kembali dengan satu klik.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3: Analisis Laporan */}
        <div className="glass" style={{ display: 'flex', flexWrap: 'wrap', overflow: 'hidden', borderRadius: '16px' }}>
          <div style={{ flex: '1 1 400px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '8px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '8px', color: '#ec4899' }}>
                <FileText size={24} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>3. Analisis Laporan</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Dapatkan wawasan mendalam mengenai sebaran pekerjaan dan performa. Sangat berguna untuk evaluasi akhir bulan atau KPI.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}><strong>Time-based Analytics:</strong> Evaluasi pekerjaan berdasarkan rentang waktu tertentu (Bulan Ini, Triwulan Ini, dll).</span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}><strong>Matriks Prioritas:</strong> Ketahui berapa banyak pekerjaan "Urgent" yang membebani tim Anda di rentang waktu tersebut.</span>
              </li>
            </ul>
          </div>
          <div style={{ flex: '1 1 300px', background: 'linear-gradient(135deg, rgba(236,72,153,0.05) 0%, rgba(139,92,246,0.1) 100%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minHeight: '300px', borderLeft: '1px solid var(--border-color)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '150px' }}>
              <div style={{ width: '40px', height: '60px', background: 'rgba(59, 130, 246, 0.6)', borderRadius: '6px 6px 0 0' }}></div>
              <div style={{ width: '40px', height: '100px', background: 'rgba(139, 92, 246, 0.6)', borderRadius: '6px 6px 0 0' }}></div>
              <div style={{ width: '40px', height: '140px', background: 'rgba(236, 72, 153, 0.6)', borderRadius: '6px 6px 0 0' }}></div>
              <div style={{ width: '40px', height: '90px', background: 'rgba(16, 185, 129, 0.6)', borderRadius: '6px 6px 0 0' }}></div>
            </div>
          </div>
        </div>

        {/* Section 4: Keamanan & Pengaturan */}
        <div className="glass" style={{ display: 'flex', flexWrap: 'wrap-reverse', overflow: 'hidden', borderRadius: '16px' }}>
          <div style={{ flex: '1 1 300px', background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(239,68,68,0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', borderRight: '1px solid var(--border-color)' }}>
            <Shield size={100} color="rgba(239, 68, 68, 0.4)" />
          </div>
          <div style={{ flex: '1 1 400px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444' }}>
                <Shield size={24} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>4. Keamanan & Pengaturan</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Fitur perlindungan sesi dan personalisasi dasbor sesuai struktur organisasi Anda.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}><strong>Auto-Logout Inaktivitas:</strong> Untuk alasan keamanan, sistem akan logout otomatis jika Anda tidak berinteraksi dengan mouse/keyboard selama 10 menit berturut-turut.</span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}><strong>Personalisasi Dinamis:</strong> Ubah nama departemen di halaman Pengaturan, dan Sidebar akan langsung ter-update secara real-time.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
