import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --------------------------------------------------------
  // 1. SETUP ROLES (4 ROLES REQUIRED)
  // --------------------------------------------------------
  // 1.1 Platform Admin (ดูแลระบบทั้งหมด)
  await prisma.role.upsert({ 
    where: { RoleCode: 'PLATFORM_ADMIN' }, 
    update: {}, 
    create: { RoleName: 'Platform Admin', RoleCode: 'PLATFORM_ADMIN' } 
  });

  // 1.2 Company Admin (ดูแลบริษัทตัวเอง)
  const companyAdminRole = await prisma.role.upsert({ 
    where: { RoleCode: 'COMPANY_ADMIN' }, 
    update: {}, 
    create: { RoleName: 'Company Admin', RoleCode: 'COMPANY_ADMIN' } 
  });

  // 1.3 Warehouse Manager (ดูแลคลัง/จัดซื้อ/เบิกจ่าย) -> เปลี่ยนจาก WAREHOUSE_ADMIN เป็น WH_MANAGER
  await prisma.role.upsert({ 
    where: { RoleCode: 'WH_MANAGER' }, 
    update: {}, 
    create: { RoleName: 'Warehouse Manager', RoleCode: 'WH_MANAGER' } 
  });

  // 1.4 Requester (คนขอเบิกของผ่าน LINE)
  const requesterRole = await prisma.role.upsert({ 
    where: { RoleCode: 'REQUESTER' }, 
    update: {}, 
    create: { RoleName: 'Requester', RoleCode: 'REQUESTER' } 
  });

  // (Optional) Role อื่นๆ เก็บไว้ได้ถ้าต้องการ Backward Compatibility หรือเผื่อใช้
  await prisma.role.upsert({ where: { RoleCode: 'PLATFORM_STAFF' }, update: {}, create: { RoleName: 'Platform Staff', RoleCode: 'PLATFORM_STAFF' } });
  await prisma.role.upsert({ where: { RoleCode: 'VIEWER' }, update: {}, create: { RoleName: 'Viewer', RoleCode: 'VIEWER' } });


  // --------------------------------------------------------
  // 2. SETUP BASE COMPANIES (Platform & Demo)
  // --------------------------------------------------------
  const platformCo = await prisma.company.upsert({
    where: { CompanyCode: 'PLATFORM' },
    update: {},
    create: { CompanyName: 'Platform System', CompanyCode: 'PLATFORM', CompanyAddress: 'Cloud', CompanyTelNumber: '-', CompanyEmail: 'admin@platform.com' },
  });

  // --------------------------------------------------------
  // 3. SETUP ADMIN USERS
  // --------------------------------------------------------
  const password = await bcrypt.hash('admin123', 10);

  // Platform Admin User
  const platformBranch = await prisma.branch.upsert({
    where: { BranchCode: 'PLATFORM-HQ' },
    update: {},
    create: { CompanyId: platformCo.CompanyId, BranchName: 'Platform HQ', BranchCode: 'PLATFORM-HQ' }
  });

  const pfRole = await prisma.role.findUnique({ where: { RoleCode: 'PLATFORM_ADMIN' } });
  if (pfRole) {
    await prisma.user.upsert({
      where: { UserName: 'platform-admin' },
      update: {},
      create: {
        CompanyId: platformCo.CompanyId,
        UserName: 'platform-admin',
        UserPassword: password,
        RoleId: pfRole.RoleId,
        BranchId: platformBranch.BranchId,
        Email: 'admin@platform.com',
        UserStatusApprove: 'APPROVED',
        UserStatusActive: 'ACTIVE',
      },
    });
  }

  console.log('✅ Seed completed: Roles & Platform Admin created.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());