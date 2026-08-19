'use client';

import React from 'react';
import {
  ShieldCheck, Shield, ShieldAlert, User, Users, UserCheck,
  Crown, Award, Star, Zap, Eye, Briefcase, Settings, KeyRound,
  Sparkles, Lock, Compass
} from 'lucide-react';
import { RolePermissionsConfig, getRoleLabel, getRoleIconName, getRoleColor } from '@/lib/permissions';

export const ROLE_ICON_MAP: Record<string, React.ComponentType<any>> = {
  ShieldCheck,
  Shield,
  ShieldAlert,
  User,
  Users,
  UserCheck,
  Crown,
  Award,
  Star,
  Zap,
  Eye,
  Briefcase,
  Settings,
  KeyRound,
  Sparkles,
  Lock,
  Compass
};

export function RoleIconRenderer({
  iconName,
  size = 14,
  color,
  style = {}
}: {
  iconName: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  const IconComponent = ROLE_ICON_MAP[iconName] || User;
  return <IconComponent size={size} color={color} style={{ flexShrink: 0, ...style }} />;
}

interface RoleBadgeProps {
  role: string;
  config?: RolePermissionsConfig | null;
  size?: 'sm' | 'md' | 'lg';
  showIconOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function RoleBadge({
  role,
  config,
  size = 'md',
  showIconOnly = false,
  className = '',
  style = {}
}: RoleBadgeProps) {
  const label = getRoleLabel(config, role);
  const iconName = getRoleIconName(config, role);
  const color = getRoleColor(config, role);

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 13;
  const padding = size === 'sm' ? '2px 8px' : size === 'lg' ? '6px 14px' : '3px 10px';
  const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '13px' : '12px';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding,
        borderRadius: '9999px',
        fontSize,
        fontWeight: 600,
        backgroundColor: `${color}18`,
        color: color,
        border: `1px solid ${color}35`,
        lineHeight: 1.2,
        userSelect: 'none',
        ...style
      }}
    >
      <RoleIconRenderer iconName={iconName} size={iconSize} color={color} />
      {!showIconOnly && <span>{label}</span>}
    </span>
  );
}
