'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function IdleTimer({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [timeLeft, setTimeLeft] = useState(600); // Default 10 minutes in seconds

  useEffect(() => {
    if (pathname === '/login') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Logout user
          fetch('/api/auth', { method: 'DELETE' }).then(() => {
            router.push('/login?reason=timeout');
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
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
        title={`Sesi tersisa: ${minutes}:${seconds.toString().padStart(2, '0')}`}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isWarning ? '#ef4444' : 'var(--text-primary)' }}>
          {isWarning ? <AlertTriangle size={14} /> : <Clock size={14} />}
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Sisa Sesi</span>
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
