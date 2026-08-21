'use client';

import React, { useState } from 'react';
import { useRealtimeSync } from '@/context/RealtimeSyncContext';
import { RefreshCw, Zap, Wifi, WifiOff, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SyncStatusBadge({ compact = false }: { compact?: boolean }) {
  const { isSyncing, isLive, lastSyncedAt, syncNow } = useRealtimeSync();
  const [isHovered, setIsHovered] = useState(false);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSyncing) return;
    try {
      await syncNow();
      toast.success('Data pekerjaan telah diperbarui ke versi terkini! ⚡', { id: 'manual-sync-toast', duration: 2500 });
    } catch {
      toast.error('Gagal menyinkronkan data.');
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleManualSync}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: compact ? '4px 8px' : '5px 10px',
        borderRadius: '20px',
        fontSize: '11.5px',
        fontWeight: 600,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        background: isSyncing 
          ? 'rgba(59, 130, 246, 0.12)' 
          : isLive 
            ? 'rgba(16, 185, 129, 0.08)' 
            : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${
          isSyncing 
            ? 'rgba(59, 130, 246, 0.25)' 
            : isLive 
              ? 'rgba(16, 185, 129, 0.2)' 
              : 'rgba(239, 68, 68, 0.25)'
        }`,
        color: isSyncing 
          ? '#2563eb' 
          : isLive 
            ? '#059669' 
            : '#dc2626',
      }}
      title={
        isSyncing
          ? 'Sedang menyinkronkan data terbaru...'
          : isLive
            ? `Sinkronisasi Real-Time Aktif (Klik untuk perbarui manual). Terakhir: ${lastSyncedAt ? lastSyncedAt.toLocaleTimeString('id-ID') : 'Baru saja'}`
            : 'Mencoba menghubungkan kembali...'
      }
    >
      {/* Icon / Status Dot */}
      {isSyncing ? (
        <RefreshCw 
          size={12} 
          style={{ 
            animation: 'spin 0.8s linear infinite',
            flexShrink: 0 
          }} 
        />
      ) : isLive ? (
        <span style={{ position: 'relative', display: 'flex', width: '7px', height: '7px', flexShrink: 0 }}>
          <span 
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              opacity: 0.75,
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
            }}
          />
          <span 
            style={{
              position: 'relative',
              display: 'inline-flex',
              borderRadius: '50%',
              width: '7px',
              height: '7px',
              backgroundColor: '#059669'
            }}
          />
        </span>
      ) : (
        <WifiOff size={12} style={{ flexShrink: 0 }} />
      )}

      {/* Label Text */}
      {!compact && (
        <span style={{ whiteSpace: 'nowrap' }}>
          {isSyncing ? (
            'Sinkronisasi...'
          ) : isHovered ? (
            'Sinkronkan ⚡'
          ) : isLive ? (
            'Live Sync'
          ) : (
            'Offline'
          )}
        </span>
      )}
    </div>
  );
}
