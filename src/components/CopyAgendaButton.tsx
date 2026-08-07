'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { getTaskLocationString, getLocalTimezone } from '@/utils/taskUtils';
import { copyToClipboard } from '@/utils/clipboard';

export default function CopyAgendaButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [customDays, setCustomDays] = useState<number>(2);
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

  const handleCopy = async (daysToCopy: number) => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Gagal memuat data');
      const allTasks = await res.json();
      
      const today = new Date();
      let copiedText = '';
      const tz = getLocalTimezone();

      for (let i = 0; i < daysToCopy; i++) {
        const targetDate = addDays(today, i);
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

        copiedText += `📌AGENDA \n🌟 ${format(targetDate, 'EEEE, dd MMMM yyyy', { locale: id })}\n\n`;

        if (filteredTasks.length === 0) {
          copiedText += 'Tidak ada agenda\n\n';
        } else {
          filteredTasks.forEach((task: any, index: number) => {
            const time = task.isAllDay ? 'Seharian' : `${task.startTime || '-'} ${tz}`;
            const location = getTaskLocationString(task) || '-';
            copiedText += `${index + 1}. ${task.nama}\n`;
            copiedText += `⏰️ : ${time}\n`;
            copiedText += `🏩 : ${location}\n\n`;
          });
        }
      }

      copiedText += `Lebih lanjut dapat mengecek https://internal-work-monitoring.vercel.app/calendar`;

      copyToClipboard(copiedText);
      toast.success(`Agenda ${daysToCopy} hari berhasil dicopy`);
      setIsOpen(false);
    } catch (err) {
      toast.error('Gagal mencopy agenda');
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1000 }} ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '45px', height: '45px', borderRadius: '50%', background: 'var(--surface-color)', 
          border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
        title="Copy Agenda"
      >
        <Share2 size={20} color="var(--text-primary)" style={{ transform: isOpen ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <div style={{ right: 0, top: '55px', position: 'absolute', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', minWidth: '220px', zIndex: 1000 }}>
          <div 
            style={{ padding: '10px', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}
            onClick={() => handleCopy(1)}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>Agenda Hari Ini</span>
            <Copy size={16} color="var(--text-secondary)" />
          </div>
          
          <div 
            style={{ padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>Agenda</span>
              <input 
                type="number" 
                min="1"
                value={customDays} 
                onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                style={{ width: '50px', padding: '4px', textAlign: 'center', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                onClick={(e) => e.stopPropagation()}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>Hari</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(customDays); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              title="Copy Agenda"
            >
              <Copy size={16} color="var(--text-secondary)" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
