'use client';

import React, { useState, useEffect, useMemo, useRef, useTransition } from 'react';
import toast from 'react-hot-toast';
import { 
  TrendingUp, CheckCircle2, Clock, AlertCircle, Download, Calendar, 
  Filter, Copy, FileText, FileSpreadsheet, Award, Users, ArrowUpDown,
  ChevronDown, ChevronUp, BarChart3, PieChart, ShieldAlert, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfDay } from 'date-fns';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, 
  Tooltip, Legend, ArcElement, LineElement, PointElement 
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToRichExcel } from '@/utils/excelExport';
import { captureDomElement, exportCanvasToImage, exportCanvasToPdf } from '@/utils/domCapture';
import { picAvatarXAxisPlugin } from '@/utils/chartAvatarPlugin';
import { useNotifications } from '@/context/NotificationContext';
import { useFilter } from '@/context/FilterContext';
import UniversalFilterBar from '@/components/UniversalFilterBar';
import UniversalActionBar from '@/components/UniversalActionBar';
import { checkSearchMatch } from '@/utils/searchUtils';
import { useTheme } from '@/context/ThemeContext';
import { useMaster } from '@/context/MasterContext';
import { useSession } from 'next-auth/react';
import { getDynamicColor, getTaskExportRow, getDynamicBadgeStyle } from '@/utils/taskUtils';
import { hasPermission, RolePermissionsConfig, defaultRolePermissions } from '@/lib/permissions';
import Avatar from '@/components/Avatar';
import RoleBadge from '@/components/RoleBadge';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement
);

type Task = {
  id: number;
  nama: string;
  pic: string;
  status: string;
  prioritas?: string | null;
  kategori?: string | null;
  progress?: number | null;
  startDate: string | Date;
  endDate: string | Date;
  additionalPics?: string | null;
  lokasi?: string | null;
};

type SortField = 'pic' | 'total' | 'done' | 'inProgress' | 'overdue' | 'avgProgress' | 'score';
type SortOrder = 'asc' | 'desc';

export default function ReportsClient({ tasks: initialTasks }: { tasks: Task[] }) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || '';
  const { addActivityLog } = useNotifications();
  const { theme } = useTheme();
  const { masterColors, masterPicAvatars, roleConfig, userRoles } = useMaster();
  const reportsRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Real-Time Background Synchronization Listener
  useEffect(() => {
    const handleRealtimeTasks = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        startTransition(() => {
          setTasks(e.detail);
        });
      }
    };

    window.addEventListener('realtimeTasksUpdated', handleRealtimeTasks);
    return () => {
      window.removeEventListener('realtimeTasksUpdated', handleRealtimeTasks);
    };
  }, []);

  const getPicRole = (name: string): string => {
    if (!name) return '';
    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();
    if (userRoles[trimmed]) return userRoles[trimmed];
    if (userRoles[lower]) return userRoles[lower];
    const match = Object.entries(userRoles).find(([k]) => k.trim().toLowerCase() === lower);
    if (match) return match[1];
    if (session?.user?.name && session.user.name.trim().toLowerCase() === lower && (session.user as any)?.role) {
      return (session.user as any).role;
    }
    return '';
  };
  
  const [masterStatuses, setMasterStatuses] = useState<string[]>(['To Do', 'In Progress', 'Review', 'Done']);
  const [masterPriorities, setMasterPriorities] = useState<string[]>(['Urgent', 'High', 'Medium', 'Low']);
  const [masterCats, setMasterCats] = useState<string[]>([]);
  
  // Sorting state for Staff Performance Table
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.master_statuses && data.master_statuses.length > 0) setMasterStatuses(data.master_statuses);
        if (data.master_priorities && data.master_priorities.length > 0) setMasterPriorities(data.master_priorities);
        if (data.master_categories && data.master_categories.length > 0) setMasterCats(data.master_categories);
      })
      .catch(err => console.error("Failed to load master settings", err));
  }, []);
  
  const { 
    globalTargetFilter, 
    globalPicFilter, 
    globalCustomStartDate, 
    globalCustomEndDate, 
    globalFilterCategory: reportCategoryFilter,
    globalFilterStatus,
    globalFilterPriority,
    globalSearchQuery,
    globalSearchExactMatch
  } = useFilter();

  // Extract unique categories and PICs from all tasks
  const allCategories = useMemo(() => Array.from(new Set(tasks.map((t: Task) => t.kategori || 'Umum'))).sort(), [tasks]);
  const allPics = useMemo(() => {
    const pics = new Set<string>();
    tasks.forEach(t => {
      if (t.pic) pics.add(t.pic);
      if (t.additionalPics) {
        try {
          const arr = JSON.parse(t.additionalPics);
          if (Array.isArray(arr)) arr.forEach((p: string) => pics.add(p));
        } catch (e) {}
      }
    });
    if (session?.user?.name) {
      pics.add(session.user.name);
    }
    return Array.from(pics).sort();
  }, [tasks, session?.user?.name]);

  // Filtering Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((t: Task) => {
      // 1. Time Filter
      let matchTime = true;
      const taskDate = new Date(t.endDate).getTime();
      const now = new Date();
      now.setHours(0,0,0,0);
      
      if (globalTargetFilter === 'Hari Ini') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
        matchTime = taskDate >= startOfToday && taskDate <= endOfToday;
      } else if (globalTargetFilter === 'Minggu Ini') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
        const startOfWeek = new Date(now.setDate(diff)).getTime();
        const endOfWeek = startOfWeek + (7 * 24 * 60 * 60 * 1000) - 1;
        matchTime = taskDate >= startOfWeek && taskDate <= endOfWeek;
      } else if (globalTargetFilter === 'Bulan Ini') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
        matchTime = taskDate >= startOfMonth && taskDate <= endOfMonth;
      } else if (globalTargetFilter === 'Custom' && globalCustomStartDate && globalCustomEndDate) {
        const startCustom = new Date(globalCustomStartDate).getTime();
        const endCustom = new Date(globalCustomEndDate);
        endCustom.setHours(23, 59, 59, 999);
        matchTime = taskDate >= startCustom && taskDate <= endCustom.getTime();
      }

      // 2. PIC Filter
      let matchPic = true;
      if (globalPicFilter !== 'Semua PIC') {
        const hasMainPic = t.pic === globalPicFilter;
        let hasExtraPic = false;
        if (t.additionalPics) {
          try {
            const arr = JSON.parse(t.additionalPics);
            if (Array.isArray(arr)) hasExtraPic = arr.includes(globalPicFilter);
          } catch(e) {}
        }
        matchPic = hasMainPic || hasExtraPic;
      }

      // 3. Category Filter
      let matchCat = true;
      if (reportCategoryFilter !== 'All') {
        matchCat = (t.kategori || 'Umum') === reportCategoryFilter;
      }
      
      // 4. Status Filter
      let matchStatus = true;
      if (globalFilterStatus !== 'All') {
        matchStatus = t.status === globalFilterStatus;
      }

      // 5. Priority Filter
      let matchPriority = true;
      if (globalFilterPriority !== 'All') {
        matchPriority = (t.prioritas || 'Medium') === globalFilterPriority;
      }

      // 6. Search Filter
      let matchSearch = checkSearchMatch(t, globalSearchQuery, globalSearchExactMatch);

      return matchTime && matchPic && matchCat && matchStatus && matchPriority && matchSearch;
    });
  }, [tasks, globalTargetFilter, globalPicFilter, globalCustomStartDate, globalCustomEndDate, reportCategoryFilter, globalFilterStatus, globalFilterPriority, globalSearchQuery, globalSearchExactMatch]);

  const totalTasks = filteredTasks.length;
  const completedLabel = masterStatuses.length > 0 ? masterStatuses[masterStatuses.length - 1] : 'Done';
  const completedTasks = filteredTasks.filter((t: Task) => t.status === completedLabel || t.status === 'Done' || t.status === 'Selesai').length;
  const inProgressTasks = filteredTasks.filter((t: Task) => t.status === 'In Progress' || t.status === 'Sedang Dikerjakan').length;

  const todayStart = startOfDay(new Date()).getTime();
  let overdueCount = 0;
  let dueTodayCount = 0;
  let upcomingCount = 0;

  filteredTasks.forEach(t => {
    const isDone = t.status === completedLabel || t.status === 'Done' || t.status === 'Selesai';
    if (!isDone) {
      const end = startOfDay(new Date(t.endDate)).getTime();
      if (end < todayStart) overdueCount++;
      else if (end === todayStart) dueTodayCount++;
      else upcomingCount++;
    }
  });

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgProgress = totalTasks > 0 ? Math.round(filteredTasks.reduce((acc: number, curr: Task) => acc + (curr.progress || 0), 0) / totalTasks) : 0;

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom' as const, 
        labels: { 
          color: theme === 'dark' ? '#cbd5e1' : '#475569',
          font: { size: 11, weight: 'bold' as const },
          boxWidth: 12,
          padding: 12
        } 
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: { 
        ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b', font: { size: 11 } }, 
        grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' } 
      },
      x: { 
        ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b', font: { size: 11 } }, 
        grid: { display: false } 
      }
    }
  };

  const picBarOptions = {
    ...barOptions,
    scales: {
      ...barOptions.scales,
      x: { stacked: true, ticks: { display: false }, grid: { display: false }, afterFit(axis: any) { axis.height += 42; } },
      y: { stacked: true, ...barOptions.scales.y }
    },
    plugins: {
      ...barOptions.plugins,
      picAvatarXAxis: { avatars: masterPicAvatars, masterColors, size: 28 },
    }
  };

  // 1. Status Doughnut Data
  const statusCounts = masterStatuses.map((status: string) => {
    return filteredTasks.filter((t: Task) => t.status === status).length;
  });

  const statusData = {
    labels: masterStatuses,
    datasets: [{
      data: statusCounts,
      backgroundColor: masterStatuses.map((status: string) => masterColors[`status_${status}`] || getDynamicColor('status', status)),
      borderWidth: 0,
    }]
  };

  // 2. Priority Doughnut Data
  const priorityCounts = masterPriorities.map((prio: string) => {
    return filteredTasks.filter((t: Task) => t.prioritas === prio || (!t.prioritas && prio === 'Medium')).length;
  });
  
  const priorityData = {
    labels: masterPriorities,
    datasets: [{
      data: priorityCounts,
      backgroundColor: masterPriorities.map((prio: string) => masterColors[`prioritas_${prio}`] || getDynamicColor('priority', prio)),
      borderWidth: 0,
    }]
  };

  // 3. Workload per PIC
  const picStats: Record<string, Record<string, number>> = {};
  const picDetails: Record<string, { total: number; done: number; inProgress: number; overdue: number; totalProgress: number }> = {};

  filteredTasks.forEach(t => {
    const isDone = t.status === completedLabel || t.status === 'Done' || t.status === 'Selesai';
    const isOverdue = !isDone && startOfDay(new Date(t.endDate)).getTime() < todayStart;

    const processPic = (p: string) => {
      if (!picStats[p]) {
        picStats[p] = {};
        masterStatuses.forEach(s => picStats[p][s] = 0);
      }
      if (picStats[p][t.status] !== undefined) {
        picStats[p][t.status]++;
      } else {
        const lastStatus = masterStatuses[masterStatuses.length - 1];
        if (picStats[p][lastStatus] !== undefined) picStats[p][lastStatus]++;
      }

      if (!picDetails[p]) {
        picDetails[p] = { total: 0, done: 0, inProgress: 0, overdue: 0, totalProgress: 0 };
      }
      picDetails[p].total++;
      if (isDone) picDetails[p].done++;
      if (t.status === 'In Progress' || t.status === 'Sedang Dikerjakan') picDetails[p].inProgress++;
      if (isOverdue) picDetails[p].overdue++;
      picDetails[p].totalProgress += (t.progress || 0);
    };

    if (t.pic) processPic(t.pic);
    if (t.additionalPics) {
      try {
        const arr = JSON.parse(t.additionalPics);
        if (Array.isArray(arr)) arr.forEach((p: string) => processPic(p));
      } catch (e) {}
    }
  });

  const sortedPics = Object.keys(picStats).sort((a, b) => {
    const sumA = Object.values(picStats[a]).reduce((acc: number, curr: number) => acc + curr, 0);
    const sumB = Object.values(picStats[b]).reduce((acc: number, curr: number) => acc + curr, 0);
    return sumB - sumA;
  }).slice(0, 10);

  const picWorkloadData = {
    labels: sortedPics,
    datasets: masterStatuses.map((status: string) => ({
      label: status,
      data: sortedPics.map(p => picStats[p][status] || 0),
      backgroundColor: masterColors[`status_${status}`] || getDynamicColor('status', status)
    }))
  };

  // Staff Performance Table Dataset
  const staffPerformanceList = useMemo(() => {
    return Object.keys(picDetails).map(picName => {
      const d = picDetails[picName];
      const avgProg = d.total > 0 ? Math.round(d.totalProgress / d.total) : 0;
      const doneRate = d.total > 0 ? (d.done / d.total) : 0;
      // Score calculation: 60% completion rate + 40% avg progress - 10% penalty per overdue
      const rawScore = (doneRate * 60) + (avgProg * 0.4) - (d.overdue * 5);
      const score = Math.max(0, Math.min(100, Math.round(rawScore)));

      return {
        pic: picName,
        total: d.total,
        done: d.done,
        inProgress: d.inProgress,
        overdue: d.overdue,
        avgProgress: avgProg,
        score: score
      };
    }).sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortField === 'pic') return a.pic.localeCompare(b.pic) * multiplier;
      return (a[sortField] - b[sortField]) * multiplier;
    });
  }, [picDetails, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 4. Progress Rata-rata per Kategori
  const catProgress: Record<string, { totalProgress: number, count: number }> = {};
  filteredTasks.forEach(t => {
    const cat = (t.kategori || 'Umum').trim();
    if (!catProgress[cat]) catProgress[cat] = { totalProgress: 0, count: 0 };
    catProgress[cat].totalProgress += (t.progress || 0);
    catProgress[cat].count++;
  });

  const catProgressLabels = Object.keys(catProgress).sort((a, b) => {
    const indexA = (masterCats || []).findIndex(c => c.toLowerCase().trim() === a.toLowerCase().trim());
    const indexB = (masterCats || []).findIndex(c => c.toLowerCase().trim() === b.toLowerCase().trim());
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const catProgressData = {
    labels: catProgressLabels,
    datasets: [{
      label: 'Rata-rata Progress (%)',
      data: catProgressLabels.map(c => Math.round(catProgress[c].totalProgress / catProgress[c].count)),
      backgroundColor: catProgressLabels.map(c => {
        const matchCat = (masterCats || []).find(mc => mc.toLowerCase().trim() === c.toLowerCase().trim()) || c;
        return masterColors['category_' + matchCat] || masterColors[`kategori_${matchCat}`] || masterColors[`cat_${matchCat}`] || '#3b82f6';
      }),
      borderRadius: 6
    }]
  };

  // 5. Deadline Compliance Doughnut
  const deadlineData = {
    labels: ['Terlewat (Overdue)', 'Hari Ini', 'Akan Datang', 'Selesai'],
    datasets: [{
      data: [overdueCount, dueTodayCount, upcomingCount, completedTasks],
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
      borderWidth: 0,
    }]
  };

  // 6. Category Distribution
  const catDistribution: Record<string, number> = {};
  filteredTasks.forEach(t => {
    const cat = (t.kategori || 'Umum').trim();
    catDistribution[cat] = (catDistribution[cat] || 0) + 1;
  });
  const catDistLabels = Object.keys(catDistribution).sort((a, b) => {
    const indexA = (masterCats || []).findIndex(c => c.toLowerCase().trim() === a.toLowerCase().trim());
    const indexB = (masterCats || []).findIndex(c => c.toLowerCase().trim() === b.toLowerCase().trim());
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const categoryData = {
    labels: catDistLabels,
    datasets: [{
      data: catDistLabels.map(cat => catDistribution[cat]),
      backgroundColor: catDistLabels.map((cat: string, i: number) => {
         const colors = ['#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#eab308'];
         const matchCat = (masterCats || []).find(mc => mc.toLowerCase().trim() === cat.toLowerCase().trim()) || cat;
         return masterColors['category_' + matchCat] || masterColors[`cat_${matchCat}`] || masterColors[`kategori_${matchCat}`] || colors[i % colors.length];
      }),
      borderWidth: 0,
    }]
  };

  const handleExportFullReport = async () => {
    toast.loading('Mengekspor Laporan Kinerja...', { id: 'export-excel-report' });
    try {
      const success = await exportToRichExcel(
        filteredTasks,
        {
          pics: allPics,
          categories: masterCats,
          locations: [],
          priorities: masterPriorities,
          statuses: masterStatuses
        },
        `Laporan_Kinerja_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        false
      );
      if (success) {
        toast.success('Laporan Kinerja berhasil diekspor 📊', { id: 'export-excel-report' });
        addActivityLog?.('Export', 'Download Excel', `Mengunduh Laporan Kinerja Excel (${filteredTasks.length} pekerjaan)`, 'success');
      } else {
        toast.error('Gagal mengekspor Excel', { id: 'export-excel-report' });
      }
    } catch (error) {
      console.error('Excel Export error:', error);
      toast.error('Gagal mengekspor Excel', { id: 'export-excel-report' });
    }
  };

  const handleExportPDF = async () => {
    if (!reportsRef.current) return;
    setIsExportingPdf(true);
    addActivityLog?.('Export', 'Download PDF', `Mengunduh Laporan Kinerja PDF (${filteredTasks.length} pekerjaan)`, 'success');
    try {
      const canvas = await captureDomElement(reportsRef.current);
      await exportCanvasToPdf(canvas, 'Laporan_Kinerja');
    } catch (error) {
      console.error('PDF Export error:', error);
      toast.error('Gagal membuat PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportImage = async () => {
    if (!reportsRef.current) return;
    try {
      addActivityLog?.('Export', 'Export Image', 'Mengekspor gambar laporan kinerja sebagai PNG', 'info');
      const canvas = await captureDomElement(reportsRef.current);
      await exportCanvasToImage(canvas, 'Laporan_Kinerja');
    } catch (error) {
      console.error('html2canvas error:', error);
      toast.error('Gagal mengekspor gambar laporan.');
    }
  };

  return (
    <motion.div 
      id="reports-container"
      style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      ref={reportsRef}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={26} color="var(--accent-primary)" />
            Analisis & Laporan Kinerja
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Analisis komprehensif metrik efektivitas kerja, kepatuhan tenggat waktu, dan distribusi beban tim.
          </p>
        </div>
      </div>

      {/* Global Synchronized Filters */}
      <UniversalFilterBar 
        categories={masterCats.length > 0 ? masterCats : allCategories} 
        pics={allPics} 
        statuses={masterStatuses.length > 0 ? masterStatuses : undefined} 
        priorities={masterPriorities.length > 0 ? masterPriorities : undefined} 
        filteredCount={filteredTasks.length}
        totalCount={tasks.length}
      >
        <UniversalActionBar 
          onExportExcel={handleExportFullReport}
          onExportPDF={handleExportPDF}
          isExportingPdf={isExportingPdf}
          onExportImage={handleExportImage}
          tasks={filteredTasks}
          canExport={hasPermission(roleConfig, 'export_data', userRole)}
        />
      </UniversalFilterBar>

      {/* Modern Executive KPI Metric Cards */}
      <motion.div 
        id="reports-kpi-cards"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* KPI 1: Completion Rate */}
        <div className="glass" style={{ padding: '18px 20px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tingkat Penyelesaian</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{completionRate}%</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 700, color: '#10b981' }}>{completedTasks}</span> selesai dari <span style={{ fontWeight: 600 }}>{totalTasks}</span> tugas
          </div>
        </div>

        {/* KPI 2: Average Progress */}
        <div className="glass" style={{ padding: '18px 20px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Rata-rata Progress</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-primary)' }}>{avgProgress}%</div>
          <div className="progress-container" style={{ marginTop: '8px', height: '6px', borderRadius: '4px' }}>
            <div className="progress-bar" style={{ width: `${avgProgress}%`, backgroundColor: 'var(--accent-primary)' }} />
          </div>
        </div>

        {/* KPI 3: In Progress Workload */}
        <div className="glass" style={{ padding: '18px 20px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Sedang Dikerjakan</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{inProgressTasks}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Pekerjaan aktif dalam penanganan tim
          </div>
        </div>

        {/* KPI 4: Overdue Alert */}
        <div className="glass" style={{ padding: '18px 20px', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Terlewat (Overdue)</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: overdueCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: overdueCount > 0 ? '#ef4444' : '#10b981' }}>
              {overdueCount > 0 ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: overdueCount > 0 ? 'var(--danger)' : '#10b981' }}>
            {overdueCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {overdueCount > 0 ? 'Tugas melewati batas tenggat' : 'Semua tugas tepat jadwal 👍'}
          </div>
        </div>
      </motion.div>

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* 1. Status Doughnut */}
        <div id="reports-chart-status" className="glass" style={{ padding: '22px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="var(--accent-primary)" />
            Distribusi Status Pekerjaan
          </h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Doughnut data={statusData} options={chartOptions} />
          </div>
        </div>

        {/* 2. Top PIC Workload */}
        <div id="reports-chart-pic" className="glass" style={{ padding: '22px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--accent-primary)" />
            Beban Kerja per PIC (Top 10)
          </h3>
          <div style={{ height: '290px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Bar data={picWorkloadData} options={picBarOptions} plugins={[picAvatarXAxisPlugin]} />
          </div>
        </div>

        {/* 3. Priority Breakdown */}
        <div id="reports-chart-priority" className="glass" style={{ padding: '22px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="#f59e0b" />
            Sebaran Prioritas Pekerjaan
          </h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Doughnut data={priorityData} options={chartOptions} />
          </div>
        </div>

        {/* 4. Category Progress */}
        <div id="reports-chart-category-progress" className="glass" style={{ padding: '22px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#3b82f6" />
            Rata-rata Progress per Kategori
          </h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Bar data={catProgressData} options={barOptions} />
          </div>
        </div>

        {/* 5. Deadline Compliance */}
        <div id="reports-chart-deadline" className="glass" style={{ padding: '22px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#10b981" />
            Kepatuhan Tenggat Waktu
          </h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Doughnut data={deadlineData} options={chartOptions} />
          </div>
        </div>

        {/* 6. Category Distribution */}
        <div id="reports-chart-category-distribution" className="glass" style={{ padding: '22px', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#8b5cf6" />
            Distribusi per Kategori
          </h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Doughnut data={categoryData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Staff Performance & Analytics Matrix Table */}
      <div className="glass" style={{ padding: '22px', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Award size={20} color="#f59e0b" />
              Rekapitulasi Kinerja & Beban Anggota Tim (PIC)
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '3px', margin: 0 }}>
              Peringkat efektivitas kinerja dihitung berdasarkan persentase penyelesaian, rata-rata progres, dan penalti keterlambatan.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', background: 'var(--input-bg)' }}>
                <th style={{ padding: '12px 14px', borderRadius: '8px 0 0 8px', cursor: 'pointer' }} onClick={() => handleSort('pic')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    PIC {sortField === 'pic' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th style={{ padding: '12px 14px', cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('total')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    Total Tugas {sortField === 'total' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th style={{ padding: '12px 14px', cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('done')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    Selesai {sortField === 'done' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th style={{ padding: '12px 14px', cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('inProgress')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    On Progress {sortField === 'inProgress' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th style={{ padding: '12px 14px', cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('overdue')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    Overdue {sortField === 'overdue' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => handleSort('avgProgress')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Rata-rata Progress {sortField === 'avgProgress' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th style={{ padding: '12px 14px', borderRadius: '0 8px 8px 0', cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('score')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    Skor Kinerja {sortField === 'score' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {staffPerformanceList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Tidak ada data performa PIC pada rentang filter ini.
                  </td>
                </tr>
              ) : (
                staffPerformanceList.map((item, idx) => {
                  const isTop3 = idx < 3 && sortField === 'score' && sortOrder === 'desc';
                  const scoreColor = item.score >= 80 ? '#10b981' : item.score >= 50 ? '#3b82f6' : item.score >= 30 ? '#f59e0b' : '#ef4444';

                  return (
                    <tr 
                      key={item.pic} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--input-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar 
                            name={item.pic} 
                            src={masterPicAvatars?.[item.pic]} 
                            size={32} 
                            masterColors={masterColors} 
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {item.pic}
                              {isTop3 && (
                                <span title="Top Performer" style={{ fontSize: '11px' }}>
                                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                </span>
                              )}
                            </div>
                            <div style={{ marginTop: '2px' }}>
                              <RoleBadge 
                                role={getPicRole(item.pic)} 
                                config={roleConfig} 
                                size="sm" 
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                        {item.total}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>
                        {item.done}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>
                        {item.inProgress}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {item.overdue > 0 ? (
                          <span style={{ padding: '2px 8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700, fontSize: '11.5px' }}>
                            {item.overdue}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>0</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress-container" style={{ flex: 1, height: '6px', borderRadius: '3px' }}>
                            <div className="progress-bar" style={{ width: `${item.avgProgress}%`, backgroundColor: item.avgProgress === 100 ? '#10b981' : 'var(--accent-primary)' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', width: '36px', textAlign: 'right' }}>
                            {item.avgProgress}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: `${scoreColor}18`,
                          color: scoreColor,
                          fontWeight: 800,
                          fontSize: '12.5px'
                        }}>
                          {item.score} / 100
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
