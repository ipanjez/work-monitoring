'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { Download, FileText, Filter, AlertTriangle, CheckCircle, Clock, ListTodo, User, Paperclip, Calendar, ArrowRight, Search, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, startOfDay } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import { useFilter } from '@/context/FilterContext';
import { useNotifications } from '@/context/NotificationContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type Task = {
  id: number;
  nama: string;
  pic: string;
  status: string;
  prioritas?: string | null;
  kategori?: string | null;
  progress?: number | null;
  deskripsi?: string | null;
  catatan?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  additionalPics?: string | null;
};

export default function DashboardClient({ tasks }: { tasks: Task[] }) {
  const { theme } = useTheme();
  const { addActivityLog } = useNotifications();
  const { globalTargetFilter, setGlobalTargetFilter, globalPicFilter, setGlobalPicFilter } = useFilter();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Table specific states
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<'endDate' | 'nama' | 'pic' | 'kategori' | 'status'>('endDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [masterPics, setMasterPics] = useState<string[]>([]);
  const [masterCategories, setMasterCategories] = useState<string[]>([]);

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
        })
        .catch(e => console.error(e));
    };
    loadMasterData();
    window.addEventListener('tasksUpdated', loadMasterData);
    return () => window.removeEventListener('tasksUpdated', loadMasterData);
  }, []);

  const categories = Array.from(new Set(['All', ...tasks.map(t => t.kategori || 'Umum'), ...masterCategories]));
  const pics = Array.from(new Set(['All', ...tasks.map(t => t.pic), ...masterPics]));

  const filteredTasks = tasks.filter(t => {
    const matchCat = selectedCategory === 'All' || (t.kategori || 'Umum') === selectedCategory;
    const matchPic = globalPicFilter === 'Semua PIC' || t.pic === globalPicFilter || (
      t.additionalPics ? (() => {
        try {
          const arr = JSON.parse(t.additionalPics);
          return Array.isArray(arr) && arr.includes(globalPicFilter);
        } catch(e) { return false; }
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
    }

    let matchDate = false;
    if (globalTargetFilter === 'Semua Waktu') {
      matchDate = true;
    } else {
      if (taskStart <= endBoundary && taskEnd >= startBoundary) {
         matchDate = true;
      }
    }
    
    return matchCat && matchPic && matchDate;
  });

  const total = filteredTasks.length;
  const completed = filteredTasks.filter(t => t.status === 'Done').length;
  const inProgress = filteredTasks.filter(t => t.status === 'In Progress').length;
  const todo = filteredTasks.filter(t => t.status === 'To Do').length;

  const avgProgress = total > 0 
    ? Math.round(filteredTasks.reduce((acc, t) => acc + (t.progress || (t.status === 'Done' ? 100 : t.status === 'In Progress' ? 50 : 0)), 0) / total)
    : 0;

  const textColor = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  // Status Doughnut Data
  const statusData = {
    labels: ['Selesai', 'Proses', 'Belum Dimulai'],
    datasets: [
      {
        data: [completed, inProgress, todo],
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'],
        borderColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  // PIC Bar Data
  const picCounts = filteredTasks.reduce((acc, task) => {
    acc[task.pic] = (acc[task.pic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const picData = {
    labels: Object.keys(picCounts),
    datasets: [
      {
        label: 'Jumlah Pekerjaan',
        data: Object.values(picCounts),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };

  // Priority Data
  const priorityCounts = filteredTasks.reduce((acc, t) => {
    const p = t.prioritas || 'Medium';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityData = {
    labels: ['Urgent', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [
          priorityCounts['Urgent'] || 0,
          priorityCounts['High'] || 0,
          priorityCounts['Medium'] || 0,
          priorityCounts['Low'] || 0,
        ],
        backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#64748b'],
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
        backgroundColor: '#8b5cf6', // Purple
        borderRadius: 6,
      },
    ],
  };

  // Chart Click Handlers for Drill-down
  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { color: textColor } } },
    animation: { duration: 1500, easing: 'easeOutQuart' as const },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const statusMap = ['Done', 'In Progress', 'To Do'];
        router.push(`/tasks?status=${encodeURIComponent(statusMap[index])}`);
      }
    }
  };

  const picOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    animation: { duration: 1500, easing: 'easeOutQuart' as const },
    scales: {
      y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
      x: { ticks: { color: textColor }, grid: { display: false } }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const selectedPIC = picData.labels[index];
        router.push(`/tasks?pic=${encodeURIComponent(selectedPIC)}`);
      }
    }
  };

  const priorityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { color: textColor } } },
    animation: { duration: 1500, easing: 'easeOutQuart' as const },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const selectedPriority = priorityData.labels[index];
        router.push(`/tasks?prioritas=${encodeURIComponent(selectedPriority)}`);
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
      x: { ticks: { color: textColor }, grid: { display: false } }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const selectedCat = categoryData.labels[index];
        router.push(`/tasks?kategori=${encodeURIComponent(selectedCat)}`);
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
  const picDone = picTasks.filter(t => t.status === 'Done').length;
  const picInProgress = picTasks.filter(t => t.status === 'In Progress').length;
  const picTodo = picTasks.filter(t => t.status === 'To Do').length;

  const handleExportPDF = async () => {
    try {
      if (addActivityLog) {
        addActivityLog('EXPORT_PDF', 'Export Laporan', 'Mengekspor laporan Dashboard ke format PDF', 'info');
      }

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('dashboard-report-container');
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 3, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 15;
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth - (margin * 2);
      const headerHeight = 20;
      const footerHeight = 15;
      const pageContentHeight = pdfHeight - (margin * 2) - headerHeight - footerHeight;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = margin + headerHeight;
      let pageNumber = 1;

      const addHeaderFooter = () => {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        
        // Header
        pdf.setFontSize(16);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Laporan Dashboard Monitoring Pekerjaan', pdfWidth / 2, margin + 5, { align: 'center' });
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Diekstrak pada: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, pdfWidth / 2, margin + 12, { align: 'center' });
        
        // Footer
        pdf.setFontSize(9);
        pdf.text(`Halaman ${pageNumber}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
        pdf.text('Generated by Dashboard Monitoring System', margin, pdfHeight - 10);
      };

      addHeaderFooter();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageContentHeight;

      while (heightLeft > 0) {
        position -= pageContentHeight;
        pdf.addPage();
        pageNumber++;
        addHeaderFooter();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageContentHeight;
      }

      pdf.save(`Dashboard_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('PDF Export error:', error);
    }
  };

  const handleExportExcelSummary = () => {
    if (addActivityLog) {
      addActivityLog('EXPORT_EXCEL', 'Export Laporan', 'Mengekspor data pekerjaan ke format Excel', 'info');
    }

    const summaryData = [
      { 'Metrik': 'Total Pekerjaan', 'Nilai': total },
      { 'Metrik': 'Selesai', 'Nilai': completed },
      { 'Metrik': 'Sedang Proses', 'Nilai': inProgress },
      { 'Metrik': 'Belum Dimulai', 'Nilai': todo },
      { 'Metrik': 'Rata-rata Progress', 'Nilai': `${avgProgress}%` }
    ];

    const detailData = filteredTasks.map(t => ({
      'Nama Pekerjaan': t.nama,
      'PIC': t.pic,
      'Kategori': t.kategori || 'Umum',
      'Prioritas': t.prioritas,
      'Status': t.status,
      'Progress (%)': t.progress,
      'Deskripsi': t.deskripsi || '',
      'Lampiran File': t.fileName || '',
      'Tanggal Mulai': format(new Date(t.startDate), 'dd MMM yyyy'),
      'Tenggat Waktu': format(new Date(t.endDate), 'dd MMM yyyy')
    }));

    const wb = XLSX.utils.book_new();
    
    // Add title rows for summary
    const wsSummary = XLSX.utils.aoa_to_sheet([
      ['LAPORAN RINGKASAN PEKERJAAN'],
      [`Diekstrak pada: ${format(new Date(), 'dd MMM yyyy HH:mm')}`],
      [],
      ['Metrik', 'Nilai']
    ]);
    XLSX.utils.sheet_add_json(wsSummary, summaryData, { origin: 'A5', skipHeader: true });

    // Add title rows for detail
    const wsDetail = XLSX.utils.aoa_to_sheet([
      ['DETAIL DAFTAR PEKERJAAN'],
      [`Diekstrak pada: ${format(new Date(), 'dd MMM yyyy HH:mm')}`],
      [],
      Object.keys(detailData[0] || {})
    ]);
    if (detailData.length > 0) {
      XLSX.utils.sheet_add_json(wsDetail, detailData, { origin: 'A5', skipHeader: true });
    }

    // Set Column Widths for neatness
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
    wsDetail['!cols'] = [
      { wch: 35 }, // Nama
      { wch: 20 }, // PIC
      { wch: 20 }, // Kategori
      { wch: 15 }, // Prioritas
      { wch: 15 }, // Status
      { wch: 15 }, // Progress
      { wch: 45 }, // Deskripsi
      { wch: 25 }, // Lampiran
      { wch: 15 }, // Mulai
      { wch: 15 }, // Tenggat
    ];

    // Style the headers
    const boldStyle = { font: { bold: true } };
    wsSummary['A1'] = { t: 's', v: 'LAPORAN RINGKASAN PEKERJAAN', s: { font: { bold: true, sz: 14 } } };
    wsDetail['A1'] = { t: 's', v: 'DETAIL DAFTAR PEKERJAAN', s: { font: { bold: true, sz: 14 } } };

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Pekerjaan');
    XLSX.writeFile(wb, `Laporan_Dashboard_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Kategori:</span>
            <select className="input" style={{ width: 'auto', padding: '6px 12px' }} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Pilih PIC:</span>
            <select className="input" style={{ width: 'auto', padding: '6px 12px', fontWeight: 600 }} value={globalPicFilter} onChange={e => setGlobalPicFilter(e.target.value)}>
              <option value="Semua PIC">Semua PIC</option>
              {pics.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Waktu:</span>
            <select className="input" style={{ width: 'auto', padding: '6px 12px' }} value={globalTargetFilter} onChange={e => setGlobalTargetFilter(e.target.value)}>
              <option value="Hari Ini">Hari Ini</option>
              <option value="Minggu Ini">Minggu Ini</option>
              <option value="Bulan Ini">Bulan Ini</option>
              <option value="Semua Waktu">Semua Waktu</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            className="btn" 
            onClick={handleExportExcelSummary}
            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
          >
            <Download size={16} /> Export Excel
          </button>
          <button 
            className="btn" 
            onClick={handleExportPDF} 
            disabled={isExportingPdf}
            style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)', opacity: isExportingPdf ? 0.7 : 1 }}
          >
            <FileText size={16} /> {isExportingPdf ? 'Mengekspor...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Main Report Container for PDF export */}
      <div id="dashboard-report-container">
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Total Pekerjaan</span>
              <ListTodo size={20} color="var(--accent-primary)" />
            </div>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{total}</p>
          </div>

          <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Selesai</span>
              <CheckCircle size={20} color="var(--success)" />
            </div>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)' }}>{completed}</p>
          </div>

          <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Dalam Proses</span>
              <Clock size={20} color="var(--warning)" />
            </div>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--warning)' }}>{inProgress}</p>
          </div>

          <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Belum Dimulai</span>
              <AlertTriangle size={20} color="var(--text-secondary)" />
            </div>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{todo}</p>
          </div>

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
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '32px', borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <User size={24} color="var(--accent-primary)" />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Analisis Beban Kerja PIC: {globalPicFilter}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ringkasan seluruh tugas yang ditugaskan kepada {globalPicFilter}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Tugas</span>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{picTasks.length}</p>
              </div>
              <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Selesai</span>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success)' }}>{picDone}</p>
              </div>
              <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dalam Proses</span>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--warning)' }}>{picInProgress}</p>
              </div>
              <div style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Belum Dimulai</span>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{picTodo}</p>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid (Responsive) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div className="glass" style={{ padding: '24px', minHeight: '340px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Status Pekerjaan</h3>
            <div style={{ height: '240px', position: 'relative', width: '100%', margin: '0 auto' }}>
              <Doughnut data={statusData} options={statusOptions} />
            </div>
          </div>

          <div className="glass" style={{ padding: '24px', minHeight: '340px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Grafik Beban Kerja per PIC</h3>
            <div style={{ height: '240px', position: 'relative', width: '100%', margin: '0 auto' }}>
              <Bar data={picData} options={picOptions} />
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
            <div style={{ height: '240px', position: 'relative', width: '100%', margin: '0 auto' }}>
              <Bar data={categoryData} options={categoryOptions} />
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
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{t.nama}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>PIC: {t.pic} • Tenggat: {format(new Date(t.endDate), 'dd MMM yyyy')}</span>
                    {t.fileUrl && (
                      <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-primary)', marginLeft: '12px' }}>
                        <Paperclip size={12} /> {t.fileName || 'Lampiran'}
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${t.prioritas === 'Urgent' ? 'badge-urgent' : 'badge-high'}`}>{t.prioritas}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t.status}</span>
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
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Detail Pekerjaan Aktif</h3>
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
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('nama')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Nama Pekerjaan <ArrowUpDown size={14} /></div>
                  </th>
                  <th style={{ padding: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('kategori')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Kategori <ArrowUpDown size={14} /></div>
                  </th>
                  <th style={{ padding: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('pic')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>PIC <ArrowUpDown size={14} /></div>
                  </th>
                  <th style={{ padding: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('status')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Status <ArrowUpDown size={14} /></div>
                  </th>
                  <th style={{ padding: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('endDate')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Deadline <ArrowUpDown size={14} /></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {dynamicTableTasks.length > 0 ? dynamicTableTasks.map(t => {
                  const isOverdue = startOfDay(new Date(t.endDate)).getTime() < startOfDay(new Date()).getTime();
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.nama}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{t.kategori || 'Umum'}</td>
                      <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{t.pic}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${t.status === 'Done' ? 'badge-success' : t.status === 'In Progress' ? 'badge-warning' : 'badge-todo'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: isOverdue ? 'var(--danger)' : 'var(--text-primary)', fontWeight: isOverdue ? 600 : 400 }}>
                        {format(new Date(t.endDate), 'dd MMM yyyy')} {isOverdue && '(Terlewat)'}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Tidak ada pekerjaan aktif yang mendekati deadline.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
