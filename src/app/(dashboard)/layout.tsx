'use client';
import Sidebar from "@/components/Sidebar";
import NotificationBell from '@/components/NotificationBell';
import TaskSummaryWidget from '@/components/TaskSummaryWidget';
import FocusModeToggle from '@/components/FocusModeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <NotificationBell />
      <TaskSummaryWidget />
      <FocusModeToggle />
    </>
  );
}
