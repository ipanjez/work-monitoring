'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { Task } from '@/utils/taskUtils';

interface RealtimeSyncContextType {
  isSyncing: boolean;
  isLive: boolean;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
  tasks: Task[];
  setLocalTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const RealtimeSyncContext = createContext<RealtimeSyncContextType | undefined>(undefined);

export function RealtimeSyncProvider({ 
  children,
  initialTasks = []
}: { 
  children: React.ReactNode;
  initialTasks?: Task[];
}) {
  const { status } = useSession();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  const lastTaskVersionRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const consecutiveFailuresRef = useRef<number>(0);

  // Sync tasks from server smoothly with React transition
  const fetchTasksData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/tasks', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const freshTasks: Task[] = await res.json();
        if (Array.isArray(freshTasks)) {
          startTransition(() => {
            setTasks(freshTasks);
            setLastSyncedAt(new Date());
            setIsLive(true);
            consecutiveFailuresRef.current = 0;
          });

          // Dispatch event so any existing components listening to 'tasksUpdated' refresh smoothly
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('realtimeTasksUpdated', { detail: freshTasks }));
            window.dispatchEvent(new Event('tasksUpdated'));
          }
        }
      }
    } catch (err) {
      console.warn('Silent task sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Quick version check (~50 bytes HTTP response)
  const checkSyncVersion = useCallback(async () => {
    if (isFetchingRef.current || status === 'loading') return;
    isFetchingRef.current = true;

    try {
      const res = await fetch('/api/sync', {
        headers: { 'Cache-Control': 'no-store' }
      });

      if (res.ok) {
        const data = await res.json();
        setIsLive(true);
        consecutiveFailuresRef.current = 0;

        // If this is the first check, set the initial version
        if (lastTaskVersionRef.current === 0) {
          lastTaskVersionRef.current = data.taskVersion;
          setLastSyncedAt(new Date());
        } else if (data.taskVersion > lastTaskVersionRef.current) {
          // Version has changed (another user or tab modified tasks)
          lastTaskVersionRef.current = data.taskVersion;
          await fetchTasksData();
        }
      } else {
        consecutiveFailuresRef.current++;
        if (consecutiveFailuresRef.current > 3) {
          setIsLive(false);
        }
      }
    } catch (err) {
      consecutiveFailuresRef.current++;
      if (consecutiveFailuresRef.current > 3) {
        setIsLive(false);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [status, fetchTasksData]);

  // Adaptive sync interval (Fast 4s when active, 20s when background, immediate on focus)
  useEffect(() => {
    if (status === 'loading') return;

    // Run initial version check
    checkSyncVersion();

    let timerId: NodeJS.Timeout | null = null;

    const scheduleNextCheck = () => {
      const isVisible = typeof document !== 'undefined' && !document.hidden;
      const delay = isVisible ? 4000 : 20000;

      timerId = setTimeout(async () => {
        await checkSyncVersion();
        scheduleNextCheck();
      }, delay);
    };

    scheduleNextCheck();

    // Immediate check when user switches back to this tab
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        checkSyncVersion();
      }
    };

    // Immediate check when network comes online
    const handleOnline = () => {
      setIsLive(true);
      checkSyncVersion();
    };

    const handleOffline = () => {
      setIsLive(false);
    };

    // Listen to local mutations to update version ref immediately
    const handleLocalTasksUpdated = () => {
      lastTaskVersionRef.current = Date.now();
      setLastSyncedAt(new Date());
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('tasksUpdated', handleLocalTasksUpdated);
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('tasksUpdated', handleLocalTasksUpdated);
      }
    };
  }, [status, checkSyncVersion]);

  const syncNow = useCallback(async () => {
    await fetchTasksData();
  }, [fetchTasksData]);

  return (
    <RealtimeSyncContext.Provider value={{
      isSyncing,
      isLive,
      lastSyncedAt,
      syncNow,
      tasks,
      setLocalTasks: setTasks
    }}>
      {children}
    </RealtimeSyncContext.Provider>
  );
}

export function useRealtimeSync() {
  const context = useContext(RealtimeSyncContext);
  if (!context) {
    throw new Error('useRealtimeSync must be used within a RealtimeSyncProvider');
  }
  return context;
}
