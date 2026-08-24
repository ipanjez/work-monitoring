'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, ExternalLink, Download } from 'lucide-react';
import FileViewer from './FileViewer';

interface FilePreviewModalProps {
  previewFile: { name: string; url: string } | null;
  setPreviewFile: (file: { name: string; url: string } | null) => void;
  theme?: string;
}

function dataUrlToBlobUrl(dataUrl: string): string {
  const mimeMatch = dataUrl.match(/^data:([^;]+);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const base64 = dataUrl.split(',')[1] || '';
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const blob = new Blob([bytes.buffer], { type: mime });
  return URL.createObjectURL(blob);
}

export default function FilePreviewModal({ previewFile, setPreviewFile, theme = 'light' }: FilePreviewModalProps) {
  const actionUrl = useMemo(() => {
    if (!previewFile) return '';
    if (previewFile.url.startsWith('data:')) return dataUrlToBlobUrl(previewFile.url);
    return previewFile.url;
  }, [previewFile]);

  return (
    <AnimatePresence>
      {previewFile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={() => setPreviewFile(null)} />
          <motion.div 
            className="modal-content" 
            style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '900px', height: '85vh', background: 'var(--surface-color)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '600px' }}>
                  Preview: {previewFile.name}
                </h3>
              </div>
              <button className="btn-icon" onClick={() => setPreviewFile(null)}><X size={20} /></button>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', background: theme === 'dark' ? '#0f172a' : '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <FileViewer url={previewFile.url} name={previewFile.name} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px', background: 'var(--surface-color)', borderTop: '1px solid var(--border-color)' }}>
              <a 
                href={actionUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary"
              >
                <ExternalLink size={16} /> Buka di Tab Baru
              </a>
              <a 
                href={actionUrl} 
                download={previewFile.name} 
                className="btn btn-primary"
              >
                <Download size={16} /> Unduh File
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

