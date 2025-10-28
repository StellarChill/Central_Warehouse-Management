import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // สร้าง Roles
  await prisma.role.upsert({
    where: { RoleId: 1 },
    update: {},
    create: {
      RoleId: 1,
      RoleName: 'Admin',
      RoleCode: 'ADMIN',
    },
  });

  await prisma.role.upsert({
    where: { RoleId: 2 },
    update: {},
    create: {
      RoleId: 2,
      RoleName: 'Center',
      RoleCode: 'CENTER',
    },
  });

  await prisma.role.upsert({
    where: { RoleId: 3 },
    update: {},
    create: {
      RoleId: 3,
      RoleName: 'Branch',
      RoleCode: 'BRANCH',
    },
  });

  // สร้าง Branches
  await prisma.branch.upsert({
    where: { BranchId: 1 },
    update: {},
    create: {
      BranchId: 1,
      BranchName: 'สาขากลาง (Center A)',
      BranchCode: 'CENTER-A',
      BranchAddress: 'กรุงเทพฯ',
    },
  });

  await prisma.branch.upsert({
    where: { BranchId: 2 },
    update: {},
    create: {
      BranchId: 2,
      BranchName: 'สาขา B',
      BranchCode: 'BRANCH-B',
      BranchAddress: 'เชียงใหม่',
    },
  });

  await prisma.branch.upsert({
    where: { BranchId: 3 },
    update: {},
    create: {
      BranchId: 3,
      BranchName: 'สาขา C',
      BranchCode: 'BRANCH-C',
      BranchAddress: 'ภูเก็ต',
    },
  });

  // สร้าง user admin เริ่มต้น
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
  
  console.log('✅ Seeded:');
  console.log('  - 3 Roles (ADMIN, CENTER, BRANCH)');
  console.log('  - 3 Branches');
  console.log('  - 1 Admin user (username: admin, password: admin123)');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
