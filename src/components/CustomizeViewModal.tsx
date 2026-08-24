'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, SlidersHorizontal, Eye, EyeOff, 
  RotateCcw, CheckSquare, Square, Sparkles, LayoutGrid
} from 'lucide-react';

export interface CustomizeSectionItem {
  id: string;
  label: string;
  description?: string;
  group?: string;
  icon?: React.ReactNode;
}

interface CustomizeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  items: CustomizeSectionItem[];
  visibleMap: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onResetDefaults: () => void;
}

export default function CustomizeViewModal({
  isOpen,
  onClose,
  title = 'Atur Tampilan Komponen',
  description = 'Pilih komponen atau grafik yang ingin ditampilkan pada dashboard. Pengaturan tersimpan secara otomatis di peramban (Local Storage).',
  items,
  visibleMap,
  onToggle,
  onSelectAll,
  onResetDefaults
}: CustomizeViewModalProps) {
  if (!isOpen) return null;

  // Group items
  const groups: { [key: string]: CustomizeSectionItem[] } = {};
  items.forEach(item => {
    const groupName = item.group || 'Komponen Utama';
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(item);
  });

  const totalItems = items.length;
  const visibleCount = items.filter(it => visibleMap[it.id] !== false).length;

  return (
    <AnimatePresence>
      <div 
        className="modal-overlay" 
        style={{ zIndex: 10000 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content glass"
          style={{ 
            maxWidth: '560px', 
            maxHeight: '88vh', 
            display: 'flex', 
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            borderRadius: '16px'
          }}
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'var(--surface-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <LayoutGrid size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                  {title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Menampilkan <strong style={{ color: 'var(--accent-primary)' }}>{visibleCount}</strong> dari {totalItems} bagian
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Actions Bar */}
          <div style={{
            padding: '10px 24px',
            background: 'var(--bg-color)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Klik checklist untuk menyembunyikan / menampilkan
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onSelectAll}
                style={{ fontSize: '11px', padding: '4px 10px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Tampilkan Semua Komponen"
              >
                <CheckSquare size={12} />
                <span>Pilih Semua</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onResetDefaults}
                style={{ fontSize: '11px', padding: '4px 10px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Kembalikan ke Tampilan Default"
              >
                <RotateCcw size={12} />
                <span>Reset Standar</span>
              </button>
            </div>
          </div>

          {/* Items List Body */}
          <div style={{
            padding: '16px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {Object.entries(groups).map(([groupName, groupItems]) => (
              <div key={groupName}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: 'var(--text-secondary)',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{ width: '4px', height: '12px', background: 'var(--accent-primary)', borderRadius: '2px' }} />
                  <span>{groupName}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {groupItems.map((item) => {
                    const isVisible = visibleMap[item.id] !== false;
                    return (
                      <div
                        key={item.id}
                        onClick={() => onToggle(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: isVisible ? 'var(--surface-color)' : 'var(--input-bg)',
                          border: `1px solid ${isVisible ? 'var(--border-color)' : 'transparent'}`,
                          opacity: isVisible ? 1 : 0.65,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isVisible ? 'var(--border-color)' : 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            background: isVisible ? 'var(--accent-primary)' : 'var(--border-color)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            flexShrink: 0
                          }}>
                            {isVisible && <Check size={14} strokeWidth={3} />}
                          </div>

                          <div>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: isVisible ? 'var(--text-primary)' : 'var(--text-secondary)',
                              textDecoration: isVisible ? 'none' : 'line-through'
                            }}>
                              {item.label}
                            </div>
                            {item.description && (
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: isVisible ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                          color: isVisible ? '#10b981' : '#ef4444',
                        }}>
                          {isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
                          <span>{isVisible ? 'Tampil' : 'Sembunyi'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--surface-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              💾 Tersimpan otomatis di peramban
            </span>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              style={{ padding: '8px 20px', fontSize: '12.5px', fontWeight: 600 }}
            >
              Selesai
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
