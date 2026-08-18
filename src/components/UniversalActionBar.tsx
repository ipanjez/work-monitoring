'use client';

import React, { useState } from 'react';
import { 
  Download, FileText, Copy, Lock, FileSpreadsheet, 
  Camera, Check, Loader2, Sparkles, CalendarDays 
} from 'lucide-react';
import CalendarSyncModal from './CalendarSyncModal';
import { Task } from '@/utils/taskUtils';

interface UniversalActionBarProps {
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  isExportingPdf?: boolean;
  onCopyImage?: () => void;
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
  showSyncCalendar = true,
  tasks = [],
  canExport = true,
  children 
}: UniversalActionBarProps) {
  const [copiedImage, setCopiedImage] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const disabledStyle: React.CSSProperties = {
    opacity: 0.45,
    cursor: 'not-allowed',
    pointerEvents: 'none' as const
  };

  const disabledTitle = 'Akses ditolak: Anda tidak memiliki izin untuk mengekspor data.';

  const handleCopyImageClick = () => {
    if (!canExport || !onCopyImage) return;
    onCopyImage();
    setCopiedImage(true);
    setTimeout(() => setCopiedImage(false), 2000);
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
              onClick={canExport ? onExportExcel : undefined}
              title={canExport ? 'Ekspor ke Rich Excel (.xlsx)' : disabledTitle}
              disabled={!canExport}
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
                cursor: canExport ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (canExport) {
                  e.currentTarget.style.background = '#10b981';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(16, 185, 129, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (canExport) {
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
              onClick={canExport ? onExportPDF : undefined} 
              disabled={isExportingPdf || !canExport}
              title={canExport ? 'Unduh Dokumen Laporan PDF' : disabledTitle}
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
                cursor: canExport && !isExportingPdf ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                opacity: (isExportingPdf || !canExport) ? 0.6 : 1,
                boxShadow: '0 1px 3px rgba(239, 68, 68, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (canExport && !isExportingPdf) {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(239, 68, 68, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (canExport && !isExportingPdf) {
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

          {/* 3. Copy Image Button */}
          {onCopyImage && (
            <button 
              onClick={handleCopyImageClick}
              title={canExport ? 'Salin screenshot tampilan tabel/papan ke clipboard' : disabledTitle}
              disabled={!canExport}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: copiedImage ? 'rgba(16, 185, 129, 0.18)' : 'rgba(59, 130, 246, 0.12)',
                color: copiedImage ? '#10b981' : '#3b82f6',
                fontSize: '12px',
                fontWeight: 700,
                cursor: canExport ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(59, 130, 246, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (canExport) {
                  e.currentTarget.style.background = copiedImage ? '#10b981' : '#3b82f6';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (canExport) {
                  e.currentTarget.style.background = copiedImage ? 'rgba(16, 185, 129, 0.18)' : 'rgba(59, 130, 246, 0.12)';
                  e.currentTarget.style.color = copiedImage ? '#10b981' : '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(59, 130, 246, 0.1)';
                }
              }}
            >
              {copiedImage ? (
                <Check size={15} color="#10b981" />
              ) : (
                <Camera size={15} />
              )}
              <span className="hide-mobile" style={{ fontSize: '11.5px' }}>{copiedImage ? 'Tersalin' : 'Gambar'}</span>
            </button>
          )}

          {/* 4. Calendar Sync / iCal Button (Universal across all menus) */}
          {showSyncCalendar && (
            <button 
              onClick={() => setIsSyncModalOpen(true)}
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
                e.currentTarget.style.background = '#f59e0b';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(245, 158, 11, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)';
                e.currentTarget.style.color = '#f59e0b';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(245, 158, 11, 0.1)';
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
