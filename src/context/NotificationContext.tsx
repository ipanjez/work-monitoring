'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
};

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  addActivityLog?: (action: string, title: string, message: string, type?: 'info' | 'success' | 'warning' | 'danger') => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id || session?.user?.email || 'guest';

  const storageKey = `dashboard_notifications_${userId}`;
  const clearedAtKey = `dashboard_notifications_cleared_at_${userId}`;

  // Use refs to avoid stale closures in setInterval and to prevent side-effects in render
  const notificationsRef = useRef<NotificationItem[]>([]);
  const lastCheckTimeRef = useRef<Date>(new Date());

  // Keep ref synced with state
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Register Service Worker for Push Notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(reg) {
          console.log('Service Worker Registered successfully', reg);
          
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                console.log('Notification permission granted.');
              }
            });
          }
        })
        .catch(function(err) {
          console.error('Service Worker registration failed', err);
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
    // Set initial check time to now so we don't get flooded with old notifications on first load
    lastCheckTimeRef.current = new Date();
  }, [userId, status, storageKey]);

  // Save to local storage whenever notifications change
  useEffect(() => {
    if (status === 'loading') return;
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [notifications, userId, status, storageKey]);

  // Polling logic for activities
  useEffect(() => {
    if (status === 'loading') return;

    let isMounted = true;

    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/activities');
        if (!res.ok) return;
        const activities = await res.json();

        if (!isMounted) return;

        const prev = notificationsRef.current;
        const newNotifs: NotificationItem[] = [];

        activities.forEach((act: any) => {
          const actTime = new Date(act.createdAt);

          if (actTime > lastCheckTimeRef.current) {
            const existing = prev.find(p => p.id === act.id);
            if (!existing) {
              newNotifs.push({
                id: act.id,
                title: act.title,
                message: act.message,
                type: act.type,
                updatedAt: act.createdAt,
                isRead: false
              });

              // Show toast for new activity
              toast.custom((t) => (
                <div
                  style={{
                    background: 'var(--surface-color)',
                    color: 'var(--text-primary)',
                    padding: '16px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    border: '1px solid var(--border-color)',
                    maxWidth: '350px',
                    animation: t.visible ? 'fadeIn 0.3s' : 'fadeOut 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: act.type === 'danger' ? 'var(--danger)' : 'var(--accent-primary)' }}>{act.title} 🔔</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Baru saja</span>
                  </div>
                  <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {act.message}
                  </p>
                </div>
              ), { duration: 5000, position: 'bottom-right' });
            }
          }
        });

        if (newNotifs.length > 0) {
          const merged = [...newNotifs, ...prev.filter(p => !newNotifs.find(n => n.id === p.id))];
          setNotifications(merged.slice(0, 50).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        }

        lastCheckTimeRef.current = new Date();
      } catch (e) {
        console.error('Polling error:', e);
      }
    };

    // Initial fetch to populate history without toasts
    const fetchInitial = async () => {
      try {
        const res = await fetch('/api/activities');
        if (res.ok) {
          const activities = await res.json();

          const clearedAtStr = localStorage.getItem(clearedAtKey);
          const clearedAt = clearedAtStr ? new Date(clearedAtStr).getTime() : 0;

          const initialNotifs = activities
            .filter((act: any) => new Date(act.createdAt).getTime() > clearedAt)
            .map((act: any) => ({
              id: act.id,
              title: act.title,
              message: act.message,
              type: act.type,
              updatedAt: act.createdAt,
              isRead: false // Assume unread for new session if not in localStorage
            }));

          if (notificationsRef.current.length === 0 && initialNotifs.length > 0) {
            setNotifications(initialNotifs.slice(0, 50));
          }
        }
      } catch (e) { }
    };

    // If local storage didn't have any notifications, try to fetch recent ones
    // BUT we should wait a tick so that localStorage check finishes.
    if (notificationsRef.current.length === 0) {
      fetchInitial();
    }

    const intervalId = setInterval(fetchActivities, 10000); // 10 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [userId, status, clearedAtKey]); // Depend on user changes

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.setItem(clearedAtKey, new Date().toISOString());
  };

  const addActivityLog = async (action: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info', taskId?: number, linkUrl?: string) => {
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, title, message, type, taskId: taskId ?? null, linkUrl: linkUrl ?? null })
      });
    } catch (e) {
      console.error('Failed to log activity', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll, addActivityLog }}>
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
