import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Save, CheckCircle, Edit2, AlertCircle, Copy } from 'lucide-react';
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
  onSaveBulk: (tasks: ParsedTask[]) => void;
}

export default function SmartAddModal({ isOpen, onClose, picOptions = [], categoryOptions = [], priorityOptions = [], onSaveBulk }: SmartAddModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState('');
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);

  if (!isOpen) return null;

  const handleParse = () => {
    if (!rawText.trim()) return;
    const result = parseAgendaText(rawText, picOptions, categoryOptions, priorityOptions);
    setParsedTasks(result);
    setStep(2);
  };

  const updateTask = (index: number, field: keyof ParsedTask, value: any) => {
    const updated = [...parsedTasks];
    updated[index] = { ...updated[index], [field]: value };
    setParsedTasks(updated);
  };

  const handleSave = () => {
    onSaveBulk(parsedTasks);
    // Reset state after save will be handled by parent closing modal or we do it here:
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
    toast.success('Pekerjaan berhasil disalin');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <motion.div 
        className="modal-content"
        style={{ maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="var(--accent-primary)" /> 
            Tambah Pekerjaan Cepat (Smart Add)
          </h2>
          <button className="btn btn-secondary" onClick={handleCancel} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {step === 1 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--surface-color)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '8px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-primary)' }} />
                <p style={{ margin: 0 }}>
                  <strong>Panduan Format Teks:</strong> Sistem akan secara otomatis memecah teks menjadi beberapa pekerjaan berdasarkan hal-hal berikut:
                </p>
              </div>
              <ul style={{ margin: '0 0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><strong>Judul Pekerjaan/Agenda:</strong> Terdeteksi dari format penomoran (1., 2., 3...), kata "Agenda :", atau ikon 🗒️.</li>
                <li><strong>Tanggal:</strong> Terdeteksi dari tulisan "Hari/Tanggal :" atau format kalender (misal: "Jumat, 7 Agustus 2026"). Tanggal ini otomatis menjadi Tanggal Mulai dan Selesai.</li>
                <li><strong>Jam:</strong> Terdeteksi dari kata "Waktu :", ikon ⏰, atau format XX:XX. Jika ada dua jam yang dihubungkan (misal 09:00 - 11:00), diset sebagai Jam Mulai dan Selesai.</li>
                <li><strong>Lokasi/Deskripsi:</strong> Teks dari kata "Tempat :", ikon 🏩, 📍, 🏢, atau baris baru lainnya otomatis diisi sebagai lokasi/deskripsi.</li>
                <li><strong>PIC/Kategori/Prioritas:</strong> Terdeteksi jika ada teks yang cocok dengan daftar master (misal: nama PIC lengkap, "Prioritas: High", "Kategori: Umum").</li>
              </ul>
            </div>
            
            <SmartAddTemplateManager onCopy={(content) => {
              setRawText(prev => prev ? prev + '\n\n' + content : content);
            }} />
            
            <textarea
              className="input"
              style={{ flex: 1, minHeight: '300px', resize: 'vertical', fontFamily: 'monospace' }}
              placeholder={`Ketik atau salin teks agenda ke sini...`}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={handleCancel}>Batal</button>
              <button className="btn btn-primary" onClick={handleParse} disabled={!rawText.trim()}>
                <Zap size={16} /> Proses Data
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--success)', color: '#fff', padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
              <CheckCircle size={18} />
              Berhasil mendeteksi {parsedTasks.length} pekerjaan. Silakan tinjau dan edit jika perlu sebelum menyimpan.
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
              {parsedTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Tidak ada pekerjaan yang terdeteksi dari teks yang diberikan.
                </div>
              ) : (
                parsedTasks.map((task, idx) => (
                  <div key={idx} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nama Pekerjaan</label>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleCopyTask(task)}
                            title="Salin Detail Pekerjaan"
                          >
                            <Copy size={14} /> Salin
                          </button>
                        </div>
                        <input 
                          className="input" 
                          value={task.nama} 
                          onChange={(e) => updateTask(idx, 'nama', e.target.value)} 
                          style={{ padding: '6px 10px' }}
                        />
                      </div>
                      
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>PIC</label>
                          <select 
                            className="input" 
                            value={task.pic || ''} 
                            onChange={(e) => updateTask(idx, 'pic', e.target.value)} 
                            style={{ padding: '6px 10px' }}
                          >
                            <option value="">-- Pilih PIC --</option>
                            {picOptions.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Kategori</label>
                          <select 
                            className="input" 
                            value={task.kategori || (categoryOptions.length > 0 ? categoryOptions[0] : 'Umum')} 
                            onChange={(e) => updateTask(idx, 'kategori', e.target.value)} 
                            style={{ padding: '6px 10px' }}
                          >
                            {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Prioritas</label>
                          <select 
                            className="input" 
                            value={task.prioritas || (priorityOptions.length > 0 ? (priorityOptions[1] || priorityOptions[0]) : 'Medium')} 
                            onChange={(e) => updateTask(idx, 'prioritas', e.target.value)} 
                            style={{ padding: '6px 10px' }}
                          >
                            {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tanggal</label>
                          <input 
                            type="date" 
                            className="input" 
                            value={format(task.startDate, 'yyyy-MM-dd')}
                            onChange={(e) => {
                              const d = new Date(e.target.value);
                              updateTask(idx, 'startDate', d);
                              updateTask(idx, 'endDate', d);
                            }} 
                            style={{ padding: '6px 10px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Jam Mulai</label>
                          <input 
                            type="time" 
                            className="input" 
                            value={task.startTime} 
                            onChange={(e) => updateTask(idx, 'startTime', e.target.value)} 
                            style={{ padding: '6px 10px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Jam Selesai</label>
                          <input 
                            type="time" 
                            className="input" 
                            value={task.endTime} 
                            onChange={(e) => updateTask(idx, 'endTime', e.target.value)} 
                            style={{ padding: '6px 10px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Lokasi Pekerjaan (Opsional)</label>
                        <input 
                          className="input" 
                          placeholder="Contoh: Ruang Rapat Lt. 2 ATAU Link Zoom (https://...)"
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
                          style={{ padding: '6px 10px' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Deskripsi</label>
                        <textarea 
                          className="input" 
                          value={task.deskripsi} 
                          onChange={(e) => updateTask(idx, 'deskripsi', e.target.value)} 
                          style={{ padding: '6px 10px', minHeight: '60px', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                <Edit2 size={16} /> Kembali Edit Teks
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={handleCancel}>Batal</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={parsedTasks.length === 0}>
                  <Save size={16} /> Simpan Semua ({parsedTasks.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
