'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, CheckCircle, Trash2, Volume2, VolumeX, 
  PlusCircle, Edit3, MessageSquare, AlertTriangle, 
  CheckCircle2, RefreshCw, Sparkles, Filter
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatLogDetails } from '@/utils/taskUtils';

export default function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll,
    isSoundEnabled,
    toggleSound,
    refreshNotifications
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [actionFilter, setActionFilter] = useState<string>('all_actions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const panelRef = useRef<HTMLDivElement>(null);

  const uniqueActions = Array.from(new Set(notifications.map(n => n.title).filter(Boolean))) as string[];

  const finalFiltered = (filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications)
    .filter(n => actionFilter === 'all_actions' || n.title === actionFilter)
    .filter(n => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.message && n.message.toLowerCase().includes(q)) ||
        (n.nama && n.nama.toLowerCase().includes(q)) ||
        (n.pic && n.pic.toLowerCase().includes(q))
      );
    });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getActionIcon = (title?: string, type?: string) => {
    const lower = (title || '').toLowerCase();
    if (type === 'danger' || lower.includes('hapus') || lower.includes('delete')) {
      return <Trash2 size={14} color="var(--danger)" />;
    }
    if (type === 'success' || lower.includes('selesai') || lower.includes('done') || lower.includes('tambah') || lower.includes('create')) {
      return <CheckCircle2 size={14} color="#10b981" />;
    }
    if (lower.includes('komentar') || lower.includes('catatan') || lower.includes('comment')) {
      return <MessageSquare size={14} color="#8b5cf6" />;
    }
    if (type === 'warning' || lower.includes('prioritas') || lower.includes('urgent')) {
      return <AlertTriangle size={14} color="#f59e0b" />;
    }
    return <RefreshCw size={14} color="var(--accent-primary)" />;
  };

  const getActionBadgeColor = (type?: string, title?: string) => {
    if (type === 'danger') return 'rgba(239, 68, 68, 0.12)';
    if (type === 'success') return 'rgba(16, 185, 129, 0.12)';
    if (type === 'warning') return 'rgba(245, 158, 11, 0.12)';
    return 'rgba(59, 130, 246, 0.12)';
  };

  const formatSafeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Baru saja';
      return formatDistanceToNow(d, { addSuffix: true, locale: id });
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <div
      id="notification-bell-container"
      style={{ position: 'relative', zIndex: 1000 }}
      ref={panelRef}
    >
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) refreshNotifications();
        }}
        title="Notifikasi Pembaruan"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: isOpen ? 'rgba(59, 130, 246, 0.12)' : 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          color: isOpen ? 'var(--accent-primary)' : 'var(--text-primary)'
        }}
      >
        <Bell size={19} style={{ transform: isOpen ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.2s ease' }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: 'white',
            fontSize: '10.5px',
            fontWeight: 800,
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--surface-color)',
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      <div
        className="notification-dropdown-panel"
        style={{
          position: 'absolute',
          top: '50px',
          right: '0',
          width: '380px',
          maxWidth: '92vw',
          background: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '520px',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Notifikasi Pembaruan
            </h3>
            {unreadCount > 0 && (
              <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                {unreadCount} Baru
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Sound Mute / Unmute Toggle */}
            <button
              onClick={toggleSound}
              title={isSoundEnabled ? "Suara notifikasi aktif (Klik untuk bisukan)" : "Suara notifikasi dibisukan (Klik untuk aktifkan)"}
              style={{
                background: 'none',
                border: 'none',
                color: isSoundEnabled ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px',
                opacity: isSoundEnabled ? 1 : 0.6
              }}
            >
              {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                title="Tandai semua sudah dibaca"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '4px 6px',
                  borderRadius: '6px'
                }}
              >
                <CheckCircle size={13} /> Baca Semua
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Bersihkan seluruh riwayat notifikasi?')) {
                    clearAll();
                  }
                }}
                title="Hapus semua riwayat"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '6px',
                  opacity: 0.8
                }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: filter === 'all' ? 700 : 500,
              color: filter === 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: filter === 'all' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            Semua ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: filter === 'unread' ? 700 : 500,
              color: filter === 'unread' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: filter === 'unread' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            Belum Dibaca ({unreadCount})
          </button>
        </div>

        {/* Action Type Dropdown Filter */}
        {uniqueActions.length > 1 && (
          <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Filter size={12} color="var(--text-secondary)" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 6px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--surface-color)',
                color: 'var(--text-primary)',
                fontSize: '11.5px',
                outline: 'none'
              }}
            >
              <option value="all_actions">Semua Jenis Aktivitas</option>
              {uniqueActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        )}

        {/* Notification Items List */}
        <div style={{ overflowY: 'auto', flex: 1, maxHeight: '360px' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Bell size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontSize: '13px', margin: 0, fontWeight: 500 }}>Belum ada notifikasi pembaruan.</p>
              <span style={{ fontSize: '11.5px', opacity: 0.7 }}>Aktivitas terbaru tim Anda akan muncul di sini secara real-time.</span>
            </div>
          ) : finalFiltered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '12.5px', margin: 0 }}>Tidak ada notifikasi pada filter ini.</p>
            </div>
          ) : (
            finalFiltered.map(notif => {
              const badgeBg = getActionBadgeColor(notif.type, notif.title);
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.isRead) markAsRead(notif.id);
                  }}
                  style={{
                    padding: '11px 14px',
                    borderBottom: '1px solid var(--border-color)',
                    background: notif.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = notif.isRead ? 'var(--input-bg)' : 'rgba(59, 130, 246, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)';
                  }}
                >
                  {/* Action Icon Badge */}
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: badgeBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {getActionIcon(notif.title, notif.type)}
                  </div>

                  {/* Text Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '2px' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: notif.isRead ? 600 : 700,
                        color: notif.type === 'danger' ? 'var(--danger)' : notif.type === 'success' ? '#10b981' : 'var(--text-primary)',
                        lineHeight: 1.3
                      }}>
                        {notif.title || 'Pembaruan Tugas'}
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatSafeTime(notif.updatedAt)}
                      </span>
                    </div>

                    <p style={{
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: 1.4,
                      wordBreak: 'break-word'
                    }}>
                      {notif.message ? formatLogDetails(notif.message) : (
                        <>
                          <span style={{ fontWeight: 600 }}>{notif.pic}</span> memperbarui pekerjaan
                          <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}> {notif.nama}</span>
                          {notif.status && <span> menjadi status <strong>{notif.status}</strong></span>}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Unread Indicator Dot */}
                  {!notif.isRead && (
                    <div 
                      title="Belum dibaca"
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        flexShrink: 0,
                        marginTop: '6px'
                      }} 
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
