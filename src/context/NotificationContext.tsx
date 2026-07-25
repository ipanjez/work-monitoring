'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

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
  clearAll: () => void;
  addActivityLog?: (action: string, title: string, message: string, type?: 'info'|'success'|'warning'|'danger') => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // Use refs to avoid stale closures in setInterval and to prevent side-effects in render
  const notificationsRef = useRef<NotificationItem[]>([]);
  const lastCheckTimeRef = useRef<Date>(new Date());
  
  // Keep ref synced with state
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Load local state on mount
  useEffect(() => {
    const saved = localStorage.getItem('dashboard_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
      } catch (e) { }
    }
    // Set initial check time to now so we don't get flooded with old notifications on first load
    lastCheckTimeRef.current = new Date();
  }, []);

  // Save to local storage whenever notifications change
  useEffect(() => {
    localStorage.setItem('dashboard_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Polling logic for activities
  useEffect(() => {
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
                    <span style={{ fontSize: '12px', fontWeight: 600, color: act.type === 'danger' ? 'var(--danger)' : 'var(--accent-primary)' }}>{act.title} 🔔</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Baru saja</span>
                  </div>
                  <p style={{ fontSize: '13px', margin: 0 }}>
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
          
          const clearedAtStr = localStorage.getItem('dashboard_notifications_cleared_at');
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
      } catch (e) {}
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
  }, []); // Empty dependency array, safe because we use refs for mutable state

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.setItem('dashboard_notifications_cleared_at', new Date().toISOString());
  };

  const addActivityLog = async (action: string, title: string, message: string, type: 'info'|'success'|'warning'|'danger' = 'info') => {
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, title, message, type })
      });
    } catch (e) {
      console.error('Failed to log activity', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, clearAll, addActivityLog }}>
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
