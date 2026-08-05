'use client';
import Sidebar from "@/components/Sidebar";
import NotificationBell from '@/components/NotificationBell';
import GlobalAddButton from '@/components/GlobalAddButton';
import UserProfileButton from '@/components/UserProfileButton';

import FocusModeToggle from '@/components/FocusModeToggle';
import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleMobileMenu } = useTheme();
  const router = useRouter();
  useEffect(() => {
    const handleRefresh = () => router.refresh();
    window.addEventListener('tasksUpdated', handleRefresh);
    return () => window.removeEventListener('tasksUpdated', handleRefresh);
  }, [router]);

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
            <Menu size={24} />
          </button>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>DeptMonitor</div>
        </div>
      </div>
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <div style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 9999 }}>
        <GlobalAddButton />
        <NotificationBell />
        <UserProfileButton />
      </div>

      <FocusModeToggle />
    </>
  );
}
