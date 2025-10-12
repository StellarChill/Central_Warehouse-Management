import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { UserName: 'admin' },
    update: {},
    create: {
      UserName: 'admin',
      UserPassword: password,
      RoleId: 1,
      BranchId: 1,
      Email: 'admin@example.com',
      TelNumber: '0123456789',
    },
  });
  console.log('Seeded admin user');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
