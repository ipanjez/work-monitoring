import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Dashboard Pekerjaan",
  description: "Dashboard Monitoring Pekerjaan Departemen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
