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
    name: 'Operasional Pekerjaan & Kolaborasi',
    description: 'Hak akses pembuatan & pengubahan tugas, hapus & aksi massal, unggah eviden/komentar, dan ekspor laporan.'
  },
  {
    id: 'SETTINGS',
    name: 'Pengaturan Sistem & Master Data',
    description: 'Hak akses master opsi dropdown, palet warna, identitas logo aplikasi, batas sesi, dan cadangan database.'
  },
  {
    id: 'ADMINISTRATION',
    name: 'Administrasi Akun & Keamanan',
    description: 'Hak akses manajemen user terdaftar, matriks hak akses role & simulasi pretend, audit log, dan log umpan balik.'
  }
];

export const PERMISSION_FEATURE_DETAILS: PermissionFeatureDetail[] = [
  // --- Kategori 1: Operasional Pekerjaan & Kolaborasi ---
  {
    key: 'manage_task',
    category: 'OPERATIONAL',
    label: 'Menambah, Mengubah Tugas & Mengunggah Berkas Lampiran',
    shortLabel: 'Tambah, Edit & Unggah Berkas',
    menuLocation: 'Tombol "+ Tambah Pekerjaan", Modal Edit, Duplikasi, Drag & Drop Board, Form Upload Lampiran',
    description: 'Membuat pekerjaan baru, mengedit data tugas, menduplikasi, memindahkan kartu status (drag-and-drop), mengunggah berkas eviden/lampiran pekerjaan, dan memperbarui bobot progres.',
    impact: 'Jika tidak dicentang, tombol Tambah, Edit, Duplikasi, dan form upload berkas dinonaktifkan (tugas bersifat hanya-baca / read-only).'
  },
  {
    key: 'delete_task',
    category: 'OPERATIONAL',
    label: 'Menghapus Tugas & Aksi Edit Massal (Bulk Actions)',
    shortLabel: 'Hapus & Aksi Massal',
    menuLocation: 'Menu Daftar Pekerjaan (/tasks) & Modal Detail Tugas',
    description: 'Menghapus tugas tunggal secara permanen serta menggunakan fitur checklist aksi massal (bulk status & bulk delete) di menu Daftar Pekerjaan.',
    impact: 'Jika tidak dicentang, tombol Hapus Pekerjaan dan checkbox aksi massal disembunyikan.'
  },
  {
    key: 'comment_task',
    category: 'OPERATIONAL',
    label: 'Kirim Komentar Diskusi & Catatan Progres',
    shortLabel: 'Kirim Komentar Diskusi',
    menuLocation: 'Modal Detail Tugas & Modal Komentar Cepat',
    description: 'Menulis dan mengirimkan catatan diskusi, pesan kolaborasi tanggapan, dan masukan progres pada rincian pekerjaan.',
    impact: 'Jika tidak dicentang, form kirim komentar dan diskusi dinonaktifkan.'
  },
  {
    key: 'export_data',
    category: 'OPERATIONAL',
    label: 'Ekspor Laporan & Unduh Kalender (Excel, PDF, Grafik & .ics)',
    shortLabel: 'Ekspor Data & Kalender',
    menuLocation: 'Universal Action Bar (Board, Dashboard, Tasks, Calendar, Reports, Team) & Menu Titik Tiga',
    description: 'Mengekspor data pekerjaan ke Excel (.xlsx), mencetak dokumen PDF resmi, menyalin grafik visual (.png), serta mengunduh file kalender (.ics) dan sinkronisasi Google Calendar.',
    impact: 'Jika tidak dicentang, seluruh tombol ekspor laporan dan unduh kalender dinonaktifkan.'
  },

  // --- Kategori 2: Pengaturan Sistem & Master Data ---
  {
    key: 'system_settings',
    category: 'SETTINGS',
    label: 'Pengaturan Aplikasi, Master Data & Cadangan Database',
    shortLabel: 'Master Data & Pengaturan',
    menuLocation: 'Menu Pengaturan (/settings) > Master Data, Identitas Aplikasi, Kapasitas File & Backup/Restore',
    description: 'Mengelola opsi dropdown & warna kustom (PIC, Kategori, Status, Prioritas, Lokasi), identitas aplikasi (nama/logo/sesi), kapasitas penyimpanan berkas, serta melakukan backup/restore database.',
    impact: 'Jika tidak dicentang, menu Pengaturan disembunyikan dari navigasi pengguna.'
  },

  // --- Kategori 3: Administrasi Akun & Keamanan ---
  {
    key: 'user_administration',
    category: 'ADMINISTRATION',
    label: 'Administrasi Akun, Matriks Hak Akses Role, Audit Log & Umpan Balik',
    shortLabel: 'Administrasi User & Role',
    menuLocation: 'Menu Sistem User (/users) > Pengguna, Reset Password, Edit Role (Matriks & Pretend), Sistem Logs & Umpan Balik',
    description: 'Mengelola akun terdaftar, persetujuan pendaftaran (approval), reset password, konfigurasi matriks hak akses seluruh role & simulasi pretend role, audit log kronologis, dan umpan balik pengguna.',
    impact: 'Jika tidak dicentang, menu Sistem User disembunyikan dari navigasi dan akses simulasi role dinonaktifkan.'
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
    manage_task: ['ADMIN'],
    delete_task: ['ADMIN'],
    comment_task: ['ADMIN'],
    export_data: ['ADMIN'],
    system_settings: ['ADMIN'],
    user_administration: ['ADMIN']
  }
};

export const hasPermission = (
  config: RolePermissionsConfig | null | undefined,
  feature: string,
  userRole: string
): boolean => {
  if (!userRole) return false;
  if (!config) config = defaultRolePermissions;

  // All authenticated users have basic view/read access to workspace pages and task details
  if (feature === 'view_detail' || feature === 'view_tasks' || feature === 'view_dashboard') {
    return true;
  }

  // 1. Mapping legacy or specific keys to the 6 streamlined keys
  let canonicalFeatureKey = feature;
  if (feature === 'upload_comment') {
    canonicalFeatureKey = 'comment_task';
  } else if (feature === 'master_data' || feature === 'system_config' || feature === 'database_backup') {
    canonicalFeatureKey = 'system_settings';
  } else if (feature === 'user_management' || feature === 'role_management' || feature === 'system_logs' || feature === 'admin_feedback') {
    canonicalFeatureKey = 'user_administration';
  }

  let allowedRoles: string[] | undefined = config.permissions?.[canonicalFeatureKey];
  if (allowedRoles === undefined) {
    allowedRoles = config.permissions?.[feature];
  }
  if (allowedRoles === undefined) {
    allowedRoles = defaultRolePermissions.permissions?.[canonicalFeatureKey] || defaultRolePermissions.permissions?.[feature];
  }

  if (!allowedRoles || !Array.isArray(allowedRoles) || allowedRoles.length === 0) return false;

  const cleanRole = userRole.trim().toLowerCase();

  // 2. Resolve userRole to its actual role key in config.labels
  let targetRoleKey = userRole.trim();
  if (config.labels) {
    if (config.labels[targetRoleKey]) {
      // Direct key match
    } else {
      const match = Object.entries(config.labels).find(([k, label]) =>
        k.toLowerCase() === cleanRole || (label && label.trim().toLowerCase() === cleanRole)
      );
      if (match) {
        targetRoleKey = match[0];
      }
    }
  }

  const targetRoleKeyClean = targetRoleKey.toLowerCase();

  // 3. Strict match: is targetRoleKey in allowedRoles?
  return allowedRoles.some(r => r && r.trim().toLowerCase() === targetRoleKeyClean);
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
