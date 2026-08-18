export interface RolePermissionsConfig {
  labels: Record<string, string>;
  permissions: Record<string, string[]>;
}

export interface PermissionFeatureDetail {
  key: string;
  category: 'OPERATIONAL' | 'SETTINGS' | 'ADMINISTRATION';
  label: string;
  shortLabel: string;
  menuLocation: string;
  description: string;
  impact: string;
}

export const PERMISSION_CATEGORIES = [
  {
    id: 'OPERATIONAL',
    name: 'Operasional Pekerjaan & Monitoring',
    description: 'Hak akses halaman monitoring, manajemen tugas harian, berkas lampiran, dan ekspor laporan.'
  },
  {
    id: 'SETTINGS',
    name: 'Pengaturan Sistem & Basis Data',
    description: 'Hak akses master data opsi dropdown, konfigurasi batas sesi keamanan, dan pencadangan database.'
  },
  {
    id: 'ADMINISTRATION',
    name: 'Administrasi Akun & Audit Log',
    description: 'Hak akses manajemen user, persetujuan pendaftaran, jejak audit aktivitas, dan log umpan balik.'
  }
];

export const PERMISSION_FEATURE_DETAILS: PermissionFeatureDetail[] = [
  // --- Kategori 1: Operasional Pekerjaan & Monitoring ---
  {
    key: 'view_dashboard',
    category: 'OPERATIONAL',
    label: 'Melihat Dashboard & Monitoring Board',
    shortLabel: 'Dashboard & Board',
    menuLocation: 'Monitoring Board (/) & Dashboard Executive (/dashboard)',
    description: 'Membuka dan melihat visualisasi grafik, metrik eksekutif, status pekerjaan departemen, dan papan kanban.',
    impact: 'Jika tidak dicentang, menu Dashboard dan Monitoring Board disembunyikan dari navigasi pengguna.'
  },
  {
    key: 'view_detail',
    category: 'OPERATIONAL',
    label: 'Melihat Rincian Detail Tugas & Lampiran',
    shortLabel: 'Detail & Lampiran',
    menuLocation: 'Seluruh Menu Pekerjaan (Board, Tasks, Calendar, Reports, Team)',
    description: 'Membuka modal popup detail tugas untuk membaca deskripsi, subtask, riwayat, dan mempratinjau file lampiran.',
    impact: 'Jika tidak dicentang, pengguna tidak diizinkan membuka modal rincian detail tugas saat kartu diklik.'
  },
  {
    key: 'manage_task',
    category: 'OPERATIONAL',
    label: 'Menambah & Mengubah Data Pekerjaan',
    shortLabel: 'Tambah & Edit Tugas',
    menuLocation: 'Tombol "+ Tambah Pekerjaan", Board (Drag & Drop), Tasks, Calendar',
    description: 'Membuat tugas baru, mengubah status (drag-and-drop), memperbarui tanggal, PIC, prioritas, dan subtask.',
    impact: 'Jika tidak dicentang, tombol Tambah Pekerjaan dinonaktifkan dan tugas tidak dapat diedit/dipindahkan.'
  },
  {
    key: 'delete_task',
    category: 'OPERATIONAL',
    label: 'Menghapus Tugas & Aksi Edit Massal (Bulk)',
    shortLabel: 'Hapus & Bulk Edit',
    menuLocation: 'Menu Daftar Pekerjaan (/tasks)',
    description: 'Menghapus data pekerjaan secara permanen serta menggunakan fitur checklist untuk mengubah status atau menghapus banyak tugas sekaligus.',
    impact: 'Jika tidak dicentang, tombol Hapus Pekerjaan dan checkbox aksi massal disembunyikan.'
  },
  {
    key: 'upload_comment',
    category: 'OPERATIONAL',
    label: 'Unggah Berkas Lampiran & Kirim Komentar',
    shortLabel: 'Upload & Komentar',
    menuLocation: 'Modal Detail Tugas & Modal Komentar Cepat',
    description: 'Mengunggah file lampiran dokumen/gambar ke dalam pekerjaan dan mengirimkan catatan diskusi/komentar.',
    impact: 'Jika tidak dicentang, form komentar dan tombol unggah berkas dinonaktifkan.'
  },
  {
    key: 'export_data',
    category: 'OPERATIONAL',
    label: 'Ekspor Laporan (Excel, PDF, Salin Gambar)',
    shortLabel: 'Export Data',
    menuLocation: 'Universal Action Bar (Board, Dashboard, Tasks, Calendar, Reports, Team)',
    description: 'Mengekspor laporan pekerjaan ke format Excel (.xlsx), mencetak dokumen PDF resmi, dan menyalin grafik (.png).',
    impact: 'Jika tidak dicentang, tombol ekspor Excel, PDF, dan Salin Gambar dinonaktifkan.'
  },

  // --- Kategori 2: Pengaturan Sistem & Basis Data ---
  {
    key: 'master_data',
    category: 'SETTINGS',
    label: 'Kelola Master Data & Warna (Dropdown, Status, PIC, Kategori & Lokasi)',
    shortLabel: 'Master Data & Warna',
    menuLocation: 'Menu Pengaturan (/settings) > Master Data',
    description: 'Mengelola daftar opsi dropdown serta palet warna kustom tema untuk Kategori, PIC departemen & foto avatar, Status & progress %, Prioritas, dan Lokasi pekerjaan.',
    impact: 'Jika tidak dicentang, bagian Master Data di menu Pengaturan disembunyikan.'
  },
  {
    key: 'system_config',
    category: 'SETTINGS',
    label: 'Identitas Aplikasi (Nama & Logo), Batas Sesi & Kapasitas File',
    shortLabel: 'Identitas & Konfigurasi',
    menuLocation: 'Menu Pengaturan (/settings) > Identitas Aplikasi & Pengaturan Umum',
    description: 'Mengatur Identitas Aplikasi (Nama Aplikasi, Singkatan Nama Departemen, dan Logo Aplikasi), batas sesi login (auto-logout), waktu inaktif, dan kapasitas maksimal penyimpanan berkas.',
    impact: 'Jika tidak dicentang, bagian Identitas Aplikasi & Pengaturan Umum disembunyikan (otomatis mengikuti nilai default sistem).'
  },
  {
    key: 'database_backup',
    category: 'SETTINGS',
    label: 'Cadangan & Pemulihan Database (Backup/Restore)',
    shortLabel: 'Backup & Restore',
    menuLocation: 'Menu Pengaturan (/settings) > Cadangan & Export Database & Pop-up Global Pengingat Backup',
    description: 'Mengunduh salinan backup lengkap database JSON beserta file lampiran (.zip), memulihkan (restore) data, mengatur frekuensi jadwal pengingat pencadangan, serta menerima notifikasi pop-up modal "Pengingat Pencadangan Berkala".',
    impact: 'Jika tidak dicentang, bagian Cadangan & Export Database di menu Pengaturan disembunyikan, dan pengguna tidak akan menerima notifikasi pop-up pengingat pencadangan data.'
  },

  // --- Kategori 3: Administrasi Akun & Audit Log ---
  {
    key: 'user_management',
    category: 'ADMINISTRATION',
    label: 'Manajemen Pengguna & Akun',
    shortLabel: 'Manajemen User',
    menuLocation: 'Menu Sistem User (/users) > Tab Pengguna & Reset Password',
    description: 'Melihat akun terdaftar, persetujuan pendaftaran (approval akun baru), aktivasi akun, dan reset kata sandi.',
    impact: 'Jika tidak dicentang, akses ke menu Sistem User dibatasi/disembunyikan.'
  },
  {
    key: 'system_logs',
    category: 'ADMINISTRATION',
    label: 'Audit Log Jejak Aktivitas Sistem',
    shortLabel: 'Sistem Log',
    menuLocation: 'Menu Sistem User (/users) > Tab Sistem Log',
    description: 'Melihat seluruh riwayat log aktivitas pengguna dan perubahan data sistem secara kronologis.',
    impact: 'Jika tidak dicentang, tab Sistem Log disembunyikan dari menu Sistem User.'
  },
  {
    key: 'admin_feedback',
    category: 'ADMINISTRATION',
    label: 'Akses & Tinjauan Umpan Balik Pengguna',
    shortLabel: 'Log Umpan Balik',
    menuLocation: 'Menu Sistem User (/users) > Tab Umpan Balik',
    description: 'Membaca pesan masukan, saran, dan kendala yang dikirimkan oleh pengguna aplikasi melalui tombol bantuan.',
    impact: 'Jika tidak dicentang, tab Umpan Balik disembunyikan dari menu Sistem User.'
  }
];

export const defaultRolePermissions: RolePermissionsConfig = {
  labels: {
    ADMIN: 'Admin',
    MEMBER: 'Member',
    VIEWER: 'Viewer',
    SPV: 'Supervisor',
    GUEST: 'Guest'
  },
  permissions: {
    view_dashboard: ['ADMIN', 'MEMBER', 'VIEWER', 'SPV', 'GUEST'],
    view_detail: ['ADMIN', 'MEMBER', 'VIEWER', 'SPV', 'GUEST'],
    manage_task: ['ADMIN', 'MEMBER'],
    delete_task: ['ADMIN', 'MEMBER'],
    upload_comment: ['ADMIN', 'MEMBER'],
    export_data: ['ADMIN', 'MEMBER'],
    master_data: ['ADMIN'],
    user_management: ['ADMIN'],
    system_logs: ['ADMIN'],
    admin_feedback: ['ADMIN'],
    database_backup: ['ADMIN'],
    system_config: ['ADMIN']
  }
};

export const hasPermission = (
  config: RolePermissionsConfig | null | undefined,
  feature: string,
  userRole: string
): boolean => {
  if (!config) config = defaultRolePermissions;
  const allowedRoles = config.permissions[feature];
  if (!allowedRoles) return false;
  return allowedRoles.includes(userRole);
};

export const getRoleLabel = (
  config: RolePermissionsConfig | null | undefined,
  userRole: string
): string => {
  if (!config) config = defaultRolePermissions;
  return config.labels[userRole] || userRole;
};
