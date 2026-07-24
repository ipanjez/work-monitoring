'use client';

import { useTheme } from '@/context/ThemeContext';
import { Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FocusModeToggle() {
  const { isFocusMode, toggleFocusMode } = useTheme();

  return (
    <AnimatePresence>
      {isFocusMode && (
        <motion.button
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          onClick={toggleFocusMode}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '50px',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Maximize size={18} /> Keluar Mode Fokus
        </motion.button>
      )}
    </AnimatePresence>
  );
}
