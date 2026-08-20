'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, LogIn, Eye, EyeOff, IdCard, User } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function SignInContent() {
  const [npk, setNpk] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Status check for password resets
  const [resetStatus, setResetStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'>('NONE');
  const [resetNote, setResetNote] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get('reason') === 'timeout') {
      toast.error('Sesi Anda telah berakhir karena tidak ada aktivitas (idle). Silakan masuk kembali.', {
        id: 'timeout-toast',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (npk.trim().length < 4) {
      setResetStatus('NONE');
      setResetNote(null);
      return;
    }

    const checkResetStatus = async () => {
      try {
        const res = await fetch(`/api/users/reset-requests?npk=${encodeURIComponent(npk.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResetStatus(data.status || 'NONE');
          setResetNote(data.note || null);
        } else {
          setResetStatus('NONE');
        }
      } catch (err) {
        console.error("Error checking reset status:", err);
      }
    };

    const timer = setTimeout(checkResetStatus, 500);
    return () => clearTimeout(timer);
  }, [npk]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npk.trim()) {
      toast.error('Masukkan NPK Anda!');
      return;
    }
    setLoading(true);

    const res = await signIn('credentials', {
      npk: npk.trim(),
      password,
      redirect: false,
    });

    if (res?.ok) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('dismissed_backup_reminder');
        sessionStorage.removeItem('pic_auto_selected_user');
        localStorage.removeItem('globalPicFilter');
      }
      toast.success('Berhasil masuk!');
      router.push('/');
      router.refresh();
    } else if (res?.error === 'PENDING') {
      toast.error('Akun Anda sedang menunggu persetujuan Administrator.');
      setLoading(false);
    } else if (res?.error === 'INACTIVE') {
      toast.error('Akun Anda tidak aktif. Hubungi Administrator.');
      setLoading(false);
    } else {
      toast.error('NPK atau Password salah!');
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
            <Lock size={26} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Work Monitoring
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Masuk menggunakan NPK dan Password Anda
          </p>
        </div>

        {/* Notifications for reset status */}
        {resetStatus === 'APPROVED' && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: '8px',
            color: '#16a34a',
            fontSize: '13px',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>✓</span>
            <div>
              <strong>Reset Password Disetujui!</strong>
              <div style={{ marginTop: '2px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Admin telah menyetujui reset password Anda. Silakan masuk menggunakan password baru yang telah Anda ajukan. {resetNote ? `(Catatan: ${resetNote})` : ''}
              </div>
            </div>
          </div>
        )}

        {resetStatus === 'PENDING' && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            color: '#d97706',
            fontSize: '13px',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>⚠</span>
            <div>
              <strong>Menunggu Persetujuan</strong>
              <div style={{ marginTop: '2px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Permintaan reset password Anda sedang menunggu persetujuan Admin.
              </div>
            </div>
          </div>
        )}

        {resetStatus === 'REJECTED' && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '13px',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>✗</span>
            <div>
              <strong>Permintaan Reset Ditolak</strong>
              <div style={{ marginTop: '2px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Permintaan reset password Anda ditolak oleh Admin. {resetNote ? `(Alasan: ${resetNote})` : ''}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* NPK */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <IdCard size={14} /> NPK
            </label>
            <input
              type="text"
              className="input"
              value={npk}
              onChange={e => setNpk(e.target.value)}
              placeholder="Masukkan NPK"
              autoFocus
              required
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot password link */}
          <div style={{ textAlign: 'right', marginTop: '-8px' }}>
            <Link
              href="/auth/forgot"
              style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none' }}
            >
              Lupa Password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', justifyContent: 'center', gap: '8px', marginTop: '4px' }}
          >
            <LogIn size={18} />
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>


        {/* Sign up link */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          Belum punya akun?{' '}
          <Link
            href="/auth/signup"
            style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Daftar disini
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-secondary)' }}>Memuat...</div>}>
      <SignInContent />
    </Suspense>
  );
}

