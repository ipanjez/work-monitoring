import React, { useState, useEffect, useMemo } from 'react';
import { SubTask, formatDescription, safeParseDate, safeFormatDate, safeParseSubTasks } from '@/utils/taskUtils';
import { User } from 'lucide-react';
import { startOfDay } from 'date-fns';

interface TaskTimelineProps {
  startDate?: string | Date;
  endDate?: string | Date;
  subTasks?: SubTask[] | string | null;
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
  additionalPics?: string[];
}

export default function TaskTimeline({ startDate, endDate, subTasks, masterColors, mainPic }: TaskTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoize all timeline calculations strictly BEFORE early return to prevent React Hook Violations
  const timelineData = useMemo(() => {
    const parsedStartDate = safeParseDate(startDate);
    if (!parsedStartDate) return null;

    const start = startOfDay(parsedStartDate);
    const parsedEndDate = safeParseDate(endDate);
    const end = parsedEndDate ? startOfDay(parsedEndDate) : start;
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
        color: '#dc2626'
      });
    }

    if (today.getTime() >= start.getTime() && today.getTime() <= end.getTime()) {
      events.push({
        id: 'today',
        type: 'today',
        date: today,
        title: 'Hari Ini',
        color: 'var(--accent-primary)'
      });
    }

    const safeSubs = safeParseSubTasks(subTasks);
    safeSubs.forEach((st) => {
      if (st.tenggatWaktu) {
        const parsedStDate = safeParseDate(st.tenggatWaktu);
        if (parsedStDate) {
          const sdate = startOfDay(parsedStDate);
          events.push({
            id: st.id || `subtask-${st.text}`,
            type: 'subtask',
            date: sdate,
            title: st.text || 'Sub Pekerjaan',
            status: st.status || 'To Do',
            color: getStatusColor(st.status || 'To Do'),
            pic: st.pic || mainPic,
            additionalPics: st.additionalPics
          });
        }
      }
    });

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    const groupedEvents: { id: string; date: Date; color: string; hasSubtasks: boolean; events: TimelineEvent[] }[] = [];
    events.forEach((ev) => {
      const key = safeFormatDate(ev.date, 'yyyy-MM-dd', 'invalid-date');
      let group = groupedEvents.find(g => safeFormatDate(g.date, 'yyyy-MM-dd') === key);
      if (!group) {
        group = {
          id: key,
          date: ev.date,
          color: ev.color,
          hasSubtasks: ev.type === 'subtask',
          events: []
        };
        groupedEvents.push(group);
      }
      group.events.push(ev);
      if (ev.type === 'subtask') {
        group.hasSubtasks = true;
        group.color = ev.color;
      } else if (!group.hasSubtasks && (ev.type === 'today' || ev.type === 'end')) {
        group.color = ev.color;
      }
    });

    // Sort events in each group so milestones appear first, then subtasks
    groupedEvents.forEach(g => {
      g.events.sort((a, b) => {
        if (a.type !== 'subtask' && b.type === 'subtask') return -1;
        if (a.type === 'subtask' && b.type !== 'subtask') return 1;
        return 0;
      });
    });

    const statusCounts = safeSubs.reduce((acc, st) => {
      const s = st.status || 'To Do';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusSummary = Object.entries(statusCounts)
      .map(([status, count]) => `${count} ${status}`)
      .join(', ');

    return { events, groupedEvents, statusSummary };
  }, [startDate, endDate, subTasks, masterColors, mainPic]);

  // Early return safely placed after all hooks have been invoked
  if (!timelineData) return null;

  const { events, groupedEvents, statusSummary } = timelineData;

  return (
    <div style={{ padding: isMobile ? '16px 12px' : '24px 16px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'center' }}>
        Alur Timeline Pekerjaan
      </h4>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: isMobile ? '20px' : '32px' }}>
        {statusSummary ? `(${statusSummary})` : ''}
      </div>
      
      <div style={{ position: 'relative', margin: '0 auto', width: '100%', maxWidth: '600px', maxHeight: isTimelineExpanded ? 'none' : '300px', overflowY: 'hidden', transition: 'max-height 0.3s ease-in-out' }}>
        {/* Central Vertical Line */}
        <div style={{ 
          position: 'absolute', 
          left: isMobile ? '16px' : '50%', 
          transform: isMobile ? 'none' : 'translateX(-50%)', 
          top: '10px', 
          bottom: '10px', 
          width: '2px', 
          background: 'var(--border-color)' 
        }} />

        {groupedEvents.map((group, index) => {
          const isLeft = index % 2 === 0;

          if (isMobile) {
            return (
              <div key={`${group.id}-${index}`} style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px', position: 'relative', width: '100%', paddingLeft: '36px' }}>
                {/* Left Dot */}
                <div style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '6px', 
                  transform: 'translateX(-50%)', 
                  width: group.hasSubtasks ? '16px' : '12px', 
                  height: group.hasSubtasks ? '16px' : '12px', 
                  borderRadius: '50%', 
                  background: group.color, 
                  border: '2px solid var(--surface-color)', 
                  boxShadow: '0 0 0 2px var(--border-color), 0 2px 4px rgba(0,0,0,0.1)', 
                  zIndex: 2 
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {safeFormatDate(group.date, 'dd MMM yyyy')}
                  </span>
                  {group.events.map((ev, evidx) => {
                    const isEvSpecial = ev.type === 'start' || ev.type === 'end' || ev.type === 'today';
                    return (
                      <div 
                        key={ev.id ? `${ev.id}-${evidx}` : `ev-${evidx}`}
                        onClick={() => !isEvSpecial && setExpandedId(expandedId === ev.id ? null : ev.id)}
                        style={{ 
                          background: isEvSpecial ? 'transparent' : 'var(--modal-bg)', 
                          border: isEvSpecial ? 'none' : '1px solid var(--border-color)', 
                          padding: isEvSpecial ? '2px 0' : '10px 12px', 
                          borderRadius: '8px',
                          color: ev.type === 'today' ? 'var(--accent-primary)' : ev.type === 'end' ? 'var(--danger)' : 'var(--text-primary)',
                          fontWeight: isEvSpecial ? 600 : 500,
                          fontSize: '12px',
                          width: '100%',
                          boxShadow: isEvSpecial ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                          cursor: isEvSpecial ? 'default' : 'pointer'
                        }}>
                        <div 
                          style={{ 
                            wordBreak: 'break-word', 
                            whiteSpace: 'normal', 
                            lineHeight: 1.5,
                            display: isEvSpecial ? 'block' : '-webkit-box',
                            WebkitLineClamp: isEvSpecial || expandedId === ev.id ? undefined : 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: isEvSpecial || expandedId === ev.id ? 'visible' : 'hidden'
                          }}
                          dangerouslySetInnerHTML={!isEvSpecial ? { __html: formatDescription(ev.title) } : undefined}
                        >
                          {isEvSpecial ? ev.title : null}
                        </div>
                        {!isEvSpecial && (
                          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                            {ev.status && (
                              <span style={{ fontSize: '10px', fontWeight: 'bold', color: ev.color }}>
                                {ev.status}
                              </span>
                            )}
                            {[ev.pic, ...(ev.additionalPics || [])].filter(Boolean).map((p, pidx) => (
                              <span key={pidx} style={{ fontSize: '10px', color: 'var(--text-primary)', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                <User size={10} /> {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div key={`${group.id}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative', width: '100%' }}>
              
              {/* Left Side */}
              <div style={{ width: '45%', textAlign: 'right', paddingRight: '16px', paddingTop: '2px' }}>
                {isLeft && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                      {safeFormatDate(group.date, 'dd MMM yyyy')}
                    </span>
                    {group.events.map((ev, evidx) => {
                      const isEvSpecial = ev.type === 'start' || ev.type === 'end' || ev.type === 'today';
                      return (
                        <div 
                          key={ev.id ? `${ev.id}-${evidx}` : `ev-${evidx}`}
                          onClick={() => !isEvSpecial && setExpandedId(expandedId === ev.id ? null : ev.id)}
                          style={{ 
                            background: isEvSpecial ? 'transparent' : 'var(--modal-bg)', 
                            border: isEvSpecial ? 'none' : '1px solid var(--border-color)', 
                            padding: isEvSpecial ? '2px 0' : '10px 12px', 
                            borderRadius: '8px',
                            color: ev.type === 'today' ? 'var(--accent-primary)' : ev.type === 'end' ? 'var(--danger)' : 'var(--text-primary)',
                            fontWeight: isEvSpecial ? 600 : 500,
                            fontSize: '12px',
                            width: '100%',
                            boxShadow: isEvSpecial ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                            cursor: isEvSpecial ? 'default' : 'pointer'
                          }}>
                          <div 
                            style={{ 
                              wordBreak: 'break-word', 
                              whiteSpace: 'normal', 
                              lineHeight: 1.5,
                              display: isEvSpecial ? 'block' : '-webkit-box',
                              WebkitLineClamp: isEvSpecial || expandedId === ev.id ? undefined : 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: isEvSpecial || expandedId === ev.id ? 'visible' : 'hidden'
                            }}
                            dangerouslySetInnerHTML={!isEvSpecial ? { __html: formatDescription(ev.title) } : undefined}
                          >
                            {isEvSpecial ? ev.title : null}
                          </div>
                          {!isEvSpecial && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                              {[ev.pic, ...(ev.additionalPics || [])].filter(Boolean).map((p, pidx) => (
                                <span key={pidx} style={{ fontSize: '10px', color: 'var(--text-primary)', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <User size={10} /> {p}
                                </span>
                              ))}
                              {ev.status && (
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: ev.color }}>
                                  {ev.status}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Center Dot */}
              <div style={{ 
                position: 'absolute', 
                left: '50%', 
                transform: 'translate(-50%, 4px)', 
                width: group.hasSubtasks ? '16px' : '12px', 
                height: group.hasSubtasks ? '16px' : '12px', 
                borderRadius: '50%', 
                background: group.color, 
                border: '2px solid var(--surface-color)', 
                boxShadow: '0 0 0 2px var(--border-color), 0 2px 4px rgba(0,0,0,0.2)', 
                zIndex: 2 
              }} />

              {/* Right Side */}
              <div style={{ width: '45%', textAlign: 'left', paddingLeft: '16px', paddingTop: '2px' }}>
                {!isLeft && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                      {safeFormatDate(group.date, 'dd MMM yyyy')}
                    </span>
                    {group.events.map((ev, evidx) => {
                      const isEvSpecial = ev.type === 'start' || ev.type === 'end' || ev.type === 'today';
                      return (
                        <div 
                          key={ev.id ? `${ev.id}-${evidx}` : `ev-${evidx}`}
                          onClick={() => !isEvSpecial && setExpandedId(expandedId === ev.id ? null : ev.id)}
                          style={{ 
                            background: isEvSpecial ? 'transparent' : 'var(--modal-bg)', 
                            border: isEvSpecial ? 'none' : '1px solid var(--border-color)', 
                            padding: isEvSpecial ? '2px 0' : '10px 12px', 
                            borderRadius: '8px',
                            color: ev.type === 'today' ? 'var(--accent-primary)' : ev.type === 'end' ? 'var(--danger)' : 'var(--text-primary)',
                            fontWeight: isEvSpecial ? 600 : 500,
                            fontSize: '12px',
                            width: '100%',
                            boxShadow: isEvSpecial ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                            cursor: isEvSpecial ? 'default' : 'pointer'
                          }}>
                          <div 
                            style={{ 
                              wordBreak: 'break-word', 
                              whiteSpace: 'normal', 
                              lineHeight: 1.5,
                              display: isEvSpecial ? 'block' : '-webkit-box',
                              WebkitLineClamp: isEvSpecial || expandedId === ev.id ? undefined : 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: isEvSpecial || expandedId === ev.id ? 'visible' : 'hidden'
                            }}
                            dangerouslySetInnerHTML={!isEvSpecial ? { __html: formatDescription(ev.title) } : undefined}
                          >
                            {isEvSpecial ? ev.title : null}
                          </div>
                          {!isEvSpecial && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                              {ev.status && (
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: ev.color }}>
                                  {ev.status}
                                </span>
                              )}
                              {[ev.pic, ...(ev.additionalPics || [])].filter(Boolean).map((p, pidx) => (
                                <span key={pidx} style={{ fontSize: '10px', color: 'var(--text-primary)', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <User size={10} /> {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {/* Gradient Overlay for collapsed state */}
        {!isTimelineExpanded && events.length > 4 && (
           <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, transparent, var(--surface-color))', pointerEvents: 'none' }} />
        )}
      </div>

      {events.length > 4 && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '11px', padding: '6px 16px', borderRadius: '16px' }}
            onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
          >
            {isTimelineExpanded ? 'Tutup Alur Timeline' : 'Tampilkan Seluruh Timeline'}
          </button>
        </div>
      )}
    </div>
  );
}
