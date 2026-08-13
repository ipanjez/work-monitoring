'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDown, User, LogOut, Settings, Shield, ShieldAlert, Eye } from 'lucide-react';
import Link from 'next/link';
import { defaultRolePermissions, RolePermissionsConfig, getRoleLabel, hasPermission } from '@/lib/permissions';
import { useMaster } from '@/context/MasterContext';
import Avatar from '@/components/Avatar';

export default function UserProfileButton() {
  const { data: session } = useSession();
  const { masterPicAvatars, masterColors } = useMaster();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [roleConfig, setRoleConfig] = useState<RolePermissionsConfig>(defaultRolePermissions);
  useEffect(() => {
    fetch('/api/settings/permissions').then(res => res.json()).then(setRoleConfig).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!session || !session.user) return null;

  const name = session.user.name || 'User';
  


  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div 
      id="user-profile-btn-container"
      style={{ position: 'relative' }} 
      ref={dropdownRef}
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
        {/* Avatar Circle */}
        <Avatar 
          name={name}
          src={masterPicAvatars[name]}
          size={34}
          masterColors={masterColors}
        />

        {/* User Name */}
        <span
          className="profile-name-text"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            maxWidth: '120px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>

        <ChevronDown 
          className="profile-chevron"
          size={14} 
          style={{ 
            color: 'var(--text-secondary)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '52px',
            right: '0',
            width: '200px',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: '6px 0',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>NPK / ID</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              {(session.user as any).npk || '—'}
            </div>
            
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Role Akses</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                {(() => {
                  const role = (session.user as any).role;
                  if (role === 'ADMIN') return <ShieldAlert size={16} color="var(--danger)" style={{ marginTop: '2px' }} />;
                  if (role === 'VIEWER') return <Eye size={16} color="var(--text-secondary)" style={{ marginTop: '2px' }} />;
                  return <Shield size={16} color="var(--accent-primary)" style={{ marginTop: '2px' }} />;
                })()}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {getRoleLabel(roleConfig, (session.user as any).role)}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {(() => {
                      const role = (session.user as any).role;
                      if (role === 'ADMIN') return 'Akses penuh kelola data.';
                      
                      const labels: string[] = [];
                      if (hasPermission(roleConfig, 'view_dashboard', role)) labels.push('Dashboard');
                      if (hasPermission(roleConfig, 'view_detail', role)) labels.push('Detail Tugas');
                      if (hasPermission(roleConfig, 'manage_task', role)) labels.push('Kelola Tugas');
                      if (hasPermission(roleConfig, 'delete_task', role)) labels.push('Hapus Tugas');
                      if (hasPermission(roleConfig, 'upload_comment', role)) labels.push('Komentar');
                      if (hasPermission(roleConfig, 'master_data', role)) labels.push('Pengaturan');
                      if (hasPermission(roleConfig, 'user_management', role)) labels.push('Manajemen User');
                      if (hasPermission(roleConfig, 'system_logs', role)) labels.push('Log Sistem');
                      
                      if (labels.length === 0) return 'Tidak ada akses spesifik.';
                      return `Akses: ${labels.join(', ')}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Settings size={14} style={{ color: 'var(--text-secondary)' }} />
            Pengaturan Akun
          </Link>

          <button
            onClick={handleLogout}
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
              cursor: 'pointer',
              width: '100%',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={14} />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
