'use client';
import React from 'react';
import { Download, FileText, Copy, Lock } from 'lucide-react';

interface UniversalActionBarProps {
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  isExportingPdf?: boolean;
  onCopyImage?: () => void;
  canExport?: boolean;
  children?: React.ReactNode;
}

export default function UniversalActionBar({ 
  onExportExcel, 
  onExportPDF, 
  isExportingPdf, 
  onCopyImage,
  canExport = true,
  children 
}: UniversalActionBarProps) {
  const disabledStyle: React.CSSProperties = {
    opacity: 0.4,
    cursor: 'not-allowed',
    pointerEvents: 'none' as const
  };

  const disabledTitle = 'Akses ditolak: Anda tidak memiliki izin untuk mengekspor data.';

  return (
    <div id="universal-action-bar" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {!canExport && (
        <span title={disabledTitle} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
          <Lock size={12} /> Ekspor Dikunci
        </span>
      )}
      <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', ...(canExport ? {} : disabledStyle) }}>
        {onExportExcel && (
          <button 
            className="btn" 
            onClick={canExport ? onExportExcel : undefined}
            title={canExport ? 'Export Excel' : disabledTitle}
            disabled={!canExport}
            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 0, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Download size={16} />
          </button>
        )}
        {onExportPDF && (
          <button 
            className="btn" 
            onClick={canExport ? onExportPDF : undefined} 
            disabled={isExportingPdf || !canExport}
            title={canExport ? 'Export PDF' : disabledTitle}
            style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 0, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)', opacity: (isExportingPdf || !canExport) ? 0.7 : 1 }}
          >
            <FileText size={16} />
          </button>
        )}
        {onCopyImage && (
          <button 
            className="btn" 
            onClick={canExport ? onCopyImage : undefined}
            title={canExport ? 'Copy as Image' : disabledTitle}
            disabled={!canExport}
            style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 0, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Copy size={16} />
          </button>
        )}
        {children && (
          <div style={canExport ? {} : disabledStyle}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
