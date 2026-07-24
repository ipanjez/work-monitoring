'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, ListTodo, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className={`glass ${styles.sidebar}`}>
      <div className={styles.logo}>
        <div style={{ padding: '8px', background: 'var(--accent-primary)', borderRadius: '8px', color: 'white' }}>
          <LayoutDashboard size={24} />
        </div>
        DeptMonitor
      </div>
      
      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.navItemActive : ''}`}>
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link href="/tasks" className={`${styles.navItem} ${pathname === '/tasks' ? styles.navItemActive : ''}`}>
          <ListTodo size={20} />
          Daftar Pekerjaan
        </Link>
        <Link href="/calendar" className={`${styles.navItem} ${pathname === '/calendar' ? styles.navItemActive : ''}`}>
          <Calendar size={20} />
          Kalender
        </Link>
      </nav>

      <button onClick={handleLogout} className={`btn ${styles.navItem} ${styles.logoutBtn}`}>
        <LogOut size={20} />
        Keluar
      </button>
    </div>
  );
}
