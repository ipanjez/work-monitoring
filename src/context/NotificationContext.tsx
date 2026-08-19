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
function playNotificationChime(isMuted: boolean) {
  try {
    if (typeof window === 'undefined') return;
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

  const notificationsRef = useRef<NotificationItem[]>([]);
  const lastCheckTimeRef = useRef<Date>(new Date());
  const isFetchingRef = useRef<boolean>(false);
  const isSoundEnabledRef = useRef<boolean>(true);
  const userNotificationStateRef = useRef<{ readIds: number[]; clearedAt: number; soundMuted: boolean }>({
    readIds: [],
    clearedAt: 0,
    soundMuted: false
  });

  // Keep ref synced with state
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => {
      const next = !prev;
      isSoundEnabledRef.current = next;
      localStorage.setItem('notification_sound_muted', String(!next));
      
      // Sync sound setting to database
      if (status === 'authenticated') {
        fetch('/api/notifications/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'TOGGLE_SOUND', soundMuted: !next })
        }).catch(err => console.error('Failed to sync sound setting:', err));
      }

      toast.success(next ? 'Suara notifikasi aktif 🔔' : 'Suara notifikasi dibisukan 🔕', { duration: 2000 });
      return next;
    });
  }, [status]);

  // Register Service Worker for Push Notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(reg) {
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
          }
        })
        .catch(function() {
          // Silent catch in dev/unsupported env
        });
    }
  }, []);

  // Core fetch function with Multi-device Database State Sync & Anti-Flood Toast
  const fetchActivities = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current || status === 'loading') return;
    isFetchingRef.current = true;

    try {
      // 1. Fetch both activities and user notification state in parallel
      const [activitiesRes, stateRes] = await Promise.all([
        fetch('/api/activities'),
        status === 'authenticated' ? fetch('/api/notifications/state') : Promise.resolve(null)
      ]);

      if (!activitiesRes.ok) return;
      const activities = await activitiesRes.json();
      if (!Array.isArray(activities)) return;

      // 2. Parse database user notification state
      if (stateRes && stateRes.ok) {
        try {
          const stateData = await stateRes.json();
          if (stateData) {
            userNotificationStateRef.current = {
              readIds: Array.isArray(stateData.readIds) ? stateData.readIds : [],
              clearedAt: stateData.clearedAt ? new Date(stateData.clearedAt).getTime() : 0,
              soundMuted: Boolean(stateData.soundMuted)
            };
            if (typeof stateData.soundMuted === 'boolean') {
              setIsSoundEnabled(!stateData.soundMuted);
              isSoundEnabledRef.current = !stateData.soundMuted;
            }
          }
        } catch (e) { }
      }

      const { readIds, clearedAt } = userNotificationStateRef.current;
      const prev = notificationsRef.current;
      const newIncomingForToast: NotificationItem[] = [];
      const updatedList: NotificationItem[] = [];

      activities.forEach((act: any) => {
        const actTime = new Date(act.createdAt);
        // Filter out items cleared by the user in the database
        if (actTime.getTime() <= clearedAt) return;

        // Skip login notification logs for non-admin roles
        const userRole = (session?.user as any)?.role?.toLowerCase() || 'guest';
        const isLoginAct = act.action === 'LOGIN' || (act.title && act.title.toLowerCase().includes('login'));
        if (isLoginAct && userRole !== 'admin') {
          return;
        }

        const isRead = readIds.includes(act.id);
        const notifItem: NotificationItem = {
          id: act.id,
          title: act.title,
          message: act.message,
          type: act.type,
          updatedAt: act.createdAt,
          isRead,
          taskId: act.taskId,
          linkUrl: act.linkUrl
        };

        updatedList.push(notifItem);

        if (!isInitial && actTime > lastCheckTimeRef.current) {
          const existing = prev.find(p => p.id === act.id);
          if (!existing) {
            newIncomingForToast.push(notifItem);
          }
        }
      });

      // Sort by newest
      const sorted = updatedList.slice(0, 50).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setNotifications(sorted);

      // Save local cache fallback
      try {
        localStorage.setItem(storageKey, JSON.stringify(sorted));
      } catch (e) { }

      if (!isInitial && newIncomingForToast.length > 0) {
        // Play audio chime if sound is enabled
        playNotificationChime(!isSoundEnabledRef.current);

        // Native browser notification if tab is in background
        if (typeof document !== 'undefined' && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Pembaruan Pekerjaan', {
              body: newIncomingForToast.length === 1 ? `${newIncomingForToast[0].title}: ${newIncomingForToast[0].message}` : `${newIncomingForToast.length} pembaruan pekerjaan baru.`,
              icon: '/favicon.ico'
            });
          } catch (e) { }
        }

        // Anti-flood toast logic
        if (newIncomingForToast.length === 1) {
          const item = newIncomingForToast[0];
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
        } else if (newIncomingForToast.length <= 3) {
          newIncomingForToast.forEach((item) => {
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
                alignItems: 'center',
                gap: '12px',
                border: '1px solid var(--border-color)',
                maxWidth: '360px',
                animation: t.visible ? 'fadeIn 0.3s' : 'fadeOut 0.3s'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '18px'
              }}>
                🔔
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {newIncomingForToast.length} Pembaruan Baru
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Terdapat {newIncomingForToast.length} aktivitas tugas baru di dashboard.
                </div>
              </div>
            </div>
          ), { duration: 4500, position: 'bottom-right' });
        }
      }

      lastCheckTimeRef.current = new Date();
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [session, status, storageKey]);

  // Load state on mount or user change
  useEffect(() => {
    if (status === 'loading') return;

    // 1. Initial fast local cache load
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const initialNotifs = JSON.parse(saved);
        if (Array.isArray(initialNotifs)) {
          setNotifications(initialNotifs);
          notificationsRef.current = initialNotifs;
        }
      } catch (e) { }
    }

    // 2. Fetch authoritative database state
    fetchActivities(true);
    lastCheckTimeRef.current = new Date();
  }, [userId, status, storageKey, fetchActivities]);

  // Dynamic Polling with Adaptive Interval
  useEffect(() => {
    if (status === 'loading') return;

    let timerId: NodeJS.Timeout | null = null;
    let consecutiveUnchanged = 0;

    const scheduleNextPoll = () => {
      // Faster polling when tab is active (8s to 15s), slower when hidden (30s)
      const isTabActive = typeof document !== 'undefined' && !document.hidden;
      let delay = isTabActive ? 8000 : 30000;

      if (isTabActive && consecutiveUnchanged > 3) {
        delay = 14000;
      }

      timerId = setTimeout(async () => {
        const prevCount = notificationsRef.current.length;
        await fetchActivities(false);
        const currentCount = notificationsRef.current.length;

        if (prevCount === currentCount) {
          consecutiveUnchanged++;
        } else {
          consecutiveUnchanged = 0;
        }

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

  // Mark single item as read (Synced to Database)
  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    if (!userNotificationStateRef.current.readIds.includes(id)) {
      userNotificationStateRef.current.readIds.push(id);
    }
    if (status === 'authenticated') {
      fetch('/api/notifications/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_READ', id })
      }).catch(err => console.error('Failed to sync markAsRead to DB:', err));
    }
  };

  // Mark all items as read (Synced to Database)
  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    userNotificationStateRef.current.readIds = Array.from(new Set([...userNotificationStateRef.current.readIds, ...allIds]));
    if (status === 'authenticated') {
      fetch('/api/notifications/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ', ids: allIds })
      }).catch(err => console.error('Failed to sync markAllAsRead to DB:', err));
    }
    toast.success('Semua notifikasi ditandai sudah dibaca', { duration: 2000 });
  };

  // Clear all notifications (Synced to Database)
  const clearAll = () => {
    setNotifications([]);
    userNotificationStateRef.current.clearedAt = Date.now();
    userNotificationStateRef.current.readIds = [];
    if (status === 'authenticated') {
      fetch('/api/notifications/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLEAR_ALL' })
      }).catch(err => console.error('Failed to sync clearAll to DB:', err));
    }
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
