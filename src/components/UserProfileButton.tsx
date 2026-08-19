'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDown, User, LogOut, Settings, Shield, ShieldAlert, Eye, Loader2, Plus, Bell, BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { defaultRolePermissions, RolePermissionsConfig, getRoleLabel, getRoleIconName, getRoleColor, hasPermission, PERMISSION_FEATURE_DETAILS } from '@/lib/permissions';
import { useMaster } from '@/context/MasterContext';
import Avatar from '@/components/Avatar';
import { RoleIconRenderer } from '@/components/RoleBadge';

export default function UserProfileButton() {
  const { data: session, update } = useSession();
  const { masterPicAvatars, masterColors } = useMaster();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [displayImage, setDisplayImage] = useState('');

  const [roleConfig, setRoleConfig] = useState<RolePermissionsConfig>(defaultRolePermissions);

  useEffect(() => {
    fetch('/api/settings/permissions').then(res => res.json()).then(setRoleConfig).catch(() => { });
  }, []);

  const loadUserData = () => {
    fetch('/api/users/profile')
      .then(res => res.json())
      .then(data => {
        if (data.name) setDisplayName(data.name);
        if (data.image) setDisplayImage(data.image);
      })
      .catch(e => console.error(e));
  };

  useEffect(() => {
    loadUserData();
    window.addEventListener('profileUpdated', loadUserData);
    return () => window.removeEventListener('profileUpdated', loadUserData);
  }, []);

  useEffect(() => {
    const handleMasterUpdated = () => {
      fetch('/api/settings/permissions').then(res => res.json()).then(setRoleConfig).catch(() => { });
    };
    window.addEventListener('masterUpdated', handleMasterUpdated);
    return () => window.removeEventListener('masterUpdated', handleMasterUpdated);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!session?.user) return null;

  const currentRole = (session.user as any).role || 'MEMBER';
  const activeFeatures = PERMISSION_FEATURE_DETAILS.filter(f => hasPermission(roleConfig, f.key, currentRole));
  const totalFeatures = PERMISSION_FEATURE_DETAILS.length;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dismissed_backup_reminder');
    }
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div
      id="user-profile-btn-container"
      className="relative"
      ref={dropdownRef}
      style={{ position: 'relative' }}
    >
      <button
        className="profile-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: '45px',
          borderRadius: '24px',
          background: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          padding: '4px 16px 4px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transition: 'all 0.2s',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }
        }}
      >
        <Avatar
          name={displayName || session.user.name || 'User'}
          src={displayImage || masterPicAvatars[displayName || session.user.name || '']}
          size={34}
          masterColors={masterColors}
        />

        <div className="profile-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
          <span className="profile-name-text" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
            {displayName || session.user.name || 'User'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {getRoleLabel(roleConfig, currentRole)}
          </span>
        </div>
        <ChevronDown
          className="profile-chevron"
          size={14}
          style={{
            color: 'var(--text-secondary)',
            marginLeft: '4px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        />
      </button>

      {isOpen && (
        <div
          className="dropdown-menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '260px',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: '6px 0',
            animation: 'fadeIn 0.2s ease',
            zIndex: 99999,
            pointerEvents: 'auto',
          }}
        >
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>NPK / ID</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              {(session.user as any).npk || '—'}
            </div>

            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Role Akses</div>
              <div
                style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
                title={activeFeatures.length > 0 ? `Hak Akses Aktif:\n${activeFeatures.map(f => `• ${f.label}`).join('\n')}` : 'Tidak ada hak akses aktif'}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '7px',
                    backgroundColor: `${getRoleColor(roleConfig, currentRole)}18`,
                    border: `1px solid ${getRoleColor(roleConfig, currentRole)}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px'
                  }}
                >
                  <RoleIconRenderer
                    iconName={getRoleIconName(roleConfig, currentRole)}
                    size={14}
                    color={getRoleColor(roleConfig, currentRole)}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: getRoleColor(roleConfig, currentRole) }}>
                      {getRoleLabel(roleConfig, currentRole)}
                    </span>
                    <span style={{
                      fontSize: '9.5px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      background: activeFeatures.length === totalFeatures ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: activeFeatures.length === totalFeatures ? '#059669' : 'var(--accent-primary)'
                    }}>
                      {activeFeatures.length}/{totalFeatures} Izin
                    </span>
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {(() => {
                      if (activeFeatures.length === totalFeatures) {
                        return 'Akses penuh seluruh fitur & pengaturan.';
                      }
                      if (activeFeatures.length === 0) {
                        return 'Tidak memiliki izin aktif.';
                      }
                      const labels = activeFeatures.map(f => f.shortLabel);
                      if (labels.length <= 3) {
                        return `Izin: ${labels.join(', ')}`;
                      }
                      return `Izin: ${labels.slice(0, 2).join(', ')}, +${labels.length - 2} lainnya`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>

            <Link
              href="/users/profile"
              onClick={() => setIsOpen(false)}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <User size={14} style={{ color: 'var(--text-secondary)' }} />
              Profil Saya
            </Link>

          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Settings size={14} style={{ color: 'var(--text-secondary)' }} />
            Pengaturan Aplikasi
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              color: '#ef4444',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              opacity: isLoggingOut ? 0.7 : 1,
              width: '100%',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (!isLoggingOut) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)' }}
            onMouseLeave={(e) => { if (!isLoggingOut) e.currentTarget.style.background = 'transparent' }}
          >
            {isLoggingOut ? <Loader2 size={14} className="spin" /> : <LogOut size={14} />}
            {isLoggingOut ? 'Keluar...' : 'Keluar'}
          </button>
        </div>
      )}
    </div>
  );
}
