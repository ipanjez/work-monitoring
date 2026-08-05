const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const mainUrl = "postgresql://neondb_owner:npg_6Gc9DjFSzVeT@ep-green-sound-aze37z65-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

function sanitizeDates(obj) {
  const newObj = { ...obj };
  for (const key in newObj) {
    if (newObj[key] !== null) {
      if (typeof newObj[key] === 'number') {
        if (key.endsWith('At') || key.includes('Date') || key.includes('Verified') || key === 'expires') {
          newObj[key] = new Date(newObj[key]);
        }
      } else if (newObj[key] instanceof Date) {
        // already Date object
      } else if (typeof newObj[key] === 'string' && (key.endsWith('At') || key.includes('Date') || key.includes('Verified') || key === 'expires')) {
        const dateParsed = new Date(newObj[key]);
        if (!isNaN(dateParsed.getTime())) {
          newObj[key] = dateParsed;
        }
      }
    }
  }
  return newObj;
}

async function main() {
  const prismaTarget = new PrismaClient({ datasources: { db: { url: mainUrl } } });
  console.log("Menghubungkan ke database utama...");

  try {
    console.log("Membaca file sqlite_data.json...");
    const sqliteData = JSON.parse(fs.readFileSync('sqlite_data.json', 'utf8'));

    // 1. Migrate Users
    if (sqliteData.User && sqliteData.User.length > 0) {
      console.log(`Memigrasikan ${sqliteData.User.length} User ke database utama...`);
      for (const rawUser of sqliteData.User) {
        const user = sanitizeDates(rawUser);
        await prismaTarget.user.upsert({
          where: { id: user.id },
          update: user,
          create: user
        });
      }
    }

    // 2. Migrate PasswordResetRequests
    if (sqliteData.PasswordResetRequest && sqliteData.PasswordResetRequest.length > 0) {
      console.log(`Memigrasikan ${sqliteData.PasswordResetRequest.length} PasswordResetRequest ke database utama...`);
      for (const rawReq of sqliteData.PasswordResetRequest) {
        const req = sanitizeDates(rawReq);
        await prismaTarget.passwordResetRequest.upsert({
          where: { id: req.id },
          update: req,
          create: req
        });
      }
    }

    console.log("Migrasi 13 data akun ke database utama selesai dengan sukses!");

  } catch (error) {
    console.error("Migrasi akun gagal:", error);
  } finally {
    await prismaTarget.$disconnect();
  }
}

main();
