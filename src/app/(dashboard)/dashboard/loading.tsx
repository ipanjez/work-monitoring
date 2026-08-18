'use client';
import React from 'react';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function DashboardLoading() {
  return <SkeletonLoader showCards={false} />;
}
