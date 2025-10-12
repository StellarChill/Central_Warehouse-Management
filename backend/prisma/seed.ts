import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // สร้าง RoleId: 1 ถ้ายังไม่มี
  await prisma.role.upsert({
    where: { RoleId: 1 },
    update: {},
    create: {
      RoleId: 1,
      RoleName: 'Admin',
      RoleCode: 'ADMIN',
    },
  });

  // สร้าง BranchId: 1 ถ้ายังไม่มี
  await prisma.branch.upsert({
    where: { BranchId: 1 },
    update: {},
    create: {
      BranchId: 1,
      BranchName: 'สำนักงานใหญ่',
      BranchCode: 'MAIN',
      BranchAddress: 'กรุงเทพฯ',
    },
  });

  // สร้าง user admin
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
  console.log('Seeded admin user, role, and branch');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
