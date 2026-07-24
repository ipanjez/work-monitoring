'use client';
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div style={{ marginLeft: '250px', padding: '24px', width: 'calc(100% - 250px)' }}>
        {children}
      </div>
    </>
  );
}
