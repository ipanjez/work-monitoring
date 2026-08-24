'use client';

import React, { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { File, Download, AlertCircle, Loader } from 'lucide-react';

interface FileViewerProps {
  url: string;
  name: string;
}

/**
 * Convert a data:...;base64,xxx URL to an ArrayBuffer.
 */
function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1] || '';
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert a data URL to a Blob URL for download / iframe rendering.
 */
function dataUrlToBlobUrl(dataUrl: string): string {
  const mimeMatch = dataUrl.match(/^data:([^;]+);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const buffer = dataUrlToArrayBuffer(dataUrl);
  const blob = new Blob([buffer], { type: mime });
  return URL.createObjectURL(blob);
}

export default function FileViewer({ url, name }: FileViewerProps) {
  const [content, setContent] = useState<string | React.ReactNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const extMatch = name.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
  const extension = extMatch ? extMatch[1].toLowerCase() : '';

  const isDataUrl = url.startsWith('data:');

  // For data URLs, create a stable blob URL for download links
  const downloadUrl = useMemo(() => {
    if (isDataUrl) return dataUrlToBlobUrl(url);
    return url;
  }, [url, isDataUrl]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadContent = async () => {
      try {
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
          // Images: data URLs work directly in <img> src
          setContent(
            <img 
              src={url} 
              alt={name} 
              style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }} 
            />
          );
        } else if (extension === 'pdf') {
          // PDF: use <object> which works with both regular URLs and blob URLs
          const pdfSrc = isDataUrl ? dataUrlToBlobUrl(url) : url;
          setContent(
            <object
              data={pdfSrc}
              type="application/pdf"
              style={{ width: '100%', height: '65vh', borderRadius: '8px', backgroundColor: 'white' }}
            >
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <p>Browser tidak mendukung pratinjau PDF inline.</p>
                <a href={pdfSrc} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: '16px' }}>
                  <Download size={16} /> Buka PDF
                </a>
              </div>
            </object>
          );
        } else if (['html', 'htm', 'txt', 'xml', 'json'].includes(extension)) {
          const iframeSrc = isDataUrl ? dataUrlToBlobUrl(url) : url;
          setContent(
            <iframe 
              src={iframeSrc} 
              style={{ width: '100%', height: '65vh', border: 'none', borderRadius: '8px', backgroundColor: 'white' }} 
              title={name}
            />
          );
        } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
          let buffer: ArrayBuffer;
          if (isDataUrl) {
            buffer = dataUrlToArrayBuffer(url);
          } else {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Gagal mengambil file');
            buffer = await res.arrayBuffer();
          }
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
          let buffer: ArrayBuffer;
          if (isDataUrl) {
            buffer = dataUrlToArrayBuffer(url);
          } else {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Gagal mengambil file');
            buffer = await res.arrayBuffer();
          }
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
        } else if (['ppt', 'pptx', 'doc'].includes(extension)) {
          if (isDataUrl) {
            // Can't use Office Online viewer with data URLs
            setContent(null);
          } else {
            setContent(
              <iframe 
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                style={{ width: '100%', height: '65vh', border: 'none', borderRadius: '8px', backgroundColor: 'white' }} 
                title={name}
              />
            );
          }
        } else {
          // Unsupported local preview
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
  }, [url, name, extension, isDataUrl]);

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
        <a href={downloadUrl} download={name} className="btn btn-primary" style={{ marginTop: '20px' }}>
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
      <a href={downloadUrl} download={name} className="btn btn-primary" style={{ display: 'inline-flex' }}>
        <Download size={16} /> Unduh File
      </a>
    </div>
  );
}

