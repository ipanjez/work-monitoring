'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Palette } from 'lucide-react';
import {
  RolePermissionsConfig,
  AVAILABLE_ROLE_ICONS,
  AVAILABLE_ROLE_COLORS,
  getRoleIconName,
  getRoleColor,
  getRoleLabel
} from '@/lib/permissions';
import { RoleIconRenderer, ROLE_ICON_MAP } from '@/components/RoleBadge';

interface RoleCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleKey: string;
  config: RolePermissionsConfig;
  onSave: (roleKey: string, icon: string, color: string) => void;
}

export default function RoleCustomizationModal({
  isOpen,
  onClose,
  roleKey,
  config,
  onSave
}: RoleCustomizationModalProps) {
  const initialIcon = getRoleIconName(config, roleKey);
  const initialColor = getRoleColor(config, roleKey);
  const roleLabel = getRoleLabel(config, roleKey);

  const [selectedIcon, setSelectedIcon] = useState<string>(initialIcon);
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);
  const [customColorHex, setCustomColorHex] = useState<string>(initialColor);

  // Sync state if roleKey changes
  React.useEffect(() => {
    if (isOpen) {
      const icon = getRoleIconName(config, roleKey);
      const color = getRoleColor(config, roleKey);
      setSelectedIcon(icon);
      setSelectedColor(color);
      setCustomColorHex(color);
    }
  }, [isOpen, roleKey, config]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(roleKey, selectedIcon, selectedColor);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="glass"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '26px',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: `${selectedColor}20`,
                color: selectedColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${selectedColor}40`
              }}
            >
              <Palette size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Kustom Ikon & Warna Role
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Atur simbol dan palet warna visual untuk role <strong>{roleLabel}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-secondary)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Preview Card */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Pratinjau Tampilan Badge:
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: `${selectedColor}18`,
              color: selectedColor,
              border: `1px solid ${selectedColor}40`,
              boxShadow: `0 2px 10px ${selectedColor}22`
            }}
          >
            <RoleIconRenderer iconName={selectedIcon} size={15} color={selectedColor} />
            <span>{roleLabel}</span>
          </div>
        </div>

        {/* 1. Pilih Ikon */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
            1. Pilih Simbol Ikon
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
              gap: '8px',
              maxHeight: '160px',
              overflowY: 'auto',
              padding: '6px 4px'
            }}
          >
            {AVAILABLE_ROLE_ICONS.map((item) => {
              const isSelected = selectedIcon === item.id;
              const IconComp = ROLE_ICON_MAP[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIcon(item.id)}
                  title={item.label}
                  style={{
                    height: '46px',
                    borderRadius: '10px',
                    border: isSelected ? `2px solid ${selectedColor}` : '1px solid var(--border-color)',
                    background: isSelected ? `${selectedColor}18` : 'var(--surface-color)',
                    color: isSelected ? selectedColor : 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 0 10px ${selectedColor}40` : 'none'
                  }}
                >
                  {IconComp && <IconComp size={18} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Pilih Warna */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
            2. Pilih Warna Tema
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {AVAILABLE_ROLE_COLORS.map((c) => {
              const isSelected = selectedColor.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c);
                    setCustomColorHex(c);
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c,
                    border: isSelected ? '3px solid white' : '1px solid rgba(0,0,0,0.15)',
                    boxShadow: isSelected ? `0 0 0 2px ${c}, 0 2px 8px rgba(0,0,0,0.3)` : '0 2px 4px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  {isSelected && <Check size={14} strokeWidth={3} />}
                </button>
              );
            })}

            {/* Custom Color Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
              <input
                type="color"
                value={customColorHex}
                onChange={(e) => {
                  setCustomColorHex(e.target.value);
                  setSelectedColor(e.target.value);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  background: 'none'
                }}
                title="Warna Kustom"
              />
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                {selectedColor.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            style={{ padding: '8px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={15} /> Terapkan Kustomisasi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
