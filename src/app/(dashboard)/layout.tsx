'use client';
import Sidebar from "@/components/Sidebar";
import NotificationBell from '@/components/NotificationBell';
import GlobalAddButton from '@/components/GlobalAddButton';
import CopyAgendaButton from '@/components/CopyAgendaButton';
import RealTimeClock from '@/components/RealTimeClock';
import UserProfileButton from '@/components/UserProfileButton';

import FocusModeToggle from '@/components/FocusModeToggle';
import { Menu, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useMaster } from '@/context/MasterContext';
import SessionMonitor from '@/components/SessionMonitor';
import HelpSupportButton from '@/components/HelpSupportButton';

import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleMobileMenu } = useTheme();
  const { appName } = useMaster();
  const router = useRouter();
  useEffect(() => {
    const handleRefresh = () => router.refresh();
    window.addEventListener('tasksUpdated', handleRefresh);
    return () => window.removeEventListener('tasksUpdated', handleRefresh);
  }, [router]);

  return (
    <>
      <SessionMonitor />
      {/* Mobile Header */}
      <div className="mobile-header glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
            <Menu size={24} />
          </button>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{appName}</div>
        </div>
      </div>
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <div className="header-actions-container">
        <RealTimeClock />
        <CopyAgendaButton />
        <GlobalAddButton />
        <NotificationBell />
        <HelpSupportButton />
        <UserProfileButton />
      </div>

      <FocusModeToggle />
    </>
  );
}
