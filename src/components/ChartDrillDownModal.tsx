'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, ArrowRight, CheckCircle2, Clock, AlertCircle, 
  User, Calendar, ListTodo, Eye, Paperclip, CheckSquare, 
  Filter, Sparkles, ChevronRight, Layers, ArrowUpRight
} from 'lucide-react';
import { Task, getDynamicColor, getTaskFiles, getAdditionalPics, safeParseSubTasks, safeFormatDate } from '@/utils/taskUtils';
import { useTaskModal } from '@/context/TaskModalContext';
import { useFilter } from '@/context/FilterContext';
import { useRouter } from 'next/navigation';
import { format, isPast, isToday, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import Avatar from '@/components/Avatar';
import { useMaster } from '@/context/MasterContext';

export interface ChartDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  tasks: Task[];
  filterType?: 'status' | 'pic' | 'priority' | 'category' | 'overdue' | 'all' | 'custom';
  filterValue?: string;
}

// Helper to resolve Master Colors accurately
function resolveCategoryColor(cat: string, masterColors: Record<string, string>): string {
  if (!cat) return '#64748b';
  return (
    masterColors[`category_${cat}`] || 
    masterColors[`cat_${cat}`] || 
    masterColors[`kategori_${cat}`] || 
    masterColors[`category_${cat.toLowerCase()}`] ||
    masterColors[`cat_${cat.toLowerCase()}`] ||
    getDynamicColor('cat', cat) ||
    '#64748b'
  );
}

function resolvePriorityColor(p: string, masterColors: Record<string, string>): string {
  if (!p) return '#3b82f6';
  return (
    masterColors[`prioritas_${p}`] || 
    masterColors[`priority_${p}`] || 
    masterColors[`prioritas_${p.toLowerCase()}`] ||
    masterColors[`priority_${p.toLowerCase()}`] ||
    getDynamicColor('priority', p) ||
    (p === 'Urgent' ? '#ef4444' : p === 'High' ? '#f97316' : p === 'Low' ? '#10b981' : '#3b82f6')
  );
}

function resolveStatusColor(s: string, masterColors: Record<string, string>): string {
  if (!s) return '#3b82f6';
  return (
    masterColors[`status_${s}`] || 
    masterColors[`status_${s.toLowerCase()}`] || 
    getDynamicColor('status', s) ||
    (s.toLowerCase() === 'done' || s.toLowerCase() === 'selesai' ? '#10b981' : 
     s.toLowerCase().includes('progress') ? '#f59e0b' : 
     s.toLowerCase() === 'review' ? '#3b82f6' : '#94a3b8')
  );
}

// Clean HTML tags and strip unwanted system strings for clean snippet
function cleanDescriptionSnippet(rawDesc?: string | null): string {
  if (!rawDesc) return '';
  let clean = rawDesc.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.startsWith('📋 :') || clean.startsWith('🐱 :') || clean.startsWith(':') || clean.startsWith('🕒 :')) {
    return '';
  }
  return clean;
}

export default function ChartDrillDownModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badgeText,
  badgeColor = 'var(--accent-primary)',
  tasks,
  filterType = 'all',
  filterValue = '',
}: ChartDrillDownModalProps) {
  const router = useRouter();
  const { openDetail } = useTaskModal();
  const { 
    setGlobalFilterStatus, 
    setGlobalPicFilter, 
    setGlobalFilterPriority, 
    setGlobalFilterCategory,
    setGlobalTargetFilter,
    setGlobalSearchQuery
  } = useFilter();
  const { masterColors, masterPicAvatars } = useMaster();

  // Maintain dynamic tasks in state for real-time auto-updating
  const [currentTasks, setCurrentTasks] = useState<Task[]>(tasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');

  // Keep currentTasks in sync with initial tasks prop when modal opens or tasks prop changes
  useEffect(() => {
    setCurrentTasks(tasks);
  }, [tasks, isOpen]);

  // Real-time Auto-Update Listener: automatically updates tasks inside modal whenever any task is edited/added/deleted
  useEffect(() => {
    if (!isOpen) return;

    const refreshTasks = (freshAllTasks?: Task[]) => {
      const applyFilter = (allList: Task[]) => {
        if (!Array.isArray(allList)) return;
        const todayStart = startOfDay(new Date()).getTime();

        let matching = allList;
        if (filterType === 'status' && filterValue) {
          matching = allList.filter(t => t.status === filterValue);
        } else if (filterType === 'pic' && filterValue) {
          matching = allList.filter(t => t.pic === filterValue || getAdditionalPics(t).includes(filterValue));
        } else if (filterType === 'priority' && filterValue) {
          matching = allList.filter(t => (t.prioritas || 'Medium') === filterValue);
        } else if (filterType === 'category' && filterValue) {
          matching = allList.filter(t => (t.kategori || 'Umum') === filterValue);
        } else if (filterType === 'overdue') {
          matching = allList.filter(t => {
            const isDone = (t.status || '').toLowerCase() === 'done' || (t.status || '').toLowerCase() === 'selesai';
            return !isDone && t.endDate && startOfDay(new Date(t.endDate)).getTime() < todayStart;
          });
        } else if (filterType === 'custom') {
          const idMap = new Map(allList.map(t => [t.id, t]));
          matching = currentTasks.map(t => idMap.get(t.id) || t).filter(t => idMap.has(t.id));
        }

        setCurrentTasks(matching);
      };

      if (freshAllTasks && Array.isArray(freshAllTasks)) {
        applyFilter(freshAllTasks);
      } else {
        fetch('/api/tasks')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) applyFilter(data);
          })
          .catch(console.error);
      }
    };

    const handleRealtime = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        refreshTasks(e.detail);
      } else {
        refreshTasks();
      }
    };

    const handleTasksUpdated = () => {
      refreshTasks();
    };

    window.addEventListener('realtimeTasksUpdated', handleRealtime);
    window.addEventListener('tasksUpdated', handleTasksUpdated);

    return () => {
      window.removeEventListener('realtimeTasksUpdated', handleRealtime);
      window.removeEventListener('tasksUpdated', handleTasksUpdated);
    };
  }, [isOpen, filterType, filterValue]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = currentTasks.length;
    const done = currentTasks.filter(t => (t.status || '').toLowerCase() === 'done' || (t.status || '').toLowerCase() === 'selesai').length;
    const inProgress = currentTasks.filter(t => (t.status || '').toLowerCase().includes('progress') || (t.status || '').toLowerCase().includes('dikerjakan')).length;
    const todayStart = startOfDay(new Date()).getTime();
    const overdue = currentTasks.filter(t => {
      const isDone = (t.status || '').toLowerCase() === 'done' || (t.status || '').toLowerCase() === 'selesai';
      return !isDone && t.endDate && startOfDay(new Date(t.endDate)).getTime() < todayStart;
    }).length;
    return { total, done, inProgress, overdue };
  }, [currentTasks]);

  // Filter tasks based on internal modal search and status tab
  const filteredTasks = useMemo(() => {
    let result = currentTasks;

    // Filter by status tab if selected
    if (selectedStatusTab !== 'ALL') {
      if (selectedStatusTab === 'OVERDUE') {
        const todayStart = startOfDay(new Date()).getTime();
        result = result.filter(t => {
          const isDone = (t.status || '').toLowerCase() === 'done' || (t.status || '').toLowerCase() === 'selesai';
          return !isDone && t.endDate && startOfDay(new Date(t.endDate)).getTime() < todayStart;
        });
      } else {
        result = result.filter(t => t.status === selectedStatusTab);
      }
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase().trim();
    return result.filter(t => 
      t.nama.toLowerCase().includes(q) ||
      (t.pic && t.pic.toLowerCase().includes(q)) ||
      (t.kategori && t.kategori.toLowerCase().includes(q)) ||
      (t.status && t.status.toLowerCase().includes(q)) ||
      (t.prioritas && t.prioritas.toLowerCase().includes(q)) ||
      (t.deskripsi && t.deskripsi.toLowerCase().includes(q))
    );
  }, [currentTasks, searchQuery, selectedStatusTab]);

  const handleNavigateToTasks = () => {
    if (filterType === 'status' && filterValue) {
      setGlobalFilterStatus(filterValue);
      setGlobalFilterPriority('All');
      setGlobalFilterCategory('All');
      setGlobalPicFilter('Semua PIC');
      setGlobalTargetFilter('Semua Waktu');
    } else if (filterType === 'pic' && filterValue) {
      setGlobalPicFilter(filterValue);
      setGlobalFilterStatus('All');
      setGlobalFilterPriority('All');
      setGlobalFilterCategory('All');
      setGlobalTargetFilter('Semua Waktu');
    } else if (filterType === 'priority' && filterValue) {
      setGlobalFilterPriority(filterValue);
      setGlobalFilterStatus('All');
      setGlobalFilterCategory('All');
      setGlobalPicFilter('Semua PIC');
      setGlobalTargetFilter('Semua Waktu');
    } else if (filterType === 'category' && filterValue) {
      setGlobalFilterCategory(filterValue);
      setGlobalFilterStatus('All');
      setGlobalFilterPriority('All');
      setGlobalPicFilter('Semua PIC');
      setGlobalTargetFilter('Semua Waktu');
    } else if (filterType === 'overdue') {
      setGlobalTargetFilter('Terlewat');
      setGlobalFilterStatus('All');
      setGlobalFilterPriority('All');
      setGlobalFilterCategory('All');
      setGlobalPicFilter('Semua PIC');
    }

    if (searchQuery.trim()) {
      setGlobalSearchQuery(searchQuery.trim());
    }

    onClose();
    router.push('/tasks');
  };

  const handleRowClick = (task: Task) => {
    openDetail(task);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 10400, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '24px 16px' 
        }}
      >
        {/* Backdrop */}
        <motion.div 
          style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Dialog Box */}
        <motion.div 
          className="modal-content"
          style={{ 
            position: 'relative', 
            zIndex: 1, 
            width: '100%', 
            maxWidth: '1160px', 
            height: '90vh',
            maxHeight: '900px', 
            background: 'var(--surface-color)', 
            borderRadius: '20px', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column', 
            boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--border-color)',
            border: '1px solid var(--border-color)',
            padding: 0
          }}
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        >
          {/* Top Accent Strip */}
          <div style={{ height: '4px', width: '100%', background: `linear-gradient(90deg, ${badgeColor}, #3b82f6, #8b5cf6)` }} />

          {/* Premium Header */}
          <div 
            style={{ 
              padding: '20px 26px 16px', 
              borderBottom: '1px solid var(--border-color)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'var(--surface-color)',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div 
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '10px', 
                    backgroundColor: `${badgeColor}18`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: badgeColor,
                    border: `1px solid ${badgeColor}35`
                  }}
                >
                  <Layers size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                      {title}
                    </h3>
                    {badgeText && (
                      <span 
                        style={{ 
                          fontSize: '11.5px', 
                          fontWeight: 700, 
                          padding: '3px 10px', 
                          borderRadius: '12px', 
                          backgroundColor: `${badgeColor}18`, 
                          color: badgeColor,
                          border: `1px solid ${badgeColor}35`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badgeColor }} />
                        {badgeText}
                      </span>
                    )}
                  </div>
                  {subtitle && (
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '3px', margin: 0 }}>
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={handleNavigateToTasks}
                className="btn btn-primary"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '13px', 
                  padding: '9px 16px', 
                  borderRadius: '10px', 
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                title="Buka dan terapkan filter ini ke Daftar Pekerjaan"
              >
                <span>Buka di Daftar Pekerjaan</span>
                <ArrowUpRight size={16} />
              </button>
              <button 
                className="btn-icon" 
                onClick={onClose}
                style={{ 
                  borderRadius: '10px', 
                  padding: '8px', 
                  background: 'var(--input-bg)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Metrics & Search Bar */}
          <div 
            style={{ 
              padding: '12px 26px', 
              borderBottom: '1px solid var(--border-color)', 
              background: 'var(--input-bg)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            {/* Search Box */}
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text"
                placeholder="Cari pekerjaan, PIC, kategori, atau status..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px 32px 8px 36px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)', 
                  background: 'var(--surface-color)', 
                  color: 'var(--text-primary)', 
                  fontSize: '12.5px',
                  transition: 'border-color 0.2s ease'
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Status Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedStatusTab('ALL')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: selectedStatusTab === 'ALL' ? 'var(--accent-primary)' : 'var(--border-color)',
                  background: selectedStatusTab === 'ALL' ? 'var(--accent-primary)' : 'var(--surface-color)',
                  color: selectedStatusTab === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Semua ({stats.total})
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusTab(selectedStatusTab === 'Done' ? 'ALL' : 'Done')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: selectedStatusTab === 'Done' ? '#10b981' : 'var(--border-color)',
                  background: selectedStatusTab === 'Done' ? 'rgba(16, 185, 129, 0.18)' : 'var(--surface-color)',
                  color: selectedStatusTab === 'Done' ? '#10b981' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                ✓ Selesai ({stats.done})
              </button>

              {stats.overdue > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStatusTab(selectedStatusTab === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: selectedStatusTab === 'OVERDUE' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)',
                    background: selectedStatusTab === 'OVERDUE' ? 'rgba(239, 68, 68, 0.18)' : 'var(--surface-color)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  ⚠️ Overdue ({stats.overdue})
                </button>
              )}
            </div>
          </div>

          {/* List Table Container with sticky header & smooth scroll */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: 0 }} className="custom-scrollbar">
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-secondary)' }}>
                  <ListTodo size={28} />
                </div>
                <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>Tidak ada pekerjaan yang cocok</p>
                <p style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-secondary)' }}>Coba sesuaikan kata kunci pencarian atau pilih filter status lain.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', minWidth: '920px' }}>
                <thead>
                  <tr 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)', 
                      color: 'var(--text-secondary)', 
                      background: 'var(--surface-color)', 
                      position: 'sticky', 
                      top: 0, 
                      zIndex: 10,
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <th style={{ padding: '12px 24px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '38%' }}>
                      Pekerjaan
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '18%' }}>
                      PIC
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '13%' }}>
                      Kategori
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '10%' }}>
                      Prioritas
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '13%' }}>
                      Status & Progres
                    </th>
                    <th style={{ padding: '12px 24px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '8%', textAlign: 'right' }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => {
                    const files = getTaskFiles(t);
                    const cleanDesc = cleanDescriptionSnippet(t.deskripsi);
                    const deadlineDate = t.endDate ? new Date(t.endDate) : null;
                    const isDone = (t.status || '').toLowerCase() === 'done' || (t.status || '').toLowerCase() === 'selesai';
                    const isOverdue = deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate) && !isDone;
                    const isDueToday = deadlineDate && isToday(deadlineDate) && !isDone;
                    
                    const picAvatar = masterPicAvatars?.[t.pic];
                    const categoryColor = resolveCategoryColor(t.kategori || 'Umum', masterColors);
                    const priorityColor = resolvePriorityColor(t.prioritas || 'Medium', masterColors);
                    const statusColor = resolveStatusColor(t.status, masterColors);

                    // Subtasks count
                    const parsedSubs = safeParseSubTasks(t.subTasksJson);
                    const subTasksCount = parsedSubs.length;
                    const subTasksDone = parsedSubs.filter((s: any) => s.status === 'Done' || s.isDone).length;

                    // Additional PICs count
                    const addPics = getAdditionalPics(t);

                    return (
                      <tr 
                        key={t.id}
                        onClick={() => handleRowClick(t)}
                        className="table-row-hover"
                        style={{ 
                          borderBottom: '1px solid var(--border-color)', 
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                        title="Klik untuk membuka jendela tampilan detail pekerjaan ini"
                      >
                        {/* 1. Nama & Deskripsi Ringkas */}
                        <td style={{ padding: '14px 24px' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{t.nama}</span>
                              
                              {/* Attachment Count Badge */}
                              {files.length > 0 && (
                                <span 
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '3px', 
                                    fontSize: '11px', 
                                    fontWeight: 700,
                                    color: '#8b5cf6', 
                                    backgroundColor: 'rgba(139, 92, 246, 0.12)', 
                                    padding: '2px 6px', 
                                    borderRadius: '5px',
                                    border: '1px solid rgba(139, 92, 246, 0.25)' 
                                  }}
                                  title={`${files.length} berkas dokumen terlampir`}
                                >
                                  <Paperclip size={11} /> {files.length}
                                </span>
                              )}

                              {/* Subtasks Count Badge */}
                              {subTasksCount > 0 && (
                                <span 
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '3px', 
                                    fontSize: '11px', 
                                    fontWeight: 700,
                                    color: subTasksDone === subTasksCount ? '#10b981' : '#3b82f6', 
                                    backgroundColor: subTasksDone === subTasksCount ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)', 
                                    padding: '2px 6px', 
                                    borderRadius: '5px',
                                    border: `1px solid ${subTasksDone === subTasksCount ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)'}` 
                                  }}
                                  title={`${subTasksDone} dari ${subTasksCount} sub-pekerjaan selesai`}
                                >
                                  <CheckSquare size={11} /> {subTasksDone}/{subTasksCount}
                                </span>
                              )}
                            </div>

                            {/* Clean Description Snippet */}
                            {cleanDesc && (
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '420px', lineHeight: 1.4 }}>
                                {cleanDesc}
                              </p>
                            )}

                            {/* Target Date Pill below title if present */}
                            {deadlineDate && (
                              <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span 
                                  style={{ 
                                    fontSize: '11px', 
                                    fontWeight: 600, 
                                    color: isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : 'var(--text-secondary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Calendar size={11} />
                                  Target: {format(deadlineDate, 'd MMM yyyy', { locale: id })}
                                  {isOverdue && <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700, fontSize: '10px' }}>Overdue</span>}
                                  {isDueToday && <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 700, fontSize: '10px' }}>Hari Ini</span>}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 2. PIC Avatar & Name */}
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar name={t.pic} src={picAvatar} size={28} masterColors={masterColors} />
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                {t.pic}
                              </div>
                              {addPics.length > 0 && (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  +{addPics.length} anggota tim
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Kategori (Synced with Master Colors) */}
                        <td style={{ padding: '14px' }}>
                          <span 
                            style={{ 
                              fontSize: '11.5px', 
                              fontWeight: 600,
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              backgroundColor: `color-mix(in srgb, ${categoryColor} 14%, transparent)`, 
                              color: categoryColor, 
                              border: `1px solid ${categoryColor}40`, 
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
                            }}
                          >
                            {t.kategori || 'Umum'}
                          </span>
                        </td>

                        {/* 4. Prioritas (Synced with Master Colors) */}
                        <td style={{ padding: '14px' }}>
                          <span 
                            style={{ 
                              fontSize: '11.5px', 
                              fontWeight: 700, 
                              color: priorityColor, 
                              whiteSpace: 'nowrap', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '5px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: `color-mix(in srgb, ${priorityColor} 14%, transparent)`,
                              border: `1px solid ${priorityColor}40`
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: priorityColor }} />
                            {t.prioritas || 'Medium'}
                          </span>
                        </td>

                        {/* 5. Status & Progres (Synced with Master Colors) */}
                        <td style={{ padding: '14px' }}>
                          <div>
                            <span 
                              style={{ 
                                fontSize: '11.5px', 
                                fontWeight: 700, 
                                padding: '3px 9px', 
                                borderRadius: '6px', 
                                backgroundColor: `color-mix(in srgb, ${statusColor} 15%, transparent)`, 
                                color: statusColor, 
                                border: `1px solid ${statusColor}40`,
                                whiteSpace: 'nowrap',
                                display: 'inline-block'
                              }}
                            >
                              {t.status}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                              <div className="progress-container" style={{ flex: 1, height: '5px', minWidth: '60px', background: 'var(--input-bg)', borderRadius: '3px' }}>
                                <div className="progress-bar" style={{ width: `${t.progress || 0}%`, backgroundColor: statusColor, borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>{t.progress || 0}%</span>
                            </div>
                          </div>
                        </td>

                        {/* 6. Quick Action Button */}
                        <td style={{ padding: '14px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button 
                            className="btn-icon" 
                            style={{ 
                              padding: '6px 10px', 
                              borderRadius: '8px',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--accent-primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(t);
                            }}
                            title="Lihat Detail Lengkap"
                          >
                            <Eye size={14} />
                            <span>Lihat</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Clean Executive Footer */}
          <div 
            style={{ 
              padding: '14px 26px', 
              borderTop: '1px solid var(--border-color)', 
              background: 'var(--surface-color)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '12.5px', 
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                Menampilkan {filteredTasks.length} dari {currentTasks.length} pekerjaan
              </span>
              <span>•</span>
              <span>Klik pada baris mana pun untuk melihat rincian lengkap tugas.</span>
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={onClose} 
              style={{ fontSize: '12.5px', padding: '7px 18px', borderRadius: '8px', fontWeight: 600 }}
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
