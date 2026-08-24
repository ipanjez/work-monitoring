import SkeletonLoader from '@/components/SkeletonLoader';

export default function DashboardLoading() {
  return (
    <div style={{ width: '100%', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SkeletonLoader showCards={false} />
    </div>
  );
}
