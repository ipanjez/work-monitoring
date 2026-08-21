'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Mail, IdCard, UserPlus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useMaster } from '@/context/MasterContext';

export default function SignUpPage() {
  const { appName, appSubtitle, appLogo } = useMaster();
  const [npk, setNpk] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [availableRoles, setAvailableRoles] = useState<{ key: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/settings/permissions')
      .then(res => res.json())
      .then(data => {
        if (data && data.labels) {
          const roles = Object.keys(data.labels)
            .filter(r => r.toUpperCase() !== 'ADMIN')
            .map(r => ({ key: r, label: data.labels[r] || r }));
          setAvailableRoles(roles);
          if (roles.length > 0) setRole(roles[0].key);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!npk.trim() || !name.trim() || !password) {
      toast.error('Harap isi semua field yang wajib (*)');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    if (password.length < 6) {
      toast.error('Kata sandi minimal 6 karakter!');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npk: npk.trim(),
          name: name.trim(),
          email: email.trim() || undefined,
          password,
          role: role || 'MEMBER',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftar');
      }

      toast.success('Pendaftaran berhasil! Menunggu persetujuan Administrator.');
      router.push('/auth/signin');
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-color)',
      padding: '20px',
    }}>
      <div className="glass" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '36px',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          {appLogo ? (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              overflow: 'hidden',
              margin: '0 auto 16px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              border: '2px solid var(--border-color)',
              background: 'var(--surface-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px'
            }}>
              <img src={appLogo} alt={appName || 'Logo'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'var(--accent-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            }}>
              <UserPlus size={26} />
            </div>
          )}
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Daftar Akun Baru
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Buat akun untuk memulai pemantauan di {appName || 'Work Monitoring'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* NPK */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <IdCard size={14} /> NPK *
            </label>
            <input
              type="text"
              className="input"
              value={npk}
              onChange={e => setNpk(e.target.value)}
              placeholder="Masukkan NPK Anda (contoh: PKT-001)"
              required
              autoFocus
            />
          </div>

          {/* Full Name */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <User size={14} /> Nama Lengkap *
            </label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Mail size={14} /> Email (Opsional)
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contoh@domain.com"
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Lock size={14} /> Password *
            </label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password minimal 6 karakter"
              minLength={6}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Lock size={14} /> Konfirmasi Password *
            </label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password"
              required
            />
          </div>

          {/* Peran / Role */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <User size={14} /> Pilih Peran / Role *
            </label>
            <select
              className="input"
              value={role}
              onChange={e => setRole(e.target.value)}
              required
            >
              {availableRoles.map(r => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
          >
            <UserPlus size={18} />
            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        </form>

        {/* Sign In Link */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          Sudah punya akun?{' '}
          <Link
            href="/auth/signin"
            style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Masuk disini
          </Link>
        </div>
      </div>
    </div>
  );
}
