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
import { Download, FileText, Filter, AlertTriangle, CheckCircle, Clock, ListTodo, User, Paperclip, Calendar, ArrowRight, Search, ArrowUpDown , Copy} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  LineElement,
  PointElement,
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
  const { globalTargetFilter, setGlobalTargetFilter, globalPicFilter, setGlobalPicFilter, globalCustomStartDate, setGlobalCustomStartDate, globalCustomEndDate, setGlobalCustomEndDate } = useFilter();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<'endDate' | 'nama' | 'pic' | 'kategori' | 'status'>('endDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAllActiveTasks, setShowAllActiveTasks] = useState(false);
  
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
    } else if (globalTargetFilter === 'Custom' && globalCustomStartDate && globalCustomEndDate) {
      startBoundary = new Date(globalCustomStartDate).getTime();
      endBoundary = new Date(globalCustomEndDate).setHours(23, 59, 59, 999);
    }

    let matchDate = false;
    if (globalTargetFilter === 'Semua Waktu' || (globalTargetFilter === 'Custom' && (!globalCustomStartDate || !globalCustomEndDate))) {
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

  // Timeline/Deadline Distribution (Line Chart)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const deadlineCounts = Array(12).fill(0);
  filteredTasks.forEach(t => {
    const d = new Date(t.endDate);
    if (d.getFullYear() === new Date().getFullYear()) {
      deadlineCounts[d.getMonth()]++;
    }
  });

  const timelineData = {
    labels: months,
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
        router.push(`/tasks?status=${encodeURIComponent(statusMap[index])}`);
      }
    }
  };

  const picOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top' as const, labels: { color: textColor, boxWidth: 12 } } },
    animation: { duration: 1500, easing: 'easeOutQuart' as const },
    scales: {
      y: { stacked: true, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
      x: { stacked: true, ticks: { color: textColor }, grid: { display: false } }
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
    onHover: (event: any, elements: any[]) => {
      if (event.native && event.native.target) {
        event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
      }
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
      doc.text(`Total Pekerjaan: ${total}   |   Selesai: ${completed}   |   Dalam Proses: ${inProgress}   |   Belum Dimulai: ${todo}   |   Rata-rata Progress: ${avgProgress}%`, 14, 30);

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
          format(new Date(t.endDate), 'dd MMM yyyy'),
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
      const canvas = await html2canvas(dashboardRef.current, {
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
            toast.success('Dashboard berhasil disalin sebagai gambar!');
          } catch (err) {
            console.error('Clipboard write error:', err);
            toast.error('Gagal menyalin gambar. Pastikan browser memberikan izin.');
          }
        }
      });
    } catch (error) {
      console.error('html2canvas error:', error);
      toast.error('Gagal membuat gambar dashboard.');
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
          <button 
            className="btn" 
            onClick={handleCopyImage}
            style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)' }}
          >
            <Copy size={16} /> Copy Image
          </button>
        </div>
      </div>

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Selesai:</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--success)' }}>{picDone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Proses:</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--warning)' }}>{picInProgress}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Belum:</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{picTodo}</span>
              </div>
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

          <div className="glass" style={{ padding: '24px', minHeight: '340px', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Tren Tenggat Waktu (Tahun Ini)</h3>
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
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{t.nama}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>PIC: {t.pic} 
                      {t.additionalPics && (() => {
                        try {
                          const arr = JSON.parse(t.additionalPics);
                          return Array.isArray(arr) && arr.length > 0 ? `, ${arr.join(', ')}` : '';
                        } catch(e) { return ''; }
                      })()}
                      • Tenggat: {format(new Date(t.endDate), 'dd MMM yyyy')}</span>
                    {t.deskripsi && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} dangerouslySetInnerHTML={{ __html: t.deskripsi }} />
                    )}
                    {t.fileUrl && (
                      <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-primary)', marginLeft: '12px', marginTop: '4px' }}>
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
                  <th style={{ padding: '16px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('endDate')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Tenggat Waktu <ArrowUpDown size={14} /></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(showAllActiveTasks ? dynamicTableTasks : dynamicTableTasks.slice(0, 10)).length > 0 ? (showAllActiveTasks ? dynamicTableTasks : dynamicTableTasks.slice(0, 10)).map(t => {
                  const isOverdue = startOfDay(new Date(t.endDate)).getTime() < startOfDay(new Date()).getTime();
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', cursor: 'pointer' }} onClick={() => router.push('/tasks')}>
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
                        {t.deskripsi || '-'}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 500, verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} color="var(--text-secondary)" />
                          {t.pic}
                          {t.additionalPics && (() => {
                            try {
                              const arr = JSON.parse(t.additionalPics);
                              return Array.isArray(arr) && arr.length > 0 ? `, ${arr.join(', ')}` : '';
                            } catch(e) { return ''; }
                          })()}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', verticalAlign: 'top' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--border-color)', fontSize: '12px', fontWeight: 500 }}>
                          {t.kategori || 'Umum'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <span className={`badge ${t.prioritas === 'Urgent' ? 'badge-urgent' : t.prioritas === 'High' ? 'badge-high' : t.prioritas === 'Low' ? 'badge-todo' : 'badge-warning'}`}>
                          {t.prioritas || 'Medium'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span className={`badge ${t.status === 'Done' ? 'badge-success' : t.status === 'In Progress' ? 'badge-warning' : 'badge-todo'}`} style={{ alignSelf: 'flex-start' }}>
                            {t.status}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px' }}>
                            <div className="progress-bar-bg" style={{ flex: 1, height: '6px' }}>
                              <div className="progress-bar-fill" style={{ width: `${t.progress || 0}%`, background: t.progress === 100 ? '#10b981' : 'var(--accent-primary)' }}></div>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.progress || 0}%</span>
                          </div>
                        </div>
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
    </motion.div>
  );
}
