import React from 'react';
import { SubTask } from '@/utils/taskUtils';
import { format, startOfDay } from 'date-fns';

interface TaskTimelineProps {
  startDate?: string | Date;
  endDate?: string | Date;
  subTasks: SubTask[];
  masterColors?: any;
}

interface TimelineEvent {
  id: string;
  type: 'start' | 'end' | 'today' | 'subtask';
  date: Date;
  title: string;
  status?: string;
  color: string;
}

export default function TaskTimeline({ startDate, endDate, subTasks, masterColors }: TaskTimelineProps) {
  if (!startDate) return null;

  const start = startOfDay(new Date(startDate));
  const end = endDate ? startOfDay(new Date(endDate)) : start;
  const today = startOfDay(new Date());

  const getStatusColor = (status: string) => {
    if (masterColors) {
      const key = `status_${status}`;
      const c = masterColors[key];
      if (c && c !== '#ffffff' && c !== '#ffffff00' && c !== '#fff') {
        return c.length === 9 ? c.substring(0, 7) : c;
      }
    }
    
    if (status === 'Done') return '#10b981';
    if (status === 'In Progress') return '#f59e0b';
    if (status === 'To Do' || status === 'Pending') return '#ef4444';
    return '#3b82f6';
  };

  const events: TimelineEvent[] = [];

  events.push({
    id: 'start',
    type: 'start',
    date: start,
    title: 'Mulai Pekerjaan',
    color: 'var(--text-secondary)'
  });

  if (end.getTime() !== start.getTime()) {
    events.push({
      id: 'end',
      type: 'end',
      date: end,
      title: 'Batas Waktu',
      color: 'var(--text-secondary)'
    });
  }

  events.push({
    id: 'today',
    type: 'today',
    date: today,
    title: 'Hari Ini',
    color: 'var(--accent-primary)'
  });

  subTasks.forEach(st => {
    if (st.tenggatWaktu) {
      events.push({
        id: `subtask-${st.id}`,
        type: 'subtask',
        date: startOfDay(new Date(st.tenggatWaktu)),
        title: st.text,
        status: st.status,
        color: getStatusColor(st.status)
      });
    }
  });

  // Sort chronologically
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div style={{ padding: '24px 16px 24px 16px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '32px', textAlign: 'center' }}>
        Alur Timeline Pekerjaan
      </h4>
      
      <div style={{ position: 'relative', margin: '0 auto', width: '100%', maxWidth: '600px' }}>
        {/* Central Vertical Line */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-color)' }} />

        {events.map((ev, index) => {
          const isLeft = index % 2 === 0;
          const isSpecial = ev.type !== 'subtask';

          return (
            <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative', width: '100%' }}>
              
              {/* Left Side */}
              <div style={{ width: '45%', textAlign: 'right', paddingRight: '16px', paddingTop: '2px' }}>
                {isLeft && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                      {format(ev.date, 'dd MMM yyyy')}
                    </span>
                    <div style={{ 
                      background: isSpecial ? 'transparent' : 'var(--modal-bg)', 
                      border: isSpecial ? 'none' : '1px solid var(--border-color)', 
                      padding: isSpecial ? 0 : '10px 12px', 
                      borderRadius: '8px',
                      color: ev.type === 'today' ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontWeight: isSpecial ? 600 : 500,
                      fontSize: '12px',
                      width: '100%',
                      boxShadow: isSpecial ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.5 }}>
                        {ev.title}
                      </div>
                      {ev.status && (
                        <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: 'bold', color: ev.color }}>
                          {ev.status}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Center Dot */}
              <div style={{ position: 'absolute', left: '50%', transform: 'translate(-50%, 4px)', width: isSpecial ? '12px' : '16px', height: isSpecial ? '12px' : '16px', borderRadius: '50%', background: ev.color, border: '2px solid var(--surface-color)', boxShadow: '0 0 0 2px var(--border-color), 0 2px 4px rgba(0,0,0,0.2)', zIndex: 2 }} />

              {/* Right Side */}
              <div style={{ width: '45%', textAlign: 'left', paddingLeft: '16px', paddingTop: '2px' }}>
                {!isLeft && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                      {format(ev.date, 'dd MMM yyyy')}
                    </span>
                    <div style={{ 
                      background: isSpecial ? 'transparent' : 'var(--modal-bg)', 
                      border: isSpecial ? 'none' : '1px solid var(--border-color)', 
                      padding: isSpecial ? 0 : '10px 12px', 
                      borderRadius: '8px',
                      color: ev.type === 'today' ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontWeight: isSpecial ? 600 : 500,
                      fontSize: '12px',
                      width: '100%',
                      boxShadow: isSpecial ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.5 }}>
                        {ev.title}
                      </div>
                      {ev.status && (
                        <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: 'bold', color: ev.color }}>
                          {ev.status}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
