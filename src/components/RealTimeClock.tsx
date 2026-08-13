'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function RealTimeClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return <div style={{ width: '80px' }} />; // placeholder width
  }

  const formattedTime = time.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div 
      className="realtime-clock-container"
      title="Waktu Perangkat"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        fontFamily: 'monospace',
        background: 'var(--surface-color)',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
      {formattedTime}
    </div>
  );
}
