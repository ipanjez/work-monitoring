'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Clock, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function IdleTimer({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [timeLeft, setTimeLeft] = useState(600); // Default 10 minutes in seconds
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (pathname === '/login') return;

    let lastActive = Date.now();

    const handleActivity = () => {
      lastActive = Date.now();
    };

    // Listen to user activity to reset inactivity timer
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const timer = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActive;

      // Check for 10 minutes of pure inactivity (600,000 ms)
      if (inactiveTime >= 600000) {
        clearInterval(timer);
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('scroll', handleActivity);

        // Auto logout due to inactivity
        fetch('/api/auth', { method: 'DELETE' }).then(() => {
          router.push('/login?reason=timeout');
        });
        return;
      }

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Logout user because manual session timer ran out
          fetch('/api/auth', { method: 'DELETE' }).then(() => {
            router.push('/login?reason=timeout');
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [pathname, router]);

  const extendSession = (minutes: number) => {
    setTimeLeft(minutes * 60);
    toast.success(`Sesi diperpanjang menjadi ${minutes} menit`);
  };

  if (pathname === '/login') return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft <= 60; // 1 minute remaining warning

  if (isSidebarCollapsed) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 0',
          background: isWarning ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)',
          border: `1px solid ${isWarning ? '#ef4444' : 'var(--border-color)'}`,
          borderRadius: '12px',
          marginBottom: '8px',
          color: isWarning ? '#ef4444' : 'var(--text-secondary)'
        }}
        title={`Sesi tersisa: ${minutes}:${seconds.toString().padStart(2, '0')} | Peringatan: Tidak aktif 10m = Logout`}
      >
        {isWarning ? <AlertTriangle size={18} /> : <Clock size={18} />}
        <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '12px',
      background: isWarning ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)',
      border: `1px solid ${isWarning ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-color)'}`,
      borderRadius: '12px',
      marginBottom: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isWarning ? '#ef4444' : 'var(--text-primary)', position: 'relative' }}>
          {isWarning ? <AlertTriangle size={14} /> : <Clock size={14} />}
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Sisa Sesi</span>
          
          <div 
            style={{ cursor: 'pointer', display: 'flex' }}
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
          >
            <Info size={14} style={{ color: 'var(--text-secondary)' }} />
          </div>

          {showInfo && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              padding: '8px',
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              width: '180px',
              fontSize: '10px',
              color: 'var(--text-primary)',
              zIndex: 100,
              lineHeight: 1.4
            }}>
              <strong>Info Keamanan:</strong> Walaupun sisa sesi Anda perpanjang, Anda akan <strong>Otomatis Terlogout</strong> jika layar dibiarkan dan tidak ada aktivitas apa pun (mouse/keyboard) selama 10 menit berturut-turut.
            </div>
          )}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: isWarning ? '#ef4444' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
      
      {isWarning && (
        <div style={{ fontSize: '11px', color: '#ef4444', lineHeight: 1.2 }}>
          Sesi Anda akan segera berakhir. Perpanjang untuk mencegah kehilangan data.
        </div>
      )}

      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          onClick={() => extendSession(10)}
          style={{ flex: 1, padding: '4px 0', fontSize: '10px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
        >
          +10m
        </button>
        <button 
          onClick={() => extendSession(20)}
          style={{ flex: 1, padding: '4px 0', fontSize: '10px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
        >
          +20m
        </button>
        <button 
          onClick={() => extendSession(30)}
          style={{ flex: 1, padding: '4px 0', fontSize: '10px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
        >
          +30m
        </button>
      </div>
    </div>
  );
}
