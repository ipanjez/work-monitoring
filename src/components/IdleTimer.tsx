'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Clock, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMaster } from '@/context/MasterContext';

export default function IdleTimer({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sessionTimeout } = useMaster();
  
  // Use sessionTimeout (in minutes) or fallback to 10
  const sessionDurationMs = (sessionTimeout || 10) * 60 * 1000;
  
  const [timeLeft, setTimeLeft] = useState(sessionDurationMs / 1000); 
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (pathname === '/auth/signin' || pathname === '/auth/signup' || pathname === '/auth/forgot') return;

    let lastActive = Date.now();

    const handleActivity = () => {
      lastActive = Date.now();
      setTimeLeft(sessionDurationMs / 1000);
    };

    // Listen to user activity to reset inactivity timer
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const timer = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActive;
      const remainingSeconds = Math.max(0, Math.floor((sessionDurationMs - inactiveTime) / 1000));
      
      setTimeLeft((prevSeconds) => {
        // If the user extended session manually, sessionDuration might have changed
        // But we actually manage session duration extension via state
        if (remainingSeconds <= 0) {
          clearInterval(timer);
          window.removeEventListener('mousemove', handleActivity);
          window.removeEventListener('keydown', handleActivity);
          window.removeEventListener('click', handleActivity);
          window.removeEventListener('scroll', handleActivity);

          signOut({ callbackUrl: '/auth/signin?reason=timeout', redirect: true });
          return 0;
        }
        return remainingSeconds;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [pathname, router, sessionDurationMs]);

  const extendSession = (minutes?: number) => {
    setTimeLeft(sessionDurationMs / 1000);
    toast.success(`Sesi di-reset, Anda kembali aktif!`);
  };

  if (pathname === '/auth/signin' || pathname === '/auth/signup' || pathname === '/auth/forgot') return null;

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
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            onClick={() => setShowInfo(!showInfo)}
            title="Klik/arahkan kursor untuk informasi sesi"
          >
            <Info size={14} style={{ color: showInfo ? 'var(--accent-primary)' : 'var(--text-secondary)', transition: 'color 0.15s' }} />
          </div>

          {showInfo && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '-8px',
              padding: '12px 14px',
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
              width: '230px',
              fontSize: '11px',
              color: 'var(--text-primary)',
              zIndex: 1000,
              lineHeight: 1.45,
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.15s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '11.5px', color: 'var(--accent-primary)' }}>
                <Clock size={13} />
                <span>Informasi Sisa Sesi</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>• Reset Otomatis:</strong> Timer sesi otomatis diperpanjang ke <strong style={{ color: 'var(--text-primary)' }}>{sessionTimeout || 10} menit</strong> setiap kali Anda beraktivitas <em>(mouse, keyboard, scroll, klik)</em>.
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>• Auto-Logout:</strong> Jika tidak ada aktivitas selama <strong style={{ color: 'var(--danger)' }}>{sessionTimeout || 10} menit berturut-turut</strong>, akun Anda akan otomatis terlogout demi keamanan.
                </div>
                <div style={{ marginTop: '2px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)', fontSize: '10.5px', opacity: 0.9 }}>
                  💡 Gunakan tombol <strong style={{ color: 'var(--text-primary)' }}>&quot;Tetap Aktif&quot;</strong> untuk menyegarkan timer secara manual.
                </div>
              </div>
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
          Tetap Aktif
        </button>
      </div>
    </div>
  );
}
