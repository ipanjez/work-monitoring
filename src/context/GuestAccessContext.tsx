'use client';

import React, { createContext, useContext } from 'react';
import toast from 'react-hot-toast';

type GuestAccessContextType = {
  isGuest: boolean;
  showGuestModal: boolean;
  setShowGuestModal: (show: boolean) => void;
  handleGuestAction: (onAllowed: () => void, hasPermission?: boolean, customDeniedMessage?: string) => void;
};

const GuestAccessContext = createContext<GuestAccessContextType | undefined>(undefined);

export function GuestAccessProvider({ children }: { children: React.ReactNode }) {
  const isGuest = false;
  const showGuestModal = false;
  const setShowGuestModal = () => {};

  const handleGuestAction = (onAllowed: () => void, hasPermission?: boolean, customDeniedMessage?: string) => {
    if (hasPermission !== undefined && !hasPermission) {
      toast.error(customDeniedMessage || 'Akses ditolak: Anda tidak memiliki izin untuk fitur ini.');
      return;
    }
    onAllowed();
  };

  return (
    <GuestAccessContext.Provider value={{ isGuest, showGuestModal, setShowGuestModal, handleGuestAction }}>
      {children}
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
