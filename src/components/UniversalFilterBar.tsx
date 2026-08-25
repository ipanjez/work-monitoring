'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, X, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilter } from '@/context/FilterContext';

interface UniversalFilterBarProps {
  categories?: string[];
  pics?: string[];
  statuses?: string[];
  priorities?: string[];
  filteredCount?: number;
  totalCount?: number;
  children?: React.ReactNode;
}

const CustomFilterSelect = ({ 
  value, 
  onChange, 
  options, 
  isActive,
  align = 'left'
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { label: string, value: string }[]; 
  isActive: boolean;
  align?: 'left' | 'right';
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'var(--input-bg)',
          border: '1px solid',
          borderColor: isActive ? 'var(--accent-primary)' : (isOpen ? 'var(--accent-primary)' : 'var(--border-color)'),
          color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          height: '32px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
          whiteSpace: 'nowrap'
        }}
      >
        {options.find(o => o.value === value)?.label || value}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} style={{ display: 'flex', flexShrink: 0 }}>
          <ChevronDown size={14} style={{ opacity: 0.5 }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              ...(align === 'right' ? { right: 0 } : { left: 0 }),
              minWidth: '160px',
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              zIndex: 9999,
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px'
            }}
            className="custom-scrollbar"
          >
            {options.map((opt, idx) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    border: 'none',
                    fontSize: '12px',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {opt.label}
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function UniversalFilterBar({ 
  categories = [], 
  pics = [], 
  statuses = [], 
  priorities = [],
  filteredCount,
  totalCount,
  children
}: UniversalFilterBarProps) {
  const { 
    globalSearchQuery, setGlobalSearchQuery,
    globalFilterStatus, setGlobalFilterStatus,
    globalFilterPriority, setGlobalFilterPriority,
    globalFilterCategory, setGlobalFilterCategory,
    globalSearchExactMatch, setGlobalSearchExactMatch,
    globalTargetFilter, setGlobalTargetFilter,
    globalCustomStartDate, setGlobalCustomStartDate,
    globalCustomEndDate, setGlobalCustomEndDate,
    globalPicFilter, setGlobalPicFilter,
    resetFilters
  } = useFilter();

  const [isOpen, setIsOpen] = useState(false);
  const [showSearchInfo, setShowSearchInfo] = useState(false);
  const searchInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInfoRef.current && !searchInfoRef.current.contains(e.target as Node)) {
        setShowSearchInfo(false);
      }
    };
    if (showSearchInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchInfo]);

  const getActiveStyle = (isActive: boolean) => isActive ? {
    borderColor: 'var(--accent-primary)',
    color: 'var(--accent-primary)'
  } : {};

  // Check if any filter is active to show badge
  const isAnyFilterActive = 
    globalFilterStatus !== 'All' || 
    globalFilterPriority !== 'All' || 
    globalFilterCategory !== 'All' || 
    globalTargetFilter !== 'Semua Waktu' || 
    globalPicFilter !== 'Semua PIC' ||
    globalSearchQuery !== '';

  return (
    <div id="universal-filter-bar" className="glass filter-bar-container" style={{ padding: '8px 12px', marginBottom: '20px', borderRadius: '12px', width: '100%' }}>
      
      {/* Top row: Search & Mobile Filter Toggle */}
      <div className="filter-bar-header" style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
        <div className="search-input-wrapper" style={{ position: 'relative', flex: 1, minWidth: '110px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: globalSearchQuery ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
          <input
            className="input"
            style={{ paddingLeft: '30px', width: '100%', paddingRight: '72px', fontSize: '12px', height: '36px', lineHeight: 'normal', boxSizing: 'border-box', ...getActiveStyle(globalSearchQuery !== '') }}
            placeholder="Cari pekerjaan, PIC, file lampiran..."
            value={globalSearchQuery}
            onChange={e => setGlobalSearchQuery(e.target.value)}
          />
          <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '3px', zIndex: 10 }}>
            <button 
              type="button"
              title={globalSearchExactMatch ? "Pencarian Kata Persis (Aktif)" : "Pencarian Kata Persis (Nonaktif)"}
              onClick={() => setGlobalSearchExactMatch(!globalSearchExactMatch)}
              style={{
                background: globalSearchExactMatch ? 'var(--accent-primary)' : 'rgba(148, 163, 184, 0.15)',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 5px',
                borderRadius: '5px',
                fontSize: '9px',
                fontWeight: 700,
                color: globalSearchExactMatch ? 'white' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.2s'
              }}
            >
              Exact
            </button>

            <div ref={searchInfoRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowSearchInfo(!showSearchInfo)}
                title="Informasi Cakupan Pencarian"
                style={{
                  background: showSearchInfo ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  color: showSearchInfo ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: '0.2s'
                }}
              >
                <Info size={14} />
              </button>

              <AnimatePresence>
                {showSearchInfo && (
                  <>
                    {/* Mobile Backdrop Overlay (fixed full-screen on mobile) */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="search-info-backdrop"
                      onClick={() => setShowSearchInfo(false)}
                      style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.55)',
                        backdropFilter: 'blur(3px)',
                        zIndex: 99998,
                      }}
                    />

                    {/* Pop-up Card (floating on desktop, centered bottom/middle modal on mobile) */}
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="search-info-popup-card"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '90vw',
                        maxWidth: '320px',
                        background: 'var(--modal-bg, #1e293b)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
                        zIndex: 99999,
                        fontSize: '12px',
                        lineHeight: 1.5
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Info size={15} /> Cakupan Pencarian
                        </span>
                        <button 
                          type="button"
                          onClick={() => setShowSearchInfo(false)}
                          style={{
                            background: 'var(--input-bg)',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        <div>📌 <strong>Pekerjaan:</strong> Judul, deskripsi & catatan</div>
                        <div>👤 <strong>Personel:</strong> PIC utama & tim PIC tambahan</div>
                        <div>📎 <strong>File Lampiran:</strong> Nama berkas PDF, Excel, Word, format berkas (.pdf, .xlsx, dll)</div>
                        <div>💬 <strong>Komentar:</strong> Teks diskusi & lampiran komentar</div>
                        <div>📋 <strong>Subtask & Lokasi:</strong> Judul subtask & lokasi tugas</div>
                        <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          💡 <em>Tekan tombol <strong>Exact</strong> untuk mencari kata persis/utuh.</em>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <button
          className="mobile-filter-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            height: '36px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: isAnyFilterActive ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface-color)',
            color: isAnyFilterActive ? 'var(--accent-primary)' : 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'none', // Overridden in CSS media query
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: '0.2s',
            position: 'relative'
          }}
        >
          <Filter size={15} />
          <span>Filter</span>
          {isAnyFilterActive && <span className="filter-active-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', position: 'absolute', top: '4px', right: '4px' }} />}
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {children && (
          <div className="filter-bar-actions-desktop" style={{ marginLeft: 'auto', display: 'flex', flexShrink: 0 }}>
            {children}
          </div>
        )}
      </div>

      {/* Collapsible Dropdowns Area */}
      <div className={`filter-options-area ${isOpen ? 'open' : ''}`} style={{ width: '100%' }}>
        <div className="filter-options-grid" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CustomFilterSelect
              value={globalFilterStatus}
              onChange={setGlobalFilterStatus}
              options={[
                { label: 'Semua Status', value: 'All' },
                ...Array.from(new Set(statuses)).map(s => ({ label: s, value: s }))
              ]}
              isActive={globalFilterStatus !== 'All'}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CustomFilterSelect
              value={globalFilterPriority}
              onChange={setGlobalFilterPriority}
              options={[
                { label: 'Semua Prioritas', value: 'All' },
                ...Array.from(new Set(priorities)).map(p => ({ label: p, value: p }))
              ]}
              isActive={globalFilterPriority !== 'All'}
              align="right"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CustomFilterSelect
              value={globalFilterCategory}
              onChange={setGlobalFilterCategory}
              options={[
                { label: 'Semua Kategori', value: 'All' },
                ...Array.from(new Set(categories)).map(cat => ({ label: cat, value: cat }))
              ]}
              isActive={globalFilterCategory !== 'All'}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CustomFilterSelect
              value={globalTargetFilter}
              onChange={setGlobalTargetFilter}
              options={[
                { label: 'Semua Waktu', value: 'Semua Waktu' },
                { label: 'Hari Ini', value: 'Hari Ini' },
                { label: 'Minggu Ini', value: 'Minggu Ini' },
                { label: 'Bulan Ini', value: 'Bulan Ini' },
                { label: 'Terlewat (Overdue)', value: 'Terlewat' },
                { label: 'Custom...', value: 'Custom' }
              ]}
              isActive={globalTargetFilter !== 'Semua Waktu'}
              align="right"
            />
            {globalTargetFilter === 'Custom' && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={globalCustomStartDate}
                  onChange={(e) => setGlobalCustomStartDate(e.target.value)}
                  style={{ width: 'auto', padding: '4px 6px', fontSize: '12px', height: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>-</span>
                <input
                  type="date"
                  value={globalCustomEndDate}
                  onChange={(e) => setGlobalCustomEndDate(e.target.value)}
                  style={{ width: 'auto', padding: '4px 6px', fontSize: '12px', height: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CustomFilterSelect
              value={globalPicFilter}
              onChange={setGlobalPicFilter}
              options={[
                { label: 'Semua PIC', value: 'Semua PIC' },
                ...Array.from(new Set(pics)).map(p => ({ label: p, value: p }))
              ]}
              isActive={globalPicFilter !== 'Semua PIC'}
            />
          </div>

          {isAnyFilterActive && (
            <button
              onClick={resetFilters}
              style={{
                height: '32px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid var(--danger)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: '0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Hapus semua filter aktif"
            >
              <X size={13} />
              <span>Hapus Filter</span>
            </button>
          )}

          {filteredCount !== undefined && totalCount !== undefined && (
            <div className="filter-count-label" style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)', marginLeft: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{filteredCount}</strong> dari {totalCount} data
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons layout on mobile */}
      {children && (
        <div className="filter-bar-actions-mobile" style={{ display: 'none', width: '100%', marginTop: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
