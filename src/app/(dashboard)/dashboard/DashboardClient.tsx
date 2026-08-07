'use client';
import toast from 'react-hot-toast';

import { useState, useEffect, useRef } from 'react';

import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Pie, Line } from 'react-chartjs-2';
import { Download, FileText, Filter, AlertTriangle, CheckCircle, Clock, ListTodo, User, Paperclip, Calendar, ArrowRight, Search, ArrowUpDown, Copy, X } from 'lucide-react';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, startOfWeek, endOfWeek, parseISO, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { getTaskLocationString, getDynamicBadgeStyle, getTaskExportRow, getLocalTimezone, getTaskFiles, getAdditionalPics, SubTask, Task } from '@/utils/taskUtils';
import { exportToRichExcel } from '@/utils/excelExport';
import { picAvatarXAxisPlugin, getPicAvatarXAxisConfig } from '@/utils/chartAvatarPlugin';
import { useTheme } from '@/context/ThemeContext';
import Avatar from '@/components/Avatar';
import FilePreviewModal from '@/components/FilePreviewModal';
import TaskDetailModal from '@/components/TaskDetailModal';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import FileViewer from '@/components/FileViewer';
import UniversalFilterBar from '@/components/UniversalFilterBar';
import UniversalActionBar from '@/components/UniversalActionBar';
import { useFilter } from '@/context/FilterContext';
import { useNotifications } from '@/context/NotificationContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);



export default function DashboardClient({ tasks }: { tasks: Task[] }) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'MEMBER';
  const { theme } = useTheme();
  const { addActivityLog } = useNotifications();
  const { 
    globalTargetFilter, setGlobalTargetFilter, 
    globalPicFilter, setGlobalPicFilter, 
    globalCustomStartDate, setGlobalCustomStartDate, 
    globalCustomEndDate, setGlobalCustomEndDate,
    globalFilterStatus, setGlobalFilterStatus, 
    globalFilterPriority, setGlobalFilterPriority, 
    globalFilterCategory, setGlobalFilterCategory, 
    globalSearchQuery
  } = useFilter();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<'endDate' | 'nama' | 'pic' | 'kategori' | 'status'>('endDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAllActiveTasks, setShowAllActiveTasks] = useState(false);
  
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [masterPics, setMasterPics] = useState<string[]>([]);
  const [masterCategories, setMasterCategories] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>([]);
  const [masterPriorities, setMasterPriorities] = useState<string[]>([]);
  const [masterColors, setMasterColors] = useState<Record<string, string>>({});
  const [masterPicAvatars, setMasterPicAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadMasterData = () => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.master_pics) {
            setMasterPics(data.master_pics);
          }
          if (data.master_categories) {
            setMasterCategories(data.master_categories);
          }
          if (data.master_statuses) {
            setMasterStatuses(data.master_statuses);
          }
          if (data.master_priorities) {
            setMasterPriorities(data.master_priorities);
          }
          if (data.master_colors) {
            setMasterColors(data.master_colors);
          }
          if (data.master_pic_avatars) {
            setMasterPicAvatars(data.master_pic_avatars);
          }
        })
        .catch(e => console.error(e));
    };
    loadMasterData();
    window.addEventListener('tasksUpdated', loadMasterData);
    return () => window.removeEventListener('tasksUpdated', loadMasterData);
  }, []);

  const handleOpenEditModal = (task: any) => {
    let parsedSubTasks: SubTask[] = [];
    if (task.subTasksJson) {
      try {
        parsedSubTasks = JSON.parse(task.subTasksJson);
      } catch (e) {}
    }
    
    let repetisiValue = task.repetisi || 'Tidak Berulang';
    if (task.isRepetitive && !task.repetisi) repetisiValue = 'Harian';

    setEditingTask({
      ...task,
      filesList: getTaskFiles(task),
      additionalPicsList: getAdditionalPics(task),
      subTasksList: parsedSubTasks,
      isAllDay: task.isAllDay !== undefined ? Boolean(task.isAllDay) : false,
      startTime: task.startTime || '',
      endTime: task.endTime || '',
      repetisi: repetisiValue,
      startDate: typeof task.startDate === 'string' ? task.startDate.split('T')[0] : new Date(task.startDate).toISOString().split('T')[0],
      endDate: typeof task.endDate === 'string' ? task.endDate.split('T')[0] : new Date(task.endDate).toISOString().split('T')[0],
      isCustomCategory: false,
      isCustomPic: false,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveModal = async (payloadData: any) => {
    setIsSaving(true);
    try {
      const url = `/api/tasks/${payloadData.id}`;
      const method = 'PUT';

      const filteredExtraPics = payloadData.additionalPicsList ? payloadData.additionalPicsList.filter(Boolean) : [];
      const filesListToSave = payloadData.filesList && payloadData.filesList.length > 0 
        ? payloadData.filesList 
        : (payloadData.fileUrl ? [{ url: payloadData.fileUrl, name: payloadData.fileName || 'File Lampiran' }] : []);

      let processedSubTasks = payloadData.subTasksList ? [...payloadData.subTasksList] : [];
      
      // Auto-update task progress if subtasks exist
      let taskProgress = payloadData.progress || 0;
      if (processedSubTasks.length > 0) {
        const completed = processedSubTasks.filter((st: any) => st.status === 'Done').length;
        taskProgress = Math.round((completed / processedSubTasks.length) * 100);
      } else {
        if (payloadData.status === 'Done') taskProgress = 100;
        else if (payloadData.status === 'To Do') taskProgress = 0;
      }

      let historyLogs = [];
      const originalTask = tasks.find(t => t.id === payloadData.id);
      if (originalTask) {
        if (originalTask.historyLogsJson) {
           try { historyLogs = JSON.parse(originalTask.historyLogsJson); } catch(e){}
        }
        historyLogs.push({
           action: 'Pekerjaan diubah melalui Edit Modal dari Dashboard',
           details: 'Data pekerjaan diperbarui',
           timestamp: new Date().toISOString()
        });
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payloadData,
          progress: taskProgress,
          filesJson: JSON.stringify(filesListToSave),
          additionalPics: JSON.stringify(filteredExtraPics),
          subTasksJson: JSON.stringify(processedSubTasks),
          historyLogsJson: JSON.stringify(historyLogs)
        })
      });

      if (!res.ok) throw new Error('Gagal menyimpan pekerjaan');
      
      toast.success('Pekerjaan berhasil diperbarui!');
      if (addActivityLog) {
         addActivityLog('EDIT_TASK', 'Pekerjaan Diubah', `Pekerjaan "${payloadData.nama}" telah diubah dari Dashboard`, 'info');
      }
      
      setIsEditModalOpen(false);
      
      // Trigger update
      router.refresh();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
      
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Array.from(new Set(['All', ...tasks.map(t => t.kategori || 'Umum'), ...masterCategories]));
  const pics = Array.from(new Set(['All', ...tasks.map(t => t.pic), ...masterPics, ...(session?.user?.name ? [session.user.name] : [])]));

  const filteredTasks = tasks.filter(t => {
    // 1. Category Filter
    const matchCat = globalFilterCategory === 'All' || (t.kategori || 'Umum') === globalFilterCategory;
    
    // 2. PIC Filter
    const matchPic = globalPicFilter === 'Semua PIC' || t.pic === globalPicFilter || (
      t.additionalPics ? (() => {
        try {
          const arr = JSON.parse(t.additionalPics);
          return Array.isArray(arr) && arr.includes(globalPicFilter);
        } catch(e) { return false; }
      })() : false
    );
    
    // 3. Status Filter
    const matchStatus = globalFilterStatus === 'All' || t.status === globalFilterStatus;

    // 4. Priority Filter
    const matchPriority = globalFilterPriority === 'All' || (t.prioritas || 'Medium') === globalFilterPriority;

    // 5. Search Filter
    let matchSearch = true;
    if (globalSearchQuery) {
      const query = globalSearchQuery.toLowerCase();
      const extraPics = t.additionalPics ? (() => {
        try { return JSON.parse(t.additionalPics).join(' '); } catch (e) { return ''; }
      })() : '';
      matchSearch = t.nama.toLowerCase().includes(query) ||
        t.pic.toLowerCase().includes(query) ||
        extraPics.toLowerCase().includes(query);
    }

    // 6. Date Filter
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
      matchDate = taskEnd >= startBoundary && taskEnd <= endBoundary;
    }
    
    return matchCat && matchPic && matchStatus && matchPriority && matchSearch && matchDate;
  });

  const total = filteredTasks.length;

  const statusCounts = filteredTasks.reduce((acc, t) => {
    const s = t.status || 'To Do';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgProgress = total > 0 
    ? Math.round(filteredTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / total)
    : 0;

  const textColor = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  // Status Doughnut Data
  const defaultColors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#6366f1'];
  const statusData = {
    labels: masterStatuses.length > 0 ? masterStatuses : Object.keys(statusCounts),
    datasets: [
      {
        data: (masterStatuses.length > 0 ? masterStatuses : Object.keys(statusCounts)).map(s => statusCounts[s] || 0),
        backgroundColor: (masterStatuses.length > 0 ? masterStatuses : Object.keys(statusCounts)).map((s, i) => masterColors['status_' + s] || defaultColors[i % defaultColors.length]),
        borderColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  // PIC Bar Data (Stacked: PIC Utama vs PIC Tambahan)
  const picUtamaCounts: Record<string, number> = {};
  const picTambahanCounts: Record<string, number> = {};
  const allChartPics = new Set<string>();

  filteredTasks.forEach(task => {
    const utama = task.pic;
    if (utama && utama.trim() !== '') {
      const trimmedUtama = utama.trim();
      picUtamaCounts[trimmedUtama] = (picUtamaCounts[trimmedUtama] || 0) + 1;
      allChartPics.add(trimmedUtama);
    }
    
    if (task.additionalPics) {
      try {
        const additional = JSON.parse(task.additionalPics);
        if (Array.isArray(additional)) {
          additional.forEach(apic => {
            if (apic && typeof apic === 'string' && apic.trim() !== '') {
              const trimmed = apic.trim();
              picTambahanCounts[trimmed] = (picTambahanCounts[trimmed] || 0) + 1;
              allChartPics.add(trimmed);
            }
          });
        }
      } catch (e) {}
    }
  });

  const picLabels = Array.from(allChartPics);

  const picData = {
    labels: picLabels,
    datasets: [
      {
        label: 'PIC Utama',
        data: picLabels.map(l => picUtamaCounts[l] || 0),
        backgroundColor: '#3b82f6', // blue
        borderRadius: 4,
      },
      {
        label: 'PIC Tambahan',
        data: picLabels.map(l => picTambahanCounts[l] || 0),
        backgroundColor: '#93c5fd', // light blue
        borderRadius: 4,
      }
    ],
  };

  // Priority Data
  const priorityCounts = filteredTasks.reduce((acc, t) => {
    const p = t.prioritas || 'Medium';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityColors = ['#ef4444', '#f97316', '#3b82f6', '#64748b', '#a855f7', '#10b981'];
  
  const priorityData = {
    labels: masterPriorities.length > 0 ? masterPriorities : Object.keys(priorityCounts),
    datasets: [
      {
        data: (masterPriorities.length > 0 ? masterPriorities : Object.keys(priorityCounts)).map(p => priorityCounts[p] || 0),
        backgroundColor: (masterPriorities.length > 0 ? masterPriorities : Object.keys(priorityCounts)).map((p) => masterColors['priority_' + p] || (p === 'High' ? '#ef4444' : p === 'Medium' ? '#f97316' : p === 'Low' ? '#10b981' : p === 'Urgent' ? '#b91c1c' : '#64748b')),
        borderWidth: 0,
      },
    ],
  };

  // Category Data
  const categoryCounts = filteredTasks.reduce((acc, t) => {
    const c = t.kategori || 'Umum';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        label: 'Jumlah Pekerjaan',
        data: Object.values(categoryCounts),
        backgroundColor: Object.keys(categoryCounts).map(c => masterColors['category_' + c] || '#8b5cf6'),
        borderRadius: 6,
      },
    ],
  };

  // Timeline/Deadline Distribution (Line Chart)
  let timelineLabels: string[] = [];
  let deadlineCounts: number[] = [];
  let timelineDateRanges: {start: Date, end: Date}[] = [];
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (globalTargetFilter === 'Minggu Ini') {
    timelineLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    deadlineCounts = Array(7).fill(0);
    const day = today.getDay();
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(new Date(today).setDate(diffToMonday));
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      timelineDateRanges.push({ start: new Date(d), end: new Date(d.setHours(23, 59, 59, 999)) });
    }
    
    filteredTasks.forEach(t => {
      const d = new Date(t.endDate);
      const diffTime = d.getTime() - monday.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        deadlineCounts[diffDays]++;
      }
    });
  } else if (globalTargetFilter === 'Bulan Ini') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    timelineLabels = Array.from({length: daysInMonth}, (_, i) => String(i + 1));
    deadlineCounts = Array(daysInMonth).fill(0);
    
    for (let i = 0; i < daysInMonth; i++) {
      const dStart = new Date(now.getFullYear(), now.getMonth(), i + 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth(), i + 1, 23, 59, 59, 999);
      timelineDateRanges.push({ start: dStart, end: dEnd });
    }
    
    filteredTasks.forEach(t => {
      const d = new Date(t.endDate);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        deadlineCounts[d.getDate() - 1]++;
      }
    });
  } else if (globalTargetFilter === 'Hari Ini') {
    timelineLabels = Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`);
    deadlineCounts = Array(24).fill(0);
    
    for (let i = 0; i < 24; i++) {
      const hStart = new Date(today);
      hStart.setHours(i, 0, 0, 0);
      const hEnd = new Date(today);
      hEnd.setHours(i, 59, 59, 999);
      timelineDateRanges.push({ start: hStart, end: hEnd });
    }
    
    filteredTasks.forEach(t => {
      const d = new Date(t.endDate);
      if (d.toDateString() === today.toDateString()) {
        let hour = 23; // default to end of day
        if ((t as any).endTime) {
          const parts = ((t as any).endTime as string).split(':');
          const parsedH = parseInt(parts[0], 10);
          if (!isNaN(parsedH) && parsedH >= 0 && parsedH < 24) {
            hour = parsedH;
          }
        }
        deadlineCounts[hour]++;
      }
    });
  } else if (globalTargetFilter === 'Custom' && globalCustomStartDate && globalCustomEndDate) {
    const start = new Date(globalCustomStartDate);
    const end = new Date(globalCustomEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 31) {
      for (let i = 0; i <= diffDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        timelineLabels.push(format(d, 'dd MMM'));
        deadlineCounts.push(0);
        timelineDateRanges.push({ start: new Date(d), end: new Date(new Date(d).setHours(23, 59, 59, 999)) });
      }
      filteredTasks.forEach(t => {
        const d = new Date(t.endDate);
        if (d >= start && d <= new Date(new Date(end).setHours(23, 59, 59, 999))) {
          const idx = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          if (idx >= 0 && idx < deadlineCounts.length) {
            deadlineCounts[idx]++;
          }
        }
      });
    } else {
      let curr = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      const monthMap = new Map<string, number>();
      
      while (curr <= endMonth) {
        const label = format(curr, 'MMM yyyy');
        timelineLabels.push(label);
        monthMap.set(label, timelineLabels.length - 1);
        deadlineCounts.push(0);
        
        const mStart = new Date(curr);
        const mEnd = new Date(curr.getFullYear(), curr.getMonth() + 1, 0, 23, 59, 59, 999);
        timelineDateRanges.push({ start: mStart, end: mEnd });
        
        curr.setMonth(curr.getMonth() + 1);
      }
      
      filteredTasks.forEach(t => {
        const d = new Date(t.endDate);
        if (d >= start && d <= new Date(new Date(end).setHours(23, 59, 59, 999))) {
          const label = format(d, 'MMM yyyy');
          const idx = monthMap.get(label);
          if (idx !== undefined) deadlineCounts[idx]++;
        }
      });
    }
  } else {
    // Semua Waktu
    timelineLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    deadlineCounts = Array(12).fill(0);
    
    for (let i = 0; i < 12; i++) {
      const mStart = new Date(now.getFullYear(), i, 1);
      const mEnd = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59, 999);
      timelineDateRanges.push({ start: mStart, end: mEnd });
    }
    
    filteredTasks.forEach(t => {
      const d = new Date(t.endDate);
      if (d.getFullYear() === now.getFullYear()) {
        deadlineCounts[d.getMonth()]++;
      }
    });
  }

  const timelineData = {
    labels: timelineLabels,
    datasets: [
      {
        label: 'Tenggat Waktu Pekerjaan',
        data: deadlineCounts,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
      x: { ticks: { color: textColor }, grid: { display: false } }
    },
    onHover: (event: any, elements: any[]) => {
      if (event.native && event.native.target) {
        event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const range = timelineDateRanges[index];
        if (range) {
          setGlobalTargetFilter('Custom');
          setGlobalCustomStartDate(format(range.start, 'yyyy-MM-dd'));
          setGlobalCustomEndDate(format(range.end, 'yyyy-MM-dd'));
          router.push('/tasks');
        }
      }
    }
  };

  // Chart Click Handlers for Drill-down
  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { color: textColor } } },
    animation: { duration: 1500, easing: 'easeOutQuart' as const },
    onHover: (event: any, elements: any[]) => {
      if (event.native && event.native.target) {
        event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const statusMap = ['Done', 'In Progress', 'To Do'];
        setGlobalFilterStatus(statusMap[index]);
        router.push(`/tasks`);
      }
    }
  };

  const picOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: true, position: 'top' as const, labels: { color: textColor, boxWidth: 12 } },
      picAvatarXAxis: { avatars: masterPicAvatars, masterColors, size: 28 },
      tooltip: {
        enabled: false,
        external: function (context: any) {
          let tooltipEl = document.getElementById('chartjs-tooltip');
          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.innerHTML = '<table></table>';
            document.body.appendChild(tooltipEl);
          }

          const tooltipModel = context.tooltip;
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
          }

          tooltipEl.classList.remove('above', 'below', 'no-transform');
          if (tooltipModel.yAlign) {
            tooltipEl.classList.add(tooltipModel.yAlign);
          } else {
            tooltipEl.classList.add('no-transform');
          }

          function getBody(bodyItem: any) {
            return bodyItem.lines;
          }

          if (tooltipModel.body) {
            const titleLines = tooltipModel.title || [];
            const bodyLines = tooltipModel.body.map(getBody);
            
            const picName = titleLines[0] || '';
            const avatarSrc = masterPicAvatars?.[picName];
            
            let innerHtml = '<thead>';

            if (avatarSrc) {
               innerHtml += `<tr><th><div style="display:flex; align-items:center; gap: 8px; margin-bottom: 8px;"><img src="${avatarSrc}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;"/> <span>${picName}</span></div></th></tr>`;
            } else {
               const c = masterColors[`pic_${picName}`] || 'var(--accent-primary)';
               innerHtml += `<tr><th><div style="display:flex; align-items:center; gap: 8px; margin-bottom: 8px;"><div style="width: 24px; height: 24px; border-radius: 50%; background: ${c}; color: white; display: flex; align-items:center; justify-content:center; font-size: 10px;">${picName.substring(0,2).toUpperCase()}</div> <span>${picName}</span></div></th></tr>`;
            }
            
            innerHtml += '</thead><tbody>';

            bodyLines.forEach(function (body: any, i: number) {
              const colors = tooltipModel.labelColors[i];
              let style = 'background:' + colors.backgroundColor;
              style += '; border-color:' + colors.borderColor;
              style += '; border-width: 2px';
              const span = '<span style="' + style + '; display:inline-block; width:10px; height:10px; margin-right:6px; border-radius:50%;"></span>';
              innerHtml += '<tr><td style="padding-top:4px;">' + span + body + '</td></tr>';
            });
            innerHtml += '</tbody>';

            let tableRoot = tooltipEl.querySelector('table');
            if (tableRoot) tableRoot.innerHTML = innerHtml;
          }

          const position = context.chart.canvas.getBoundingClientRect();

          tooltipEl.style.opacity = '1';
          tooltipEl.style.position = 'absolute';
          tooltipEl.style.left = position.left + window.scrollX + tooltipModel.caretX + 'px';
          tooltipEl.style.top = position.top + window.scrollY + tooltipModel.caretY + 'px';
          tooltipEl.style.font = tooltipModel.options.bodyFont.string;
          tooltipEl.style.padding = tooltipModel.options.padding + 'px ' + tooltipModel.options.padding + 'px';
          tooltipEl.style.pointerEvents = 'none';
          tooltipEl.style.background = 'var(--surface-color)';
          tooltipEl.style.border = '1px solid var(--border-color)';
          tooltipEl.style.borderRadius = '8px';
          tooltipEl.style.color = 'var(--text-primary)';
          tooltipEl.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          tooltipEl.style.zIndex = '9999';
          tooltipEl.style.transition = 'all 0.1s ease';
          tooltipEl.style.transform = 'translate(-50%, -100%)';
          tooltipEl.style.marginTop = '-8px';
        }
      }
    },
    animation: { duration: 1500, easing: 'easeOutQuart' as const },
    scales: {
      y: { stacked: true, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
      x: { stacked: true, ticks: { display: false }, grid: { display: false }, afterFit(axis: any) { axis.height += 40; } }
    },
    onHover: (event: any, elements: any[]) => {
      if (event.native && event.native.target) {
        event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const selectedPIC = picData.labels[index];
        setGlobalPicFilter(selectedPIC);
        router.push(`/tasks`);
      }
    }
  };

  const priorityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { color: textColor } } },
    animation: { duration: 1500, easing: 'easeOutQuart' as const },
    onHover: (event: any, elements: any[]) => {
      if (event.native && event.native.target) {
        event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const selectedPriority = priorityData.labels[index];
        setGlobalFilterPriority(selectedPriority);
        router.push(`/tasks`);
      }
    }
  };

  const categoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    animation: { duration: 1500, easing: 'easeOutQuart' as const },
    scales: {
      y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
      x: { ticks: { color: textColor, autoSkip: false, maxRotation: 45, minRotation: 45 }, grid: { display: false } }
    },
    onHover: (event: any, elements: any[]) => {
      if (event.native && event.native.target) {
        event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const selectedCat = categoryData.labels[index];
        setGlobalFilterCategory(selectedCat);
        router.push(`/tasks`);
      }
    }
  };

  // Specific PIC Breakdown
  const picTasks = globalPicFilter !== 'Semua PIC' ? tasks.filter(t => t.pic === globalPicFilter || (
    t.additionalPics ? (() => {
      try {
        const arr = JSON.parse(t.additionalPics);
        return Array.isArray(arr) && arr.includes(globalPicFilter);
      } catch(e) { return false; }
    })() : false
  )) : [];
  
  const picStatusCounts = picTasks.reduce((acc, t) => {
    const s = t.status || 'To Do';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

    const handleExportPDF = () => {
    try {
      if (addActivityLog) {
        addActivityLog('EXPORT_PDF', 'Export Laporan', 'Mengekspor laporan Dashboard ke format PDF', 'info');
      }

      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.text('Laporan Eksekutif Pekerjaan', 14, 15);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Dicetak pada: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 22);
      
      // Summary Metrics
      doc.setFontSize(11);
      doc.setTextColor(0);
      const statusText = Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join('   |   ');
      doc.text(`Total Pekerjaan: ${total}   |   ${statusText}   |   Rata-rata Progress: ${avgProgress}%`, 14, 30);

      // Detail Table
      const tableColumn = ["Pekerjaan", "PIC", "Kategori", "Prioritas", "Status", "Progress", "Tenggat Waktu", "Deskripsi"];
      const tableRows: any[] = [];

      filteredTasks.forEach(t => {
        const row = [
          t.nama,
          t.pic,
          t.kategori || 'Umum',
          t.prioritas || 'Medium',
          t.status,
          `${t.progress || 0}%`,
          format(new Date(t.endDate), 'dd MMM yyyy') + (!(t as any).isAllDay && (t as any).endTime ? `, ${(t as any).endTime}` : ''),
          t.deskripsi || '-'
        ];
        tableRows.push(row);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          0: { cellWidth: 40 }, // Pekerjaan
          6: { cellWidth: 25 }, // Tenggat
          7: { cellWidth: 50 }, // Deskripsi
        }
      });

      doc.save(`Dashboard_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('PDF Export error:', error);
    }
  };

  const handleCopyImage = async () => {
    if (!dashboardRef.current) return;
    try {
      if (addActivityLog) {
        addActivityLog('COPY_DASHBOARD', 'Salin Dashboard', 'Menyalin gambar dashboard ke clipboard', 'info');
      }
      const element = dashboardRef.current;
      const width = element.scrollWidth;
      const height = element.scrollHeight;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
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
            import('react-hot-toast').then(({ default: toast }) => toast.success('Dashboard berhasil disalin sebagai gambar!'));
          } catch (err) {
            console.error('Clipboard write error:', err);
            import('react-hot-toast').then(({ default: toast }) => toast.error('Gagal menyalin gambar. Pastikan browser memberikan izin.'));
          }
        }
      });
    } catch (error) {
      console.error('html2canvas error:', error);
      toast.error('Gagal membuat gambar dashboard.');
    }
  };




  const handleExportExcelSummary = async () => {
    toast.loading('Mengekspor Ringkasan...', { id: 'export-excel-dash' });
    try {
      const success = await exportToRichExcel(
        filteredTasks,
        {
          pics: masterPics,
          categories: masterCategories,
          locations: [],
          priorities: masterPriorities,
          statuses: masterStatuses
        },
        `Ringkasan_Pekerjaan_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        false
      );
      if (success) {
        toast.success('Pekerjaan berhasil diekspor', { id: 'export-excel-dash' });
      } else {
        toast.error('Gagal mengekspor Excel', { id: 'export-excel-dash' });
      }
    } catch (error) {
      console.error('Excel Export error:', error);
      toast.error('Gagal mengekspor Excel', { id: 'export-excel-dash' });
    }
  };

  const urgentTasks = filteredTasks.filter(t => (t.prioritas === 'Urgent' || t.prioritas === 'High') && t.status !== 'Done').slice(0, 5);

  const handleSort = (field: 'endDate' | 'nama' | 'pic' | 'kategori' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const dynamicTableTasks = [...filteredTasks]
    .filter(t => t.status !== 'Done')
    .filter(t => {
      if (!tableSearch) return true;
      const term = tableSearch.toLowerCase();
      return t.nama.toLowerCase().includes(term) || t.pic.toLowerCase().includes(term) || (t.kategori || '').toLowerCase().includes(term);
    })
    .sort((a, b) => {
      let aVal: any = a[sortField] || '';
      let bVal: any = b[sortField] || '';
      
      if (sortField === 'endDate') {
        aVal = new Date(a.endDate).getTime();
        bVal = new Date(b.endDate).getTime();
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    })
    .slice(0, 15); // Show up to 15 items in dashboard table

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header Controls */}
      <UniversalFilterBar 
        categories={['Umum', ...categories]} 
        pics={pics} 
        statuses={masterStatuses.length > 0 ? masterStatuses : undefined} 
        priorities={masterPriorities.length > 0 ? masterPriorities : undefined} 
        filteredCount={filteredTasks.length}
        totalCount={tasks.length}
      >
        <UniversalActionBar 
          onExportExcel={handleExportExcelSummary}
          onExportPDF={handleExportPDF}
          isExportingPdf={isExportingPdf}
          onCopyImage={handleCopyImage}
        />
      </UniversalFilterBar>

      {/* Main Report Container for PDF export and image copy */}
      <div id="dashboard-report-container" ref={dashboardRef}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Total Pekerjaan</span>
              <ListTodo size={20} color="var(--accent-primary)" />
            </div>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{total}</p>
          </div>

          {(masterStatuses.length > 0 ? masterStatuses : Object.keys(statusCounts)).map((statusName, idx) => (
            <div key={statusName} className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>{statusName}</span>
                <CheckCircle size={20} color={masterColors['status_' + statusName] || defaultColors[idx % defaultColors.length]} />
              </div>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: masterColors['status_' + statusName] || defaultColors[idx % defaultColors.length] }}>{statusCounts[statusName] || 0}</p>
            </div>
          ))}

          <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Rata-rata Progress</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{avgProgress}%</span>
            </div>
            <div className="progress-container" style={{ marginTop: '16px', height: '10px' }}>
              <div className="progress-bar" style={{ width: `${avgProgress}%`, backgroundColor: 'var(--accent-primary)' }} />
            </div>
          </div>
        </div>

        {/* Selected PIC Detail Widget if PIC selected */}
        {globalPicFilter !== 'Semua PIC' && (
          <div className="glass" style={{ padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', borderLeft: '4px solid var(--accent-primary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--accent-primary)" />
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Analisis PIC: {globalPicFilter}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total:</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{picTasks.length}</span>
              </div>
              {(masterStatuses.length > 0 ? masterStatuses : Object.keys(picStatusCounts)).map(statusName => (
                <div key={statusName} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{statusName}:</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: masterColors['status_' + statusName] || 'var(--text-primary)' }}>{picStatusCounts[statusName] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Grid (Responsive) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div className="glass" style={{ padding: '24px', minHeight: '340px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Status Pekerjaan</h3>
            <div style={{ height: '240px', position: 'relative', width: '100%', margin: '0 auto' }}>
              <Doughnut data={statusData} options={statusOptions} />
            </div>
          </div>

          <div className="glass" style={{ padding: '24px', minHeight: '340px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Grafik Beban Kerja per PIC</h3>
            <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '12px' }}>
              <div style={{ height: '280px', position: 'relative', minWidth: Math.max(100, picLabels.length * 50) + 'px', margin: '0 auto' }}>
                <Bar data={picData} options={picOptions} plugins={[picAvatarXAxisPlugin]} />
              </div>
            </div>
          </div>

          <div className="glass" style={{ padding: '24px', minHeight: '340px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Distribusi Prioritas</h3>
            <div style={{ height: '240px', position: 'relative', width: '100%', margin: '0 auto' }}>
              <Doughnut data={priorityData} options={priorityOptions} />
            </div>
          </div>

          <div className="glass" style={{ padding: '24px', minHeight: '340px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Sebaran Kategori</h3>
            <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '12px' }}>
              <div style={{ height: '240px', position: 'relative', minWidth: Math.max(100, Object.keys(categoryCounts).length * 40) + 'px', margin: '0 auto' }}>
                <Bar data={categoryData} options={categoryOptions} />
              </div>
            </div>
          </div>

          <div className="glass" style={{ padding: '24px', minHeight: '340px', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Tren Tenggat Waktu</h3>
            <div style={{ height: '240px', position: 'relative', width: '100%', margin: '0 auto' }}>
              <Line data={timelineData} options={timelineOptions} />
            </div>
          </div>
        </div>

        {/* Urgent & High Priority Tasks Alert Widget */}
        {urgentTasks.length > 0 && (
          <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <AlertTriangle size={20} color="#ef4444" />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Perhatian: Pekerjaan Prioritas Tinggi</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {urgentTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-color)', borderRadius: '10px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>{t.nama}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>PIC:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Avatar name={t.pic} src={masterPicAvatars?.[t.pic]} size={16} masterColors={masterColors} />
                        <span style={{ fontSize: '11px', fontWeight: '500' }}>{t.pic}</span>
                      </div>
                      {t.additionalPics && (() => {
                        try {
                          const arr = JSON.parse(t.additionalPics);
                          return Array.isArray(arr) && arr.length > 0 ? arr.map((p, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Avatar name={p} src={masterPicAvatars?.[p]} size={16} masterColors={masterColors} />
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p}</span>
                            </div>
                          )) : null;
                        } catch(e) { return null; }
                      })()}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Tenggat: {format(new Date(t.endDate), 'dd MMM yyyy')}
                    </span>
                    {t.deskripsi && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {t.deskripsi.replace(/<[^>]+>/g, '')}
                      </div>
                    )}
                    {t.fileUrl && (
                      <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-primary)', marginLeft: '12px', marginTop: '4px' }}>
                        <Paperclip size={12} /> {t.fileName || 'Lampiran'}
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span {...getDynamicBadgeStyle('priority', t.prioritas || 'Medium', 'badge', masterColors)} style={{ ...getDynamicBadgeStyle('priority', t.prioritas || 'Medium', 'badge', masterColors).style }}>{t.prioritas || 'Medium'}</span>
                    <span {...getDynamicBadgeStyle('status', t.status, 'badge', masterColors)} style={{ ...getDynamicBadgeStyle('status', t.status, 'badge', masterColors).style, fontSize: '13px', fontWeight: 600 }}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Deadline Table Widget */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={20} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Detail Pekerjaan Aktif ({dynamicTableTasks.length})</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-color)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Search size={16} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Cari pekerjaan..." 
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px', width: '200px' }}
              />
            </div>
            <button
              onClick={() => setShowAllActiveTasks(!showAllActiveTasks)}
              style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--accent-primary)', color: showAllActiveTasks ? '#fff' : 'var(--accent-primary)', background: showAllActiveTasks ? 'var(--accent-primary)' : 'transparent', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
            >
              {showAllActiveTasks ? 'Tampilkan Top 10' : 'Tampilkan Semua'}
            </button>
          </div>

          <div style={{ overflowX: 'auto', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
              <thead>
                <tr style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('nama')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Pekerjaan <ArrowUpDown size={14} /></div>
                  </th>
                  <th style={{ padding: '16px', fontWeight: 600, whiteSpace: 'nowrap' }}>Deskripsi</th>
                  <th style={{ padding: '16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('pic')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>PIC <ArrowUpDown size={14} /></div>
                  </th>
                  <th style={{ padding: '16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('kategori')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Kategori <ArrowUpDown size={14} /></div>
                  </th>
                  <th style={{ padding: '16px', fontWeight: 600, whiteSpace: 'nowrap' }}>Prioritas</th>
                  <th style={{ padding: '16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('status')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Status & Progress <ArrowUpDown size={14} /></div>
                  </th>
                  <th style={{ padding: '16px', fontWeight: 600, whiteSpace: 'nowrap' }}>Lokasi</th>
                  <th style={{ padding: '16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('endDate')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Tenggat Waktu <ArrowUpDown size={14} /></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(showAllActiveTasks ? dynamicTableTasks : dynamicTableTasks.slice(0, 10)).length > 0 ? (showAllActiveTasks ? dynamicTableTasks : dynamicTableTasks.slice(0, 10)).map(t => {
                  const isOverdue = startOfDay(new Date(t.endDate)).getTime() < startOfDay(new Date()).getTime();
                  return (
                    <tr key={t.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', cursor: 'pointer' }} onClick={() => {
                      setSelectedTaskForDetail(t);
                    }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)', verticalAlign: 'top' }}>
                        {t.nama}
                        {t.fileUrl && (
                          <div style={{ marginTop: '8px', fontSize: '12px' }}>
                            <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                              <Paperclip size={12} /> {t.fileName || 'Lampiran'}
                            </a>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', verticalAlign: 'top', maxWidth: '200px', whiteSpace: 'normal' }}>
                        {t.deskripsi ? t.deskripsi.replace(/<[^>]+>/g, '') : '-'}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 500, verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Avatar name={t.pic} src={masterPicAvatars?.[t.pic]} size={20} masterColors={masterColors} />
                            <span style={{ fontSize: '12px', fontWeight: '500' }}>{t.pic}</span>
                          </div>
                          {t.additionalPics && (() => {
                            try {
                              const arr = JSON.parse(t.additionalPics);
                              return Array.isArray(arr) && arr.length > 0 ? arr.map((p, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Avatar name={p} src={masterPicAvatars?.[p]} size={20} masterColors={masterColors} />
                                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>{p}</span>
                                </div>
                              )) : null;
                            } catch(e) { return null; }
                          })()}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', verticalAlign: 'top' }}>
                        {(() => {
                          const badge = getDynamicBadgeStyle('cat', t.kategori || 'Umum', '', masterColors);
                          return (
                            <span className={badge.className} style={{ whiteSpace: 'nowrap', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', ...badge.style }}>
                              {t.kategori || 'Umum'}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <span {...getDynamicBadgeStyle('priority', t.prioritas || 'Medium', t.prioritas === 'Urgent' ? 'badge badge-urgent' : t.prioritas === 'High' ? 'badge badge-high' : t.prioritas === 'Low' ? 'badge badge-low' : 'badge badge-medium', masterColors)}>
                          {t.prioritas || 'Medium'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(() => {
                            const badge = getDynamicBadgeStyle('status', t.status, '', masterColors);
                            return (
                              <span className={badge.className} style={{ alignSelf: 'flex-start', ...badge.style }}>
                                {t.status}
                              </span>
                            );
                          })()}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px' }}>
                            <div className="progress-bar-bg" style={{ flex: 1, height: '6px' }}>
                              <div className="progress-bar-fill" style={{ width: `${t.progress || 0}%`, background: t.progress === 100 ? '#10b981' : 'var(--accent-primary)' }}></div>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.progress || 0}%</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', verticalAlign: 'top' }}>
                        {(() => {
                          if (!t.lokasi) return '-';
                          try {
                            const loc = JSON.parse(t.lokasi);
                            if (loc.tipe === 'online') {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '100px' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Online</span>
                                  {loc.linkZoom && <a href={loc.linkZoom} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ textDecoration: 'underline' }}>Link Zoom</a>}
                                   {loc.jam && <span>{loc.jam} {getLocalTimezone()}</span>}
                                </div>
                              );
                            } else if (loc.tipe === 'offline') {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '100px' }}>
                                  <span style={{ fontWeight: 600 }}>Offline</span>
                                  <span>{loc.lokasiFisik || '-'}</span>
                                  {loc.jam && <span>{loc.jam} {getLocalTimezone()}</span>}
                                </div>
                              );
                            }
                            return '-';
                          } catch(e) {
                            return t.lokasi;
                          }
                        })()}
                      </td>
                      <td style={{ padding: '16px', color: isOverdue ? 'var(--danger)' : 'var(--text-primary)', fontWeight: isOverdue ? 600 : 500, verticalAlign: 'top' }}>
                        {format(new Date(t.endDate), 'dd MMM yyyy')}
                        {isOverdue && t.status !== 'Done' && <span style={{ display: 'block', fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>Terlewat</span>}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <ListTodo size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                      Tidak ada pekerjaan aktif yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {selectedTaskForDetail && (
        <TaskDetailModal 
          task={selectedTaskForDetail as any}
          onClose={() => setSelectedTaskForDetail(null)}
          setPreviewFile={setPreviewFile}
          onEdit={() => {
            setSelectedTaskForDetail(null);
            handleOpenEditModal(selectedTaskForDetail);
          }}
        />
      )}
      
      <TaskAddEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        taskToEdit={editingTask}
        onSave={handleSaveModal}
        formCategoryOptions={masterCategories}
        formPicOptions={masterPics}
        formStatusOptions={masterStatuses}
        formPriorityOptions={masterPriorities}
        setPreviewFile={setPreviewFile}
      />
      
      <FilePreviewModal previewFile={previewFile} setPreviewFile={setPreviewFile} />
    </motion.div>
  );
}