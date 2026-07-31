'use client';
import { useMaster } from '@/context/MasterContext';
import { copyToClipboard } from '@/utils/clipboard';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { id } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-override.css';
import { 
  ExternalLink, CalendarDays, X, Paperclip, Plus, Pencil, Trash2, File, Eye, Repeat, UserPlus, History, Download, Search, Filter, AlertCircle, Copy 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createEvent, createEvents, EventAttributes } from 'ics';
import toast from 'react-hot-toast';
import FileViewer from '@/components/FileViewer';

const locales = {
  'id': id,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

import { Task, FileItem, SubTask, LogItem, getTaskFiles, getAdditionalPics, getHistoryLogs, getDynamicBadgeStyle, getGoogleCalendarUrl, handleExportICS } from '@/utils/taskUtils';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import FilePreviewModal from '@/components/FilePreviewModal';
import TaskDetailModal from '@/components/TaskDetailModal';

export default function CalendarClient({ tasks: initialTasks }: { tasks: Task[] }) {
  const { masterColors } = useMaster();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);


  // Calendar View & Date Controlled State (Fix for Month/Week/Day/Agenda buttons)
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Interactive Copyable Error Modal State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // In-App File Preview Modal State
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const router = useRouter();
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [masterCats, setMasterCats] = useState<string[]>([]);
  const [masterPics, setMasterPics] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>([]);
  const [masterPriorities, setMasterPriorities] = useState<string[]>([]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.master_categories) setMasterCats(data.master_categories);
        if (data.master_pics) setMasterPics(data.master_pics);
        if (data.master_statuses) setMasterStatuses(data.master_statuses);
        if (data.master_priorities) setMasterPriorities(data.master_priorities);
      })
      .catch(e => console.error(e));
  }, []);

  const allCategoryOptions = Array.from(new Set([...masterCats, ...tasks.map(t => t.kategori).filter((c): c is string => Boolean(c))]));

  const allPicsSet = new Set<string>(masterPics);
  tasks.forEach(t => {
    if (t.pic) allPicsSet.add(t.pic);
    if (t.additionalPics) {
      try {
        const arr = JSON.parse(t.additionalPics);
        if (Array.isArray(arr)) arr.forEach((p: string) => p && allPicsSet.add(p));
      } catch (e) {}
    }
  });
  const existingPics = Array.from(allPicsSet);


  // Filter Tasks for Calendar
  const filteredTasks = tasks.filter(task => {
    const extraPics = getAdditionalPics(task).join(' ');
    const matchesSearch = task.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          extraPics.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (task.kategori && task.kategori.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesFilter = true;
    if (activeFilter !== 'All') {
      matchesFilter = task.prioritas === activeFilter || task.status === activeFilter;
    }

    return matchesSearch && matchesFilter;
  });

  const events = filteredTasks.map(task => {
    let startDateObj = new Date(task.startDate);
    let endDateObj = new Date(task.endDate);

    const isAllDay = task.isAllDay !== false; // Default to true if undefined

    if (!isAllDay && task.startTime && task.endTime) {
      const [startH, startM] = task.startTime.split(':').map(Number);
      startDateObj.setHours(startH, startM, 0, 0);

      const [endH, endM] = task.endTime.split(':').map(Number);
      endDateObj.setHours(endH, endM, 0, 0);
    } else {
      startDateObj.setHours(0, 0, 0, 0);
      // For all day events, end date must be at least the next day or 23:59
      endDateObj.setHours(23, 59, 59, 999);
    }

    return {
      title: `${task.nama} (${task.pic})`,
      start: startDateObj,
      end: endDateObj,
      allDay: isAllDay,
      resource: task,
    };
  });

  const eventStyleGetter = (event: any) => {
    const task = event.resource as Task;
    const dynamicStyle = getDynamicBadgeStyle('priority', task.prioritas || 'Medium', '', masterColors);
    const backgroundColor = dynamicStyle.style?.backgroundColor || '#3b82f6';
    const textColor = dynamicStyle.style?.color || 'white';

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: textColor,
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '3px 6px',
        fontWeight: '500',
      }
    };
  };

  const handleOpenEditModal = (task: Task) => {
    setSelectedTask(null);
    setEditingTask({
      ...task,
      filesList: getTaskFiles(task),
      additionalPicsList: getAdditionalPics(task),
      isAllDay: task.isAllDay !== undefined ? Boolean(task.isAllDay) : true,
      startTime: task.startTime || '08:00',
      endTime: task.endTime || '17:00',
      repetisi: task.repetisi || 'Tidak Berulang',
      startDate: typeof task.startDate === 'string' ? task.startDate.split('T')[0] : new Date(task.startDate).toISOString().split('T')[0],
      endDate: typeof task.endDate === 'string' ? task.endDate.split('T')[0] : new Date(task.endDate).toISOString().split('T')[0],
      isCustomCategory: false,
      isCustomPic: false,
    });
    setIsEditModalOpen(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    const startStr = slotInfo.start.toISOString().split('T')[0];
    const endStr = slotInfo.end.toISOString().split('T')[0];
    setEditingTask({
      nama: '',
      pic: '',
      status: 'To Do',
      prioritas: 'Medium',
      kategori: 'Umum',
      progress: 0,
      deskripsi: '',
      catatan: '',
      filesList: [],
      additionalPicsList: [],
      isAllDay: true,
      startTime: '08:00',
      endTime: '17:00',
      repetisi: 'Tidak Berulang',
      startDate: startStr,
      endDate: endStr,
      isCustomCategory: false,
      isCustomPic: false,
    });
    setIsEditModalOpen(true);
  };


  const handleSaveModal = async () => {
    if (!editingTask || !editingTask.nama || !editingTask.pic) {
      const msg = 'Nama pekerjaan dan PIC wajib diisi.';
      setErrorMessage(`Validation Error: ${msg}`);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const isNew = !editingTask.id;
      const url = isNew ? '/api/tasks' : `/api/tasks/${editingTask.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const filteredExtraPics = (editingTask.additionalPicsList || []).filter(Boolean);

      const filesListToSave = editingTask.filesList && editingTask.filesList.length > 0 
        ? editingTask.filesList 
        : (editingTask.fileUrl ? [{ url: editingTask.fileUrl, name: editingTask.fileName || 'File Lampiran' }] : []);

      const payload = {
        ...editingTask,
        startDate: editingTask.startDate || new Date().toISOString().split('T')[0],
        endDate: editingTask.endDate || new Date().toISOString().split('T')[0],
        fileUrl: filesListToSave[0]?.url || editingTask.fileUrl || null,
        fileName: filesListToSave[0]?.name || editingTask.fileName || null,
        filesJson: filesListToSave.length > 0 ? JSON.stringify(filesListToSave) : null,
        additionalPics: filteredExtraPics.length > 0 ? JSON.stringify(filteredExtraPics) : null,
      };

      const saveRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) {
        const errorText = await saveRes.text();
        setErrorMessage(`Server Error (${saveRes.status}):\n${errorText}`);
        return;
      }

      const savedTask: Task = await saveRes.json();

      if (isNew) {
        setTasks(prev => [savedTask, ...prev]);
      } else {
        setTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
      }

      setIsEditModalOpen(false);
      setEditingTask(null);

      const res = await fetch('/api/tasks');
      if (res.ok) {
        const updated = await res.json();
        if (Array.isArray(updated)) setTasks(updated);
      }
      router.refresh();
      toast.success(`Pekerjaan "${savedTask.nama}" berhasil ${isNew ? 'ditambahkan' : 'diperbarui'}!`);
    } catch (error: any) {
      console.error('Save error:', error);
      setErrorMessage(`Network / Application Error:\n${error?.stack || error?.message || error}`);
      toast.error(`Gagal menyimpan pekerjaan: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pekerjaan ini dari kalender?')) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
      setSelectedTask(null);
      router.refresh();
      toast.success('Pekerjaan berhasil dihapus dari kalender.');
    } catch (error: any) {
      console.error(error);
      setErrorMessage(`Delete Error:\n${error?.message || error}`);
      toast.error('Gagal menghapus pekerjaan.');
    }
  };

  const getGoogleCalendarUrl = (task: Task) => {
    const extraPics = getAdditionalPics(task);
    const allPicsStr = [task.pic, ...extraPics].join(', ');
    const title = encodeURIComponent(task.nama);
    const details = encodeURIComponent(`PIC: ${allPicsStr}\nKategori: ${task.kategori || 'Umum'}\nPrioritas: ${task.prioritas || 'Medium'}\nRepetisi: ${task.repetisi || 'Tidak Berulang'}\nStatus: ${task.status}\n\nDeskripsi:\n${task.deskripsi || '-'}`);
    const dates = `${new Date(task.startDate).toISOString().replace(/-|:|\.\d+/g, '')}/${new Date(task.endDate).toISOString().replace(/-|:|\.\d+/g, '')}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
  };

  const handleExportICS = (task: Task) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const extraPics = getAdditionalPics(task);
    const allPicsStr = [task.pic, ...extraPics].join(', ');

    const event: EventAttributes = {
      title: `[${task.kategori || 'Pekerjaan'}] ${task.nama}`,
      description: `PIC: ${allPicsStr}\nStatus: ${task.status}\nPrioritas: ${task.prioritas}\nRepetisi: ${task.repetisi || 'Tidak Berulang'}\nDeskripsi: ${task.deskripsi || '-'}`,
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), 9, 0],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), 17, 0],
    };

    createEvent(event, (error, value) => {
      if (error) {
        console.error(error);
        return;
      }
      const blob = new Blob([value], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${task.nama.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
      a.click();
    });
  };

  const getPriorityBadgeClass = (p?: string | null) => {
    switch (p) {
      case 'Urgent': return 'badge-urgent';
      case 'High': return 'badge-high';
      case 'Low': return 'badge-low';
      default: return 'badge-medium';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <datalist id="calendar-pics-list">
        {existingPics.map((p, idx) => (
          <option key={idx} value={p} />
        ))}
      </datalist>

      {/* Search & Interactive Filter Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Real-time Calendar Search */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="input"
            style={{ paddingLeft: '40px' }}
            placeholder="Cari kalender pekerjaan, PIC..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

          {/* Interactive Legend Filter Pill Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn" 
            onClick={() => setActiveFilter('All')}
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px', 
              borderRadius: '20px', 
              background: activeFilter === 'All' ? 'var(--accent-primary)' : 'var(--surface-color)', 
              color: activeFilter === 'All' ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            Semua ({tasks.length})
          </button>
          
          {[...masterPriorities, ...masterStatuses].map(filterValue => {
            const isStatus = masterStatuses.includes(filterValue);
            const dynamicStyle = getDynamicBadgeStyle(isStatus ? 'status' : 'priority', filterValue, '', masterColors);
            const color = dynamicStyle.style?.color || 'var(--accent-primary)';
            const bgColor = dynamicStyle.style?.backgroundColor || 'var(--surface-color)';
            
            return (
              <button 
                key={filterValue}
                type="button" 
                className="btn" 
                onClick={() => setActiveFilter(activeFilter === filterValue ? 'All' : filterValue)}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '12px', 
                  borderRadius: '20px', 
                  background: activeFilter === filterValue ? bgColor : 'var(--surface-color)',
                  color: activeFilter === filterValue ? color : bgColor,
                  border: `1px solid ${bgColor}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: activeFilter === filterValue ? color : bgColor }} /> 
                {filterValue}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              const feedUrl = `${window.location.origin}/calendar.ics`;
              copyToClipboard(feedUrl);
              toast.success('URL Kalender berhasil disalin ke clipboard!');
              alert(`URL Sinkronisasi Kalender Berhasil Disalin!\n\n${feedUrl}\n\nCara Pakai di Google Calendar:\n1. Buka Google Calendar\n2. Klik + di samping 'Other calendars' (Kalender Lain)\n3. Pilih 'From URL' (Dari URL)\n4. Tempel (Paste) URL ini & klik 'Add calendar'`);
            }}
            title="Salin URL Feed iCal untuk Auto Sinkronisasi ke Google Calendar / Outlook"
          >
            <CalendarDays size={16} color="#4285F4" /> Salin URL Feed Kalender
          </button>
          <button className="btn btn-primary" onClick={() => handleSelectSlot({ start: new Date(), end: new Date() })} style={{ fontSize: '13px' }}>
            <Plus size={16} /> Tambah Pekerjaan
          </button>
        </div>
      </div>

      {/* Main Controlled Calendar Component */}
      <div className="glass" style={{ padding: '24px 28px', minHeight: '820px', display: 'flex', flexDirection: 'column' }}>
        <Calendar
          localizer={localizer}
          events={events}
          selectable={true}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(event) => setSelectedTask(event.resource)}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          style={{ height: '780px', color: 'var(--text-primary)' }}
          eventPropGetter={eventStyleGetter}
          culture="id"
          messages={{
            next: "Selanjutnya",
            previous: "Sebelumnya",
            today: "Hari Ini",
            month: "Bulan",
            week: "Minggu",
            day: "Hari",
            agenda: "Agenda"
          }}
        />
      </div>

      {/* Task Pop-up Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content"
              style={{ maxWidth: '650px' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span className={`badge ${getPriorityBadgeClass(selectedTask.prioritas)}`} style={{ marginBottom: '8px' }}>
                    {selectedTask.prioritas || 'Medium'} Priority
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{selectedTask.nama}</h3>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setSelectedTask(null)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--surface-color)', padding: '12px', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PIC:</span>
                    <p style={{ fontWeight: '600' }}>
                      {selectedTask.pic} {getAdditionalPics(selectedTask).length > 0 && `(+, ${getAdditionalPics(selectedTask).join(', ')})`}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Kategori:</span>
                    <p style={{ fontWeight: '600' }}>{selectedTask.kategori || 'Umum'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status:</span>
                    <p style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{selectedTask.status} ({selectedTask.progress || 0}%)</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Repetisi:</span>
                    <p style={{ fontWeight: '600' }}>{selectedTask.repetisi || 'Tidak Berulang'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tanggal Mulai:</span>
                    <p>{format(new Date(selectedTask.startDate), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tenggat Waktu:</span>
                    <p>{format(new Date(selectedTask.endDate), 'dd MMM yyyy')}</p>
                  </div>
                </div>

                {/* Audit Logging Information Box */}
                <div style={{ background: 'var(--input-bg)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History size={15} color="var(--accent-primary)" /> Log Informasi & Riwayat Edit
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Dibuat Pada</span>
                      <span style={{ fontWeight: 600 }}>
                        {selectedTask.createdAt ? format(new Date(selectedTask.createdAt), 'dd MMM yyyy HH:mm') : '-'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Terakhir Diedit</span>
                      <span style={{ fontWeight: 600 }}>
                        {selectedTask.lastEditedAt ? format(new Date(selectedTask.lastEditedAt), 'dd MMM yyyy HH:mm') : 'Belum pernah'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Frekuensi Edit</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {selectedTask.editCount || 0} kali
                      </span>
                    </div>
                  </div>

                  {getHistoryLogs(selectedTask).length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Timeline Aktivitas:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '100px', overflowY: 'auto' }}>
                        {getHistoryLogs(selectedTask).map((log, idx) => (
                          <div key={idx} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>• {log.action}</span>
                            <span>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedTask.deskripsi && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '10px', borderRadius: '8px' }}>
                    {selectedTask.deskripsi}
                  </p>
                )}

                {/* Sub-Tasks Display */}
                {selectedTask.subTasksJson && (() => {
                  let subTasks: SubTask[] = [];
                  try {
                    subTasks = JSON.parse(selectedTask.subTasksJson);
                  } catch (e) {}
                  
                  if (subTasks.length === 0) return null;
                  
                  return (
                    <div style={{ background: 'var(--surface-color)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '4px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Sub Pekerjaan</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {subTasks.map(subTask => (
                          <div key={subTask.id} style={{ padding: '8px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 500, fontSize: '13px' }}>{subTask.text}</span>
                              <span style={{ 
                                padding: '3px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                                backgroundColor: subTask.status === 'Done' ? 'var(--success)' : 
                                                 subTask.status === 'In Progress' ? 'var(--warning)' : 
                                                 'var(--surface-color)',
                                color: subTask.status === 'To Do' ? 'var(--text-primary)' : '#fff'
                              }}>
                                {subTask.status}
                              </span>
                            </div>
                            {subTask.logs && subTask.logs.length > 0 && (
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', paddingLeft: '2px' }}>
                                {subTask.logs.map((log, lidx) => (
                                  <div key={lidx} style={{ display: 'flex', gap: '6px' }}>
                                    <span>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</span>
                                    <span>- {log.status}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Multiple Files Detail Display */}
                {getTaskFiles(selectedTask).length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      File Lampiran ({getTaskFiles(selectedTask).length} File)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {getTaskFiles(selectedTask).map((f, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--surface-color)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', opacity: f.isDeleted ? 0.6 : 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: f.isDeleted ? 'line-through' : 'none' }}>
                              <Paperclip size={14} color={f.isDeleted ? "var(--text-secondary)" : "var(--accent-primary)"} />
                              <span style={{ fontSize: '12px', color: f.isDeleted ? 'var(--text-secondary)' : 'inherit' }}>{f.name}</span>
                            </div>
                            {!f.isDeleted && (
                              <button 
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '2px 6px' }}
                                onClick={() => setPreviewFile(f)}
                              >
                                <Eye size={12} color="var(--text-secondary)" />
                              </button>
                            )}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            {f.uploadedAt && <span>Diunggah pada {format(new Date(f.uploadedAt), 'dd/MM/yyyy HH:mm')}</span>}
                            {f.isDeleted && f.deletedAt && <span style={{ marginLeft: '4px', color: 'var(--danger)' }}>• Dihapus pada {format(new Date(f.deletedAt), 'dd/MM/yyyy HH:mm')}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => handleOpenEditModal(selectedTask)}>
                    <Pencil size={15} /> Edit Pekerjaan Ini
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDeleteTask(selectedTask.id)}>
                    <Trash2 size={15} /> Hapus Pekerjaan
                  </button>
                  <a href={getGoogleCalendarUrl(selectedTask)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    <ExternalLink size={15} /> Google Calendar
                  </a>
                  <button className="btn btn-secondary" onClick={() => handleExportICS(selectedTask)}>
                    <CalendarDays size={15} /> .ics
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TaskAddEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        taskToEdit={editingTask}
        onSave={handleSaveModal}
        formPicOptions={[...masterPics]}
        formCategoryOptions={[...masterCats, 'Umum']}
        formStatusOptions={masterStatuses}
        formPriorityOptions={masterPriorities}
        setPreviewFile={setPreviewFile}
      />

      {/* Interactive Copyable Error Details Modal */}
      <AnimatePresence>
        {errorMessage && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <motion.div 
              className="modal-content"
              style={{ maxWidth: '600px', border: '1px solid var(--danger)' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                  <AlertCircle size={22} />
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Terjadi Kesalahan Sistem</h3>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setErrorMessage(null)}>
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Rincian error sistem ditampilkan di bawah ini. Anda dapat menyalin seluruh pesan error ini dengan menekan tombol di bawah untuk dikirimkan kepada tim pengembang:
              </p>

              <div style={{ background: '#1e1e1e', color: '#f87171', padding: '14px', borderRadius: '10px', fontFamily: 'monospace', fontSize: '12px', maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', border: '1px solid #7f1d1d' }}>
                {errorMessage}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setErrorMessage(null)}
                >
                  Tutup
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ background: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    copyToClipboard(errorMessage);
                    toast.success('Detail error berhasil disalin ke clipboard!');
                  }}
                >
                  <Copy size={16} /> Salin Detail Error
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
      <FilePreviewModal previewFile={previewFile} setPreviewFile={setPreviewFile} />
    </div>
  );
}