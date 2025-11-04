import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Roles
  await prisma.role.upsert({
    where: { RoleCode: 'ADMIN' },
    update: {},
    create: { RoleName: 'Admin', RoleCode: 'ADMIN' },
  });
  await prisma.role.upsert({
    where: { RoleCode: 'CENTER' },
    update: {},
    create: { RoleName: 'Center', RoleCode: 'CENTER' },
  });
  await prisma.role.upsert({
    where: { RoleCode: 'BRANCH' },
    update: {},
    create: { RoleName: 'Branch', RoleCode: 'BRANCH' },
  });

  // Branches
  await prisma.branch.upsert({
    where: { BranchCode: 'CENTER-A' },
    update: {},
    create: {
      BranchName: 'สาขากลาง (Center A)',
      BranchCode: 'CENTER-A',
      BranchAddress: 'กรุงเทพฯ',
    },
  });
  await prisma.branch.upsert({
    where: { BranchCode: 'BRANCH-B' },
    update: {},
    create: {
      BranchName: 'สาขา B',
      BranchCode: 'BRANCH-B',
      BranchAddress: 'เชียงใหม่',
    },
  });
  await prisma.branch.upsert({
    where: { BranchCode: 'BRANCH-C' },
    update: {},
    create: {
      BranchName: 'สาขา C',
      BranchCode: 'BRANCH-C',
      BranchAddress: 'ภูเก็ต',
    },
  });

  // Admin user
  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { UserName: 'admin' },
    update: {},
    create: {
      UserName: 'admin',
      UserPassword: password,
      // ดึง id จากของจริง เพื่อไม่ชน FK
      RoleId: (await prisma.role.findUniqueOrThrow({ where: { RoleCode: 'ADMIN' } })).RoleId,
      BranchId: (await prisma.branch.findUniqueOrThrow({ where: { BranchCode: 'CENTER-A' } })).BranchId,
      Email: 'admin@example.com',
      TelNumber: '0123456789',
    },
  });

  console.log('✅ Seeded: roles, branches, admin/admin123');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
