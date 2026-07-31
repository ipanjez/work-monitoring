'use client';
import { useMaster } from '@/context/MasterContext';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Download, Upload, Plus, Pencil, Trash2, CalendarDays, Search, Filter, 
  ExternalLink, FileText, X, CheckCircle, Clock, AlertCircle, Info, Sparkles, Paperclip, Eye, File, 
  ArrowUpDown, ArrowUp, ArrowDown, Repeat, UserPlus, History, Copy, MessageSquare 
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

import { Task, FileItem, SubTask, LogItem, getTaskFiles, getAdditionalPics, getHistoryLogs, getTaskComments, getDynamicBadgeStyle, getGoogleCalendarUrl, handleExportICS } from '@/utils/taskUtils';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import BulkEditModal from '@/components/BulkEditModal';
import FilePreviewModal from '@/components/FilePreviewModal';
import TaskDetailModal from '@/components/TaskDetailModal';

type SortField = 'nama' | 'pic' | 'kategori' | 'prioritas' | 'status' | 'progress' | 'endDate';

export default function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
  const { masterColors } = useMaster();
  const { globalTargetFilter, setGlobalTargetFilter, globalPicFilter, setGlobalPicFilter, globalCustomStartDate, setGlobalCustomStartDate, globalCustomEndDate, setGlobalCustomEndDate } = useFilter();
  const { addActivityLog } = useNotifications();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Search & Filter State
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search & Filter State (Initialized from URL if present)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'All');
  const [filterPriority, setFilterPriority] = useState(searchParams.get('prioritas') || 'All');
  const [filterCategory, setFilterCategory] = useState(searchParams.get('kategori') || 'All');

  // Sorting State
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bulkEditField, setBulkEditField] = useState<'status' | 'kategori' | 'pic' | 'deskripsi' | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  
  // Interactive Copyable Error Modal State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExcelInfo, setShowExcelInfo] = useState(false);

  // In-App File Preview Modal State
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const [masterCats, setMasterCats] = useState<string[]>([]);
  const [masterPics, setMasterPics] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>([]);
  const [masterPriorities, setMasterPriorities] = useState<string[]>([]);
  const [masterStatusProgress, setMasterStatusProgress] = useState<Record<string, number>>({});
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.master_categories) setMasterCats(data.master_categories);
        if (data.master_pics) setMasterPics(data.master_pics);
        if (data.master_statuses) setMasterStatuses(data.master_statuses);
        if (data.master_priorities) setMasterPriorities(data.master_priorities);
        if (data.master_status_progress) setMasterStatusProgress(data.master_status_progress);
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
      } catch (e) {}
    }
  });
  const existingPics = Array.from(allPicsSet);
  const pics = ['All', ...existingPics];

  // Strictly for Add/Edit Form Dropdowns (Sync with Settings)
  let formCategoryOptions = masterCats.length > 0 ? [...masterCats] : [];
  if (editingTask?.kategori && !formCategoryOptions.includes(editingTask.kategori)) {
    formCategoryOptions.push(editingTask.kategori);
  }

  let formPicOptions = masterPics.length > 0 ? [...masterPics] : Array.from(new Set(tasks.map(t => t.pic).filter(Boolean)));
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
    const matchesSearch = t.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          extraPics.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.deskripsi && t.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()));
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
      if (start <= endBoundary && end >= startBoundary) {
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
      isAllDay: true,
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
        customRecurrenceSettings = JSON.parse(repetisiValue.replace('CUSTOM_RECURRENCE:', ''));
        repetisiValue = 'Custom';
      } catch (e) {}
    }

    let parsedSubTasks: SubTask[] = [];
    if (task.subTasksJson) {
      try {
        parsedSubTasks = JSON.parse(task.subTasksJson);
      } catch (e) {}
    }

    setEditingTask({
      ...task,
      filesList: getTaskFiles(task),
      additionalPicsList: getAdditionalPics(task),
      subTasksList: parsedSubTasks,
      isAllDay: task.isAllDay !== undefined ? Boolean(task.isAllDay) : true,
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
          } catch(e) {}
        }

        if (savedTask.status === 'Done') {
          addActivityLog('COMPLETE_TASK', 'Pekerjaan Selesai', `Pekerjaan "${savedTask.nama}" telah diselesaikan oleh ${savedTask.pic}.${detailsText}`, 'success');
        } else if (savedTask.prioritas === 'Urgent') {
          addActivityLog('URGENT_TASK', 'Pekerjaan Urgent', `Pekerjaan "${savedTask.nama}" dengan prioritas Urgent diperbarui oleh ${savedTask.pic}.${detailsText}`, 'warning');
        } else {
          addActivityLog('UPDATE_TASK', 'Pekerjaan Diperbarui', `Pekerjaan "${savedTask.nama}" diperbarui oleh ${savedTask.pic}.${detailsText}`, 'info');
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
          } catch(e) {}
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
    try {
      const ExcelJS = (await import('exceljs')).default;

      const workbook = new ExcelJS.Workbook();
      
      // Buat sheet konfigurasi tersembunyi untuk referensi dropdown panjang
      const configSheet = workbook.addWorksheet('Config', { state: 'hidden' });
      const uniquePics = existingPics.length > 0 ? existingPics : ['Unassigned'];
      configSheet.getColumn('A').values = uniquePics;
      
      const worksheet = workbook.addWorksheet('Template Pekerjaan');

      // Tentukan Header
      worksheet.columns = [
        { header: 'Nama Pekerjaan', key: 'nama', width: 35 },
        { header: 'PIC Utama', key: 'pic', width: 25 },
        { header: 'PIC Tambahan', key: 'picTambahan', width: 30 },
        { header: 'Kategori', key: 'kategori', width: 20 },
        { header: 'Prioritas', key: 'prioritas', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Progress', key: 'progress', width: 12 },
        { header: 'Sepanjang Hari', key: 'isAllDay', width: 16 },
        { header: 'Jam Mulai', key: 'startTime', width: 12 },
        { header: 'Jam Selesai', key: 'endTime', width: 12 },
        { header: 'Tanggal Mulai', key: 'startDate', width: 15 },
        { header: 'Tenggat Waktu', key: 'endDate', width: 15 },
        { header: 'Repetisi', key: 'repetisi', width: 18 },
        { header: 'Deskripsi', key: 'deskripsi', width: 40 },
        { header: 'Catatan', key: 'catatan', width: 40 },
        { header: 'Sub Pekerjaan', key: 'subPekerjaan', width: 50 },
      ];

      // Beri warna pada header
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' }
      };

      // Auto wrap untuk kolom Sub Pekerjaan
      worksheet.getColumn('P').alignment = { wrapText: true, vertical: 'top' };

      // Tambahkan Contoh Isian di baris ke-2
      const exampleRow = worksheet.addRow({
        nama: 'Contoh Pekerjaan A (Jangan dihapus, bisa ditimpa)',
        pic: uniquePics[0] || 'Unassigned',
        picTambahan: 'PIC Lain 1, PIC Lain 2',
        kategori: 'Umum',
        prioritas: 'High',
        status: 'In Progress',
        progress: 50,
        isAllDay: 'Tidak',
        startTime: '08:00',
        endTime: '17:00',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        repetisi: 'Tidak Berulang',
        deskripsi: 'Gunakan Alt+Enter untuk baris baru di dalam sel.',
        catatan: 'Contoh catatan',
        subPekerjaan: '[Done] Mengumpulkan data\n[In Progress] Menganalisis data\n[To Do] Membuat laporan akhir',
      });
      // Beri warna latar abu-abu muda untuk baris contoh
      exampleRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };
        cell.font = { italic: true, color: { argb: 'FF4B5563' } };
      });

      // Tambahkan Data Validation untuk 1000 baris pertama
      for (let i = 2; i <= 1000; i++) {
        // PIC Utama (Ambil dari hidden sheet agar tidak kena limit 255 karakter)
        worksheet.getCell(`B${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`Config!$A$1:$A$${uniquePics.length}`]
        };

        // Prioritas
        worksheet.getCell(`E${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${(masterPriorities.length > 0 ? masterPriorities : ['Low','Medium','High','Urgent']).join(',')}"`]
        };

        // Status
        worksheet.getCell(`F${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${(masterStatuses.length > 0 ? masterStatuses : ['To Do','In Progress','Done']).join(',')}"`]
        };

        // Progress (Angka 0-100)
        worksheet.getCell(`G${i}`).dataValidation = {
          type: 'whole',
          operator: 'between',
          allowBlank: true,
          showInputMessage: true,
          promptTitle: 'Progress',
          prompt: 'Masukkan angka antara 0 hingga 100',
          formulae: [0, 100]
        };

        // Sepanjang Hari (Ya/Tidak)
        worksheet.getCell(`H${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Ya,Tidak"']
        };

        // Repetisi
        worksheet.getCell(`M${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Tidak Berulang,Harian,Mingguan,Bulanan"']
        };
      }

      // === Sheet Panduan ===
      const guideSheet = workbook.addWorksheet('Panduan');
      guideSheet.columns = [
        { header: '', key: 'kolom', width: 25 },
        { header: '', key: 'penjelasan', width: 60 },
        { header: '', key: 'contoh', width: 35 },
        { header: '', key: 'wajib', width: 12 },
      ];

      // Title
      guideSheet.mergeCells('A1:D1');
      const titleCell = guideSheet.getCell('A1');
      titleCell.value = 'PANDUAN PENGISIAN TEMPLATE IMPORT PEKERJAAN';
      titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      guideSheet.getRow(1).height = 30;

      // Table Header
      const headerRow = guideSheet.getRow(3);
      headerRow.values = ['Nama Kolom', 'Penjelasan', 'Contoh Isian', 'Wajib?'];
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };

      const guideData = [
        ['Nama Pekerjaan', 'Nama atau judul pekerjaan yang akan dilakukan', 'Membuat Laporan Bulanan', 'Ya'],
        ['PIC Utama', 'Penanggung jawab utama pekerjaan (pilih dari dropdown)', 'Ahmad Fajar', 'Ya'],
        ['PIC Tambahan', 'Penanggung jawab tambahan, pisahkan dengan koma', 'Budi, Sari', 'Tidak'],
        ['Kategori', 'Kategori/jenis pekerjaan sesuai master pengaturan', 'Umum', 'Tidak'],
        ['Prioritas', 'Tingkat prioritas pekerjaan (pilih dari dropdown)', 'High', 'Tidak'],
        ['Status', 'Status progres pekerjaan saat ini (pilih dari dropdown)', 'In Progress', 'Tidak'],
        ['Progress', 'Persentase penyelesaian pekerjaan (angka 0-100)', '50', 'Tidak'],
        ['Sepanjang Hari', 'Apakah pekerjaan berlangsung seharian? Ya = tanpa jam, Tidak = pakai jam', 'Tidak', 'Tidak'],
        ['Jam Mulai', 'Jam mulai pekerjaan dalam format 24 jam (HH:mm). Diisi jika Sepanjang Hari = Tidak', '08:00', 'Tidak'],
        ['Jam Selesai', 'Jam selesai pekerjaan dalam format 24 jam (HH:mm). Diisi jika Sepanjang Hari = Tidak', '17:00', 'Tidak'],
        ['Tanggal Mulai', 'Tanggal dimulainya pekerjaan dalam format YYYY-MM-DD', '2026-08-01', 'Tidak'],
        ['Tenggat Waktu', 'Batas waktu penyelesaian pekerjaan dalam format YYYY-MM-DD', '2026-08-15', 'Tidak'],
        ['Repetisi', 'Pengulangan pekerjaan (pilih dari dropdown)', 'Tidak Berulang', 'Tidak'],
        ['Deskripsi', 'Penjelasan detail mengenai pekerjaan. Gunakan Alt+Enter untuk baris baru', 'Membuat laporan keuangan Q3', 'Tidak'],
        ['Catatan', 'Catatan tambahan terkait pekerjaan', 'Perlu koordinasi dengan tim finance', 'Tidak'],
        ['Sub Pekerjaan', 'Daftar sub-tugas dengan format [Status] Nama. Pisahkan dengan Enter (Alt+Enter di Excel)', '[Done] Kumpulkan data\n[To Do] Analisis', 'Tidak'],
      ];
      guideData.forEach((row, idx) => {
        const r = guideSheet.getRow(4 + idx);
        r.values = row;
        r.getCell(1).font = { bold: true };
        if (idx % 2 === 0) {
          r.eachCell(c => {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
          });
        }
      });

      // Tips section
      const tipsStartRow = 4 + guideData.length + 2;
      guideSheet.mergeCells(`A${tipsStartRow}:D${tipsStartRow}`);
      const tipsTitle = guideSheet.getCell(`A${tipsStartRow}`);
      tipsTitle.value = 'TIPS PENTING';
      tipsTitle.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      tipsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };

      const tips = [
        '1. Baris contoh (baris ke-2 di sheet Template) boleh ditimpa atau dihapus.',
        '2. Kolom dengan dropdown (PIC, Prioritas, Status, dll) sudah disediakan pilihan otomatis.',
        '3. Format tanggal wajib menggunakan YYYY-MM-DD (contoh: 2026-08-01).',
        '4. Format jam menggunakan HH:mm 24 jam (contoh: 08:00, 13:30, 17:00).',
        '5. Jika Sepanjang Hari = "Ya", kolom Jam Mulai dan Jam Selesai akan diabaikan.',
        '6. Untuk Sub Pekerjaan, gunakan format: [Status] Nama Sub Pekerjaan.',
        '7. Status yang valid untuk Sub Pekerjaan sesuai dengan Master Status yang sudah diatur.',
        '8. PIC Tambahan dipisahkan dengan tanda koma (,).',
        '9. Gunakan Alt+Enter untuk membuat baris baru di dalam satu sel Excel.',
      ];
      tips.forEach((tip, idx) => {
        const r = guideSheet.getRow(tipsStartRow + 1 + idx);
        guideSheet.mergeCells(`A${tipsStartRow + 1 + idx}:D${tipsStartRow + 1 + idx}`);
        r.getCell(1).value = tip;
        r.getCell(1).font = { size: 11 };
      });

      // Set all columns alignment
      guideSheet.getColumn(2).alignment = { wrapText: true, vertical: 'top' };
      guideSheet.getColumn(3).alignment = { wrapText: true, vertical: 'top' };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Import_Pekerjaan.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Template berhasil diunduh!');
    } catch (err) {
      console.error('Error generating template:', err);
      toast.error('Gagal membuat template Excel.');
    }
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
        });

        const formattedData = data.map((row: any) => {
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
                return {
                   id: Math.random().toString(36).substring(2, 9),
                   text,
                   status,
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
            progress: p,
            isAllDay,
            startTime: row['jam mulai'] || row['starttime'] || null,
            endTime: row['jam selesai'] || row['endtime'] || null,
            repetisi: row['repetisi'] || 'Tidak Berulang',
            deskripsi: row['deskripsi'] || '',
            catatan: row['catatan'] || '',
            startDate: row['tanggal mulai'] || row['startdate'] || new Date().toISOString(),
            endDate: row['tenggat waktu'] || row['enddate'] || new Date().toISOString(),
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

  const handleExportExcel = () => {
    const exportData = processedTasks.map(t => {
      let subPekerjaanStr = '';
      if (t.subTasksJson) {
         try {
           const parsed: SubTask[] = JSON.parse(t.subTasksJson);
           if (Array.isArray(parsed)) {
             subPekerjaanStr = parsed.map(st => `[${st.status}] ${st.text}`).join('\n');
           }
         } catch(e) {}
      }

      return {
        'Nama Pekerjaan': t.nama,
        'PIC Utama': t.pic,
        'PIC Tambahan': getAdditionalPics(t).join(', '),
        'Kategori': t.kategori || 'Umum',
        'Prioritas': t.prioritas || 'Medium',
        'Status': t.status,
        'Progress (%)': t.progress || 0,
        'Sepanjang Hari': t.isAllDay ? 'Ya' : 'Tidak',
        'Jam Mulai': t.startTime || '',
        'Tanggal Mulai': format(new Date(t.startDate), 'yyyy-MM-dd'),
        'Jam Selesai': t.endTime || '',
        'Tenggat Waktu': format(new Date(t.endDate), 'yyyy-MM-dd'),
        'Repetisi': t.repetisi || 'Tidak Berulang',
        'Sub Pekerjaan': subPekerjaanStr,
        'Diedit (kali)': t.editCount || 0,
        'Terakhir Diedit': t.lastEditedAt ? format(new Date(t.lastEditedAt), 'yyyy-MM-dd HH:mm') : '-',
        'Deskripsi': t.deskripsi || '',
        'Catatan': t.catatan || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Pekerjaan');
    XLSX.writeFile(wb, `Daftar_Pekerjaan_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleExportPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('task-table-container');
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 297;
      const pageHeight = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Tabel_Pekerjaan_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (err) {
      console.error('PDF Export error:', err);
      window.print();
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
        description: `PIC: ${allPicsStr}\nStatus: ${task.status}\nPrioritas: ${task.prioritas}\nRepetisi: ${task.repetisi || 'Tidak Berulang'}\nDeskripsi: ${task.deskripsi || '-'}`,
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

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} /> Tambah Pekerjaan Baru
        </button>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Excel Actions */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button 
                  className="btn" 
                  onClick={() => setShowExcelInfo(!showExcelInfo)}
                  title="Informasi Template Excel"
                  style={{ padding: '10px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Info size={16} />
                </button>
                {showExcelInfo && (
                  <div style={{ 
                    position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 100, 
                    background: 'var(--surface-color)', padding: '16px', borderRadius: '12px', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', 
                    width: '300px', fontSize: '13px', color: 'var(--text-primary)'
                  }}>
                    <h4 style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={16} color="var(--accent-primary)" /> Panduan Excel
                    </h4>
                    <p style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      Gunakan template ini untuk menambahkan banyak pekerjaan sekaligus.
                    </p>
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                      <li>Kolom <b>Kategori, Prioritas, Status</b> dan <b>PIC</b> sudah terhubung (dropdown) dengan pengaturan dinamis (Master Data) Anda.</li>
                      <li>Kolom <b>Sub Pekerjaan</b> dapat diisi banyak baris di 1 sel dengan format <code>[Status] Nama</code> (gunakan Alt+Enter).</li>
                      <li>Jangan mengubah header pada template agar impor berhasil.</li>
                    </ul>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} onClick={() => setShowExcelInfo(false)}>Tutup</button>
                  </div>
                )}
              </div>
              <button 
                className="btn" 
                onClick={handleDownloadTemplate}
                style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)', whiteSpace: 'nowrap' }}
              >
                <Download size={16} /> <span className="hide-mobile">Template Excel</span>
              </button>
              <input type="file" accept=".xlsx, .csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImportExcel} />
              <button 
                className="btn" 
                onClick={() => fileInputRef.current?.click()}
                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)', whiteSpace: 'nowrap' }}
              >
                <Upload size={16} /> <span className="hide-mobile">Import Excel</span>
              </button>
            </div>
          
          <button 
            className="btn" 
            onClick={handleExportExcel}
            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
          >
            <Download size={16} /> Export Excel
          </button>

          <button 
            className="btn" 
            onClick={handleExportPDF}
            style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}
          >
            <FileText size={16} /> Export PDF
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={handleExportAllICS} 
            title="Download .ics untuk semua pekerjaan"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600 }}
          >
            <CalendarDays size={16} /> Export Semua .ics
          </button>
        </div>
      </div>

      

      {/* Filter and Search Bar */}
      <div className="glass" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="input"
            style={{ paddingLeft: '40px' }}
            placeholder="Cari pekerjaan, PIC, atau deskripsi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status:</span>
            <select className="input" style={{ width: 'auto', padding: '6px 10px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">Semua</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Prioritas:</span>
            <select className="input" style={{ width: 'auto', padding: '6px 10px' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="All">Semua</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Kategori:</span>
            <select className="input" style={{ width: 'auto', padding: '6px 10px' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              {categoriesFilter.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Waktu:</span>
            <select className="input" style={{ width: 'auto', padding: '6px 10px' }} value={globalTargetFilter} onChange={e => setGlobalTargetFilter(e.target.value)}>
              <option value="Hari Ini">Hari Ini</option>
              <option value="Minggu Ini">Minggu Ini</option>
              <option value="Bulan Ini">Bulan Ini</option>
              <option value="Semua Waktu">Semua Waktu</option>
              <option value="Custom">Custom...</option>
            </select>
            {globalTargetFilter === 'Custom' && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input 
                  type="date" 
                  value={globalCustomStartDate}
                  onChange={(e) => setGlobalCustomStartDate(e.target.value)}
                  style={{ width: 'auto', padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>-</span>
                <input 
                  type="date" 
                  value={globalCustomEndDate}
                  onChange={(e) => setGlobalCustomEndDate(e.target.value)}
                  style={{ width: 'auto', padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>PIC:</span>
            <select className="input" style={{ width: 'auto', padding: '6px 10px' }} value={globalPicFilter} onChange={e => setGlobalPicFilter(e.target.value)}>
              <option value="Semua PIC">Semua PIC</option>
              {pics.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table with Sortable Columns */}
      
        
        <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, backgroundColor: 'var(--surface-color)', padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'inline-block' }}>
          Menampilkan <strong style={{ color: 'var(--accent-primary)' }}>{processedTasks.length}</strong> pekerjaan sesuai filter dari total <strong style={{ color: 'var(--text-primary)' }}>{tasks.length}</strong> data terdaftar.
        </div>

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

        <div id="task-table-container" className="glass" style={{ padding: '24px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>

                  <th style={{ padding: '14px 12px', width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={processedTasks.length > 0 && selectedTasks.size === processedTasks.length}
                      onChange={handleToggleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                <th style={{ padding: '14px 12px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('nama')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Pekerjaan {renderSortIcon('nama')}
                  </div>
                </th>
                <th style={{ padding: '14px 12px' }}>
                  Deskripsi
                </th>
                <th style={{ padding: '14px 12px' }}>
                  Sub Pekerjaan
                </th>
                <th style={{ padding: '14px 12px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('pic')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    PIC {renderSortIcon('pic')}
                  </div>
                </th>
                <th style={{ padding: '14px 12px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('kategori')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Kategori {renderSortIcon('kategori')}
                  </div>
                </th>
                <th style={{ padding: '14px 12px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('prioritas')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Prioritas {renderSortIcon('prioritas')}
                  </div>
                </th>
                <th style={{ padding: '14px 12px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Status & Progress {renderSortIcon('status')}
                  </div>
                </th>
                <th style={{ padding: '14px 12px' }}>Lampiran</th>
                <th style={{ padding: '14px 12px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('endDate')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Tenggat Waktu {renderSortIcon('endDate')}
                  </div>
                </th>
                <th style={{ padding: '14px 12px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {processedTasks.map(task => {
                const prog = task.progress || (masterStatusProgress[task.status] ?? (task.status === 'Done' ? 100 : task.status === 'In Progress' ? 50 : 0));
                const taskFiles = getTaskFiles(task);
                const extraPics = getAdditionalPics(task);

                return (
                  <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>

                      <td style={{ padding: '16px 12px', textAlign: 'center', verticalAlign: 'top' }} onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedTasks.has(task.id)}
                          onChange={() => handleToggleSelect(task.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    <td style={{ padding: '16px 12px', maxWidth: '240px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => setDetailTask(task)}>
                        {task.nama}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                        {task.repetisi && task.repetisi !== 'Tidak Berulang' && (
                          <div style={{ fontSize: '11px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Repeat size={12} /> {task.repetisi}
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
                    <td style={{ padding: '16px 12px', maxWidth: '200px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {task.deskripsi || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {task.subTasksJson ? (() => {
                         try {
                           const st = JSON.parse(task.subTasksJson);
                           if (!st || st.length === 0) return '-';
                           const doneCount = st.filter((s: any) => s.status === 'Done').length;
                           return `${doneCount}/${st.length} Selesai`;
                         } catch (e) { return '-'; }
                      })() : '-'}
                    </td>
                    <td style={{ padding: '16px 12px', fontWeight: '500' }}>
                      <div>{task.pic}</div>
                      {extraPics.length > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          +{extraPics.join(', ')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span {...getDynamicBadgeStyle('category', task.kategori || 'Umum', '', masterColors)} style={{ ...getDynamicBadgeStyle('category', task.kategori || 'Umum', '', masterColors).style, whiteSpace: 'nowrap', fontSize: '12px', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        {task.kategori || 'Umum'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span {...getDynamicBadgeStyle('priority', task.prioritas || 'Medium', 'badge badge-medium', masterColors)}>
                        {task.prioritas || 'Medium'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px', minWidth: '150px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                        <span {...getDynamicBadgeStyle('status', task.status, '', masterColors)} style={{ ...getDynamicBadgeStyle('status', task.status, '', masterColors).style, fontWeight: '600' }}>
                          {task.status}
                        </span>
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
                    <td style={{ padding: '16px 12px' }}>
                      {taskFiles.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {taskFiles.map((f, idx) => (
                            <button 
                              key={idx}
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setPreviewFile(f)}
                              title={`Lihat File: ${f.name}`}
                            >
                              <Paperclip size={12} color="var(--accent-primary)" />
                              <span style={{ maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div>{format(new Date(task.endDate), 'dd MMM yyyy')}</div>
                      {!task.isAllDay && task.startTime && (
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>{task.startTime} - {task.endTime}</div>
                      )}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <a 
                          href={getGoogleCalendarUrl(task)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 8px' }} 
                          title="Tambah ke Google Calendar"
                        >
                          <ExternalLink size={15} color="#4285F4" />
                        </a>
                        <button className="btn btn-secondary" style={{ padding: '6px 8px' }} onClick={() => handleExportICS(task)} title="Download .ics">
                          <CalendarDays size={15} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 8px' }} onClick={() => handleOpenEditModal(task)} title="Edit Pekerjaan">
                          <Pencil size={15} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '6px 8px' }} onClick={() => handleDelete(task.id)} title="Hapus">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {processedTasks.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Tidak ada pekerjaan yang sesuai dengan filter atau pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
          formCategoryOptions={formCategoryOptions}
          formPicOptions={formPicOptions}
          formStatusOptions={masterStatuses}
          formPriorityOptions={masterPriorities}
          setPreviewFile={setPreviewFile}
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