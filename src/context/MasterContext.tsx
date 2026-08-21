'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { defaultRolePermissions, RolePermissionsConfig } from '@/lib/permissions';
import { subscribeToSettingsChanges } from '@/utils/realtimeSettingsSync';

interface MasterContextType {
  masterColors: Record<string, string>;
  masterIcons: Record<string, string>;
  masterPicAvatars: Record<string, string>;
  appName: string;
  appSubtitle: string;
  appLogo: string;
  appFavicon: string;
  masterCats: string[];
  masterStatuses: string[];
  masterPriorities: string[];
  masterLocations: string[];
  masterStatusProgress: Record<string, number>;
  masterPics: string[];
  roleConfig: RolePermissionsConfig;
  sessionTimeout: number;
  userRoles: Record<string, string>;
  maxFileSizeMb: number;
  maxTaskFilesSizeMb: number;
  maxTotalStorageMb: number;
}

const MasterContext = createContext<MasterContextType>({ 
  masterColors: {}, 
  masterIcons: {}, 
  masterPicAvatars: {},
  appName: 'DeptMonitor',
  appSubtitle: 'MRK',
  appLogo: '',
  appFavicon: '',
  masterCats: [],
  masterStatuses: ['To Do', 'In Progress', 'Done'],
  masterPriorities: ['Low', 'Medium', 'High', 'Critical'],
  masterLocations: [],
  masterStatusProgress: {},
  masterPics: [],
  roleConfig: defaultRolePermissions,
  sessionTimeout: 10,
  userRoles: {},
  maxFileSizeMb: 25,
  maxTaskFilesSizeMb: 100,
  maxTotalStorageMb: 5000
});

export function MasterProvider({ children }: { children: React.ReactNode }) {
  const [masterColors, setMasterColors] = useState<Record<string, string>>({});
  const [masterIcons, setMasterIcons] = useState<Record<string, string>>({});
  const [masterPicAvatars, setMasterPicAvatars] = useState<Record<string, string>>({});
  const [appName, setAppName] = useState('DeptMonitor');
  const [appSubtitle, setAppSubtitle] = useState('MRK');
  const [appLogo, setAppLogo] = useState('');
  const [appFavicon, setAppFavicon] = useState('');
  const [masterCats, setMasterCats] = useState<string[]>([]);
  const [masterStatuses, setMasterStatuses] = useState<string[]>(['To Do', 'In Progress', 'Done']);
  const [masterPriorities, setMasterPriorities] = useState<string[]>(['Low', 'Medium', 'High', 'Critical']);
  const [masterLocations, setMasterLocations] = useState<string[]>([]);
  const [masterStatusProgress, setMasterStatusProgress] = useState<Record<string, number>>({});
  const [masterPics, setMasterPics] = useState<string[]>([]);
  const [roleConfig, setRoleConfig] = useState<RolePermissionsConfig>(defaultRolePermissions);
  const [sessionTimeout, setSessionTimeout] = useState(10);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [maxFileSizeMb, setMaxFileSizeMb] = useState<number>(25);
  const [maxTaskFilesSizeMb, setMaxTaskFilesSizeMb] = useState<number>(100);
  const [maxTotalStorageMb, setMaxTotalStorageMb] = useState<number>(5000);
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
      setAppFavicon(localStorage.getItem('app_favicon') || '');
      setMasterCats(JSON.parse(localStorage.getItem('master_cats') || '[]'));
      setMasterStatuses((JSON.parse(localStorage.getItem('master_statuses') || '["To Do", "In Progress", "Done"]') as string[]).filter((s: string) => s && s.trim() !== ''));
      setMasterPriorities(JSON.parse(localStorage.getItem('master_priorities') || '["Low", "Medium", "High", "Critical"]'));
      setMasterLocations(JSON.parse(localStorage.getItem('master_locations') || '[]'));
      setMasterStatusProgress(JSON.parse(localStorage.getItem('master_status_progress') || '{}'));
      setMasterPics(JSON.parse(localStorage.getItem('master_pics') || '[]'));
      setRoleConfig(JSON.parse(localStorage.getItem('role_config') || JSON.stringify(defaultRolePermissions)));
      setSessionTimeout(Number(localStorage.getItem('session_timeout') || 10));
      setUserRoles(JSON.parse(localStorage.getItem('user_roles') || '{}'));
      setMaxFileSizeMb(Number(localStorage.getItem('max_file_size_mb') || 25));
      setMaxTaskFilesSizeMb(Number(localStorage.getItem('max_task_files_size_mb') || 100));
      setMaxTotalStorageMb(Number(localStorage.getItem('max_total_storage_mb') || 5000));
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
        if (data.app_favicon !== undefined) {
          setAppFavicon(data.app_favicon);
          localStorage.setItem('app_favicon', data.app_favicon);
          changed = true;
        }
        if (data.master_categories) {
          setMasterCats(data.master_categories);
          localStorage.setItem('master_cats', JSON.stringify(data.master_categories));
          changed = true;
        }
        if (data.master_statuses) {
          setMasterStatuses((data.master_statuses as string[]).filter((s: string) => s && s.trim() !== ''));
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
        if (data.session_timeout !== undefined) {
          setSessionTimeout(data.session_timeout);
          localStorage.setItem('session_timeout', data.session_timeout.toString());
          changed = true;
        }
        if (data.master_pics) {
          setMasterPics(data.master_pics);
          localStorage.setItem('master_pics', JSON.stringify(data.master_pics));
          changed = true;
        }
        if (data.max_file_size_mb !== undefined) {
          const val = Number(data.max_file_size_mb) || 25;
          setMaxFileSizeMb(val);
          localStorage.setItem('max_file_size_mb', String(val));
          changed = true;
        }
        if (data.max_task_files_size_mb !== undefined) {
          const val = Number(data.max_task_files_size_mb) || 100;
          setMaxTaskFilesSizeMb(val);
          localStorage.setItem('max_task_files_size_mb', String(val));
          changed = true;
        }
        if (data.max_total_storage_mb !== undefined) {
          const val = Number(data.max_total_storage_mb) || 5000;
          setMaxTotalStorageMb(val);
          localStorage.setItem('max_total_storage_mb', String(val));
          changed = true;
        }
        if (changed) {
          window.dispatchEvent(new Event('masterUpdated'));
        }
      })
      .catch(console.error);

    fetch('/api/settings/permissions')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setRoleConfig(data);
          localStorage.setItem('role_config', JSON.stringify(data));
          window.dispatchEvent(new Event('masterUpdated'));
        }
      })
      .catch(() => {});

    fetch('/api/users/roles')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setUserRoles(data);
          localStorage.setItem('user_roles', JSON.stringify(data));
        }
      })
      .catch(() => {});

    // Listen to changes across tabs or other components via storage event
    const handleStorage = (e: StorageEvent) => {
      try {
        if (e.key === 'master_colors' && e.newValue) setMasterColors(JSON.parse(e.newValue));
        if (e.key === 'master_icons' && e.newValue) setMasterIcons(JSON.parse(e.newValue));
        if (e.key === 'master_pic_avatars' && e.newValue) setMasterPicAvatars(JSON.parse(e.newValue));
        if (e.key === 'app_name' && e.newValue) setAppName(e.newValue);
        if (e.key === 'app_subtitle' && e.newValue) setAppSubtitle(e.newValue);
        if (e.key === 'app_logo' && e.newValue) setAppLogo(e.newValue);
        if (e.key === 'app_favicon' && e.newValue) setAppFavicon(e.newValue);
        if (e.key === 'master_cats' && e.newValue) setMasterCats(JSON.parse(e.newValue));
        if (e.key === 'master_statuses' && e.newValue) setMasterStatuses(JSON.parse(e.newValue));
        if (e.key === 'master_priorities' && e.newValue) setMasterPriorities(JSON.parse(e.newValue));
        if (e.key === 'master_locations' && e.newValue) setMasterLocations(JSON.parse(e.newValue));
        if (e.key === 'master_status_progress' && e.newValue) setMasterStatusProgress(JSON.parse(e.newValue));
        if (e.key === 'master_pics' && e.newValue) setMasterPics(JSON.parse(e.newValue));
        if (e.key === 'role_config' && e.newValue) setRoleConfig(JSON.parse(e.newValue));
        if (e.key === 'user_roles' && e.newValue) setUserRoles(JSON.parse(e.newValue));
        if (e.key === 'session_timeout' && e.newValue) setSessionTimeout(Number(e.newValue));
        if (e.key === 'max_file_size_mb' && e.newValue) setMaxFileSizeMb(Number(e.newValue));
        if (e.key === 'max_task_files_size_mb' && e.newValue) setMaxTaskFilesSizeMb(Number(e.newValue));
        if (e.key === 'max_total_storage_mb' && e.newValue) setMaxTotalStorageMb(Number(e.newValue));
      } catch (err) {}
    };
    
    // Internal masterUpdated dispatch handler
    const handleMasterUpdated = (e?: any) => {
        setAppName(localStorage.getItem('app_name') || 'DeptMonitor');
        setAppSubtitle(localStorage.getItem('app_subtitle') || 'MRK');
        setAppLogo(localStorage.getItem('app_logo') || '');
        setAppFavicon(localStorage.getItem('app_favicon') || '');
        setSessionTimeout(Number(localStorage.getItem('session_timeout') || 10));
        setMaxFileSizeMb(Number(localStorage.getItem('max_file_size_mb') || 25));
        setMaxTaskFilesSizeMb(Number(localStorage.getItem('max_task_files_size_mb') || 100));
        setMaxTotalStorageMb(Number(localStorage.getItem('max_total_storage_mb') || 5000));
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
            if (e?.detail?.roleConfig) {
                setRoleConfig(e.detail.roleConfig);
            } else {
                setRoleConfig(JSON.parse(localStorage.getItem('role_config') || JSON.stringify(defaultRolePermissions)));
            }
            setUserRoles(JSON.parse(localStorage.getItem('user_roles') || '{}'));
        } catch(e) {}

        fetch('/api/settings/permissions')
          .then(res => res.json())
          .then(data => {
            if (data && typeof data === 'object' && data.labels) {
              setRoleConfig(data);
              localStorage.setItem('role_config', JSON.stringify(data));
            }
          })
          .catch(() => {});

        fetch('/api/users/roles')
          .then(res => res.json())
          .then(data => {
            if (data && typeof data === 'object') {
              setUserRoles(data);
              localStorage.setItem('user_roles', JSON.stringify(data));
            }
          })
          .catch(() => {});
    };

    // Realtime cross-tab broadcast handler
    const unsubscribeBroadcast = subscribeToSettingsChanges(({ key, value }) => {
      if (key === 'max_file_size_mb') {
        setMaxFileSizeMb(Number(value) || 25);
      } else if (key === 'max_task_files_size_mb') {
        setMaxTaskFilesSizeMb(Number(value) || 100);
      } else if (key === 'max_total_storage_mb') {
        setMaxTotalStorageMb(Number(value) || 5000);
      } else if (key === 'app_name') {
        setAppName(String(value));
      } else if (key === 'app_subtitle') {
        setAppSubtitle(String(value));
      } else if (key === 'app_logo') {
        setAppLogo(String(value));
      } else if (key === 'app_favicon') {
        setAppFavicon(String(value));
      } else if (key === 'session_timeout') {
        setSessionTimeout(Number(value) || 10);
      } else if (key === 'master_statuses') {
        setMasterStatuses(Array.isArray(value) ? value : []);
      } else if (key === 'master_categories') {
        setMasterCats(Array.isArray(value) ? value : []);
      } else if (key === 'master_priorities') {
        setMasterPriorities(Array.isArray(value) ? value : []);
      } else if (key === 'master_locations') {
        setMasterLocations(Array.isArray(value) ? value : []);
      } else if (key === 'master_pics') {
        setMasterPics(Array.isArray(value) ? value : []);
      } else if (key === 'master_colors') {
        setMasterColors(typeof value === 'object' ? value : {});
      } else if (key === 'master_icons') {
        setMasterIcons(typeof value === 'object' ? value : {});
      } else if (key === 'master_status_progress') {
        setMasterStatusProgress(typeof value === 'object' ? value : {});
      } else if (key === 'master_pic_avatars') {
        setMasterPicAvatars(typeof value === 'object' ? value : {});
      }
    });

    window.addEventListener('storage', handleStorage);
    window.addEventListener('masterUpdated', handleMasterUpdated);

    return () => {
      unsubscribeBroadcast();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('masterUpdated', handleMasterUpdated);
    };
  }, []);

  // Update Dynamic Favicon & Document Title based on appFavicon, appLogo, appName, and appSubtitle
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Update Document Title
    if (appName) {
      document.title = appSubtitle && appSubtitle !== 'MRK' ? `${appName} - ${appSubtitle}` : appName;
    }

    // 2. Update Favicon (Use dynamic endpoint /api/favicon and direct base64 fallback)
    const faviconUrl = `/api/favicon?t=${Date.now()}`;
    const existingIcons = document.querySelectorAll("link[rel*='icon']");
    existingIcons.forEach(el => el.parentNode?.removeChild(el));

    const linkIcon = document.createElement('link');
    linkIcon.rel = 'icon';
    linkIcon.href = faviconUrl;
    document.head.appendChild(linkIcon);

    const linkShortcut = document.createElement('link');
    linkShortcut.rel = 'shortcut icon';
    linkShortcut.href = faviconUrl;
    document.head.appendChild(linkShortcut);

    const linkApple = document.createElement('link');
    linkApple.rel = 'apple-touch-icon';
    linkApple.href = faviconUrl;
    document.head.appendChild(linkApple);
  }, [appFavicon, appLogo, appName, appSubtitle]);

  return (
    <MasterContext.Provider value={{ masterColors, masterIcons, masterPicAvatars, appName, appSubtitle, appLogo, appFavicon, masterCats, masterStatuses, masterPriorities, masterLocations, masterStatusProgress, masterPics, roleConfig, sessionTimeout, userRoles, maxFileSizeMb, maxTaskFilesSizeMb, maxTotalStorageMb }}>
      {children}
    </MasterContext.Provider>
  );
}

export const useMaster = () => useContext(MasterContext);
