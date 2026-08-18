'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { 
  Users, UserCheck, CheckCircle2, Clock, Activity, ShieldCheck, 
  Mail, Phone, ExternalLink, X, History, Paperclip, Eye, File, 
  CalendarDays, Download, FileText, Copy, FileSpreadsheet, Loader2,
  Plus, AlertTriangle, Sparkles, Filter, ChevronRight, Share2, Award
} from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { 
  Task, FileItem, SubTask, LogItem, getTaskFiles, getAdditionalPics, 
  getHistoryLogs, getPriorityBadgeClass, getDynamicBadgeStyle, 
  getGoogleCalendarUrl, handleExportICS, getTaskExportRow 
} from '@/utils/taskUtils';
import { exportToRichExcel } from '@/utils/excelExport';
import { useMaster } from '@/context/MasterContext';
import { useFilter } from '@/context/FilterContext';
import FilePreviewModal from '@/components/FilePreviewModal';
import TaskDetailModal from '@/components/TaskDetailModal';
import TaskAddEditModal from '@/components/TaskAddEditModal';
import UniversalFilterBar from '@/components/UniversalFilterBar';
import UniversalActionBar from '@/components/UniversalActionBar';
import { checkSearchMatch } from '@/utils/searchUtils';
import Avatar from '@/components/Avatar';
import { useSession } from 'next-auth/react';
import { hasPermission, RolePermissionsConfig, defaultRolePermissions } from '@/lib/permissions';
import { copyToClipboard } from '@/utils/clipboard';

type WorkloadFilter = 'all' | 'high' | 'optimal' | 'low';
type TaskTabFilter = 'all' | 'in_progress' | 'done' | 'urgent';

export default function TeamClient({ tasks: initialTasks }: { tasks: Task[] }) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'MEMBER';
  const { masterColors, masterPicAvatars, roleConfig } = useMaster();
  const { 
    globalTargetFilter, globalPicFilter, globalCustomStartDate, globalCustomEndDate,
    globalFilterStatus, globalFilterPriority, globalFilterCategory, globalSearchQuery, globalSearchExactMatch
  } = useFilter();
  
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
  const [selectedPic, setSelectedPic] = useState<string | null>(null);
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilter>('all');
  const [taskTabFilter, setTaskTabFilter] = useState<TaskTabFilter>('all');
  
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  const [masterPics, setMasterPics] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>([]);
  const [masterPriorities, setMasterPriorities] = useState<string[]>([]);
  const [masterCategories, setMasterCategories] = useState<string[]>([]);
  
  useEffect(() => {
    setLocalTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    if (detailTask) {
      const updated = localTasks.find(t => t.id === detailTask.id);
      if (updated && updated !== detailTask) {
        setDetailTask(updated);
      }
    }
  }, [localTasks, detailTask]);

  useEffect(() => {
    const loadMasterPics = () => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.master_pics) setMasterPics(data.master_pics);
          if (data.master_statuses) setMasterStatuses(data.master_statuses);
          if (data.master_priorities) setMasterPriorities(data.master_priorities);
          if (data.master_categories) setMasterCategories(data.master_categories);
        })
        .catch(e => console.error(e));
    };
    loadMasterPics();
    window.addEventListener('tasksUpdated', loadMasterPics);
    return () => window.removeEventListener('tasksUpdated', loadMasterPics);
  }, []);

  const todayStart = startOfDay(new Date()).getTime();

  // Filter tasks based on global universal filters
  const filteredTasks = useMemo(() => {
    return localTasks.filter(t => {
      // Filter PIC
      if (globalPicFilter !== 'Semua PIC') {
        let isMatch = false;
        if (t.pic === globalPicFilter) isMatch = true;
        if (t.additionalPics) {
          try {
            const arr = JSON.parse(t.additionalPics);
            if (Array.isArray(arr) && arr.includes(globalPicFilter)) isMatch = true;
          } catch (e) {}
        }
        if (!isMatch) return false;
      }

      // Filter Tanggal
      const taskEnd = new Date(t.endDate).getTime();
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

      let matchesTarget = false;
      if (globalTargetFilter === 'Semua Waktu' || (globalTargetFilter === 'Custom' && (!globalCustomStartDate || !globalCustomEndDate))) {
        matchesTarget = true;
      } else {
        if (taskEnd >= startBoundary && taskEnd <= endBoundary) {
          matchesTarget = true;
        }
      }
      if (!matchesTarget) return false;

      // Status Filter
      if (globalFilterStatus !== 'All' && t.status !== globalFilterStatus) return false;

      // Priority Filter
      if (globalFilterPriority !== 'All' && (t.prioritas || 'Medium') !== globalFilterPriority) return false;

      // Category Filter
      if (globalFilterCategory !== 'All' && (t.kategori || 'Umum') !== globalFilterCategory) return false;

      // Search Filter
      if (globalSearchQuery) {
        if (!checkSearchMatch(t, globalSearchQuery, globalSearchExactMatch)) return false;
      }

      return true;
    });
  }, [localTasks, globalPicFilter, globalTargetFilter, globalCustomStartDate, globalCustomEndDate, globalFilterStatus, globalFilterPriority, globalFilterCategory, globalSearchQuery, globalSearchExactMatch]);

  // Group tasks by PIC
  const picStatsMap: Record<string, { total: number; urgent: number; done: number; inProgress: number; overdue: number; tasks: Task[]; statusCounts: Record<string, number> }> = {};
  
  masterPics.forEach(pic => {
    picStatsMap[pic] = { total: 0, urgent: 0, done: 0, inProgress: 0, overdue: 0, tasks: [], statusCounts: {} };
  });

  filteredTasks.forEach(t => {
    let picNames = [t.pic || 'Unassigned'];
    if (t.additionalPics) {
      try {
        const extra = JSON.parse(t.additionalPics);
        if (Array.isArray(extra)) {
          picNames = picNames.concat(extra.filter(Boolean));
        }
      } catch(e) {}
    }
    picNames = Array.from(new Set(picNames));

    const isDone = t.status === 'Done' || t.status === 'Selesai';
    const isOverdue = !isDone && startOfDay(new Date(t.endDate)).getTime() < todayStart;

    picNames.forEach(picName => {
      if (!picStatsMap[picName]) {
        picStatsMap[picName] = { total: 0, urgent: 0, done: 0, inProgress: 0, overdue: 0, tasks: [], statusCounts: {} };
      }
      const stat = picStatsMap[picName];
      stat.total += 1;
      
      const status = t.status || 'To Do';
      stat.statusCounts[status] = (stat.statusCounts[status] || 0) + 1;

      if (t.prioritas === 'Urgent') stat.urgent += 1;
      if (isDone) stat.done += 1;
      if (t.status === 'In Progress' || t.status === 'Sedang Dikerjakan') stat.inProgress += 1;
      if (isOverdue) stat.overdue += 1;

      stat.tasks.push(t);
    });
  });

  let picList = Object.keys(picStatsMap);
  if (globalPicFilter !== 'Semua PIC') {
    picList = picList.filter(p => p === globalPicFilter || (picStatsMap[p] && picStatsMap[p].total > 0));
  }

  // Workload Capacity Filter
  const filteredPicList = useMemo(() => {
    return picList.filter(picName => {
      const activeTasks = (picStatsMap[picName]?.total || 0) - (picStatsMap[picName]?.done || 0);
      if (workloadFilter === 'high') return activeTasks > 5;
      if (workloadFilter === 'optimal') return activeTasks >= 2 && activeTasks <= 5;
      if (workloadFilter === 'low') return activeTasks <= 1;
      return true;
    });
  }, [picList, picStatsMap, workloadFilter]);

  // Overall Team KPI metrics
  const totalPicsCount = picList.length;
  const activePicsCount = picList.filter(p => (picStatsMap[p]?.inProgress || 0) > 0 || (picStatsMap[p]?.total || 0) > 0).length;
  const totalTeamTasks = filteredTasks.length;
  const totalTeamDone = filteredTasks.filter(t => t.status === 'Done' || t.status === 'Selesai').length;
  const teamDoneRate = totalTeamTasks > 0 ? Math.round((totalTeamDone / totalTeamTasks) * 100) : 0;

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      const isNew = !editForm.id;
      const url = isNew ? '/api/tasks' : `/api/tasks/${editForm.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        ...editForm,
        startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
        endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined,
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Gagal menyimpan pekerjaan');
      const savedTask = await res.json();
      
      if (isNew) {
        setLocalTasks(prev => [savedTask, ...prev]);
      } else {
        setLocalTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
      }
      setDetailTask(savedTask);
      setIsEditing(false);
      toast.success(isNew ? 'Pekerjaan baru berhasil dibuat' : 'Pekerjaan berhasil diperbarui');
      
      startTransition(() => {
        router.refresh();
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
      });
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = (task: Task) => {
    let repetisiValue = task.repetisi || 'Tidak Berulang';
    let parsedSubTasks: SubTask[] = [];
    if (task.subTasksJson) {
      try {
        const raw = JSON.parse(task.subTasksJson);
        if (Array.isArray(raw)) {
          parsedSubTasks = raw.map((st: any) => ({
            ...st,
            id: Math.random().toString(36).substring(2, 9),
          }));
        }
      } catch (e) {}
    }

    const startStr = task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const endStr = task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    setEditForm({
      nama: task.nama,
      pic: task.pic,
      status: task.status,
      prioritas: task.prioritas || 'Medium',
      kategori: task.kategori || 'Umum',
      progress: task.progress || 0,
      deskripsi: task.deskripsi || '',
      catatan: task.catatan || '',
      lokasi: task.lokasi,
      repetisi: repetisiValue,
      startDate: startStr,
      endDate: endStr,
      isCustomCategory: false,
      isCustomPic: false,
      filesList: getTaskFiles(task),
      additionalPicsList: getAdditionalPics(task),
      subTasksList: parsedSubTasks
    } as any);
    setDetailTask(null);
    setIsEditing(true);
    toast.success('Pekerjaan berhasil diduplikasi.');
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pekerjaan ini? Tindakan ini tidak dapat dibatalkan.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus pekerjaan');
      
      setLocalTasks(prev => prev.filter(t => t.id !== id));
      if (detailTask && detailTask.id === id) setDetailTask(null);
      
      toast.success('Pekerjaan berhasil dihapus');
      startTransition(() => {
        router.refresh();
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('tasksUpdated'));
      });
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    toast.loading('Mengekspor Manajemen Tim...', { id: 'export-excel-team' });
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
        `Manajemen_Tim_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        false
      );
      if (success) {
        toast.success('Manajemen Tim berhasil diekspor 📊', { id: 'export-excel-team' });
      } else {
        toast.error('Gagal mengekspor Excel', { id: 'export-excel-team' });
      }
    } catch (error) {
      console.error('Excel Export error:', error);
      toast.error('Gagal mengekspor Excel', { id: 'export-excel-team' });
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPdf(true);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('team-container');
      if (!element) {
        setIsExportingPdf(false);
        return;
      }

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape');
      pdf.addImage(imgData, 'PNG', 10, 10, 277, (canvas.height * 277) / canvas.width);
      pdf.save(`Manajemen_Tim_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Laporan PDF Tim berhasil diunduh 📄');
    } catch (e) {
      console.error(e);
      toast.error('Gagal membuat PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyImage = async () => {
    const element = document.getElementById('team-container');
    if (!element) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            toast.success('Gambar tim berhasil disalin ke clipboard! 📋');
          } catch (err) {
            toast.error('Gagal menyalin gambar.');
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNewTaskForPic = (picName: string) => {
    setEditForm({
      nama: '',
      pic: picName,
      status: masterStatuses[0] || 'To Do',
      prioritas: 'Medium',
      kategori: 'Umum',
      progress: 0,
      deskripsi: '',
      catatan: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      filesList: [],
      additionalPicsList: [],
      subTasksList: []
    });
    setIsEditing(true);
  };

  return (
    <div id="team-container" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={26} color="var(--accent-primary)" />
            Manajemen Tim & Distribusi Beban Kerja
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            Monitoring kapasitas kerja, penugasan pekerjaan, dan progres performa seluruh personil (PIC).
          </p>
        </div>
      </div>

      {/* Team KPI Quick Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass" style={{ padding: '16px 20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Personil PIC</span>
            <Users size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>{totalPicsCount}</div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{activePicsCount} personil memiliki tugas aktif</span>
        </div>

        <div className="glass" style={{ padding: '16px 20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Pekerjaan Ditangani</span>
            <Activity size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#3b82f6' }}>{totalTeamTasks}</div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Total beban kerja tim saat ini</span>
        </div>

        <div className="glass" style={{ padding: '16px 20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Penyelesaian Tugas</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981' }}>{teamDoneRate}%</div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{totalTeamDone} dari {totalTeamTasks} tugas terselesaikan</span>
        </div>

        <div className="glass" style={{ padding: '16px 20px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Rata-rata Beban</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b' }}>
            {totalPicsCount > 0 ? (totalTeamTasks / totalPicsCount).toFixed(1) : '0'}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Tugas per personil PIC</span>
        </div>
      </div>

      {/* Global Synchronized Filters */}
      <UniversalFilterBar 
        categories={masterCategories} 
        pics={masterPics} 
        statuses={masterStatuses.length > 0 ? masterStatuses : undefined} 
        priorities={masterPriorities.length > 0 ? masterPriorities : undefined} 
        filteredCount={filteredTasks.length}
        totalCount={localTasks.length}
      >
        <UniversalActionBar 
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          isExportingPdf={isExportingPdf}
          onCopyImage={handleCopyImage}
          canExport={hasPermission(roleConfig, 'export_data', userRole)}
        />
      </UniversalFilterBar>

      {/* Workload Matrix Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>
          Kapasitas Beban:
        </span>
        {[
          { id: 'all', label: 'Semua Anggota', count: picList.length },
          { id: 'high', label: '🔴 Beban Tinggi (>5)', count: picList.filter(p => ((picStatsMap[p]?.total || 0) - (picStatsMap[p]?.done || 0)) > 5).length },
          { id: 'optimal', label: '🟡 Optimal (2-5)', count: picList.filter(p => { const a = (picStatsMap[p]?.total || 0) - (picStatsMap[p]?.done || 0); return a >= 2 && a <= 5; }).length },
          { id: 'low', label: '🟢 Ringan / Kosong (0-1)', count: picList.filter(p => ((picStatsMap[p]?.total || 0) - (picStatsMap[p]?.done || 0)) <= 1).length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setWorkloadFilter(tab.id as WorkloadFilter)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: workloadFilter === tab.id ? 'var(--accent-primary)' : 'var(--border-color)',
              background: workloadFilter === tab.id ? 'rgba(59, 130, 246, 0.12)' : 'var(--surface-color)',
              color: workloadFilter === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: workloadFilter === tab.id ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{tab.label}</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Team Cards Grid */}
      <div id="team-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        {filteredPicList.map((picName) => {
          const stat = picStatsMap[picName] || { total: 0, done: 0, inProgress: 0, urgent: 0, overdue: 0, tasks: [], statusCounts: {} };
          const activeTasks = stat.total - stat.done;
          const rate = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
          const isSelected = selectedPic === picName;
          
          // Capacity Tag
          const capacityStatus = activeTasks > 5 
            ? { label: 'Beban Tinggi', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' }
            : activeTasks >= 2 
            ? { label: 'Optimal', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }
            : { label: 'Kapasitas Tersedia', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };

          return (
            <div 
              key={picName} 
              className="glass" 
              style={{ 
                padding: '20px', 
                borderRadius: '14px',
                border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: isSelected ? '0 8px 24px rgba(59, 130, 246, 0.15)' : 'none'
              }}
              onClick={() => setSelectedPic(isSelected ? null : picName)}
            >
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar
                    name={picName}
                    src={masterPicAvatars?.[picName]}
                    size={46}
                    masterColors={masterColors}
                  />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{picName}</h3>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Person In Charge</span>
                  </div>
                </div>

                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: capacityStatus.bg,
                  color: capacityStatus.color,
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {capacityStatus.label}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Tingkat Selesai: <strong style={{ color: 'var(--text-primary)' }}>{stat.done}/{stat.total}</strong></span>
                  <span style={{ fontWeight: 800, color: rate === 100 ? '#10b981' : 'var(--accent-primary)' }}>{rate}%</span>
                </div>
                <div className="progress-container" style={{ height: '7px', borderRadius: '4px' }}>
                  <div className="progress-bar" style={{ width: `${rate}%`, backgroundColor: rate === 100 ? '#10b981' : 'var(--accent-primary)' }} />
                </div>
              </div>

              {/* Status Mini Badges Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center', background: 'var(--input-bg)', padding: '8px', borderRadius: '8px', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>{stat.total}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>Selesai</span>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#10b981' }}>{stat.done}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>Proses</span>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#3b82f6' }}>{stat.inProgress}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>Overdue</span>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: stat.overdue > 0 ? '#ef4444' : 'var(--text-secondary)' }}>{stat.overdue}</span>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11.5px', color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isSelected ? 'Tutup Daftar Tugas ▲' : 'Lihat Daftar Tugas ▼'}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddNewTaskForPic(picName);
                  }}
                  title={`Tambah pekerjaan untuk ${picName}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 6px',
                    borderRadius: '6px'
                  }}
                >
                  <Plus size={13} /> Tugas Baru
                </button>
              </div>
            </div>
          );
        })}

        {filteredPicList.length === 0 && (
          <div className="glass" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1', borderRadius: '14px' }}>
            <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <p style={{ fontSize: '13.5px', margin: 0, fontWeight: 600 }}>Tidak ada personil PIC pada filter kapasitas ini.</p>
          </div>
        )}
      </div>

      {/* Selected PIC Detail Table Section */}
      {selectedPic && picStatsMap[selectedPic] && (
        <motion.div 
          id="team-pic-detail-table" 
          className="glass" 
          style={{ padding: '22px', borderRadius: '14px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar 
                name={selectedPic} 
                src={masterPicAvatars?.[selectedPic]} 
                size={36} 
                masterColors={masterColors} 
              />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Daftar Pekerjaan Ditangani: <span style={{ color: 'var(--accent-primary)' }}>{selectedPic}</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Total {picStatsMap[selectedPic].tasks.length} pekerjaan terdaftar
                </span>
              </div>
            </div>

            {/* Task Status Filters */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'Semua', count: picStatsMap[selectedPic].tasks.length },
                { id: 'in_progress', label: 'On Progress', count: picStatsMap[selectedPic].inProgress },
                { id: 'done', label: 'Selesai', count: picStatsMap[selectedPic].done },
                { id: 'urgent', label: 'Urgent/Overdue', count: picStatsMap[selectedPic].urgent + picStatsMap[selectedPic].overdue },
              ].map(tTab => (
                <button
                  key={tTab.id}
                  onClick={() => setTaskTabFilter(tTab.id as TaskTabFilter)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: taskTabFilter === tTab.id ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: taskTabFilter === tTab.id ? 'rgba(59, 130, 246, 0.12)' : 'var(--input-bg)',
                    color: taskTabFilter === tTab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '11.5px',
                    fontWeight: taskTabFilter === tTab.id ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {tTab.label} ({tTab.count})
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', background: 'var(--input-bg)' }}>
                  <th style={{ padding: '10px 12px', borderRadius: '6px 0 0 6px' }}>Nama Pekerjaan</th>
                  <th style={{ padding: '10px 12px' }}>Kategori</th>
                  <th style={{ padding: '10px 12px' }}>Prioritas</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Progress</th>
                  <th style={{ padding: '10px 12px' }}>Tenggat Waktu</th>
                  {hasPermission(roleConfig, 'view_detail', userRole) && (
                    <th style={{ padding: '10px 12px', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {picStatsMap[selectedPic].tasks
                  .filter(t => {
                    const isDone = t.status === 'Done' || t.status === 'Selesai';
                    const isOverdue = !isDone && startOfDay(new Date(t.endDate)).getTime() < todayStart;
                    if (taskTabFilter === 'in_progress') return t.status === 'In Progress' || t.status === 'Sedang Dikerjakan';
                    if (taskTabFilter === 'done') return isDone;
                    if (taskTabFilter === 'urgent') return t.prioritas === 'Urgent' || isOverdue;
                    return true;
                  })
                  .map(t => {
                    const isDone = t.status === 'Done' || t.status === 'Selesai';
                    const isOverdue = !isDone && startOfDay(new Date(t.endDate)).getTime() < todayStart;

                    return (
                      <tr 
                        key={t.id} 
                        style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--input-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td 
                          style={{ 
                            padding: '11px 12px', 
                            fontWeight: 600, 
                            color: hasPermission(roleConfig, 'view_detail', userRole) ? 'var(--accent-primary)' : 'var(--text-primary)', 
                            cursor: hasPermission(roleConfig, 'view_detail', userRole) ? 'pointer' : 'default' 
                          }} 
                          onClick={() => { 
                            if (hasPermission(roleConfig, 'view_detail', userRole)) {
                              setDetailTask(t); 
                              setEditForm(t); 
                              setIsEditing(false); 
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{t.nama}</span>
                            {isOverdue && (
                              <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>
                                Terlewat
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '11px 12px' }}>{t.kategori || 'Umum'}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <span className={`badge ${getPriorityBadgeClass(t.prioritas)}`}>
                            {t.prioritas || 'Medium'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <span {...getDynamicBadgeStyle('status', t.status, 'badge', masterColors)}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div className="progress-container" style={{ width: '60px', height: '6px', borderRadius: '3px' }}>
                              <div className="progress-bar" style={{ width: `${t.progress || 0}%`, backgroundColor: t.progress === 100 ? '#10b981' : 'var(--accent-primary)' }} />
                            </div>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{t.progress || 0}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 12px', fontSize: '12px' }}>
                          {format(new Date(t.endDate), 'dd MMM yyyy')}{!t.isAllDay && t.endTime ? `, ${t.endTime}` : ''}
                        </td>
                        {hasPermission(roleConfig, 'view_detail', userRole) && (
                          <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11.5px' }} 
                              onClick={() => { setDetailTask(t); setEditForm(t); setIsEditing(false); }}
                            >
                              Detail
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Task Modals */}
      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
        setPreviewFile={setPreviewFile}
        onDuplicate={() => {
          if (detailTask) handleDuplicate(detailTask);
        }}
        onEdit={() => {
          let repetisiValue = detailTask!.repetisi || 'Tidak Berulang';
          let parsedSubTasks: SubTask[] = [];
          if (detailTask!.subTasksJson) {
            try {
              parsedSubTasks = JSON.parse(detailTask!.subTasksJson);
            } catch (e) {}
          }

          setEditForm({
            ...detailTask!,
            repetisi: repetisiValue,
            startDate: detailTask!.startDate ? new Date(detailTask!.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: detailTask!.endDate ? new Date(detailTask!.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            isCustomCategory: false,
            isCustomPic: false,
            filesList: getTaskFiles(detailTask!),
            additionalPicsList: getAdditionalPics(detailTask!),
            subTasksList: parsedSubTasks
          });
          setIsEditing(true);
        }}
        onDelete={() => handleDeleteTask(detailTask!.id)}
      />

      <TaskAddEditModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        taskToEdit={editForm as Task}
        onSave={handleSaveEdit}
        formPicOptions={[...masterPics]}
        formCategoryOptions={masterCategories} 
        setPreviewFile={setPreviewFile}
      />
      
      <FilePreviewModal previewFile={previewFile} setPreviewFile={setPreviewFile} />
    </div>
  );
}