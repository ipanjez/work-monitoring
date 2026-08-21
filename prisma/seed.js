const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const users = [
  { npk: '0001', name: 'Administrator', role: 'ADMIN', password: 'admin123' },
];

async function main() {
  console.log('Seeding default administrator...');
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

  console.log('Seeding initial settings (master_pics)...');
  const existingPics = await prisma.appSetting.findUnique({
    where: { key: 'master_pics' }
  });
  if (!existingPics) {
    await prisma.appSetting.create({
      data: { key: 'master_pics', value: JSON.stringify(['Administrator']) },
    });
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
