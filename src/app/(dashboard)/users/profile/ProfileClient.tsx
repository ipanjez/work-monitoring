'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, HelpCircle, Check, Camera } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AvatarCropperModal from '@/components/AvatarCropperModal';
import Avatar from '@/components/Avatar';
import { useMaster } from '@/context/MasterContext';
import RoleBadge from '@/components/RoleBadge';
import { defaultRolePermissions, RolePermissionsConfig } from '@/lib/permissions';

export default function ProfileClient() {
  const { data: session, update } = useSession();
  const { masterPicAvatars, roleConfig } = useMaster();
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile Form States
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileNpk, setProfileNpk] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profileRole, setProfileRole] = useState('');
  
  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    // Fetch user profile from API
    fetch('/api/users/profile')
      .then(res => {
        if (!res.ok) throw new Error('Gagal memuat profil');
        return res.json();
      })
      .then(data => {
        if (data.name) setProfileName(data.name);
        if (data.email) setProfileEmail(data.email || '');
        if (data.npk) setProfileNpk(data.npk);
        if (data.image) setProfileImage(data.image);
        if (data.role) setProfileRole(data.role);
      })
      .catch(e => {
        console.error(e);
        toast.error('Gagal mengambil data profil dari server.');
      });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error('Nama wajib diisi!');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Konfirmasi password baru tidak cocok!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          currentPassword,
          newPassword,
          image: profileImage,
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Profil berhasil diperbarui!');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Refresh next-auth session
        if (update) {
          await update({
            ...session,
            user: {
              ...session?.user,
              name: profileName,
              image: profileImage
            }
          });
        }
        
        // Dispatch event so layout and clock avatars update immediately
        window.dispatchEvent(new Event('profileUpdated'));
        window.dispatchEvent(new Event('masterUpdated'));
      } else {
        toast.error(data.error || 'Gagal memperbarui profil.');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSave = (base64: string) => {
    setProfileImage(base64);
    setIsAvatarModalOpen(false);
  };

  if (!session) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Profil Saya</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Kelola data diri Anda, ganti foto profil, serta ubah kata sandi akun.
        </p>
      </div>

      {savedSuccess && (
        <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', borderRadius: '10px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Check size={18} /> Profil berhasil disimpan!
        </div>
      )}

      {/* Profile Photo Section */}
      <div className="glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Avatar 
            name={profileName || session.user?.name || ''} 
            src={profileImage || masterPicAvatars[profileName]} 
            size={96} 
          />
          <button 
            onClick={() => setIsAvatarModalOpen(true)}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Ubah Foto Profil"
          >
            <Camera size={16} />
          </button>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Foto Profil</h3>
            <RoleBadge role={profileRole || (session.user as any)?.role || ''} config={roleConfig} size="md" />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', maxWidth: '400px' }}>
            Unggah foto profil personal Anda. Gunakan gambar berformat JPG/PNG dengan aspek rasio persegi (1:1) untuk tampilan optimal.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setIsAvatarModalOpen(true)}>
              Unggah Foto Baru
            </button>
            {profileImage && (
              <button 
                className="btn btn-danger" 
                onClick={() => setProfileImage('')}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--danger)',
                  color: 'var(--danger)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Hapus Foto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Settings Card */}
      <div id="settings-account" className="glass" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--accent-primary)" /> Pengaturan Akun
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Perbarui informasi profil pribadi dan ubah password Anda.
        </p>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                  NPK (ID Pengguna)
                </label>
                <RoleBadge role={profileRole || (session.user as any)?.role || ''} config={roleConfig} size="sm" />
              </div>
              <input
                type="text"
                className="input"
                value={profileNpk}
                disabled
                style={{ background: 'var(--input-bg)', cursor: 'not-allowed', opacity: 0.7 }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                * Hubungi Admin untuk melakukan perubahan NPK
              </span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nama Lengkap
              </label>
              <input
                type="text"
                className="input"
                value={profileName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />

          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Ubah Password</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '16px', flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
              Kosongkan kolom di bawah ini jika Anda tidak ingin mengubah password.
            </p>
          </div>

          <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password Saat Ini
              </label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                placeholder="Password lama Anda"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password Baru
              </label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Perbarui Profil'}
            </button>
            <Link
              href={`/auth/forgot?npk=${profileNpk}`}
              style={{ fontSize: '12px', padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600, transition: 'all 0.2s' }}
            >
              <HelpCircle size={14} /> Lupa Password Saat Ini?
            </Link>
          </div>
        </form>
      </div>

      <AvatarCropperModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSave={handleAvatarSave}
        title="Ubah Foto Profil Saya"
      />
    </div>
  );
}
