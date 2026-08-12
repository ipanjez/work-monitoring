const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const originalContent = fs.readFileSync(schemaPath, 'utf-8');

// Switch schema to SQLite
let sqliteSchema = originalContent
  .replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"')
  .replace(/\s*directUrl\s*=\s*env\(["']DIRECT_URL["']\)\s*\n?/, '\n');

fs.writeFileSync(schemaPath, sqliteSchema);
console.log('✅ Schema switched to SQLite');

// Set DATABASE_URL for SQLite
process.env.DATABASE_URL = 'file:./dev.db';

// Generate Prisma client for SQLite
try {
  console.log('⏳ Generating Prisma client for SQLite...');
  execSync('npx prisma generate', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: 'file:./dev.db' } });
  console.log('✅ Prisma client generated');
} catch (e) {
  console.error('❌ Failed to generate Prisma client');
  fs.writeFileSync(schemaPath, originalContent);
  process.exit(1);
}

// Ensure SQLite DB exists
try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: 'file:./dev.db' } });
  console.log('✅ SQLite database ready');
} catch (e) {
  console.error('⚠️  Warning: db push had issues, but continuing...');
}

// Restore schema on exit (always, no matter what)
function restore() {
  try {
    fs.writeFileSync(schemaPath, originalContent);
    console.log('\n🔄 Schema restored to PostgreSQL');
  } catch (e) {}
}

process.on('exit', restore);
process.on('SIGINT', () => { restore(); process.exit(0); });
process.on('SIGTERM', () => { restore(); process.exit(0); });
process.on('uncaughtException', (e) => { console.error(e); restore(); process.exit(1); });

// Start Next.js dev server
console.log('\n🚀 Starting local dev server (SQLite)...\n');
const child = spawn('npx', ['next', 'dev', '-H', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: 'file:./dev.db' },
});

child.on('close', (code) => {
  process.exit(code || 0);
});
