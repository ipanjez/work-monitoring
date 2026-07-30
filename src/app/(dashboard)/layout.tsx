'use client';
import Sidebar from "@/components/Sidebar";
import NotificationBell from '@/components/NotificationBell';

import FocusModeToggle from '@/components/FocusModeToggle';
import { Menu } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggleMobileMenu } = useTheme();

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
      <NotificationBell />

      <FocusModeToggle />
    </>
  );
}
