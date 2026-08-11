'use client';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function SessionMonitor() {
  const { data: session, status } = useSession();
  const [timeoutMs, setTimeoutMs] = useState<number>(30 * 24 * 60 * 60 * 1000); // default 30 days

  useEffect(() => {
    // Fetch session timeout from settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.session_timeout_hours) {
          setTimeoutMs(Number(data.session_timeout_hours) * 60 * 60 * 1000);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;
    const loginAt = (session.user as any).loginAt;
    if (!loginAt) return;

    const checkSession = () => {
      const now = Date.now();
      const timeElapsed = now - loginAt;
      if (timeElapsed >= timeoutMs) {
        signOut({ callbackUrl: '/auth/signin' });
      }
    };

    // Check immediately
    checkSession();

    // Check every minute
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [session, status, timeoutMs]);

  return null;
}
