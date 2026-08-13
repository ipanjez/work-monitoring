'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Settings, Shield, Download, Sun, Moon, Database, Check, Plus, X, Tag, Users, CalendarDays, Palette, Layout, Maximize, Save, HelpCircle, MapPin, Pencil, Camera } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import toast from 'react-hot-toast';
import AvatarCropperModal from '@/components/AvatarCropperModal';
import Avatar from '@/components/Avatar';
type Task = {
  id: number;
  nama: string;
  pic: string;
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

export default function SettingsClient({ tasks }: { tasks: Task[] }) {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const { theme, toggleTheme, accentColor, setAccentColor, density, setDensity, toggleFocusMode } = useTheme();
  const [deptName, setDeptName] = useState('MRK');
  const [appName, setAppName] = useState('DeptMonitor');
  const [appLogo, setAppLogo] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState<number | string>(25);
  const [maxTaskFilesSizeMb, setMaxTaskFilesSizeMb] = useState<number | string>(100);
  const [maxTotalStorageMb, setMaxTotalStorageMb] = useState<number | string>(5000);
  const [storageUsedMb, setStorageUsedMb] = useState<number>(0);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState<number | string>(720);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<number | string>(10);

  // Master State
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

  // Profile State for logged-in user
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileNpk, setProfileNpk] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

  const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#71717a', '#737373'
  ];

  // Fetch initial data
  useEffect(() => {
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
        if (data.dept_name) setDeptName(data.dept_name);
        if (data.app_name) setAppName(data.app_name);
        if (data.app_subtitle) setDeptName(data.app_subtitle);
        if (data.app_logo) setAppLogo(data.app_logo);
        if (data.max_file_size_mb) setMaxFileSizeMb(data.max_file_size_mb);
        if (data.max_task_files_size_mb) setMaxTaskFilesSizeMb(data.max_task_files_size_mb);
        if (data.max_total_storage_mb) setMaxTotalStorageMb(data.max_total_storage_mb);
        if (data.session_timeout_hours) setSessionTimeoutHours(data.session_timeout_hours);
        if (data.session_timeout !== undefined) setSessionTimeoutMinutes(data.session_timeout);
      })
      .catch(e => console.error(e));

    // Fetch Storage stats
    fetch('/api/settings/storage')
      .then(res => res.json())
      .then(data => {
        if (data.usedMb !== undefined) setStorageUsedMb(data.usedMb);
      })
      .catch(e => console.error(e));

    // Fetch user profile
    fetch('/api/users/profile')
      .then(res => res.json())
      .then(data => {
        if (data.name) setProfileName(data.name);
        if (data.email) setProfileEmail(data.email || '');
        if (data.npk) setProfileNpk(data.npk);
      })
      .catch(e => console.error(e));
  }, []);

  // Common List Updaters
  type ListType = 'cat' | 'pic' | 'status' | 'priority' | 'location';

  const updateList = (type: ListType, updater: (prev: string[]) => string[]) => {
    let key = '';
    if (type === 'cat') key = 'master_categories';
    if (type === 'pic') key = 'master_pics';
    if (type === 'status') key = 'master_statuses';
    if (type === 'priority') key = 'master_priorities';
    if (type === 'location') key = 'master_locations';

    const setFunc =
      type === 'cat' ? setCategories :
        type === 'pic' ? setPics :
          type === 'status' ? setStatuses :
            type === 'priority' ? setPriorities :
              setLocations;

    (setFunc as React.Dispatch<React.SetStateAction<string[]>>)((prev: string[]) => {
      const next = updater(prev as any);
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next })
      });
      return next as any;
    });
  };

  const sortList = (type: ListType, dir: 'asc' | 'desc') => {
    updateList(type, prev => [...prev].sort((a, b) => dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)));
  };

  const transformList = (type: ListType, transform: 'upper' | 'lower' | 'proper') => {
    updateList(type, prev => prev.map(s => {
      if (transform === 'upper') return s.toUpperCase();
      if (transform === 'lower') return s.toLowerCase();
      return s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    }));
  };

  const handleDragStart = (e: React.DragEvent, type: ListType, index: number) => {
    setDraggedIdx({ type, index });
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, type: ListType, dropIndex: number) => {
    e.preventDefault();
    if (!draggedIdx || draggedIdx.type !== type || draggedIdx.index === dropIndex) return;

    updateList(type, prev => {
      const next = [...prev];
      const [moved] = next.splice(draggedIdx.index, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    if (categories.includes(newCatInput.trim())) return;
    updateList('cat', prev => [...prev, newCatInput.trim()]);
    setNewCatInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (confirm(`Hapus kategori ${cat}?`)) {
      updateList('cat', prev => prev.filter(c => c !== cat));
    }
  };

  const handleAddPic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPicInput.trim()) return;
    if (pics.includes(newPicInput.trim())) return;
    updateList('pic', prev => [...prev, newPicInput.trim()]);
    setNewPicInput('');
  };

  const handleRemovePic = (p: string) => {
    if (confirm(`Hapus PIC ${p}?`)) {
      updateList('pic', prev => prev.filter(c => c !== p));
    }
  };

  const { addActivityLog } = useNotifications();

  const handleAdd = (e: React.FormEvent, type: ListType, val: string, setVal: any, list: string[]) => {
    e.preventDefault();
    if (!val.trim() || list.includes(val.trim())) return;
    updateList(type, prev => [...prev, val.trim()]);
    if (addActivityLog) addActivityLog('ADD_MASTER', `Tambah Master ${type}`, `Menambahkan item "${val.trim()}" ke master ${type}`, 'info');
    setVal('');
  };

  const handleDelete = (type: ListType, val: string) => {
    if (confirm(`Hapus ${val}?`)) {
      updateList(type, prev => prev.filter(x => x !== val));
      if (addActivityLog) addActivityLog('DELETE_MASTER', `Hapus Master ${type}`, `Menghapus item "${val}" dari master ${type}`, 'danger');
    }
  };

  const handleRename = async (type: ListType, oldVal: string, newVal: string) => {
    if (!newVal.trim() || newVal.trim() === oldVal) {
      setEditingItem(null);
      return;
    }

    // Optimistic UI update
    const setFunc =
      type === 'cat' ? setCategories :
        type === 'pic' ? setPics :
          type === 'status' ? setStatuses :
            type === 'priority' ? setPriorities :
              setLocations;

    (setFunc as React.Dispatch<React.SetStateAction<string[]>>)(prev => {
      const arr = [...prev];
      const index = arr.indexOf(oldVal);
      if (index !== -1) arr[index] = newVal.trim();
      return arr;
    });

    // Color UI Update
    const oldColorKey = `${type}_${oldVal}`;
    const newColorKey = `${type}_${newVal.trim()}`;
    if (masterColors[oldColorKey]) {
      setMasterColors(prev => {
        const next = { ...prev };
        next[newColorKey] = next[oldColorKey];
        delete next[oldColorKey];
        return next;
      });
    }

    if (type === 'status' && masterStatusProgress[oldVal] !== undefined) {
      setMasterStatusProgress(prev => {
        const next = { ...prev };
        next[newVal.trim()] = next[oldVal];
        delete next[oldVal];
        return next;
      });
    }

    if (type === 'pic' && masterPicAvatars[oldVal] !== undefined) {
      setMasterPicAvatars(prev => {
        const next = { ...prev };
        next[newVal.trim()] = next[oldVal];
        delete next[oldVal];
        return next;
      });
    }

    setEditingItem(null);
    const loadingToast = toast.loading('Memperbarui nama di semua pekerjaan...');

    try {
      const res = await fetch('/api/settings/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listType: type, oldValue: oldVal, newValue: newVal.trim() })
      });
      if (res.ok) {
        toast.success('Berhasil mengubah master data', { id: loadingToast });
        if (addActivityLog) addActivityLog('EDIT_MASTER', `Edit Master ${type}`, `Mengubah item "${oldVal}" menjadi "${newVal.trim()}" di master ${type}`, 'info');
      } else {
        toast.error('Gagal memperbarui', { id: loadingToast });
      }
    } catch (e) {
      toast.error('Terjadi kesalahan', { id: loadingToast });
    }
  };

  const handleColorChange = (type: ListType, val: string, color: string) => {
    const newColors = { ...masterColors, [`${type}_${val}`]: color };
    setMasterColors(newColors);
  };

  const handleProgressChange = (val: string, progress: number) => {
    const newProgress = { ...masterStatusProgress, [val]: progress };
    setMasterStatusProgress(newProgress);
  };

  const handleAvatarSave = (base64Image: string) => {
    if (activePicForAvatar) {
      setMasterPicAvatars(prev => {
        const next = { ...prev, [activePicForAvatar]: base64Image };
        // Save to backend immediately
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ master_pic_avatars: next })
        }).then(() => {
          // Update localStorage and notify MasterContext
          localStorage.setItem('master_pic_avatars', JSON.stringify(next));
          window.dispatchEvent(new Event('masterUpdated'));
          toast.success('Foto profil berhasil disimpan');
        });
        return next;
      });
    }
  };

  const renderListEditor = (title: string, type: ListType, list: string[], val: string, setVal: any, icon: React.ReactNode) => (
    <>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon} {title}
      </h3>
      <form onSubmit={(e) => handleAdd(e, type, val, setVal, list)} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input className="input" placeholder="Tambah baru..." value={val} onChange={e => setVal(e.target.value)} />
        <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}><Plus size={16} /> Tambah</button>
      </form>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => sortList(type, 'asc')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Sort A-Z</button>
        <button type="button" onClick={() => sortList(type, 'desc')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Sort Z-A</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {list.map((s, idx) => (
          <span
            key={s}
            draggable={editingItem?.type !== type || editingItem?.oldVal !== s}
            onDragStart={(e: React.DragEvent) => handleDragStart(e, type, idx)}
            onDragOver={(e: React.DragEvent) => handleDragOver(e)}
            onDrop={(e: React.DragEvent) => handleDrop(e, type, idx)}
            onDragEnd={() => setDraggedIdx(null)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px',
              background: (() => {
                const c = masterColors[`${type}_${s}`];
                if (c && c !== '#ffffff') {
                  const base = c.length === 9 ? c.substring(0, 7) : c;
                  return `color-mix(in srgb, ${base} 15%, transparent)`;
                }
                return draggedIdx?.type === type && draggedIdx.index === idx ? 'color-mix(in srgb, var(--accent-primary) 15%, transparent)' : 'var(--surface-color)';
              })(),
              border: (() => {
                const c = masterColors[`${type}_${s}`];
                if (c && c !== '#ffffff') {
                  const base = c.length === 9 ? c.substring(0, 7) : c;
                  return `1px solid ${base}`;
                }
                return draggedIdx?.type === type && draggedIdx.index === idx ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)';
              })(),
              fontSize: '13px', fontWeight: 500,
              color: (() => {
                const c = masterColors[`${type}_${s}`];
                if (c && c !== '#ffffff') {
                  return c.length === 9 ? c.substring(0, 7) : c;
                }
                return (draggedIdx?.type === type && draggedIdx.index === idx ? 'var(--accent-primary)' : 'var(--text-primary)');
              })(), cursor: editingItem?.type === type && editingItem?.oldVal === s ? 'default' : 'grab', position: 'relative'
            }}
          >
            {editingItem?.type === type && editingItem?.oldVal === s ? (
              <input
                type="text"
                autoFocus
                value={editInputValue}
                onChange={e => setEditInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRename(type, s, editInputValue);
                  } else if (e.key === 'Escape') {
                    setEditingItem(null);
                  }
                }}
                onBlur={() => handleRename(type, s, editInputValue)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', fontSize: '13px', fontWeight: 500, width: `${Math.max(editInputValue.length * 8, 50)}px` }}
              />
            ) : (
              <>{s}</>
            )}

            {type === 'status' && (
              <input
                type="number"
                min="0"
                max="100"
                value={masterStatusProgress[s] ?? 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleProgressChange(s, Number(e.target.value))}
                style={{ width: '40px', padding: '2px 4px', fontSize: '11px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                title="Persentase Progress Otomatis (0-100)"
              />
            )}

            {editingItem?.type !== type || editingItem?.oldVal !== s ? (
              <>
                {type === 'pic' && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setActivePicForAvatar(s);
                    }}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', marginLeft: '4px', zIndex: 2 }}
                    title="Ubah Foto Profil PIC"
                  >
                    {masterPicAvatars[s] ? (
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', overflow: 'hidden' }}>
                        <img src={masterPicAvatars[s]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <Camera size={14} />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveColorPicker(activeColorPicker === `${type}_${s}` ? null : `${type}_${s}`)}
                  style={{ width: '16px', height: '16px', padding: '0', border: 'none', background: masterColors[`${type}_${s}`]?.substring(0, 7) || 'var(--text-secondary)', cursor: 'pointer', borderRadius: '50%', marginLeft: type === 'pic' ? '4px' : '4px' }}
                  title="Pilih Warna Template"
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem({ type, oldVal: s });
                    setEditInputValue(s);
                  }}
                  style={{ background: 'none', border: 'none', color: masterColors[`${type}_${s}`] || (draggedIdx?.type === type && draggedIdx.index === idx) ? 'white' : 'var(--text-secondary)', cursor: 'pointer', padding: '0', display: 'flex' }}
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button" onClick={() => handleDelete(type, s)}
                  style={{ background: 'none', border: 'none', color: masterColors[`${type}_${s}`] || (draggedIdx?.type === type && draggedIdx.index === idx) ? 'white' : 'var(--danger)', cursor: 'pointer', padding: '0', display: 'flex' }}
                ><X size={14} /></button>
              </>
            ) : null}

            {activeColorPicker === `${type}_${s}` && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', width: '140px', display: 'flex', flexWrap: 'wrap', gap: '6px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', marginTop: '8px' }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      handleColorChange(type, s, c);
                      setActiveColorPicker(null);
                    }}
                    style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: masterColors[`${type}_${s}`] === c ? '2px solid var(--text-primary)' : 'none', outlineOffset: '2px' }}
                    title={c}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    handleColorChange(type, s, '#ffffff');
                    setActiveColorPicker(null);
                  }}
                  style={{ width: '100%', marginTop: '4px', padding: '6px', fontSize: '11px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}
                >
                  Gunakan Default Aksen
                </button>
              </div>
            )}
          </span>
        ))}
      </div>
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <button type="button" className="btn btn-primary" onClick={handleSaveSettings} disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </>
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error('Nama wajib diisi!');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Konfirmasi password baru tidak cocok!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Profil berhasil diperbarui!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Gagal memperbarui profil.');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('master_categories', JSON.stringify(categories));
    localStorage.setItem('master_pics', JSON.stringify(pics));
    localStorage.setItem('master_statuses', JSON.stringify(statuses));
    localStorage.setItem('master_priorities', JSON.stringify(priorities));
    localStorage.setItem('master_locations', JSON.stringify(locations));
    localStorage.setItem('master_colors', JSON.stringify(masterColors));
    localStorage.setItem('master_icons', JSON.stringify(masterIcons));
    localStorage.setItem('master_status_progress', JSON.stringify(masterStatusProgress));
    localStorage.setItem('master_pic_avatars', JSON.stringify(masterPicAvatars));

    fetch('/api/settings', {
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
        session_timeout_hours: Number(sessionTimeoutHours) || 720,
        session_timeout: Number(sessionTimeoutMinutes) || 10
      })
    })
      .then(() => {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        window.dispatchEvent(new Event('deptNameChanged'));
        if (addActivityLog) addActivityLog('SAVE_SETTINGS', 'Simpan Pengaturan', 'Pengaturan aplikasi berhasil disimpan', 'success');
        toast.success('Pengaturan umum berhasil disimpan!');
      })
      .catch(console.error);
  };

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
          // Check if we are on Vercel (not localhost)
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          
          if (!isLocalhost && file.size > 4 * 1024 * 1024) {
            // Cloud Mode (Vercel) & File > 4MB: Use Vercel Blob Client Upload to bypass 4.5MB Serverless limit
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
            // Local Mode or Small File: Direct upload
            const arrayBuffer = await file.arrayBuffer();
            res = await fetch('/api/database', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/zip',
              },
              body: arrayBuffer
            });
          }
        }

        toast.dismiss(toastId);
        if (res.ok) {
          const result = await res.json();
          toast.success(result.message || 'Database berhasil dipulihkan!');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          const err = await res.json();
          toast.error(err.error || err.message || 'Gagal memulihkan database');
        }
      } catch (err) {
        toast.dismiss(toastId);
        toast.error('Gagal memulihkan database');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Pengaturan Aplikasi</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {isAdmin
            ? 'Kelola preferensi antarmuka, master opsi dropdown kategori, daftar PIC, dan cadangan data aplikasi.'
            : 'Kelola preferensi antarmuka aplikasi Anda.'}
        </p>
      </div>

      {savedSuccess && (
        <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', borderRadius: '10px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Check size={18} /> Pengaturan berhasil disimpan!
        </div>
      )}

      {/* Identitas Aplikasi Card */}
      {isAdmin && (
        <div id="settings-app-identity" className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layout size={20} color="var(--accent-primary)" /> Identitas Aplikasi
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Subjudul / Departemen</label>
              <input
                type="text"
                value={deptName}
                onChange={e => setDeptName(e.target.value)}
                className="input"
                placeholder="MRK"
              />
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
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
                  Hapus
                </button>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Gunakan gambar persegi (rasio 1:1) berukuran minimal 128x128 pixel untuk hasil terbaik.</p>
          </div>

          <button onClick={handleSaveSettings} className="btn btn-primary" style={{ marginTop: '24px' }}>
            Simpan Identitas Aplikasi
          </button>
        </div>
      )}

      {/* Theme Settings Card */}
      <div id="settings-theme" className="glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {theme === 'dark' ? <Moon size={20} color="#f59e0b" /> : <Sun size={20} color="#f59e0b" />} Tampilan & Tema
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>Mode Gelap / Terang</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pilih antara tema gelap (Dark) atau terang (Light).</span>
          </div>

          <button className="btn btn-secondary" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#f59e0b" />}
            {theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          </button>
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', marginBottom: '24px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Palette size={16} color="var(--accent-primary)" /> Warna Aksen (Accent Color)
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sesuaikan warna utama tombol dan antarmuka.</span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
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

        <div style={{ height: '1px', background: 'var(--border-color)', marginBottom: '24px' }} />

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layout size={16} color="var(--accent-primary)" /> Kerapatan Tampilan (Display Density)
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sesuaikan jarak dan kepadatan elemen (spasi baris).</span>
          </div>

          <div style={{ flexShrink: 0, display: 'flex', gap: '8px', background: 'var(--input-bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setDensity('comfortable')}
              style={{
                padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
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
                padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                background: density === 'compact' ? 'var(--surface-color)' : 'transparent',
                color: density === 'compact' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: density === 'compact' ? 'var(--card-shadow)' : 'none',
              }}
            >
              Padat (Compact)
            </button>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', marginBottom: '24px' }} />

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Maximize size={16} color="var(--accent-primary)" /> Mode Fokus (Zen Mode)
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sembunyikan menu samping untuk layar penuh. Berguna saat presentasi.</span>
          </div>

          <button className="btn btn-primary" onClick={toggleFocusMode} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Maximize size={16} /> Aktifkan Mode Fokus
          </button>
        </div>

        {/* Theme Preview Card */}
        <div style={{ marginTop: '32px', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Pratinjau Tema & Warna</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
            </div>
          </div>
          <div style={{ padding: density === 'compact' ? '16px' : '32px', background: 'var(--bg-color)', transition: 'padding 0.3s' }}>
            <div className="glass" style={{ padding: density === 'compact' ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: density === 'compact' ? '12px' : '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Kartu Contoh Pekerjaan</h4>
                <span className="badge" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>
                  In Progress (50%)
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: density === 'compact' ? 1.4 : 1.6 }}>
                Ini adalah simulasi bagaimana teks, kartu, dan tombol akan terlihat di seluruh aplikasi dengan kombinasi tema ({theme === 'dark' ? 'Gelap' : 'Terang'}) dan warna aksen pilihan Anda.
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn btn-primary">Tombol Utama</button>
                <button className="btn btn-secondary">Tombol Sekunder</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings Card */}
      <div id="settings-account" className="glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--accent-primary)" /> Pengaturan Akun
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Perbarui informasi profil pribadi dan ubah password Anda.
        </p>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                NPK (ID Pengguna)
              </label>
              <input
                type="text"
                className="input"
                value={profileNpk}
                disabled
                style={{ background: 'var(--input-bg)', cursor: 'not-allowed', opacity: 0.7 }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                * Hubungi Admin untuk melakukan perubahan NPK
              </span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nama Lengkap
              </label>
              <input
                type="text"
                className="input"
                value={profileName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />

          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Ubah Password</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '16px', flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
              Kosongkan kolom di bawah ini jika Anda tidak ingin mengubah password.
            </p>
          </div>

          <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password Saat Ini
              </label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                placeholder="Password lama Anda"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password Baru
              </label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Perbarui Profil'}
            </button>
            <Link
              href={`/auth/forgot?npk=${profileNpk}`}
              style={{ fontSize: '12px', padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600, transition: 'all 0.2s' }}
            >
              <HelpCircle size={14} /> Lupa Password Saat Ini?
            </Link>
          </div>
        </form>
      </div>

      {/* Dropdown Master Categories Manager */}
      {isAdmin && (
        <div id="settings-categories" className="glass" style={{ padding: '24px' }}>
          {renderListEditor(
            "Master Dropdown Kategori Pekerjaan", 'cat', categories, newCatInput, setNewCatInput,
            <Tag size={20} color="var(--accent-primary)" />
          )}
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Kelola pilihan opsi kategori yang muncul otomatis (*auto-suggest*) saat menambah atau mengedit pekerjaan.
          </p>
        </div>
      )}

      {/* Dropdown Master PIC Manager */}
      {isAdmin && (
        <div id="settings-pics" className="glass" style={{ padding: '24px' }}>
          {renderListEditor(
            "Master Dropdown PIC / Personil", 'pic', pics, newPicInput, setNewPicInput,
            <Users size={20} color="var(--accent-primary)" />
          )}
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Kelola daftar nama PIC yang muncul di pilihan dropdown auto-suggest form pekerjaan.
          </p>
        </div>
      )}

      {isAdmin && (
        <div id="settings-statuses" className="glass" style={{ padding: '24px' }}>
          {renderListEditor(
            "Master Status Pekerjaan", 'status', statuses, newStatusInput, setNewStatusInput,
            <Tag size={20} color="var(--accent-primary)" />
          )}
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Kolom-kolom di Monitoring Board (Kanban) dan pilihan status secara sistem menyesuaikan pengaturan ini.</p>
        </div>
      )}

      {isAdmin && (
        <div id="settings-priorities" className="glass" style={{ padding: '24px' }}>
          {renderListEditor(
            "Master Prioritas Pekerjaan", 'priority', priorities, newPriorityInput, setNewPriorityInput,
            <Tag size={20} color="var(--accent-primary)" />
          )}
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Opsi tingkat prioritas untuk pekerjaan.</p>
        </div>
      )}

      {isAdmin && (
        <div id="settings-locations" className="glass" style={{ padding: '24px' }}>
          {renderListEditor(
            "Master Lokasi Pekerjaan", 'location', locations, newLocationInput, setNewLocationInput,
            <MapPin size={20} color="var(--accent-primary)" />
          )}
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Daftar opsi lokasi pekerjaan default yang disarankan dan tervalidasi.</p>
        </div>
      )}

      {/* General Settings */}
      {isAdmin && (
        <div id="settings-general" className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} color="var(--accent-primary)" /> Pengaturan Umum
          </h3>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nama Departemen / Sub-Unit
              </label>
              <input
                className="input"
                value={deptName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeptName(e.target.value)}
                placeholder="Contoh: Divisi TI & Sistem Informasi"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Maksimal Ukuran per File Lampiran (MB)
              </label>
              <input
                type="number"
                className="input"
                value={maxFileSizeMb}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxFileSizeMb(e.target.value)}
                placeholder="Contoh: 25"
                min="1"
              />
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
                placeholder="Contoh: 100"
                min="1"
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Waktu Sisa Sesi Inaktif (Menit)
              </label>
              <input
                type="number"
                className="input"
                value={sessionTimeoutMinutes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSessionTimeoutMinutes(e.target.value)}
                placeholder="Contoh: 10"
                min="1"
              />
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Waktu maksimal (dalam menit) sebelum pengguna di-logout otomatis jika tidak ada aktivitas (mouse/keyboard).
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Kapasitas Maksimal Storage Keseluruhan Aplikasi (MB)
              </label>
              <input
                type="number"
                className="input"
                value={maxTotalStorageMb}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxTotalStorageMb(e.target.value)}
                placeholder="Contoh: 5000"
                min="1"
              />

              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <span>Penyimpanan Terpakai: {storageUsedMb.toFixed(2)} MB</span>
                  <span>Maks: {maxTotalStorageMb} MB</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: (storageUsedMb / (Number(maxTotalStorageMb) || 1)) > 0.9 ? 'var(--danger)' : 'var(--accent-primary)',
                    width: `${Math.min((storageUsedMb / (Number(maxTotalStorageMb) || 1)) * 100, 100)}%`,
                    transition: 'width 0.3s'
                  }} />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Sisa kapasitas: {Math.max((Number(maxTotalStorageMb) || 0) - storageUsedMb, 0).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Batas Waktu Sesi Login (Auto Logout)
              </label>
              <select
                className="input"
                value={sessionTimeoutHours}
                onChange={(e) => setSessionTimeoutHours(e.target.value)}
              >
                <option value={1}>1 Jam</option>
                <option value={12}>12 Jam</option>
                <option value={24}>1 Hari</option>
                <option value={168}>7 Hari</option>
                <option value={720}>30 Hari</option>
              </select>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Jika pengguna tidak aktif / menutup aplikasi melampaui batas waktu ini, sistem akan otomatis mengeluarkan (logout) pengguna tersebut.
              </p>

              {session?.user && (session.user as any).loginAt && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--background-color)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <strong>Informasi Sesi Anda:</strong><br />
                  Login pada: {new Date((session.user as any).loginAt).toLocaleString('id-ID')}<br />
                  Sisa waktu sesi Anda: {
                    (() => {
                      const expiresAt = (session.user as any).loginAt + (Number(sessionTimeoutHours) || 720) * 3600000;
                      const remainingMs = expiresAt - Date.now();
                      if (remainingMs <= 0) return 'Kedaluwarsa (akan logout)';
                      const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                      return `${days} hari, ${hours} jam, ${minutes} menit`;
                    })()
                  }
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Simpan Pengaturan
            </button>
          </form>
        </div>
      )}

      {/* Auto Sync Google Calendar / iCal Feed */}
      <div id="settings-calendar-sync" className="glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarDays size={20} color="#4285F4" /> Sinkronisasi Otomatis Google Calendar / Outlook (URL Feed)
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Berlangganan (*subscribe*) kalender aplikasi secara langsung di Google Calendar atau Microsoft Outlook agar seluruh jadwal ter-update otomatis secara *real-time*.
        </p>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={async () => {
              const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
              if (isLocal) {
                alert('Fitur Sinkronisasi Kalender tidak dapat digunakan saat aplikasi dijalankan di jaringan lokal (localhost/LAN).\n\nSilakan akses aplikasi ini melalui domain publik (seperti Vercel) agar server Google Calendar dapat menarik jadwal Anda.');
                return;
              }
              try {
                const res = await fetch('/api/calendar/token');
                const data = await res.json();
                const feedUrl = `${window.location.origin}/calendar.ics?token=${data.token}`;
                const input = document.createElement('input');
                input.value = feedUrl;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                alert('URL Kalender berhasil disalin!');
              } catch (err) {
                alert('Gagal mengambil token kalender');
              }
            }}
          >
            <CalendarDays size={16} /> Salin URL Feed Kalender (.ics)
          </button>
        </div>
      </div>

      {/* Backup & Export Database */}
      {isAdmin && (
        <div id="settings-backup" className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="var(--success)" /> Cadangan & Export Data Database
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Unduh seluruh salinan data pekerjaan dan pengaturan dalam format JSON untuk cadangan (*backup*) aman, atau pulihkan dari cadangan sebelumnya.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleBackupDatabase} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Download Backup (.zip)
            </button>
            <button className="btn btn-primary" onClick={handleRestoreDatabase} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} /> {loading ? 'Memulihkan...' : 'Restore Database'}
            </button>
          </div>
        </div>
      )}

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
