'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Download, Sun, Moon, Database, Check, Plus, X, Tag, Users, CalendarDays, Palette, Layout, Maximize } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

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
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Master Categories & PICs State
  const [categories, setCategories] = useState<string[]>([]);
  const [pics, setPics] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState('');
  const [newPicInput, setNewPicInput] = useState('');

  // Drag State
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [draggedPicIdx, setDraggedPicIdx] = useState<number | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.master_categories) setCategories(data.master_categories);
        if (data.master_pics) setPics(data.master_pics);
      })
      .catch(e => console.error(e));
  }, []);

  // Common List Updaters
  const updateList = (type: 'cat'|'pic', updater: (prev: string[]) => string[]) => {
    if (type === 'cat') {
      setCategories(prev => {
        const next = updater(prev);
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ master_categories: next })
        });
        return next;
      });
    } else {
      setPics(prev => {
        const next = updater(prev);
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ master_pics: next })
        });
        return next;
      });
    }
  };

  const sortList = (type: 'cat'|'pic', dir: 'asc'|'desc') => {
    updateList(type, prev => [...prev].sort((a, b) => dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)));
  };

  const transformList = (type: 'cat'|'pic', transform: 'upper'|'lower'|'proper') => {
    updateList(type, prev => prev.map(s => {
      if (transform === 'upper') return s.toUpperCase();
      if (transform === 'lower') return s.toLowerCase();
      return s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    }));
  };

  const handleDragStart = (e: React.DragEvent, type: 'cat'|'pic', index: number) => {
    if (type === 'cat') setDraggedCatIdx(index);
    else setDraggedPicIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, type: 'cat'|'pic', dropIndex: number) => {
    e.preventDefault();
    const draggedIdx = type === 'cat' ? draggedCatIdx : draggedPicIdx;
    if (draggedIdx === null || draggedIdx === dropIndex) return;

    updateList(type, prev => {
      const next = [...prev];
      const [moved] = next.splice(draggedIdx, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });

    if (type === 'cat') setDraggedCatIdx(null);
    else setDraggedPicIdx(null);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    if (categories.includes(newCatInput.trim())) return alert('Kategori ini sudah ada!');
    
    const updated = [...categories, newCatInput.trim()];
    setCategories(updated);
    localStorage.setItem('master_categories', JSON.stringify(updated));
    setNewCatInput('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus kategori "${catToRemove}"?`)) return;
    const updated = categories.filter(c => c !== catToRemove);
    setCategories(updated);
    localStorage.setItem('master_categories', JSON.stringify(updated));
  };

  const handleAddPic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPicInput.trim()) return;
    if (pics.includes(newPicInput.trim())) return alert('Nama PIC ini sudah ada!');

    const updated = [...pics, newPicInput.trim()];
    setPics(updated);
    localStorage.setItem('master_pics', JSON.stringify(updated));
    setNewPicInput('');
  };

  const handleRemovePic = (picToRemove: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus PIC "${picToRemove}"?`)) return;
    const updated = pics.filter(p => p !== picToRemove);
    setPics(updated);
    localStorage.setItem('master_pics', JSON.stringify(updated));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('master_categories', JSON.stringify(categories));
    localStorage.setItem('master_pics', JSON.stringify(pics));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Pengaturan Aplikasi</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Kelola preferensi antarmuka, master opsi dropdown kategori, daftar PIC, dan cadangan data aplikasi.
        </p>
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
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={20} color="var(--accent-primary)" /> Master Dropdown Kategori Pekerjaan
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Kelola pilihan opsi kategori yang muncul otomatis (*auto-suggest*) saat menambah atau mengedit pekerjaan.
        </p>

        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input 
            className="input" 
            placeholder="Tambah nama kategori baru (contoh: Logistik, QA)..." 
            value={newCatInput} 
            onChange={e => setNewCatInput(e.target.value)} 
          />
          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            <Plus size={16} /> Tambah
          </button>
        </form>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => sortList('cat', 'asc')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Sort A-Z</button>
          <button type="button" onClick={() => sortList('cat', 'desc')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Sort Z-A</button>
          <button type="button" onClick={() => transformList('cat', 'upper')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>KAPITAL</button>
          <button type="button" onClick={() => transformList('cat', 'lower')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>kecil</button>
          <button type="button" onClick={() => transformList('cat', 'proper')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Proper Case</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {categories.map((cat, idx) => (
            <span 
              key={cat} 
              draggable
              onDragStart={(e) => handleDragStart(e, 'cat', idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'cat', idx)}
              onDragEnd={() => setDraggedCatIdx(null)}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '6px 12px', 
                borderRadius: '20px', 
                background: draggedCatIdx === idx ? 'var(--accent-primary)' : 'var(--surface-color)', 
                border: '1px solid var(--border-color)', 
                fontSize: '13px',
                fontWeight: 500,
                color: draggedCatIdx === idx ? 'white' : 'var(--text-primary)',
                cursor: 'grab' 
              }}
            >
              {cat}
              <button 
                type="button" 
                onClick={() => handleRemoveCategory(cat)} 
                style={{ background: 'none', border: 'none', color: draggedCatIdx === idx ? 'white' : 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0' }}
                title="Hapus Kategori Ini"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Dropdown Master PIC Manager */}
      <div className="glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="var(--accent-primary)" /> Master Dropdown PIC / Personil
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Kelola daftar nama PIC yang muncul di pilihan dropdown auto-suggest form pekerjaan.
        </p>

        <form onSubmit={handleAddPic} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input 
            className="input" 
            placeholder="Tambah nama PIC baru (contoh: Budi Santoso)..." 
            value={newPicInput} 
            onChange={e => setNewPicInput(e.target.value)} 
          />
          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            <Plus size={16} /> Tambah
          </button>
        </form>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => sortList('pic', 'asc')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Sort A-Z</button>
          <button type="button" onClick={() => sortList('pic', 'desc')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Sort Z-A</button>
          <button type="button" onClick={() => transformList('pic', 'upper')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>KAPITAL</button>
          <button type="button" onClick={() => transformList('pic', 'lower')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>kecil</button>
          <button type="button" onClick={() => transformList('pic', 'proper')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Proper Case</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {pics.map((p, idx) => (
            <span 
              key={p} 
              draggable
              onDragStart={(e) => handleDragStart(e, 'pic', idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'pic', idx)}
              onDragEnd={() => setDraggedPicIdx(null)}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '6px 12px', 
                borderRadius: '20px', 
                background: draggedPicIdx === idx ? 'var(--accent-primary)' : 'var(--surface-color)', 
                border: '1px solid var(--border-color)', 
                fontSize: '13px',
                fontWeight: 500,
                color: draggedPicIdx === idx ? 'white' : 'var(--text-primary)',
                cursor: 'grab' 
              }}
            >
              {p}
              <button 
                type="button" 
                onClick={() => handleRemovePic(p)} 
                style={{ background: 'none', border: 'none', color: draggedPicIdx === idx ? 'white' : 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0' }}
                title="Hapus PIC Ini"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
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
              const feedUrl = `${window.location.origin}/api/calendar/feed`;
              import('@/utils/clipboard').then(({ copyToClipboard }) => {
                copyToClipboard(feedUrl);
                toast.success('URL Kalender berhasil disalin ke clipboard!');
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
