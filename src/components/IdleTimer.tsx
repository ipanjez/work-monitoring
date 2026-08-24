'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Clock, AlertTriangle, Info, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMaster } from '@/context/MasterContext';

export default function IdleTimer({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sessionTimeout } = useMaster();
  
  // Use sessionTimeout (in minutes) or fallback to 10
  const timeoutMinutes = sessionTimeout || 10;
  const sessionDurationMs = timeoutMinutes * 60 * 1000;
  const totalSeconds = sessionDurationMs / 1000;
  
  const [timeLeft, setTimeLeft] = useState(totalSeconds); 
  const [showInfo, setShowInfo] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (pathname === '/auth/signin' || pathname === '/auth/signup' || pathname === '/auth/forgot') return;

    let lastActive = Date.now();

    const handleActivity = () => {
      lastActive = Date.now();
      setTimeLeft(totalSeconds);
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
  }, [pathname, router, sessionDurationMs, totalSeconds]);

  const extendSession = () => {
    setIsExtending(true);
    setTimeLeft(totalSeconds);
    setTimeout(() => setIsExtending(false), 500);
    toast.success(`Sesi berhasil diperpanjang ke ${timeoutMinutes} menit!`, { duration: 2500 });
  };

  if (pathname === '/auth/signin' || pathname === '/auth/signup' || pathname === '/auth/forgot') return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentLeft = Math.max(0, Math.min(100, (timeLeft / totalSeconds) * 100));
  const isWarning = timeLeft <= 60; // < 1 minute
  const isCaution = !isWarning && percentLeft <= 35;

  const progressColor = isWarning 
    ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' 
    : isCaution 
    ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' 
    : 'linear-gradient(90deg, var(--accent-primary, #3b82f6) 0%, #10b981 100%)';

  if (isSidebarCollapsed) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 4px',
          background: isWarning ? 'rgba(239, 68, 68, 0.12)' : 'var(--input-bg)',
          border: `1px solid ${isWarning ? 'rgba(239, 68, 68, 0.6)' : 'var(--border-color)'}`,
          borderRadius: '12px',
          marginBottom: '6px',
          color: isWarning ? '#ef4444' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isWarning ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none'
        }}
        onClick={extendSession}
        title={`Sisa Waktu Sesi: ${minutes}:${seconds.toString().padStart(2, '0')} (Klik untuk perpanjang)`}
      >
        {isWarning ? (
          <AlertTriangle size={18} color="#ef4444" style={{ animation: 'pulse 1.2s infinite' }} />
        ) : (
          <Clock size={18} color="var(--accent-primary)" />
        )}
        <span style={{ 
          fontSize: '10.5px', 
          fontWeight: 700, 
          marginTop: '4px',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.2px',
          color: isWarning ? '#ef4444' : 'var(--text-primary)'
        }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '12px 14px',
      background: isWarning 
        ? 'rgba(239, 68, 68, 0.08)' 
        : 'var(--input-bg)',
      border: `1px solid ${isWarning ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'}`,
      borderRadius: '14px',
      marginBottom: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative',
      boxShadow: isWarning ? '0 4px 16px rgba(239, 68, 68, 0.15)' : 'none',
      transition: 'all 0.2s ease'
    }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
          {isWarning ? (
            <AlertTriangle size={15} color="#ef4444" style={{ animation: 'pulse 1.2s infinite', flexShrink: 0 }} />
          ) : (
            <Clock size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '12px', fontWeight: 700, color: isWarning ? '#ef4444' : 'var(--text-primary)' }}>
            Sisa Sesi
          </span>
          
          {/* Info Button with Hover/Click Popover */}
          <div 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', opacity: 0.7 }}
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            onClick={() => setShowInfo(!showInfo)}
            title="Penjelasan batas waktu sesi"
          >
            <Info size={13} style={{ color: showInfo ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
          </div>

          {showInfo && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: '-6px',
              padding: '12px 14px',
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
              width: '240px',
              fontSize: '11px',
              color: 'var(--text-primary)',
              zIndex: 10000,
              lineHeight: 1.45,
              backdropFilter: 'blur(16px)',
              animation: 'fadeIn 0.15s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '11.5px', color: 'var(--accent-primary)' }}>
                <ShieldCheck size={14} />
                <span>Pengaturan Batas Waktu Sesi</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>• Reset Otomatis:</strong> Timer sesi otomatis menyegarkan kembali ke <strong style={{ color: 'var(--text-primary)' }}>{timeoutMinutes} menit</strong> setiap kali Anda beraktivitas <em>(mouse, keyboard, scroll, klik)</em>.
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>• Auto-Logout:</strong> Jika tidak ada aktivitas selama <strong style={{ color: 'var(--danger)' }}>{timeoutMinutes} menit berturut-turut</strong>, akun Anda akan otomatis dikeluarkan demi keamanan data.
                </div>
                <div style={{ marginTop: '2px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)', fontSize: '10.5px', color: 'var(--accent-primary)' }}>
                  💡 Klik tombol <strong>&quot;Perpanjang Sesi&quot;</strong> kapan saja untuk me-reset timer.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Digital Countdown Timer */}
        <div style={{ 
          fontSize: '13px', 
          fontWeight: 800, 
          color: isWarning ? '#ef4444' : isCaution ? '#f59e0b' : 'var(--text-primary)', 
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'monospace, system-ui',
          letterSpacing: '0.5px'
        }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Interactive Progress Bar */}
      <div style={{
        width: '100%',
        height: '5px',
        background: 'rgba(0, 0, 0, 0.08)',
        borderRadius: '9999px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div 
          style={{
            width: `${percentLeft}%`,
            height: '100%',
            background: progressColor,
            borderRadius: '9999px',
            transition: 'width 1s linear, background 0.3s ease'
          }}
        />
      </div>
      
      {/* Warning Text when low */}
      {isWarning && (
        <div style={{ fontSize: '11px', color: '#ef4444', lineHeight: 1.25, fontWeight: 500 }}>
          Sesi hampir habis! Segera perpanjang agar tidak ter-logout otomatis.
        </div>
      )}

      {/* Action Button: Perpanjang Sesi */}
      <button 
        onClick={extendSession}
        type="button"
        disabled={isExtending}
        style={{ 
          width: '100%', 
          padding: '6px 10px', 
          fontSize: '11px', 
          fontWeight: 600,
          background: isWarning 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
            : 'var(--surface-color)', 
          border: `1px solid ${isWarning ? 'transparent' : 'var(--border-color)'}`, 
          borderRadius: '8px', 
          cursor: isExtending ? 'wait' : 'pointer', 
          color: isWarning ? 'white' : 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.15s ease',
          boxShadow: isWarning ? '0 2px 8px rgba(239, 68, 68, 0.3)' : '0 1px 3px rgba(0,0,0,0.04)'
        }}
        onMouseEnter={(e) => {
          if (!isWarning) {
            e.currentTarget.style.background = 'var(--surface-hover, rgba(0,0,0,0.06))';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isWarning) {
            e.currentTarget.style.background = 'var(--surface-color)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }
        }}
      >
        <RefreshCw size={12} className={isExtending ? 'animate-spin' : ''} style={{ opacity: 0.8 }} />
        <span>Perpanjang Sesi</span>
      </button>
    </div>
  );
}
