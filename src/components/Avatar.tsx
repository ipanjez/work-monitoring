'use client';
import React from 'react';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  masterColors?: Record<string, string>;
}

export default function Avatar({ name, src, size = 32, className = '', masterColors }: AvatarProps) {
  const defaultSize = size;
  const initials = name ? name.substring(0, 2).toUpperCase() : '?';

  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        title={name}
        className={`rounded-full object-cover ${className}`}
        style={{ width: defaultSize, height: defaultSize, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  // Fallback to initials
  const getStableColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  // If a master color is defined for this PIC, use it, otherwise use deterministic hash
  let bgColor = masterColors ? masterColors[`pic_${name}`] : null;
  if (!bgColor || bgColor === '#ffffff') {
    bgColor = getStableColor(name);
  } else if (bgColor.length > 7) {
    bgColor = bgColor.substring(0, 7);
  }
  
  return (
    <div 
      title={name}
      className={`rounded-full flex items-center justify-center font-bold text-white ${className}`}
      style={{ 
        width: defaultSize, 
        height: defaultSize, 
        borderRadius: '50%',
        backgroundColor: bgColor,
        fontSize: Math.max(10, size / 2.5),
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        letterSpacing: '0.02em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        flexShrink: 0
      }}
    >
      {initials}
    </div>
  );
}
