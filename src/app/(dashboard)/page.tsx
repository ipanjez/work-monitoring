import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

// Enable dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let tasks = [];
  try {
    tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Failed to fetch tasks", error);
  }

  // Calculate metrics
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Done').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const todo = tasks.filter(t => t.status === 'To Do').length;

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--text-primary)' }}>Dashboard Overview</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Ringkasan pekerjaan departemen saat ini.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Total Pekerjaan</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{total}</p>
        </div>
        <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Selesai</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--success)' }}>{completed}</p>
        </div>
        <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Proses</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--warning)' }}>{inProgress}</p>
        </div>
        <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Belum Dimulai</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{todo}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass" style={{ padding: '24px', minHeight: '400px' }}>
          <h3 style={{ marginBottom: '24px' }}>Status Pekerjaan</h3>
          <DashboardClient tasks={tasks} type="status" />
        </div>
        <div className="glass" style={{ padding: '24px', minHeight: '400px' }}>
          <h3 style={{ marginBottom: '24px' }}>Beban Kerja PIC</h3>
          <DashboardClient tasks={tasks} type="pic" />
        </div>
      </div>
    </div>
  );
}
