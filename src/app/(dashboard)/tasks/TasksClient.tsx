'use client';
import { useMaster } from '@/context/MasterContext';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Download, Upload, Plus, Pencil, Trash2, CalendarDays, Search, Filter, 
  ExternalLink, FileText, X, CheckCircle, Clock, AlertCircle, Info, Sparkles, Paperclip, Eye, File, 
  ArrowUpDown, ArrowUp, ArrowDown, Repeat, UserPlus, History, Copy, MessageSquare, Zap, MoreVertical,
  Video, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createEvent, createEvents, EventAttributes } from 'ics';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import FileViewer from '@/components/FileViewer';
import { useFilter } from '@/context/FilterContext';
import { useNotifications } from '@/context/NotificationContext';
import dynamic from 'next/dynamic';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

import { exportToRichExcel } from '@/utils/excelExport';
import { Task, FileItem, SubTask, LogItem, getTaskFiles, getAdditionalPics, getHistoryLogs, getTaskComments, getDynamicBadgeStyle, getGoogleCalendarUrl, handleExportICS, formatRecurrenceText } from '@/utils/taskUtils';
import Avatar from '@/components/Avatar';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import SmartAddModal from '@/components/SmartAddModal';
import { checkSearchMatch } from '@/utils/searchUtils';
import BulkEditModal from '@/components/BulkEditModal';
import FilePreviewModal from '@/components/FilePreviewModal';
import TaskDetailModal from '@/components/TaskDetailModal';
import UniversalFilterBar from '@/components/UniversalFilterBar';
import UniversalActionBar from '@/components/UniversalActionBar';

type SortField = 'nama' | 'pic' | 'kategori' | 'prioritas' | 'status' | 'progress' | 'endDate';

import { useSession } from 'next-auth/react';

export default function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
  const { data: session } = useSession();
  const userRole: string = (session?.user as any)?.role || 'PIC';
  const { masterColors, masterPicAvatars } = useMaster();
  const { addActivityLog } = useNotifications();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Search & Filter State
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search & Filter State (Initialized from URL if present)
  // Search & Filter State (Initialized from URL if present)
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

  // Sorting State
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [bulkEditField, setBulkEditField] = useState<'status' | 'kategori' | 'pic' | 'deskripsi' | 'jadwal' | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Interactive Copyable Error Modal State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // In-App File Preview Modal State
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const [masterCats, setMasterCats] = useState<string[]>([]);
  const [masterPics, setMasterPics] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>([]);
  const [masterPriorities, setMasterPriorities] = useState<string[]>([]);
  const [masterLocations, setMasterLocations] = useState<string[]>([]);
  const [masterStatusProgress, setMasterStatusProgress] = useState<Record<string, number>>({});
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [registeredUserNames, setRegisteredUserNames] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.master_categories) setMasterCats(data.master_categories);
        if (data.master_pics) setMasterPics(data.master_pics);
        if (data.master_statuses) setMasterStatuses(data.master_statuses);
        if (data.master_priorities) setMasterPriorities(data.master_priorities);
        if (data.master_locations) setMasterLocations(data.master_locations);
        if (data.master_status_progress) setMasterStatusProgress(data.master_status_progress);
      })
      .catch(e => console.error(e));

    fetch('/api/users/pics')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRegisteredUserNames(data);
      })
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const refreshData = () => router.refresh();

  const handleToggleSelectAll = () => {
    if (selectedTasks.size === processedTasks.length && processedTasks.length > 0) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(processedTasks.map(t => t.id)));
    }
  };

  const handleToggleSelect = (taskId: number) => {
    const newSet = new Set(selectedTasks);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setSelectedTasks(newSet);
  };

  const handleBulkDone = async () => {
    if (selectedTasks.size === 0) return;
    if (!window.confirm(`Anda yakin ingin menandai ${selectedTasks.size} pekerjaan sebagai Selesai (Done)?`)) return;

    const ids = Array.from(selectedTasks).join(',');
    try {
      await fetch(`/api/tasks/bulk-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedTasks), status: 'Done' })
      });
      toast.success(`${selectedTasks.size} Pekerjaan berhasil ditandai selesai!`);
      setSelectedTasks(new Set());
      const res = await fetch('/api/tasks');
      const updatedTasks = await res.json();
      setTasks(updatedTasks);
      refreshData();
    } catch (e: any) {
      toast.error('Gagal memperbarui status pekerjaan');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    if (!window.confirm(`Anda yakin ingin menghapus ${selectedTasks.size} pekerjaan yang dipilih?`)) return;

    const ids = Array.from(selectedTasks).join(',');
    try {
      await fetch(`/api/tasks?ids=${ids}`, { method: 'DELETE' });
      toast.success(`${selectedTasks.size} Pekerjaan berhasil dihapus!`);
      setSelectedTasks(new Set());
      const res = await fetch('/api/tasks');
      const updatedTasks = await res.json();
      setTasks(updatedTasks);
      refreshData();
    } catch (e: any) {
      toast.error('Gagal menghapus beberapa pekerjaan');
    }
  };

  const allCategoryOptions = Array.from(new Set([...masterCats, ...tasks.map(t => t.kategori).filter((c): c is string => Boolean(c))]));
  const categoriesFilter = ['All', ...allCategoryOptions];

  // Extract all unique PICs (for filter dropdown)
  const allPicsSet = new Set<string>(masterPics);
  tasks.forEach(t => {
    if (t.pic) allPicsSet.add(t.pic);
    if (t.additionalPics) {
      try {
        const arr = JSON.parse(t.additionalPics);
        if (Array.isArray(arr)) arr.forEach((p: string) => p && allPicsSet.add(p));
      } catch (e) { }
    }
  });
  if (session?.user?.name) {
    allPicsSet.add(session.user.name);
  }
  const existingPics = Array.from(allPicsSet);
  const pics = ['All', ...existingPics];

  // Strictly for Add/Edit Form Dropdowns (Sync with Settings)
  let formCategoryOptions = masterCats.length > 0 ? [...masterCats] : [];
  if (editingTask?.kategori && !formCategoryOptions.includes(editingTask.kategori)) {
    formCategoryOptions.push(editingTask.kategori);
  }

  let formPicOptions = Array.from(new Set([
    ...masterPics
  ]));
  if (editingTask?.pic && !formPicOptions.includes(editingTask.pic)) {
    formPicOptions.push(editingTask.pic);
  }


  // Sorting Helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const priorityWeight: Record<string, number> = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  const statusWeight: Record<string, number> = { 'Done': 3, 'In Progress': 2, 'To Do': 1 };

  // Filter & Sort Tasks
  const processedTasks = tasks.filter(t => {
    const extraPics = getAdditionalPics(t).join(' ');
    const matchesSearch = checkSearchMatch(t, searchQuery, globalSearchExactMatch);
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || (t.prioritas || 'Medium') === filterPriority;
    const matchesCategory = filterCategory === 'All' || (t.kategori || 'Umum') === filterCategory;
    const matchesPic = globalPicFilter === 'Semua PIC' || t.pic === globalPicFilter || getAdditionalPics(t).includes(globalPicFilter);

    // Target Waktu Filter
    const start = new Date(t.startDate).getTime();
    const end = new Date(t.endDate).getTime();
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

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesPic && matchesTarget;
  }).sort((a, b) => {
    if (!sortField) return 0;

    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === 'prioritas') {
      valA = priorityWeight[a.prioritas || 'Medium'] || 0;
      valB = priorityWeight[b.prioritas || 'Medium'] || 0;
    } else if (sortField === 'status') {
      valA = statusWeight[a.status] || 0;
      valB = statusWeight[b.status] || 0;
    } else if (sortField === 'progress') {
      valA = a.progress || 0;
      valB = b.progress || 0;
    } else if (sortField === 'endDate') {
      valA = new Date(a.endDate).getTime();
      valB = new Date(b.endDate).getTime();
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB || '').toLowerCase();
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleOpenAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
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
      subTasksList: [],
      isAllDay: false,
      startTime: '',
      endTime: '',
      repetisi: 'Tidak Berulang',
      customRecurrenceSettings: { every: 1, unit: 'Minggu', days: [] as string[], endType: 'never', endDate: today, endOccurrences: 1 },
      startDate: today,
      endDate: today,
      isCustomCategory: false,
      isCustomPic: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    let repetisiValue = task.repetisi || 'Tidak Berulang';
    let customRecurrenceSettings = { every: 1, unit: 'Minggu', days: [] as string[], endType: 'never', endDate: new Date().toISOString().split('T')[0], endOccurrences: 1 };

    if (repetisiValue.startsWith('CUSTOM_RECURRENCE:')) {
      try {
        let parsed = JSON.parse(repetisiValue.replace('CUSTOM_RECURRENCE:', ''));
        while (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        customRecurrenceSettings = parsed;
        repetisiValue = 'Custom';
      } catch (e) { }
    }

    let parsedSubTasks: SubTask[] = [];
    if (task.subTasksJson) {
      try {
        parsedSubTasks = JSON.parse(task.subTasksJson);
      } catch (e) { }
    }

    setEditingTask({
      ...task,
      filesList: getTaskFiles(task),
      additionalPicsList: getAdditionalPics(task),
      subTasksList: parsedSubTasks,
      isAllDay: task.isAllDay !== undefined ? Boolean(task.isAllDay) : false,
      startTime: task.startTime || '',
      endTime: task.endTime || '',
      repetisi: repetisiValue,
      customRecurrenceSettings,
      startDate: typeof task.startDate === 'string' ? task.startDate.split('T')[0] : new Date(task.startDate).toISOString().split('T')[0],
      endDate: typeof task.endDate === 'string' ? task.endDate.split('T')[0] : new Date(task.endDate).toISOString().split('T')[0],
      isCustomCategory: false,
      isCustomPic: false,
    });
    setIsModalOpen(true);
  };


  const handleSaveModal = async (payloadData: any) => {
    setLoading(true);
    try {
      const isNew = !payloadData.id;
      const url = isNew ? '/api/tasks' : `/api/tasks/${payloadData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const filteredExtraPics = payloadData.additionalPicsList ? payloadData.additionalPicsList.filter(Boolean) : [];

      const filesListToSave = payloadData.filesList && payloadData.filesList.length > 0
        ? payloadData.filesList
        : (payloadData.fileUrl ? [{ url: payloadData.fileUrl, name: payloadData.fileName || 'File Lampiran' }] : []);

      let processedSubTasks = payloadData.subTasksList ? [...payloadData.subTasksList] : [];
      if (!isNew) {
        const originalTask = tasks.find(t => t.id === payloadData.id);
        const originalSubTasks = originalTask?.subTasksJson ? JSON.parse(originalTask.subTasksJson) : [];

        processedSubTasks = processedSubTasks.map((st: any) => {
          const originalSt = originalSubTasks.find((o: any) => o.id === st.id);
          let logsToAppend = [];
          if (originalSt) {
            if (originalSt.status !== st.status || originalSt.text !== st.text) {
              logsToAppend.push({ status: `${st.text} (${st.status})`, timestamp: new Date().toISOString() });
            }
          } else {
            logsToAppend.push({ status: `${st.text} (${st.status})`, timestamp: new Date().toISOString() });
          }

          const newLogs = [...(st.logs || []), ...logsToAppend];
          const { pendingLogDesc, ...cleanSt } = st;
          return { ...cleanSt, logs: newLogs };
        });
      } else {
        processedSubTasks = processedSubTasks.map((st: any) => {
          const { pendingLogDesc, ...cleanSt } = st;
          return { ...cleanSt, logs: [{ status: `${st.text} (${st.status})`, timestamp: new Date().toISOString() }] };
        });
      }

      let parentStatusToSave = payloadData.status;
      if (processedSubTasks.length > 0 && processedSubTasks.every((st: any) => st.status === 'Done')) {
        parentStatusToSave = 'Done';
      }

      const finalPayload = {
        ...payloadData,
        status: parentStatusToSave,
        startDate: payloadData.startDate || new Date().toISOString().split('T')[0],
        endDate: payloadData.endDate || new Date().toISOString().split('T')[0],
        repetisi: payloadData.repetisi === 'Custom' ? `CUSTOM_RECURRENCE:${JSON.stringify(payloadData.customRecurrenceSettings)}` : payloadData.repetisi,
        fileUrl: filesListToSave.find((f: any) => !f.isDeleted)?.url || payloadData.fileUrl || null,
        fileName: filesListToSave.find((f: any) => !f.isDeleted)?.name || payloadData.fileName || null,
        filesJson: filesListToSave.length > 0 ? JSON.stringify(filesListToSave) : null,
        subTasksJson: processedSubTasks.length > 0 ? JSON.stringify(processedSubTasks) : null,
        additionalPics: filteredExtraPics.length > 0 ? JSON.stringify(filteredExtraPics) : null,
      };
      
      delete finalPayload.customRecurrenceSettings;

      const saveRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
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

      let updatedMasterPics = [...masterPics];
      let picChanged = false;
      const picsToCheck = [savedTask.pic, ...filteredExtraPics].filter(Boolean);
      picsToCheck.forEach(p => {
        if (!updatedMasterPics.includes(p)) {
          updatedMasterPics.push(p);
          picChanged = true;
        }
      });
      if (picChanged) {
        setMasterPics(updatedMasterPics);
        localStorage.setItem('master_pics', JSON.stringify(updatedMasterPics));
      }

      if (savedTask.kategori && !masterCats.includes(savedTask.kategori)) {
        const updatedCats = [...masterCats, savedTask.kategori];
        setMasterCats(updatedCats);
        localStorage.setItem('master_categories', JSON.stringify(updatedCats));
      }

      setIsModalOpen(false);
      setEditingTask(null);

      if (addActivityLog) {
        let detailsText = '';
        if (savedTask.historyLogsJson) {
          try {
            const logs = JSON.parse(savedTask.historyLogsJson);
            if (logs.length > 0) {
              const lastLog = logs[logs.length - 1];
              if (lastLog.details) detailsText = ` (Perubahan: ${lastLog.details})`;
            }
          } catch (e) { }
        }

        const currentUser = (session?.user as any)?.name || 'Sistem';
        if (isNew) {
          addActivityLog('CREATE_TASK', 'Pekerjaan Baru', `Pekerjaan "${savedTask.nama}" telah ditambahkan oleh ${currentUser}.`, 'success');
        } else if (savedTask.status === 'Done') {
          addActivityLog('COMPLETE_TASK', 'Pekerjaan Selesai', `Pekerjaan "${savedTask.nama}" telah diselesaikan oleh ${currentUser}.${detailsText}`, 'success');
        } else if (savedTask.prioritas === 'Urgent') {
          addActivityLog('URGENT_TASK', 'Pekerjaan Urgent', `Pekerjaan "${savedTask.nama}" dengan prioritas Urgent diperbarui oleh ${currentUser}.${detailsText}`, 'warning');
        } else {
          addActivityLog('UPDATE_TASK', 'Pekerjaan Diperbarui', `Pekerjaan "${savedTask.nama}" diperbarui oleh ${currentUser}.${detailsText}`, 'info');
        }
      }

      refreshData();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('tasksUpdated'));
      }

      toast.success(`Pekerjaan "${savedTask.nama}" berhasil ${isNew ? 'ditambahkan' : 'diperbarui'}!`);
    } catch (error: any) {
      console.error('Save task error:', error);
      setErrorMessage(`Network / Application Error:\n${error?.stack || error?.message || error}`);
      toast.error(`Gagal menyimpan pekerjaan: ${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pekerjaan ini?')) return;
    try {
      const taskToDelete = tasks.find(t => t.id === id);
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== id));

      if (addActivityLog && taskToDelete) {
        let subCount = 0;
        if (taskToDelete.subTasksJson) {
          try {
            subCount = JSON.parse(taskToDelete.subTasksJson).length;
          } catch (e) { }
        }
        addActivityLog('DELETE_TASK', 'Pekerjaan Dihapus', `Pekerjaan "${taskToDelete.nama}" (PIC: ${taskToDelete.pic}) beserta ${subCount} sub pekerjaannya telah dihapus.`, 'danger');
      }

      refreshData();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('tasksUpdated'));
      }

      toast.success('Pekerjaan berhasil dihapus dari daftar.');
    } catch (error: any) {
      console.error(error);
      setErrorMessage(`Delete Error:\n${error?.message || error}`);
      toast.error('Gagal menghapus pekerjaan.');
    }
  };

  const handleDownloadTemplate = async () => {
    toast.loading('Membuat template Excel...', { id: 'download-template' });
    try {
      const success = await exportToRichExcel(
        [],
        {
          pics: existingPics,
          categories: formCategoryOptions,
          locations: masterLocations,
          priorities: masterPriorities,
          statuses: masterStatuses
        },
        'Template_Import_Pekerjaan.xlsx',
        true
      );
      if (success) {
        toast.success('Template berhasil diunduh', { id: 'download-template' });
      } else {
        toast.error('Gagal membuat template', { id: 'download-template' });
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal membuat template', { id: 'download-template' });
    }
  };

  // Helper: parse lokasi value from Excel to JSON string
  const parseLokasiFromExcel = (val: any): string | null => {
    if (!val) return null;
    const str = String(val).trim();
    if (!str) return null;

    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        JSON.parse(str);
        return str;
      } catch (e) {}
    }

    const lower = str.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.includes('zoom.us') || lower.includes('meet.google.com') || lower.includes('teams.live.com') || lower.includes('teams.microsoft') || lower.startsWith('online:')) {
      const cleanLink = str.replace(/^online:\s*/i, '').trim();
      return JSON.stringify({ tipe: 'online', linkZoom: cleanLink, lokasiFisik: '', jam: '' });
    } else {
      const cleanPhys = str.replace(/^offline:\s*/i, '').trim();
      return JSON.stringify({ tipe: 'offline', linkZoom: '', lokasiFisik: cleanPhys, jam: '' });
    }
  };

  // Helper: normalize time values from Excel (decimal, dot, or colon format) to HH:mm
  const normalizeTime = (val: any): string | null => {
    if (val == null || val === '') return null;
    const str = String(val).trim();
    if (/^\d{1,2}:\d{2}$/.test(str)) return str.padStart(5, '0');
    if (/^\d{1,2}\.\d{2}$/.test(str)) {
      const [h, m] = str.split('.');
      return `${h.padStart(2, '0')}:${m}`;
    }
    const num = Number(str);
    if (!isNaN(num) && num >= 0 && num < 1) {
      const totalMinutes = Math.round(num * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    if (!isNaN(num) && num >= 0 && num <= 24 && Number.isInteger(num)) {
      return `${String(num).padStart(2, '0')}:00`;
    }
    return str;
  };

  // Helper: normalize date values from Excel (serial number or string) to ISO string
  const normalizeDate = (val: any, fieldName: string, idx: number): string => {
    if (val == null || val === '') return new Date().toISOString();
    
    let date: Date;
    if (typeof val === 'number') {
      date = new Date(Math.round((val - 25569) * 86400 * 1000));
    } else {
      date = new Date(String(val).trim());
    }

    if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2100) {
      throw new Error(`Format ${fieldName} pada Data ke-${idx + 1} tidak valid: "${val}". Harap gunakan format YYYY-MM-DD.`);
    }
    return date.toISOString();
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        let wsname = wb.SheetNames.find(name => name.toLowerCase().includes('pekerjaan') || name.toLowerCase().includes('task')) || wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        const data = rawData.map((r: any) => {
          const normalized: any = {};
          for (const k in r) {
            normalized[k.trim().toLowerCase()] = r[k];
          }
          return normalized;
        }).filter((r: any) => {
          const nama = r['nama pekerjaan'] || r['nama'] || '';
          return !nama.includes('Contoh Pekerjaan A');
        });

        const formattedData = data.map((row: any, idx: number) => {
          let p = Number(row['progress (%)'] || row['progress'] || 0);
          if (isNaN(p)) p = 0;
          let subTasksJson = null;
          const subPekerjaanRaw = row['sub pekerjaan'] || row['subpekerjaan'];
          if (subPekerjaanRaw && typeof subPekerjaanRaw === 'string') {
            const lines = subPekerjaanRaw.split('\n').filter(s => s.trim());
            const subTasks = lines.map(line => {
              const match = line.match(/^\[(.*?)\]\s+(.*)/);
              let status = 'To Do';
              let text = line.trim();
              const validStatuses = masterStatuses.length > 0 ? masterStatuses : ['To Do', 'In Progress', 'Done'];
              if (match && validStatuses.includes(match[1])) {
                status = match[1];
                text = match[2].trim();
              } else if (match) {
                text = line.replace(/^\[.*?\]\s*/, '').trim() || line.trim();
              }
              let pic: string | undefined = undefined;
              let tenggatWaktu: string | undefined = undefined;

              // Parse extra fields like | PIC: Name | Tenggat: 2026-08-15
              const picMatch = text.match(/\|\s*PIC:\s*([^|]+)/i);
              const tenggatMatch = text.match(/\|\s*Tenggat:\s*([^|]+)/i);

              if (picMatch) {
                pic = picMatch[1].trim();
                text = text.replace(picMatch[0], '').trim();
              }
              if (tenggatMatch) {
                tenggatWaktu = tenggatMatch[1].trim();
                text = text.replace(tenggatMatch[0], '').trim();
              }

              // Remove any trailing or leading pipe characters left over
              text = text.replace(/^[|\s]+|[|\s]+$/g, '').trim();

              return {
                id: Math.random().toString(36).substring(2, 9),
                text,
                status,
                ...(pic ? { pic } : {}),
                ...(tenggatWaktu ? { tenggatWaktu } : {}),
                logs: [{ status, timestamp: new Date().toISOString() }]
              };
            });
            if (subTasks.length > 0) subTasksJson = JSON.stringify(subTasks);
          }

          const additionalPicsStr = row['pic tambahan'] || row['pictambahan'] || '';
          let additionalPicsJson = null;
          if (additionalPicsStr) {
            const picsArr = additionalPicsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
            if (picsArr.length > 0) additionalPicsJson = JSON.stringify(picsArr);
          }
          const isAllDayStr = (row['sepanjang hari'] || row['isallday'] || 'Ya').toString().toLowerCase();
          const isAllDay = isAllDayStr === 'ya' || isAllDayStr === 'true' || isAllDayStr === '1' || isAllDayStr === 'yes';

          return {
            nama: row['nama pekerjaan'] || row['nama'] || 'Tanpa Nama',
            pic: row['pic utama'] || row['pic'] || 'Unassigned',
            status: row['status'] || 'To Do',
            prioritas: row['prioritas'] || 'Medium',
            kategori: row['kategori'] || 'Umum',
            isAllDay,
            startTime: normalizeTime(row['jam mulai'] || row['starttime']),
            endTime: normalizeTime(row['jam selesai'] || row['endtime']),
            repetisi: row['repetisi'] || 'Tidak Berulang',
            deskripsi: row['deskripsi'] || '',
            lokasi: parseLokasiFromExcel(row['lokasi pekerjaan'] || row['lokasi']),
            catatan: row['catatan'] || '',
            startDate: normalizeDate(row['tanggal mulai'] || row['startdate'], 'Tanggal Mulai', idx),
            endDate: normalizeDate(row['tenggat waktu'] || row['enddate'], 'Tenggat Waktu', idx),
            ...(subTasksJson ? { subTasksJson } : {}),
            ...(additionalPicsJson ? { additionalPics: additionalPicsJson } : {}),
          };
        }).filter((d: any) => d.nama !== 'Tanpa Nama' || d.pic !== 'Unassigned');

        if (formattedData.length === 0) {
          toast.error('Tidak ada data valid di Excel. Pastikan header sesuai template.');
          return;
        }

        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData),
        });

        const res = await fetch('/api/tasks');
        const updatedTasks = await res.json();
        setTasks(updatedTasks);
        refreshData();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tasksUpdated'));
        }

        toast.success(`Berhasil mengimpor ${formattedData.length} data pekerjaan dari Excel!`);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(`Excel Import Error:\n${err?.message || err}`);
        toast.error(`Gagal mengimpor file Excel: ${err?.message || err}`);
      }
    };
    reader.readAsBinaryString(file);
  };


  const handleExportExcel = async () => {
    toast.loading('Mengekspor daftar pekerjaan...', { id: 'export-excel' });
    try {
      const success = await exportToRichExcel(
        processedTasks,
        {
          pics: existingPics,
          categories: formCategoryOptions,
          locations: masterLocations,
          priorities: masterPriorities,
          statuses: masterStatuses
        },
        `Daftar_Pekerjaan_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        false
      );
      if (success) {
        toast.success('Pekerjaan berhasil diekspor', { id: 'export-excel' });
      } else {
        toast.error('Gagal mengekspor Excel', { id: 'export-excel' });
      }
    } catch (error) {
      console.error('Excel Export error:', error);
      toast.error('Gagal mengekspor Excel', { id: 'export-excel' });
    }
  };

  const handleExportPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('task-table-container');
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
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: width > height ? 'l' : 'p',
        unit: 'px',
        format: [width, height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`Tabel_Pekerjaan_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (err) {
      console.error('PDF Export error:', err);
      toast.error('Gagal mengekspor PDF');
    }
  };

  const handleCopyImage = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('task-table-container');
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
            toast.success('Gambar berhasil disalin ke clipboard');
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

  const handleExportAllICS = () => {
    if (processedTasks.length === 0) return;

    const eventsList: EventAttributes[] = processedTasks.map(task => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      const extraPics = getAdditionalPics(task);
      const allPicsStr = [task.pic, ...extraPics].join(', ');

      return {
        title: `[${task.kategori || 'Pekerjaan'}] ${task.nama}`,
        description: `PIC: ${allPicsStr}\nStatus: ${task.status}\nPrioritas: ${task.prioritas}\nRepetisi: ${formatRecurrenceText(task.repetisi)}\nDeskripsi: ${task.deskripsi ? task.deskripsi.replace(/<[^>]*>?/gm, '') : '-'}`,
        start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), 9, 0],
        end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), 17, 0],
      };
    });

    createEvents(eventsList, (error, value) => {
      if (error) {
        console.error(error);
        return;
      }
      const blob = new Blob([value], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Semua_Pekerjaan_${format(new Date(), 'yyyy-MM-dd')}.ics`;
      a.click();
    });
  };


  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} style={{ opacity: 0.4 }} />;
    return sortDirection === 'asc' ? <ArrowUp size={14} color="var(--accent-primary)" /> : <ArrowDown size={14} color="var(--accent-primary)" />;
  };

  return (
    <div>
      {/* Global Datalist for PIC Auto-suggest */}
      <datalist id="existing-pics-list">
        {existingPics.map((p, idx) => (
          <option key={idx} value={p} />
        ))}
      </datalist>

      {/* Action Bar & Filter Bar */}
      <UniversalFilterBar 
        categories={['Umum', ...masterCats]} 
        pics={existingPics} 
        statuses={masterStatuses.length > 0 ? masterStatuses : undefined} 
        priorities={masterPriorities.length > 0 ? masterPriorities : undefined} 
        filteredCount={processedTasks.length}
        totalCount={tasks.length}
      >
        <UniversalActionBar 
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onCopyImage={handleCopyImage}
        >
          <button 
            className="btn" 
            onClick={handleExportAllICS}
            title="Export .ics untuk semua pekerjaan"
            style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: 0, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
          >
            <CalendarDays size={18} />
          </button>
        </UniversalActionBar>
      </UniversalFilterBar>

      {/* Main Table with Sortable Columns */}



      <AnimatePresence>
        {selectedTasks.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ background: 'var(--surface-color)', border: '1px solid var(--accent-primary)', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="var(--accent-primary)" />
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                {selectedTasks.size} Pekerjaan Terpilih
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedTasks(new Set())}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                Batal
              </button>
              <button className="btn btn-secondary" onClick={() => setBulkEditField('status')} style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--surface-color)' }}>Ubah Status</button>
              <button className="btn btn-secondary" onClick={() => setBulkEditField('kategori')} style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--surface-color)' }}>Ubah Kategori</button>
              <button className="btn btn-secondary" onClick={() => setBulkEditField('pic')} style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--surface-color)' }}>Ubah PIC</button>
              <button className="btn btn-secondary" onClick={() => setBulkEditField('deskripsi')} style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--surface-color)' }}>Ubah Deskripsi</button>
              <button className="btn btn-secondary" onClick={() => setBulkEditField('jadwal')} style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--surface-color)' }}>Ubah Jadwal & Waktu</button>
              <button
                className="btn"
                onClick={handleBulkDelete}
                style={{ padding: '6px 12px', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <Trash2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Hapus Terpilih
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="task-table-container" className="glass" style={{ padding: '16px', overflow: 'hidden' }}>
        {/* Desktop View Table */}
        <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '11.5px' }}>
                {userRole !== 'SPV' && (
                  <th style={{ padding: '8px 4px', width: '35px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={processedTasks.length > 0 && selectedTasks.size === processedTasks.length}
                      onChange={handleToggleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                )}
                <th style={{ padding: '8px 6px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('nama')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Pekerjaan {renderSortIcon('nama')}
                  </div>
                </th>
                <th className="hide-tablet" style={{ padding: '8px 6px' }}>
                  Deskripsi
                </th>
                <th className="hide-tablet" style={{ padding: '8px 6px' }}>
                  Sub Pekerjaan
                </th>
                <th style={{ padding: '8px 6px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('pic')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    PIC {renderSortIcon('pic')}
                  </div>
                </th>
                <th className="hide-mobile" style={{ padding: '8px 6px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('kategori')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Kategori {renderSortIcon('kategori')}
                  </div>
                </th>
                <th style={{ padding: '8px 6px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('prioritas')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Prioritas {renderSortIcon('prioritas')}
                  </div>
                </th>
                <th style={{ padding: '8px 6px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Status & Progress {renderSortIcon('status')}
                  </div>
                </th>
                <th className="hide-mobile" style={{ padding: '8px 6px' }}>Lampiran</th>
                <th style={{ padding: '8px 6px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('endDate')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Tenggat Waktu {renderSortIcon('endDate')}
                  </div>
                </th>
                <th className="hide-tablet" style={{ padding: '8px 6px' }}>Lokasi</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', width: '40px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {processedTasks.map(task => {
                const prog = task.progress || (masterStatusProgress[task.status] ?? (task.status === 'Done' ? 100 : task.status === 'In Progress' ? 50 : 0));
                const taskFiles = getTaskFiles(task);
                const extraPics = getAdditionalPics(task);

                return (
                  <tr key={task.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                    {userRole !== 'SPV' && (
                      <td style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => handleToggleSelect(task.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    <td style={{ padding: '8px 6px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => setDetailTask(task)}>
                        {task.nama}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px', flexWrap: 'wrap' }}>
                        {task.repetisi && task.repetisi !== 'Tidak Berulang' && (
                          <div style={{ fontSize: '10.5px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Repeat size={12} /> {formatRecurrenceText(task.repetisi)}
                          </div>
                        )}
                        {getTaskComments(task).length > 0 && (
                          <span style={{ fontSize: '10px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <MessageSquare size={10} /> {getTaskComments(task).length}
                          </span>
                        )}
                        {getHistoryLogs(task).length > 0 && (
                          <span style={{ fontSize: '10px', background: 'rgba(37,99,235,0.15)', color: 'var(--accent-primary)', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <History size={10} /> {getHistoryLogs(task).length}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>Dibuat: {task.createdAt ? format(new Date(task.createdAt), 'dd MMM yyyy, HH:mm') : '-'}</span>
                        <span>Diperbarui: {task.updatedAt ? format(new Date(task.updatedAt), 'dd MMM yyyy, HH:mm') : '-'}</span>
                      </div>
                     </td>
                     <td className="hide-tablet" style={{ padding: '8px 6px', maxWidth: '130px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      <div style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {task.deskripsi ? task.deskripsi.replace(/<[^>]+>/g, '') : '-'}
                      </div>
                    </td>
                     <td className="hide-tablet" style={{ padding: '8px 6px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      {task.subTasksJson ? (() => {
                        try {
                          const st = JSON.parse(task.subTasksJson);
                          if (!st || st.length === 0) return '-';
                          const doneCount = st.filter((s: any) => s.status === 'Done').length;
                          return `${doneCount}/${st.length} Selesai`;
                        } catch (e) { return '-'; }
                      })() : '-'}
                    </td>
                     <td style={{ padding: '8px 6px', fontWeight: '500' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Avatar name={task.pic} src={masterPicAvatars?.[task.pic]} size={20} masterColors={masterColors} />
                          <span style={{ fontSize: '12px', fontWeight: '600' }}>{task.pic}</span>
                        </div>
                        {extraPics.length > 0 && extraPics.map((p, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Avatar name={p} src={masterPicAvatars?.[p]} size={20} masterColors={masterColors} />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                     <td className="hide-mobile" style={{ padding: '8px 6px' }}>
                      {(() => {
                        const badge = getDynamicBadgeStyle('cat', task.kategori || 'Umum', '', masterColors);
                        return (
                           <span className={badge.className} style={Object.assign({ whiteSpace: 'nowrap', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }, badge.style)}>
                            {task.kategori || 'Umum'}
                          </span>
                        );
                      })()}
                    </td>
                     <td style={{ padding: '8px 6px' }}>
                       <span {...getDynamicBadgeStyle('priority', task.prioritas || 'Medium', task.prioritas === 'Urgent' ? 'badge badge-urgent' : task.prioritas === 'High' ? 'badge badge-high' : task.prioritas === 'Low' ? 'badge badge-low' : 'badge badge-medium', masterColors)} style={Object.assign({ fontSize: '11px' }, getDynamicBadgeStyle('priority', task.prioritas || 'Medium', task.prioritas === 'Urgent' ? 'badge badge-urgent' : task.prioritas === 'High' ? 'badge badge-high' : task.prioritas === 'Low' ? 'badge badge-low' : 'badge badge-medium', masterColors).style)}>
                        {task.prioritas || 'Medium'}
                      </span>
                    </td>
                     <td style={{ padding: '8px 6px', minWidth: '110px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '11.5px' }}>
                        {(() => {
                          const badge = getDynamicBadgeStyle('status', task.status, '', masterColors);
                          return (
                            <span className={badge.className} style={{ fontWeight: '600', whiteSpace: 'nowrap', ...badge.style }}>
                              {task.status}
                            </span>
                          );
                        })()}
                        <span style={{ color: 'var(--text-secondary)' }}>{prog}%</span>
                      </div>
                      <div className="progress-container">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${prog}%`,
                            backgroundColor: task.status === 'Done' ? 'var(--success)' : task.status === 'In Progress' ? 'var(--warning)' : 'var(--accent-primary)'
                          }}
                        />
                      </div>
                    </td>
                     <td className="hide-mobile" style={{ padding: '8px 6px' }}>
                      {task.fileUrl ? (
                         <a href={task.fileUrl.toLowerCase().match(/\.(xls|doc|ppt)/) ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(task.fileUrl)}` : task.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--accent-primary)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                          <Paperclip size={14} /> {task.fileName || 'Lampiran'}
                        </a>
                      ) : '-'}
                      {taskFiles.length > 0 && !task.fileUrl && (
                         <div style={{ fontSize: '11.5px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Paperclip size={14} /> {taskFiles.length} Lampiran
                        </div>
                      )}
                    </td>
                     <td style={{ padding: '8px 6px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      <div>{format(new Date(task.endDate), 'dd MMM yyyy')}</div>
                      {!task.isAllDay && task.startTime && (
                         <div style={{ fontSize: '10.5px', opacity: 0.8 }}>{task.startTime} - {task.endTime}</div>
                      )}
                    </td>
                     <td className="hide-tablet" style={{ padding: '8px 6px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      {(() => {
                        if (!task.lokasi) return '-';
                        try {
                          const loc = JSON.parse(task.lokasi);
                          if (loc.tipe === 'online') {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '100px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Online</span>
                                {loc.linkZoom && <a href={loc.linkZoom} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ textDecoration: 'underline' }}>Link Zoom</a>}
                                {loc.jam && <span>{loc.jam} WITA</span>}
                              </div>
                            );
                          } else if (loc.tipe === 'offline') {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '100px' }}>
                                <span style={{ fontWeight: 600 }}>Offline</span>
                                <span>{loc.lokasiFisik || '-'}</span>
                                {loc.jam && <span>{loc.jam} WITA</span>}
                              </div>
                            );
                          }
                          return '-';
                        } catch (e) {
                          return task.lokasi;
                        }
                      })()}
                    </td>
                     <td style={{ padding: '8px 4px', textAlign: 'center', position: 'relative', width: '40px' }}>
                      <div style={{ display: 'inline-block' }}>
                        <button
                          type="button"
                          className="btn btn-secondary clickable-hover"
                          style={{ padding: '6px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: '1px solid var(--border-color)', background: 'var(--surface-color)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === task.id ? null : task.id);
                          }}
                          title="Menu Aksi"
                        >
                          <MoreVertical size={14} color="var(--text-secondary)" />
                        </button>
                        {activeDropdownId === task.id && (
                          <>
                            <div
                              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId(null);
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                right: '35px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: 'var(--surface-color)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 100,
                                display: 'flex',
                                flexDirection: 'row',
                                gap: '6px',
                                padding: '6px',
                                alignItems: 'center'
                              }}
                            >
                              <a
                                href={getGoogleCalendarUrl(task)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '5px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Tambah ke Google Calendar"
                                onClick={() => setActiveDropdownId(null)}
                              >
                                <ExternalLink size={13} color="#4285F4" />
                              </a>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '5px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => {
                                  handleExportICS(task);
                                  setActiveDropdownId(null);
                                }}
                                title="Unduh .ics"
                              >
                                <CalendarDays size={13} />
                              </button>
                              {userRole !== 'SPV' && (
                                <>
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '5px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => {
                                      handleOpenEditModal(task);
                                      setActiveDropdownId(null);
                                    }}
                                    title="Edit Pekerjaan"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    style={{ padding: '5px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => {
                                      handleDelete(task.id);
                                      setActiveDropdownId(null);
                                    }}
                                    title="Hapus"
                                  >
                                    <Trash2 size={13} color="var(--danger)" />
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {processedTasks.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Tidak ada pekerjaan yang sesuai dengan filter atau pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="mobile-card-view">
          {processedTasks.map(task => {
            const prog = task.progress || (masterStatusProgress[task.status] ?? (task.status === 'Done' ? 100 : task.status === 'In Progress' ? 50 : 0));
            const extraPics = getAdditionalPics(task);
            const badgePriority = getDynamicBadgeStyle('priority', task.prioritas || 'Medium', task.prioritas === 'Urgent' ? 'badge badge-urgent' : task.prioritas === 'High' ? 'badge badge-high' : task.prioritas === 'Low' ? 'badge badge-low' : 'badge badge-medium', masterColors);
            const badgeStatus = getDynamicBadgeStyle('status', task.status, '', masterColors);
            const badgeCat = getDynamicBadgeStyle('cat', task.kategori || 'Umum', '', masterColors);

            return (
              <div 
                key={task.id} 
                className="mobile-task-card"
                onClick={() => setDetailTask(task)}
                style={{ cursor: 'pointer' }}
              >
                {/* Header Row: Title & Priority */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                    {task.nama}
                  </div>
                  <span {...badgePriority} style={{ ...badgePriority.style, flexShrink: 0 }}>
                    {task.prioritas || 'Medium'}
                  </span>
                </div>

                {/* Meta details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {/* PIC Badge */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>PIC:</span>
                    <span {...getDynamicBadgeStyle('pic', task.pic, '', masterColors)} style={{ ...getDynamicBadgeStyle('pic', task.pic, '', masterColors).style, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>
                      {task.pic}
                    </span>
                    {extraPics.map((p, i) => (
                      <span key={i} {...getDynamicBadgeStyle('pic', p, '', masterColors)} style={{ ...getDynamicBadgeStyle('pic', p, '', masterColors).style, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Category & Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Kategori:</span>
                      <span className={badgeCat.className} style={Object.assign({ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }, badgeCat.style)}>
                        {task.kategori || 'Umum'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarDays size={12} />
                      <span style={{ fontWeight: 500 }}>{format(new Date(task.endDate), 'dd MMM yyyy')}</span>
                    </div>
                  </div>

                  {/* Location Info */}
                  {task.lokasi && (() => {
                    try {
                      const loc = JSON.parse(task.lokasi);
                      if (loc.tipe === 'online') {
                        return (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(37,99,235,0.05)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(37,99,235,0.1)' }}>
                            <Video size={12} color="var(--accent-primary)" />
                            <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Online Meeting</span>
                            {loc.linkZoom && (
                              <a href={loc.linkZoom} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ textDecoration: 'underline', color: 'var(--accent-primary)', fontSize: '11px' }}>
                                Link
                              </a>
                            )}
                          </div>
                        );
                      } else if (loc.tipe === 'offline') {
                        return (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--input-bg)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <MapPin size={12} color="var(--text-secondary)" />
                            <span style={{ fontWeight: 600 }}>Offline:</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{loc.lokasiFisik || '-'}</span>
                          </div>
                        );
                      }
                    } catch (e) {}
                    return null;
                  })()}
                </div>

                {/* Progress Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span className={badgeStatus.className} style={{ fontWeight: '600', ...badgeStatus.style }}>
                      {task.status}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prog}%</span>
                  </div>
                  <div className="progress-container" style={{ height: '6px' }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${prog}%`,
                        backgroundColor: task.status === 'Done' ? 'var(--success)' : task.status === 'In Progress' ? 'var(--warning)' : 'var(--accent-primary)'
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Row Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }} onClick={e => e.stopPropagation()}>
                  <a
                    href={getGoogleCalendarUrl(task)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Google Calendar"
                  >
                    <ExternalLink size={12} color="#4285F4" /> Cal
                  </a>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => handleExportICS(task)}
                  >
                    <CalendarDays size={12} /> .ics
                  </button>
                  {userRole !== 'SPV' && (
                    <>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleOpenEditModal(task)}
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 size={12} color="var(--danger)" /> Hapus
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {processedTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              Tidak ada pekerjaan yang sesuai dengan filter atau pencarian Anda.
            </div>
          )}
        </div>
      </div>

      <BulkEditModal
        isOpen={!!bulkEditField}
        onClose={() => setBulkEditField(null)}
        selectedTaskIds={Array.from(selectedTasks)}
        field={bulkEditField}
        masterStatuses={masterStatuses}
        masterCats={masterCats}
        masterPics={masterPics}
        masterStatusProgress={masterStatusProgress}
        onSuccess={() => {
          setSelectedTasks(new Set());
          fetch('/api/tasks').then(r => r.json()).then(setTasks);
          refreshData();
        }}
      />
      <TaskAddEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={editingTask}
        onSave={handleSaveModal}
        formCategoryOptions={formCategoryOptions}
        formPicOptions={formPicOptions}
        formStatusOptions={masterStatuses}
        formPriorityOptions={masterPriorities}
        setPreviewFile={setPreviewFile}
      />

      <SmartAddModal 
        isOpen={isSmartModalOpen}
        onClose={() => setIsSmartModalOpen(false)}
        picOptions={formPicOptions}
        categoryOptions={formCategoryOptions}
        priorityOptions={masterPriorities}
        onSaveBulk={async (tasks) => {
          setIsSmartModalOpen(false);
          setLoading(true);
          try {
            const res = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(tasks)
            });
            if (!res.ok) throw new Error('Gagal menyimpan pekerjaan masal');
            toast.success(`${tasks.length} Pekerjaan berhasil ditambahkan`);
            refreshData();
          } catch (err: any) {
            setErrorMessage(err.message || 'Error saat menambahkan secara masal');
            toast.error('Gagal menambah pekerjaan secara masal');
          } finally {
            setLoading(false);
          }
        }}
      />

      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
        setPreviewFile={setPreviewFile}
        onEdit={() => {
          handleOpenEditModal(detailTask!);
        }}
        onDelete={() => handleDelete(detailTask!.id)}
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
                    import('@/utils/clipboard').then(({ copyToClipboard }) => {
                      copyToClipboard(errorMessage);
                      toast.success('Detail error berhasil disalin ke clipboard!');
                    });
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