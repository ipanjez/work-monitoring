'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useFilter } from '@/context/FilterContext';

interface EmptyStateProps {
  title?: string;
  description?: string;
  showReset?: boolean;
}

export default function EmptyState({
  title = "Tidak Ada Pekerjaan",
  description = "Coba ubah kata kunci pencarian atau atur kembali filter Anda untuk menampilkan data.",
  showReset = true
}: EmptyStateProps) {
  const {
    setGlobalSearchQuery,
    setGlobalFilterStatus,
    setGlobalFilterPriority,
    setGlobalFilterCategory,
    setGlobalTargetFilter,
    setGlobalPicFilter
  } = useFilter();

  const handleReset = () => {
    setGlobalSearchQuery('');
    setGlobalFilterStatus('All');
    setGlobalFilterPriority('All');
    setGlobalFilterCategory('All');
    setGlobalTargetFilter('Semua Waktu');
    setGlobalPicFilter('Semua PIC');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      {/* Aesthetic Theme-Colored SVG Vector Illustration */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: '24px' }}
      >
        {/* Decorative background grid/circles */}
        <circle cx="100" cy="100" r="80" fill="var(--input-bg)" opacity="0.4" />
        <circle cx="100" cy="100" r="60" fill="var(--border-color)" opacity="0.3" />
        
        {/* Floating dust/particles */}
        <circle cx="45" cy="65" r="4" fill="var(--accent-primary)" opacity="0.6" />
        <circle cx="155" cy="130" r="5" fill="var(--accent-primary)" opacity="0.4" />
        <circle cx="150" cy="70" r="3" fill="var(--success)" opacity="0.5" />
        <circle cx="50" cy="140" r="4" fill="var(--warning)" opacity="0.5" />
        
        {/* Main box vector */}
        <path
          d="M60 75L100 55L140 75L100 95L60 75Z"
          fill="var(--surface-color)"
          stroke="var(--accent-primary)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M60 75V125L100 145V95L60 75Z"
          fill="var(--surface-color)"
          stroke="var(--accent-primary)"
          strokeWidth="3.5"
          strokeLinejoin="round"
          opacity="0.85"
        />
        <path
          d="M140 75V125L100 145V95L140 75Z"
          fill="var(--surface-color)"
          stroke="var(--accent-primary)"
          strokeWidth="3.5"
          strokeLinejoin="round"
          opacity="0.7"
        />
        
        {/* Search glass overlapping the box */}
        <circle
          cx="115"
          cy="105"
          r="22"
          fill="var(--glass-bg)"
          stroke="var(--success)"
          strokeWidth="4.5"
        />
        <path
          d="M131 121L148 138"
          stroke="var(--success)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>

      <h3 style={{
        fontSize: '18px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '8px'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5',
        marginBottom: '20px'
      }}>
        {description}
      </p>

      {showReset && (
        <button
          onClick={handleReset}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
          }}
        >
          <RefreshCw size={14} /> Atur Ulang Filter
        </button>
      )}
    </div>
  );
}
