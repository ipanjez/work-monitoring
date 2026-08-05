'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [npk, setNpk] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npk.trim()) {
      toast.error('Masukkan NPK Anda!');
      return;
    }
    if (newPassword.trim().length < 6) {
      toast.error('Password baru minimal harus 6 karakter!');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/users/reset-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npk: npk.trim(), newPassword: newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        toast.error(data.error || 'Terjadi kesalahan. Coba lagi.');
      }
    } catch {
      toast.error('Gagal mengirim permintaan. Periksa koneksi Anda.');
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
        gap: '24px',
      }}>
        {!submitted ? (
          <>
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
                <KeyRound size={26} />
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Lupa Password
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Masukkan NPK dan password baru pilihan Anda. Admin akan meninjau dan menyetujui permintaan Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  NPK
                </label>
                <input
                  type="text"
                  className="input"
                  value={npk}
                  onChange={e => setNpk(e.target.value)}
                  placeholder="Masukkan NPK Anda"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password Baru Pilihan Anda
                </label>
                <input
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
              >
                {loading ? 'Mengirim...' : 'Kirim Permintaan Reset'}
              </button>
            </form>

            <div style={{ textAlign: 'center' }}>
              <Link href="/auth/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Kembali ke Login
              </Link>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle size={48} style={{ color: '#22c55e', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Permintaan Terkirim!
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Permintaan reset password untuk NPK <strong>{npk}</strong> telah dikirim.<br />
              Hubungi Administrator untuk mendapatkan password baru Anda.
            </p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="btn btn-primary"
              style={{ marginTop: '24px', padding: '10px 24px', justifyContent: 'center' }}
            >
              Kembali ke Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
