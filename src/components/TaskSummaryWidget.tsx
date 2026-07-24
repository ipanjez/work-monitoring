'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFilter } from '@/context/FilterContext';
import { Activity, CheckCircle, Clock, AlertCircle, AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

export default function TaskSummaryWidget() {
  const { globalPicFilter, globalTimeFilter } = useFilter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (e) {}
    };
    fetchTasks();

    const handleUpdate = () => fetchTasks();
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

    if (globalTimeFilter === 'Minggu Ini') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(new Date(today).setDate(diff));
      startBoundary = monday.getTime();
      endBoundary = startBoundary + (7 * 86400000) - 1;
    } else if (globalTimeFilter === 'Bulan Ini') {
      startBoundary = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      endBoundary = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    }

    let matchDate = false;
    if (globalTimeFilter === 'Semua Waktu') {
      matchDate = true;
    } else {
      if (taskStart <= endBoundary && taskEnd >= startBoundary) {
         matchDate = true;
      }
    }
    
    return matchPic && matchDate;
  });

  const done = filteredTasks.filter(t => t.status === 'Done').length;
  const inProgress = filteredTasks.filter(t => t.status === 'In Progress').length;
  const todo = filteredTasks.filter(t => t.status === 'To Do').length;

  const urgent = filteredTasks.filter(t => t.prioritas === 'Urgent').length;
  const high = filteredTasks.filter(t => t.prioritas === 'High').length;
  const medium = filteredTasks.filter(t => t.prioritas === 'Medium').length;
  const low = filteredTasks.filter(t => t.prioritas === 'Low').length;

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                <CheckCircle size={16} color="#10b981" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{done}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Done</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                <Clock size={16} color="#f59e0b" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>{inProgress}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Proses</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                <AlertCircle size={16} color="#3b82f6" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>{todo}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>To Do</div>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Prioritas
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}><AlertTriangle size={14} /> Urgent</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{urgent}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f97316' }}><ArrowUp size={14} /> High</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{high}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6' }}><Minus size={14} /> Medium</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{medium}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}><ArrowDown size={14} /> Low</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{low}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
