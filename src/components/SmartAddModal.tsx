'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Zap, Save, CheckCircle, Edit2, Copy, Trash2, Plus, Users, UserPlus, 
  Info, ArrowUp, ArrowDown, Sparkles, Layers, Calendar, Clock, MapPin, CheckSquare
} from 'lucide-react';
import { parseAgendaText, ParsedTask } from '@/utils/smartParser';
import { SubTask, handleMarkdownShortcut, formatDescription } from '@/utils/taskUtils';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import SmartAddTemplateManager from './SmartAddTemplateManager';

interface SmartAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  picOptions?: string[];
  categoryOptions?: string[];
  priorityOptions?: string[];
  locationOptions?: string[];
  onSaveBulk: (tasks: ParsedTask[]) => void;
}

interface SmartTaskItem {
  nama: string;
  pic: string;
  additionalPicsList: string[];
  kategori: string;
  status: string;
  prioritas: string;
  progress: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  lokasi: string;
  isOnline: boolean;
  deskripsi: string;
  catatan: string;
  subTasksList: SubTask[];
  recurrence: string;
  activeTab: 'info' | 'subtasks' | 'attachments';
}

const SAMPLE_TEXTS = [
  {
    title: '📋 Agenda Rapat Rutin',
    text: `1. Rapat Pleno Koordinasi Mingguan
Hari/Tanggal : Senin, 24 Agustus 2026
Waktu : 09:00 - 11:30 WITA
Tempat : Ruang Rapat Komp TKMR
PIC : Alvi, Putri
Kategori : Rapat
Prioritas : High
Deskripsi : Evaluasi pencapaian target bulanan dan perencanaan sprint baru.

2. Review Laporan Anggaran Q3
Hari/Tanggal : Selasa, 25 Agustus 2026
Waktu : 13:30 - 15:00 WITA
Tempat : Online (https://zoom.us/j/987654321)
PIC : Farhan
Kategori : Anggaran
Prioritas : Medium
Deskripsi : Pembahasan realisasi anggaran dan persiapan audit semester.`
  },
  {
    title: '📅 Memo Tindak Lanjut',
    text: `1. Pengumpulan Dokumen ISO 27001
Tanggal : 20 s.d. 22 Agustus 2026
Waktu : 08:00 - 17:00
PIC : Budi
Kategori : Compliance
Prioritas : High
Deskripsi : Lengkapi seluruh eviden keamanan informasi sebelum audit eksternal.

2. Finalisasi Modul Monitoring
Tanggal : 26 Agustus 2026
Waktu : 10:00 - 16:00
PIC : Alvi
Kategori : IT & Software
Prioritas : Critical
Deskripsi : Testing fitur sinkronisasi kalender dan backup otomatis.`
  }
];

export default function SmartAddModal({
  isOpen,
  onClose,
  picOptions = [],
  categoryOptions = [],
  priorityOptions = [],
  locationOptions = [],
  onSaveBulk
}: SmartAddModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState('');
  const [smartTasks, setSmartTasks] = useState<SmartTaskItem[]>([]);

  // Bulk Edit Bar states in Step 2
  const [bulkPic, setBulkPic] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');

  if (!isOpen) return null;

  const safePicOptions = picOptions.length > 0 ? picOptions : ['Unassigned'];
  const safeCategoryOptions = categoryOptions.length > 0 ? categoryOptions : ['Umum'];
  const safePriorityOptions = priorityOptions.length > 0 ? priorityOptions : ['Low', 'Medium', 'High', 'Urgent'];

  const handleParse = () => {
    if (!rawText.trim()) return;
    const result = parseAgendaText(rawText, safePicOptions, safeCategoryOptions, safePriorityOptions, locationOptions);
    if (result.length === 0) {
      toast.error('Tidak ada pekerjaan yang dapat dikenali. Silakan periksa format teks.');
      return;
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const items: SmartTaskItem[] = result.map(t => {
      let addPics: string[] = [];
      if (t.additionalPics) {
        try {
          const parsed = JSON.parse(t.additionalPics);
          if (Array.isArray(parsed)) addPics = parsed;
        } catch {}
      }
      const isOnlineLoc = t.lokasi ? (
        t.lokasi.toLowerCase().includes('zoom') || 
        t.lokasi.toLowerCase().includes('http') || 
        t.lokasi.toLowerCase().includes('meet') || 
        t.lokasi.toLowerCase().includes('teams')
      ) : false;

      return {
        nama: t.nama || '',
        pic: t.pic || (safePicOptions[0] || 'Unassigned'),
        additionalPicsList: addPics,
        kategori: t.kategori || (safeCategoryOptions[0] || 'Umum'),
        status: 'To Do',
        prioritas: t.prioritas || (safePriorityOptions[1] || safePriorityOptions[0] || 'Medium'),
        progress: 0,
        startDate: t.startDate && !isNaN(t.startDate.getTime()) ? format(t.startDate, 'yyyy-MM-dd') : todayStr,
        endDate: t.endDate && !isNaN(t.endDate.getTime()) ? format(t.endDate, 'yyyy-MM-dd') : todayStr,
        startTime: t.startTime || '08:00',
        endTime: t.endTime || '17:00',
        isAllDay: true,
        lokasi: t.lokasi || '',
        isOnline: isOnlineLoc,
        deskripsi: t.deskripsi || '',
        catatan: '',
        subTasksList: [],
        recurrence: 'none',
        activeTab: 'info'
      };
    });

    setSmartTasks(items);
    setStep(2);
    toast.success(`Berhasil mengekstrak ${items.length} pekerjaan!`);
  };

  const updateTaskItem = (idx: number, updates: Partial<SmartTaskItem>) => {
    setSmartTasks(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  };

  const handleAddTaskRow = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const newTask: SmartTaskItem = {
      nama: `Pekerjaan Baru #${smartTasks.length + 1}`,
      pic: safePicOptions[0] || 'Unassigned',
      additionalPicsList: [],
      kategori: safeCategoryOptions[0] || 'Umum',
      status: 'To Do',
      prioritas: safePriorityOptions[1] || 'Medium',
      progress: 0,
      startDate: todayStr,
      endDate: todayStr,
      startTime: '08:00',
      endTime: '17:00',
      isAllDay: true,
      lokasi: '',
      isOnline: false,
      deskripsi: '',
      catatan: '',
      subTasksList: [],
      recurrence: 'none',
      activeTab: 'info'
    };
    setSmartTasks(prev => [...prev, newTask]);
    toast.success('Baris pekerjaan baru ditambahkan');
  };

  const handleDeleteTask = (index: number) => {
    setSmartTasks(prev => prev.filter((_, idx) => idx !== index));
    toast.success('Pekerjaan dihapus dari daftar');
  };

  const handleDuplicateTask = (index: number) => {
    const target = smartTasks[index];
    if (!target) return;
    const duplicated: SmartTaskItem = {
      ...JSON.parse(JSON.stringify(target)),
      nama: `${target.nama} (Salinan)`
    };
    const next = [...smartTasks];
    next.splice(index + 1, 0, duplicated);
    setSmartTasks(next);
    toast.success('Pekerjaan berhasil diduplikasi');
  };

  const handleCopyTask = (task: SmartTaskItem) => {
    const text = `📋 ${task.nama}
PIC: ${[task.pic, ...task.additionalPicsList].filter(Boolean).join(', ')}
Kategori: ${task.kategori} | Prioritas: ${task.prioritas} | Status: ${task.status}
Jadwal: ${task.startDate} s.d ${task.endDate}
Lokasi: ${task.lokasi || '-'}
Deskripsi: ${task.deskripsi || '-'}`;
    navigator.clipboard.writeText(text);
    toast.success('Ringkasan pekerjaan disalin ke clipboard');
  };

  // PIC Shortcuts for Task
  const handleSelectAllPics = (taskIdx: number) => {
    const validPics = safePicOptions.filter(p => p && p.trim() !== '' && p !== 'Unassigned');
    if (validPics.length === 0) return toast.error('Belum ada data Master PIC');
    const current = smartTasks[taskIdx];
    const primary = current.pic && validPics.includes(current.pic) ? current.pic : validPics[0];
    const others = validPics.filter(p => p !== primary);
    updateTaskItem(taskIdx, { pic: primary, additionalPicsList: others });
    toast.success(`Berhasil memilih seluruh ${validPics.length} PIC!`);
  };

  const handleAddAnotherPic = (taskIdx: number) => {
    const current = smartTasks[taskIdx];
    updateTaskItem(taskIdx, {
      additionalPicsList: [...(current.additionalPicsList || []), '']
    });
  };

  const handleUpdateAdditionalPic = (taskIdx: number, picIdx: number, val: string) => {
    const current = smartTasks[taskIdx];
    const updated = [...(current.additionalPicsList || [])];
    updated[picIdx] = val;
    updateTaskItem(taskIdx, { additionalPicsList: updated });
  };

  const handleRemoveAdditionalPic = (taskIdx: number, picIdx: number) => {
    const current = smartTasks[taskIdx];
    const updated = current.additionalPicsList?.filter((_, i) => i !== picIdx) || [];
    updateTaskItem(taskIdx, { additionalPicsList: updated });
  };

  const insertMarkdownToTextarea = (
    input: HTMLTextAreaElement | null,
    formatType: 'bold' | 'italic' | 'list',
    currentVal: string,
    onUpdate: (newVal: string) => void
  ) => {
    if (!input) {
      if (formatType === 'bold') onUpdate(currentVal + ' **teks**');
      else if (formatType === 'italic') onUpdate(currentVal + ' *teks*');
      else if (formatType === 'list') onUpdate(currentVal + '\n- ');
      return;
    }
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const selected = currentVal.substring(start, end);
    let replacement = '';
    if (formatType === 'bold') replacement = `**${selected || 'teks'}**`;
    else if (formatType === 'italic') replacement = `*${selected || 'teks'}*`;
    else if (formatType === 'list') replacement = `\n- ${selected || 'item'}`;

    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    onUpdate(newVal);
  };

  // Date Preset helper
  const handleDatePreset = (taskIdx: number, type: 'today' | 'tomorrow' | '3days' | '1week' | '1month' | 'thisMonth') => {
    const today = new Date();
    let start = format(today, 'yyyy-MM-dd');
    let end = format(today, 'yyyy-MM-dd');

    if (type === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      start = format(d, 'yyyy-MM-dd');
      end = format(d, 'yyyy-MM-dd');
    } else if (type === '3days') {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      end = format(d, 'yyyy-MM-dd');
    } else if (type === '1week') {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      end = format(d, 'yyyy-MM-dd');
    } else if (type === '1month') {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      end = format(d, 'yyyy-MM-dd');
    } else if (type === 'thisMonth') {
      const d = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end = format(d, 'yyyy-MM-dd');
    }

    updateTaskItem(taskIdx, { startDate: start, endDate: end });
  };

  // Bulk Apply Toolbar
  const handleApplyBulkPic = () => {
    if (!bulkPic) return;
    setSmartTasks(prev => prev.map(t => ({ ...t, pic: bulkPic })));
    toast.success(`PIC "${bulkPic}" diterapkan ke semua pekerjaan`);
  };

  const handleApplyBulkCategory = () => {
    if (!bulkCategory) return;
    setSmartTasks(prev => prev.map(t => ({ ...t, kategori: bulkCategory })));
    toast.success(`Kategori "${bulkCategory}" diterapkan ke semua pekerjaan`);
  };

  const handleApplyBulkPriority = () => {
    if (!bulkPriority) return;
    setSmartTasks(prev => prev.map(t => ({ ...t, prioritas: bulkPriority })));
    toast.success(`Prioritas "${bulkPriority}" diterapkan ke semua pekerjaan`);
  };

  const handleSave = () => {
    if (smartTasks.length === 0) return;

    const formattedToSave: ParsedTask[] = smartTasks.map(t => {
      let lokasiStr = t.lokasi;
      if (t.lokasi && !t.lokasi.startsWith('{')) {
        if (t.isOnline) {
          lokasiStr = JSON.stringify({ tipe: 'online', linkZoom: t.lokasi, lokasiFisik: '', jam: '' });
        } else {
          lokasiStr = JSON.stringify({ tipe: 'offline', linkZoom: '', lokasiFisik: t.lokasi, jam: '' });
        }
      }

      return {
        nama: t.nama || 'Tanpa Judul',
        pic: t.pic || 'Unassigned',
        additionalPics: t.additionalPicsList && t.additionalPicsList.length > 0 ? JSON.stringify(t.additionalPicsList) : undefined,
        kategori: t.kategori || 'Umum',
        prioritas: t.prioritas || 'Medium',
        startDate: t.startDate ? new Date(t.startDate + 'T00:00:00') : new Date(),
        endDate: t.endDate ? new Date(t.endDate + 'T00:00:00') : new Date(),
        startTime: t.startTime || '08:00',
        endTime: t.endTime || '17:00',
        deskripsi: t.deskripsi || '',
        lokasi: lokasiStr
      };
    });

    onSaveBulk(formattedToSave);
    handleCancel();
  };

  const handleCancel = () => {
    setStep(1);
    setRawText('');
    setSmartTasks([]);
    setBulkPic('');
    setBulkCategory('');
    setBulkPriority('');
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10100 }}>
      <motion.div
        className="modal-content"
        style={{
          width: '95vw',
          maxWidth: step === 1 ? '700px' : '900px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '24px',
          transition: 'max-width 0.3s ease'
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                {step === 1 ? 'Tambah Pekerjaan Cepat (Smart Add / AI Parser)' : `Tinjau & Edit Hasil Parse (${smartTasks.length} Pekerjaan)`}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                {step === 1 ? 'Paste teks agenda rapat, memo, atau pesan WA untuk otomatis diekstrak.' : 'Periksa dan edit rincian setiap pekerjaan dengan form lengkap sebelum disimpan.'}
              </p>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={handleCancel}>
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: Text Input & Template */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
            {/* Template Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Pilih Contoh Format Cepat:
              </span>
              <SmartAddTemplateManager onCopy={(text) => setRawText(text)} />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SAMPLE_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '11.5px', padding: '5px 10px' }}
                  onClick={() => setRawText(sample.text)}
                >
                  {sample.title}
                </button>
              ))}
            </div>

            {/* Raw Text Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Tempel Teks Agenda / Memo di sini:
              </label>
              <textarea
                className="input"
                style={{
                  width: '100%',
                  minHeight: '220px',
                  fontFamily: 'monospace',
                  fontSize: '12.5px',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  padding: '12px'
                }}
                placeholder={`Contoh:\n1. Rapat Koordinasi Tim\nHari/Tanggal: Senin, 24 Agustus 2026\nWaktu: 09:00 - 11:30\nTempat: Ruang Rapat Lt. 2\nPIC: Farhan, Budi\nKategori: Rapat\nPrioritas: High\nDeskripsi: Evaluasi sprint bulanan`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            </div>

            {/* Step 1 Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button className="btn btn-secondary" onClick={handleCancel}>
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleParse}
                disabled={!rawText.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}
              >
                <Zap size={16} /> Ekstrak Teks Pekerjaan
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Full-Featured Scrollable Bulk Task Editor */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflow: 'hidden' }}>
            {/* Top Toolbar: Bulk Apply & Add New Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface-color)',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={13} /> Aksi Massal:
                </span>

                {/* Bulk PIC */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <select
                    className="input"
                    value={bulkPic}
                    onChange={e => setBulkPic(e.target.value)}
                    style={{ padding: '3px 8px', fontSize: '11.5px', height: '28px' }}
                  >
                    <option value="">-- PIC Semua --</option>
                    {safePicOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button type="button" onClick={handleApplyBulkPic} disabled={!bulkPic} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '11px', height: '28px' }}>
                    Terapkan
                  </button>
                </div>

                {/* Bulk Category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <select
                    className="input"
                    value={bulkCategory}
                    onChange={e => setBulkCategory(e.target.value)}
                    style={{ padding: '3px 8px', fontSize: '11.5px', height: '28px' }}
                  >
                    <option value="">-- Kategori Semua --</option>
                    {safeCategoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={handleApplyBulkCategory} disabled={!bulkCategory} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '11px', height: '28px' }}>
                    Terapkan
                  </button>
                </div>

                {/* Bulk Priority */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <select
                    className="input"
                    value={bulkPriority}
                    onChange={e => setBulkPriority(e.target.value)}
                    style={{ padding: '3px 8px', fontSize: '11.5px', height: '28px' }}
                  >
                    <option value="">-- Prioritas Semua --</option>
                    {safePriorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button type="button" onClick={handleApplyBulkPriority} disabled={!bulkPriority} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '11px', height: '28px' }}>
                    Terapkan
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddTaskRow}
                style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> + Tambah Pekerjaan
              </button>
            </div>

            {/* Scrollable Bulk Task Editor Cards */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
              {smartTasks.map((task, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  {/* Card Header Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: 'var(--accent-primary)', color: '#fff' }}>
                        Pekerjaan #{idx + 1}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.nama}>
                        {task.nama || 'Tanpa Judul'}
                      </span>
                    </div>

                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-color)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <button
                        type="button"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11.5px',
                          fontWeight: task.activeTab === 'info' ? 600 : 400,
                          borderRadius: '6px',
                          background: task.activeTab === 'info' ? 'var(--surface-color)' : 'transparent',
                          color: task.activeTab === 'info' ? 'var(--text-primary)' : 'var(--text-secondary)',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: task.activeTab === 'info' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                        onClick={() => updateTaskItem(idx, { activeTab: 'info' })}
                      >
                        Info Umum
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11.5px',
                          fontWeight: task.activeTab === 'subtasks' ? 600 : 400,
                          borderRadius: '6px',
                          background: task.activeTab === 'subtasks' ? 'var(--surface-color)' : 'transparent',
                          color: task.activeTab === 'subtasks' ? 'var(--text-primary)' : 'var(--text-secondary)',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: task.activeTab === 'subtasks' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                        onClick={() => updateTaskItem(idx, { activeTab: 'subtasks' })}
                      >
                        Sub Pekerjaan {task.subTasksList.length > 0 ? `(${task.subTasksList.length})` : ''}
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11.5px',
                          fontWeight: task.activeTab === 'attachments' ? 600 : 400,
                          borderRadius: '6px',
                          background: task.activeTab === 'attachments' ? 'var(--surface-color)' : 'transparent',
                          color: task.activeTab === 'attachments' ? 'var(--text-primary)' : 'var(--text-secondary)',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: task.activeTab === 'attachments' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                        onClick={() => updateTaskItem(idx, { activeTab: 'attachments' })}
                      >
                        Pengaturan & Catatan
                      </button>
                    </div>

                    {/* Card Actions */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleCopyTask(task)}
                        style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Salin Teks Ringkasan"
                      >
                        <Copy size={12} /> Salin
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleDuplicateTask(idx)}
                        style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Duplikasi Pekerjaan Ini"
                      >
                        <Plus size={12} /> Duplikasi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                        title="Hapus Pekerjaan Ini"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: INFO UMUM (Identical to TaskAddEditModal) */}
                  {task.activeTab === 'info' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Nama Pekerjaan */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>
                          Nama Pekerjaan *
                        </label>
                        <input
                          className="input"
                          placeholder="Contoh: Audit Keuangan Kuartal II"
                          value={task.nama}
                          onChange={e => updateTaskItem(idx, { nama: e.target.value })}
                          style={{ fontWeight: 600, fontSize: '13px' }}
                        />
                      </div>

                      {/* Penanggung Jawab (PIC Utama & Tambahan) with Semua PIC shortcut */}
                      <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Penanggung Jawab (PIC Utama & Tambahan) *
                            <span title="Update pilihannya pada master pengaturan"><Info size={13} style={{ color: 'var(--accent-primary)' }} /></span>
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleSelectAllPics(idx)}
                              title="Pilih seluruh nama PIC personil yang terdaftar"
                            >
                              <Users size={13} color="var(--accent-primary)" /> Semua PIC
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleAddAnotherPic(idx)}
                            >
                              <UserPlus size={13} /> + Tambah PIC Lain
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>PIC Utama *</span>
                            <select
                              className="input"
                              value={task.pic || ''}
                              onChange={e => updateTaskItem(idx, { pic: e.target.value })}
                              style={{ fontSize: '12.5px' }}
                            >
                              <option value="">-- Pilih PIC Utama --</option>
                              {safePicOptions.map((p, pIdx) => (
                                <option key={pIdx} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>

                          {task.additionalPicsList && task.additionalPicsList.map((extraPic: string, pIdx: number) => (
                            <div key={pIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <select
                                className="input"
                                value={extraPic}
                                onChange={e => handleUpdateAdditionalPic(idx, pIdx, e.target.value)}
                                style={{ fontSize: '12.5px' }}
                              >
                                <option value="">-- Pilih PIC Tambahan --</option>
                                {safePicOptions.map((p, i) => (
                                  <option key={i} value={p}>{p}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                                onClick={() => handleRemoveAdditionalPic(idx, pIdx)}
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3-Column Grid: Kategori, Status, Prioritas */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>
                            Kategori *
                            <span title="Update pilihannya pada master pengaturan"><Info size={13} style={{ color: 'var(--accent-primary)' }} /></span>
                          </label>
                          <select
                            className="input"
                            value={task.kategori || ''}
                            onChange={e => updateTaskItem(idx, { kategori: e.target.value })}
                            style={{ fontSize: '12.5px' }}
                          >
                            <option value="">-- Kategori --</option>
                            {safeCategoryOptions.map((c, cIdx) => (
                              <option key={cIdx} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>
                            Status
                            <span title="Update pilihannya pada master pengaturan"><Info size={13} style={{ color: 'var(--accent-primary)' }} /></span>
                          </label>
                          <select
                            className="input"
                            value={task.status || 'To Do'}
                            onChange={e => updateTaskItem(idx, { status: e.target.value })}
                            style={{ fontSize: '12.5px' }}
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>
                            Prioritas
                            <span title="Update pilihannya pada master pengaturan"><Info size={13} style={{ color: 'var(--accent-primary)' }} /></span>
                          </label>
                          <select
                            className="input"
                            value={task.prioritas || 'Medium'}
                            onChange={e => updateTaskItem(idx, { prioritas: e.target.value })}
                            style={{ fontSize: '12.5px' }}
                          >
                            {safePriorityOptions.map((p, pIdx) => (
                              <option key={pIdx} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Lokasi Pekerjaan */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>
                          Lokasi Pekerjaan (Opsional)
                        </label>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`lokasi-type-${idx}`}
                              checked={task.isOnline}
                              onChange={() => updateTaskItem(idx, { isOnline: true })}
                            />
                            Online
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`lokasi-type-${idx}`}
                              checked={!task.isOnline}
                              onChange={() => updateTaskItem(idx, { isOnline: false })}
                            />
                            Offline
                          </label>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {locationOptions && locationOptions.length > 0 && (
                            <select
                              className="input"
                              value=""
                              onChange={e => {
                                const val = e.target.value;
                                if (!val) return;
                                const isOnline = val.toLowerCase().includes('online') || val.toLowerCase().includes('zoom') || val.toLowerCase().includes('http');
                                updateTaskItem(idx, { lokasi: val, isOnline });
                              }}
                              style={{ fontSize: '12px' }}
                            >
                              <option value="">-- Pilih dari Master Lokasi --</option>
                              {locationOptions.map((loc, lIdx) => (
                                <option key={lIdx} value={loc}>{loc}</option>
                              ))}
                            </select>
                          )}
                          <input
                            className="input"
                            placeholder={task.isOnline ? "Contoh: Zoom / Microsoft Teams Link (https://...)" : "Contoh: Ruang Rapat Komp TKMR Lt. 2"}
                            value={task.lokasi || ''}
                            onChange={e => updateTaskItem(idx, { lokasi: e.target.value })}
                            style={{ fontSize: '12.5px' }}
                          />
                        </div>
                      </div>

                      {/* Waktu & Jadwal Pekerjaan */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Waktu & Jadwal Pekerjaan
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={task.isAllDay}
                              onChange={e => updateTaskItem(idx, { isAllDay: e.target.checked })}
                            />
                            Seharian (All Day)
                          </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Tanggal Mulai</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input
                                type="date"
                                className="input"
                                value={task.startDate || ''}
                                onChange={e => updateTaskItem(idx, { startDate: e.target.value })}
                                style={{ flex: 1, fontSize: '12px' }}
                              />
                              {!task.isAllDay && (
                                <input
                                  type="time"
                                  className="input"
                                  value={task.startTime || '08:00'}
                                  onChange={e => updateTaskItem(idx, { startTime: e.target.value })}
                                  style={{ width: '90px', fontSize: '12px' }}
                                />
                              )}
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Tenggat Waktu</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input
                                type="date"
                                className="input"
                                value={task.endDate || ''}
                                onChange={e => updateTaskItem(idx, { endDate: e.target.value })}
                                style={{ flex: 1, fontSize: '12px' }}
                              />
                              {!task.isAllDay && (
                                <input
                                  type="time"
                                  className="input"
                                  value={task.endTime || '17:00'}
                                  onChange={e => updateTaskItem(idx, { endTime: e.target.value })}
                                  style={{ width: '90px', fontSize: '12px' }}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Date Preset Shortcuts */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginRight: '2px' }}>Pintasan:</span>
                          <button type="button" className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10.5px' }} onClick={() => handleDatePreset(idx, 'today')}>Hari Ini</button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10.5px' }} onClick={() => handleDatePreset(idx, 'tomorrow')}>Besok</button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10.5px' }} onClick={() => handleDatePreset(idx, '3days')}>+3 Hari</button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10.5px' }} onClick={() => handleDatePreset(idx, '1week')}>+1 Minggu</button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10.5px' }} onClick={() => handleDatePreset(idx, '1month')}>+1 Bulan</button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10.5px' }} onClick={() => handleDatePreset(idx, 'thisMonth')}>Bulan Ini</button>
                        </div>
                      </div>

                      {/* Deskripsi Pekerjaan with Markdown Toolbar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Deskripsi Pekerjaan
                          </label>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}
                              onClick={() => {
                                const input = document.getElementById(`desc-${idx}`) as HTMLTextAreaElement;
                                insertMarkdownToTextarea(input, 'bold', task.deskripsi || '', val => updateTaskItem(idx, { deskripsi: val }));
                              }}
                              title="Tebal (Bold)"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '2px 6px', fontSize: '11px', fontStyle: 'italic' }}
                              onClick={() => {
                                const input = document.getElementById(`desc-${idx}`) as HTMLTextAreaElement;
                                insertMarkdownToTextarea(input, 'italic', task.deskripsi || '', val => updateTaskItem(idx, { deskripsi: val }));
                              }}
                              title="Miring (Italic)"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '2px 6px', fontSize: '11px' }}
                              onClick={() => {
                                const input = document.getElementById(`desc-${idx}`) as HTMLTextAreaElement;
                                insertMarkdownToTextarea(input, 'list', task.deskripsi || '', val => updateTaskItem(idx, { deskripsi: val }));
                              }}
                              title="Daftar Poin"
                            >
                              • List
                            </button>
                          </div>
                        </div>
                        <textarea
                          id={`desc-${idx}`}
                          className="input"
                          rows={3}
                          placeholder="Tambahkan rincian / deskripsi pekerjaan..."
                          value={task.deskripsi || ''}
                          onChange={e => updateTaskItem(idx, { deskripsi: e.target.value })}
                          style={{ width: '100%', fontSize: '12.5px', lineHeight: 1.5 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SUB PEKERJAAN (Identical to TaskAddEditModal) */}
                  {task.activeTab === 'subtasks' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                            Sub Pekerjaan ({task.subTasksList.length})
                          </h4>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Pecah pekerjaan ini menjadi beberapa rincian sub tugas
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            const newSub: SubTask = {
                              id: `sub-${Date.now()}`,
                              text: '',
                              status: 'To Do',
                              pic: task.pic || (safePicOptions[0] || 'Unassigned'),
                              additionalPics: [],
                              tenggatWaktu: task.endDate || format(new Date(), 'yyyy-MM-dd'),
                              logs: []
                            };
                            updateTaskItem(idx, { subTasksList: [...task.subTasksList, newSub] });
                          }}
                        >
                          <Plus size={13} /> + Tambah Sub
                        </button>
                      </div>

                      {task.subTasksList.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-color)', borderRadius: '8px', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          Belum ada sub pekerjaan. Klik "+ Tambah Sub" di atas untuk menambahkan.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {task.subTasksList.map((st, sidx) => (
                            <div key={st.id || sidx} style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>#{sidx + 1}</span>
                                <textarea
                                  className="input"
                                  rows={2}
                                  placeholder="Rincian sub pekerjaan..."
                                  value={st.text}
                                  onChange={e => {
                                    const updated = [...task.subTasksList];
                                    updated[sidx].text = e.target.value;
                                    updateTaskItem(idx, { subTasksList: updated });
                                  }}
                                  style={{ flex: 1, fontSize: '12.5px' }}
                                />
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    type="button"
                                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                                    onClick={() => {
                                      const updated = task.subTasksList.filter((_, i) => i !== sidx);
                                      updateTaskItem(idx, { subTasksList: updated });
                                    }}
                                    title="Hapus Sub Pekerjaan"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Status</span>
                                  <select
                                    className="input"
                                    value={st.status}
                                    onChange={e => {
                                      const updated = [...task.subTasksList];
                                      updated[sidx].status = e.target.value;
                                      updateTaskItem(idx, { subTasksList: updated });
                                    }}
                                    style={{ fontSize: '11.5px', padding: '3px 6px' }}
                                  >
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Overdue">Overdue</option>
                                  </select>
                                </div>

                                <div>
                                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>PIC</span>
                                  <select
                                    className="input"
                                    value={st.pic || ''}
                                    onChange={e => {
                                      const updated = [...task.subTasksList];
                                      updated[sidx].pic = e.target.value;
                                      updateTaskItem(idx, { subTasksList: updated });
                                    }}
                                    style={{ fontSize: '11.5px', padding: '3px 6px' }}
                                  >
                                    {safePicOptions.map((p, pIdx) => (
                                      <option key={pIdx} value={p}>{p}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Tenggat</span>
                                  <input
                                    type="date"
                                    className="input"
                                    value={st.tenggatWaktu || ''}
                                    onChange={e => {
                                      const updated = [...task.subTasksList];
                                      updated[sidx].tenggatWaktu = e.target.value;
                                      updateTaskItem(idx, { subTasksList: updated });
                                    }}
                                    style={{ fontSize: '11.5px', padding: '3px 6px' }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: CATATAN & PENGATURAN */}
                  {task.activeTab === 'attachments' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>
                          Catatan Tambahan (Opsional)
                        </label>
                        <textarea
                          className="input"
                          rows={4}
                          placeholder="Catatan internal / referensi tambahan..."
                          value={task.catatan || ''}
                          onChange={e => updateTaskItem(idx, { catatan: e.target.value })}
                          style={{ width: '100%', fontSize: '12.5px', lineHeight: 1.5 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Step 2 Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit2 size={14} /> Kembali Edit Teks
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={handleCancel}>Batal</button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={smartTasks.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}
                >
                  <Save size={15} /> Simpan Semua ({smartTasks.length}) Pekerjaan
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
