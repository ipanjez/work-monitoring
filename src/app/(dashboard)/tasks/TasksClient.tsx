'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Download, Upload, Plus, Pencil, Trash2, CalendarDays, Search, Filter, 
  ExternalLink, FileText, X, CheckCircle, Clock, AlertCircle, Info, Sparkles, Paperclip, Eye, File, 
  ArrowUpDown, ArrowUp, ArrowDown, Repeat, UserPlus, History, Copy 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createEvent, createEvents, EventAttributes } from 'ics';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import FileViewer from '@/components/FileViewer';
import { useFilter } from '@/context/FilterContext';
import { useNotifications } from '@/context/NotificationContext';

export type FileItem = {
  url: string;
  name: string;
};

export type LogItem = {
  action: string;
  timestamp: string;
};

export type Task = {
  id: number;
  nama: string;
  pic: string;
  status: string;
  prioritas: string;
  kategori: string;
  progress: number;
  deskripsi?: string | null;
  catatan?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  filesJson?: string | null;
  isAllDay?: boolean | null;
  startTime?: string | null;
  endTime?: string | null;
  repetisi?: string | null;
  additionalPics?: string | null;
  editCount?: number | null;
  lastEditedAt?: string | Date | null;
  historyLogsJson?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  startDate: string | Date;
  endDate: string | Date;
};

type SortField = 'nama' | 'pic' | 'kategori' | 'prioritas' | 'status' | 'progress' | 'endDate';

export default function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
  const { globalTargetFilter, setGlobalTargetFilter, globalPicFilter, setGlobalPicFilter } = useFilter();
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
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Partial<Task> & { filesList?: FileItem[]; additionalPicsList?: string[]; isCustomCategory?: boolean; isCustomPic?: boolean; customRecurrenceSettings?: any } | null>(null);
  const [customAdditionalPics, setCustomAdditionalPics] = useState<boolean[]>([]);
  
  // Interactive Copyable Error Modal State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // In-App File Preview Modal State
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const [masterCats, setMasterCats] = useState<string[]>([]);
  const [masterPics, setMasterPics] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.master_categories) setMasterCats(data.master_categories);
        if (data.master_pics) setMasterPics(data.master_pics);
      })
      .catch(e => console.error(e));
  }, []);

  const refreshData = () => router.refresh();

  const defaultCategoryList = ['Umum', 'IT', 'HR', 'Finance', 'Logistik', 'Operasional', 'Marketing', 'Produksi'];
  const allCategoryOptions = Array.from(new Set([...defaultCategoryList, ...tasks.map(t => t.kategori).filter((c): c is string => Boolean(c)), ...masterCats]));
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
  let formCategoryOptions = masterCats.length > 0 ? [...masterCats] : [...defaultCategoryList];
  if (editingTask?.kategori && !formCategoryOptions.includes(editingTask.kategori)) {
    formCategoryOptions.push(editingTask.kategori);
  }

  let formPicOptions = masterPics.length > 0 ? [...masterPics] : Array.from(new Set(tasks.map(t => t.pic).filter(Boolean)));
  if (editingTask?.pic && !formPicOptions.includes(editingTask.pic)) {
    formPicOptions.push(editingTask.pic);
  }

  // Helper to parse file list from Task
  const getTaskFiles = (task: Task | Partial<Task>): FileItem[] => {
    if (task.filesJson) {
      try {
        return JSON.parse(task.filesJson);
      } catch (e) {}
    }
    if (task.fileUrl) {
      return [{ url: task.fileUrl, name: task.fileName || 'File Lampiran' }];
    }
    return [];
  };

  const getAdditionalPics = (task: Task | Partial<Task>): string[] => {
    if (task.additionalPics) {
      try {
        const parsed = JSON.parse(task.additionalPics);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  };

  const getHistoryLogs = (task: Task | Partial<Task>): LogItem[] => {
    if (task.historyLogsJson) {
      try {
        const parsed = JSON.parse(task.historyLogsJson);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  };

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
    }

    let matchesTarget = false;
    if (globalTargetFilter === 'Semua Waktu') {
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
      isAllDay: true,
      startTime: '08:00',
      endTime: '17:00',
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

    setEditingTask({
      ...task,
      filesList: getTaskFiles(task),
      additionalPicsList: getAdditionalPics(task),
      isAllDay: task.isAllDay !== undefined ? Boolean(task.isAllDay) : true,
      startTime: task.startTime || '08:00',
      endTime: task.endTime || '17:00',
      repetisi: repetisiValue,
      customRecurrenceSettings,
      startDate: typeof task.startDate === 'string' ? task.startDate.split('T')[0] : new Date(task.startDate).toISOString().split('T')[0],
      endDate: typeof task.endDate === 'string' ? task.endDate.split('T')[0] : new Date(task.endDate).toISOString().split('T')[0],
      isCustomCategory: false,
      isCustomPic: false,
    });
    setIsModalOpen(true);
  };

  const handleAddAnotherPic = () => {
    if (!editingTask) return;
    const currentList = editingTask.additionalPicsList || [];
    setEditingTask({
      ...editingTask,
      additionalPicsList: [...currentList, ''],
    });
  };

  const handleUpdateAdditionalPic = (index: number, val: string) => {
    if (!editingTask || !editingTask.additionalPicsList) return;
    const updated = [...editingTask.additionalPicsList];
    updated[index] = val;
    setEditingTask({
      ...editingTask,
      additionalPicsList: updated,
    });
  };

  const handleRemoveAdditionalPic = (index: number) => {
    if (!editingTask || !editingTask.additionalPicsList) return;
    const updated = editingTask.additionalPicsList.filter((_, idx) => idx !== index);
    setEditingTask({
      ...editingTask,
      additionalPicsList: updated,
    });
  };

  // Upload Multiple Files Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingTask) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('file', f));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      const newUploadedFiles: FileItem[] = data.files || [];
      const currentList = editingTask.filesList || [];
      const updatedList = [...currentList, ...newUploadedFiles];

      setEditingTask({
        ...editingTask,
        filesList: updatedList,
        fileUrl: updatedList[0]?.url || '',
        fileName: updatedList[0]?.name || '',
      });
      toast.success(`File ${files.length > 1 ? 'lampiran' : 'lampiran'} berhasil diunggah!`);
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMessage(`Upload File Error:\n${err?.message || err}`);
      toast.error(`Gagal mengunggah file: ${err?.message || err}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFileFromEdit = (index: number) => {
    if (!editingTask || !editingTask.filesList) return;
    const updated = editingTask.filesList.filter((_, idx) => idx !== index);
    setEditingTask({
      ...editingTask,
      filesList: updated,
      fileUrl: updated[0]?.url || '',
      fileName: updated[0]?.name || '',
    });
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
        repetisi: editingTask.repetisi === 'Custom' ? `CUSTOM_RECURRENCE:${JSON.stringify(editingTask.customRecurrenceSettings)}` : editingTask.repetisi,
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

      // Auto-add new PIC and Category to Master
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

      if (savedTask.kategori && !masterCats.includes(savedTask.kategori) && !defaultCategoryList.includes(savedTask.kategori)) {
        const updatedCats = [...masterCats, savedTask.kategori];
        setMasterCats(updatedCats);
        localStorage.setItem('master_categories', JSON.stringify(updatedCats));
      }

      setIsModalOpen(false);
      setEditingTask(null);

      // Trigger Notifications
      if (addActivityLog) {
        if (savedTask.status === 'Done') {
          addActivityLog('COMPLETE_TASK', 'Pekerjaan Selesai', `Pekerjaan "${savedTask.nama}" telah diselesaikan oleh ${savedTask.pic}`, 'success');
        } else if (savedTask.prioritas === 'Urgent') {
          addActivityLog('URGENT_TASK', 'Pekerjaan Urgent', `Pekerjaan "${savedTask.nama}" dengan prioritas Urgent diperbarui oleh ${savedTask.pic}`, 'warning');
        } else {
          addActivityLog('UPDATE_TASK', 'Pekerjaan Diperbarui', `Pekerjaan "${savedTask.nama}" diperbarui oleh ${savedTask.pic}`, 'info');
        }
      }

      const res = await fetch('/api/tasks');
      if (res.ok) {
        const updated = await res.json();
        if (Array.isArray(updated)) setTasks(updated);
      }
      refreshData();
      
      // Dispatch event to update Sidebar real-time
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
        addActivityLog('DELETE_TASK', 'Pekerjaan Dihapus', `Pekerjaan "${taskToDelete.nama}" telah dihapus`, 'danger');
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

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const formattedData = data.map((row: any) => ({
          nama: row['Nama Pekerjaan'] || row.nama || 'Tanpa Nama',
          pic: row['PIC'] || row.pic || 'Unassigned',
          status: row['Status'] || row.status || 'To Do',
          prioritas: row['Prioritas'] || row.prioritas || 'Medium',
          kategori: row['Kategori'] || row.kategori || 'Umum',
          progress: Number(row['Progress']) || 0,
          deskripsi: row['Deskripsi'] || row.deskripsi || '',
          catatan: row['Catatan'] || row.catatan || '',
          startDate: row['Tanggal Mulai'] || row.startDate || new Date().toISOString(),
          endDate: row['Tenggat Waktu'] || row.endDate || new Date().toISOString(),
        }));

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
    const exportData = processedTasks.map(t => ({
      'Nama Pekerjaan': t.nama,
      'PIC Utama': t.pic,
      'PIC Tambahan': getAdditionalPics(t).join(', '),
      'Kategori': t.kategori || 'Umum',
      'Prioritas': t.prioritas || 'Medium',
      'Status': t.status,
      'Progress (%)': t.progress || 0,
      'Diedit (kali)': t.editCount || 0,
      'Terakhir Diedit': t.lastEditedAt ? format(new Date(t.lastEditedAt), 'yyyy-MM-dd HH:mm') : '-',
      'Tanggal Mulai': format(new Date(t.startDate), 'yyyy-MM-dd'),
      'Tenggat Waktu': format(new Date(t.endDate), 'yyyy-MM-dd'),
    }));

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

  const getGoogleCalendarUrl = (task: Task) => {
    const extraPics = getAdditionalPics(task);
    const allPicsStr = [task.pic, ...extraPics].join(', ');
    const title = encodeURIComponent(task.nama);
    const details = encodeURIComponent(`PIC: ${allPicsStr}\nKategori: ${task.kategori || 'Umum'}\nPrioritas: ${task.prioritas || 'Medium'}\nRepetisi: ${task.repetisi || 'Tidak Berulang'}\nStatus: ${task.status}\n\nDeskripsi:\n${task.deskripsi || '-'}`);
    const dates = `${new Date(task.startDate).toISOString().replace(/-|:|\.\d+/g, '')}/${new Date(task.endDate).toISOString().replace(/-|:|\.\d+/g, '')}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
  };

  const getPriorityBadgeClass = (p?: string) => {
    switch (p) {
      case 'Urgent': return 'badge-urgent';
      case 'High': return 'badge-high';
      case 'Low': return 'badge-low';
      default: return 'badge-medium';
    }
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
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx,.csv" onChange={handleImportExcel} />
          <button 
            className="btn" 
            onClick={() => fileInputRef.current?.click()}
            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
          >
            <Upload size={16} /> Import Excel
          </button>
          
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
            </select>
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
      <div id="task-table-container" className="glass" style={{ padding: '24px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <th style={{ padding: '14px 12px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('nama')}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Pekerjaan {renderSortIcon('nama')}
                  </div>
                </th>
                <th style={{ padding: '14px 12px' }}>
                  Deskripsi
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
                const prog = task.progress || (task.status === 'Done' ? 100 : task.status === 'In Progress' ? 50 : 0);
                const taskFiles = getTaskFiles(task);
                const extraPics = getAdditionalPics(task);

                return (
                  <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
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
                        {(task.editCount || 0) > 0 && (
                          <span style={{ fontSize: '10px', background: 'rgba(37,99,235,0.15)', color: 'var(--accent-primary)', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <History size={10} /> Diedit {task.editCount}x
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
                    <td style={{ padding: '16px 12px', fontWeight: '500' }}>
                      <div>{task.pic}</div>
                      {extraPics.length > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          +{extraPics.join(', ')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-color)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        {task.kategori || 'Umum'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span className={`badge ${getPriorityBadgeClass(task.prioritas)}`}>
                        {task.prioritas || 'Medium'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px', minWidth: '150px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                        <span style={{ 
                          fontWeight: '600',
                          color: task.status === 'Done' ? 'var(--success)' : task.status === 'In Progress' ? 'var(--warning)' : 'var(--accent-primary)'
                        }}>
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

      {/* Add / Edit Task Modal */}
      <AnimatePresence>
        {isModalOpen && editingTask && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <motion.div 
              className="modal-content"
              style={{ maxWidth: '650px' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {editingTask.id ? 'Edit Pekerjaan' : 'Tambah Pekerjaan Baru'}
                </h2>
                <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setIsModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Nama Pekerjaan *
                  </label>
                  <input 
                    className="input" 
                    placeholder="Contoh: Audit Keuangan Kuartal II" 
                    value={editingTask.nama || ''} 
                    onChange={e => setEditingTask({ ...editingTask, nama: e.target.value })} 
                  />
                </div>

                {/* Main PIC & Dynamic Multi-PIC Section */}
                <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Penanggung Jawab (PIC Utama & Tambahan) *
                    </label>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={handleAddAnotherPic}
                    >
                      <UserPlus size={14} /> + Tambah PIC Lain
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>PIC Utama *</span>
                      {!editingTask.isCustomPic ? (
                        <select 
                          className="input" 
                          value={editingTask.pic || ''} 
                          onChange={e => {
                            if (e.target.value === '__custom__') {
                              setEditingTask({ ...editingTask, pic: '', isCustomPic: true });
                            } else {
                              setEditingTask({ ...editingTask, pic: e.target.value });
                            }
                          }}
                        >
                          <option value="">-- Pilih PIC Utama --</option>
                          {formPicOptions.map((p, idx) => (
                            <option key={idx} value={p}>{p}</option>
                          ))}
                          <option value="__custom__">+ Ketik Nama PIC Baru...</option>
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input 
                            className="input" 
                            placeholder="Nama PIC Utama Baru..." 
                            value={editingTask.pic || ''} 
                            onChange={e => setEditingTask({ ...editingTask, pic: e.target.value })} 
                          />
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            style={{ padding: '6px' }}
                            onClick={() => setEditingTask({ ...editingTask, isCustomPic: false })}
                            title="Kembali ke Dropdown PIC"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingTask.additionalPicsList && editingTask.additionalPicsList.map((extraPic, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {(!customAdditionalPics.includes(idx)) ? (
                          <select
                            className="input"
                            value={extraPic}
                            onChange={e => {
                              if (e.target.value === '__custom__') {
                                 setCustomAdditionalPics([...customAdditionalPics, idx]);
                                 handleUpdateAdditionalPic(idx, '');
                              } else {
                                 handleUpdateAdditionalPic(idx, e.target.value);
                              }
                            }}
                          >
                            <option value="">-- Pilih PIC Tambahan --</option>
                            {formPicOptions.map((p, i) => (
                              <option key={i} value={p}>{p}</option>
                            ))}
                            <option value="__custom__">+ Ketik Nama PIC Baru...</option>
                          </select>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                            <input 
                              className="input" 
                              placeholder={`Nama PIC Tambahan ${idx + 1}...`} 
                              value={extraPic} 
                              onChange={e => handleUpdateAdditionalPic(idx, e.target.value)} 
                            />
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              style={{ padding: '6px' }}
                              onClick={() => {
                                 setCustomAdditionalPics(customAdditionalPics.filter(i => i !== idx));
                                 handleUpdateAdditionalPic(idx, '');
                              }}
                              title="Kembali ke Dropdown PIC"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px' }}
                          onClick={() => {
                            handleRemoveAdditionalPic(idx);
                            setCustomAdditionalPics(customAdditionalPics.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {/* Explicit Dropdown Select for Category */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Kategori *
                    </label>
                    {!editingTask.isCustomCategory ? (
                      <select 
                        className="input" 
                        value={editingTask.kategori || 'Umum'} 
                        onChange={e => {
                          if (e.target.value === '__custom__') {
                            setEditingTask({ ...editingTask, kategori: '', isCustomCategory: true });
                          } else {
                            setEditingTask({ ...editingTask, kategori: e.target.value });
                          }
                        }}
                      >
                        {formCategoryOptions.map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                        <option value="__custom__">+ Ketik Kategori Baru...</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input 
                          className="input" 
                          placeholder="Nama Kategori Baru..." 
                          value={editingTask.kategori || ''} 
                          onChange={e => setEditingTask({ ...editingTask, kategori: e.target.value })} 
                        />
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '6px' }}
                          onClick={() => setEditingTask({ ...editingTask, kategori: 'Umum', isCustomCategory: false })}
                          title="Kembali ke Pilihan Dropdown"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Status
                    </label>
                    <select className="input" value={editingTask.status || 'To Do'} onChange={e => {
                      const newStatus = e.target.value;
                      if (newStatus === 'Done') {
                        setEditingTask({ ...editingTask, status: newStatus, progress: 100 });
                      } else if (newStatus === 'In Progress') {
                        setEditingTask({ ...editingTask, status: newStatus, progress: 50 });
                      } else if (newStatus === 'To Do') {
                        setEditingTask({ ...editingTask, status: newStatus, progress: 0 });
                      } else {
                        setEditingTask({ ...editingTask, status: newStatus });
                      }
                    }}>
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Prioritas
                    </label>
                    <select className="input" value={editingTask.prioritas || 'Medium'} onChange={e => setEditingTask({ ...editingTask, prioritas: e.target.value })}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Date & Time Settings */}
                <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Waktu & Jadwal Pekerjaan</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={editingTask.isAllDay ?? true}
                        onChange={e => setEditingTask({ ...editingTask, isAllDay: e.target.checked })}
                      />
                      Seharian (All Day)
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tanggal Mulai</label>
                      <input 
                        type="date" 
                        className="input" 
                        value={editingTask.startDate as string} 
                        onChange={e => setEditingTask({ ...editingTask, startDate: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tenggat Waktu</label>
                      <input 
                        type="date" 
                        className="input" 
                        value={editingTask.endDate as string} 
                        onChange={e => setEditingTask({ ...editingTask, endDate: e.target.value })} 
                      />
                    </div>
                  </div>

                  {!editingTask.isAllDay && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Jam Mulai</label>
                        <input 
                          type="time" 
                          className="input" 
                          value={editingTask.startTime || '08:00'} 
                          onChange={e => setEditingTask({ ...editingTask, startTime: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Jam Selesai</label>
                        <input 
                          type="time" 
                          className="input" 
                          value={editingTask.endTime || '17:00'} 
                          onChange={e => setEditingTask({ ...editingTask, endTime: e.target.value })} 
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Pengulangan (Recurrence)
                    </label>
                    <select 
                      className="input" 
                      value={editingTask.repetisi || 'Tidak Berulang'} 
                      onChange={e => setEditingTask({ ...editingTask, repetisi: e.target.value })}
                    >
                      <option value="Tidak Berulang">Tidak Berulang (Does not repeat)</option>
                      <option value="Harian">Harian (Daily)</option>
                      <option value="Mingguan">Mingguan (Weekly)</option>
                      <option value="Bulanan">Bulanan (Monthly)</option>
                      <option value="Tahunan">Tahunan (Annually)</option>
                      <option value="Hari Kerja (Senin - Jumat)">Setiap Hari Kerja (Senin - Jumat)</option>
                      <option value="Custom">Custom...</option>
                    </select>

                    {editingTask.repetisi === 'Custom' && editingTask.customRecurrenceSettings && (
                      <div style={{ marginTop: '12px', padding: '16px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>Ulangi setiap</span>
                          <input 
                            type="number" 
                            min="1" 
                            className="input" 
                            style={{ width: '70px', padding: '6px 10px' }}
                            value={editingTask.customRecurrenceSettings.every}
                            onChange={e => setEditingTask({ 
                              ...editingTask, 
                              customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, every: Math.max(1, Number(e.target.value)) }
                            })}
                          />
                          <select 
                            className="input" 
                            style={{ width: '120px', padding: '6px 10px' }}
                            value={editingTask.customRecurrenceSettings.unit}
                            onChange={e => setEditingTask({ 
                              ...editingTask, 
                              customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, unit: e.target.value }
                            })}
                          >
                            <option value="Hari">Hari</option>
                            <option value="Minggu">Minggu</option>
                            <option value="Bulan">Bulan</option>
                            <option value="Tahun">Tahun</option>
                          </select>
                        </div>

                        {editingTask.customRecurrenceSettings.unit === 'Minggu' && (
                          <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Ulangi pada:</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                                const isSelected = editingTask.customRecurrenceSettings.days.includes(idx.toString());
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      const days = [...editingTask.customRecurrenceSettings.days];
                                      if (isSelected) {
                                        days.splice(days.indexOf(idx.toString()), 1);
                                      } else {
                                        days.push(idx.toString());
                                      }
                                      setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, days } });
                                    }}
                                    style={{
                                      width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                                      background: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                                      color: isSelected ? 'white' : 'var(--text-primary)',
                                      fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Berakhir pada:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                              <input 
                                type="radio" 
                                name="endType" 
                                checked={editingTask.customRecurrenceSettings.endType === 'never'}
                                onChange={() => setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, endType: 'never' } })}
                              />
                              Tidak pernah (Never)
                            </label>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                              <input 
                                type="radio" 
                                name="endType" 
                                checked={editingTask.customRecurrenceSettings.endType === 'date'}
                                onChange={() => setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, endType: 'date' } })}
                              />
                              Pada tanggal
                              <input 
                                type="date" 
                                className="input" 
                                style={{ width: '130px', padding: '4px 8px', fontSize: '12px', marginLeft: '8px' }}
                                value={editingTask.customRecurrenceSettings.endDate}
                                disabled={editingTask.customRecurrenceSettings.endType !== 'date'}
                                onChange={e => setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, endDate: e.target.value } })}
                              />
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                              <input 
                                type="radio" 
                                name="endType" 
                                checked={editingTask.customRecurrenceSettings.endType === 'occurrences'}
                                onChange={() => setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, endType: 'occurrences' } })}
                              />
                              Setelah
                              <input 
                                type="number" 
                                min="1" 
                                className="input" 
                                style={{ width: '60px', padding: '4px 8px', fontSize: '12px', marginLeft: '8px' }}
                                value={editingTask.customRecurrenceSettings.endOccurrences}
                                disabled={editingTask.customRecurrenceSettings.endType !== 'occurrences'}
                                onChange={e => setEditingTask({ ...editingTask, customRecurrenceSettings: { ...editingTask.customRecurrenceSettings, endOccurrences: Math.max(1, Number(e.target.value)) } })}
                              />
                              kali
                            </label>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Slider & Number Input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Progress Penyelesaian (%)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        className="input" 
                        style={{ width: '70px', padding: '4px 8px', textAlign: 'center', fontWeight: 'bold' }}
                        value={editingTask.progress ?? 0}
                        onChange={e => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setEditingTask({ ...editingTask, progress: val });
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>%</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    style={{ width: '100%' }}
                    value={editingTask.progress ?? 0} 
                    onChange={e => setEditingTask({ ...editingTask, progress: Number(e.target.value) })} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Deskripsi Pekerjaan
                  </label>
                  <textarea 
                    className="input" 
                    rows={3} 
                    placeholder="Penjelasan ringkas mengenai tugas ini..."
                    value={editingTask.deskripsi || ''} 
                    onChange={e => setEditingTask({ ...editingTask, deskripsi: e.target.value })} 
                  />
                </div>

                {/* Multiple File Attachments Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    File Lampiran (Bisa Unggah Lebih dari 1 File)
                  </label>
                  <input 
                    type="file" 
                    ref={attachmentInputRef} 
                    style={{ display: 'none' }} 
                    multiple
                    onChange={handleFileUpload} 
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => attachmentInputRef.current?.click()}
                      disabled={uploadingFile}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <Paperclip size={16} /> {uploadingFile ? 'Mengunggah...' : '+ Unggah File Lampiran (Bisa >1)'}
                    </button>

                    {editingTask.filesList && editingTask.filesList.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--surface-color)', padding: '12px', borderRadius: '10px' }}>
                        {editingTask.filesList.map((f, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => setPreviewFile(f)}>
                              <File size={15} />
                              <span style={{ fontWeight: 500 }}>{f.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button 
                                type="button" 
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 6px' }}
                                onClick={() => setPreviewFile(f)}
                                title="Pratinjau File"
                              >
                                <Eye size={15} />
                              </button>
                              <button 
                                type="button" 
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px 6px' }}
                                onClick={() => handleRemoveFileFromEdit(idx)}
                                title="Hapus Lampiran Ini"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
                  <button className="btn btn-primary" onClick={handleSaveModal} disabled={loading || uploadingFile}>
                    {loading ? 'Menyimpan...' : 'Simpan Pekerjaan'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Detail Modal with Audit Logs & Activity Timeline */}
      <AnimatePresence>
        {detailTask && (
          <div className="modal-overlay" onClick={() => setDetailTask(null)}>
            <motion.div 
              className="modal-content"
              style={{ maxWidth: '650px' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <span className={`badge ${getPriorityBadgeClass(detailTask.prioritas)}`} style={{ marginBottom: '8px' }}>
                    {detailTask.prioritas || 'Medium'} Priority
                  </span>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{detailTask.nama}</h2>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setDetailTask(null)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--surface-color)', padding: '16px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>PIC</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {detailTask.pic} {getAdditionalPics(detailTask).length > 0 && `(+, ${getAdditionalPics(detailTask).join(', ')})`}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Kategori</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{detailTask.kategori || 'Umum'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Status</span>
                    <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{detailTask.status} ({detailTask.progress || 0}%)</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Repetisi</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{detailTask.repetisi || 'Tidak Berulang'}</span>
                  </div>
                </div>

                {/* Audit Logging Information Box */}
                <div style={{ background: 'var(--input-bg)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History size={16} color="var(--accent-primary)" /> Log Informasi & Riwayat Perubahan
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Dibuat Pada</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {detailTask.createdAt ? format(new Date(detailTask.createdAt), 'dd MMM yyyy HH:mm') : '-'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Diedit Terakhir</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {detailTask.lastEditedAt ? format(new Date(detailTask.lastEditedAt), 'dd MMM yyyy HH:mm') : 'Belum pernah'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Frekuensi Edit</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {detailTask.editCount || 0} kali
                      </span>
                    </div>
                  </div>

                  {/* Activity History Timeline List */}
                  {getHistoryLogs(detailTask).length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Timeline Aktivitas:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                        {getHistoryLogs(detailTask).map((log, idx) => (
                          <div key={idx} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>• {log.action}</span>
                            <span>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {detailTask.deskripsi && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Deskripsi</h4>
                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--input-bg)', padding: '12px', borderRadius: '8px' }}>
                      {detailTask.deskripsi}
                    </p>
                  </div>
                )}

                {/* Multiple Files Detail Display */}
                {getTaskFiles(detailTask).length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      File Lampiran ({getTaskFiles(detailTask).length} File)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {getTaskFiles(detailTask).map((f, idx) => (
                        <button 
                          key={idx}
                          type="button"
                          className="btn btn-secondary"
                          style={{ justifyContent: 'space-between', fontSize: '13px', width: '100%' }}
                          onClick={() => setPreviewFile(f)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Paperclip size={16} color="var(--accent-primary)" />
                            <span>{f.name}</span>
                          </div>
                          <Eye size={14} color="var(--text-secondary)" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <a 
                    href={getGoogleCalendarUrl(detailTask)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary"
                  >
                    <ExternalLink size={16} /> Tambah ke Google Calendar
                  </a>
                  <button className="btn btn-secondary" onClick={() => handleExportICS(detailTask)}>
                    <CalendarDays size={16} /> Download .ics
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Copyable Error Details Modal */}
      <AnimatePresence>
        {errorMessage && (
          <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setErrorMessage(null)}>
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

      {/* In-App File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
            <motion.div 
              className="modal-content"
              style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Paperclip size={20} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                    {previewFile.name}
                  </h3>
                </div>
                <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setPreviewFile(null)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', background: 'var(--surface-color)', borderRadius: '12px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <FileViewer url={previewFile.url} name={previewFile.name} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  <ExternalLink size={16} /> Buka di Tab Baru
                </a>
                <a href={previewFile.url} download={previewFile.name} className="btn btn-primary">
                  <Download size={16} /> Unduh File
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
