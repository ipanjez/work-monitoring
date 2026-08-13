import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import { FilterProvider } from "@/context/FilterContext";
import { MasterProvider } from "@/context/MasterContext";
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationBell from '@/components/NotificationBell';
import IdleTimer from '@/components/IdleTimer';
import FocusModeToggle from '@/components/FocusModeToggle';
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
  title: "Dashboard Monitoring Pekerjaan",
  description: "Dashboard Monitoring & Manajemen Pekerjaan Departemen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextTopLoader color="var(--accent-primary)" showSpinner={false} height={3} />
        <SessionProviderWrapper>
          <ThemeProvider>
            <MasterProvider>
              <FilterProvider>
                <NotificationProvider>
                  {children}
                <Toaster 
                  position="top-right" 
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#333',
                      color: '#fff',
                      fontSize: '13px',
                      borderRadius: '8px',
                      padding: '12px 16px',
                    },
                    success: {
                      style: {
                        background: 'var(--accent-primary)',
                      },
                    },
                    error: {
                      style: {
                        background: 'var(--danger)',
                      },
                    },
                  }} 
                />
                </NotificationProvider>
              </FilterProvider>
            </MasterProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
