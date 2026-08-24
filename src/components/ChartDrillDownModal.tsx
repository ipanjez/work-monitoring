'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, ArrowRight, CheckCircle2, Clock, AlertCircle, 
  User, Calendar, ListTodo, Eye, Paperclip, ExternalLink, Filter 
} from 'lucide-react';
import { Task, getDynamicBadgeStyle, getTaskFiles, getAdditionalPics } from '@/utils/taskUtils';
import { useTaskModal } from '@/context/TaskModalContext';
import { useFilter } from '@/context/FilterContext';
import { useRouter } from 'next/navigation';
import { format, isPast, isToday } from 'date-fns';
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

  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks based on internal modal search
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter(t => 
      t.nama.toLowerCase().includes(q) ||
      (t.pic && t.pic.toLowerCase().includes(q)) ||
      (t.kategori && t.kategori.toLowerCase().includes(q)) ||
      (t.status && t.status.toLowerCase().includes(q)) ||
      (t.prioritas && t.prioritas.toLowerCase().includes(q)) ||
      (t.deskripsi && t.deskripsi.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery]);

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
          padding: '20px' 
        }}
      >
        {/* Backdrop */}
        <motion.div 
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Dialog */}
        <motion.div 
          className="modal-content"
          style={{ 
            position: 'relative', 
            zIndex: 1, 
            width: '100%', 
            maxWidth: '920px', 
            maxHeight: '88vh', 
            background: 'var(--surface-color)', 
            borderRadius: '18px', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border-color)',
            padding: 0
          }}
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div 
            style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid var(--border-color)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              background: 'var(--surface-color)',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {title}
                </h3>
                {badgeText && (
                  <span 
                    style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      padding: '3px 10px', 
                      borderRadius: '12px', 
                      backgroundColor: `${badgeColor}20`, 
                      color: badgeColor,
                      border: `1px solid ${badgeColor}40`
                    }}
                  >
                    {badgeText}
                  </span>
                )}
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  ({tasks.length} pekerjaan)
                </span>
              </div>
              {subtitle && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                  {subtitle}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={handleNavigateToTasks}
                className="btn btn-primary"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '13px', 
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontWeight: 600
                }}
              >
                <span>Buka di Daftar Pekerjaan</span>
                <ArrowRight size={15} />
              </button>
              <button 
                className="btn-icon" 
                onClick={onClose}
                style={{ borderRadius: '8px', padding: '6px' }}
                title="Tutup"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar inside modal */}
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--input-bg)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text"
                placeholder="Cari dalam rincian data ini (nama, PIC, kategori, status)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px 8px 36px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-color)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              Menampilkan {filteredTasks.length} dari {tasks.length}
            </span>
          </div>

          {/* List / Table Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
                <ListTodo size={42} color="var(--text-secondary)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>Tidak ada pekerjaan yang cocok</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>Coba ubah kata kunci pencarian Anda.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', background: 'var(--surface-color)', position: 'sticky', top: 0, zIndex: 2 }}>
                    <th style={{ padding: '12px 18px', fontWeight: 600, width: '40%' }}>Pekerjaan</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>PIC</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Kategori</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Prioritas</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Status & Progres</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Target Selesai</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t, idx) => {
                    const files = getTaskFiles(t);
                    const deadlineDate = t.endDate ? new Date(t.endDate) : null;
                    const isOverdue = deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate) && (t.status || '').toLowerCase() !== 'done';
                    const picColor = masterColors[t.pic] || 'var(--accent-primary)';
                    const picAvatar = masterPicAvatars[t.pic];
                    const statusColor = masterColors['status_' + t.status] || 'var(--accent-primary)';
                    const priorityColor = masterColors['priority_' + t.prioritas] || (
                      t.prioritas === 'Urgent' ? '#ef4444' :
                      t.prioritas === 'High' ? '#f97316' :
                      t.prioritas === 'Medium' ? '#f59e0b' : '#10b981'
                    );

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
                        title="Klik untuk membuka dan mengedit pekerjaan ini"
                      >
                        {/* Nama & Info */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{t.nama}</span>
                                {files.length > 0 && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)', padding: '1px 5px', borderRadius: '4px' }}>
                                    <Paperclip size={11} /> {files.length}
                                  </span>
                                )}
                              </div>
                              {t.deskripsi && (
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                                  {t.deskripsi}
                                </p>
                              )}
                            </div>
                            <button 
                              className="btn-icon" 
                              style={{ padding: '4px', opacity: 0.7 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(t);
                              }}
                              title="Lihat Detail Pekerjaan"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>

                        {/* PIC */}
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar name={t.pic} src={picAvatar} size={26} masterColors={masterColors} />
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                              {t.pic}
                            </span>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                            {t.kategori || 'Umum'}
                          </span>
                        </td>

                        {/* Prioritas */}
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: priorityColor, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: priorityColor }} />
                            {t.prioritas || 'Medium'}
                          </span>
                        </td>

                        {/* Status & Progress */}
                        <td style={{ padding: '14px' }}>
                          <div>
                            <span 
                              style={{ 
                                fontSize: '11.5px', 
                                fontWeight: 600, 
                                padding: '2px 8px', 
                                borderRadius: '6px', 
                                backgroundColor: `${statusColor}18`, 
                                color: statusColor,
                                border: `1px solid ${statusColor}35`,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {t.status}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                              <div className="progress-container" style={{ flex: 1, height: '5px', minWidth: '60px', background: 'var(--input-bg)' }}>
                                <div className="progress-bar" style={{ width: `${t.progress || 0}%`, backgroundColor: statusColor }} />
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.progress || 0}%</span>
                            </div>
                          </div>
                        </td>

                        {/* Target Selesai */}
                        <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {deadlineDate ? (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: 500, color: isOverdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                                {format(deadlineDate, 'd MMM yyyy', { locale: id })}
                              </span>
                              {isOverdue && (
                                <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                                  <AlertCircle size={10} /> Terlewat
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Info */}
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--surface-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>💡 <em>Klik pada baris pekerjaan untuk melihat detail lengkap, sub-pekerjaan, lampiran, dan riwayat aktivitas.</em></span>
            <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '12px', padding: '6px 14px' }}>
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
