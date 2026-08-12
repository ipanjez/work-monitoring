'use client';
import { useMaster } from '@/context/MasterContext';
import { useFilter } from '@/context/FilterContext';
import { copyToClipboard } from '@/utils/clipboard';
import { checkSearchMatch } from '@/utils/searchUtils';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar as BigCalendar, dateFnsLocalizer, View, EventProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { getTaskComments } from '@/utils/taskUtils';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-override.css';
import { 
  ExternalLink, CalendarDays, X, Paperclip, Plus, Pencil, Trash2, File, Eye, Repeat, UserPlus, History, Download, Search, Filter, AlertCircle, Copy, FileText, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
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

import { Task, FileItem, SubTask, LogItem, getTaskFiles, getAdditionalPics, getHistoryLogs, getDynamicBadgeStyle, getGoogleCalendarUrl, handleExportICS, formatRecurrenceText, getTaskExportRow } from '@/utils/taskUtils';
import { exportToRichExcel } from '@/utils/excelExport';
import { expandTasksForCalendar } from '@/utils/recurrenceUtils';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import FilePreviewModal from '@/components/FilePreviewModal';
import TaskDetailModal from '@/components/TaskDetailModal';
import UniversalFilterBar from '@/components/UniversalFilterBar';
import UniversalActionBar from '@/components/UniversalActionBar';
import { useSession } from 'next-auth/react';
import { hasPermission, RolePermissionsConfig, defaultRolePermissions } from '@/lib/permissions';

export default function CalendarClient({ tasks: initialTasks }: { tasks: Task[] }) {
  const { data: session } = useSession();
  const userRole: string = (session?.user as any)?.role || 'PIC';

  const { 
    masterColors, 
    masterCats, 
    masterStatuses, 
    masterPriorities, 
    masterPics,
    roleConfig
  } = useMaster();
  const { 
    globalTargetFilter, setGlobalTargetFilter, 
    globalPicFilter, setGlobalPicFilter, 
    globalCustomStartDate, setGlobalCustomStartDate, 
    globalCustomEndDate, setGlobalCustomEndDate,
    globalSearchQuery: searchQuery,
    globalFilterStatus: filterStatus,
    globalFilterPriority: filterPriority,
    globalFilterCategory: filterCategory,
    globalSearchExactMatch
  } = useFilter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [loading, setLoading] = useState(false);


  // Calendar View & Date Controlled State (Fix for Month/Week/Day/Agenda buttons)
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());

  // Search & Filter State
  const searchParams = useSearchParams();

  // Interactive Copyable Error Modal State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // In-App File Preview Modal State
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const router = useRouter();
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [fetchedYears, setFetchedYears] = useState<Set<number>>(new Set());

  useEffect(() => {
    const year = date.getFullYear();
    if (fetchedYears.has(year)) return;

    const fetchHolidays = async () => {
      try {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`);
        if (res.ok) {
          const data = await res.json();
          const newHols: Record<string, string> = {};
          data.forEach((h: any) => {
            newHols[h.date] = h.localName;
          });
          setHolidays(prev => ({ ...prev, ...newHols }));
          setFetchedYears(prev => new Set(prev).add(year));
        }
      } catch (err) {
        console.error('Failed to fetch holidays', err);
      }

      // Hardcoded fallback/supplement for 2026 (especially for Indonesian Cuti Bersama & Islamic Holidays missing from generic APIs)
      if (year === 2026) {
        const extraHols2026: Record<string, string> = {
          "2026-02-14": "Isra Mikraj Nabi Muhammad SAW",
          "2026-02-17": "Tahun Baru Imlek 2577 Kongzili",
          "2026-03-19": "Hari Suci Nyepi Tahun Baru Saka 1948",
          "2026-03-20": "Idul Fitri 1447 Hijriah",
          "2026-03-21": "Idul Fitri 1447 Hijriah",
          "2026-05-27": "Idul Adha 1447 Hijriah",
          "2026-05-31": "Hari Raya Waisak 2570 BE",
          "2026-06-17": "Tahun Baru Islam 1448 Hijriah",
          "2026-08-17": "Hari Kemerdekaan Republik Indonesia",
          "2026-08-26": "Maulid Nabi Muhammad SAW"
        };
        setHolidays(prev => ({ ...prev, ...extraHols2026 }));
      }
    };

    fetchHolidays();
  }, [date]);

  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated && updated !== selectedTask) {
        setSelectedTask(updated);
      }
    }
  }, [tasks, selectedTask]);

  const customDayPropGetter = (d: Date) => {
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayOfWeek = getDay(d);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holidayName = holidays[dateStr];

    if (holidayName || isWeekend) {
      return {
        className: 'holiday-cell',
        style: {
          backgroundColor: 'var(--danger-light, rgba(239, 68, 68, 0.08))',
        },
        title: holidayName || (dayOfWeek === 0 ? 'Minggu' : 'Sabtu')
      };
    }
    return {};
  };

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    // Search query from URL is now handled globally, or can be synced if needed
  }, [searchParams]);

  useEffect(() => {
    // Search query from URL is now handled globally, or can be synced if needed
  }, [searchParams]);

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
    const matchesSearch = checkSearchMatch(task, searchQuery, globalSearchExactMatch);
    
    let matchesFilter = true;
    if (filterStatus !== 'All' && task.status !== filterStatus) matchesFilter = false;
    if (filterPriority !== 'All' && task.prioritas !== filterPriority) matchesFilter = false;
    if (filterCategory !== 'All' && task.kategori !== filterCategory) matchesFilter = false;

    const matchesPic = globalPicFilter === 'Semua PIC' || task.pic === globalPicFilter || getAdditionalPics(task).includes(globalPicFilter);

    // Target Waktu Filter
    const start = new Date(task.startDate).getTime();
    const end = new Date(task.endDate).getTime();
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
      if (end >= startBoundary && end <= endBoundary) {
         matchesTarget = true;
      }
    }

    return matchesSearch && matchesFilter && matchesPic && matchesTarget;
  });

  // Expand recurring tasks
  const currentYear = new Date().getFullYear();
  const rangeStart = new Date(currentYear - 1, 0, 1);
  const rangeEnd = new Date(currentYear + 2, 11, 31);
  const expandedTasks = expandTasksForCalendar(filteredTasks, rangeStart, rangeEnd);

  // Map to Calendar Events
  const events = expandedTasks.map(task => {
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
      isAllDay: task.isAllDay !== undefined ? Boolean(task.isAllDay) : false,
      startTime: task.startTime || '',
      endTime: task.endTime || '',
      repetisi: task.repetisi || 'Tidak Berulang',
      startDate: typeof task.startDate === 'string' ? task.startDate.split('T')[0] : new Date(task.startDate).toISOString().split('T')[0],
      endDate: typeof task.endDate === 'string' ? task.endDate.split('T')[0] : new Date(task.endDate).toISOString().split('T')[0],
      isCustomCategory: false,
      isCustomPic: false,
    });
    setIsEditModalOpen(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    if (!hasPermission(roleConfig, 'manage_task', userRole)) return;
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
      isAllDay: false,
      startTime: '',
      endTime: '',
      repetisi: 'Tidak Berulang',
      startDate: startStr,
      endDate: endStr,
      isCustomCategory: false,
      isCustomPic: false,
    });
    setIsEditModalOpen(true);
  };

  const handleExportExcel = async () => {
    toast.loading('Mengekspor Kalender Pekerjaan...', { id: 'export-excel-cal' });
    try {
      const success = await exportToRichExcel(
        filteredTasks,
        {
          pics: masterPics,
          categories: masterCats,
          locations: [],
          priorities: masterPriorities,
          statuses: masterStatuses
        },
        `Kalender_Pekerjaan_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        false
      );
      if (success) {
        toast.success('Pekerjaan berhasil diekspor', { id: 'export-excel-cal' });
      } else {
        toast.error('Gagal mengekspor Excel', { id: 'export-excel-cal' });
      }
    } catch (error) {
      console.error('Excel Export error:', error);
      toast.error('Gagal mengekspor Excel', { id: 'export-excel-cal' });
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPdf(true);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('calendar-container');
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
      pdf.save(`Kalender_Pekerjaan_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      setIsExportingPdf(false);
    } catch (err) {
      console.error('PDF Export error:', err);
      setIsExportingPdf(false);
      toast.error('Gagal mengekspor PDF');
    }
  };

  const handleCopyImage = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('calendar-container');
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
            toast.success('Gambar kalender disalin ke clipboard');
          } catch(err) {
            console.error(err);
            toast.error('Gagal menyalin gambar, izin ditolak.');
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy Image error:', err);
      toast.error('Gagal menyalin gambar');
    }
  };

  const handleSaveModal = async (payloadData: any) => {
    setLoading(true);
    try {
      const isNew = !payloadData.id;
      const realId = isNew ? null : Math.floor(Number(payloadData.id));
      
      const url = isNew ? '/api/tasks' : `/api/tasks/${realId}`;
      const method = isNew ? 'POST' : 'PUT';

      const payloadToSave = { ...payloadData };
      if (!isNew) {
        payloadToSave.id = realId;
      }

      const saveRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSave),
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
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
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
    const realId = Math.floor(id);
    try {
      await fetch(`/api/tasks/${realId}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== realId));
      setSelectedTask(null);
      router.refresh();
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
      toast.success('Pekerjaan berhasil dihapus dari kalender.');
    } catch (error: any) {
      console.error(error);
      setErrorMessage(`Delete Error:\n${error?.message || error}`);
      toast.error('Gagal menghapus pekerjaan.');
    }
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
      <UniversalFilterBar 
        categories={allCategoryOptions} 
        pics={existingPics} 
        statuses={masterStatuses.length > 0 ? masterStatuses : undefined} 
        priorities={masterPriorities.length > 0 ? masterPriorities : undefined} 
        filteredCount={filteredTasks.length}
        totalCount={tasks.length}
      >
        <UniversalActionBar 
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          isExportingPdf={isExportingPdf}
          onCopyImage={handleCopyImage}
          canExport={hasPermission(roleConfig, 'export_data', userRole)}
        >
          <button 
            className="btn" 
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
                copyToClipboard(feedUrl);
                toast.success('URL Kalender berhasil disalin ke clipboard!');
                alert(`URL Sinkronisasi Kalender Berhasil Disalin!\n\n${feedUrl}\n\nCara Pakai di Google Calendar:\n1. Buka Google Calendar\n2. Klik + di samping 'Other calendars' (Kalender Lain)\n3. Pilih 'From URL' (Dari URL)\n4. Tempel (Paste) URL ini & klik 'Add calendar'`);
              } catch (err) {
                toast.error('Gagal mengambil token kalender');
              }
            }}
            title="Salin URL Feed iCal untuk Auto Sinkronisasi"
            style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: 0, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
          >
            <CalendarDays size={18} />
          </button>
        </UniversalActionBar>
      </UniversalFilterBar>

      {/* Main Controlled Calendar Component */}
      <div id="calendar-container" className="glass" style={{ padding: '24px 28px', minHeight: '820px', display: 'flex', flexDirection: 'column' }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          selectable={true}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(event) => hasPermission(roleConfig, 'view_detail', userRole) ? setSelectedTask(event.resource) : toast.error('Akses ditolak: Anda tidak memiliki izin untuk melihat detail.')}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          style={{ height: '780px', color: 'var(--text-primary)' }}
          eventPropGetter={eventStyleGetter}
          dayPropGetter={customDayPropGetter}
          components={{
            month: {
              dateHeader: ({ date: d, label }) => {
                const dateStr = format(d, 'yyyy-MM-dd');
                const isHoliday = holidays[dateStr];
                const dayOfWeek = getDay(d);
                const isRed = isHoliday || dayOfWeek === 0 || dayOfWeek === 6;
                return (
                  <div 
                    title={isHoliday ? isHoliday : (isRed ? 'Akhir Pekan' : undefined)}
                    style={{ padding: '4px', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', cursor: isRed ? 'help' : 'default' }}
                  >
                    <span style={{ color: isRed ? '#dc2626' : 'inherit', fontWeight: isRed ? '600' : 'normal', fontSize: '14px' }}>
                      {label}
                    </span>
                    {isHoliday && (
                      <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 'bold', marginTop: '2px', lineHeight: '1.2', maxWidth: '100px', wordWrap: 'break-word', textAlign: 'right' }}>
                        {isHoliday}
                      </span>
                    )}
                  </div>
                );
              }
            }
          }}
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

      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        setPreviewFile={setPreviewFile}
        onEdit={() => handleOpenEditModal(selectedTask!)}
        onDelete={() => handleDeleteTask(selectedTask!.id)}
      />

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