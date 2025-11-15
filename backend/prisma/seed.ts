import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
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

  // Companies
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
      UserStatus: 'ACTIVE',
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
      UserStatus: 'ACTIVE',
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
