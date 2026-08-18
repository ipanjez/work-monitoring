'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Trash2, FileSpreadsheet, Plus, Upload, Calendar, Clock, MapPin, User, Tag, ListTodo } from 'lucide-react';
import { format } from 'date-fns';

export interface ExcelParsedTask {
  id?: string;
  nama: string;
  pic: string;
  additionalPics?: string | null;
  kategori: string;
  prioritas: string;
  status: string;
  isAllDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  startDate: string;
  endDate: string;
  repetisi?: string;
  deskripsi?: string;
  lokasi?: string | null;
  catatan?: string;
  subTasksJson?: string | null;
  rawIndex?: number;
}

interface ExcelImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: ExcelParsedTask[];
  onConfirmImport: (tasks: ExcelParsedTask[]) => Promise<void>;
  fileName?: string;
  masterLocations?: string[];
}

export default function ExcelImportPreviewModal({
  isOpen,
  onClose,
  tasks: initialTasks,
  onConfirmImport,
  fileName = 'file.xlsx',
  masterLocations = []
}: ExcelImportPreviewModalProps) {
  const [tasks, setTasks] = useState<ExcelParsedTask[]>(initialTasks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Sync state if initialTasks changes
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  if (!isOpen) return null;

  const handleDeleteRow = (index: number) => {
    setTasks(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleClearAll = () => {
    if (confirm('Hapus seluruh data pratinjau impor?')) {
      setTasks([]);
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (tasks.length === 0) return;
    setIsSubmitting(true);
    try {
      await onConfirmImport(tasks);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = searchFilter
    ? tasks.filter(t => 
        t.nama.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.pic.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.kategori.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : tasks;

  const parseLocationText = (locStr: string | null | undefined): string => {
    if (!locStr) return '-';
    try {
      const parsed = JSON.parse(locStr);
      if (parsed.tipe === 'online') return `🌐 Online (${parsed.linkZoom || '-'})`;
      return `📍 Offline (${parsed.lokasiFisik || '-'})`;
    } catch {
      return locStr;
    }
  };

  const countSubtasks = (subJson: string | null | undefined): number => {
    if (!subJson) return 0;
    try {
      const parsed = JSON.parse(subJson);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <motion.div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '1100px',
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={22} color="#10b981" /> 
              Pratinjau Impor Excel ({tasks.length} Pekerjaan)
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              File: <strong style={{ color: 'var(--text-primary)' }}>{fileName}</strong> — Periksa data sebelum disimpan ke database sistem.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '6px 12px', fontSize: '12.5px' }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={isSubmitting || tasks.length === 0}
              style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' }}
            >
              <Upload size={16} /> {isSubmitting ? 'Menyimpan...' : `Simpan Semua (${tasks.length}) ke Database`}
            </button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
            <input
              type="text"
              className="input"
              placeholder="Cari nama, PIC, atau kategori..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              style={{ width: '100%', fontSize: '12.5px', height: '34px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600 }}>
              ✅ {tasks.length} Baris Siap Diimpor
            </span>
            {tasks.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '12px', cursor: 'pointer', padding: '4px 8px' }}
              >
                Hapus Semua
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-secondary, rgba(0,0,0,0.03))', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 2 }}>
              <tr>
                <th style={{ padding: '10px 12px', width: '40px' }}>No</th>
                <th style={{ padding: '10px 12px', minWidth: '200px' }}>Nama Pekerjaan</th>
                <th style={{ padding: '10px 12px', minWidth: '130px' }}>PIC</th>
                <th style={{ padding: '10px 12px', minWidth: '110px' }}>Kategori</th>
                <th style={{ padding: '10px 12px', width: '90px' }}>Prioritas</th>
                <th style={{ padding: '10px 12px', width: '100px' }}>Status</th>
                <th style={{ padding: '10px 12px', minWidth: '140px' }}>Tanggal & Waktu</th>
                <th style={{ padding: '10px 12px', minWidth: '130px' }}>Lokasi</th>
                <th style={{ padding: '10px 12px', width: '80px', textAlign: 'center' }}>Subtask</th>
                <th style={{ padding: '10px 12px', width: '50px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {searchFilter ? 'Tidak ada pekerjaan yang cocok dengan pencarian.' : 'Tidak ada data pekerjaan untuk ditampilkan.'}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, idx) => {
                  let additionalPicsText = '';
                  if (task.additionalPics) {
                    try {
                      const arr = JSON.parse(task.additionalPics);
                      if (Array.isArray(arr) && arr.length > 0) additionalPicsText = ` (+${arr.length} PIC)`;
                    } catch {}
                  }

                  const startFormatted = task.startDate ? format(new Date(task.startDate), 'dd MMM yyyy') : '-';
                  const endFormatted = task.endDate ? format(new Date(task.endDate), 'dd MMM yyyy') : '-';
                  const isSameDate = startFormatted === endFormatted;
                  const dateDisplay = isSameDate ? startFormatted : `${startFormatted} s.d. ${endFormatted}`;
                  const timeDisplay = task.isAllDay ? 'Seharian' : (task.startTime ? `${task.startTime} - ${task.endTime || ''}` : '-');
                  const subCount = countSubtasks(task.subTasksJson);

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.015))',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div>{task.nama}</div>
                        {task.deskripsi && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '2px', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {task.deskripsi}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={13} color="var(--accent-primary)" />
                          <span>{task.pic}</span>
                          {additionalPicsText && <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{additionalPicsText}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '6px', background: 'var(--bg-secondary, rgba(0,0,0,0.05))', color: 'var(--text-primary)' }}>
                          {task.kategori}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                          background: task.prioritas === 'Critical' || task.prioritas === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: task.prioritas === 'Critical' || task.prioritas === 'High' ? '#ef4444' : '#f59e0b'
                        }}>
                          {task.prioritas}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                          background: task.status === 'Done' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: task.status === 'Done' ? '#10b981' : '#3b82f6'
                        }}>
                          {task.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-primary)' }}>{dateDisplay}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                          <Clock size={11} /> {timeDisplay}
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: '11.5px', minWidth: '150px' }}>
                        {masterLocations && masterLocations.length > 0 ? (
                          <select
                            className="input"
                            value={(() => {
                              if (!task.lokasi) return '';
                              try {
                                const parsed = JSON.parse(task.lokasi);
                                const val = (parsed.tipe === 'online' ? parsed.linkZoom : parsed.lokasiFisik) || '';
                                if (!val) return '';
                                return masterLocations.find(l => l.includes(val) || val.includes(l.replace(/^(online|offline):\s*/i, '').trim())) || '';
                              } catch {
                                return '';
                              }
                            })()}
                            onChange={(e) => {
                              const val = e.target.value;
                              const lower = val.toLowerCase();
                              let newLokasi = null;
                              if (val) {
                                if (lower.startsWith('online:') || lower.startsWith('http://') || lower.startsWith('https://') || lower.includes('zoom.us') || lower.includes('meet.google.com') || lower.includes('teams.microsoft')) {
                                  const clean = val.replace(/^online:\s*/i, '').trim();
                                  newLokasi = JSON.stringify({ tipe: 'online', linkZoom: clean, lokasiFisik: '', jam: '' });
                                } else {
                                  const clean = val.replace(/^offline:\s*/i, '').trim();
                                  newLokasi = JSON.stringify({ tipe: 'offline', linkZoom: '', lokasiFisik: clean, jam: '' });
                                }
                              }
                              const updated = [...tasks];
                              updated[idx] = { ...updated[idx], lokasi: newLokasi };
                              setTasks(updated);
                            }}
                            style={{ width: '100%', fontSize: '11px', padding: '3px 6px', height: '28px' }}
                          >
                            <option value="">{task.lokasi ? parseLocationText(task.lokasi) : '-- Tanpa Lokasi --'}</option>
                            {masterLocations.map((l, lIdx) => (
                              <option key={lIdx} value={l}>{l}</option>
                            ))}
                          </select>
                        ) : (
                          parseLocationText(task.lokasi)
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {subCount > 0 ? (
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '10px', background: 'rgba(0,0,0,0.06)', color: 'var(--text-primary)' }}>
                            {subCount} sub
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                          title="Hapus baris ini dari impor"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            💡 <em>Tips: Baris contoh dari template Excel otomatis dilewati. Anda bisa menghapus baris yang tidak diinginkan menggunakan tombol sampah di sebelah kanan.</em>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={isSubmitting || tasks.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' }}
            >
              <Upload size={16} /> {isSubmitting ? 'Menyimpan...' : `Simpan ${tasks.length} Pekerjaan ke Sistem`}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

