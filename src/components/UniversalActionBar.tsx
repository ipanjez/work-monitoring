'use client';
import React from 'react';
import { Download, FileText, Copy } from 'lucide-react';

interface UniversalActionBarProps {
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  isExportingPdf?: boolean;
  onCopyImage?: () => void;
  children?: React.ReactNode;
}

export default function UniversalActionBar({ 
  onExportExcel, 
  onExportPDF, 
  isExportingPdf, 
  onCopyImage,
  children 
}: UniversalActionBarProps) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        {children}
        {onExportExcel && (
          <button 
            className="btn" 
            onClick={onExportExcel}
            title="Export Excel"
            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 0, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Download size={18} />
          </button>
        )}
        {onExportPDF && (
          <button 
            className="btn" 
            onClick={onExportPDF} 
            disabled={isExportingPdf}
            title="Export PDF"
            style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 0, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)', opacity: isExportingPdf ? 0.7 : 1 }}
          >
            <FileText size={18} />
          </button>
        )}
        {onCopyImage && (
          <button 
            className="btn" 
            onClick={onCopyImage}
            title="Copy as Image"
            style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 0, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Copy size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
