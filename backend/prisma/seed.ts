import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({ where: { RoleCode: 'ADMIN' }, update: {}, create: { RoleName: 'Admin', RoleCode: 'ADMIN' } });
  await prisma.role.upsert({
    where: { RoleCode: 'PLATFORM_ADMIN' },
    update: {},
    create: { RoleName: 'Platform Admin', RoleCode: 'PLATFORM_ADMIN' },
  });
  await prisma.role.upsert({ where: { RoleCode: 'PLATFORM_STAFF' }, update: {}, create: { RoleName: 'Platform Staff', RoleCode: 'PLATFORM_STAFF' } });
  await prisma.role.upsert({ where: { RoleCode: 'COMPANY_ADMIN' }, update: {}, create: { RoleName: 'Company Admin', RoleCode: 'COMPANY_ADMIN' } });
  await prisma.role.upsert({ where: { RoleCode: 'WAREHOUSE_ADMIN' }, update: {}, create: { RoleName: 'Warehouse Admin', RoleCode: 'WAREHOUSE_ADMIN' } });
  await prisma.role.upsert({ where: { RoleCode: 'BRANCH_MANAGER' }, update: {}, create: { RoleName: 'Branch Manager', RoleCode: 'BRANCH_MANAGER' } });
  await prisma.role.upsert({ where: { RoleCode: 'BRANCH_USER' }, update: {}, create: { RoleName: 'Branch User', RoleCode: 'BRANCH_USER' } });
  await prisma.role.upsert({ where: { RoleCode: 'VIEWER' }, update: {}, create: { RoleName: 'Viewer', RoleCode: 'VIEWER' } });
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

  // Companies
  // Platform company (system tenant) for PLATFORM_ADMIN users
  const platformCo = await prisma.company.upsert({
    where: { CompanyCode: 'PLATFORM' },
    update: {},
    create: {
      CompanyName: 'Platform',
      CompanyCode: 'PLATFORM',
      CompanyAddress: 'N/A',
      CompanyTelNumber: 'N/A',
      CompanyEmail: 'platform@system.local',
    },
  });

  const kfc = await prisma.company.upsert({
    where: { CompanyCode: 'KFC' },
    update: {},
    create: {
      CompanyName: 'KFC',
      CompanyCode: 'KFC',
      CompanyAddress: 'Bangkok',
      TaxId: 'TAX-KFC-001',
      CompanyTelNumber: '02-000-0000',
      CompanyEmail: 'admin@kfc.local',
    },
  });

  const mcd = await prisma.company.upsert({
    where: { CompanyCode: 'MCD' },
    update: {},
    create: {
      CompanyName: 'McDonald',
      CompanyCode: 'MCD',
      CompanyAddress: 'Bangkok',
      TaxId: 'TAX-MCD-001',
      CompanyTelNumber: '02-111-1111',
      CompanyEmail: 'admin@mcd.local',
    },
  });

  // Warehouses
  // Minimal platform warehouse to satisfy FK constraints if needed later
  await prisma.warehouse.upsert({
    where: { WarehouseCode: 'PLATFORM-001' },
    update: {},
    create: { CompanyId: platformCo.CompanyId, WarehouseName: 'Platform Main', WarehouseCode: 'PLATFORM-001', WarehouseAddress: 'N/A' },
  });
  const kfcWh1 = await prisma.warehouse.upsert({
    where: { WarehouseCode: 'KFC-001' },
    update: {},
    create: { CompanyId: kfc.CompanyId, WarehouseName: 'KFC Main', WarehouseCode: 'KFC-001', WarehouseAddress: 'Bangkok' },
  });
  await prisma.warehouse.upsert({
    where: { WarehouseCode: 'KFC-002' },
    update: {},
    create: { CompanyId: kfc.CompanyId, WarehouseName: 'KFC Secondary', WarehouseCode: 'KFC-002', WarehouseAddress: 'Chiang Mai' },
  });
  const mcdWh1 = await prisma.warehouse.upsert({
    where: { WarehouseCode: 'MCD-001' },
    update: {},
    create: { CompanyId: mcd.CompanyId, WarehouseName: 'MCD Main', WarehouseCode: 'MCD-001', WarehouseAddress: 'Bangkok' },
  });

  // Branches
  const platformBranch = await prisma.branch.upsert({
    where: { BranchCode: 'PLATFORM-CENTER' },
    update: {},
    create: {
      CompanyId: platformCo.CompanyId,
      BranchName: 'Platform Center',
      BranchCode: 'PLATFORM-CENTER',
      BranchAddress: 'N/A',
    },
  });
  const kfcBranch = await prisma.branch.upsert({
    where: { BranchCode: 'KFC-CENTER' },
    update: {},
    create: {
      CompanyId: kfc.CompanyId,
      BranchName: 'KFC Center',
      BranchCode: 'KFC-CENTER',
      BranchAddress: 'Bangkok',
    },
  });
  const mcdBranch = await prisma.branch.upsert({
    where: { BranchCode: 'MCD-CENTER' },
    update: {},
    create: {
      CompanyId: mcd.CompanyId,
      BranchName: 'MCD Center',
      BranchCode: 'MCD-CENTER',
      BranchAddress: 'Bangkok',
    },
  });

  // Admin users
  const password = await bcrypt.hash('admin123', 10);
  // Platform admin user
  const platformAdminRole = await prisma.role.findUnique({ where: { RoleCode: 'PLATFORM_ADMIN' } });
  if (platformAdminRole) {
    await prisma.user.upsert({
      where: { UserName: 'platform-admin' },
      update: {},
      create: {
        CompanyId: platformCo.CompanyId,
        UserName: 'platform-admin',
        UserPassword: password,
        RoleId: platformAdminRole.RoleId,
        BranchId: platformBranch.BranchId,
        Email: 'platform.admin@example.com',
        TelNumber: '0900000000',
        UserStatusApprove: 'APPROVED',
        UserStatusActive: 'ACTIVE',
      },
    });
  }

  // Map legacy roles to new roles for clarity (optional usage in app logic)
  const companyAdminRole = await prisma.role.findUnique({ where: { RoleCode: 'COMPANY_ADMIN' } });
  if (companyAdminRole) {
    // Ensure existing seeded company admins use COMPANY_ADMIN going forward
    await prisma.user.updateMany({ where: { UserName: { in: ['admin-kfc', 'admin-mcd'] } }, data: { RoleId: companyAdminRole.RoleId } });
  }
  await prisma.user.upsert({
    where: { UserName: 'admin-kfc' },
    update: {},
    create: {
      CompanyId: kfc.CompanyId,
      UserName: 'admin-kfc',
      UserPassword: password,
      RoleId: adminRole.RoleId,
      BranchId: kfcBranch.BranchId,
      Email: 'admin.kfc@example.com',
      TelNumber: '0900000001',
      UserStatusApprove: 'APPROVED',
      UserStatusActive: 'ACTIVE',
    },
  });
  await prisma.user.upsert({
    where: { UserName: 'admin-mcd' },
    update: {},
    create: {
      CompanyId: mcd.CompanyId,
      UserName: 'admin-mcd',
      UserPassword: password,
      RoleId: adminRole.RoleId,
      BranchId: mcdBranch.BranchId,
      Email: 'admin.mcd@example.com',
      TelNumber: '0900000002',
      UserStatusApprove: 'APPROVED',
      UserStatusActive: 'ACTIVE',
    },
  });

  // Catagories
  const kfcCat = await prisma.catagory.upsert({
    where: { CatagoryCode: 'KFC-FOOD' },
    update: {},
    create: { CompanyId: kfc.CompanyId, CatagoryName: 'Food', CatagoryCode: 'KFC-FOOD' },
  });
  const mcdCat = await prisma.catagory.upsert({
    where: { CatagoryCode: 'MCD-FOOD' },
    update: {},
    create: { CompanyId: mcd.CompanyId, CatagoryName: 'Food', CatagoryCode: 'MCD-FOOD' },
  });

  // Suppliers
  const kfcSup = await prisma.supplier.upsert({
    where: { SupplierCode: 'KFC-SUP-1' },
    update: {},
    create: { CompanyId: kfc.CompanyId, SupplierName: 'KFC Supplier', SupplierCode: 'KFC-SUP-1', SupplierAddress: 'Bangkok' },
  });
  await prisma.supplier.upsert({
    where: { SupplierCode: 'MCD-SUP-1' },
    update: {},
    create: { CompanyId: mcd.CompanyId, SupplierName: 'MCD Supplier', SupplierCode: 'MCD-SUP-1', SupplierAddress: 'Bangkok' },
  });

  // Materials
  await prisma.material.upsert({
    where: { MaterialCode: 'KFC-MAT-1' },
    update: {},
    create: {
      CompanyId: kfc.CompanyId,
      MaterialName: 'Chicken Fillet',
      Unit: 'PCS',
      Price: 50,
      CatagoryId: kfcCat.CatagoryId,
      MaterialCode: 'KFC-MAT-1',
    },
  });
  await prisma.material.upsert({
    where: { MaterialCode: 'MCD-MAT-1' },
    update: {},
    create: {
      CompanyId: mcd.CompanyId,
      MaterialName: 'Beef Patty',
      Unit: 'PCS',
      Price: 60,
      CatagoryId: mcdCat.CatagoryId,
      MaterialCode: 'MCD-MAT-1',
    },
  });

  console.log('✅ Seeded: companies (KFC, MCD), warehouses, branches, roles, admins (admin-kfc/admin123, admin-mcd/admin123), catagories, suppliers, materials');
  console.log('👉 Sample IDs:');
  console.log(`   KFC CompanyId=${kfc.CompanyId}, WarehouseId=${kfcWh1.WarehouseId}`);
  console.log(`   MCD CompanyId=${mcd.CompanyId}, WarehouseId=${mcdWh1.WarehouseId}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
