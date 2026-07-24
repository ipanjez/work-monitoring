'use client';

import { useState } from 'react';
import { 
  BarChart3, TrendingUp, CheckCircle2, Clock, AlertCircle, FileText, Download, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement 
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { useNotifications } from '@/context/NotificationContext';

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
};

export default function ReportsClient({ tasks }: { tasks: Task[] }) {
  const { addActivityLog } = useNotifications();
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('All'); 
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // ... omitting the filter logic since we can't easily replace the middle without specifying exactly, let's just do a specific replace for the export and top imports separately.
  const filteredTasks = tasks.filter(t => {
    let matchDate = true;
    if (dateRangeFilter !== 'All') {
      const taskDate = new Date(t.endDate).getTime();
      const now = new Date();
      now.setHours(0,0,0,0);
      const todayTime = now.getTime();
      
      if (dateRangeFilter === 'Today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
        matchDate = taskDate >= startOfToday && taskDate <= endOfToday;
      } else if (dateRangeFilter === '7Days') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        matchDate = taskDate >= sevenDaysAgo.getTime() && taskDate <= todayTime;
      } else if (dateRangeFilter === '30Days') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        matchDate = taskDate >= thirtyDaysAgo.getTime() && taskDate <= todayTime;
      } else if (dateRangeFilter === 'ThisMonth') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
        matchDate = taskDate >= startOfMonth && taskDate <= endOfMonth;
      } else if (dateRangeFilter === 'ThisQuarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1).getTime();
        const endOfQuarter = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59).getTime();
        matchDate = taskDate >= startOfQuarter && taskDate <= endOfQuarter;
      } else if (dateRangeFilter === 'ThisYear') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59).getTime();
        matchDate = taskDate >= startOfYear && taskDate <= endOfYear;
      } else if (dateRangeFilter === 'Custom' && customStartDate && customEndDate) {
        const startCustom = new Date(customStartDate).getTime();
        const endCustom = new Date(customEndDate);
        endCustom.setHours(23, 59, 59, 999);
        matchDate = taskDate >= startCustom && taskDate <= endCustom.getTime();
      }
    }
    return matchDate;
  });

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'In Progress').length;
  const toDoTasks = filteredTasks.filter(t => t.status === 'To Do').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  filteredTasks.forEach(t => {
    const cat = t.kategori || 'Umum';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryLabels = Object.keys(categoryCounts);
  const categoryData = Object.values(categoryCounts);

  // Priority breakdown
  const urgentCount = filteredTasks.filter(t => t.prioritas === 'Urgent').length;
  const highCount = filteredTasks.filter(t => t.prioritas === 'High').length;
  const mediumCount = filteredTasks.filter(t => t.prioritas === 'Medium' || !t.prioritas).length;
  const lowCount = filteredTasks.filter(t => t.prioritas === 'Low').length;

  const categoryChartData = {
    labels: categoryLabels.length > 0 ? categoryLabels : ['Tidak ada data'],
    datasets: [{
      label: 'Jumlah Pekerjaan',
      data: categoryData.length > 0 ? categoryData : [0],
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'
      ],
      borderWidth: 0,
    }],
  };

  const priorityChartData = {
    labels: ['Urgent', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [urgentCount, highCount, mediumCount, lowCount],
      backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#10b981'],
      borderWidth: 0,
    }],
  };

  const handleExportFullReport = () => {
    const reportData = filteredTasks.map((t, idx) => ({
      'No': idx + 1,
      'Nama Pekerjaan': t.nama,
      'PIC': t.pic,
      'Kategori': t.kategori || 'Umum',
      'Prioritas': t.prioritas || 'Medium',
      'Status': t.status,
      'Progress': `${t.progress || 0}%`,
      'Tanggal Mulai': format(new Date(t.startDate), 'yyyy-MM-dd'),
      'Tenggat Waktu': format(new Date(t.endDate), 'yyyy-MM-dd'),
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    
    // Set Column Widths for neatness
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 35 }, // Nama Pekerjaan
      { wch: 20 }, // PIC
      { wch: 20 }, // Kategori
      { wch: 15 }, // Prioritas
      { wch: 15 }, // Status
      { wch: 12 }, // Progress
      { wch: 15 }, // Tanggal Mulai
      { wch: 15 }, // Tenggat Waktu
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Kinerja');
    XLSX.writeFile(wb, `Laporan_Kinerja_Departemen_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <motion.div 
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Analisis & Laporan Kinerja</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Rangkuman performa penyelesaian pekerjaan departemen secara komprehensif.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--text-secondary)" />
            <select className="input" style={{ width: 'auto', padding: '6px 12px' }} value={dateRangeFilter} onChange={e => setDateRangeFilter(e.target.value)}>
              <option value="All">Semua Waktu</option>
              <option value="Today">Hari Ini</option>
              <option value="7Days">7 Hari Terakhir</option>
              <option value="30Days">30 Hari Terakhir</option>
              <option value="ThisMonth">Bulan Ini</option>
              <option value="ThisQuarter">Triwulan Ini</option>
              <option value="ThisYear">Tahun Ini</option>
              <option value="Custom">Pilih Tanggal...</option>
            </select>
            {dateRangeFilter === 'Custom' && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input type="date" className="input" style={{ padding: '6px', fontSize: '13px' }} value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
                <span style={{ color: 'var(--text-secondary)' }}>-</span>
                <input type="date" className="input" style={{ padding: '6px', fontSize: '13px' }} value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={handleExportFullReport}>
            <Download size={16} /> Export (.xlsx)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <motion.div 
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}
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
            {completedTasks} dari {totalTasks} pekerjaan telah selesai
          </p>
        </div>

        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Pekerjaan Selesai</span>
            <CheckCircle2 size={20} color="var(--success)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success)' }}>{completedTasks}</div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Status Done</p>
        </div>

        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Dalam Proses</span>
            <Clock size={20} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--warning)' }}>{inProgressTasks}</div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Status In Progress</p>
        </div>

        <div className="glass" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Belum Dimulai</span>
            <AlertCircle size={20} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{toDoTasks}</div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Status To Do</p>
        </div>
      </motion.div>

      {/* Analytics Charts Grid */}
      <motion.div 
        style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="glass" style={{ flex: '1 1 400px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Distribusi Pekerjaan per Kategori
          </h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, animation: { duration: 1500, easing: 'easeOutQuart' } }} />
          </div>
        </div>

        <div className="glass" style={{ flex: '1 1 400px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Sebaran Prioritas Pekerjaan
          </h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center', position: 'relative', width: '100%' }}>
            <Doughnut data={priorityChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, animation: { duration: 1500, easing: 'easeOutQuart' } }} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
