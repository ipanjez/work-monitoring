'use client';
import { useMaster } from '@/context/MasterContext';
import { useState, useEffect, useTransition, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import FilePreviewModal from '@/components/FilePreviewModal';
import TaskDetailModal from '@/components/TaskDetailModal';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import { Calendar as CalendarIcon, Clock, Edit2, Plus, Search, MapPin, AlignLeft, CheckSquare, MessageSquare, History, FileText, Download, Filter, ArrowUpDown, Copy, ChevronUp, ChevronDown, Paperclip, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { useFilter } from '@/context/FilterContext';
import UniversalFilterBar from '@/components/UniversalFilterBar';
import UniversalActionBar from '@/components/UniversalActionBar';
import { checkSearchMatch } from '@/utils/searchUtils';
import { exportToRichExcel } from '@/utils/excelExport';
import { getTaskComments, getTaskFiles, getHistoryLogs, getDynamicBadgeStyle, getTaskExportRow, getPriorityBadgeClass, getTaskLocationString } from '@/utils/taskUtils';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';

import { useSession } from 'next-auth/react';
import { hasPermission, RolePermissionsConfig, defaultRolePermissions } from '@/lib/permissions';

export default function BoardClient({ tasks: initialTasks }: { tasks: any[] }) {
  const { data: session } = useSession();
  const userRole: string = (session?.user as any)?.role || 'PIC';

  const {
    masterColors,
    masterPicAvatars,
    masterCats: formCategoryOptions,
    masterPics: formPicOptions,
    masterStatuses,
    masterPriorities,
    roleConfig
  } = useMaster();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    globalTargetFilter, setGlobalTargetFilter,
    globalPicFilter, setGlobalPicFilter,
    globalCustomStartDate, setGlobalCustomStartDate,
    globalCustomEndDate, setGlobalCustomEndDate,
    globalSearchQuery: searchQuery,
    globalFilterCategory: filterCategory,
    globalFilterStatus,
    globalFilterPriority,
    globalSearchExactMatch,
  } = useFilter();
  const [tasks, setTasks] = useState(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  
  // Touch Drag-and-Drop States for Mobile HP
  const [touchActive, setTouchActive] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });
  const [touchCardLabel, setTouchCardLabel] = useState('');
  const touchOffset = useRef({ x: 0, y: 0 });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [colSorts, setColSorts] = useState<Record<string, string>>({});

  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    if (session && !hasPermission(roleConfig, 'view_dashboard', userRole)) {
      router.replace('/tasks');
    }
  }, [session, roleConfig, userRole, router]);

  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated && updated !== selectedTask) {
        setSelectedTask(updated);
      }
    }
  }, [tasks, selectedTask]);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverColumn = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    setDragOverColumn(column);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragOverCard = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    setDragOverCardId(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverColumn(null);
    setDragOverCardId(null);
  };

  // Mobile Touch Drag-and-Drop Handlers
  const handleTouchStart = (e: React.TouchEvent, task: any) => {
    const touch = e.touches[0];
    const cardEl = e.currentTarget as HTMLElement;
    const rect = cardEl.getBoundingClientRect();
    
    // Save offset of touch relative to card top-left corner
    touchOffset.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    
    setDraggedTaskId(task.id);
    setTouchCardLabel(task.nama);
    setTouchPos({ x: touch.clientX, y: touch.clientY });
    setTouchActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchActive) return;
    const touch = e.touches[0];
    setTouchPos({ x: touch.clientX, y: touch.clientY });

    // Prevent screen scroll while dragging a card
    if (e.cancelable) e.preventDefault();

    // Find the element at the current touch point
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    // Traverse up to find a column or card
    const colEl = element.closest('.kanban-col') as HTMLElement;
    const cardEl = element.closest('.kanban-card') as HTMLElement;

    if (colEl) {
      const colName = colEl.getAttribute('data-column-name');
      if (colName) setDragOverColumn(colName);
    } else {
      setDragOverColumn(null);
    }

    if (cardEl) {
      const cardIdAttr = cardEl.getAttribute('data-card-id');
      if (cardIdAttr) {
        const id = parseInt(cardIdAttr, 10);
        if (id !== draggedTaskId) setDragOverCardId(id);
      }
    } else {
      setDragOverCardId(null);
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!touchActive || !draggedTaskId) return;

    setTouchActive(false);
    const prevDraggedId = draggedTaskId;
    setDraggedTaskId(null);

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    setDragOverColumn(null);
    setDragOverCardId(null);

    if (!element) return;

    const colEl = element.closest('.kanban-col') as HTMLElement;
    const cardEl = element.closest('.kanban-card') as HTMLElement;

    const taskToUpdate = tasks.find(t => t.id === prevDraggedId);
    if (!taskToUpdate) return;

    // Determine target status and card
    let targetStatus = '';
    let targetCardId: number | null = null;

    if (colEl) {
      targetStatus = colEl.getAttribute('data-column-name') || '';
    }
    if (cardEl) {
      const cardIdAttr = cardEl.getAttribute('data-card-id');
      if (cardIdAttr) {
        targetCardId = parseInt(cardIdAttr, 10);
      }
      const cardColEl = cardEl.closest('.kanban-col') as HTMLElement;
      if (cardColEl) {
        targetStatus = cardColEl.getAttribute('data-column-name') || '';
      }
    }

    if (!targetStatus) return;

    if (targetStatus === taskToUpdate.status && !targetCardId) return;
    if (targetCardId === prevDraggedId) return;

    const fakeDragEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      dataTransfer: {
        getData: (format: string) => format === 'text/plain' ? prevDraggedId.toString() : ''
      }
    } as any;

    if (targetCardId) {
      await handleDropCard(fakeDragEvent, targetStatus, targetCardId);
    } else {
      await handleDropColumn(fakeDragEvent, targetStatus);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pekerjaan ini?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Pekerjaan berhasil dihapus');
      setIsDetailOpen(false);
      setSelectedTask(null);
      setTasks(prev => prev.filter(t => t.id !== id));
      startTransition(() => {
        router.refresh();
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
      });
    } catch (e) {
      toast.error('Gagal menghapus pekerjaan');
    }
  };

  const saveReorder = async (updatedColumnTasks: any[]) => {
    // Generate order indexes: 0, 1, 2...
    const updates = updatedColumnTasks.map((t, idx) => ({ id: t.id, orderIndex: idx }));
    try {
      await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      startTransition(() => {
        router.refresh();
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
      });
    } catch (e) {
      console.error('Failed to save reorder', e);
    }
  };

  const handleDropColumn = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDragOverCardId(null);


    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = parseInt(taskIdStr, 10);

    if (!taskId || isNaN(taskId)) return;

    const taskToUpdate = tasks.find((t: any) => t.id === taskId);
    if (!taskToUpdate) return;

    const previousTasks = [...tasks];
    let updatedTasks = [...tasks];

    updatedTasks = updatedTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);

    try {
      if (taskToUpdate.status !== newStatus) {
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        toast.success(`Tugas dipindah ke ${newStatus}`);
      }

      const colTasks = updatedTasks.filter(t => t.status === newStatus).sort((a, b) => {
        if (a.orderIndex === b.orderIndex) return b.id - a.id;
        return (a.orderIndex || 0) - (b.orderIndex || 0);
      });
      const taskInCol = colTasks.find(t => t.id === taskId);
      const otherTasksInCol = colTasks.filter(t => t.id !== taskId);
      const finalColTasks = [taskInCol, ...otherTasksInCol]; // Prepend to top

      setTasks(prev => prev.map(t => {
        const idx = finalColTasks.findIndex(ft => ft.id === t.id);
        return idx !== -1 ? { ...t, orderIndex: idx, status: t.id === taskId ? newStatus : t.status } : t;
      }));

      saveReorder(finalColTasks);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui status');
      setTasks(previousTasks);
    }
    setDraggedTaskId(null);
  };

  const handleMoveUp = async (status: string, taskId: number) => {
    let colTasks = tasks.filter(t => t.status === status).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const idx = colTasks.findIndex(t => t.id === taskId);
    if (idx > 0) {
      const temp = colTasks[idx];
      colTasks[idx] = colTasks[idx - 1];
      colTasks[idx - 1] = temp;
      const updated = colTasks.map((t, i) => ({ ...t, orderIndex: i }));
      const newTasks = tasks.map(t => updated.find(u => u.id === t.id) || t);
      setTasks(newTasks);
      saveReorder(updated);
    }
  };

  const handleMoveDown = async (status: string, taskId: number) => {
    let colTasks = tasks.filter(t => t.status === status).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const idx = colTasks.findIndex(t => t.id === taskId);
    if (idx !== -1 && idx < colTasks.length - 1) {
      const temp = colTasks[idx];
      colTasks[idx] = colTasks[idx + 1];
      colTasks[idx + 1] = temp;
      const updated = colTasks.map((t, i) => ({ ...t, orderIndex: i }));
      const newTasks = tasks.map(t => updated.find(u => u.id === t.id) || t);
      setTasks(newTasks);
      saveReorder(updated);
    }
  };

  const handleDropCard = async (e: React.DragEvent, newStatus: string, targetCardId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    setDragOverCardId(null);



    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = parseInt(taskIdStr, 10);

    if (!taskId || isNaN(taskId) || taskId === targetCardId) return;

    const taskToUpdate = tasks.find((t: any) => t.id === taskId);
    if (!taskToUpdate) return;

    const previousTasks = [...tasks];
    let updatedTasks = [...tasks].map(t => t.id === taskId ? { ...t, status: newStatus } : t);

    let colTasks = updatedTasks.filter(t => t.status === newStatus).sort((a, b) => {
      if (a.orderIndex === b.orderIndex) return b.id - a.id;
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });

    const draggedTask = colTasks.find(t => t.id === taskId);
    colTasks = colTasks.filter(t => t.id !== taskId);

    const targetIndex = colTasks.findIndex(t => t.id === targetCardId);
    if (targetIndex !== -1) {
      colTasks.splice(targetIndex, 0, draggedTask);
    } else {
      colTasks.unshift(draggedTask); // Prepend to top
    }

    setTasks(prev => prev.map(t => {
      const idx = colTasks.findIndex(ft => ft.id === t.id);
      return idx !== -1 ? { ...t, orderIndex: idx, status: t.id === taskId ? newStatus : t.status } : t;
    }));

    try {
      if (taskToUpdate.status !== newStatus) {
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        toast.success(`Tugas dipindah ke ${newStatus}`);
      }
      saveReorder(colTasks);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui urutan');
      setTasks(previousTasks);
    }
    setDraggedTaskId(null);
  };

  const openTaskDetail = (task: any) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const openTaskEdit = (task: any) => {
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

    let parsedSubTasks: any[] = [];
    if (task.subTasksJson) {
      try { parsedSubTasks = JSON.parse(task.subTasksJson); } catch (e) { }
    }

    let parsedFiles: any[] = [];
    if (task.filesJson) {
      try { parsedFiles = JSON.parse(task.filesJson); } catch (e) { }
    } else if (task.fileUrl) {
      parsedFiles = [{ url: task.fileUrl, name: task.fileName || 'Attachment' }];
    }

    let parsedPics: string[] = [];
    if (task.additionalPics) {
      try { parsedPics = JSON.parse(task.additionalPics); } catch (e) { }
    }

    setSelectedTask({
      ...task,
      repetisi: repetisiValue,
      customRecurrenceSettings,
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      isCustomCategory: false,
      isCustomPic: false,
      filesList: parsedFiles,
      additionalPicsList: parsedPics,
      subTasksList: parsedSubTasks
    });

    setIsDetailOpen(false);
    setIsEditOpen(true);
  };

  const openTaskDuplicate = (task: any) => {
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

    let parsedSubTasks: any[] = [];
    if (task.subTasksJson) {
      try {
        const raw = typeof task.subTasksJson === 'string' ? JSON.parse(task.subTasksJson) : task.subTasksJson;
        if (Array.isArray(raw)) {
          parsedSubTasks = raw.map((st: any) => ({
            ...st,
            id: Math.random().toString(36).substring(2, 9),
          }));
        }
      } catch (e) { }
    }

    let parsedFiles: any[] = [];
    if (task.filesJson) {
      try { parsedFiles = JSON.parse(task.filesJson); } catch (e) { }
    } else if (task.fileUrl) {
      parsedFiles = [{ url: task.fileUrl, name: task.fileName || 'Attachment' }];
    }

    let parsedPics: string[] = [];
    if (task.additionalPics) {
      try { parsedPics = JSON.parse(task.additionalPics); } catch (e) { }
    }

    const startStr = task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const endStr = task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    setSelectedTask({
      nama: task.nama,
      pic: task.pic,
      status: task.status,
      prioritas: task.prioritas || 'Medium',
      kategori: task.kategori || 'Umum',
      progress: task.progress || 0,
      deskripsi: task.deskripsi || '',
      catatan: task.catatan || '',
      lokasi: task.lokasi,
      filesList: parsedFiles,
      additionalPicsList: parsedPics,
      subTasksList: parsedSubTasks,
      isAllDay: task.isAllDay !== undefined ? Boolean(task.isAllDay) : false,
      startTime: task.startTime || '',
      endTime: task.endTime || '',
      repetisi: repetisiValue,
      customRecurrenceSettings,
      startDate: startStr,
      endDate: endStr,
      isCustomCategory: false,
      isCustomPic: false,
    });
    setIsDetailOpen(false);
    setIsEditOpen(true);
    toast.success('Pekerjaan berhasil diduplikasi. Silakan edit dan klik Simpan.');
  };

  const filteredTasks = tasks.filter((t: any) => {
    let matchSearch = checkSearchMatch(t, searchQuery, globalSearchExactMatch);

    const matchCategory = filterCategory === 'All' || (t.kategori || 'Umum') === filterCategory;

    const matchPic = globalPicFilter === 'Semua PIC' || t.pic === globalPicFilter || (
      t.additionalPics ? (() => {
        try {
          const arr = JSON.parse(t.additionalPics);
          return Array.isArray(arr) && arr.includes(globalPicFilter);
        } catch (e) { return false; }
      })() : false
    );

    const taskEnd = new Date(t.endDate).getTime();
    const taskStart = new Date(t.startDate).getTime();
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

    let matchDate = false;
    if (globalTargetFilter === 'Semua Waktu' || (globalTargetFilter === 'Custom' && (!globalCustomStartDate || !globalCustomEndDate))) {
      matchDate = true;
    } else {
      if (taskEnd >= startBoundary && taskEnd <= endBoundary) {
        matchDate = true;
      }
    }

    const matchStatus = globalFilterStatus === 'All' || t.status === globalFilterStatus;
    const matchPriority = globalFilterPriority === 'All' || (t.prioritas || 'Medium') === globalFilterPriority;

    return matchSearch && matchCategory && matchPic && matchDate && matchStatus && matchPriority;
  }).sort((a, b) => {
    if (a.orderIndex === b.orderIndex) return b.id - a.id;
    return (a.orderIndex || 0) - (b.orderIndex || 0);
  });

  const handleExportExcel = async () => {
    toast.loading('Mengekspor Board Pekerjaan...', { id: 'export-excel-board' });
    try {
      const success = await exportToRichExcel(
        filteredTasks,
        {
          pics: formPicOptions,
          categories: formCategoryOptions,
          locations: [], // BoardClient doesn't fetch masterLocations currently
          priorities: masterPriorities,
          statuses: masterStatuses
        },
        `Board_Pekerjaan_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        false
      );
      if (success) {
        toast.success('Pekerjaan berhasil diekspor', { id: 'export-excel-board' });
      } else {
        toast.error('Gagal mengekspor Excel', { id: 'export-excel-board' });
      }
    } catch (error) {
      console.error('Excel Export error:', error);
      toast.error('Gagal mengekspor Excel', { id: 'export-excel-board' });
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPdf(true);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('kanban-board-container');
      if (!element) {
        setIsExportingPdf(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('kanban-board-container');
          if (clonedElement) {
            clonedElement.style.setProperty('width', '1600px', 'important');
            clonedElement.style.setProperty('height', 'auto', 'important');
            clonedElement.style.setProperty('overflow', 'visible', 'important');
            clonedElement.style.setProperty('display', 'grid', 'important');
            clonedElement.style.setProperty('grid-template-columns', 'repeat(4, 1fr)', 'important');
            clonedElement.style.setProperty('gap', '16px', 'important');
            clonedElement.style.setProperty('min-height', '0', 'important');
            clonedElement.style.setProperty('flex', 'none', 'important');

            const cols = clonedElement.querySelectorAll('.kanban-col');
            cols.forEach((col: any) => {
              col.style.setProperty('height', 'auto', 'important');
              col.style.setProperty('max-height', 'none', 'important');
              col.style.setProperty('overflow', 'visible', 'important');
              col.style.setProperty('display', 'flex', 'important');
              col.style.setProperty('flex-direction', 'column', 'important');
            });

            const cardsContainers = clonedElement.querySelectorAll('.kanban-col-cards');
            cardsContainers.forEach((container: any) => {
              container.style.setProperty('height', 'auto', 'important');
              container.style.setProperty('max-height', 'none', 'important');
              container.style.setProperty('overflow', 'visible', 'important');
            });

            // Resolve color-mix parsing crash
            const badges = clonedElement.querySelectorAll('.badge, [class*="badge"], [style*="color-mix"]');
            badges.forEach((badge: any) => {
              const bg = badge.style.backgroundColor;
              if (bg && bg.includes('color-mix')) {
                const colorVal = badge.style.color;
                if (colorVal && colorVal.startsWith('#')) {
                  badge.style.backgroundColor = `${colorVal.substring(0, 7)}26`;
                } else {
                  badge.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                }
              }
            });
          }
        }
      });

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: canvasWidth > canvasHeight ? 'l' : 'p',
        unit: 'px',
        format: [canvasWidth, canvasHeight]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight);
      
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `Board_Pekerjaan_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(pdfUrl);
      
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
      const element = document.getElementById('kanban-board-container');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('kanban-board-container');
          if (clonedElement) {
            clonedElement.style.setProperty('width', '1600px', 'important');
            clonedElement.style.setProperty('height', 'auto', 'important');
            clonedElement.style.setProperty('overflow', 'visible', 'important');
            clonedElement.style.setProperty('display', 'grid', 'important');
            clonedElement.style.setProperty('grid-template-columns', 'repeat(4, 1fr)', 'important');
            clonedElement.style.setProperty('gap', '16px', 'important');
            clonedElement.style.setProperty('min-height', '0', 'important');
            clonedElement.style.setProperty('flex', 'none', 'important');

            const cols = clonedElement.querySelectorAll('.kanban-col');
            cols.forEach((col: any) => {
              col.style.setProperty('height', 'auto', 'important');
              col.style.setProperty('max-height', 'none', 'important');
              col.style.setProperty('overflow', 'visible', 'important');
              col.style.setProperty('display', 'flex', 'important');
              col.style.setProperty('flex-direction', 'column', 'important');
            });

            const cardsContainers = clonedElement.querySelectorAll('.kanban-col-cards');
            cardsContainers.forEach((container: any) => {
              container.style.setProperty('height', 'auto', 'important');
              container.style.setProperty('max-height', 'none', 'important');
              container.style.setProperty('overflow', 'visible', 'important');
            });

            // Resolve color-mix parsing crash
            const badges = clonedElement.querySelectorAll('.badge, [class*="badge"], [style*="color-mix"]');
            badges.forEach((badge: any) => {
              const bg = badge.style.backgroundColor;
              if (bg && bg.includes('color-mix')) {
                const colorVal = badge.style.color;
                if (colorVal && colorVal.startsWith('#')) {
                  badge.style.backgroundColor = `${colorVal.substring(0, 7)}26`;
                } else {
                  badge.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                }
              }
            });
          }
        }
      });

      const blobPromise = new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob returned null'));
        }, 'image/png');
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blobPromise })
      ]);
      toast.success('Gambar board disalin ke clipboard');
    } catch (err) {
      console.error('Copy Image error:', err);
      toast.error('Gagal menyalin gambar');
    }
  };

  const getSubtaskStats = (subTasksJson: string | null) => {
    if (!subTasksJson) return null;
    try {
      const subtasks = JSON.parse(subTasksJson);
      if (!Array.isArray(subtasks) || subtasks.length === 0) return null;
      const finalStatusStr = masterStatuses.length > 0 ? masterStatuses[masterStatuses.length - 1] : 'Done';
      const doneCount = subtasks.filter((s: any) => s.status === finalStatusStr).length;
      return { total: subtasks.length, done: doneCount };
    } catch {
      return null;
    }
  };

  const getPriorityWeight = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 4;
      case 'High': return 3;
      case 'Medium': return 2;
      case 'Low': return 1;
      default: return 0;
    }
  };

  if (session && !hasPermission(roleConfig, 'view_dashboard', userRole)) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p style={{ fontSize: '14px' }}>Mengarahkan ke Daftar Pekerjaan...</p>
      </div>
    );
  }

  return (
    <div className="board-container" style={{ position: 'relative' }}>
      {isPending && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 50, display: 'flex',
          alignItems: 'center', justifyContent: 'center', borderRadius: '12px'
        }}>
          <div style={{
            padding: '12px 24px', backgroundColor: 'var(--surface-color)',
            borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: '8px',
            color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600
          }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
            Menyinkronkan data...
          </div>
        </div>
      )}
      <UniversalFilterBar
        categories={formCategoryOptions}
        pics={formPicOptions}
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
          tasks={filteredTasks}
          canExport={hasPermission(roleConfig, 'export_data', userRole)}
        />
      </UniversalFilterBar>

      {filteredTasks.length === 0 ? (
        <div className="glass" style={{ padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <EmptyState />
        </div>
      ) : (
        <div id="kanban-board-container" className="kanban-board-wrapper">
        {(masterStatuses.length > 0 ? masterStatuses : ['To Do', 'In Progress', 'Review', 'Done']).map((col) => {
          let columnTasks = filteredTasks.filter((t: any) => t.status === col);
          const sortType = colSorts[col] || 'default';

          if (sortType === 'endDate') {
            columnTasks.sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
          } else if (sortType === 'priority') {
            columnTasks.sort((a: any, b: any) => getPriorityWeight(b.prioritas || 'Medium') - getPriorityWeight(a.prioritas || 'Medium'));
          } else if (sortType === 'nama') {
            columnTasks.sort((a: any, b: any) => a.nama.localeCompare(b.nama));
          }

          const isDragOverCol = dragOverColumn === col;

          return (
            <div
              key={col}
              className="kanban-col glass"
              data-column-name={col}
              onDragOver={(e) => handleDragOverColumn(e, col)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropColumn(e, col)}
              style={{
                backgroundColor: isDragOverCol ? 'var(--surface-hover)' : 'var(--input-bg)',
                border: isDragOverCol ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexDirection: 'row', minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    margin: '0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {col}
                  </h3>
                  <span style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    {columnTasks.length}
                  </span>
                </div>

                <select
                  className="input"
                  style={{ padding: '2px 4px', fontSize: '11px', width: 'auto', minWidth: '70px', borderRadius: '4px', backgroundColor: 'var(--background)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  value={colSorts[col] || 'default'}
                  onChange={(e) => setColSorts({ ...colSorts, [col]: e.target.value })}
                  title="Urutkan"
                >
                  <option value="default">Urutan Default</option>
                  <option value="endDate">Tenggat Waktu</option>
                  <option value="priority">Prioritas</option>
                  <option value="nama">Nama A-Z</option>
                </select>

              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '60px', overflowY: 'auto', paddingRight: '4px' }} className="kanban-cards-container">
                {columnTasks.map((task: any) => {
                  const subStats = getSubtaskStats(task.subTasksJson);
                  const isDragged = draggedTaskId === task.id;
                  const isDragOverThisCard = dragOverCardId === task.id;
                  const isOwnTask = (task: any) => {
                    if (hasPermission(roleConfig, 'manage_task', userRole)) return true;
                    if (!session?.user?.name) return false;
                    if (task.pic === session.user.name) return true;
                    try {
                      const extra = JSON.parse(task.additionalPics || '[]');
                      if (Array.isArray(extra) && extra.includes(session.user.name)) return true;
                    } catch (e) { }
                    return false;
                  };

                  const canDrag = hasPermission(roleConfig, 'manage_task', userRole) && isOwnTask(task);

                  return (
                    <div
                      key={task.id}
                      className="kanban-card"
                      data-card-id={task.id}
                      draggable={canDrag}
                      onDragStart={(e) => {
                        if (!canDrag) {
                          e.preventDefault();
                          return;
                        }
                        handleDragStart(e, task.id);
                      }}
                      onDragOver={(e) => handleDragOverCard(e, task.id)}
                      onDrop={(e) => handleDropCard(e, col, task.id)}
                      onTouchStart={(e) => {
                        if (!canDrag) return;
                        handleTouchStart(e, task);
                      }}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onClick={() => hasPermission(roleConfig, 'view_detail', userRole) ? openTaskDetail(task) : toast.error('Akses ditolak: Anda tidak memiliki izin untuk melihat detail.')}
                      style={{
                        backgroundColor: 'var(--surface-color)',
                        padding: '8px',
                        borderRadius: '8px',
                        border: isDragOverThisCard ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
                        cursor: canDrag ? 'grab' : 'pointer',
                        opacity: isDragged ? 0.5 : 1,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'transform 0.1s',
                        marginTop: isDragOverThisCard ? '20px' : '0px'
                      }}
                      onDragEnd={() => setDraggedTaskId(null)}
                    >
                      {/* Card Content Top */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {canDrag && (
                            <div className="kanban-sort-arrows" style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginRight: '2px' }}>
                              <ChevronUp
                                size={12}
                                color="var(--text-secondary)"
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveUp(col, task.id);
                                }}
                              />
                              <ChevronDown
                                size={12}
                                color="var(--text-secondary)"
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveDown(col, task.id);
                                }}
                              />
                            </div>
                          )}
                          {(() => {
                            const badge = getDynamicBadgeStyle('priority', task.prioritas || 'Medium', task.prioritas === 'Urgent' ? 'badge badge-urgent' : task.prioritas === 'High' ? 'badge badge-high' : task.prioritas === 'Low' ? 'badge badge-low' : 'badge badge-medium', masterColors);
                            return (
                              <span className={badge.className} style={{ fontSize: '10px', padding: '2px 6px', ...badge.style }}>
                                {task.prioritas || 'Medium'}
                              </span>
                            );
                          })()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          {(() => {
                            const isOverdue = task.status !== 'Done' && new Date(task.endDate).setHours(23, 59, 59, 999) < new Date().getTime();
                            return (
                              <span style={{ fontSize: '10px', color: isOverdue ? 'var(--danger, #ef4444)' : 'var(--text-secondary)', whiteSpace: 'nowrap', fontWeight: isOverdue ? '600' : 'normal' }}>
                                {new Date(task.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            );
                          })()}
                          {!task.isAllDay && (task.startTime || task.endTime) && (
                            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                              {task.startTime ? `${task.startTime} - ` : ''}{task.endTime || ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {task.nama}
                      </h4>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>

                          {/* Subtasks Count */}
                          {subStats && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: subStats.done === subStats.total ? 'var(--success)' : 'inherit' }} title="Sub-Tugas">
                              <CheckSquare size={14} /> {subStats.done}/{subStats.total}
                            </div>
                          )}

                          {/* Files Count */}
                          {getTaskFiles(task).length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }} title={`${getTaskFiles(task).length} File Lampiran`}>
                              <Paperclip size={14} /> {getTaskFiles(task).length}
                            </div>
                          )}

                          {/* Comments Count Indicator */}
                          {getTaskComments(task).length > 0 && (
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                              title={`${getTaskComments(task).length} Komentar`}
                            >
                              <MessageSquare size={14} />
                              <span style={{ fontSize: '11px', fontWeight: 600 }}>{getTaskComments(task).length}</span>
                            </div>
                          )}

                          {/* Activity Timeline Count */}
                          {getHistoryLogs(task).length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }} title={`${getHistoryLogs(task).length} Riwayat Aktivitas`}>
                              <History size={14} /> {getHistoryLogs(task).length}
                            </div>
                          )}

                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {(() => {
                            let addPics: string[] = [];
                            if (task.additionalPics) {
                              try {
                                addPics = JSON.parse(task.additionalPics);
                              } catch (e) { }
                            }
                            const allPics = [task.pic, ...addPics].filter(Boolean);
                            const displayPics = allPics.slice(0, 3);
                            const extraCount = allPics.length - 3;

                            return (
                              <>
                                {displayPics.map((p, i) => (
                                  <div key={i} style={{
                                    marginLeft: i > 0 ? '-8px' : '0',
                                    border: '2px solid var(--surface-color)',
                                    borderRadius: '50%',
                                    zIndex: displayPics.length - i,
                                    position: 'relative'
                                  }} title={p}>
                                    <Avatar
                                      name={p}
                                      src={masterPicAvatars?.[p]}
                                      size={24}
                                      masterColors={masterColors}
                                    />
                                  </div>
                                ))}
                                {extraCount > 0 && (
                                  <div style={{
                                    marginLeft: '-8px',
                                    border: '2px solid var(--surface-color)',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'var(--bg-hover)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    zIndex: 0,
                                    position: 'relative'
                                  }} title={`${extraCount} PIC lainnya`}>
                                    +{extraCount}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Tarik tugas ke sini
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {isDetailOpen && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setIsDetailOpen(false)}
          onDuplicate={() => openTaskDuplicate(selectedTask)}
          onEdit={() => openTaskEdit(selectedTask)}
          onDelete={() => handleDeleteTask(selectedTask.id)}
          setPreviewFile={setPreviewFile}
        />
      )}

      {isEditOpen && selectedTask && (
        <TaskAddEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          taskToEdit={selectedTask}
          onSave={async (payload: any) => {
            const isNew = !selectedTask.id;
            const toastId = toast.loading(isNew ? 'Menyimpan data baru...' : 'Memperbarui data...');
            try {
              const url = isNew ? '/api/tasks' : `/api/tasks/${selectedTask.id}`;
              const method = isNew ? 'POST' : 'PUT';
              const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              if (!res.ok) throw new Error('Failed to save task');
              setIsEditOpen(false);
              toast.success(isNew ? 'Pekerjaan berhasil dibuat' : 'Berhasil diperbarui', { id: toastId });
              startTransition(() => {
                router.refresh();
                if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
              });
            } catch (err) {
              toast.error('Gagal menyimpan', { id: toastId });
            }
          }}
          formPicOptions={formPicOptions}
          formCategoryOptions={formCategoryOptions}
          formStatusOptions={masterStatuses}
          formPriorityOptions={masterPriorities}
          setPreviewFile={setPreviewFile}
        />
      )}

      <FilePreviewModal previewFile={previewFile} setPreviewFile={setPreviewFile} />

      {/* Floating touch ghost card for mobile drag-and-drop */}
      {touchActive && (
        <div
          style={{
            position: 'fixed',
            left: `${touchPos.x - touchOffset.current.x}px`,
            top: `${touchPos.y - touchOffset.current.y}px`,
            width: '240px',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: 'var(--surface-color)',
            border: '2px solid var(--accent-primary)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
            zIndex: 99999,
            pointerEvents: 'none',
            opacity: 0.9,
            transform: 'scale(1.05)',
            transition: 'transform 0.05s ease-out'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {touchCardLabel}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 600 }}>Menggeser...</span>
        </div>
      )}
    </div>
  );
}

function ListTodoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14h6" />
      <path d="M14 19h6" />
      <path d="M14 9h6" />
      <path d="M4 14h.01" />
      <path d="M4 19h.01" />
      <path d="M4 9h.01" />
      <path d="M8 14h.01" />
      <path d="M8 19h.01" />
      <path d="M8 9h.01" />
    </svg>
  );
}