'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Save, CheckCircle, Edit2, AlertCircle, Copy, Trash2, Plus, Users, Tag, AlertTriangle, Layers, Calendar, Clock, MapPin } from 'lucide-react';
import { parseAgendaText, ParsedTask } from '@/utils/smartParser';
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
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);

  // Bulk Edit Bar states in Step 2
  const [bulkPic, setBulkPic] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');

  if (!isOpen) return null;

  const handleParse = () => {
    if (!rawText.trim()) return;
    const result = parseAgendaText(rawText, picOptions, categoryOptions, priorityOptions, locationOptions);
    if (result.length === 0) {
      toast.error('Tidak ada pekerjaan yang dapat dikenali. Silakan periksa format teks.');
      return;
    }
    setParsedTasks(result);
    setStep(2);
  };

  const updateTask = (index: number, field: keyof ParsedTask, value: any) => {
    const updated = [...parsedTasks];
    updated[index] = { ...updated[index], [field]: value };
    setParsedTasks(updated);
  };

  const handleAddTaskRow = () => {
    const today = new Date();
    const newTask: ParsedTask = {
      nama: `Pekerjaan Baru #${parsedTasks.length + 1}`,
      pic: picOptions[0] || 'Unassigned',
      kategori: categoryOptions[0] || 'Umum',
      prioritas: priorityOptions[1] || 'Medium',
      startDate: today,
      endDate: today,
      startTime: '08:00',
      endTime: '17:00',
      deskripsi: '',
      lokasi: ''
    };
    setParsedTasks(prev => [...prev, newTask]);
    toast.success('Baris pekerjaan baru ditambahkan');
  };

  const handleDeleteTask = (index: number) => {
    setParsedTasks(prev => prev.filter((_, idx) => idx !== index));
    toast.success('Pekerjaan dihapus dari daftar');
  };

  const handleDuplicateTask = (index: number) => {
    const target = parsedTasks[index];
    if (!target) return;
    const duplicated: ParsedTask = {
      ...JSON.parse(JSON.stringify(target)),
      startDate: new Date(target.startDate),
      endDate: new Date(target.endDate),
      nama: `${target.nama} (Salinan)`
    };
    const next = [...parsedTasks];
    next.splice(index + 1, 0, duplicated);
    setParsedTasks(next);
    toast.success('Pekerjaan berhasil diduplikasi');
  };

  const handleApplyBulkPic = () => {
    if (!bulkPic) return;
    setParsedTasks(prev => prev.map(t => ({ ...t, pic: bulkPic })));
    toast.success(`PIC "${bulkPic}" diterapkan ke semua (${parsedTasks.length}) pekerjaan`);
  };

  const handleApplyBulkCategory = () => {
    if (!bulkCategory) return;
    setParsedTasks(prev => prev.map(t => ({ ...t, kategori: bulkCategory })));
    toast.success(`Kategori "${bulkCategory}" diterapkan ke semua pekerjaan`);
  };

  const handleApplyBulkPriority = () => {
    if (!bulkPriority) return;
    setParsedTasks(prev => prev.map(t => ({ ...t, prioritas: bulkPriority })));
    toast.success(`Prioritas "${bulkPriority}" diterapkan ke semua pekerjaan`);
  };

  const handleSave = () => {
    if (parsedTasks.length === 0) return;
    onSaveBulk(parsedTasks);
    setStep(1);
    setRawText('');
    setParsedTasks([]);
  };

  const handleCancel = () => {
    setStep(1);
    setRawText('');
    setParsedTasks([]);
    onClose();
  };

  const handleCopyTask = (task: ParsedTask) => {
    const lines = [
      `Judul: ${task.nama}`,
      `Tanggal: ${format(task.startDate, 'dd MMM yyyy')}`,
      `Waktu: ${task.startTime} - ${task.endTime}`,
    ];
    
    if (task.lokasi) {
      try {
        const parsedLoc = JSON.parse(task.lokasi);
        if (parsedLoc.tipe === 'online') lines.push(`Lokasi: Online (${parsedLoc.linkZoom || '-'})`);
        else lines.push(`Lokasi: Offline (${parsedLoc.lokasiFisik || '-'})`);
      } catch (e) {
        lines.push(`Lokasi: ${task.lokasi}`);
      }
    }
    
    if (task.deskripsi) {
      lines.push(`\nDeskripsi:\n${task.deskripsi}`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Detail pekerjaan berhasil disalin ke clipboard');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <motion.div 
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          background: 'var(--surface-color)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={22} color="#f59e0b" /> 
              Tambah Pekerjaan Cepat (Smart Add / AI Parser)
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              {step === 1 
                ? 'Salin atau ketik teks agenda/memo bebas di bawah untuk diubah otomatis menjadi pekerjaan terstruktur.' 
                : `Tinjau dan edit ${parsedTasks.length} pekerjaan yang berhasil diekstrak sebelum disimpan.`}
            </p>
          </div>

          <button className="btn btn-secondary" onClick={handleCancel} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: INPUT TEXT & SAMPLES */}
        {step === 1 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', minHeight: 0 }}>
            {/* Quick Sample Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Contoh Template Cepat:</span>
              {SAMPLE_TEXTS.map((sample, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => setRawText(sample.text)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '12px' }}
                >
                  {sample.title}
                </button>
              ))}
              {rawText && (
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11.5px', cursor: 'pointer', marginLeft: 'auto' }}
                >
                  Bersihkan Teks
                </button>
              )}
            </div>

            <SmartAddTemplateManager onCopy={(content) => {
              setRawText(prev => prev ? prev + '\n\n' + content : content);
            }} />
            
            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
              <textarea
                className="input"
                style={{ flex: 1, minHeight: '260px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.5, padding: '12px' }}
                placeholder={`Contoh teks agenda:\n1. Rapat Koordinasi Mingguan\nTanggal : 24 Agustus 2026\nWaktu : 09:00 - 11:30\nTempat : Ruang Rapat Komp TKMR\nPIC : Alvi, Putri\nDeskripsi : Pembahasan progres proyek...`}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                💡 <em>Format otomatis mengenali nomor, kata "Hari/Tanggal:", "Waktu:", "Tempat:", "PIC:", "Prioritas:", dan tautan Zoom.</em>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={handleCancel}>Batal</button>
                <button className="btn btn-primary" onClick={handleParse} disabled={!rawText.trim()} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}>
                  <Zap size={16} /> Ekstrak & Tinjau Pekerjaan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW, BULK ACTIONS & EDIT */}
        {step === 2 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden', minHeight: 0 }}>
            {/* Step 2 Banner & Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 14px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600, fontSize: '13px' }}>
                <CheckCircle size={18} />
                <span>{parsedTasks.length} Pekerjaan Terdeteksi</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddTaskRow}
                style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Tambah Baris Manual
              </button>
            </div>

            {/* Bulk Apply Bar */}
            {parsedTasks.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: 'var(--bg-secondary, rgba(0,0,0,0.03))', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={14} /> Aksi Massal:
                </span>

                {/* Bulk PIC */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <select
                    className="input"
                    value={bulkPic}
                    onChange={e => setBulkPic(e.target.value)}
                    style={{ padding: '3px 8px', fontSize: '11.5px', height: '28px' }}
                  >
                    <option value="">-- Pilih PIC Semua --</option>
                    {picOptions.map(p => <option key={p} value={p}>{p}</option>)}
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
                    <option value="">-- Pilih Kategori Semua --</option>
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
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
                    {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button type="button" onClick={handleApplyBulkPriority} disabled={!bulkPriority} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '11px', height: '28px' }}>
                    Terapkan
                  </button>
                </div>
              </div>
            )}

            {/* List of Tasks */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {parsedTasks.map((task, idx) => (
                <div key={idx} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', position: 'relative' }}>
                  {/* Card Header with Badges & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'var(--accent-primary)', color: '#fff' }}>
                      Pekerjaan #{idx + 1}
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
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
                        title="Duplikasi Baris Ini"
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Task Title */}
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', display: 'block' }}>Nama Pekerjaan *</label>
                      <input 
                        className="input" 
                        value={task.nama} 
                        onChange={(e) => updateTask(idx, 'nama', e.target.value)} 
                        style={{ width: '100%', fontSize: '13px', fontWeight: 600 }}
                        placeholder="Nama pekerjaan..."
                      />
                    </div>
                    
                    {/* PIC, Category, Priority Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', display: 'block' }}>PIC Utama</label>
                        <select 
                          className="input" 
                          value={task.pic || ''} 
                          onChange={(e) => updateTask(idx, 'pic', e.target.value)} 
                          style={{ width: '100%', fontSize: '12.5px' }}
                        >
                          <option value="">-- Pilih PIC --</option>
                          {picOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', display: 'block' }}>PIC Tambahan</label>
                        {(() => {
                          let currentPics: string[] = [];
                          try {
                            if (task.additionalPics) {
                              const parsed = JSON.parse(task.additionalPics);
                              if (Array.isArray(parsed)) currentPics = parsed;
                            }
                          } catch (e) {}

                          const availablePics = picOptions.filter(p => p && p !== task.pic && !currentPics.includes(p));

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <select 
                                className="input" 
                                value="" 
                                onChange={(e) => {
                                  const selected = e.target.value;
                                  if (selected && !currentPics.includes(selected)) {
                                    const updated = [...currentPics, selected];
                                    updateTask(idx, 'additionalPics', JSON.stringify(updated));
                                  }
                                }} 
                                style={{ width: '100%', fontSize: '12.5px' }}
                              >
                                <option value="">-- Pilih PIC Tambahan --</option>
                                {availablePics.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>

                              {currentPics.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {currentPics.map((pName, pIdx) => (
                                    <span 
                                      key={pIdx} 
                                      style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '4px', 
                                        padding: '2px 8px', 
                                        borderRadius: '6px', 
                                        fontSize: '11.5px', 
                                        background: 'var(--bg-secondary, rgba(0,0,0,0.06))', 
                                        border: '1px solid var(--border-color)', 
                                        color: 'var(--text-primary)',
                                        fontWeight: 500
                                      }}
                                    >
                                      {pName}
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          const updated = currentPics.filter((_, i) => i !== pIdx);
                                          updateTask(idx, 'additionalPics', updated.length > 0 ? JSON.stringify(updated) : undefined);
                                        }} 
                                        style={{ 
                                          background: 'none', 
                                          border: 'none', 
                                          padding: 0, 
                                          cursor: 'pointer', 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          color: 'var(--text-secondary)',
                                          lineHeight: 1
                                        }}
                                        title={`Hapus ${pName}`}
                                      >
                                        <X size={12} />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', display: 'block' }}>Kategori</label>
                        <select 
                          className="input" 
                          value={task.kategori || (categoryOptions.length > 0 ? categoryOptions[0] : 'Umum')} 
                          onChange={(e) => updateTask(idx, 'kategori', e.target.value)} 
                          style={{ width: '100%', fontSize: '12.5px' }}
                        >
                          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', display: 'block' }}>Prioritas</label>
                        <select 
                          className="input" 
                          value={task.prioritas || (priorityOptions.length > 0 ? (priorityOptions[1] || priorityOptions[0]) : 'Medium')} 
                          onChange={(e) => updateTask(idx, 'prioritas', e.target.value)} 
                          style={{ width: '100%', fontSize: '12.5px' }}
                        >
                          {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Dates & Times */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', display: 'block' }}>Tanggal Mulai</label>
                        <input 
                          type="date" 
                          className="input" 
                          value={task.startDate && !isNaN(task.startDate.getTime()) ? format(task.startDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              updateTask(idx, 'startDate', new Date(val + 'T00:00:00'));
                            }
                          }} 
                          style={{ width: '100%', fontSize: '12px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', display: 'block' }}>Tenggat Waktu</label>
                        <input 
                          type="date" 
                          className="input" 
                          value={task.endDate && !isNaN(task.endDate.getTime()) ? format(task.endDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              updateTask(idx, 'endDate', new Date(val + 'T00:00:00'));
                            }
                          }} 
                          style={{ width: '100%', fontSize: '12px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', display: 'block' }}>Jam Mulai</label>
                        <input 
                          type="time" 
                          className="input" 
                          value={task.startTime} 
                          onChange={(e) => updateTask(idx, 'startTime', e.target.value)} 
                          style={{ width: '100%', fontSize: '12px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', display: 'block' }}>Jam Selesai</label>
                        <input 
                          type="time" 
                          className="input" 
                          value={task.endTime} 
                          onChange={(e) => updateTask(idx, 'endTime', e.target.value)} 
                          style={{ width: '100%', fontSize: '12px' }}
                        />
                      </div>
                    </div>

                    {/* Location & Description */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', display: 'block' }}>Lokasi / Link Zoom</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {locationOptions && locationOptions.length > 0 && (
                            <select
                              className="input"
                              value=""
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const lower = val.toLowerCase();
                                let lokasiJson = '';
                                if (lower.startsWith('online:') || lower.startsWith('http://') || lower.startsWith('https://') || lower.includes('zoom.us') || lower.includes('meet.google.com') || lower.includes('teams.microsoft')) {
                                  const clean = val.replace(/^online:\s*/i, '').trim();
                                  lokasiJson = JSON.stringify({ tipe: 'online', linkZoom: clean, lokasiFisik: '', jam: '' });
                                } else {
                                  const clean = val.replace(/^offline:\s*/i, '').trim();
                                  lokasiJson = JSON.stringify({ tipe: 'offline', linkZoom: '', lokasiFisik: clean, jam: '' });
                                }
                                updateTask(idx, 'lokasi', lokasiJson);
                              }}
                              style={{ width: '100%', fontSize: '11.5px' }}
                            >
                              <option value="">-- Pilih dari Master Lokasi --</option>
                              {locationOptions.map((loc, lIdx) => (
                                <option key={lIdx} value={loc}>{loc}</option>
                              ))}
                            </select>
                          )}
                          <input 
                            className="input" 
                            placeholder="Ruang Rapat atau Link Zoom (https://...)"
                            value={task.lokasi ? (() => {
                              try {
                                const parsed = JSON.parse(task.lokasi);
                                return parsed.tipe === 'online' ? (parsed.linkZoom || '') : (parsed.lokasiFisik || '');
                              } catch (e) {
                                return task.lokasi;
                              }
                            })() : ''} 
                            onChange={(e) => {
                              const val = e.target.value;
                              const lower = val.toLowerCase();
                              let lokasiJson = '';
                              if (val.trim()) {
                                if (lower.startsWith('http://') || lower.startsWith('https://') || lower.includes('zoom.us') || lower.includes('meet.google.com') || lower.includes('teams.microsoft') || lower.startsWith('online:')) {
                                  const clean = val.replace(/^online:\s*/i, '').trim();
                                  lokasiJson = JSON.stringify({ tipe: 'online', linkZoom: clean, lokasiFisik: '', jam: '' });
                                } else {
                                  const clean = val.replace(/^offline:\s*/i, '').trim();
                                  lokasiJson = JSON.stringify({ tipe: 'offline', linkZoom: '', lokasiFisik: clean, jam: '' });
                                }
                              }
                              updateTask(idx, 'lokasi', lokasiJson);
                            }} 
                            style={{ width: '100%', fontSize: '12.5px' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', display: 'block' }}>Deskripsi Ringkas</label>
                        <input 
                          className="input" 
                          value={task.deskripsi} 
                          onChange={(e) => updateTask(idx, 'deskripsi', e.target.value)} 
                          style={{ width: '100%', fontSize: '12.5px' }}
                          placeholder="Deskripsi detail..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Step 2 Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit2 size={15} /> Kembali Edit Teks
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={handleCancel}>Batal</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={parsedTasks.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}>
                  <Save size={16} /> Simpan Semua ({parsedTasks.length}) ke Database
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

