'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Settings, Shield, Download, Sun, Moon, Database, Check, Plus, X, Tag, 
  Users, Palette, Layout, Maximize, Save, HelpCircle, MapPin, 
  Pencil, Camera, Clock, RotateCcw, 
  Sparkles, Search, GripVertical, Layers, ChevronRight, HardDrive, Loader2, RefreshCw
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { useMaster } from '@/context/MasterContext';
import { hasPermission } from '@/lib/permissions';
import { broadcastSettingsChange } from '@/utils/realtimeSettingsSync';
import toast from 'react-hot-toast';
import AvatarCropperModal from '@/components/AvatarCropperModal';
import Avatar from '@/components/Avatar';

type Task = {
  id: number;
  nama: string;
  pic: string;
  additionalPics?: string | null;
  status: string;
  prioritas?: string | null;
  kategori?: string | null;
  progress?: number | null;
  deskripsi?: string | null;
  catatan?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  filesJson?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  lokasi?: string | null;
};

type ListType = 'cat' | 'pic' | 'status' | 'priority' | 'location';

export default function SettingsClient({ tasks }: { tasks: Task[] }) {
  const { data: session } = useSession();
  const { addActivityLog } = useNotifications();
  const userRole = (session?.user as any)?.role || '';
  const { roleConfig } = useMaster();

  const canMasterData = hasPermission(roleConfig, 'master_data', userRole);
  const canSystemConfig = hasPermission(roleConfig, 'system_config', userRole);
  const canDatabaseBackup = hasPermission(roleConfig, 'database_backup', userRole);

  const { theme, toggleTheme, accentColor, setAccentColor, density, setDensity, toggleFocusMode } = useTheme();

  const [activeMasterSubTab, setActiveMasterSubTab] = useState<ListType>('cat');

  // General & Branding State
  const [deptName, setDeptName] = useState('MRK');
  const [appName, setAppName] = useState('DeptMonitor');
  const [appLogo, setAppLogo] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Storage & Limits State
  const [maxFileSizeMb, setMaxFileSizeMb] = useState<number | string>(25);
  const [maxTaskFilesSizeMb, setMaxTaskFilesSizeMb] = useState<number | string>(100);
  const [maxTotalStorageMb, setMaxTotalStorageMb] = useState<number | string>(5000);
  const [storageUsedMb, setStorageUsedMb] = useState<number>(0);
  const [isLoadingStorage, setIsLoadingStorage] = useState<boolean>(true);

  // Session & Security State
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState<number | string>(24);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<number | string>(10);
  const [backupReminderDays, setBackupReminderDays] = useState<number | string>('');
  const [backupReminderMode, setBackupReminderMode] = useState<string>('0');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Master Data State
  const [categories, setCategories] = useState<string[]>([]);
  const [pics, setPics] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const [masterColors, setMasterColors] = useState<Record<string, string>>({});
  const [masterIcons, setMasterIcons] = useState<Record<string, string>>({});
  const [masterStatusProgress, setMasterStatusProgress] = useState<Record<string, number>>({});
  const [masterPicAvatars, setMasterPicAvatars] = useState<Record<string, string>>({});

  const [newCatInput, setNewCatInput] = useState('');
  const [newPicInput, setNewPicInput] = useState('');
  const [newStatusInput, setNewStatusInput] = useState('');
  const [newPriorityInput, setNewPriorityInput] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');

  // Drag State
  const [draggedIdx, setDraggedIdx] = useState<{ type: string, index: number } | null>(null);

  // Edit State
  const [editingItem, setEditingItem] = useState<{ type: ListType, oldVal: string } | null>(null);
  const [editInputValue, setEditInputValue] = useState('');

  // Avatar Cropper State
  const [activePicForAvatar, setActivePicForAvatar] = useState<string | null>(null);
  const [isAppLogoCropperOpen, setIsAppLogoCropperOpen] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

  const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#71717a', '#737373'
  ];



  useEffect(() => {
    // 1. Initial Load from LocalStorage
    try {
      const storedCategories = localStorage.getItem('master_cats');
      if (storedCategories) setCategories(JSON.parse(storedCategories));

      const storedPics = localStorage.getItem('master_pics');
      if (storedPics) setPics(JSON.parse(storedPics));

      const storedStatuses = localStorage.getItem('master_statuses');
      if (storedStatuses) setStatuses(JSON.parse(storedStatuses));

      const storedPriorities = localStorage.getItem('master_priorities');
      if (storedPriorities) setPriorities(JSON.parse(storedPriorities));

      const storedLocations = localStorage.getItem('master_locations');
      if (storedLocations) setLocations(JSON.parse(storedLocations));

      const storedColors = localStorage.getItem('master_colors');
      if (storedColors) setMasterColors(JSON.parse(storedColors));

      const storedIcons = localStorage.getItem('master_icons');
      if (storedIcons) setMasterIcons(JSON.parse(storedIcons));

      const storedStatusProgress = localStorage.getItem('master_status_progress');
      if (storedStatusProgress) setMasterStatusProgress(JSON.parse(storedStatusProgress));

      const storedPicAvatars = localStorage.getItem('master_pic_avatars');
      if (storedPicAvatars) setMasterPicAvatars(JSON.parse(storedPicAvatars));

      const storedAppName = localStorage.getItem('app_name');
      if (storedAppName) setAppName(storedAppName);

      const storedDeptName = localStorage.getItem('app_subtitle') || localStorage.getItem('dept_name');
      if (storedDeptName) setDeptName(storedDeptName);

      const storedAppLogo = localStorage.getItem('app_logo');
      if (storedAppLogo) setAppLogo(storedAppLogo);

      const storedMaxFileSize = localStorage.getItem('max_file_size_mb');
      if (storedMaxFileSize) setMaxFileSizeMb(storedMaxFileSize);

      const storedMaxTaskFiles = localStorage.getItem('max_task_files_size_mb');
      if (storedMaxTaskFiles) setMaxTaskFilesSizeMb(storedMaxTaskFiles);

      const storedMaxTotal = localStorage.getItem('max_total_storage_mb');
      if (storedMaxTotal) setMaxTotalStorageMb(storedMaxTotal);

      const storedTimeoutHours = localStorage.getItem('session_timeout_hours');
      if (storedTimeoutHours) setSessionTimeoutHours(storedTimeoutHours);

      const storedTimeoutMinutes = localStorage.getItem('session_timeout');
      if (storedTimeoutMinutes) setSessionTimeoutMinutes(storedTimeoutMinutes);

      const storedReminder = localStorage.getItem('backup_reminder_days');
      if (storedReminder) {
        setBackupReminderDays(storedReminder);
        if (['-1', '0', '1', '3', '7', '14', '30'].includes(storedReminder)) {
          setBackupReminderMode(storedReminder);
        } else {
          setBackupReminderMode('custom');
        }
      }
    } catch (e) {
      console.error('Error loading settings from localStorage:', e);
    }

    // 2. Fetch from DB API
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.master_categories) setCategories(data.master_categories);
        if (data.master_pics) setPics(data.master_pics);
        if (data.master_statuses) setStatuses(data.master_statuses);
        if (data.master_priorities) setPriorities(data.master_priorities);
        if (data.master_locations) setLocations(data.master_locations);
        if (data.master_colors) setMasterColors(data.master_colors);
        if (data.master_icons) setMasterIcons(data.master_icons);
        if (data.master_status_progress) setMasterStatusProgress(data.master_status_progress);
        if (data.master_pic_avatars) setMasterPicAvatars(data.master_pic_avatars);
        if (data.app_name !== undefined) setAppName(data.app_name);
        if (data.dept_name !== undefined) setDeptName(data.dept_name);
        if (data.app_logo !== undefined) setAppLogo(data.app_logo);
        if (data.max_file_size_mb !== undefined) setMaxFileSizeMb(data.max_file_size_mb);
        if (data.max_task_files_size_mb !== undefined) setMaxTaskFilesSizeMb(data.max_task_files_size_mb);
        if (data.max_total_storage_mb !== undefined) setMaxTotalStorageMb(data.max_total_storage_mb);
        if (data.session_timeout_hours !== undefined) setSessionTimeoutHours(data.session_timeout_hours);
        if (data.session_timeout !== undefined) setSessionTimeoutMinutes(data.session_timeout);

        if (data.backup_reminder_days !== undefined && data.backup_reminder_days !== null) {
          const daysStr = String(data.backup_reminder_days);
          setBackupReminderDays(daysStr);
          if (['-1', '0', '1', '3', '7', '14', '30'].includes(daysStr)) {
            setBackupReminderMode(daysStr);
          } else {
            setBackupReminderMode('custom');
          }
        }
      })
      .catch(err => console.error('Failed to fetch settings from API:', err));

    // 3. Fetch storage usage
    fetchStorageUsage();
  }, []);

  const fetchStorageUsage = async () => {
    setIsLoadingStorage(true);
    try {
      const res = await fetch('/api/settings/storage');
      if (res.ok) {
        const data = await res.json();
        const used = typeof data.usedMb === 'number' ? data.usedMb : (typeof data.totalUsedMb === 'number' ? data.totalUsedMb : 0);
        setStorageUsedMb(used);
      }
    } catch (e) {
      console.warn('Failed to load storage usage:', e);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  // Save Settings Handler with Real-Time Broadcasting
  const handleSaveSettings = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSavingSettings(true);
    const toastId = toast.loading('Menyimpan pengaturan & menyinkronkan ke seluruh tab...');
    
    // Save to localStorage for instant local access
    localStorage.setItem('master_categories', JSON.stringify(categories));
    localStorage.setItem('master_pics', JSON.stringify(pics));
    localStorage.setItem('master_statuses', JSON.stringify(statuses));
    localStorage.setItem('master_priorities', JSON.stringify(priorities));
    localStorage.setItem('master_locations', JSON.stringify(locations));
    localStorage.setItem('master_colors', JSON.stringify(masterColors));
    localStorage.setItem('master_icons', JSON.stringify(masterIcons));
    localStorage.setItem('master_status_progress', JSON.stringify(masterStatusProgress));
    localStorage.setItem('master_pic_avatars', JSON.stringify(masterPicAvatars));
    localStorage.setItem('app_name', appName);
    localStorage.setItem('app_subtitle', deptName);
    localStorage.setItem('dept_name', deptName);
    localStorage.setItem('app_logo', appLogo);
    localStorage.setItem('max_file_size_mb', String(maxFileSizeMb));
    localStorage.setItem('max_task_files_size_mb', String(maxTaskFilesSizeMb));
    localStorage.setItem('max_total_storage_mb', String(maxTotalStorageMb));
    localStorage.setItem('session_timeout', String(sessionTimeoutMinutes));
    localStorage.setItem('session_timeout_hours', String(sessionTimeoutHours));

    const finalReminderDays = backupReminderMode === 'custom' 
      ? (Number(backupReminderDays) || 7) 
      : Number(backupReminderMode);
    localStorage.setItem('backup_reminder_days', String(finalReminderDays));

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dept_name: deptName,
          app_name: appName,
          app_subtitle: deptName,
          app_logo: appLogo,
          master_categories: categories,
          master_pics: pics,
          master_statuses: statuses,
          master_priorities: priorities,
          master_locations: locations,
          master_colors: masterColors,
          master_icons: masterIcons,
          master_status_progress: masterStatusProgress,
          master_pic_avatars: masterPicAvatars,
          max_file_size_mb: Number(maxFileSizeMb) || 25,
          max_task_files_size_mb: Number(maxTaskFilesSizeMb) || 100,
          max_total_storage_mb: Number(maxTotalStorageMb) || 5000,
          session_timeout_hours: Number(sessionTimeoutHours) || 24,
          session_timeout: Number(sessionTimeoutMinutes) || 10,
          backup_reminder_days: finalReminderDays,
        })
      });
      
      // Real-time broadcast to all other open tabs & MasterContext
      broadcastSettingsChange('max_file_size_mb', Number(maxFileSizeMb) || 25);
      broadcastSettingsChange('max_task_files_size_mb', Number(maxTaskFilesSizeMb) || 100);
      broadcastSettingsChange('max_total_storage_mb', Number(maxTotalStorageMb) || 5000);
      broadcastSettingsChange('app_name', appName);
      broadcastSettingsChange('app_subtitle', deptName);
      broadcastSettingsChange('app_logo', appLogo);
      broadcastSettingsChange('master_categories', categories);
      broadcastSettingsChange('master_pics', pics);
      broadcastSettingsChange('master_statuses', statuses);
      broadcastSettingsChange('master_priorities', priorities);
      broadcastSettingsChange('master_locations', locations);
      broadcastSettingsChange('master_colors', masterColors);
      broadcastSettingsChange('master_icons', masterIcons);
      broadcastSettingsChange('master_status_progress', masterStatusProgress);
      broadcastSettingsChange('master_pic_avatars', masterPicAvatars);
      broadcastSettingsChange('session_timeout', Number(sessionTimeoutMinutes) || 10);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      window.dispatchEvent(new Event('deptNameChanged'));
      window.dispatchEvent(new Event('backupReminderChanged'));
      window.dispatchEvent(new Event('masterUpdated'));

      if (addActivityLog) {
        addActivityLog('SAVE_SETTINGS', 'Simpan Pengaturan', 'Pengaturan aplikasi berhasil disimpan & disinkronkan', 'success');
      }
      toast.success('Pengaturan berhasil disimpan & disinkronkan ke seluruh tab!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan pengaturan.', { id: toastId });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Master Data Add Item Handler
  const handleAddItem = (type: ListType, val: string, setInput: (v: string) => void) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    if (type === 'cat') {
      if (categories.includes(trimmed)) return toast.error('Kategori sudah ada');
      const updated = [...categories, trimmed];
      setCategories(updated);
      localStorage.setItem('master_cats', JSON.stringify(updated));
    } else if (type === 'pic') {
      if (pics.includes(trimmed)) return toast.error('PIC sudah ada');
      const updated = [...pics, trimmed];
      setPics(updated);
      localStorage.setItem('master_pics', JSON.stringify(updated));
    } else if (type === 'status') {
      if (statuses.includes(trimmed)) return toast.error('Status sudah ada');
      const updated = [...statuses, trimmed];
      setStatuses(updated);
      localStorage.setItem('master_statuses', JSON.stringify(updated));
    } else if (type === 'priority') {
      if (priorities.includes(trimmed)) return toast.error('Prioritas sudah ada');
      const updated = [...priorities, trimmed];
      setPriorities(updated);
      localStorage.setItem('master_priorities', JSON.stringify(updated));
    } else if (type === 'location') {
      if (locations.includes(trimmed)) return toast.error('Lokasi sudah ada');
      const updated = [...locations, trimmed];
      setLocations(updated);
      localStorage.setItem('master_locations', JSON.stringify(updated));
    }

    setInput('');
  };

  // Master Data Delete Item Handler
  const handleDeleteItem = (type: ListType, val: string) => {
    if (type === 'cat') {
      const updated = categories.filter(c => c !== val);
      setCategories(updated);
      localStorage.setItem('master_cats', JSON.stringify(updated));
    } else if (type === 'pic') {
      const updated = pics.filter(p => p !== val);
      setPics(updated);
      localStorage.setItem('master_pics', JSON.stringify(updated));
    } else if (type === 'status') {
      if (statuses.length <= 1) return toast.error('Minimal harus ada 1 status');
      const updated = statuses.filter(s => s !== val);
      setStatuses(updated);
      localStorage.setItem('master_statuses', JSON.stringify(updated));
    } else if (type === 'priority') {
      if (priorities.length <= 1) return toast.error('Minimal harus ada 1 prioritas');
      const updated = priorities.filter(p => p !== val);
      setPriorities(updated);
      localStorage.setItem('master_priorities', JSON.stringify(updated));
    } else if (type === 'location') {
      const updated = locations.filter(l => l !== val);
      setLocations(updated);
      localStorage.setItem('master_locations', JSON.stringify(updated));
    }
  };

  // Master Data Rename Handler
  const handleStartEdit = (type: ListType, val: string) => {
    setEditingItem({ type, oldVal: val });
    setEditInputValue(val);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const { type, oldVal } = editingItem;
    const newVal = editInputValue.trim();

    if (!newVal || newVal === oldVal) {
      setEditingItem(null);
      return;
    }

    const toastId = toast.loading(`Mengubah "${oldVal}" menjadi "${newVal}" pada seluruh pekerjaan terkait...`);

    let endpointField = '';
    if (type === 'cat') endpointField = 'kategori';
    else if (type === 'pic') endpointField = 'pic';
    else if (type === 'status') endpointField = 'status';
    else if (type === 'priority') endpointField = 'prioritas';
    else if (type === 'location') endpointField = 'lokasi';

    try {
      const res = await fetch('/api/settings/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: endpointField, oldVal, newVal })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengubah data pada database');
      }

      // Update state locally
      if (type === 'cat') {
        const updated = categories.map(c => c === oldVal ? newVal : c);
        setCategories(updated);
        localStorage.setItem('master_cats', JSON.stringify(updated));
      } else if (type === 'pic') {
        const updated = pics.map(p => p === oldVal ? newVal : p);
        setPics(updated);
        localStorage.setItem('master_pics', JSON.stringify(updated));
        if (masterPicAvatars[oldVal]) {
          const avs = { ...masterPicAvatars, [newVal]: masterPicAvatars[oldVal] };
          delete avs[oldVal];
          setMasterPicAvatars(avs);
        }
      } else if (type === 'status') {
        const updated = statuses.map(s => s === oldVal ? newVal : s);
        setStatuses(updated);
        localStorage.setItem('master_statuses', JSON.stringify(updated));
        if (masterColors[oldVal]) {
          const cols = { ...masterColors, [newVal]: masterColors[oldVal] };
          delete cols[oldVal];
          setMasterColors(cols);
        }
        if (masterStatusProgress[oldVal] !== undefined) {
          const progs = { ...masterStatusProgress, [newVal]: masterStatusProgress[oldVal] };
          delete progs[oldVal];
          setMasterStatusProgress(progs);
        }
      } else if (type === 'priority') {
        const updated = priorities.map(p => p === oldVal ? newVal : p);
        setPriorities(updated);
        localStorage.setItem('master_priorities', JSON.stringify(updated));
      } else if (type === 'location') {
        const updated = locations.map(l => l === oldVal ? newVal : l);
        setLocations(updated);
        localStorage.setItem('master_locations', JSON.stringify(updated));
      }

      toast.success(`Berhasil mengubah "${oldVal}" menjadi "${newVal}"!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah data', { id: toastId });
    } finally {
      setEditingItem(null);
    }
  };

  // Drag Reorder Handlers
  const handleDragStart = (type: string, index: number) => {
    setDraggedIdx({ type, index });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (type: ListType, targetIdx: number) => {
    if (!draggedIdx || draggedIdx.type !== type) return;
    const sourceIdx = draggedIdx.index;
    if (sourceIdx === targetIdx) return;

    if (type === 'cat') {
      const arr = [...categories];
      const [moved] = arr.splice(sourceIdx, 1);
      arr.splice(targetIdx, 0, moved);
      setCategories(arr);
      localStorage.setItem('master_cats', JSON.stringify(arr));
    } else if (type === 'pic') {
      const arr = [...pics];
      const [moved] = arr.splice(sourceIdx, 1);
      arr.splice(targetIdx, 0, moved);
      setPics(arr);
      localStorage.setItem('master_pics', JSON.stringify(arr));
    } else if (type === 'status') {
      const arr = [...statuses];
      const [moved] = arr.splice(sourceIdx, 1);
      arr.splice(targetIdx, 0, moved);
      setStatuses(arr);
      localStorage.setItem('master_statuses', JSON.stringify(arr));
    } else if (type === 'priority') {
      const arr = [...priorities];
      const [moved] = arr.splice(sourceIdx, 1);
      arr.splice(targetIdx, 0, moved);
      setPriorities(arr);
      localStorage.setItem('master_priorities', JSON.stringify(arr));
    } else if (type === 'location') {
      const arr = [...locations];
      const [moved] = arr.splice(sourceIdx, 1);
      arr.splice(targetIdx, 0, moved);
      setLocations(arr);
      localStorage.setItem('master_locations', JSON.stringify(arr));
    }
    setDraggedIdx(null);
  };

  // Avatar Handler
  const handleAvatarSave = (base64: string) => {
    if (!activePicForAvatar) return;
    const updated = { ...masterPicAvatars, [activePicForAvatar]: base64 };
    setMasterPicAvatars(updated);
    localStorage.setItem('master_pic_avatars', JSON.stringify(updated));
    setActivePicForAvatar(null);
    toast.success(`Foto profil ${activePicForAvatar} diperbarui`);
  };

  // Database Handlers
  const handleBackupDatabase = async () => {
    const toastId = toast.loading('Sedang mengunduh seluruh data (database & file)...');
    try {
      const res = await fetch('/api/database');
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gagal mengambil backup: HTTP ${res.status} ${errText.substring(0, 100)}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_Database_Pekerjaan_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      toast.dismiss(toastId);
      toast.success('Backup berhasil diunduh!');
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Gagal mengunduh backup');
    }
  };

  const handleRestoreDatabase = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!confirm('PERINGATAN: Mengimpor database akan MENIMPA/MENGHAPUS seluruh data pekerjaan dan pengaturan yang ada saat ini. Pastikan Anda sudah membackup data Anda. Anda yakin ingin melanjutkan?')) {
        return;
      }

      setLoading(true);
      const toastId = toast.loading('Sedang memulihkan database dari backup...');
      try {
        let res;
        if (file.name.endsWith('.json')) {
          const text = await file.text();
          const data = JSON.parse(text);
          res = await fetch('/api/database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        } else {
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (!isLocalhost && file.size > 4 * 1024 * 1024) {
            const { upload } = await import('@vercel/blob/client');
            toast.loading('Mengunggah file backup (tahap 1/2)...', { id: toastId });
            const blob = await upload(file.name, file, {
              access: 'public',
              handleUploadUrl: '/api/upload/token',
            });
            toast.loading('Memulihkan database (tahap 2/2)...', { id: toastId });
            res = await fetch('/api/database', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ blobUrl: blob.url })
            });
          } else {
            const arrayBuffer = await file.arrayBuffer();
            res = await fetch('/api/database', {
              method: 'POST',
              headers: { 'Content-Type': 'application/zip' },
              body: arrayBuffer
            });
          }
        }

        toast.dismiss(toastId);
        if (res.ok) {
          const result = await res.json();
          toast.success(result.message || 'Database berhasil dipulihkan!');
          window.alert(`✅ BERHASIL!\n\n${result.message || 'Database berhasil dipulihkan!'}`);
          window.location.reload();
        } else {
          let err: any = {};
          try { err = await res.json(); } catch(e) { err.message = await res.text(); }
          let errMsg = err.error || err.message || 'Gagal memulihkan database';
          if (typeof errMsg === 'object') errMsg = errMsg.message || JSON.stringify(errMsg);
          toast.error(errMsg);
        }
      } catch (err: any) {
        toast.dismiss(toastId);
        toast.error(`Gagal memulihkan database: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  // Reusable Master Data List Editor Renderer
  const renderListEditor = (
    title: string,
    type: ListType,
    items: string[],
    inputVal: string,
    setInputVal: (v: string) => void,
    icon: React.ReactNode,
    subtitle?: string
  ) => {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon} {title}
          </h4>
          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', background: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>
            {items.length} Item
          </span>
        </div>

        {subtitle && (
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
            {subtitle}
          </p>
        )}

        {/* Add Input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            type="text"
            className="input"
            placeholder={`Tambah ${title.toLowerCase()} baru...`}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem(type, inputVal, setInputVal);
              }
            }}
            style={{ fontSize: '13px' }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleAddItem(type, inputVal, setInputVal)}
            style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', whiteSpace: 'nowrap' }}
          >
            <Plus size={16} /> Tambah
          </button>
        </div>

        {/* Items Badges & Manager */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '44px', padding: '12px', background: 'var(--input-bg)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          {items.length === 0 ? (
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '4px' }}>
              Belum ada data. Silakan ketik nama lalu klik Tambah.
            </span>
          ) : (
            items.map((item, index) => {
              const isEditing = editingItem?.type === type && editingItem.oldVal === item;
              const isDragging = draggedIdx?.type === type && draggedIdx.index === index;
              const color = masterColors[item] || (type === 'status' ? '#3b82f6' : undefined);
              const progress = masterStatusProgress[item];

              return (
                <div
                  key={item}
                  draggable={!isEditing}
                  onDragStart={() => handleDragStart(type, index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(type, index)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: isEditing ? '2px 6px' : '5px 10px',
                    borderRadius: '8px',
                    background: 'var(--surface-color)',
                    border: isDragging ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
                    fontSize: '12.5px',
                    color: 'var(--text-primary)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    opacity: isDragging ? 0.4 : 1,
                    position: 'relative'
                  }}
                >
                  <GripVertical size={13} style={{ color: 'var(--text-secondary)', cursor: 'grab', opacity: 0.6 }} />

                  {type === 'pic' && (
                    <div
                      style={{ cursor: 'pointer' }}
                      onClick={() => setActivePicForAvatar(item)}
                      title="Klik untuk ubah foto PIC"
                    >
                      <Avatar name={item} src={masterPicAvatars[item]} size={20} />
                    </div>
                  )}

                  {type === 'status' && (
                    <div
                      style={{ width: '10px', height: '10px', borderRadius: '50%', background: color || '#3b82f6', cursor: 'pointer' }}
                      onClick={() => setActiveColorPicker(activeColorPicker === item ? null : item)}
                      title="Klik untuk ubah warna status"
                    />
                  )}

                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="text"
                        className="input"
                        value={editInputValue}
                        onChange={(e) => setEditInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingItem(null);
                        }}
                        style={{ padding: '2px 6px', height: '26px', fontSize: '12px', width: '140px' }}
                        autoFocus
                      />
                      <button className="btn btn-primary" onClick={handleSaveEdit} style={{ padding: '3px 8px', fontSize: '11px' }}>
                        Simpan
                      </button>
                      <button className="btn btn-secondary" onClick={() => setEditingItem(null)} style={{ padding: '3px 6px', fontSize: '11px' }}>
                        Batal
                      </button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontWeight: 500 }}>{item}</span>

                      {type === 'status' && progress !== undefined && (
                        <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '1px 5px', borderRadius: '4px' }}>
                          {progress}%
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartEdit(type, item)}
                        style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        title="Edit & Perbarui di Seluruh Pekerjaan"
                      >
                        <Pencil size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(type, item)}
                        style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: '#ef4444' }}
                        title="Hapus Opsi"
                      >
                        <X size={13} />
                      </button>
                    </>
                  )}

                  {/* Color Picker Popover */}
                  {activeColorPicker === item && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 100,
                        marginTop: '4px',
                        background: 'var(--surface-color)',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--card-shadow)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '6px',
                        width: '150px'
                      }}
                    >
                      {PRESET_COLORS.map(c => (
                        <div
                          key={c}
                          onClick={() => {
                            const cols = { ...masterColors, [item]: c };
                            setMasterColors(cols);
                            localStorage.setItem('master_colors', JSON.stringify(cols));
                            setActiveColorPicker(null);
                          }}
                          style={{ width: '22px', height: '22px', borderRadius: '4px', background: c, cursor: 'pointer', border: color === c ? '2px solid white' : 'none' }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action Save Bar */}
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={(e) => handleSaveSettings(e as any)} 
            disabled={isSavingSettings} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '8px 14px' }}
          >
            <Save size={14} /> {isSavingSettings ? 'Menyimpan...' : 'Simpan Perubahan Master'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            Pengaturan Aplikasi
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
            Kelola preferensi antarmuka pengguna, data master dropdown, penyimpanan file, dan pemeliharaan sistem.
          </p>
        </div>

        {/* Success Notification */}
        {savedSuccess && (
          <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', borderRadius: '10px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
            <Check size={18} /> Pengaturan berhasil disimpan dan disinkronkan ke seluruh tab!
          </div>
        )}

        {/* SECTION 1: Appearance & Theme */}
        <section id="section-appearance" className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '90px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={18} color="var(--accent-primary)" /> Tampilan & Preferensi Pengguna
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Personalisasi antarmuka aplikasi sesuai dengan kenyamanan visual Anda.
            </p>
          </div>

          {/* Dark / Light Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', fontSize: '14px' }}>Mode Gelap / Terang</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Beralih antara tema gelap (Dark) atau terang (Light).</span>
            </div>
            <button className="btn btn-secondary" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', fontSize: '13px' }}>
              {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#f59e0b" />}
              {theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            </button>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)' }} />

          {/* Accent Color Selection */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                Warna Aksen (Accent Color)
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Warna utama tombol aktif, grafik, dan sorotan antarmuka.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: 'blue', color: '#3b82f6', label: 'Biru' },
                { id: 'purple', color: '#a855f7', label: 'Ungu' },
                { id: 'green', color: '#10b981', label: 'Hijau' },
                { id: 'orange', color: '#f97316', label: 'Oranye' },
                { id: 'red', color: '#ef4444', label: 'Merah' },
                { id: 'teal', color: '#14b8a6', label: 'Teal' },
              ].map(ac => (
                <button
                  key={ac.id}
                  onClick={() => setAccentColor(ac.id as any)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ac.color, border: 'none', cursor: 'pointer',
                    outline: accentColor === ac.id ? `3px solid var(--text-primary)` : 'none', outlineOffset: '2px', transition: 'all 0.2s'
                  }}
                  title={ac.label}
                />
              ))}
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)' }} />

          {/* Density Selection */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', fontSize: '14px' }}>Kerapatan Tampilan (Density)</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Atur jarak baris tabel dan spasi elemen.</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', background: 'var(--input-bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setDensity('comfortable')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer',
                  background: density === 'comfortable' ? 'var(--surface-color)' : 'transparent',
                  color: density === 'comfortable' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: density === 'comfortable' ? 'var(--card-shadow)' : 'none',
                }}
              >
                Nyaman (Comfortable)
              </button>
              <button
                onClick={() => setDensity('compact')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer',
                  background: density === 'compact' ? 'var(--surface-color)' : 'transparent',
                  color: density === 'compact' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: density === 'compact' ? 'var(--card-shadow)' : 'none',
                }}
              >
                Padat (Compact)
              </button>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)' }} />

          {/* Focus Mode (Zen Mode) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', fontSize: '14px' }}>Mode Fokus (Zen Mode)</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sembunyikan bilah navigasi samping untuk tampilan layar penuh saat presentasi.</span>
            </div>
            <button className="btn btn-primary" onClick={toggleFocusMode} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', fontSize: '13px' }}>
              <Maximize size={16} /> Aktifkan Mode Fokus
            </button>
          </div>
        </section>

        {/* SECTION 2: App Identity & Branding */}
        {canSystemConfig && (
          <section id="section-branding" className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '90px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layout size={18} color="var(--accent-primary)" /> Identitas Aplikasi & Branding Departemen
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Ubah nama sistem, subtitle departemen, serta logo yang tampil di header dan laporan PDF/Excel.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Nama Aplikasi</label>
                <input
                  type="text"
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  className="input"
                  placeholder="DeptMonitor"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Nama Departemen / Sub-Unit</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  className="input"
                  placeholder="Contoh: MRK atau Divisi TI & Sistem Informasi"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Logo Aplikasi</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {appLogo ? <img src={appLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Layout size={24} color="var(--text-secondary)" />}
                </div>
                <button className="btn btn-secondary" onClick={() => setIsAppLogoCropperOpen(true)}>
                  <Camera size={16} /> Ubah Logo
                </button>
                {appLogo && (
                  <button className="btn btn-danger" onClick={() => setAppLogo('')} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                    Hapus Logo
                  </button>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Format gambar persegi (1:1) berukuran minimal 128x128 pixel untuk hasil tampilan tajam di kop laporan.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={(e) => handleSaveSettings(e as any)} className="btn btn-primary" disabled={isSavingSettings} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px' }}>
                <Save size={15} /> {isSavingSettings ? 'Menyimpan...' : 'Simpan Identitas Aplikasi'}
              </button>
            </div>
          </section>
        )}

        {/* SECTION 3: Master Data Pekerjaan */}
        {canMasterData && (
          <section id="section-master" className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '90px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={18} color="var(--accent-primary)" /> Master Opsi Data Pekerjaan
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Kelola daftar pilihan dropdown yang muncul saat pembuatan tugas baru dan filter monitoring.
              </p>
            </div>

            {/* Sub-Tabs for Master Data Items */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'cat' as ListType, label: 'Kategori Agenda', count: categories.length, icon: Tag },
                { id: 'pic' as ListType, label: 'Master PIC & Personil', count: pics.length, icon: Users },
                { id: 'status' as ListType, label: 'Status & Progres %', count: statuses.length, icon: Tag },
                { id: 'priority' as ListType, label: 'Tingkat Prioritas', count: priorities.length, icon: Tag },
                { id: 'location' as ListType, label: 'Lokasi & Ruang Rapat', count: locations.length, icon: MapPin },
              ].map(sub => {
                const isSubActive = activeMasterSubTab === sub.id;
                const SubIcon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveMasterSubTab(sub.id)}
                    className={`btn ${isSubActive ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '7px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
                  >
                    <SubIcon size={14} /> {sub.label} <span style={{ opacity: 0.8, fontWeight: 700 }}>({sub.count})</span>
                  </button>
                );
              })}
            </div>

            {/* Sub Tab Content */}
            {activeMasterSubTab === 'cat' && renderListEditor(
              "Master Kategori Pekerjaan", 'cat', categories, newCatInput, setNewCatInput,
              <Tag size={18} color="var(--accent-primary)" />,
              "Pilihan kategori agenda/pekerjaan yang muncul di dropdown dan filter sistem."
            )}

            {activeMasterSubTab === 'pic' && renderListEditor(
              "Master PIC & Personil", 'pic', pics, newPicInput, setNewPicInput,
              <Users size={18} color="var(--accent-primary)" />,
              "Daftar nama penanggung jawab (PIC) yang muncul pada form tugas dan penugasan tim."
            )}

            {activeMasterSubTab === 'status' && renderListEditor(
              "Master Status Pekerjaan", 'status', statuses, newStatusInput, setNewStatusInput,
              <Tag size={18} color="var(--accent-primary)" />,
              "Kolom status pada Kanban Board dan alur progres tahapan pekerjaan."
            )}

            {activeMasterSubTab === 'priority' && renderListEditor(
              "Master Tingkat Prioritas", 'priority', priorities, newPriorityInput, setNewPriorityInput,
              <Tag size={18} color="var(--accent-primary)" />,
              "Tingkat urgensi pekerjaan untuk klasifikasi matriks risiko dan filter."
            )}

            {activeMasterSubTab === 'location' && renderListEditor(
              "Master Lokasi & Ruang Rapat", 'location', locations, newLocationInput, setNewLocationInput,
              <MapPin size={18} color="var(--accent-primary)" />,
              "Daftar nama ruang rapat, gedung, atau link Zoom meeting untuk opsi auto-complete form pekerjaan."
            )}
          </section>
        )}

        {/* SECTION 4: Storage & Files */}
        {canSystemConfig && (
          <section id="section-storage" className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '90px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HardDrive size={18} color="var(--accent-primary)" /> Penyimpanan & Batas Unggah File
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Konfigurasi batas kapasitas file lampiran yang langsung disinkronkan secara <em>real-time</em> ke seluruh form upload.
              </p>
            </div>

            <form onSubmit={(e) => handleSaveSettings(e as any)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Maksimal Ukuran per File Lampiran (MB) *
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={maxFileSizeMb}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxFileSizeMb(e.target.value)}
                    placeholder="25"
                    min="1"
                    required
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    Batas per satu file dokumen/lampiran yang diupload PIC.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Maksimal Total Ukuran File per Pekerjaan (MB)
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={maxTaskFilesSizeMb}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxTaskFilesSizeMb(e.target.value)}
                    placeholder="100"
                    min="1"
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    Akumulasi total seluruh file lampiran pada satu tugas pekerjaan.
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '6px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Kapasitas Maksimal Storage Keseluruhan Aplikasi (MB)
                </label>
                <input
                  type="number"
                  className="input"
                  value={maxTotalStorageMb}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxTotalStorageMb(e.target.value)}
                  placeholder="5000"
                  min="1"
                  style={{ maxWidth: '300px' }}
                />

                {/* Live Storage Progress Bar */}
                <div style={{ marginTop: '16px', background: 'var(--surface-color)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600, flexWrap: 'wrap', gap: '8px' }}>
                    <span>
                      {isLoadingStorage ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '12.5px', fontWeight: 500 }}>
                          <Loader2 size={14} className="animate-spin" /> Menghitung ukuran penyimpanan...
                        </span>
                      ) : (
                        <span>
                          Penyimpanan Terpakai: <strong style={{ color: 'var(--accent-primary)' }}>{storageUsedMb.toFixed(2)} MB</strong>
                          {storageUsedMb === 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '6px' }}>
                              (Belum ada file lampiran)
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kapasitas: {maxTotalStorageMb} MB</span>
                      <button
                        type="button"
                        onClick={fetchStorageUsage}
                        disabled={isLoadingStorage}
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '6px' }}
                        title="Hitung Ulang Penggunaan Storage"
                      >
                        <RefreshCw size={11} className={isLoadingStorage ? 'animate-spin' : ''} /> Hitung Ulang
                      </button>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    {isLoadingStorage ? (
                      <div style={{
                        height: '100%',
                        width: '100%',
                        background: 'linear-gradient(90deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.8) 50%, rgba(59,130,246,0.2) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'pulse 1.5s infinite'
                      }} />
                    ) : (
                      <div style={{
                        height: '100%',
                        background: (storageUsedMb / (Number(maxTotalStorageMb) || 1)) > 0.9 ? 'var(--danger)' : 'var(--accent-primary)',
                        width: `${Math.min((storageUsedMb / (Number(maxTotalStorageMb) || 1)) * 100, 100)}%`,
                        transition: 'width 0.3s'
                      }} />
                    )}
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                    {isLoadingStorage ? (
                      'Sedang memeriksa seluruh direktori file lampiran...'
                    ) : (
                      <>Sisa kapasitas penyimpanan yang tersedia: <strong style={{ color: 'var(--text-primary)' }}>{Math.max((Number(maxTotalStorageMb) || 0) - storageUsedMb, 0).toFixed(2)} MB</strong></>
                    )}
                  </p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={isSavingSettings} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px' }}>
                  <Save size={15} /> {isSavingSettings ? 'Menyimpan...' : 'Simpan Konfigurasi Storage'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* SECTION 5: Security & Session */}
        {canSystemConfig && (
          <section id="section-security" className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '90px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--accent-primary)" /> Keamanan & Batas Waktu Sesi
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Atur durasi kedaluwarsa login otomatis dan pengingat keamanan akun.
              </p>
            </div>

            <form onSubmit={(e) => handleSaveSettings(e as any)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Batas Waktu Sesi Login Maksimal (Token Expiration)
                </label>
                <select
                  className="input"
                  value={sessionTimeoutHours}
                  onChange={(e) => setSessionTimeoutHours(e.target.value)}
                  style={{ maxWidth: '320px' }}
                >
                  <option value={1}>1 Jam</option>
                  <option value={12}>12 Jam</option>
                  <option value={24}>24 Jam (1 Hari) - Rekomendasi</option>
                  <option value={168}>7 Hari (1 Minggu)</option>
                  <option value={720}>30 Hari (1 Bulan)</option>
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Batas durasi sesi login sebelum token kedaluwarsa dan pengguna diminta masuk kembali.
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Waktu Sisa Sesi Inaktif / Idle Logout (Menit)
                </label>
                <input
                  type="number"
                  className="input"
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
                  min="1"
                  max="120"
                  placeholder="10"
                  style={{ width: '140px' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Jeda waktu tanpa aktivitas (mouse, keyboard) sebelum sistem otomatis keluar demi keamanan.
                </p>
              </div>

              {/* Session Info Card */}
              {session?.user && (session.user as any).loginAt && (
                <div style={{ padding: '14px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Informasi Sesi Anda Saat Ini:</strong>
                  <div>Waktu Login: {new Date((session.user as any).loginAt).toLocaleString('id-ID')}</div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={isSavingSettings} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px' }}>
                  <Save size={15} /> {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan Keamanan'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* SECTION 6: Database & Backup */}
        {canDatabaseBackup && (
          <section id="section-backup" className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', scrollMarginTop: '90px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="var(--success)" /> Cadangan & Pemeliharaan Database
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Unduh cadangan data pekerjaan secara berkala atau pulihkan data dari file arsip cadangan sebelumnya.
              </p>
            </div>

            {/* Backup Reminder Settings */}
            <div style={{ background: 'var(--surface-color)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Jadwal Pengingat Cadangan Otomatis
              </label>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                <select
                  className="input"
                  style={{ width: 'auto', minWidth: '220px', fontWeight: 500 }}
                  value={backupReminderMode}
                  onChange={e => {
                    const val = e.target.value;
                    setBackupReminderMode(val);
                    if (val === 'custom') {
                      if (['0', '-1', ''].includes(String(backupReminderDays))) {
                        setBackupReminderDays(5);
                      }
                    } else {
                      setBackupReminderDays(Number(val));
                    }
                  }}
                >
                  <option value="0">❌ Nonaktif (Tanpa pengingat)</option>
                  <option value="-1">🔔 Setiap Kali Login</option>
                  <option value="1">⏱️ Setiap 1 Hari</option>
                  <option value="3">⏱️ Setiap 3 Hari</option>
                  <option value="7">⏱️ Setiap 7 Hari (1 Minggu) - Rekomendasi</option>
                  <option value="14">⏱️ Setiap 14 Hari (2 Minggu)</option>
                  <option value="30">⏱️ Setiap 30 Hari (1 Bulan)</option>
                  <option value="custom">⚙️ Kustom (Isi jumlah hari)</option>
                </select>

                {backupReminderMode === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      className="input"
                      value={backupReminderDays}
                      onChange={e => setBackupReminderDays(e.target.value)}
                      min="1"
                      style={{ width: '90px' }}
                      placeholder="Hari"
                      autoFocus
                    />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Hari</span>
                  </div>
                )}

                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={(e) => handleSaveSettings(e as any)} 
                  disabled={isSavingSettings}
                  style={{ padding: '8px 14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={14} /> Simpan Jadwal
                </button>
              </div>
            </div>

            {/* Backup & Restore Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button className="btn btn-secondary" onClick={handleBackupDatabase} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '13px' }}>
                <Download size={16} /> Unduh Backup Database (.zip)
              </button>
              <button className="btn btn-primary" onClick={handleRestoreDatabase} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '13px' }}>
                <Database size={16} /> {loading ? 'Memulihkan...' : 'Restore / Pulihkan Database'}
              </button>
            </div>
          </section>
        )}

      {/* Modal Croppers */}
      <AvatarCropperModal
        isOpen={!!activePicForAvatar}
        onClose={() => setActivePicForAvatar(null)}
        onSave={handleAvatarSave}
      />

      <AvatarCropperModal
        isOpen={isAppLogoCropperOpen}
        onClose={() => setIsAppLogoCropperOpen(false)}
        onSave={(base64) => {
          setAppLogo(base64);
          setIsAppLogoCropperOpen(false);
        }}
        title="Ubah Logo Aplikasi"
      />
    </div>
  );
}
