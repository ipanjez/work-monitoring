import React, { useState } from 'react';
import { SubTask } from '@/utils/taskUtils';
import { format, differenceInDays, startOfDay, isAfter, isBefore } from 'date-fns';

interface TaskTimelineProps {
  startDate?: string | Date;
  endDate?: string | Date;
  subTasks: SubTask[];
  masterColors?: any;
}

export default function TaskTimeline({ startDate, endDate, subTasks, masterColors }: TaskTimelineProps) {
  const [hoveredItem, setHoveredItem] = useState<any | null>(null);

  if (!startDate || !endDate) return null;

  const start = startOfDay(new Date(startDate));
  const end = startOfDay(new Date(endDate));
  let totalDays = differenceInDays(end, start);
  if (totalDays < 0) totalDays = 0; // Fallback for invalid dates
  
  // Calculate today's progress
  const today = startOfDay(new Date());
  let todayProgress = 0;
  if (totalDays === 0) {
    todayProgress = isBefore(today, start) ? 0 : 100;
  } else {
    const elapsedDays = differenceInDays(today, start);
    todayProgress = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
  }

  // Filter subtasks that have deadlines
  const subTasksWithDates = subTasks
    .filter(st => st.tenggatWaktu)
    .map(st => {
      const stDate = startOfDay(new Date(st.tenggatWaktu!));
      let pos = 0;
      if (totalDays === 0) {
        pos = isBefore(stDate, start) ? 0 : 100;
      } else {
        const daysFromStart = differenceInDays(stDate, start);
        pos = Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
      }
      return { ...st, dateObj: stDate, position: pos };
    });

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

  const minTimelineWidth = Math.max(100, subTasksWithDates.length * 8) + '%';
  const containerMinWidth = Math.max(600, subTasksWithDates.length * 60) + 'px';

  return (
    <div style={{ padding: '24px 16px 40px 16px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px', position: 'relative' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '32px' }}>Timeline Pekerjaan</h4>
      
      <div style={{ overflowX: 'auto', paddingBottom: '32px', paddingTop: '16px', margin: '0 -8px', padding: '16px 24px 32px 24px' }} className="custom-scrollbar">
        <div style={{ minWidth: containerMinWidth, position: 'relative', height: '6px', background: 'var(--border-color)', borderRadius: '4px' }}>
          
          {/* Progress Bar (Today) */}
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            bottom: 0, 
            width: `${todayProgress}%`, 
            background: 'var(--accent-primary)', 
            borderRadius: '4px',
            transition: 'width 0.5s ease'
          }} 
        />

        {/* Start Point */}
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: todayProgress > 0 ? 'var(--accent-primary)' : 'var(--bg-color)', border: '2px solid var(--accent-primary)', zIndex: 2 }} />
          <span style={{ position: 'absolute', top: '16px', fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {format(start, 'dd MMM')}
          </span>
        </div>

        {/* End Point */}
        <div style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: todayProgress >= 100 ? 'var(--accent-primary)' : 'var(--bg-color)', border: '2px solid var(--accent-primary)', zIndex: 2 }} />
          <span style={{ position: 'absolute', top: '16px', fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {format(end, 'dd MMM')}
          </span>
        </div>

        {/* Today Marker */}
        {todayProgress >= 0 && todayProgress <= 100 && (
          <div style={{ position: 'absolute', left: `${todayProgress}%`, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 3 }}>
            <div style={{ width: '2px', height: '20px', background: 'var(--accent-primary)', margin: '0 auto' }} />
            <span style={{ position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}>
              Hari Ini
            </span>
          </div>
        )}

        {/* Subtask Markers */}
        {subTasksWithDates.map((st, i) => (
          <div 
            key={st.id} 
            style={{ 
              position: 'absolute', 
              left: `${st.position}%`, 
              top: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 4,
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredItem(st)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div style={{ 
              width: '14px', 
              height: '14px', 
              borderRadius: '50%', 
              background: getStatusColor(st.status), 
              border: '2px solid var(--bg-color)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
              transform: hoveredItem?.id === st.id ? 'scale(1.2)' : 'scale(1)'
            }} 
            />
            {/* Tooltip */}
            {hoveredItem?.id === st.id && (
              <div style={{
                position: 'absolute',
                bottom: '24px',
                ...(st.position < 15 ? { left: '-10px', transform: 'none' } : st.position > 85 ? { right: '-10px', transform: 'none' } : { left: '50%', transform: 'translateX(-50%)' }),
                background: 'var(--modal-bg)',
                border: '1px solid var(--border-color)',
                padding: '8px 12px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                width: 'max-content',
                maxWidth: '250px',
                zIndex: 10,
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {format(st.dateObj, 'dd MMM yyyy')}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'normal', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {st.text}
                </div>
                <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 'bold', color: getStatusColor(st.status) }}>
                  {st.status}
                </div>
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
