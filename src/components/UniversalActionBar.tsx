'use client';

import React, { useState } from 'react';
import { 
  Download, FileText, Copy, Lock, FileSpreadsheet, 
  Image, Check, Loader2, Sparkles, CalendarDays 
} from 'lucide-react';
import CalendarSyncModal from './CalendarSyncModal';
import { Task } from '@/utils/taskUtils';
import { useGuestAccess } from '@/context/GuestAccessContext';

interface UniversalActionBarProps {
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  isExportingPdf?: boolean;
  onCopyImage?: () => void;
  onExportImage?: () => void;
  isExportingImage?: boolean;
  showSyncCalendar?: boolean;
  tasks?: Task[];
  canExport?: boolean;
  children?: React.ReactNode;
}

export default function UniversalActionBar({ 
  onExportExcel, 
  onExportPDF, 
  isExportingPdf, 
  onCopyImage,
  onExportImage,
  isExportingImage,
  showSyncCalendar = true,
  tasks = [],
  canExport = true,
  children 
}: UniversalActionBarProps) {
  const { isGuest, handleGuestAction } = useGuestAccess();
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Support both old prop name and new prop name
  const handleImageExport = onExportImage || onCopyImage;
  const exportingImage = isExportingImage || false;

  const disabledStyle: React.CSSProperties = {
    opacity: 0.45,
    cursor: 'not-allowed',
    pointerEvents: isGuest ? 'auto' : 'none' as const
  };

  const disabledTitle = 'Akses ditolak: Anda tidak memiliki izin untuk mengekspor data.';

  const handleExportImageClick = () => {
    if (!canExport || !handleImageExport) return;
    handleImageExport();
  };

  return (
    <>
      <div 
        id="universal-action-bar" 
        style={{ 
          display: 'flex', 
          gap: '6px', 
          alignItems: 'center',
          flexWrap: 'nowrap'
        }}
      >
        {!canExport && (
          <span 
            title={disabledTitle} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              fontSize: '11px', 
              fontWeight: 600,
              color: 'var(--text-secondary)', 
              padding: '4px 8px', 
              background: 'var(--input-bg)',
              border: '1px solid var(--border-color)', 
              borderRadius: '8px' 
            }}
          >
            <Lock size={12} color="var(--danger)" /> Ekspor Dikunci
          </span>
        )}

        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '6px',
            ...(canExport ? {} : disabledStyle) 
          }}
        >
          {/* 1. Export Excel Button */}
          {onExportExcel && (
            <button 
              onClick={(e) => {
                if (isGuest) {
                  handleGuestAction(() => {});
                } else if (canExport) {
                  onExportExcel();
                }
              }}
              title={isGuest ? 'Akses Terbatas: Masuk/Daftar untuk ekspor' : (canExport ? 'Ekspor ke Rich Excel (.xlsx)' : disabledTitle)}
              disabled={!canExport && !isGuest}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                fontSize: '12px',
                fontWeight: 700,
                cursor: (canExport || isGuest) ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (canExport && !isGuest) {
                  e.currentTarget.style.background = '#10b981';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(16, 185, 129, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (canExport && !isGuest) {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)';
                  e.currentTarget.style.color = '#10b981';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(16, 185, 129, 0.1)';
                }
              }}
            >
              <FileSpreadsheet size={15} />
              <span className="hide-mobile" style={{ fontSize: '11.5px' }}>Excel</span>
            </button>
          )}

          {/* 2. Export PDF Button */}
          {onExportPDF && (
            <button 
              onClick={(e) => {
                if (isGuest) {
                  handleGuestAction(() => {});
                } else if (canExport) {
                  onExportPDF();
                }
              }}
              disabled={(isExportingPdf || !canExport) && !isGuest}
              title={isGuest ? 'Akses Terbatas: Masuk/Daftar untuk ekspor' : (canExport ? 'Unduh Dokumen Laporan PDF' : disabledTitle)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: 700,
                cursor: (canExport || isGuest) && !isExportingPdf ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                opacity: (isExportingPdf || !canExport) && !isGuest ? 0.6 : 1,
                boxShadow: '0 1px 3px rgba(239, 68, 68, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (canExport && !isExportingPdf && !isGuest) {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(239, 68, 68, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (canExport && !isExportingPdf && !isGuest) {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(239, 68, 68, 0.1)';
                }
              }}
            >
              {isExportingPdf ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <FileText size={15} />
              )}
              <span className="hide-mobile" style={{ fontSize: '11.5px' }}>PDF</span>
            </button>
          )}

          {/* 3. Export Image Button */}
          {handleImageExport && (
            <button 
              onClick={(e) => {
                if (isGuest) {
                  handleGuestAction(() => {});
                } else {
                  handleExportImageClick();
                }
              }}
              title={isGuest ? 'Akses Terbatas: Masuk/Daftar untuk export gambar' : (canExport ? 'Unduh screenshot halaman sebagai file gambar PNG' : disabledTitle)}
              disabled={(!canExport && !isGuest) || exportingImage}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                fontSize: '12px',
                fontWeight: 700,
                cursor: (canExport || isGuest) && !exportingImage ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                opacity: exportingImage ? 0.6 : 1,
                boxShadow: '0 1px 3px rgba(59, 130, 246, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (canExport && !isGuest && !exportingImage) {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (canExport && !isGuest && !exportingImage) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)';
                  e.currentTarget.style.color = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(59, 130, 246, 0.1)';
                }
              }}
            >
              {exportingImage ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Image size={15} />
              )}
              <span className="hide-mobile" style={{ fontSize: '11.5px' }}>{exportingImage ? 'Mengekspor...' : 'Gambar'}</span>
            </button>
          )}

          {/* 4. Calendar Sync / iCal Button (Universal across all menus) */}
          {showSyncCalendar && (
            <button 
              onClick={() => {
                if (isGuest) {
                  handleGuestAction(() => {});
                } else {
                  setIsSyncModalOpen(true);
                }
              }}
              title="Sinkronisasi Otomatis Google Calendar / Outlook & Unduh .ics"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(245, 158, 11, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (!isGuest) {
                  e.currentTarget.style.background = '#f59e0b';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(245, 158, 11, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isGuest) {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)';
                  e.currentTarget.style.color = '#f59e0b';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(245, 158, 11, 0.1)';
                }
              }}
            >
              <CalendarDays size={15} />
              <span className="hide-mobile" style={{ fontSize: '11.5px' }}>Sinkron</span>
            </button>
          )}

          {/* 5. Optional Children Components */}
          {children && (
            <div style={canExport ? {} : disabledStyle}>
              {children}
            </div>
          )}
        </div>
      </div>

      <CalendarSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        tasks={tasks}
      />
    </>
  );
}
