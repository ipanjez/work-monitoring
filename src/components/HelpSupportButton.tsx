'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Sparkles, BookOpen, MessageSquare, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import 'driver.js/dist/driver.css';

export default function HelpSupportButton() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'PIC';

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
          element: '.kanban-board-wrapper',
          popover: {
            title: 'Papan Kanban',
            description: isAdmin
              ? 'Seret kartu tugas milik siapa pun antar kolom status untuk memperbaruinya. Status akan otomatis disimpan ke database.'
              : 'Seret kartu tugas Anda untuk mengubah statusnya (To Do, In Progress, Review, Done) dengan mudah.',
            side: 'bottom'
          }
        },
        {
          element: '.kanban-col:first-child',
          popover: {
            title: 'Kolom Pekerjaan',
            description: 'Menampilkan list tugas berdasarkan status. Urutan kartu di dalamnya merepresentasikan prioritas kerja.',
            side: 'right'
          }
        },
        {
          element: '.kanban-card:first-child',
          popover: {
            title: 'Kartu Pekerjaan',
            description: 'Klik pada kartu untuk melihat deskripsi lengkap, checklist sub-tugas, berkas lampiran, dan menuliskan komentar koordinasi.',
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
            description: 'Menu aktif saat ini. Menyajikan visualisasi metrik utama performa kerja secara ringkas dan real-time.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: 'div[style*="grid"]',
          popover: {
            title: 'Metrik Ringkasan',
            description: 'Pantau jumlah tugas yang sedang aktif, tugas yang telah selesai, tugas yang terlambat dari tenggat waktu, dan persentase progress keseluruhan.',
            side: 'bottom'
          }
        },
        {
          element: 'canvas',
          popover: {
            title: 'Grafik Visual',
            description: 'Grafik performa interaktif seperti pembagian tugas per kategori dan sebaran beban kerja per PIC.',
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
          element: 'input[placeholder*="Cari"]',
          popover: {
            title: 'Pencarian Cepat',
            description: 'Cari tugas apa pun berdasarkan judul, nama PIC, atau isi deskripsi tugas secara instan.',
            side: 'bottom'
          }
        },
        {
          element: 'th:first-child',
          popover: {
            title: 'Aksi Massal (Bulk Edit)',
            description: isAdmin
              ? 'Pilih beberapa tugas sekaligus untuk memperbarui status, kategori, PIC, atau tenggat waktu secara bersamaan (Akses Admin).'
              : 'Pilih tugas-tugas Anda untuk melakukan update status atau PIC secara bersamaan.',
            side: 'bottom'
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
            description: 'Gunakan navigasi ini untuk beralih antara tampilan bulanan, mingguan, harian, atau format daftar agenda.',
            side: 'bottom'
          }
        },
        {
          element: '.rbc-calendar',
          popover: {
            title: 'Kalender & Jadwal Libur',
            description: 'Lihat event tugas serta info hari libur nasional. Anda dapat menyeret (drag & drop) event untuk mengubah tanggal pengerjaan secara langsung.',
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
          element: '.glass', // Targets first card (metrics)
          popover: {
            title: 'Metrik SLA Departemen',
            description: 'Memantau skor kepatuhan target, rata-rata durasi penyelesaian tugas, dan efisiensi waktu kerja.',
            side: 'bottom'
          }
        },
        {
          element: 'canvas',
          popover: {
            title: 'Grafik Performa Visual',
            description: 'Menganalisis perbandingan progress, kecepatan penyelesaian tugas, dan persentase ketepatan target PIC.',
            side: 'top'
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
          element: '.glass', // Targets the PIC cards
          popover: {
            title: 'Beban Kerja PIC',
            description: 'Klik pada salah satu kartu PIC untuk menampilkan detail daftar tugas yang sedang mereka kerjakan di bagian bawah.',
            side: 'bottom'
          }
        }
      ];
    } else if (pathname === '/users') {
      steps = [
        {
          element: '#menu-users',
          popover: {
            title: 'Sistem User',
            description: isAdmin
              ? 'Menu aktif saat ini. Pengaturan Akun (Akses Admin). Tambahkan pengguna baru, kelola permohonan reset password, dan tentukan hak akses peran (Admin/SPV/PIC).'
              : 'Akses dibatasi. Halaman ini hanya dapat diakses oleh Administrator.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#users-tabs-container',
          popover: {
            title: 'Navigasi Tab Akun',
            description: 'Berpindah tab untuk mengelola daftar akun, menyetujui reset password user, melacak sistem log aktivitas, atau melihat info hak akses role.',
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
          element: 'th:first-child input[type="checkbox"]',
          popover: {
            title: 'Checkbox Pilihan Massal',
            description: 'Gunakan checkbox ini untuk memilih beberapa user sekaligus. Setelah dipilih, bar aksi massal (Bulk Actions) akan otomatis muncul untuk mengaktifkan, menonaktifkan, atau menghapus massal!',
            side: 'bottom'
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
              ? 'Menu aktif saat ini. Area Kontrol Master (Akses Admin). Atur nama departemen, data master PIC, kategori, status, prioritas, dan skema warna label status.'
              : 'Informasi Konfigurasi (Akses Staff). Lihat pengaturan dasar sistem dan personalisasi profil Anda.',
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
            title: 'Personalisasi Tema & Kerapatan',
            description: 'Ubah warna aksen utama aplikasi (biru, hijau, ungu, dll.) serta ubah kerapatan spasi (Compact/Comfortable).',
            side: 'bottom'
          }
        },
        {
          element: '#settings-categories',
          popover: {
            title: 'Pengaturan Nilai Master',
            description: 'Kelola isi pilihan dropdown otomatis untuk kategori, status, prioritas, dan daftar PIC di form tugas.',
            side: 'bottom'
          }
        },
        {
          element: '#settings-account',
          popover: {
            title: 'Profil & Keamanan Akun',
            description: 'Ubah nama lengkap profil Anda serta perbarui password akun secara mandiri.',
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

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      toast.error('Umpan balik tidak boleh kosong');
      return;
    }
    setSubmittingFeedback(true);

    // Mock API delay
    setTimeout(() => {
      toast.success('Umpan balik Anda telah berhasil dikirim! Terima kasih.');
      setFeedbackText('');
      setFeedbackEmail('');
      setIsFeedbackOpen(false);
      setSubmittingFeedback(false);
    }, 1200);
  };

  return (
    <>
      <div style={{ position: 'relative' }} ref={dropdownRef}>
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
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email Anda (Opsional)</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
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
