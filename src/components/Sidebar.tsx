'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, ListTodo, LogOut, Sun, Moon, CheckSquare, 
  ChevronLeft, ChevronRight, BarChart3, Users, Settings, BookOpen, Kanban
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useTheme } from '@/context/ThemeContext';
import { useFilter } from '@/context/FilterContext';
import { useMaster } from '@/context/MasterContext';
import IdleTimer from './IdleTimer';

export default function Sidebar() {
  const { masterColors } = useMaster();
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, setMobileMenuOpen } = useTheme();
  const { 
    globalTargetFilter, 
    setGlobalTargetFilter, 
    globalPicFilter, 
    setGlobalPicFilter,
    globalCustomStartDate,
    setGlobalCustomStartDate,
    globalCustomEndDate,
    setGlobalCustomEndDate
  } = useFilter();
  
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [masterPics, setMasterPics] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>([]);
  const [deptName, setDeptName] = useState('Work Monitoring');
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = () => {
      fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllTasks(data);
      })
      .catch(e => console.error(e));
    };

    const loadSettings = () => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.master_pics) {
            setMasterPics(data.master_pics);
          }
          if (data.master_statuses) {
            setMasterStatuses(data.master_statuses);
          }
          if (data.dept_name) {
            setDeptName(data.dept_name);
          }
          if (data.master_colors) {
            localStorage.setItem('master_colors', JSON.stringify(data.master_colors));
          }
        })
        .catch(e => console.error(e));
    };

    loadData();
    loadSettings();
    window.addEventListener('tasksUpdated', loadData);
    window.addEventListener('deptNameChanged', loadSettings);
    return () => {
      window.removeEventListener('tasksUpdated', loadData);
      window.removeEventListener('deptNameChanged', loadSettings);
    };
  }, [pathname]);

  const picList = Array.from(new Set([
    ...allTasks.map((t: any) => t.pic).filter(Boolean),
    ...masterPics
  ]));

  useEffect(() => {
    let tempStats: Record<string, number> = {};

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startBoundary = today.getTime();
    let endBoundary = today.getTime() + 86400000 - 1;

    if (globalTargetFilter === 'Minggu Ini') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
      const monday = new Date(new Date(today).setDate(diff));
      startBoundary = monday.getTime();
      endBoundary = startBoundary + (7 * 86400000) - 1;
    } else if (globalTargetFilter === 'Bulan Ini') {
      startBoundary = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      endBoundary = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    }

    allTasks.forEach((t: any) => {
      if (globalPicFilter !== 'Semua PIC' && t.pic !== globalPicFilter) {
        let isAdditional = false;
        try {
          const extra = JSON.parse(t.additionalPics || '[]');
          if (Array.isArray(extra) && extra.includes(globalPicFilter)) isAdditional = true;
        } catch(e) {}
        if (!isAdditional) return;
      }

      const start = new Date(t.startDate).getTime();
      const end = new Date(t.endDate).getTime();

      let inRange = false;
      if (globalTargetFilter === 'Semua Waktu') {
        inRange = true;
      } else {
        if (start <= endBoundary) {
          inRange = true;
        }
      }

      if (inRange) {
        if (globalTargetFilter !== 'Semua Waktu' && t.status === 'Done' && end < startBoundary) {
          // done tasks before the filter window shouldn't be counted for today/this week
        } else {
          const s = t.status || 'To Do';
          tempStats[s] = (tempStats[s] || 0) + 1;
        }
      }
    });

    setStats(tempStats);
  }, [allTasks, globalTargetFilter, globalPicFilter]);

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/', label: 'Monitoring Board', icon: Kanban },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Daftar Pekerjaan', icon: ListTodo },
    { href: '/calendar', label: 'Kalender', icon: Calendar },
    { href: '/reports', label: 'Analisis Laporan', icon: BarChart3 },
    { href: '/team', label: 'Manajemen Tim', icon: Users },
    { href: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      <div 
        className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.mobileOverlayOpen : ''}`} 
        onClick={() => setMobileMenuOpen(false)}
      />
      <div className={`glass ${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarMobileOpen : ''}`}>
      <div>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <div style={{ padding: '8px', background: 'var(--accent-primary)', borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <CheckSquare size={22} />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <span style={{ fontSize: '16px', fontWeight: 'bold', display: 'block', lineHeight: 1.2 }}>DeptMonitor</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 400 }}>{deptName}</span>
              </div>
            )}
          </div>

          <button className={styles.toggleBtn} onClick={toggleSidebar} title={isSidebarCollapsed ? "Buka Sidebar" : "Lipat Sidebar"}>
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {!isSidebarCollapsed && <span className={styles.navText}>{item.label}</span>}
              </Link>
            );
          })}
          
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            {!isSidebarCollapsed && <div style={{ padding: '0 12px 8px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Bantuan</div>}
            <Link 
              href="/guide" 
              className={`${styles.navItem} ${pathname === '/guide' ? styles.navItemActive : ''}`}
              title={isSidebarCollapsed ? "Panduan" : undefined}
            >
              <BookOpen size={20} style={{ flexShrink: 0 }} />
              {!isSidebarCollapsed && <span className={styles.navText}>Panduan</span>}
            </Link>
          </div>
        </nav>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!isSidebarCollapsed ? (
          <div style={{ 
            background: 'var(--input-bg)', 
            padding: '12px', 
            borderRadius: '12px', 
            marginBottom: '4px',
            border: '1px solid var(--border-color)',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select 
                value={globalPicFilter}
                onChange={(e) => setGlobalPicFilter(e.target.value)}
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '6px', background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <option value="Semua PIC">Semua PIC</option>
                {picList.map((p: any) => <option key={p} value={p}>{p}</option>)}
              </select>

              <select 
                value={globalTargetFilter}
                onChange={(e) => setGlobalTargetFilter(e.target.value)}
                style={{ width: '100%', padding: '4px 6px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', background: 'var(--accent-primary)', color: 'white', border: 'none', outline: 'none' }}
              >
                <option value="Hari Ini">Target Hari Ini</option>
                <option value="Minggu Ini">Target Minggu Ini</option>
                <option value="Bulan Ini">Target Bulan Ini</option>
                <option value="Semua Waktu">Semua Target Waktu</option>
                <option value="Custom">Pilih Tanggal...</option>
              </select>
              {globalTargetFilter === 'Custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '-4px' }}>
                  <input 
                    type="date" 
                    value={globalCustomStartDate}
                    onChange={(e) => setGlobalCustomStartDate(e.target.value)}
                    style={{ width: '100%', padding: '4px', fontSize: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                  />
                  <input 
                    type="date" 
                    value={globalCustomEndDate}
                    onChange={(e) => setGlobalCustomEndDate(e.target.value)}
                    style={{ width: '100%', padding: '4px', fontSize: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}
            </div>
            
            {(masterStatuses.length > 0 ? masterStatuses : Object.keys(stats)).map((status, idx) => {
              const color = masterColors[`status_${status}`] || '#3b82f6';
              return (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{status}:</span>
                  <span style={{ fontWeight: 700, color: color }}>{stats[status] || 0}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '4px',
            padding: '12px 0',
            background: 'var(--input-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            {(masterStatuses.length > 0 ? masterStatuses : Object.keys(stats)).map((status, idx) => {
              const color = masterColors[`status_${status}`] || '#3b82f6';
              const val = stats[status] || 0;
              return (
                <div key={status} title={`${status}: ${val}`} style={{ background: `${color}20`, border: `1px solid ${color}`, color: color, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                  {val > 99 ? '99+' : val}
                </div>
              );
            })}
          </div>
        )}

        <IdleTimer isSidebarCollapsed={isSidebarCollapsed} />

        <button 
          onClick={toggleTheme} 
          className={`btn ${styles.navItem}`} 
          style={{ justifyContent: isSidebarCollapsed ? 'center' : 'space-between', width: '100%', cursor: 'pointer' }}
          title={isSidebarCollapsed ? (theme === 'dark' ? 'Mode Gelap' : 'Mode Terang') : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {theme === 'dark' ? <Moon size={20} color="#f59e0b" style={{ flexShrink: 0 }} /> : <Sun size={20} color="#f59e0b" style={{ flexShrink: 0 }} />}
            {!isSidebarCollapsed && <span className={styles.navText}>{theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}</span>}
          </div>
          {!isSidebarCollapsed && (
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: 'var(--border-color)', color: 'var(--text-secondary)' }}>
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          )}
        </button>

        <button 
          onClick={handleLogout} 
          className={`btn ${styles.navItem} ${styles.logoutBtn}`}
          style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}
          title={isSidebarCollapsed ? 'Keluar' : undefined}
        >
          <LogOut size={20} style={{ flexShrink: 0 }} />
          {!isSidebarCollapsed && <span className={styles.navText}>Keluar</span>}
        </button>
      </div>
    </div>
    </>
  );
}
