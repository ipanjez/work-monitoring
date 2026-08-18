'use client';
import React from 'react';

interface SkeletonLoaderProps {
  showCards?: boolean;
}

export default function SkeletonLoader({ showCards = true }: SkeletonLoaderProps) {
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
      {/* Central Pulsating PKT Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
        <div className="pkt-loader-pulse" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg width="100" height="100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer ring */}
            <circle cx="100" cy="100" r="90" stroke="var(--accent-primary)" strokeWidth="6" strokeDasharray="40 15" className="pkt-loader-spin" />
            {/* Abstract Seedling / Growth leaf representing Pupuk Kaltim */}
            <path d="M70 130C70 100 90 80 100 60C110 80 130 100 130 130C130 146.569 116.569 160 100 160C83.4315 160 70 146.569 70 130Z" fill="url(#pktLeafGrad)" />
            {/* Bold PKT Text */}
            <text x="100" y="138" fill="white" fontSize="24" fontWeight="900" textAnchor="middle" fontFamily="'Outfit', 'Inter', sans-serif">PKT</text>
            
            <defs>
              <linearGradient id="pktLeafGrad" x1="100" y1="60" x2="100" y2="160" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--accent-primary)" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
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
