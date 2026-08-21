import { NextResponse } from 'next/server';
import { getSyncState } from '@/lib/syncState';

// Disable caching for the real-time sync endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const state = getSyncState();
  return NextResponse.json(state, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
