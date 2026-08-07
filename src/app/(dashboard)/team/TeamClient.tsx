'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, CheckCircle2, Clock, Activity, ShieldCheck, Mail, Phone, ExternalLink, X, History, Paperclip, Eye, File, CalendarDays, Download, FileText, Copy, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import { Task, FileItem, SubTask, LogItem, getTaskFiles, getAdditionalPics, getHistoryLogs, getPriorityBadgeClass, getDynamicBadgeStyle, getGoogleCalendarUrl, handleExportICS } from '@/utils/taskUtils';
import { useMaster } from '@/context/MasterContext';
import { useFilter } from '@/context/FilterContext';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import FilePreviewModal from '@/components/FilePreviewModal';
import TaskDetailModal from '@/components/TaskDetailModal';

export default function TeamClient({ tasks: initialTasks }: { tasks: Task[] }) {
  const { masterColors } = useMaster();
  const { globalTargetFilter, globalPicFilter, globalCustomStartDate, globalCustomEndDate } = useFilter();
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
  const [selectedPic, setSelectedPic] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  const [masterPics, setMasterPics] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>([]);
  
  useEffect(() => {
    setLocalTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    const loadMasterPics = () => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.master_pics) {
            setMasterPics(data.master_pics);
          }
          if (data.master_statuses) {
            setMasterStatuses(data.master_statuses);
          }
        })
        .catch(e => console.error(e));
    };
    loadMasterPics();
    window.addEventListener('tasksUpdated', loadMasterPics);
    return () => window.removeEventListener('tasksUpdated', loadMasterPics);
  }, []);

  // Group tasks by PIC
  const picStatsMap: Record<string, { total: number; urgent: number; tasks: Task[]; statusCounts: Record<string, number> }> = {};
  
  masterPics.forEach(pic => {
    picStatsMap[pic] = { total: 0, urgent: 0, tasks: [], statusCounts: {} };
  });

  const filteredTasks = localTasks.filter(t => {
    // Filter PIC
    if (globalPicFilter !== 'Semua PIC') {
      let isMatch = false;
      if (t.pic === globalPicFilter) isMatch = true;
      if (t.additionalPics) {
        try {
          const arr = JSON.parse(t.additionalPics);
          if (Array.isArray(arr) && arr.includes(globalPicFilter)) isMatch = true;
        } catch (e) {}
      }
      if (!isMatch) return false;
    }

    // Filter Tanggal
    const taskEnd = new Date(t.endDate).getTime();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startBoundary = today.getTime();
    let endBoundary = today.getTime() + 86400000 - 1;

    if (globalTargetFilter === 'Minggu Ini') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(new Date(today).setDate(diff));
      startBoundary = monday.getTime();
      endBoundary = startBoundary + (7 * 86400000) - 1;
    } else if (globalTargetFilter === 'Bulan Ini') {
      startBoundary = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      endBoundary = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    } else if (globalTargetFilter === 'Custom' && globalCustomStartDate && globalCustomEndDate) {
      startBoundary = new Date(globalCustomStartDate).getTime();
      endBoundary = new Date(globalCustomEndDate).setHours(23, 59, 59, 999);
    }

    let matchesTarget = false;
    if (globalTargetFilter === 'Semua Waktu' || (globalTargetFilter === 'Custom' && (!globalCustomStartDate || !globalCustomEndDate))) {
      matchesTarget = true;
    } else {
      if (taskEnd >= startBoundary && taskEnd <= endBoundary) {
         matchesTarget = true;
      }
    }
    
    return matchesTarget;
  });

  filteredTasks.forEach(t => {
    let picNames = [t.pic || 'Unassigned'];
    if (t.additionalPics) {
      try {
        const extra = JSON.parse(t.additionalPics);
        if (Array.isArray(extra)) {
          picNames = picNames.concat(extra.filter(Boolean));
        }
      } catch(e) {}
    }
    picNames = Array.from(new Set(picNames)); // remove duplicates

    picNames.forEach(picName => {
      if (!picStatsMap[picName]) {
        picStatsMap[picName] = { total: 0, urgent: 0, tasks: [], statusCounts: {} };
      }
      const stat = picStatsMap[picName];
      stat.total += 1;
      
      const status = t.status || 'To Do';
      stat.statusCounts[status] = (stat.statusCounts[status] || 0) + 1;

      if (t.prioritas === 'Urgent') stat.urgent += 1;
      stat.tasks.push(t);
    });
  });

  const picList = Object.keys(picStatsMap);


  const handleSaveEdit = async () => {
    if (!detailTask) return;
    setLoading(true);
    try {
      const payload = {
        ...editForm,
        startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
        endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined,
      };
      
      const res = await fetch(`/api/tasks/${detailTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Gagal menyimpan pekerjaan');
      
      const savedTask = await res.json();
      
      // Update local state
      setLocalTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
      setDetailTask(savedTask);
      setIsEditing(false);
      
      // Dispatch event to update other components like Sidebar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('tasksUpdated'));
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pekerjaan ini? Tindakan ini tidak dapat dibatalkan.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus pekerjaan');
      
      setLocalTasks(prev => prev.filter(t => t.id !== id));
      if (detailTask && detailTask.id === id) setDetailTask(null);
      
      import('react-hot-toast').then(({ default: toast }) => toast.success('Pekerjaan berhasil dihapus'));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
    } catch (error: any) {
      import('react-hot-toast').then(({ default: toast }) => toast.error(error.message || 'Terjadi kesalahan'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredTasks.map(t => {
      let extraPics = [];
      if (t.additionalPics) {
        try {
          const arr = JSON.parse(t.additionalPics);
          if (Array.isArray(arr)) extraPics = arr;
        } catch(e){}
      }

      return {
        'Nama Pekerjaan': t.nama,
        'PIC Utama': t.pic,
        'PIC Tambahan': extraPics.join(', '),
        'Kategori': t.kategori || 'Umum',
        'Prioritas': t.prioritas || 'Medium',
        'Status': t.status,
        'Progress (%)': t.progress || 0,
        'Tanggal Mulai': t.startDate ? format(new Date(t.startDate), 'yyyy-MM-dd') : '',
        'Tenggat Waktu': t.endDate ? format(new Date(t.endDate), 'yyyy-MM-dd') : '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Manajemen Tim');
    XLSX.writeFile(wb, `Manajemen_Tim_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPdf(true);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('team-container');
      if (!element) {
        setIsExportingPdf(false);
        return;
      }

      const width = element.scrollWidth;
      const height = element.scrollHeight;

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        windowWidth: width,
        windowHeight: height,
        width: width,
        height: height
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: width > height ? 'l' : 'p',
        unit: 'px',
        format: [width, height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`Manajemen_Tim_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      setIsExportingPdf(false);
    } catch (err) {
      console.error('PDF Export error:', err);
      setIsExportingPdf(false);
      import('react-hot-toast').then(({ default: toast }) => toast.error('Gagal mengekspor PDF'));
    }
  };

  const handleCopyImage = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('team-container');
      if (!element) return;
      
      const width = element.scrollWidth;
      const height = element.scrollHeight;

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        windowWidth: width,
        windowHeight: height,
        width: width,
        height: height
      });
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            import('react-hot-toast').then(({ default: toast }) => toast.success('Gambar tim disalin ke clipboard'));
          } catch(err) {
            console.error(err);
            import('react-hot-toast').then(({ default: toast }) => toast.error('Gagal menyalin gambar, izin ditolak.'));
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy Image error:', err);
      import('react-hot-toast').then(({ default: toast }) => toast.error('Gagal menyalin gambar'));
    }
  };

  return (
    <div id="team-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Manajemen Tim & PIC</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Direktori personil penanggung jawab (PIC) serta pemantauan produktivitas & beban kerja tim.
          </p>
        </div>
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <button 
            className="btn" 
            onClick={handleExportExcel}
            title="Export Excel"
            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 0, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
          >
            <Download size={16} /> <span className="hide-mobile">Excel</span>
          </button>
          <button 
            className="btn" 
            onClick={handleExportPDF} 
            disabled={isExportingPdf}
            title="Export PDF"
            style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 0, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, borderLeft: '1px solid rgba(255,255,255,0.2)', opacity: isExportingPdf ? 0.7 : 1 }}
          >
            <FileText size={16} /> <span className="hide-mobile">{isExportingPdf ? '...' : 'PDF'}</span>
          </button>
          <button 
            className="btn" 
            onClick={handleCopyImage}
            title="Copy Image"
            style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 0, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, borderLeft: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Copy size={16} /> <span className="hide-mobile">Copy</span>
          </button>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {picList.map((picName) => {
          const stat = picStatsMap[picName];
          const doneCount = stat.statusCounts['Done'] || 0;
          const rate = stat.total > 0 ? Math.round((doneCount / stat.total) * 100) : 0;
          const isSelected = selectedPic === picName;

          return (
            <div 
              key={picName} 
              className="glass" 
              style={{ 
                padding: '20px', 
                border: isSelected ? `2px solid ${getDynamicBadgeStyle('pic', picName, '', masterColors).style?.color || 'var(--accent-primary)'}` : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelectedPic(isSelected ? null : picName)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: getDynamicBadgeStyle('pic', picName, '', masterColors).style?.color || 'var(--accent-primary)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  {picName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{picName}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Person In Charge</span>
                </div>
              </div>

              {/* Progress & Stats */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Penyelesaian Tugas</span>
                  <span style={{ fontWeight: 'bold', color: getDynamicBadgeStyle('pic', picName, '', masterColors).style?.color || 'var(--accent-primary)' }}>{rate}%</span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${rate}%`, backgroundColor: rate === 100 ? 'var(--success)' : (getDynamicBadgeStyle('pic', picName, '', masterColors).style?.color || 'var(--accent-primary)') }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', textAlign: 'center', background: 'var(--input-bg)', padding: '10px', borderRadius: '10px' }}>
                {(masterStatuses.length > 0 ? masterStatuses : Object.keys(stat.statusCounts)).map((statusName) => {
                  const color = masterColors[`status_${statusName}`] ? masterColors[`status_${statusName}`].substring(0,7) : 'var(--text-primary)';
                  if (!stat.statusCounts[statusName]) return null; // Only show statuses that have count > 0 for this PIC
                  return (
                    <div key={statusName}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={statusName}>{statusName}</span>
                      <span style={{ fontWeight: 'bold', color: color }}>{stat.statusCounts[statusName] || 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {picList.length === 0 && (
          <div className="glass" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
            Belum ada PIC yang terdaftar di dalam sistem.
          </div>
        )}
      </div>

      {/* Selected PIC Detail Table */}
      {selectedPic && picStatsMap[selectedPic] && (
        <div className="glass" style={{ padding: '24px', marginTop: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Daftar Pekerjaan Ditangani oleh: <span style={{ color: 'var(--accent-primary)' }}>{selectedPic}</span> (Klik nama pekerjaan untuk membuka detail)
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px' }}>Nama Pekerjaan</th>
                  <th style={{ padding: '12px' }}>Kategori</th>
                  <th style={{ padding: '12px' }}>Prioritas</th>
                  <th style={{ padding: '12px' }}>Status & Progress</th>
                  <th style={{ padding: '12px' }}>Tenggat Waktu</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {picStatsMap[selectedPic].tasks.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => { setDetailTask(t); setEditForm(t); setIsEditing(false); }}>
                      {t.nama}
                    </td>
                    <td style={{ padding: '12px' }}>{t.kategori || 'Umum'}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${getPriorityBadgeClass(t.prioritas)}`}>
                        {t.prioritas || 'Medium'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span {...getDynamicBadgeStyle('status', t.status, 'badge', masterColors)}>
                        {t.status}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>({t.progress || 0}%)</span>
                    </td>
                    <td style={{ padding: '12px' }}>{format(new Date(t.endDate), 'dd MMM yyyy')}{!t.isAllDay && t.endTime ? `, ${t.endTime}` : ''}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => { setDetailTask(t); setEditForm(t); setIsEditing(false); }}>
                        Detail Pekerjaan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
        setPreviewFile={setPreviewFile}
        onEdit={() => {
          let repetisiValue = detailTask!.repetisi || 'Tidak Berulang';
      
          let parsedSubTasks: SubTask[] = [];
          if (detailTask!.subTasksJson) {
            try {
              parsedSubTasks = JSON.parse(detailTask!.subTasksJson);
            } catch (e) {}
          }

          setEditForm({
            ...detailTask!,
            repetisi: repetisiValue,
            startDate: detailTask!.startDate ? new Date(detailTask!.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: detailTask!.endDate ? new Date(detailTask!.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            isCustomCategory: false,
            isCustomPic: false,
            filesList: getTaskFiles(detailTask!),
            additionalPicsList: getAdditionalPics(detailTask!),
            subTasksList: parsedSubTasks
          });
          setIsEditing(true);
        }}
        onDelete={() => handleDeleteTask(detailTask!.id)}
      />

      <TaskAddEditModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        taskToEdit={editForm as Task}
        onSave={handleSaveEdit}
        formPicOptions={[...masterPics]}
        formCategoryOptions={[]} 
        setPreviewFile={setPreviewFile}
      />
      <FilePreviewModal previewFile={previewFile} setPreviewFile={setPreviewFile} />
    </div>
  );
}