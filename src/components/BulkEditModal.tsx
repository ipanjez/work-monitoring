'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTaskIds: number[];
  field: 'status' | 'kategori' | 'pic' | 'deskripsi' | 'jadwal' | null;
  masterStatuses: string[];
  masterCats: string[];
  masterPics: string[];
  masterStatusProgress: Record<string, number>;
  onSuccess: () => void;
}

export default function BulkEditModal({
  isOpen,
  onClose,
  selectedTaskIds,
  field,
  masterStatuses,
  masterCats,
  masterPics,
  masterStatusProgress,
  onSuccess
}: BulkEditModalProps) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for jadwal
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [repetisi, setRepetisi] = useState('none');

  useEffect(() => {
    if (isOpen) {
      setValue('');
    }
  }, [isOpen, field]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!field || selectedTaskIds.length === 0) return;

    if (field !== 'deskripsi' && field !== 'jadwal' && !value) {
      toast.error('Nilai tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: any = {};
      if (field === 'jadwal') {
        updates.startDate = new Date(startDate).toISOString();
        updates.endDate = new Date(endDate).toISOString();
        updates.isAllDay = isAllDay;
        updates.startTime = isAllDay ? null : startTime;
        updates.endTime = isAllDay ? null : endTime;
        updates.repetisi = repetisi;
      } else {
        updates[field] = value;
        // Auto progress mapping
        if (field === 'status') {
           if (masterStatusProgress[value] !== undefined) {
               updates.progress = masterStatusProgress[value];
           } else {
               if (value === 'Done') updates.progress = 100;
               else if (value === 'In Progress') updates.progress = 50;
               else if (value === 'To Do') updates.progress = 0;
           }
        }
      }

      const res = await fetch('/api/tasks/bulk-edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedTaskIds, updates })
      });

      if (!res.ok) throw new Error('Gagal update massal');

      toast.success(`${selectedTaskIds.length} Pekerjaan berhasil diubah!`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (field) {
      case 'status': return 'Ubah Status Massal';
      case 'kategori': return 'Ubah Kategori Massal';
      case 'pic': return 'Ubah PIC Massal';
      case 'deskripsi': return 'Ubah Deskripsi Massal';
      case 'jadwal': return 'Ubah Jadwal & Waktu Massal';
      default: return 'Edit Massal';
    }
  };

  if (!isOpen || !field) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }}
          style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{getTitle()}</h3>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Pilih {field.charAt(0).toUpperCase() + field.slice(1)} Baru untuk {selectedTaskIds.length} Pekerjaan</label>
              
              {field === 'status' && (
                <select className="form-control" value={value} onChange={e => setValue(e.target.value)} required>
                  <option value="">-- Pilih Status --</option>
                  {(masterStatuses.length > 0 ? masterStatuses : ['To Do', 'In Progress', 'Done']).map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              )}

              {field === 'kategori' && (
                <select className="form-control" value={value} onChange={e => setValue(e.target.value)} required>
                  <option value="">-- Pilih Kategori --</option>
                  {masterCats.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              {field === 'pic' && (
                <select className="form-control" value={value} onChange={e => setValue(e.target.value)} required>
                  <option value="">-- Pilih PIC --</option>
                  {masterPics.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}

              {field === 'deskripsi' && (
                <textarea 
                  className="form-control" 
                  value={value} 
                  onChange={e => setValue(e.target.value)} 
                  placeholder="Ketik deskripsi baru (Kosongkan jika ingin menghapus deskripsi lama)"
                  rows={4}
                />
              )}

              {field === 'jadwal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Tanggal Mulai</label>
                      <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Tenggat Waktu</label>
                      <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
                      <input type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} />
                      Sepanjang Hari
                    </label>
                  </div>
                  {!isAllDay && (
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Waktu Mulai</label>
                        <input type="time" className="form-control" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Waktu Selesai</label>
                        <input type="time" className="form-control" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                      </div>
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Repetisi Pekerjaan</label>
                    <select className="form-control" value={repetisi} onChange={e => setRepetisi(e.target.value)}>
                      <option value="none">Tidak Berulang</option>
                      <option value="daily">Setiap Hari</option>
                      <option value="weekly">Setiap Minggu</option>
                      <option value="monthly">Setiap Bulan</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                <Check size={16} style={{ marginRight: '6px' }} />
                Simpan {isSubmitting ? '...' : ''}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
