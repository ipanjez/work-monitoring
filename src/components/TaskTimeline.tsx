import React, { useState } from 'react';
import { SubTask, formatDescription } from '@/utils/taskUtils';
import { User } from 'lucide-react';
import { format, startOfDay } from 'date-fns';

interface TaskTimelineProps {
  startDate?: string | Date;
  endDate?: string | Date;
  subTasks: SubTask[];
  masterColors?: any;
  mainPic?: string;
}

interface TimelineEvent {
  id: string;
  type: 'start' | 'end' | 'today' | 'subtask';
  date: Date;
  title: string;
  status?: string;
  color: string;
  pic?: string;
}

export default function TaskTimeline({ startDate, endDate, subTasks, masterColors, mainPic }: TaskTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        color: getStatusColor(st.status),
        pic: st.pic || mainPic
      });
    }
  });

  const typeOrder = {
    start: 1,
    today: 2,
    subtask: 3,
    end: 4
  };

  // Sort chronologically and by type priority
  events.sort((a, b) => {
    const timeDiff = a.date.getTime() - b.date.getTime();
    if (timeDiff !== 0) return timeDiff;
    return typeOrder[a.type] - typeOrder[b.type];
  });

  const statusCounts = subTasks.reduce((acc, st) => {
    acc[st.status] = (acc[st.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statusSummary = Object.entries(statusCounts)
    .map(([status, count]) => `${count} ${status}`)
    .join(', ');

  return (
    <div style={{ padding: '24px 16px 24px 16px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'center' }}>
        Alur Timeline Pekerjaan
      </h4>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px' }}>
        {statusSummary ? `(${statusSummary})` : ''}
      </div>
      
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
                    <div 
                      onClick={() => !isSpecial && setExpandedId(expandedId === ev.id ? null : ev.id)}
                      style={{ 
                      background: isSpecial ? 'transparent' : 'var(--modal-bg)', 
                      border: isSpecial ? 'none' : '1px solid var(--border-color)', 
                      padding: isSpecial ? 0 : '10px 12px', 
                      borderRadius: '8px',
                      color: ev.type === 'today' ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontWeight: isSpecial ? 600 : 500,
                      fontSize: '12px',
                      width: '100%',
                      boxShadow: isSpecial ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                      cursor: isSpecial ? 'default' : 'pointer'
                    }}>
                      <div 
                        style={{ 
                          wordBreak: 'break-word', 
                          whiteSpace: 'normal', 
                          lineHeight: 1.5,
                          display: isSpecial ? 'block' : '-webkit-box',
                          WebkitLineClamp: isSpecial || expandedId === ev.id ? undefined : 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: isSpecial || expandedId === ev.id ? 'visible' : 'hidden'
                        }}
                        dangerouslySetInnerHTML={!isSpecial ? { __html: formatDescription(ev.title) } : undefined}
                      >
                        {isSpecial ? ev.title : null}
                      </div>
                      {!isSpecial && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          {ev.pic && (
                            <span style={{ fontSize: '10px', color: 'var(--text-primary)', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={10} /> {ev.pic}
                            </span>
                          )}
                          {ev.status && (
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: ev.color }}>
                              {ev.status}
                            </span>
                          )}
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
                    <div 
                      onClick={() => !isSpecial && setExpandedId(expandedId === ev.id ? null : ev.id)}
                      style={{ 
                      background: isSpecial ? 'transparent' : 'var(--modal-bg)', 
                      border: isSpecial ? 'none' : '1px solid var(--border-color)', 
                      padding: isSpecial ? 0 : '10px 12px', 
                      borderRadius: '8px',
                      color: ev.type === 'today' ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontWeight: isSpecial ? 600 : 500,
                      fontSize: '12px',
                      width: '100%',
                      boxShadow: isSpecial ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                      cursor: isSpecial ? 'default' : 'pointer'
                    }}>
                      <div 
                        style={{ 
                          wordBreak: 'break-word', 
                          whiteSpace: 'normal', 
                          lineHeight: 1.5,
                          display: isSpecial ? 'block' : '-webkit-box',
                          WebkitLineClamp: isSpecial || expandedId === ev.id ? undefined : 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: isSpecial || expandedId === ev.id ? 'visible' : 'hidden'
                        }}
                        dangerouslySetInnerHTML={!isSpecial ? { __html: formatDescription(ev.title) } : undefined}
                      >
                        {isSpecial ? ev.title : null}
                      </div>
                      {!isSpecial && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          {ev.status && (
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: ev.color }}>
                              {ev.status}
                            </span>
                          )}
                          {ev.pic && (
                            <span style={{ fontSize: '10px', color: 'var(--text-primary)', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={10} /> {ev.pic}
                            </span>
                          )}
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
