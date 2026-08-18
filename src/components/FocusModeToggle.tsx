'use client';

import React, { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FocusModeHeaderButton() {
  const { isFocusMode, toggleFocusMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleFocusMode}
      className="btn btn-secondary glass"
      title={isFocusMode ? "Keluar Mode Fokus (Esc)" : "Mode Fokus (Layar Penuh)"}
      style={{
        width: '40px',
        height: '40px',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
        cursor: 'pointer',
        color: isFocusMode ? 'var(--accent-primary)' : 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        background: isFocusMode ? 'rgba(59, 130, 246, 0.15)' : 'var(--surface-color)',
        transition: 'all 0.2s ease'
      }}
    >
      {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
    </button>
  );
}

export default function FocusModeToggle() {
  const { isFocusMode, toggleFocusMode } = useTheme();

  // Listen to Escape key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        toggleFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, toggleFocusMode]);

  return (
    <AnimatePresence>
      {isFocusMode && (
        <motion.button
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          onClick={toggleFocusMode}
          title="Tekan Escape untuk keluar"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 22px',
            borderRadius: '50px',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '13.5px',
            cursor: 'pointer'
          }}
        >
          <Minimize2 size={17} /> Keluar Mode Fokus <span style={{ opacity: 0.75, fontSize: '11px', fontWeight: 400 }}>(Esc)</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
