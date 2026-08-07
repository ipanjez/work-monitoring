'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  TrendingUp, CheckCircle2, Clock, AlertCircle, Download, Calendar, Filter, Copy, FileText, FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfDay } from 'date-fns';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement 
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useNotifications } from '@/context/NotificationContext';
import { useFilter } from '@/context/FilterContext';
import UniversalFilterBar from '@/components/UniversalFilterBar';
import UniversalActionBar from '@/components/UniversalActionBar';
import { useTheme } from '@/context/ThemeContext';
import { exportToRichExcel } from '@/utils/excelExport';
import { picAvatarXAxisPlugin } from '@/utils/chartAvatarPlugin';
import { useMaster } from '@/context/MasterContext';
import { useSession } from 'next-auth/react';
import { getDynamicColor, getTaskExportRow } from '@/utils/taskUtils';

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

export default function ReportsClient({ tasks }: { tasks: Task[] }) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'MEMBER';
  const { addActivityLog } = useNotifications();
  const { theme } = useTheme();
  const { masterColors, masterPicAvatars } = useMaster();
  const reportsRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  const [masterStatuses, setMasterStatuses] = useState<string[]>(['To Do', 'In Progress', 'Review', 'Done']);
  const [masterPriorities, setMasterPriorities] = useState<string[]>(['Urgent', 'High', 'Medium', 'Low']);
  const [masterCats, setMasterCats] = useState<string[]>([]);

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
    globalTargetFilter, setGlobalTargetFilter, 
    globalPicFilter, setGlobalPicFilter, 
    globalCustomStartDate, setGlobalCustomStartDate,
    globalCustomEndDate, setGlobalCustomEndDate,
    globalFilterCategory: reportCategoryFilter,
    setGlobalFilterCategory: setReportCategoryFilter,
    globalFilterStatus,
    globalFilterPriority,
    globalSearchQuery
  } = useFilter();

  // Extract unique categories and PICs from all tasks for the dropdowns
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
      const todayTime = now.getTime();
      
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

      return matchTime && matchPic && matchCat && matchStatus && matchPriority && matchSearch;
    });
  }, [tasks, globalTargetFilter, globalPicFilter, globalCustomStartDate, globalCustomEndDate, reportCategoryFilter, globalFilterStatus, globalFilterPriority, globalSearchQuery]);

  const totalTasks = filteredTasks.length;
  
  const completedLabel = masterStatuses.length > 0 ? masterStatuses[masterStatuses.length - 1] : 'Selesai';
  const completedTasks = masterStatuses.length > 0 ? filteredTasks.filter((t: Task) => t.status === completedLabel).length : 0;


  const statusCounts = masterStatuses.map((status: string) => {
    return filteredTasks.filter((t: Task) => t.status === status).length;
  });

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgProgress = totalTasks > 0 ? Math.round(filteredTasks.reduce((acc: number, curr: Task) => acc + (curr.progress || 0), 0) / totalTasks) : 0;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: theme === 'dark' ? '#cbd5e1' : '#475569' } }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: { ticks: { color: theme === 'dark' ? '#cbd5e1' : '#475569' }, grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' } },
      x: { ticks: { color: theme === 'dark' ? '#cbd5e1' : '#475569' }, grid: { display: false } }
    }
  };

  const picBarOptions = {
    ...barOptions,
    scales: {
      ...barOptions.scales,
      x: { stacked: true, ticks: { display: false }, grid: { display: false }, afterFit(axis: any) { axis.height += 40; } },
      y: { stacked: true, ...barOptions.scales.y }
    },
    plugins: {
      ...barOptions.plugins,
      picAvatarXAxis: { avatars: masterPicAvatars, masterColors, size: 28 },
      tooltip: {
        enabled: false,
        external: function (context: any) {
          let tooltipEl = document.getElementById('chartjs-tooltip-reports');
          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip-reports';
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

          if (tooltipModel.body) {
            const titleLines = tooltipModel.title || [];
            const bodyLines = tooltipModel.body.map((b: any) => b.lines);
            
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
    }
  };


  // 1. Status Pekerjaan (Doughnut)
  const statusData = {
    labels: masterStatuses,
    datasets: [{
      data: statusCounts,
      backgroundColor: masterStatuses.map((status: string) => masterColors[`status_${status}`] || getDynamicColor('status', status)),
      borderWidth: 0,
    }]
  };

  // 2. Distribusi Prioritas (Doughnut)
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

  // 3. Beban Kerja PIC (Bar)
  const picStats: Record<string, Record<string, number>> = {};
  filteredTasks.forEach(t => {
    const processPic = (p: string) => {
      if (!picStats[p]) {
        picStats[p] = {};
        masterStatuses.forEach(s => picStats[p][s] = 0);
      }
      if (picStats[p][t.status] !== undefined) {
        picStats[p][t.status]++;
      } else {
        // Fallback if status doesn't match master statuses
        const lastStatus = masterStatuses[masterStatuses.length - 1];
        if (picStats[p][lastStatus] !== undefined) picStats[p][lastStatus]++;
      }
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
  }).slice(0, 10); // Top 10

  const picWorkloadData = {
    labels: sortedPics,
    datasets: masterStatuses.map((status: string) => ({
      label: status,
      data: sortedPics.map(p => picStats[p][status] || 0),
      backgroundColor: masterColors[`status_${status}`] || getDynamicColor('status', status)
    }))
  };

  // 4. Progress Rata-rata per Kategori (Bar)
  const catProgress: Record<string, { totalProgress: number, count: number }> = {};
  filteredTasks.forEach(t => {
    const cat = t.kategori || 'Umum';
    if (!catProgress[cat]) catProgress[cat] = { totalProgress: 0, count: 0 };
    catProgress[cat].totalProgress += (t.progress || 0);
    catProgress[cat].count++;
  });

  const catProgressData = {
    labels: Object.keys(catProgress),
    datasets: [{
      label: 'Rata-rata Progress (%)',
      data: Object.keys(catProgress).map(c => Math.round(catProgress[c].totalProgress / catProgress[c].count)),
      backgroundColor: Object.keys(catProgress).map(c => masterColors[`kategori_${c}`] || '#3b82f6'),
      borderRadius: 4
    }]
  };

  // 5. Kepatuhan Tenggat Waktu (Doughnut)
  let overdueCount = 0;
  let dueTodayCount = 0;
  let upcomingCount = 0;
  let doneCountForDeadline = 0;

  const todayStart = startOfDay(new Date()).getTime();
  filteredTasks.forEach(t => {
    if (t.status === 'Done') {
      doneCountForDeadline++;
      return;
    }
    const end = startOfDay(new Date(t.endDate)).getTime();
    if (end < todayStart) overdueCount++;
    else if (end === todayStart) dueTodayCount++;
    else upcomingCount++;
  });

  const deadlineData = {
    labels: ['Terlewat (Overdue)', 'Hari Ini', 'Akan Datang', 'Selesai'],
    datasets: [{
      data: [overdueCount, dueTodayCount, upcomingCount, doneCountForDeadline],
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
      borderWidth: 0,
    }]
  };

  // 6. Distribusi Pekerjaan per Kategori (Doughnut)
  const catDistribution: Record<string, number> = {};
  filteredTasks.forEach(t => {
    const cat = (t.kategori || 'Umum').trim();
    catDistribution[cat] = (catDistribution[cat] || 0) + 1;
  });
  const catDistLabels = Object.keys(catDistribution);

  const categoryData = {
    labels: catDistLabels,
    datasets: [{
      data: catDistLabels.map(cat => catDistribution[cat]),
      backgroundColor: catDistLabels.map((cat: string, i: number) => {
         const colors = ['#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#eab308'];
         const matchCat = masterCats.find(mc => mc.trim() === cat) || cat;
         return masterColors[`cat_${matchCat}`] || colors[i % colors.length];
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
        toast.success('Pekerjaan berhasil diekspor', { id: 'export-excel-report' });
        addActivityLog?.('Export', 'Download Excel', `Mengunduh Laporan Kinerja Excel (${filteredTasks.length} pekerjaan)`, 'success');
      } else {
        toast.error('Gagal mengekspor Excel', { id: 'export-excel-report' });
      }
    } catch (error) {
      console.error('Excel Export error:', error);
      toast.error('Gagal mengekspor Excel', { id: 'export-excel-report' });
    }
  };

  const handleExportPDF = () => {
    setIsExportingPdf(true);
    addActivityLog?.('Export', 'Download PDF', `Mengunduh Laporan Kinerja PDF (${filteredTasks.length} pekerjaan)`, 'success');
    try {
      const doc = new jsPDF('landscape');
      doc.setFontSize(16);
      doc.text('Laporan Kinerja Departemen', 14, 20);
      doc.setFontSize(10);
      doc.text(`Dicetak pada: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 28);
      
      const tableColumn = ['Pekerjaan', 'Kategori', 'Prioritas', 'Status', 'Progress', 'Tenggat', 'PIC', 'Lokasi'];
      const tableRows: any[] = [];
 
      filteredTasks.forEach(t => {
        const extraPicsStr = (() => {
          try {
            const arr = JSON.parse(t.additionalPics || '[]');
            return Array.isArray(arr) && arr.length > 0 ? ` (+${arr.join(', ')})` : '';
          } catch(e) { return ''; }
        })();

        let lokasiStr = '';
        if (t.lokasi) {
          try {
            const parsedLoc = JSON.parse(t.lokasi);
            if (parsedLoc.tipe === 'online') {
              lokasiStr = `Online: ${parsedLoc.linkZoom || ''}`;
            } else if (parsedLoc.tipe === 'offline') {
              lokasiStr = `Offline: ${parsedLoc.lokasiFisik || ''}`;
            }
          } catch (e) {
            lokasiStr = t.lokasi;
          }
        }

        const row = [
          t.nama,
          t.kategori || 'Umum',
          t.prioritas || 'Medium',
          t.status,
          `${t.progress || 0}%`,
          format(new Date(t.endDate), 'dd MMM yyyy'),
          `${t.pic}${extraPicsStr}`,
          lokasiStr || '-'
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
      });

      doc.save(`Laporan_Kinerja_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('PDF Export error:', error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyImage = async () => {
    if (!reportsRef.current) return;
    try {
      addActivityLog?.('Export', 'Copy Image', 'Menyalin gambar laporan kinerja ke clipboard', 'info');
      
      const element = reportsRef.current;
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
            import('react-hot-toast').then(({ default: toast }) => toast.success('Gambar laporan disalin ke clipboard'));
          } catch (err) {
            console.error('Clipboard write error:', err);
            import('react-hot-toast').then(({ default: toast }) => toast.error('Gagal menyalin gambar, izin ditolak.'));
          }
        }
      });
    } catch (error) {
      console.error('html2canvas error:', error);
    }
  };

  return (
    <motion.div 
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      ref={reportsRef}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Analisis & Laporan Kinerja</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Rangkuman performa penyelesaian pekerjaan secara komprehensif.
          </p>
        </div>

      </div>

      {/* Global Filters Synchronized */}
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
          onCopyImage={handleCopyImage}
        />
      </UniversalFilterBar>

      {/* Summary KPI Cards */}
      <motion.div 
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Tingkat Penyelesaian</span>
            <TrendingUp size={20} color="var(--success)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{completionRate}%</div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {completedTasks} dari {totalTasks} pekerjaan
          </p>
        </div>

        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Rata-rata Progress</span>
            <TrendingUp size={20} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{avgProgress}%</div>
          <div className="progress-container" style={{ marginTop: '8px', height: '6px' }}>
            <div className="progress-bar" style={{ width: `${avgProgress}%`, backgroundColor: 'var(--accent-primary)' }} />
          </div>
        </div>

        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {masterStatuses.map((s: string, i: number) => (
                <span key={s}>
                  <span style={{ color: masterColors[`status_${s}`] || 'var(--text-secondary)' }}>{s}</span>
                  {i < masterStatuses.length - 1 && <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>/</span>}
                </span>
              ))}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {masterStatuses.map((s: string, i: number) => {
              const count = filteredTasks.filter((t: Task) => t.status === s).length;
              return (
                <span key={s}>
                  <span style={{ color: masterColors[`status_${s}`] || 'var(--text-secondary)' }}>{count}</span>
                  {i < masterStatuses.length - 1 && <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>/</span>}
                </span>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Status Pekerjaan</h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Doughnut data={statusData} options={chartOptions} />
          </div>
        </div>

        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Beban Kerja per PIC (Top 10)</h3>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Bar data={picWorkloadData} options={picBarOptions} plugins={[picAvatarXAxisPlugin]} />
          </div>
        </div>

        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Sebaran Prioritas Pekerjaan</h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Doughnut data={priorityData} options={chartOptions} />
          </div>
        </div>

        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Rata-rata Progress per Kategori</h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Bar data={catProgressData} options={barOptions} />
          </div>
        </div>

        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Kepatuhan Tenggat Waktu</h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Doughnut data={deadlineData} options={chartOptions} />
          </div>
        </div>

        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Distribusi Pekerjaan per Kategori</h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Doughnut data={categoryData} options={chartOptions} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
