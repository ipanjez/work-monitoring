'use client';

import React, { createContext, useContext, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, X, LogIn, UserPlus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { toast } from 'react-hot-toast';

type GuestAccessContextType = {
  isGuest: boolean;
  showGuestModal: boolean;
  setShowGuestModal: (show: boolean) => void;
  handleGuestAction: (onAllowed: () => void, hasPermission?: boolean, customDeniedMessage?: string) => void;
};

const GuestAccessContext = createContext<GuestAccessContextType | undefined>(undefined);

export function GuestAccessProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showGuestModal, setShowGuestModal] = useState(false);

  const isGuest = (session?.user as any)?.role === 'GUEST';

  const handleGuestAction = (onAllowed: () => void, hasPermission?: boolean, customDeniedMessage?: string) => {
    if (hasPermission !== undefined) {
      if (!hasPermission) {
        if (isGuest) {
          setShowGuestModal(true);
        } else {
          toast.error(customDeniedMessage || 'Akses ditolak: Anda tidak memiliki izin untuk melihat rincian detail tugas & lampiran.');
        }
        return;
      }
    } else if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    onAllowed();
  };

  const handleGoToLogin = async () => {
    setShowGuestModal(false);
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  const handleGoToRegister = async () => {
    setShowGuestModal(false);
    await signOut({ redirect: false });
    router.push('/auth/signup');
  };

  return (
    <GuestAccessContext.Provider value={{ isGuest, showGuestModal, setShowGuestModal, handleGuestAction }}>
      {children}

      <AnimatePresence>
        {showGuestModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '16px',
            }}
            onClick={() => setShowGuestModal(false)}
          >
            <motion.div
              className="glass"
              style={{
                width: '100%',
                maxWidth: '420px',
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--card-shadow)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowGuestModal(false)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '16px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <X size={18} />
              </button>

              {/* Icon / Header */}
              <div>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Lock size={24} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  Akses Terbatas
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Anda sedang masuk sebagai <strong>Guest</strong>. Silakan masuk dengan akun terdaftar atau buat akun baru untuk mengakses fitur ini.
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <button
                  onClick={handleGoToLogin}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '11px', justifyContent: 'center', gap: '8px', fontSize: '13.5px', border: 'none', cursor: 'pointer' }}
                >
                  <LogIn size={16} />
                  <span>Masuk / Login</span>
                </button>
                
                <button
                  onClick={handleGoToRegister}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '11px',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '13.5px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <UserPlus size={16} />
                  <span>Daftar Akun Baru</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </GuestAccessContext.Provider>
  );
}

export function useGuestAccess() {
  const context = useContext(GuestAccessContext);
  if (context === undefined) {
    throw new Error('useGuestAccess must be used within a GuestAccessProvider');
  }
  return context;
}
