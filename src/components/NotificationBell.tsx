'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle, Trash2 } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [actionFilter, setActionFilter] = useState<string>('all_actions');
  const panelRef = useRef<HTMLDivElement>(null);

  const uniqueActions = Array.from(new Set(notifications.map(n => n.title).filter(Boolean))) as string[];

  const finalFiltered = (filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications)
    .filter(n => actionFilter === 'all_actions' || n.title === actionFilter);

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

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '45px', height: '45px', borderRadius: '50%', background: 'var(--surface-color)', 
          border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Bell size={20} color="var(--text-primary)" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px', background: 'var(--danger)', color: 'white',
            fontSize: '11px', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-color)'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '55px', right: '0', width: '350px', background: 'var(--surface-color)',
          border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '500px'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Notifikasi Pembaruan</h3>
            {notifications.length > 0 && (
              <button 
                onClick={clearAll}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={12} /> Hapus Semua
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px',
                fontWeight: filter === 'all' ? 600 : 400,
                color: filter === 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderBottom: filter === 'all' ? '2px solid var(--accent-primary)' : '2px solid transparent'
              }}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px',
                fontWeight: filter === 'unread' ? 600 : 400,
                color: filter === 'unread' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderBottom: filter === 'unread' ? '2px solid var(--accent-primary)' : '2px solid transparent'
              }}
            >
              Belum Dibaca
            </button>
          </div>

          {uniqueActions.length > 0 && (
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
              <select 
                value={actionFilter} 
                onChange={(e) => setActionFilter(e.target.value)}
                style={{ 
                  width: '100%', padding: '6px 8px', borderRadius: '6px', 
                  border: '1px solid var(--border-color)', background: 'var(--bg-color)',
                  color: 'var(--text-primary)', fontSize: '12px'
                }}
              >
                <option value="all_actions">Semua Jenis Aktivitas</option>
                {uniqueActions.map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: '13px' }}>Belum ada notifikasi pembaruan.</p>
              </div>
            ) : finalFiltered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '13px' }}>Tidak ada notifikasi yang sesuai dengan filter.</p>
              </div>
            ) : (
              finalFiltered.map(notif => (
                <div 
                  key={notif.id}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
                    background: notif.isRead ? 'transparent' : 'rgba(37, 99, 235, 0.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.4 }}>
                      {notif.title && <div style={{ fontWeight: 600, color: notif.type === 'danger' ? 'var(--danger)' : notif.type === 'success' ? '#10b981' : 'var(--accent-primary)', marginBottom: '2px' }}>{notif.title}</div>}
                      <div>{notif.message || (
                        <>
                          <span style={{ fontWeight: 600 }}>{notif.pic}</span> memperbarui pekerjaan 
                          <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}> {notif.nama}</span>
                          {notif.status && <span> menjadi status <span className={`badge ${notif.status === 'Done' ? 'badge-success' : notif.status === 'In Progress' ? 'badge-warning' : 'badge-todo'}`}>{notif.status}</span></span>}
                        </>
                      )}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {formatDistanceToNow(new Date(notif.updatedAt), { addSuffix: true, locale: id })}
                    </div>
                  </div>
                  {!notif.isRead && (
                    <button 
                      onClick={() => markAsRead(notif.id)}
                      title="Tandai sudah dibaca"
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '4px' }}
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
