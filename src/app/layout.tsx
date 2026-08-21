import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import { FilterProvider } from "@/context/FilterContext";
import { MasterProvider } from "@/context/MasterContext";
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '@/context/NotificationContext';
import { RealtimeSyncProvider } from '@/context/RealtimeSyncContext';
import NotificationBell from '@/components/NotificationBell';
import IdleTimer from '@/components/IdleTimer';
import FocusModeToggle from '@/components/FocusModeToggle';
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
  title: "Dashboard Monitoring Pekerjaan",
  description: "Dashboard Monitoring & Manajemen Pekerjaan Departemen",
  icons: {
    icon: '/api/favicon',
    shortcut: '/api/favicon',
    apple: '/api/favicon',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'light';
                  if (theme) {
                    document.documentElement.setAttribute('data-theme', theme);
                  }
                  var accent = localStorage.getItem('accent_color');
                  if (accent) {
                    document.documentElement.setAttribute('data-accent', accent);
                  }
                  var density = localStorage.getItem('density');
                  if (density) {
                    document.documentElement.setAttribute('data-density', density);
                  }
                  var sidebar = localStorage.getItem('sidebar_collapsed');
                  if (sidebar === 'true') {
                    document.documentElement.setAttribute('data-sidebar', 'collapsed');
                  }
                  var focus = localStorage.getItem('focus_mode');
                  if (focus === 'true') {
                    document.documentElement.setAttribute('data-focus', 'true');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <NextTopLoader color="var(--accent-primary)" showSpinner={false} height={3} />
        <SessionProviderWrapper>
          <ThemeProvider>
            <MasterProvider>
              <FilterProvider>
                <NotificationProvider>
                  <RealtimeSyncProvider>
                    {children}
                  </RealtimeSyncProvider>
                  <Toaster 
                    position="top-right" 
                    containerStyle={{
                      top: 75,
                    }}
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
