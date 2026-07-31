'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, ExternalLink, Download } from 'lucide-react';
import FileViewer from './FileViewer';

interface FilePreviewModalProps {
  previewFile: { name: string; url: string } | null;
  setPreviewFile: (file: { name: string; url: string } | null) => void;
  theme?: string;
}

export default function FilePreviewModal({ previewFile, setPreviewFile, theme = 'light' }: FilePreviewModalProps) {
  return (
    <AnimatePresence>
      {previewFile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setPreviewFile(null)} />
          <motion.div 
            className="modal-content" 
            style={{ position: 'relative', width: '100%', maxWidth: '900px', height: '85vh', background: 'var(--surface-color)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
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
              <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                <ExternalLink size={16} /> Buka di Tab Baru
              </a>
              <a href={previewFile.url} download={previewFile.name} className="btn btn-primary">
                <Download size={16} /> Unduh File
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
