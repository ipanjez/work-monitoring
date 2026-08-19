const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const users = [
  { npk: '0001', name: 'Administrator', role: 'ADMIN', password: 'admin123' },
  { npk: 'PKT-001', name: 'Alvi', role: 'MEMBER', password: 'alvi123' },
  { npk: 'PKT-002', name: 'Brian', role: 'MEMBER', password: 'brian123' },
  { npk: 'PKT-003', name: 'Farhan', role: 'MEMBER', password: 'farhan123' },
  { npk: 'PKT-004', name: 'Firda', role: 'MEMBER', password: 'firda123' },
  { npk: 'PKT-005', name: 'Jane', role: 'MEMBER', password: 'jane123' },
  { npk: 'PKT-006', name: 'Oky', role: 'MEMBER', password: 'oky123' },
  { npk: 'PKT-007', name: 'Putri', role: 'MEMBER', password: 'putri123' },
  { npk: 'PKT-008', name: 'Rano', role: 'MEMBER', password: 'rano123' },
  { npk: 'PKT-009', name: 'Ria', role: 'MEMBER', password: 'ria123' },
  { npk: 'PKT-010', name: 'Sasmita', role: 'MEMBER', password: 'sasmita123' },
];

async function main() {
  console.log('Seeding users...');
  for (const user of users) {
    const hashed = bcrypt.hashSync(user.password, 10);
    await prisma.user.upsert({
      where: { npk: user.npk },
      update: {},
      create: {
        npk: user.npk,
        name: user.name,
        role: user.role,
        status: 'ACTIVE',
        password: hashed,
      },
    });
    console.log(`  ✓ ${user.npk} - ${user.name} (${user.role})`);
  }
  console.log('Seeding settings (master_pics)...');
  const picNames = users.filter(u => u.npk !== '0001').map(u => u.name);
  await prisma.appSetting.upsert({
    where: { key: 'master_pics' },
    update: { value: JSON.stringify(picNames) },
    create: { key: 'master_pics', value: JSON.stringify(picNames) },
  });
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
