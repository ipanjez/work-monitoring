'use client';

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { File, Download, AlertCircle, Loader } from 'lucide-react';

interface FileViewerProps {
  url: string;
  name: string;
}

export default function FileViewer({ url, name }: FileViewerProps) {
  const [content, setContent] = useState<string | React.ReactNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const extMatch = name.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
  const extension = extMatch ? extMatch[1].toLowerCase() : '';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadContent = async () => {
      try {
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
          setContent(
            <img 
              src={url} 
              alt={name} 
              style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }} 
            />
          );
        } else if (['pdf', 'html', 'htm', 'txt', 'xml', 'json'].includes(extension)) {
          setContent(
            <iframe 
              src={url} 
              style={{ width: '100%', height: '65vh', border: 'none', borderRadius: '8px', backgroundColor: 'white' }} 
              title={name}
            />
          );
        } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
          const res = await fetch(url);
          if (!res.ok) throw new Error('Gagal mengambil file');
          const buffer = await res.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const html = XLSX.utils.sheet_to_html(ws);
          
          if (isMounted) {
            setContent(
              <div 
                className="excel-preview-container"
                style={{ width: '100%', height: '65vh', overflow: 'auto', backgroundColor: 'white', padding: '16px', borderRadius: '8px', color: '#000' }}
                dangerouslySetInnerHTML={{ __html: html }} 
              />
            );
          }
        } else if (extension === 'docx') {
          const res = await fetch(url);
          if (!res.ok) throw new Error('Gagal mengambil file');
          const buffer = await res.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          
          if (isMounted) {
            setContent(
              <div 
                className="docx-preview-container"
                style={{ width: '100%', height: '65vh', overflow: 'auto', backgroundColor: 'white', padding: '32px', borderRadius: '8px', color: '#000', fontFamily: 'serif', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: result.value }} 
              />
            );
          }
        } else {
          // Unsupported local preview (like .doc binary)
          setContent(null);
        }
      } catch (err: any) {
        console.error('Preview error:', err);
        if (isMounted) setError(err.message || 'Terjadi kesalahan saat memuat pratinjau file.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [url, name, extension]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-secondary)' }}>
        <Loader className="animate-spin" size={32} style={{ marginBottom: '16px', color: 'var(--accent-primary)' }} />
        <p>Memuat pratinjau file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--danger)' }}>
        <AlertCircle size={48} style={{ marginBottom: '16px' }} />
        <p style={{ fontWeight: 600 }}>Gagal Memuat Pratinjau</p>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>{error}</p>
        <a href={url} download={name} className="btn btn-primary" style={{ marginTop: '20px' }}>
          <Download size={16} /> Unduh File Saja
        </a>
      </div>
    );
  }

  if (content) {
    return <>{content}</>;
  }

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
      <File size={56} color="var(--accent-primary)" style={{ margin: '0 auto 16px' }} />
      <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>{name}</h4>
      <p style={{ fontSize: '13px', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
        Browser tidak mendukung pratinjau langsung untuk format file ini (<code>.{extension}</code>). Silakan unduh file untuk melihat isinya.
      </p>
      <a href={url} download={name} className="btn btn-primary" style={{ display: 'inline-flex' }}>
        <Download size={16} /> Unduh File
      </a>
    </div>
  );
}
