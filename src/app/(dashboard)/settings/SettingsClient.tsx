'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Download, Sun, Moon, Database, Check, Plus, X, Tag, Users, CalendarDays, Palette, Layout, Maximize, Save } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import toast from 'react-hot-toast';
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
};

export default function SettingsClient({ tasks }: { tasks: Task[] }) {
  const { theme, toggleTheme, accentColor, setAccentColor, density, setDensity, toggleFocusMode } = useTheme();
  const [deptName, setDeptName] = useState('Work Monitoring');
  const [globalPassword, setGlobalPassword] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Master State
  const [categories, setCategories] = useState<string[]>([]);
  const [pics, setPics] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  
  const [masterColors, setMasterColors] = useState<Record<string, string>>({});
  const [masterIcons, setMasterIcons] = useState<Record<string, string>>({});
  const [masterStatusProgress, setMasterStatusProgress] = useState<Record<string, number>>({});

  const [newCatInput, setNewCatInput] = useState('');
  const [newPicInput, setNewPicInput] = useState('');
  const [newStatusInput, setNewStatusInput] = useState('');
  const [newPriorityInput, setNewPriorityInput] = useState('');

  // Drag State
  const [draggedIdx, setDraggedIdx] = useState<{ type: string, index: number } | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.master_categories) setCategories(data.master_categories);
        if (data.master_pics) setPics(data.master_pics);
        if (data.master_statuses) setStatuses(data.master_statuses);
        if (data.master_priorities) setPriorities(data.master_priorities);
        if (data.master_colors) setMasterColors(data.master_colors);
        if (data.master_icons) setMasterIcons(data.master_icons);
        if (data.master_status_progress) setMasterStatusProgress(data.master_status_progress);
        if (data.dept_name) setDeptName(data.dept_name);
      })
      .catch(e => console.error(e));
  }, []);

  // Common List Updaters
  type ListType = 'cat' | 'pic' | 'status' | 'priority';

  const updateList = (type: ListType, updater: (prev: string[]) => string[]) => {
    let key = '';
    if (type === 'cat') key = 'master_categories';
    if (type === 'pic') key = 'master_pics';
    if (type === 'status') key = 'master_statuses';
    if (type === 'priority') key = 'master_priorities';

    const setFunc = type === 'cat' ? setCategories : type === 'pic' ? setPics : type === 'status' ? setStatuses : setPriorities;
    
    setFunc(prev => {
      const next = updater(prev as any);
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next })
      });
      return next as any;
    });
  };

  const sortList = (type: ListType, dir: 'asc'|'desc') => {
    updateList(type, prev => [...prev].sort((a, b) => dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)));
  };

  const transformList = (type: ListType, transform: 'upper'|'lower'|'proper') => {
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

  const handleColorChange = (type: ListType, val: string, color: string) => {
    const newColors = { ...masterColors, [`${type}_${val}`]: color };
    setMasterColors(newColors);
  };

  const handleProgressChange = (val: string, progress: number) => {
    const newProgress = { ...masterStatusProgress, [val]: progress };
    setMasterStatusProgress(newProgress);
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
            draggable
            onDragStart={(e) => handleDragStart(e, type, idx)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, type, idx)}
            onDragEnd={() => setDraggedIdx(null)}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', 
              background: masterColors[`${type}_${s}`] || (draggedIdx?.type === type && draggedIdx.index === idx ? 'var(--accent-primary)' : 'var(--surface-color)'), 
              border: '1px solid var(--border-color)', fontSize: '13px', fontWeight: 500,
              color: masterColors[`${type}_${s}`] ? 'white' : (draggedIdx?.type === type && draggedIdx.index === idx ? 'white' : 'var(--text-primary)'), cursor: 'grab' 
            }}
          >
            {s}
            {type === 'status' && (
              <input 
                type="number"
                min="0"
                max="100"
                placeholder="%"
                value={masterStatusProgress[s] ?? ''}
                onChange={(e) => handleProgressChange(s, parseInt(e.target.value) || 0)}
                style={{
                  width: '40px', padding: '2px 4px', fontSize: '12px', borderRadius: '4px',
                  border: '1px solid var(--border-color)', background: 'var(--surface-color)',
                  color: 'var(--text-primary)', marginLeft: '4px'
                }}
                title="Persentase Progress Otomatis (0-100)"
              />
            )}
            <input 
              type="color" 
              value={masterColors[`${type}_${s}`] || '#ffffff'} 
              onChange={(e) => handleColorChange(type, s, e.target.value)}
              style={{ width: '20px', height: '20px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '50%' }}
              title="Ubah Warna"
            />
            <button 
              type="button" onClick={() => handleDelete(type, s)} 
              style={{ background: 'none', border: 'none', color: masterColors[`${type}_${s}`] || (draggedIdx?.type === type && draggedIdx.index === idx) ? 'white' : 'var(--danger)', cursor: 'pointer', padding: '0', display: 'flex' }}
            ><X size={14} /></button>
          </span>
        ))}
      </div>
    </>
  );

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('master_categories', JSON.stringify(categories));
    localStorage.setItem('master_pics', JSON.stringify(pics));
    localStorage.setItem('master_statuses', JSON.stringify(statuses));
    localStorage.setItem('master_priorities', JSON.stringify(priorities));
    localStorage.setItem('master_colors', JSON.stringify(masterColors));
    localStorage.setItem('master_icons', JSON.stringify(masterIcons));
    localStorage.setItem('master_status_progress', JSON.stringify(masterStatusProgress));
    
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        dept_name: deptName, 
        master_categories: categories,
        master_pics: pics,
        master_statuses: statuses,
        master_priorities: priorities,
        master_colors: masterColors,
        master_icons: masterIcons,
        master_status_progress: masterStatusProgress
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

  const handleBackupDatabase = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Database_Pekerjaan_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', position: 'sticky', top: '0', zIndex: 10, background: 'var(--bg-color)', padding: '16px 0', borderBottom: '1px solid var(--border-color)', margin: '-24px 0 0 0' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Pengaturan Aplikasi</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Kelola preferensi antarmuka, master opsi dropdown kategori, daftar PIC, dan cadangan data aplikasi.
          </p>
        </div>
        <button onClick={handleSaveSettings} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)' }}>
          <Save size={18} /> Simpan Perubahan
        </button>
      </div>

      {savedSuccess && (
        <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', borderRadius: '10px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Check size={18} /> Pengaturan berhasil disimpan!
        </div>
      )}

      {/* Theme Settings Card */}
      <div className="glass" style={{ padding: '24px' }}>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layout size={16} color="var(--accent-primary)" /> Kerapatan Tampilan (Display Density)
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sesuaikan jarak dan kepadatan elemen (spasi baris).</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'var(--input-bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Maximize size={16} color="var(--accent-primary)" /> Mode Fokus (Zen Mode)
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sembunyikan menu samping untuk layar penuh. Berguna saat presentasi.</span>
          </div>

          <button className="btn btn-primary" onClick={toggleFocusMode} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Maximize size={16} /> Aktifkan Mode Fokus
          </button>
        </div>
      </div>

      {/* Dropdown Master Categories Manager */}
      <div className="glass" style={{ padding: '24px' }}>
        {renderListEditor(
          "Master Dropdown Kategori Pekerjaan", 'cat', categories, newCatInput, setNewCatInput,
          <Tag size={20} color="var(--accent-primary)" />
        )}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          Kelola pilihan opsi kategori yang muncul otomatis (*auto-suggest*) saat menambah atau mengedit pekerjaan.
        </p>
      </div>

      {/* Dropdown Master PIC Manager */}
      <div className="glass" style={{ padding: '24px' }}>
        {renderListEditor(
          "Master Dropdown PIC / Personil", 'pic', pics, newPicInput, setNewPicInput,
          <Users size={20} color="var(--accent-primary)" />
        )}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          Kelola daftar nama PIC yang muncul di pilihan dropdown auto-suggest form pekerjaan.
        </p>
      </div>

      <div className="glass" style={{ padding: '24px' }}>
        {renderListEditor(
          "Master Status Pekerjaan", 'status', statuses, newStatusInput, setNewStatusInput,
          <Tag size={20} color="var(--accent-primary)" />
        )}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Kolom-kolom di Monitoring Board (Kanban) dan pilihan status secara sistem menyesuaikan pengaturan ini.</p>
      </div>

      <div className="glass" style={{ padding: '24px' }}>
        {renderListEditor(
          "Master Prioritas Pekerjaan", 'priority', priorities, newPriorityInput, setNewPriorityInput,
          <Tag size={20} color="var(--accent-primary)" />
        )}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Opsi tingkat prioritas untuk pekerjaan.</p>
      </div>

      {/* General Settings */}
      <div className="glass" style={{ padding: '24px' }}>
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
              onChange={e => setDeptName(e.target.value)}
              placeholder="Contoh: Divisi TI & Sistem Informasi"
            />
          </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Ubah Password Global (Opsional)
              </label>
              <input 
                type="password"
                className="input" 
                value={globalPassword}
                onChange={e => setGlobalPassword(e.target.value)}
                placeholder="Kosongkan jika tidak ingin mengubah sandi"
              />
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Password baru akan menimpa password environment bawaan.</p>
            </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Simpan Pengaturan
          </button>
        </form>
      </div>

      {/* Auto Sync Google Calendar / iCal Feed */}
      <div className="glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarDays size={20} color="#4285F4" /> Sinkronisasi Otomatis Google Calendar / Outlook (URL Feed)
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Berlangganan (*subscribe*) kalender aplikasi secara langsung di Google Calendar atau Microsoft Outlook agar seluruh jadwal ter-update otomatis secara *real-time*.
        </p>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              const feedUrl = `${window.location.origin}/calendar.ics`;
              import('@/utils/clipboard').then(({ copyToClipboard }) => {
                copyToClipboard(feedUrl);
                alert(`URL Sinkronisasi Kalender Berhasil Disalin!\n\n${feedUrl}\n\nCara Pakai di Google Calendar:\n1. Buka Google Calendar\n2. Klik + di samping 'Other calendars'\n3. Pilih 'From URL'\n4. Tempel (Paste) URL ini & klik 'Add calendar'`);
              });
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <CalendarDays size={16} /> Salin URL Feed Kalender (.ics)
          </button>
        </div>
      </div>

      {/* Backup & Export Database */}
      <div className="glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="var(--success)" /> Cadangan & Export Data Database
        </h3>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Unduh seluruh salinan data pekerjaan dalam format JSON untuk cadangan (*backup*) aman.
        </p>

        <button className="btn btn-secondary" onClick={handleBackupDatabase} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} /> Download Backup Database (.json)
        </button>
      </div>
    </div>
  );
}
