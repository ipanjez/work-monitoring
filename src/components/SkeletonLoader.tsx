'use client';
import React from 'react';
import { useMaster } from '@/context/MasterContext';
import { CheckSquare } from 'lucide-react';

interface SkeletonLoaderProps {
  showCards?: boolean;
}

export default function SkeletonLoader({ showCards = true }: SkeletonLoaderProps) {
  const { appLogo } = useMaster();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px', 
      padding: '16px', 
      width: '100%', 
      height: !showCards ? '60vh' : 'auto', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      {/* Central Pulsating App Logo matching Sidebar */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
        <div className="pkt-loader-pulse" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          position: 'relative',
          width: '100px',
          height: '100px'
        }}>
          {/* Outer ring */}
          <svg width="100" height="100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute' }}>
            <circle cx="100" cy="100" r="90" stroke="var(--accent-primary)" strokeWidth="6" strokeDasharray="40 15" className="pkt-loader-spin" />
          </svg>
          
          {/* Inner Logo Image / Fallback Icon matching sidebar */}
          <div style={{ 
            width: '54px', 
            height: '54px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            borderRadius: '50%', 
            overflow: 'hidden',
            backgroundColor: appLogo ? 'transparent' : 'var(--accent-primary)',
            color: 'white',
            padding: appLogo ? '0' : '10px',
            zIndex: 2
          }}>
            {appLogo ? (
              <img src={appLogo} alt="App Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <CheckSquare size={32} />
            )}
          </div>
        </div>
      </div>

      {/* Skeleton Cards Grid */}
      {showCards && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', width: '100%' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="skeleton-bar" style={{ width: '40%', height: '16px' }} />
              <div className="skeleton-bar" style={{ width: '85%', height: '20px' }} />
              <div className="skeleton-bar" style={{ width: '100%', height: '40px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <div className="skeleton-bar" style={{ width: '30%', height: '14px' }} />
                <div className="skeleton-bar" style={{ width: '20%', height: '20px', borderRadius: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
