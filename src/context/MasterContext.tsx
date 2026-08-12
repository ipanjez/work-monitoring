'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface MasterContextType {
  masterColors: Record<string, string>;
  masterIcons: Record<string, string>;
  masterPicAvatars: Record<string, string>;
  appName: string;
  appSubtitle: string;
  appLogo: string;
  masterCats: string[];
  masterStatuses: string[];
  masterPriorities: string[];
  masterLocations: string[];
  masterStatusProgress: Record<string, number>;
  masterPics: string[];
}

const MasterContext = createContext<MasterContextType>({ 
  masterColors: {}, 
  masterIcons: {}, 
  masterPicAvatars: {},
  appName: 'DeptMonitor',
  appSubtitle: 'MRK',
  appLogo: '',
  masterCats: [],
  masterStatuses: ['To Do', 'In Progress', 'Done'],
  masterPriorities: ['Low', 'Medium', 'High', 'Critical'],
  masterLocations: [],
  masterStatusProgress: {},
  masterPics: []
});

export function MasterProvider({ children }: { children: React.ReactNode }) {
  const [masterColors, setMasterColors] = useState<Record<string, string>>({});
  const [masterIcons, setMasterIcons] = useState<Record<string, string>>({});
  const [masterPicAvatars, setMasterPicAvatars] = useState<Record<string, string>>({});
  const [appName, setAppName] = useState('DeptMonitor');
  const [appSubtitle, setAppSubtitle] = useState('MRK');
  const [appLogo, setAppLogo] = useState('');
  const [masterCats, setMasterCats] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>(['To Do', 'In Progress', 'Done']);
  const [masterPriorities, setMasterPriorities] = useState<string[]>(['Low', 'Medium', 'High', 'Critical']);
  const [masterLocations, setMasterLocations] = useState<string[]>([]);
  const [masterStatusProgress, setMasterStatusProgress] = useState<Record<string, number>>({});
  const [masterPics, setMasterPics] = useState<string[]>([]);
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
      setMasterCats(JSON.parse(localStorage.getItem('master_cats') || '[]'));
      setMasterStatuses(JSON.parse(localStorage.getItem('master_statuses') || '["To Do", "In Progress", "Done"]'));
      setMasterPriorities(JSON.parse(localStorage.getItem('master_priorities') || '["Low", "Medium", "High", "Critical"]'));
      setMasterLocations(JSON.parse(localStorage.getItem('master_locations') || '[]'));
      setMasterStatusProgress(JSON.parse(localStorage.getItem('master_status_progress') || '{}'));
      setMasterPics(JSON.parse(localStorage.getItem('master_pics') || '[]'));
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
        if (data.app_name !== undefined) {
          setAppName(data.app_name);
          localStorage.setItem('app_name', data.app_name);
          changed = true;
        }
        if (data.app_subtitle !== undefined) {
          setAppSubtitle(data.app_subtitle);
          localStorage.setItem('app_subtitle', data.app_subtitle);
          changed = true;
        }
        if (data.app_logo !== undefined) {
          setAppLogo(data.app_logo);
          localStorage.setItem('app_logo', data.app_logo);
          changed = true;
        }
        if (data.master_categories) {
          setMasterCats(data.master_categories);
          localStorage.setItem('master_cats', JSON.stringify(data.master_categories));
          changed = true;
        }
        if (data.master_statuses) {
          setMasterStatuses(data.master_statuses);
          localStorage.setItem('master_statuses', JSON.stringify(data.master_statuses));
          changed = true;
        }
        if (data.master_priorities) {
          setMasterPriorities(data.master_priorities);
          localStorage.setItem('master_priorities', JSON.stringify(data.master_priorities));
          changed = true;
        }
        if (data.master_locations) {
          setMasterLocations(data.master_locations);
          localStorage.setItem('master_locations', JSON.stringify(data.master_locations));
          changed = true;
        }
        if (data.master_status_progress) {
          setMasterStatusProgress(data.master_status_progress);
          localStorage.setItem('master_status_progress', JSON.stringify(data.master_status_progress));
          changed = true;
        }
        if (changed) {
          window.dispatchEvent(new Event('masterUpdated'));
        }
      })
      .catch(console.error);

    fetch('/api/users/pics')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMasterPics(data);
          localStorage.setItem('master_pics', JSON.stringify(data));
          window.dispatchEvent(new Event('masterUpdated'));
        }
      })
      .catch(() => {});

    // Listen to changes across tabs or other components
    const handleStorage = (e: StorageEvent) => {
      try {
        if (e.key === 'master_colors' && e.newValue) setMasterColors(JSON.parse(e.newValue));
        if (e.key === 'master_icons' && e.newValue) setMasterIcons(JSON.parse(e.newValue));
        if (e.key === 'master_pic_avatars' && e.newValue) setMasterPicAvatars(JSON.parse(e.newValue));
        if (e.key === 'app_name' && e.newValue) setAppName(e.newValue);
        if (e.key === 'app_subtitle' && e.newValue) setAppSubtitle(e.newValue);
        if (e.key === 'app_logo' && e.newValue) setAppLogo(e.newValue);
        if (e.key === 'master_cats' && e.newValue) setMasterCats(JSON.parse(e.newValue));
        if (e.key === 'master_statuses' && e.newValue) setMasterStatuses(JSON.parse(e.newValue));
        if (e.key === 'master_priorities' && e.newValue) setMasterPriorities(JSON.parse(e.newValue));
        if (e.key === 'master_locations' && e.newValue) setMasterLocations(JSON.parse(e.newValue));
        if (e.key === 'master_status_progress' && e.newValue) setMasterStatusProgress(JSON.parse(e.newValue));
        if (e.key === 'master_pics' && e.newValue) setMasterPics(JSON.parse(e.newValue));
      } catch (err) {}
    };
    
    // Non-StorageEvent version for internal dispatches
    const handleMasterUpdated = () => {
        setAppName(localStorage.getItem('app_name') || 'DeptMonitor');
        setAppSubtitle(localStorage.getItem('app_subtitle') || 'MRK');
        setAppLogo(localStorage.getItem('app_logo') || '');
        try {
            setMasterColors(JSON.parse(localStorage.getItem('master_colors') || '{}'));
            setMasterIcons(JSON.parse(localStorage.getItem('master_icons') || '{}'));
            setMasterPicAvatars(JSON.parse(localStorage.getItem('master_pic_avatars') || '{}'));
            setMasterCats(JSON.parse(localStorage.getItem('master_cats') || '[]'));
            setMasterStatuses(JSON.parse(localStorage.getItem('master_statuses') || '["To Do", "In Progress", "Done"]'));
            setMasterPriorities(JSON.parse(localStorage.getItem('master_priorities') || '["Low", "Medium", "High", "Critical"]'));
            setMasterLocations(JSON.parse(localStorage.getItem('master_locations') || '[]'));
            setMasterStatusProgress(JSON.parse(localStorage.getItem('master_status_progress') || '{}'));
            setMasterPics(JSON.parse(localStorage.getItem('master_pics') || '[]'));
        } catch(e) {}
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener('masterUpdated', handleMasterUpdated);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('masterUpdated', handleMasterUpdated);
    };
  }, []);

  return (
    <MasterContext.Provider value={{ masterColors, masterIcons, masterPicAvatars, appName, appSubtitle, appLogo, masterCats, masterStatuses, masterPriorities, masterLocations, masterStatusProgress, masterPics }}>
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </MasterContext.Provider>
  );
}

export const useMaster = () => useContext(MasterContext);
