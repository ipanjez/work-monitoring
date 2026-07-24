'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

function LoginContent() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('reason') === 'timeout') {
      setError('Sesi Anda telah berakhir karena tidak ada aktivitas (idle). Silakan login kembali.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <motion.div 
        className={`glass ${styles.card}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%' }}>
              <Lock size={32} color="var(--accent-primary)" />
            </div>
          </div>
          <h1 className={styles.title}>Secure Dashboard</h1>
          <p className={styles.subtitle}>Masukkan password global untuk mengakses data pekerjaan departemen.</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.error} style={{ background: searchParams.get('reason') === 'timeout' ? 'var(--warning-light, #fef3c7)' : undefined, color: searchParams.get('reason') === 'timeout' ? '#92400e' : undefined, borderColor: searchParams.get('reason') === 'timeout' ? '#f59e0b' : undefined }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password"
            className="input"
            placeholder="Password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: 'white' }}>Memuat...</div>}>
      <LoginContent />
    </Suspense>
  );
}
