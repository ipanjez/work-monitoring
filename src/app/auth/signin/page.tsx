'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignInPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn('credentials', {
      email: 'admin@pkt.co.id',
      password,
      redirect: false,
    });

    if (res?.ok) {
      toast.success('Berhasil masuk!');
      router.push('/');
      router.refresh();
    } else {
      toast.error('Password yang Anda masukkan salah!');
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
      padding: '20px'
    }}>
      <div className="glass" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '32px',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Lock size={24} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Akses Aplikasi
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Masukkan kata sandi untuk mengakses dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password Akses
            </label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Masukkan password"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: '8px' }}
          >
            <LogIn size={18} /> {loading ? 'Memproses...' : 'Masuk Aplikasi'}
          </button>
        </form>
      </div>
    </div>
  );
}
