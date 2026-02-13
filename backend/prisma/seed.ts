import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. SETUP ROLES
  const roles = [
    { name: 'Platform Admin', code: 'PLATFORM_ADMIN' },
    { name: 'Company Admin', code: 'COMPANY_ADMIN' },
    { name: 'Warehouse Manager', code: 'WH_MANAGER' },
    { name: 'Requester', code: 'REQUESTER' },
    { name: 'Platform Staff', code: 'PLATFORM_STAFF' },
    { name: 'Viewer', code: 'VIEWER' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { RoleCode: role.code },
      update: {},
      create: { RoleName: role.name, RoleCode: role.code }
    });
  }

  const platformAdminRole = await prisma.role.findUnique({ where: { RoleCode: 'PLATFORM_ADMIN' } });
  const companyAdminRole = await prisma.role.findUnique({ where: { RoleCode: 'COMPANY_ADMIN' } });
  // const whManagerRole = await prisma.role.findUnique({ where: { RoleCode: 'WH_MANAGER' } });
  // const requesterRole = await prisma.role.findUnique({ where: { RoleCode: 'REQUESTER' } });

  // 2. SETUP PLATFORM COMPANY
  const platformCo = await prisma.company.upsert({
    where: { CompanyCode: 'PLATFORM' },
    update: {},
    create: {
      CompanyName: 'Platform System',
      CompanyCode: 'PLATFORM',
      CompanyAddress: 'Cloud',
      CompanyTelNumber: '-',
      CompanyEmail: 'admin@platform.com'
    },
  });

  const platformBranch = await prisma.branch.upsert({
    where: { BranchCode: 'PLATFORM-HQ' },
    update: {},
    create: { CompanyId: platformCo.CompanyId, BranchName: 'Platform HQ', BranchCode: 'PLATFORM-HQ' }
  });

  const password = await bcrypt.hash('admin123', 10);

  if (platformAdminRole) {
    await prisma.user.upsert({
      where: { UserName: 'platform-admin' },
      update: { RoleId: platformAdminRole.RoleId },
      create: {
        CompanyId: platformCo.CompanyId,
        UserName: 'platform-admin',
        UserPassword: password,
        RoleId: platformAdminRole.RoleId,
        BranchId: platformBranch.BranchId,
        Email: 'admin@platform.com',
        UserStatusApprove: 'APPROVED',
        UserStatusActive: 'ACTIVE',
      },
    });
  }

  // 3. SEED COMPANIES (McDonald's, KFC, MK Suki)
  const companiesData = [
    { name: "McDonald's", code: 'MCD', email: 'admin@mcd.co.th' },
    { name: 'KFC', code: 'KFC', email: 'admin@kfc.co.th' },
    { name: 'MK Suki', code: 'MK', email: 'admin@mk.co.th' },
  ];

  for (const co of companiesData) {
    const company = await prisma.company.upsert({
      where: { CompanyCode: co.code },
      update: {},
      create: {
        CompanyName: co.name,
        CompanyCode: co.code,
        CompanyEmail: co.email,
        CompanyAddress: `Headquarters of ${co.name}`,
      }
    });

    // Branches (2 per company)
    const branches = [];
    for (let i = 1; i <= 2; i++) {
      const branch = await prisma.branch.upsert({
        where: { BranchCode: `${co.code}-B${i}` },
        update: {},
        create: {
          BranchName: `${co.name} Branch ${i}`,
          BranchCode: `${co.code}-B${i}`,
          CompanyId: company.CompanyId,
          BranchAddress: `Street ${i}, Bangkok`,
        }
      });
      branches.push(branch);
    }

    // Warehouses (2 per company)
    for (let i = 1; i <= 2; i++) {
      await prisma.warehouse.upsert({
        where: { WarehouseCode: `${co.code}-WH${i}` },
        update: {},
        create: {
          WarehouseName: `${co.name} Warehouse ${i}`,
          WarehouseCode: `${co.code}-WH${i}`,
          CompanyId: company.CompanyId,
          WarehouseAddress: `Industrial Zone ${i}`,
        }
      });
    }

    // Company Admin User
    if (companyAdminRole) {
      await prisma.user.upsert({
        where: { UserName: `${co.code.toLowerCase()}-admin` },
        update: { RoleId: companyAdminRole.RoleId },
        create: {
          UserName: `${co.code.toLowerCase()}-admin`,
          UserPassword: password,
          CompanyId: company.CompanyId,
          BranchId: branches[0].BranchId,
          RoleId: companyAdminRole.RoleId,
          Email: co.email,
          UserStatusApprove: 'APPROVED',
          UserStatusActive: 'ACTIVE',
        }
      });
    }

    // Categories
    const categories = [];
    const catNames = ['Frozen Food', 'Dry Goods', 'Packaging', 'Beverage'];
    for (const catName of catNames) {
      const catCode = `${co.code}-${catName.toUpperCase().replace(' ', '_')}`;
      const category = await prisma.catagory.upsert({
        where: { CatagoryCode: catCode },
        update: {},
        create: {
          CatagoryName: catName,
          CatagoryCode: catCode,
          CompanyId: company.CompanyId,
        }
      });
      categories.push(category);
    }

    // Suppliers
    const suppliers = [];
    for (let i = 1; i <= 3; i++) {
      const s = await prisma.supplier.upsert({
        where: { SupplierCode: `${co.code}-SUP${i}` },
        update: {},
        create: {
          SupplierName: `Supplier ${i} for ${co.name}`,
          SupplierCode: `${co.code}-SUP${i}`,
          CompanyId: company.CompanyId,
          SupplierTelNumber: `02-123-456${i}`,
        }
      });
      suppliers.push(s);
    }

    // Materials (Ingredients)
    const materialsData = [
      { name: 'Beef Patty', unit: 'BOX', price: 1200, cat: 'Frozen Food' },
      { name: 'Chicken Wings', unit: 'KG', price: 150, cat: 'Frozen Food' },
      { name: 'Potato Fries', unit: 'BAG', price: 450, cat: 'Frozen Food' },
      { name: 'Cooking Oil', unit: 'BUCKET', price: 800, cat: 'Dry Goods' },
      { name: 'Sugar', unit: 'KG', price: 25, cat: 'Dry Goods' },
      { name: 'Salt', unit: 'KG', price: 15, cat: 'Dry Goods' },
      { name: 'Paper Cup', unit: 'SLEEVE', price: 300, cat: 'Packaging' },
      { name: 'Paper Bag', unit: 'PACK', price: 200, cat: 'Packaging' },
      { name: 'Cola Syrup', unit: 'BIB', price: 2500, cat: 'Beverage' },
      { name: 'Drinking Water', unit: 'CASE', price: 120, cat: 'Beverage' },
    ];

    for (const mat of materialsData) {
      const category = categories.find(c => c.CatagoryName === mat.cat);
      if (category) {
        await prisma.material.upsert({
          where: { MaterialCode: `${co.code}-${mat.name.toUpperCase().replace(' ', '_')}` },
          update: {},
          create: {
            MaterialName: mat.name,
            MaterialCode: `${co.code}-${mat.name.toUpperCase().replace(' ', '_')}`,
            Unit: mat.unit,
            Price: mat.price,
            CatagoryId: category.CatagoryId,
            CompanyId: company.CompanyId,
          }
        });
      }
    }

    console.log(`✅ Seeded ${co.name} company with branches, warehouses, users, materials, and suppliers.`);
  }

  console.log('🏁 Seed completed successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());