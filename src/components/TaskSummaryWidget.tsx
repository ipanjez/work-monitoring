'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFilter } from '@/context/FilterContext';
import { Activity, CheckCircle, Clock, AlertCircle, AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

export default function TaskSummaryWidget() {
  const { globalPicFilter, globalTargetFilter } = useFilter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const [masterStatuses, setMasterStatuses] = useState<string[]>([]);
  const [masterPriorities, setMasterPriorities] = useState<string[]>([]);
  const [masterColors, setMasterColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
        const setRes = await fetch('/api/settings');
        if (setRes.ok) {
          const setData = await setRes.json();
          if (setData.master_statuses) setMasterStatuses(setData.master_statuses);
          if (setData.master_priorities) setMasterPriorities(setData.master_priorities);
          if (setData.master_colors) setMasterColors(setData.master_colors);
        }
      } catch (e) {}
    };
    fetchData();

    const handleUpdate = () => fetchData();
    window.addEventListener('tasksUpdated', handleUpdate);
    return () => window.removeEventListener('tasksUpdated', handleUpdate);
  }, []);

  // Filter tasks based on global filters
  const filteredTasks = tasks.filter(t => {
    const matchPic = globalPicFilter === 'Semua PIC' || t.pic === globalPicFilter || (
      t.additionalPics ? (() => {
        try {
          const arr = JSON.parse(t.additionalPics);
          return Array.isArray(arr) && arr.includes(globalPicFilter);
        } catch(e) { return false; }
      })() : false
    );
    
    const taskEnd = new Date(t.endDate).getTime();
    const taskStart = new Date(t.startDate).getTime();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startBoundary = today.getTime();
    let endBoundary = today.getTime() + 86400000 - 1;

    if (globalTargetFilter === 'Minggu Ini') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(new Date(today).setDate(diff));
      startBoundary = monday.getTime();
      endBoundary = startBoundary + (7 * 86400000) - 1;
    } else if (globalTargetFilter === 'Bulan Ini') {
      startBoundary = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      endBoundary = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    }

    let matchDate = false;
    if (globalTargetFilter === 'Semua Waktu') {
      matchDate = true;
    } else {
      if (taskStart <= endBoundary && taskEnd >= startBoundary) {
         matchDate = true;
      }
    }
    
    return matchPic && matchDate;
  });

  const statusCounts = filteredTasks.reduce((acc, t) => {
    const s = t.status || 'To Do';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityCounts = filteredTasks.reduce((acc, t) => {
    const p = t.prioritas || 'Medium';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div 
      style={{ position: 'fixed', top: '20px', right: '80px', zIndex: 9999 }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      ref={panelRef}
    >
      <div 
        style={{
          width: '45px', height: '45px', borderRadius: '50%', background: 'var(--surface-color)', 
          border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Activity size={20} color="var(--text-primary)" />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '55px', right: '0', width: '280px', background: 'var(--surface-color)',
          border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Status Pekerjaan
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '4px' }}>
              {(masterStatuses.length > 0 ? masterStatuses : Object.keys(statusCounts)).map(s => {
                const color = masterColors['status_' + s] || '#3b82f6';
                return (
                  <div key={s} style={{ textAlign: 'center', padding: '8px', background: `${color}15`, borderRadius: '8px' }}>
                    <CheckCircle size={16} color={color} style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: color }}>{statusCounts[s] || 0}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{s}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Prioritas
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(masterPriorities.length > 0 ? masterPriorities : Object.keys(priorityCounts)).map(p => {
                const color = masterColors['priority_' + p] || '#64748b';
                return (
                  <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: color }}>
                      <AlertTriangle size={14} /> {p}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{priorityCounts[p] || 0}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
