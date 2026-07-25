'use client';

import { useState, useMemo } from 'react';
import { 
  TrendingUp, CheckCircle2, Clock, AlertCircle, Download, Calendar, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfDay } from 'date-fns';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement 
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { useNotifications } from '@/context/NotificationContext';
import { useFilter } from '@/context/FilterContext';
import { useTheme } from '@/context/ThemeContext';

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
  const completedTasks = filteredTasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'In Progress').length;
  const toDoTasks = filteredTasks.filter(t => t.status === 'To Do').length;

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
    labels: ['Done', 'In Progress', 'To Do'],
    datasets: [{
      data: [completedTasks, inProgressTasks, toDoTasks],
      backgroundColor: ['#10b981', '#f59e0b', '#94a3b8'],
      borderWidth: 0,
    }]
  };

  // 2. Distribusi Prioritas (Doughnut)
  const urgentCount = filteredTasks.filter(t => t.prioritas === 'Urgent').length;
  const highCount = filteredTasks.filter(t => t.prioritas === 'High').length;
  const mediumCount = filteredTasks.filter(t => t.prioritas === 'Medium' || !t.prioritas).length;
  const lowCount = filteredTasks.filter(t => t.prioritas === 'Low').length;
  
  const priorityData = {
    labels: ['Urgent', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [urgentCount, highCount, mediumCount, lowCount],
      backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#10b981'],
      borderWidth: 0,
    }]
  };

  // 3. Beban Kerja PIC (Bar)
  const picStats: Record<string, { done: number, inProgress: number, todo: number }> = {};
  filteredTasks.forEach(t => {
    const processPic = (p: string) => {
      if (!picStats[p]) picStats[p] = { done: 0, inProgress: 0, todo: 0 };
      if (t.status === 'Done') picStats[p].done++;
      else if (t.status === 'In Progress') picStats[p].inProgress++;
      else picStats[p].todo++;
    };
    if (t.pic) processPic(t.pic);
    if (t.additionalPics) {
      try {
        const arr = JSON.parse(t.additionalPics);
        if (Array.isArray(arr)) arr.forEach((p: string) => processPic(p));
      } catch (e) {}
    }
  });

  const sortedPics = Object.keys(picStats).sort((a, b) => 
    (picStats[b].done + picStats[b].inProgress + picStats[b].todo) - 
    (picStats[a].done + picStats[a].inProgress + picStats[a].todo)
  ).slice(0, 10); // Top 10

  const picWorkloadData = {
    labels: sortedPics,
    datasets: [
      { label: 'Done', data: sortedPics.map(p => picStats[p].done), backgroundColor: '#10b981' },
      { label: 'In Progress', data: sortedPics.map(p => picStats[p].inProgress), backgroundColor: '#f59e0b' },
      { label: 'To Do', data: sortedPics.map(p => picStats[p].todo), backgroundColor: '#94a3b8' }
    ]
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
    const reportData = filteredTasks.map((t, idx) => ({
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
      'Tanggal Mulai': format(new Date(t.startDate), 'yyyy-MM-dd'),
      'Tenggat Waktu': format(new Date(t.endDate), 'yyyy-MM-dd'),
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    
    ws['!cols'] = [
      { wch: 5 }, { wch: 35 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Kinerja');
    XLSX.writeFile(wb, `Laporan_Kinerja_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    addActivityLog?.('Export', 'Download Excel', `Mengunduh Laporan Kinerja (${filteredTasks.length} pekerjaan)`, 'success');
  };

  return (
    <motion.div 
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Analisis & Laporan Kinerja</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Rangkuman performa penyelesaian pekerjaan secara komprehensif.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleExportFullReport} style={{ whiteSpace: 'nowrap' }}>
          <Download size={16} /> Export (.xlsx)
        </button>
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
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Selesai / Dalam Proses</span>
            <CheckCircle2 size={20} color="var(--success)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--success)' }}>{completedTasks}</span> / <span style={{ color: 'var(--warning)' }}>{inProgressTasks}</span>
          </div>
        </div>

        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Belum Dimulai</span>
            <AlertCircle size={20} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{toDoTasks}</div>
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
