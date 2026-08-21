'use client';

import React, { useState } from 'react';
import { 
  Download, FileText, Copy, Lock, FileSpreadsheet, 
  Image, Check, Loader2, Sparkles, CalendarDays 
} from 'lucide-react';
import CalendarSyncModal from './CalendarSyncModal';
import { Task } from '@/utils/taskUtils';
import SyncStatusBadge from './SyncStatusBadge';

interface UniversalActionBarProps {
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  isExportingPdf?: boolean;
  onCopyImage?: () => void;
  onExportImage?: () => void;
  isExportingImage?: boolean;
  showSyncCalendar?: boolean;
  showSyncBadge?: boolean;
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
  showSyncBadge = true,
  tasks = [],
  canExport = true,
  children 
}: UniversalActionBarProps) {
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Support both old prop name and new prop name
  const handleImageExport = onExportImage || onCopyImage;
  const exportingImage = isExportingImage || false;

  const disabledStyle: React.CSSProperties = {
    opacity: 0.45,
    cursor: 'not-allowed',
    pointerEvents: 'none' as const
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
        {/* Real-Time Live Sync Status Indicator */}
        {showSyncBadge && <SyncStatusBadge />}
        {!canExport && (
          <span 
            title={disabledTitle} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              fontSize: '11px', 
              color: 'var(--text-secondary)',
              background: 'var(--surface-color)',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px dashed var(--border-color)',
              marginRight: '2px'
            }}
          >
            <Lock size={12} color="var(--warning)" /> Export Dibatasi
          </span>
        )}

        {/* Custom Actions / Children buttons */}
        {children}

        {/* Sync Calendar Button */}
        {showSyncCalendar && (
          <button
            id="btn-sync-calendar"
            type="button"
            className="btn btn-secondary"
            onClick={() => canExport && setIsSyncModalOpen(true)}
            title={canExport ? "Sinkronisasi Kalender (Google Calendar, Apple, Outlook via iCal Feed URL)" : disabledTitle}
            disabled={!canExport}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              gap: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-color)',
              color: 'var(--text-primary)',
              cursor: canExport ? 'pointer' : 'not-allowed',
              opacity: canExport ? 1 : 0.45,
              whiteSpace: 'nowrap',
              height: '32px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (canExport) {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.color = 'var(--accent-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (canExport) {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
          >
            <CalendarDays size={14} color={canExport ? "var(--accent-primary)" : "var(--text-secondary)"} />
            <span className="hide-mobile">Sinkron Kalender</span>
          </button>
        )}

        {/* Export Excel Button */}
        {onExportExcel && (
          <button
            id="btn-export-excel"
            type="button"
            className="btn btn-secondary"
            onClick={onExportExcel}
            title={canExport ? 'Ekspor ke Rich Excel (.xlsx)' : disabledTitle}
            disabled={!canExport}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              gap: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-color)',
              color: 'var(--text-primary)',
              cursor: canExport ? 'pointer' : 'not-allowed',
              opacity: canExport ? 1 : 0.45,
              whiteSpace: 'nowrap',
              height: '32px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (canExport) {
                e.currentTarget.style.borderColor = 'var(--success)';
                e.currentTarget.style.color = 'var(--success)';
              }
            }}
            onMouseLeave={(e) => {
              if (canExport) {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
          >
            <FileSpreadsheet size={14} color="var(--success)" />
            <span className="hide-mobile">Excel</span>
          </button>
        )}

        {/* Export PDF Button */}
        {onExportPDF && (
          <button
            id="btn-export-pdf"
            type="button"
            className="btn btn-secondary"
            onClick={onExportPDF}
            disabled={isExportingPdf || !canExport}
            title={canExport ? 'Unduh Dokumen Laporan PDF' : disabledTitle}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              gap: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-color)',
              color: 'var(--text-primary)',
              cursor: canExport && !isExportingPdf ? 'pointer' : 'not-allowed',
              opacity: (isExportingPdf || !canExport) ? 0.45 : 1,
              whiteSpace: 'nowrap',
              height: '32px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (canExport && !isExportingPdf) {
                e.currentTarget.style.borderColor = 'var(--danger)';
                e.currentTarget.style.color = 'var(--danger)';
              }
            }}
            onMouseLeave={(e) => {
              if (canExport && !isExportingPdf) {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
          >
            {isExportingPdf ? (
              <Loader2 size={14} className="animate-spin" color="var(--danger)" />
            ) : (
              <FileText size={14} color="var(--danger)" />
            )}
            <span className="hide-mobile">{isExportingPdf ? 'Mengekspor...' : 'PDF'}</span>
          </button>
        )}

        {/* Export Image Button */}
        {handleImageExport && (
          <button
            id="btn-export-image"
            type="button"
            className="btn btn-secondary"
            onClick={handleExportImageClick}
            title={canExport ? 'Unduh screenshot halaman sebagai file gambar PNG' : disabledTitle}
            disabled={!canExport || exportingImage}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              gap: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-color)',
              color: 'var(--text-primary)',
              cursor: canExport && !exportingImage ? 'pointer' : 'not-allowed',
              opacity: (!canExport || exportingImage) ? 0.45 : 1,
              whiteSpace: 'nowrap',
              height: '32px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (canExport && !exportingImage) {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.color = 'var(--accent-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (canExport && !exportingImage) {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
          >
            {exportingImage ? (
              <>
                <Loader2 size={14} className="animate-spin" color="var(--accent-primary)" />
                <span className="hide-mobile">Menyimpan...</span>
              </>
            ) : (
              <>
                <Download size={14} color="var(--accent-primary)" />
                <span className="hide-mobile">Gambar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Sync Calendar Modal */}
      {showSyncCalendar && (
        <CalendarSyncModal 
          isOpen={isSyncModalOpen} 
          onClose={() => setIsSyncModalOpen(false)} 
          tasks={tasks}
        />
      )}
    </>
  );
}
