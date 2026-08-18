'use client';
import React from 'react';
import { useMaster } from '@/context/MasterContext';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  masterColors?: Record<string, string>;
  style?: React.CSSProperties;
  title?: string;
}

export default function Avatar({ name, src, size = 32, className = '', masterColors, style = {}, title }: AvatarProps) {
  const defaultSize = size;
  const initials = name ? name.substring(0, 2).toUpperCase() : '?';

  // Fallback to deterministic color
  const getStableColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = (str || '').charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  // Safely get masterColors from props or context
  let contextColors: Record<string, string> | undefined;
  try {
    const master = useMaster();
    contextColors = master?.masterColors;
  } catch (e) {
    // In case Avatar is rendered outside MasterProvider
  }

  const colors = masterColors || contextColors || {};
  let picColor = colors[`pic_${name}`] || colors[name] || null;
  if (!picColor || picColor === '#ffffff') {
    picColor = getStableColor(name || '');
  } else if (picColor.length > 7) {
    picColor = picColor.substring(0, 7);
  }

  const borderWidth = size >= 44 ? 3 : 2;

  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        title={title || name}
        loading="lazy"
        className={`rounded-full object-cover ${className}`}
        style={{ 
          width: defaultSize, 
          height: defaultSize, 
          borderRadius: '50%', 
          objectFit: 'cover', 
          flexShrink: 0, 
          border: `${borderWidth}px solid ${picColor}`,
          boxSizing: 'border-box',
          boxShadow: `0 0 0 1px rgba(0,0,0,0.06), 0 2px 6px ${picColor}33`,
          ...style 
        }}
      />
    );
  }

  return (
    <div 
      title={title || name}
      className={`rounded-full flex items-center justify-center font-bold text-white ${className}`}
      style={{ 
        width: defaultSize, 
        height: defaultSize, 
        borderRadius: '50%',
        backgroundColor: picColor,
        border: `${borderWidth}px solid ${picColor}`,
        boxSizing: 'border-box',
        boxShadow: `0 0 0 1px rgba(0,0,0,0.06), 0 2px 6px ${picColor}33`,
        fontSize: Math.max(10, size / 2.5),
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        letterSpacing: '0.02em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        flexShrink: 0,
        ...style
      }}
    >
      {initials}
    </div>
  );
}
