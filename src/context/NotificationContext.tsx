'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export type NotificationItem = {
  id: number;
  nama?: string;
  pic?: string;
  status?: string;
  updatedAt: string;
  isRead: boolean;
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  taskId?: number;
  linkUrl?: string;
};

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  addActivityLog: (action: string, title: string, message: string, type?: 'info' | 'success' | 'warning' | 'danger', taskId?: number, linkUrl?: string) => Promise<void>;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Synthesized clean 2-tone notification chime using Web Audio API (no external file required)
function playNotificationChime() {
  try {
    if (typeof window === 'undefined') return;
    const isMuted = localStorage.getItem('notification_sound_muted') === 'true';
    if (isMuted) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // First tone (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second higher tone (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.09);
    gain2.gain.setValueAtTime(0.1, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.32);
  } catch (e) {
    // Ignored if browser blocks autoplay before user gesture
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id || session?.user?.email || 'guest';

  const storageKey = `dashboard_notifications_${userId}`;
  const clearedAtKey = `dashboard_notifications_cleared_at_${userId}`;

  const notificationsRef = useRef<NotificationItem[]>([]);
  const lastCheckTimeRef = useRef<Date>(new Date());
  const isFetchingRef = useRef<boolean>(false);

  // Keep ref synced with state
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Load sound preference
  useEffect(() => {
    try {
      const savedMuted = localStorage.getItem('notification_sound_muted');
      if (savedMuted === 'true') {
        setIsSoundEnabled(false);
      }
    } catch (e) { }
  }, []);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('notification_sound_muted', String(!next));
      toast.success(next ? 'Suara notifikasi aktif 🔔' : 'Suara notifikasi dibisukan 🔕', { duration: 2000 });
      return next;
    });
  }, []);

  // Register Service Worker for Push Notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(reg) {
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
          }
        })
        .catch(function(err) {
          // Silent catch in dev/unsupported env
        });
    }
  }, []);

  // Load local state on mount or user change
  useEffect(() => {
    if (status === 'loading') return;

    const saved = localStorage.getItem(storageKey);
    let initialNotifs: NotificationItem[] = [];
    if (saved) {
      try {
        initialNotifs = JSON.parse(saved);
      } catch (e) { }
    }
    setNotifications(initialNotifs);
    notificationsRef.current = initialNotifs;
    lastCheckTimeRef.current = new Date();
  }, [userId, status, storageKey]);

  // Save to local storage whenever notifications change
  useEffect(() => {
    if (status === 'loading') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (e) { }
  }, [notifications, userId, status, storageKey]);

  // Core fetch function with Anti-Flood Toast Batching & Smart Sound
  const fetchActivities = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current || status === 'loading') return;
    isFetchingRef.current = true;

    try {
      const res = await fetch('/api/activities');
      if (!res.ok) return;
      const activities = await res.json();
      if (!Array.isArray(activities)) return;

      const clearedAtStr = localStorage.getItem(clearedAtKey);
      const clearedAt = clearedAtStr ? new Date(clearedAtStr).getTime() : 0;

      const prev = notificationsRef.current;
      const newItems: NotificationItem[] = [];

      activities.forEach((act: any) => {
        const actTime = new Date(act.createdAt);
        if (actTime.getTime() <= clearedAt) return;

        // Skip login notification logs for non-admin roles (member, staff, guest, viewer/view)
        const userRole = (session?.user as any)?.role?.toLowerCase() || 'guest';
        const isLoginAct = act.action === 'LOGIN' || (act.title && act.title.toLowerCase().includes('login'));
        if (isLoginAct && userRole !== 'admin') {
          return;
        }

        if (isInitial) {
          // Initial population without toasts
          const existing = prev.find(p => p.id === act.id);
          if (!existing) {
            newItems.push({
              id: act.id,
              title: act.title,
              message: act.message,
              type: act.type,
              updatedAt: act.createdAt,
              isRead: false,
              taskId: act.taskId,
              linkUrl: act.linkUrl
            });
          }
        } else if (actTime > lastCheckTimeRef.current) {
          const existing = prev.find(p => p.id === act.id);
          if (!existing) {
            newItems.push({
              id: act.id,
              title: act.title,
              message: act.message,
              type: act.type,
              updatedAt: act.createdAt,
              isRead: false,
              taskId: act.taskId,
              linkUrl: act.linkUrl
            });
          }
        }
      });

      if (newItems.length > 0) {
        // Merge & limit to 50 latest
        const merged = [...newItems, ...prev.filter(p => !newItems.find(n => n.id === p.id))];
        const sorted = merged.slice(0, 50).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setNotifications(sorted);

        if (!isInitial) {
          // Play audio chime
          playNotificationChime();

          // Native browser notification if tab is in background
          if (typeof document !== 'undefined' && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Pembaruan Pekerjaan', {
                body: newItems.length === 1 ? `${newItems[0].title}: ${newItems[0].message}` : `${newItems.length} pembaruan pekerjaan baru.`,
                icon: '/favicon.ico'
              });
            } catch (e) { }
          }

          // Anti-flood toast logic
          if (newItems.length === 1) {
            const item = newItems[0];
            toast.custom((t) => (
              <div
                style={{
                  background: 'var(--surface-color)',
                  color: 'var(--text-primary)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  border: '1px solid var(--border-color)',
                  maxWidth: '360px',
                  animation: t.visible ? 'fadeIn 0.3s' : 'fadeOut 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: item.type === 'danger' ? 'var(--danger)' : item.type === 'success' ? '#10b981' : 'var(--accent-primary)' }}>
                    {item.title} 🔔
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Baru saja</span>
                </div>
                <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4, maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.message}
                </p>
              </div>
            ), { duration: 4500, position: 'bottom-right' });
          } else if (newItems.length <= 3) {
            // Show up to 2-3 items
            newItems.forEach((item) => {
              toast.custom((t) => (
                <div
                  style={{
                    background: 'var(--surface-color)',
                    color: 'var(--text-primary)',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    border: '1px solid var(--border-color)',
                    maxWidth: '340px',
                    animation: t.visible ? 'fadeIn 0.3s' : 'fadeOut 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: item.type === 'danger' ? 'var(--danger)' : item.type === 'success' ? '#10b981' : 'var(--accent-primary)' }}>
                      {item.title} 🔔
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Baru</span>
                  </div>
                  <p style={{ fontSize: '11.5px', margin: 0, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.message}
                  </p>
                </div>
              ), { duration: 4000, position: 'bottom-right' });
            });
          } else {
            // Batch Summary Toast (Anti-Flood)
            toast.custom((t) => (
              <div
                style={{
                  background: 'var(--surface-color)',
                  color: 'var(--text-primary)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  border: '1px solid var(--accent-primary)',
                  maxWidth: '360px',
                  animation: t.visible ? 'fadeIn 0.3s' : 'fadeOut 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    🔔 {newItems.length} Pembaruan Baru Sekaligus
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Baru saja</span>
                </div>
                <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-secondary)' }}>
                  Aktivitas tim terbaru telah diperbarui di daftar notifikasi Anda.
                </p>
              </div>
            ), { duration: 5000, position: 'bottom-right' });
          }
        }
      }

      lastCheckTimeRef.current = new Date();
    } catch (e) {
      // Ignore polling errors
    } finally {
      isFetchingRef.current = false;
    }
  }, [status, clearedAtKey]);

  // Initial load
  useEffect(() => {
    if (status !== 'loading') {
      fetchActivities(true);
    }
  }, [fetchActivities, status]);

  // Adaptive polling (12s when active tab, 30s when hidden, instant on tab focus & local events)
  useEffect(() => {
    if (status === 'loading') return;

    let timerId: any = null;

    const scheduleNextPoll = () => {
      const isHidden = typeof document !== 'undefined' && document.hidden;
      const delay = isHidden ? 30000 : 12000; // 30s background, 12s active

      timerId = setTimeout(async () => {
        await fetchActivities(false);
        scheduleNextPoll();
      }, delay);
    };

    scheduleNextPoll();

    // Instant poll when user switches back to this browser tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchActivities(false);
      }
    };

    // Instant poll on local events
    const handleTasksUpdated = () => {
      setTimeout(() => fetchActivities(false), 500);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('tasksUpdated', handleTasksUpdated);
    window.addEventListener('notificationsUpdated', handleTasksUpdated);

    return () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('tasksUpdated', handleTasksUpdated);
      window.removeEventListener('notificationsUpdated', handleTasksUpdated);
    };
  }, [fetchActivities, status]);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('Semua notifikasi ditandai sudah dibaca', { duration: 2000 });
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.setItem(clearedAtKey, new Date().toISOString());
    toast.success('Riwayat notifikasi dibersihkan', { duration: 2000 });
  };

  const addActivityLog = async (
    action: string, 
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'danger' = 'info', 
    taskId?: number, 
    linkUrl?: string
  ) => {
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, title, message, type, taskId: taskId ?? null, linkUrl: linkUrl ?? null })
      });
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (e) {
      console.error('Failed to log activity', e);
    }
  };

  const refreshNotifications = async () => {
    await fetchActivities(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead, 
      clearAll, 
      addActivityLog,
      isSoundEnabled,
      toggleSound,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
