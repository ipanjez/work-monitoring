'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMaster } from '@/context/MasterContext';

export default function IdleTimer({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const pathname = usePathname();
  const { sessionTimeout } = useMaster();
  
  const timeoutMinutes = sessionTimeout || 10;
  const sessionDurationMs = timeoutMinutes * 60 * 1000;
  const totalSeconds = sessionDurationMs / 1000;
  
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const lastActiveRef = useRef(Date.now());

  useEffect(() => {
    if (pathname === '/auth/signin' || pathname === '/auth/signup' || pathname === '/auth/forgot') return;

    const handleActivity = () => {
      lastActiveRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const timer = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActiveRef.current;
      const remainingSeconds = Math.max(0, Math.floor((sessionDurationMs - inactiveTime) / 1000));
      
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(timer);
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('scroll', handleActivity);
        signOut({ callbackUrl: '/auth/signin?reason=timeout', redirect: true });
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [pathname, sessionDurationMs]);

  if (pathname === '/auth/signin' || pathname === '/auth/signup' || pathname === '/auth/forgot') return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentLeft = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100));
  
  // States: active (green), caution (<35%), warning (<1 min)
  const isWarning = timeLeft <= 60;
  const isCaution = !isWarning && percentLeft <= 35;
  const isActive = !isWarning && !isCaution;

  // Only show countdown text when idle long enough to matter (< 2 min remaining)
  const showCountdown = timeLeft < 120;

  const dotColor = isWarning ? '#ef4444' : isCaution ? '#f59e0b' : '#22c55e';
  const statusText = isWarning 
    ? `${minutes}:${seconds.toString().padStart(2, '0')}` 
    : isCaution 
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : 'Aktif';

  // Collapsed sidebar: just a colored dot
  if (isSidebarCollapsed) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 4px',
          marginBottom: '6px',
        }}
        title={`Sesi ${isActive ? 'aktif' : isWarning ? 'hampir habis' : 'menipis'} — Auto-logout jika idle ${timeoutMinutes} menit`}
      >
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: dotColor,
          boxShadow: `0 0 6px ${dotColor}80`,
          animation: isWarning ? 'pulse 1.2s infinite' : 'none',
          transition: 'all 0.3s ease'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      padding: '10px 14px',
      background: isWarning 
        ? 'rgba(239, 68, 68, 0.08)' 
        : 'var(--input-bg)',
      border: `1px solid ${isWarning ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'}`,
      borderRadius: '12px',
      marginBottom: '6px',
      transition: 'all 0.3s ease',
      boxShadow: isWarning ? '0 2px 12px rgba(239, 68, 68, 0.15)' : 'none',
    }}>
      {/* Main row: icon + status text + timer/status badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isWarning ? (
            <AlertTriangle size={14} color="#ef4444" style={{ animation: 'pulse 1.2s infinite', flexShrink: 0 }} />
          ) : (
            <ShieldCheck size={14} color={dotColor} style={{ flexShrink: 0 }} />
          )}
          <span style={{ 
            fontSize: '11.5px', 
            fontWeight: 600, 
            color: isWarning ? '#ef4444' : 'var(--text-secondary)',
            lineHeight: 1.2,
          }}>
            Sisa Sesi
          </span>
        </div>

        {/* Status badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          background: isWarning 
            ? 'rgba(239, 68, 68, 0.15)' 
            : isCaution 
            ? 'rgba(245, 158, 11, 0.12)' 
            : 'rgba(34, 197, 94, 0.1)',
          color: dotColor,
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 4px ${dotColor}60`,
            animation: isWarning ? 'pulse 1.2s infinite' : 'none',
            flexShrink: 0,
          }} />
          <span>{statusText}</span>
        </div>
      </div>

      {/* Warning message when truly idle */}
      {isWarning && (
        <div style={{ 
          marginTop: '6px', 
          fontSize: '10.5px', 
          color: '#ef4444', 
          lineHeight: 1.3, 
          fontWeight: 500,
          paddingTop: '6px',
          borderTop: '1px solid rgba(239, 68, 68, 0.15)'
        }}>
          ⚠️ Sesi hampir habis! Gerakkan mouse atau tekan keyboard untuk mencegah auto-logout.
        </div>
      )}
    </div>
  );
}
