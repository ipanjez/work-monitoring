'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface MasterContextType {
  masterColors: Record<string, string>;
  masterIcons: Record<string, string>;
  masterPicAvatars: Record<string, string>;
  appName: string;
  appSubtitle: string;
  appLogo: string;
}

const MasterContext = createContext<MasterContextType>({ 
  masterColors: {}, 
  masterIcons: {}, 
  masterPicAvatars: {},
  appName: 'DeptMonitor',
  appSubtitle: 'MRK',
  appLogo: ''
});

export function MasterProvider({ children }: { children: React.ReactNode }) {
  const [masterColors, setMasterColors] = useState<Record<string, string>>({});
  const [masterIcons, setMasterIcons] = useState<Record<string, string>>({});
  const [masterPicAvatars, setMasterPicAvatars] = useState<Record<string, string>>({});
  const [appName, setAppName] = useState('DeptMonitor');
  const [appSubtitle, setAppSubtitle] = useState('MRK');
  const [appLogo, setAppLogo] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initial load from localStorage
    try {
      const colors = JSON.parse(localStorage.getItem('master_colors') || '{}');
      setMasterColors(colors);
      const icons = JSON.parse(localStorage.getItem('master_icons') || '{}');
      setMasterIcons(icons);
      const avatars = JSON.parse(localStorage.getItem('master_pic_avatars') || '{}');
      setMasterPicAvatars(avatars);
      setAppName(localStorage.getItem('app_name') || 'DeptMonitor');
      setAppSubtitle(localStorage.getItem('app_subtitle') || 'MRK');
      setAppLogo(localStorage.getItem('app_logo') || '');
    } catch {}

    setMounted(true);

    // Fetch from API to ensure we have the latest
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        let changed = false;
        if (data.master_colors) {
          setMasterColors(data.master_colors);
          localStorage.setItem('master_colors', JSON.stringify(data.master_colors));
          changed = true;
        }
        if (data.master_icons) {
          setMasterIcons(data.master_icons);
          localStorage.setItem('master_icons', JSON.stringify(data.master_icons));
          changed = true;
        }
        if (data.master_pic_avatars) {
          setMasterPicAvatars(data.master_pic_avatars);
          localStorage.setItem('master_pic_avatars', JSON.stringify(data.master_pic_avatars));
          changed = true;
        }
        if (data.app_name) {
          setAppName(data.app_name);
          localStorage.setItem('app_name', data.app_name);
          changed = true;
        }
        if (data.app_subtitle) {
          setAppSubtitle(data.app_subtitle);
          localStorage.setItem('app_subtitle', data.app_subtitle);
          changed = true;
        }
        if (data.app_logo) {
          setAppLogo(data.app_logo);
          localStorage.setItem('app_logo', data.app_logo);
          changed = true;
        }
        if (changed) {
          window.dispatchEvent(new Event('masterUpdated'));
        }
      })
      .catch(console.error);

    // Listen to changes across tabs or other components
    const handleStorage = (e: StorageEvent) => {
      try {
        if (e.key === 'master_colors' && e.newValue) setMasterColors(JSON.parse(e.newValue));
        if (e.key === 'master_icons' && e.newValue) setMasterIcons(JSON.parse(e.newValue));
        if (e.key === 'master_pic_avatars' && e.newValue) setMasterPicAvatars(JSON.parse(e.newValue));
        if (e.key === 'app_name' && e.newValue) setAppName(e.newValue);
        if (e.key === 'app_subtitle' && e.newValue) setAppSubtitle(e.newValue);
        if (e.key === 'app_logo' && e.newValue) setAppLogo(e.newValue);
      } catch (err) {}
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('masterUpdated', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('masterUpdated', handleStorage);
    };
  }, []);

  return (
    <MasterContext.Provider value={{ masterColors, masterIcons, masterPicAvatars, appName, appSubtitle, appLogo }}>
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </MasterContext.Provider>
  );
}

export const useMaster = () => useContext(MasterContext);
