'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bell, CheckCircle, Trash2, Volume2, VolumeX, 
  MessageSquare, AlertTriangle, CheckCircle2, 
  RefreshCw, Filter, Search, X, User, Check,
  Clock, ShieldAlert, FileText, Sparkles
} from 'lucide-react';
import { useNotifications, NotificationItem } from '@/context/NotificationContext';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatLogDetails } from '@/utils/taskUtils';
import { useSession } from 'next-auth/react';

type TabFilter = 'all' | 'unread' | 'for_me';

export default function NotificationBell() {
  const { data: session } = useSession();
  const currentUserName = session?.user?.name || (session?.user as any)?.username || session?.user?.email || '';

  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll,
    deleteNotification,
    isSoundEnabled,
    toggleSound,
    refreshNotifications
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [actionFilter, setActionFilter] = useState<string>('all_actions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on click outside
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

  // Unique actions for category dropdown filter
  const uniqueActions = useMemo(() => {
    return Array.from(new Set(notifications.map(n => n.title).filter(Boolean))) as string[];
  }, [notifications]);

  // Count items related to current user
  const forMeCount = useMemo(() => {
    if (!currentUserName) return 0;
    const lowerName = currentUserName.toLowerCase();
    return notifications.filter(n => {
      const msg = (n.message || '').toLowerCase();
      const ttl = (n.title || '').toLowerCase();
      const pic = (n.pic || '').toLowerCase();
      return msg.includes(lowerName) || ttl.includes(lowerName) || pic.includes(lowerName);
    }).length;
  }, [notifications, currentUserName]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(n => {
        if (activeTab === 'unread') return !n.isRead;
        if (activeTab === 'for_me') {
          if (!currentUserName) return true;
          const lowerName = currentUserName.toLowerCase();
          const msg = (n.message || '').toLowerCase();
          const ttl = (n.title || '').toLowerCase();
          const pic = (n.pic || '').toLowerCase();
          return msg.includes(lowerName) || ttl.includes(lowerName) || pic.includes(lowerName);
        }
        return true;
      })
      .filter(n => actionFilter === 'all_actions' || n.title === actionFilter)
      .filter(n => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.message && n.message.toLowerCase().includes(q)) ||
          (n.nama && n.nama.toLowerCase().includes(q)) ||
          (n.pic && n.pic.toLowerCase().includes(q)) ||
          (n.userName && n.userName.toLowerCase().includes(q))
        );
      });
  }, [notifications, activeTab, actionFilter, searchQuery, currentUserName]);

  // Group notifications into time buckets
  const groupedNotifications = useMemo(() => {
    const groups: { label: string; items: NotificationItem[] }[] = [
      { label: 'Hari Ini', items: [] },
      { label: 'Kemarin', items: [] },
      { label: 'Minggu Ini', items: [] },
      { label: 'Lebih Lama', items: [] }
    ];

    filteredNotifications.forEach(item => {
      try {
        const itemDate = new Date(item.updatedAt);
        if (isNaN(itemDate.getTime())) {
          groups[0].items.push(item);
        } else if (isToday(itemDate)) {
          groups[0].items.push(item);
        } else if (isYesterday(itemDate)) {
          groups[1].items.push(item);
        } else if (isThisWeek(itemDate)) {
          groups[2].items.push(item);
        } else {
          groups[3].items.push(item);
        }
      } catch {
        groups[0].items.push(item);
      }
    });

    return groups.filter(g => g.items.length > 0);
  }, [filteredNotifications]);

  const getActionIcon = (title?: string, type?: string) => {
    const lower = (title || '').toLowerCase();
    if (type === 'danger' || lower.includes('hapus') || lower.includes('delete')) {
      return <Trash2 size={14} color="var(--danger)" />;
    }
    if (type === 'success' || lower.includes('selesai') || lower.includes('done') || lower.includes('tambah') || lower.includes('buat') || lower.includes('create')) {
      return <CheckCircle2 size={14} color="#10b981" />;
    }
    if (lower.includes('komentar') || lower.includes('catatan') || lower.includes('comment')) {
      return <MessageSquare size={14} color="#8b5cf6" />;
    }
    if (type === 'warning' || lower.includes('prioritas') || lower.includes('urgent') || lower.includes('overdue')) {
      return <AlertTriangle size={14} color="#f59e0b" />;
    }
    return <RefreshCw size={14} color="var(--accent-primary)" />;
  };

  const getActionBadgeColor = (type?: string) => {
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

  // Extract / resolve clean author name
  const resolveActorName = (notif: NotificationItem) => {
    if (notif.userName) {
      if (currentUserName && notif.userName.toLowerCase() === currentUserName.toLowerCase()) {
        return 'Anda';
      }
      return notif.userName;
    }
    // Check if message specifies actor (e.g. "Perubahan oleh Farhan: ...")
    if (notif.message) {
      const match = notif.message.match(/oleh\s+([A-Za-z0-9_\s.-]+?)(?::|\s+dari|\s+untuk|\s*$)/i);
      if (match && match[1]) {
        const actor = match[1].trim();
        if (currentUserName && actor.toLowerCase() === currentUserName.toLowerCase()) {
          return 'Anda';
        }
        return actor;
      }
    }
    if (notif.pic) {
      return notif.pic;
    }
    return 'Sistem';
  };

  // Clean and standardize notification message body
  const cleanMessageBody = (notif: NotificationItem) => {
    if (!notif.message) {
      return `${notif.pic || 'PIC'} memperbarui pekerjaan "${notif.nama || 'Pekerjaan'}"${notif.status ? ` menjadi status ${notif.status}` : ''}.`;
    }

    let msg = notif.message;
    // Remove redundant "Perubahan oleh X: " if already shown in author chip
    msg = msg.replace(/^Perubahan oleh [^:]+:\s*/i, '');
    msg = msg.replace(/^Status pekerjaan "[^"]+" diubah oleh [^\s]+ dari/i, 'Status diubah dari');
    msg = msg.replace(/^Pekerjaan "[^"]+" dibuat oleh [^\s]+ untuk PIC/i, 'Dibuat untuk PIC');

    return formatLogDetails(msg);
  };

  if (!session?.user) return null;

  return (
    <div
      id="notification-bell-container"
      style={{ position: 'relative', zIndex: 1000 }}
      ref={panelRef}
    >
      {/* Bell Button with Unread Badge */}
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) refreshNotifications();
        }}
        title="Notifikasi Pembaruan"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: isOpen ? 'var(--accent-primary)' : 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpen ? 'white' : 'var(--text-secondary)',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.color = 'var(--accent-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
      >
        <Bell size={20} style={{ transform: isOpen ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.2s ease' }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: '#ef4444',
            color: 'white',
            fontSize: '10px',
            fontWeight: 800,
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--surface-color)',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.45)',
            animation: 'pulse 2s infinite'
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
          top: '52px',
          right: '0',
          width: '400px',
          maxWidth: '92vw',
          background: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '560px',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1), transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--input-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <Bell size={15} />
            </div>
            <div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Notifikasi Pembaruan
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {notifications.length} aktivitas tersinkronisasi
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Sound Mute / Unmute Toggle */}
            <button
              onClick={toggleSound}
              title={isSoundEnabled ? "Suara notifikasi aktif (Klik untuk membisukan)" : "Suara notifikasi dibisukan (Klik untuk aktifkan)"}
              style={{
                background: 'none',
                border: 'none',
                color: isSoundEnabled ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Read All Button */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                title="Tandai semua sebagai sudah dibaca"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 8px',
                  borderRadius: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <CheckCircle size={13} /> Baca Semua
              </button>
            )}

            {/* Clear All Button */}
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Bersihkan seluruh riwayat notifikasi pembaruan?')) {
                    clearAll();
                  }
                }}
                title="Bersihkan semua notifikasi"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '8px',
                  opacity: 0.8,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.opacity = '0.8';
                }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)', padding: '4px 8px 0' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              flex: 1,
              padding: '8px 6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === 'all' ? 700 : 500,
              color: activeTab === 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'all' ? '2.5px solid var(--accent-primary)' : '2.5px solid transparent',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            Semua
            <span style={{ fontSize: '10px', background: 'var(--input-bg)', padding: '1px 5px', borderRadius: '10px' }}>
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            style={{
              flex: 1,
              padding: '8px 6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === 'unread' ? 700 : 500,
              color: activeTab === 'unread' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'unread' ? '2.5px solid var(--accent-primary)' : '2.5px solid transparent',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            Belum Dibaca
            {unreadCount > 0 && (
              <span style={{ fontSize: '10px', background: '#ef4444', color: 'white', fontWeight: 700, padding: '1px 5px', borderRadius: '10px' }}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('for_me')}
            style={{
              flex: 1,
              padding: '8px 6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === 'for_me' ? 700 : 500,
              color: activeTab === 'for_me' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'for_me' ? '2.5px solid var(--accent-primary)' : '2.5px solid transparent',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            🎯 Terkait Saya
            {forMeCount > 0 && (
              <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontWeight: 700, padding: '1px 5px', borderRadius: '10px' }}>
                {forMeCount}
              </span>
            )}
          </button>
        </div>

        {/* Search & Action Filter Row */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--input-bg)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={13} color="var(--text-secondary)" style={{ position: 'absolute', left: '8px', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Cari aktivitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 24px 4px 26px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--surface-color)',
                color: 'var(--text-primary)',
                fontSize: '11.5px',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Action Type Filter */}
          {uniqueActions.length > 1 && (
            <div style={{ width: '130px', flexShrink: 0 }}>
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
                  fontSize: '11px',
                  outline: 'none'
                }}
              >
                <option value="all_actions">Semua Jenis</option>
                {uniqueActions.map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Grouped Notifications List */}
        <div style={{ overflowY: 'auto', flex: 1, maxHeight: '380px' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Bell size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontSize: '13px', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Belum ada notifikasi pembaruan.</p>
              <span style={{ fontSize: '11.5px', opacity: 0.7 }}>Aktivitas terbaru tim akan muncul di sini secara real-time.</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Search size={26} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontSize: '12.5px', margin: 0, fontWeight: 600 }}>Tidak ada notifikasi yang sesuai filter.</p>
              <span style={{ fontSize: '11px', opacity: 0.7 }}>Coba gunakan kata kunci pencarian atau tab lain.</span>
            </div>
          ) : (
            groupedNotifications.map(group => (
              <div key={group.label}>
                {/* Time Group Header */}
                <div style={{
                  padding: '6px 14px',
                  background: 'var(--input-bg)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>{group.label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.8 }}>
                    {group.items.length} aktivitas
                  </span>
                </div>

                {/* Group Items */}
                {group.items.map(notif => {
                  const badgeBg = getActionBadgeColor(notif.type);
                  const actorName = resolveActorName(notif);
                  const isActorMe = actorName === 'Anda';
                  const isTargetingMe = currentUserName && notif.message && notif.message.toLowerCase().includes(currentUserName.toLowerCase());

                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.isRead) markAsRead(notif.id);
                      }}
                      style={{
                        padding: '12px 14px',
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
                        e.currentTarget.style.background = notif.isRead ? 'var(--input-bg)' : 'rgba(59, 130, 246, 0.09)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)';
                      }}
                    >
                      {/* Action Icon Badge */}
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '9px',
                        background: badgeBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px'
                      }}>
                        {getActionIcon(notif.title, notif.type)}
                      </div>

                      {/* Text Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title & Time */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '3px' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: notif.isRead ? 600 : 700,
                            color: notif.type === 'danger' ? 'var(--danger)' : notif.type === 'success' ? '#10b981' : 'var(--text-primary)',
                            lineHeight: 1.3
                          }}>
                            {notif.title || 'Pembaruan Aktivitas'}
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={10} />
                            {formatSafeTime(notif.updatedAt)}
                          </span>
                        </div>

                        {/* Standardized Message Body */}
                        <p style={{
                          fontSize: '11.5px',
                          color: 'var(--text-secondary)',
                          margin: '0 0 6px',
                          lineHeight: 1.45,
                          wordBreak: 'break-word'
                        }}>
                          {cleanMessageBody(notif)}
                        </p>

                        {/* Uniform Metadata Chips (Oleh, Terkait Anda, PIC) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          {/* 👤 Oleh Chip (Uniform for ALL) */}
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: isActorMe ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            background: isActorMe ? 'rgba(59, 130, 246, 0.12)' : 'var(--input-bg)',
                            padding: '1.5px 6px',
                            borderRadius: '5px',
                            border: '1px solid var(--border-color)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <User size={10} />
                            Oleh: <strong style={{ color: isActorMe ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{actorName}</strong>
                          </span>

                          {/* 🎯 Terkait Anda Badge */}
                          {isTargetingMe && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#f59e0b',
                              background: 'rgba(245, 158, 11, 0.14)',
                              padding: '1.5px 6px',
                              borderRadius: '5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              🎯 Terkait Anda
                            </span>
                          )}

                          {/* Task PIC (if specified and different from actor) */}
                          {notif.pic && notif.pic !== actorName && (
                            <span style={{
                              fontSize: '10px',
                              color: 'var(--text-secondary)',
                              background: 'var(--input-bg)',
                              padding: '1.5px 6px',
                              borderRadius: '5px',
                              border: '1px solid var(--border-color)'
                            }}>
                              PIC: {notif.pic}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Controls: Read Dot & Delete */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, marginTop: '2px' }}>
                        {!notif.isRead ? (
                          <div 
                            title="Belum dibaca"
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: '#3b82f6',
                              boxShadow: '0 0 6px rgba(59, 130, 246, 0.6)'
                            }} 
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            title="Hapus notifikasi"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              opacity: 0.4,
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.color = 'var(--danger)';
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0.4';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                              e.currentTarget.style.background = 'none';
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
