'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { useTheme } from '@/context/ThemeContext';
import { useMaster } from '@/context/MasterContext';
import { getDynamicColor } from '@/utils/taskUtils';

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
};

export default function ReportsClient({ tasks }: { tasks: Task[] }) {
  const { addActivityLog } = useNotifications();
  const { theme } = useTheme();
  const { masterColors } = useMaster();
  const reportsRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  const [masterStatuses, setMasterStatuses] = useState<string[]>(['To Do', 'In Progress', 'Review', 'Done']);
  const [masterPriorities, setMasterPriorities] = useState<string[]>(['Urgent', 'High', 'Medium', 'Low']);
  const [masterCats, setMasterCats] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.status) setMasterStatuses(data.status.split(',').map((s: string) => s.trim()).filter(Boolean));
        if (data.prioritas) setMasterPriorities(data.prioritas.split(',').map((s: string) => s.trim()).filter(Boolean));
        if (data.kategori) setMasterCats(data.kategori.split(',').map((s: string) => s.trim()).filter(Boolean));
      })
      .catch(err => console.error("Failed to load master settings", err));
  }, []);
  
  // Use global filters
  const { 
    globalTargetFilter, setGlobalTargetFilter, 
    globalPicFilter, setGlobalPicFilter, 
    globalCustomStartDate, setGlobalCustomStartDate,
    globalCustomEndDate, setGlobalCustomEndDate
  } = useFilter();

  // Local Category Filter just for Reports if needed, or we just rely on PIC and Target
  const [reportCategoryFilter, setReportCategoryFilter] = useState('Semua Kategori');

  // Extract unique categories and PICs from all tasks for the dropdowns
  const allCategories = useMemo(() => Array.from(new Set(tasks.map(t => t.kategori || 'Umum'))).sort(), [tasks]);
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
    return Array.from(pics).sort();
  }, [tasks]);

  // Filtering Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
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
      if (reportCategoryFilter !== 'Semua Kategori') {
        matchCat = (t.kategori || 'Umum') === reportCategoryFilter;
      }

      return matchTime && matchPic && matchCat;
    });
  }, [tasks, globalTargetFilter, globalPicFilter, globalCustomStartDate, globalCustomEndDate, reportCategoryFilter]);

  const totalTasks = filteredTasks.length;
  
  const completedLabel = masterStatuses.length > 0 ? masterStatuses[masterStatuses.length - 1] : 'Selesai';
  const completedTasks = masterStatuses.length > 0 ? filteredTasks.filter(t => t.status === completedLabel).length : 0;


  const statusCounts = masterStatuses.map(status => {
    return filteredTasks.filter(t => t.status === status).length;
  });

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgProgress = totalTasks > 0 ? Math.round(filteredTasks.reduce((acc, curr) => acc + (curr.progress || 0), 0) / totalTasks) : 0;

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

  // 1. Status Pekerjaan (Doughnut)
  const statusData = {
    labels: masterStatuses,
    datasets: [{
      data: statusCounts,
      backgroundColor: masterStatuses.map(status => masterColors[`status_${status}`] || getDynamicColor('status', status)),
      borderWidth: 0,
    }]
  };

  // 2. Distribusi Prioritas (Doughnut)
  const priorityCounts = masterPriorities.map(prio => {
    return filteredTasks.filter(t => t.prioritas === prio || (!t.prioritas && prio === 'Medium')).length;
  });
  
  const priorityData = {
    labels: masterPriorities,
    datasets: [{
      data: priorityCounts,
      backgroundColor: masterPriorities.map(prio => masterColors[`prioritas_${prio}`] || getDynamicColor('priority', prio)),
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
    const sumA = Object.values(picStats[a]).reduce((acc, curr) => acc + curr, 0);
    const sumB = Object.values(picStats[b]).reduce((acc, curr) => acc + curr, 0);
    return sumB - sumA;
  }).slice(0, 10); // Top 10

  const picWorkloadData = {
    labels: sortedPics,
    datasets: masterStatuses.map(status => ({
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
      backgroundColor: '#3b82f6',
      borderRadius: 4
    }]
  };

  const handleExportFullReport = () => {
    const reportData = filteredTasks.map((t, idx) => {
      let subTasksStr = '';
      // Cannot easily use t.subTasksJson since it's not in the Task type locally, wait, I can add it to the type above or cast.
      // Let's assume t has it or we can cast as any.
      const taskAny = t as any;
      if (taskAny.subTasksJson) {
        try {
          const subTasks = JSON.parse(taskAny.subTasksJson);
          if (Array.isArray(subTasks) && subTasks.length > 0) {
            subTasksStr = subTasks.map((st: any) => `[${st.status}] ${st.text}`).join('\n');
          }
        } catch(e) {}
      }

      return {
        'No': idx + 1,
        'Nama Pekerjaan': t.nama,
        'PIC Utama': t.pic,
        'PIC Tambahan': (() => {
          try {
            const arr = JSON.parse(t.additionalPics || '[]');
            return Array.isArray(arr) ? arr.join(', ') : '';
          } catch(e) { return ''; }
        })(),
        'Kategori': t.kategori || 'Umum',
        'Prioritas': t.prioritas || 'Medium',
        'Status': t.status,
        'Progress': `${t.progress || 0}%`,
        'Tanggal Mulai': format(new Date(t.startDate), 'yyyy-MM-dd') + (!(t as any).isAllDay && (t as any).startTime ? ` ${(t as any).startTime}` : ''),
        'Tenggat Waktu': format(new Date(t.endDate), 'yyyy-MM-dd') + (!(t as any).isAllDay && (t as any).endTime ? ` ${(t as any).endTime}` : ''),
        'Deskripsi': taskAny.deskripsi ? taskAny.deskripsi.replace(/<[^>]+>/g, '') : '-',
        'Sub-Pekerjaan': subTasksStr || '-',
        'Catatan': taskAny.catatan || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(reportData);
    
    ws['!cols'] = [
      { wch: 5 }, { wch: 35 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
      { wch: 40 }, { wch: 40 }, { wch: 40 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Kinerja');
    XLSX.writeFile(wb, `Laporan_Kinerja_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    addActivityLog?.('Export', 'Download Excel', `Mengunduh Laporan Kinerja Excel (${filteredTasks.length} pekerjaan)`, 'success');
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
      
      const tableColumn = ['Pekerjaan', 'Kategori', 'Prioritas', 'Status', 'Progress', 'Tenggat', 'PIC'];
      const tableRows: any[] = [];

      filteredTasks.forEach(t => {
        const extraPicsStr = (() => {
          try {
            const arr = JSON.parse(t.additionalPics || '[]');
            return Array.isArray(arr) && arr.length > 0 ? ` (+${arr.join(', ')})` : '';
          } catch(e) { return ''; }
        })();
        const row = [
          t.nama,
          t.kategori || 'Umum',
          t.prioritas || 'Medium',
          t.status,
          `${t.progress || 0}%`,
          format(new Date(t.endDate), 'dd MMM yyyy'),
          `${t.pic}${extraPicsStr}`
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
      const canvas = await html2canvas(reportsRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc'
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            // using window.alert if toast is not imported, or just let ActivityLog handle it
          } catch (err) {
            console.error('Clipboard write error:', err);
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
      <div className="glass" style={{ padding: '16px 24px', borderRadius: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Filter Laporan:</span>
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
              <input type="date" value={globalCustomStartDate} onChange={(e) => setGlobalCustomStartDate(e.target.value)} style={{ width: 'auto', padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>-</span>
              <input type="date" value={globalCustomEndDate} onChange={(e) => setGlobalCustomEndDate(e.target.value)} style={{ width: 'auto', padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>PIC:</span>
          <select className="input" style={{ width: 'auto', padding: '6px 10px' }} value={globalPicFilter} onChange={e => setGlobalPicFilter(e.target.value)}>
            <option value="Semua PIC">Semua PIC</option>
            {allPics.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Kategori:</span>
          <select className="input" style={{ width: 'auto', padding: '6px 10px' }} value={reportCategoryFilter} onChange={e => setReportCategoryFilter(e.target.value)}>
            <option value="Semua Kategori">Semua Kategori</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <button className="btn" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={handleCopyImage}>
            <Copy size={16} /> Copy Image
          </button>
          <button className="btn" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={handleExportPDF} disabled={isExportingPdf}>
            <FileText size={16} color="#ef4444" /> {isExportingPdf ? 'Mengekspor...' : 'Export PDF'}
          </button>
          <button className="btn btn-primary" onClick={handleExportFullReport} style={{ whiteSpace: 'nowrap' }}>
            <FileSpreadsheet size={16} /> Export XLSX
          </button>
        </div>
      </div>

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
              {masterStatuses.map((s, i) => (
                <span key={s}>
                  <span style={{ color: masterColors[`status_${s}`] || 'var(--text-secondary)' }}>{s}</span>
                  {i < masterStatuses.length - 1 && <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>/</span>}
                </span>
              ))}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {masterStatuses.map((s, i) => {
              const count = filteredTasks.filter(t => t.status === s).length;
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
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Bar data={picWorkloadData} options={{ ...barOptions, scales: { ...barOptions.scales, x: { stacked: true }, y: { stacked: true } } }} />
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

      </div>
    </motion.div>
  );
}
