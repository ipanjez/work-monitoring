export interface RolePermissionsConfig {
  labels: Record<string, string>;
  permissions: Record<string, string[]>;
  icons?: Record<string, string>;
  colors?: Record<string, string>;
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
    description: 'Membuka dan melihat rincian detail tugas saat kartu diklik untuk membaca deskripsi, subtask, riwayat, dan mempratinjau file lampiran.',
    impact: 'Jika tidak dicentang, pengguna tidak diizinkan membuka modal rincian detail tugas saat kartu diklik.'
  },
  {
    key: 'manage_task',
    category: 'OPERATIONAL',
    label: 'Menambah, Mengubah & Menduplikasi Pekerjaan',
    shortLabel: 'Tambah, Edit & Duplikasi',
    menuLocation: 'Tombol "+ Tambah Pekerjaan", Modal Edit, Tombol Duplikasi, Board (Drag & Drop), Tasks, Calendar',
    description: 'Membuat pekerjaan baru, mengedit data, menduplikasi tugas, mengubah status (drag-and-drop), memperbarui tanggal, PIC, prioritas, dan subtask.',
    impact: 'Jika tidak dicentang, tombol Tambah, Edit, dan Duplikasi Pekerjaan dinonaktifkan serta tugas tidak dapat dipindahkan.'
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
    impact: 'Jika tidak dicentang, tab Pengguna dan Reset Password disembunyikan.'
  },
  {
    key: 'role_management',
    category: 'ADMINISTRATION',
    label: 'Kelola Matriks Akses Role & Uji Coba Role (Pretend)',
    shortLabel: 'Matriks & Uji Role',
    menuLocation: 'Menu Sistem User (/users) > Tab Edit Role & Menu Profil',
    description: 'Mengatur matriks izin seluruh role dan melakukan simulasi / uji coba role (pretend role) pada profil akun.',
    impact: 'Jika tidak dicentang, tab Edit Role disembunyikan dan opsi Uji Coba Role (Pretend) pada profil dinonaktifkan.'
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

export const DEFAULT_ROLE_ICONS: Record<string, string> = {
  ADMIN: 'ShieldCheck'
};

export const DEFAULT_ROLE_COLORS: Record<string, string> = {
  ADMIN: '#7c3aed' // Purple/Violet
};

export const AVAILABLE_ROLE_ICONS = [
  { id: 'ShieldCheck', label: 'Shield Check' },
  { id: 'Shield', label: 'Shield' },
  { id: 'ShieldAlert', label: 'Shield Alert' },
  { id: 'User', label: 'User' },
  { id: 'Users', label: 'Users' },
  { id: 'UserCheck', label: 'User Check' },
  { id: 'Crown', label: 'Crown' },
  { id: 'Award', label: 'Award' },
  { id: 'Star', label: 'Star' },
  { id: 'Zap', label: 'Zap' },
  { id: 'Eye', label: 'Eye' },
  { id: 'Briefcase', label: 'Briefcase' },
  { id: 'Settings', label: 'Settings' },
  { id: 'KeyRound', label: 'Key' },
  { id: 'Sparkles', label: 'Sparkles' },
  { id: 'Lock', label: 'Lock' },
  { id: 'Compass', label: 'Compass' }
];

export const AVAILABLE_ROLE_COLORS = [
  '#7c3aed', // Ungu
  '#2563eb', // Biru
  '#059669', // Emerald
  '#0284c7', // Sky Blue
  '#d97706', // Amber Gold
  '#ea580c', // Oranye
  '#dc2626', // Merah
  '#db2777', // Pink
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#64748b', // Slate
  '#334155'  // Dark Slate
];

export const defaultRolePermissions: RolePermissionsConfig = {
  labels: {
    ADMIN: 'Admin'
  },
  icons: {
    ...DEFAULT_ROLE_ICONS
  },
  colors: {
    ...DEFAULT_ROLE_COLORS
  },
  permissions: {
    view_dashboard: ['ADMIN'],
    view_detail: ['ADMIN'],
    manage_task: ['ADMIN'],
    delete_task: ['ADMIN'],
    upload_comment: ['ADMIN'],
    export_data: ['ADMIN'],
    master_data: ['ADMIN'],
    user_management: ['ADMIN'],
    role_management: ['ADMIN'],
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
  if (!userRole) return false;
  if (!config) config = defaultRolePermissions;
  
  let allowedRoles = config.permissions?.[feature];
  if (!allowedRoles || !Array.isArray(allowedRoles)) {
    if (feature === 'role_management') {
      allowedRoles = config.permissions?.['user_management'] || defaultRolePermissions.permissions?.['role_management'];
    } else {
      allowedRoles = defaultRolePermissions.permissions?.[feature];
    }
  }
  if (!allowedRoles || !Array.isArray(allowedRoles)) return false;

  const cleanRole = userRole.trim().toLowerCase();

  // 1. Direct match with key or label in allowedRoles (case-insensitive)
  if (allowedRoles.some(r => r && r.trim().toLowerCase() === cleanRole)) {
    return true;
  }

  // 2. Find any role key in config.labels where key or label matches userRole
  const matchingKeys: string[] = [];
  if (config.labels) {
    Object.entries(config.labels).forEach(([k, label]) => {
      if (k.trim().toLowerCase() === cleanRole || (label && label.trim().toLowerCase() === cleanRole)) {
        matchingKeys.push(k);
      }
    });
  }

  // 3. Check if any matching key or its corresponding label is in allowedRoles
  return allowedRoles.some(r => {
    if (!r) return false;
    const rClean = r.trim().toLowerCase();
    return matchingKeys.some(mk => {
      const mkClean = mk.trim().toLowerCase();
      const labelClean = config?.labels?.[mk]?.trim().toLowerCase();
      return mkClean === rClean || labelClean === rClean;
    });
  });
};

export const getRoleLabel = (
  config: RolePermissionsConfig | null | undefined,
  userRole: string
): string => {
  if (!userRole) return '';
  if (!config) config = defaultRolePermissions;
  if (config.labels?.[userRole]) return config.labels[userRole];
  if (config.labels) {
    const match = Object.entries(config.labels).find(([k, l]) => k.toLowerCase() === userRole.toLowerCase() || (l && l.toLowerCase() === userRole.toLowerCase()));
    if (match) return match[1] || match[0];
  }
  return userRole;
};

export const getRoleIconName = (
  config: RolePermissionsConfig | null | undefined,
  userRole: string
): string => {
  if (!userRole) return 'User';
  if (!config) config = defaultRolePermissions;
  if (config.icons && config.icons[userRole]) {
    return config.icons[userRole];
  }
  if (config.labels && config.icons) {
    const entry = Object.entries(config.labels).find(([k, l]) => k.toLowerCase() === userRole.toLowerCase() || (l && l.toLowerCase() === userRole.toLowerCase()));
    if (entry && config.icons[entry[0]]) {
      return config.icons[entry[0]];
    }
  }
  return DEFAULT_ROLE_ICONS[userRole] || 'User';
};

export const getRoleColor = (
  config: RolePermissionsConfig | null | undefined,
  userRole: string
): string => {
  if (!userRole) return '#3b82f6';
  if (!config) config = defaultRolePermissions;
  if (config.colors && config.colors[userRole]) {
    return config.colors[userRole];
  }
  if (config.labels && config.colors) {
    const entry = Object.entries(config.labels).find(([k, l]) => k.toLowerCase() === userRole.toLowerCase() || (l && l.toLowerCase() === userRole.toLowerCase()));
    if (entry && config.colors[entry[0]]) {
      return config.colors[entry[0]];
    }
  }
  return DEFAULT_ROLE_COLORS[userRole] || '#3b82f6';
};
