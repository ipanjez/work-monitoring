'use client';
import Sidebar from "@/components/Sidebar";
import NotificationBell from '@/components/NotificationBell';
import GlobalAddButton from '@/components/GlobalAddButton';
import CopyAgendaButton from '@/components/CopyAgendaButton';
import RealTimeClock from '@/components/RealTimeClock';
import UserProfileButton from '@/components/UserProfileButton';

import FocusModeToggle from '@/components/FocusModeToggle';
import { Menu } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useMaster } from '@/context/MasterContext';
import SessionMonitor from '@/components/SessionMonitor';
import HelpSupportButton from '@/components/HelpSupportButton';
import GlobalBackupReminder from '@/components/GlobalBackupReminder';
import { TaskModalProvider } from '@/context/TaskModalContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleMobileMenu } = useTheme();
  const { appName, appLogo } = useMaster();

  return (
    <TaskModalProvider>
      <SessionMonitor />
      <GlobalBackupReminder />
      {/* Mobile Header */}
      <div className="mobile-header glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
            <Menu size={24} />
          </button>
          {appLogo && (
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src={appLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
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
    </TaskModalProvider>
  );
}
