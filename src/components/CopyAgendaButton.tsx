'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  CalendarDays, Copy, Check, Calendar, 
  Clock, Share2, Sparkles, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { getTaskLocationString, getLocalTimezone } from '@/utils/taskUtils';
import { copyToClipboard } from '@/utils/clipboard';

export default function CopyAgendaButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [customDays, setCustomDays] = useState<number>(2);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopy = async (daysToCopy: number, key: string, startOffset: number = 0) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Gagal memuat data pekerjaan');
      const allTasks = await res.json();
      
      const today = new Date();
      let copiedText = '';
      const tz = getLocalTimezone();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://internal-work-monitoring.vercel.app';

      for (let i = 0; i < daysToCopy; i++) {
        const targetDate = addDays(today, startOffset + i);
        const filteredTasks = allTasks.filter((t: any) => {
          const taskDate = t.startDate ? parseISO(t.startDate) : null;
          return taskDate && isSameDay(taskDate, targetDate);
        });

        filteredTasks.sort((a: any, b: any) => {
          const timeA = a.startTime || '00:00';
          const timeB = b.startTime || '00:00';
          return timeA.localeCompare(timeB);
        });

        if (i > 0) {
          copiedText += '\n\n';
        }

        copiedText += `📌 *AGENDA PEKERJAAN*\n🌟 *${format(targetDate, 'EEEE, dd MMMM yyyy', { locale: id })}*\n\n`;

        if (filteredTasks.length === 0) {
          copiedText += '_Tidak ada agenda pekerjaan terdaftar_\n';
        } else {
          filteredTasks.forEach((task: any, index: number) => {
            const time = task.isAllDay ? 'Seharian' : `${task.startTime || '-'} ${tz}`;
            const location = getTaskLocationString(task) || '-';
            const pic = task.pic ? ` [PIC: ${task.pic}]` : '';
            const status = task.status ? ` (${task.status})` : '';

            copiedText += `${index + 1}. *${task.nama}*${pic}${status}\n`;
            copiedText += `   ⏰ Waktu: ${time}\n`;
            copiedText += `   📍 Lokasi: ${location}\n\n`;
          });
        }
      }

      copiedText += `\n🔗 *Lihat Kalender Lengkap:* ${origin}/calendar`;

      copyToClipboard(copiedText);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);

      const label = daysToCopy === 1 
        ? (startOffset === 1 ? 'Agenda Besok' : 'Agenda Hari Ini')
        : `Agenda ${daysToCopy} Hari`;
      toast.success(`${label} berhasil disalin ke clipboard! 📋`, { duration: 3000 });
      setIsOpen(false);
    } catch (err) {
      toast.error('Gagal menyalin agenda');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const todayStr = format(new Date(), 'dd MMM', { locale: id });
  const tomorrowStr = format(addDays(new Date(), 1), 'dd MMM', { locale: id });

  return (
    <div 
      id="copy-agenda-btn-container"
      style={{ position: 'relative', zIndex: 1000 }} 
      ref={panelRef}
    >
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        title="Salin Agenda Tim (WhatsApp / Kalender)"
        style={{
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          background: isOpen ? 'var(--accent-primary)' : 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpen ? 'white' : 'var(--text-secondary)',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transition: 'all 0.2s',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.color = 'var(--accent-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
      >
        <CalendarDays size={20} style={{ transform: isOpen ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.2s ease' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          style={{ 
            right: 0, 
            top: '50px', 
            position: 'absolute', 
            background: 'var(--surface-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '14px', 
            padding: '12px', 
            boxShadow: '0 12px 36px rgba(0,0,0,0.18)', 
            width: '280px', 
            zIndex: 1000,
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Header */}
          <div style={{ paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Share2 size={14} color="var(--accent-primary)" />
              Salin Agenda Tim
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Format teks rapi untuk WhatsApp & grup
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* 1. Today */}
            <button
              onClick={() => handleCopy(1, 'today', 0)}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'var(--input-bg)',
                border: '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'var(--input-bg)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} color="var(--accent-primary)" />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Agenda Hari Ini</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{todayStr}</div>
                </div>
              </div>
              {copiedKey === 'today' ? (
                <Check size={16} color="#10b981" />
              ) : (
                <Copy size={14} color="var(--text-secondary)" />
              )}
            </button>

            {/* 2. Tomorrow */}
            <button
              onClick={() => handleCopy(1, 'tomorrow', 1)}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'var(--input-bg)',
                border: '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'var(--input-bg)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} color="#10b981" />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Agenda Besok</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{tomorrowStr}</div>
                </div>
              </div>
              {copiedKey === 'tomorrow' ? (
                <Check size={16} color="#10b981" />
              ) : (
                <Copy size={14} color="var(--text-secondary)" />
              )}
            </button>

            {/* 3. 3 Days */}
            <button
              onClick={() => handleCopy(3, '3days', 0)}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'var(--input-bg)',
                border: '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'var(--input-bg)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>3 Hari Kedepan</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Hari ini s/d H+2</div>
                </div>
              </div>
              {copiedKey === '3days' ? (
                <Check size={16} color="#10b981" />
              ) : (
                <Copy size={14} color="var(--text-secondary)" />
              )}
            </button>

            {/* 4. 7 Days (1 Week) */}
            <button
              onClick={() => handleCopy(7, '7days', 0)}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'var(--input-bg)',
                border: '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'var(--input-bg)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={15} color="#8b5cf6" />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>1 Minggu Penuh</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>7 hari ke depan</div>
                </div>
              </div>
              {copiedKey === '7days' ? (
                <Check size={16} color="#10b981" />
              ) : (
                <Copy size={14} color="var(--text-secondary)" />
              )}
            </button>

            {/* 5. Custom Days */}
            <div 
              style={{ 
                padding: '8px 12px', 
                borderRadius: '8px', 
                background: 'var(--input-bg)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginTop: '4px',
                border: '1px dashed var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>Kustom:</span>
                <input 
                  type="number" 
                  min="1"
                  max="30"
                  value={customDays} 
                  onChange={(e) => setCustomDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                  style={{ 
                    width: '44px', 
                    padding: '3px 4px', 
                    textAlign: 'center', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color)', 
                    backgroundColor: 'var(--surface-color)', 
                    color: 'var(--text-primary)', 
                    fontSize: '12px',
                    fontWeight: 700,
                    outline: 'none' 
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hari</span>
              </div>
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleCopy(customDays, 'custom', 0); 
                }}
                disabled={isLoading}
                title={`Salin agenda ${customDays} hari`}
                style={{ 
                  background: 'var(--accent-primary)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 600,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {copiedKey === 'custom' ? <Check size={13} /> : <Copy size={13} />}
                Salin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
