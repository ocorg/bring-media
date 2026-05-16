import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// ─── EDIT THESE THREE VALUES ───────────────────────────────
const YOUR_NAME = 'TECH SUPPORT';
const YOUR_EMAIL = 'nidam.org@gmail.com';
const YOUR_PASSWORD = 'password123';
// ───────────────────────────────────────────────────────────

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash(YOUR_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: YOUR_EMAIL },
    update: { password: hashed, role: 'super_admin' },
    create: {
      name: YOUR_NAME,
      email: YOUR_EMAIL,
      password: hashed,
      role: 'super_admin',
    },
  });

  console.log('');
  console.log('✓ Super admin ready');
  console.log(`  Email:    ${user.email}`);
  console.log(`  Password: ${YOUR_PASSWORD}`);
  console.log(`  Role:     ${user.role}`);
  console.log('');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());