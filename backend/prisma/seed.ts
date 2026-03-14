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
    { name: 'Branch User', code: 'BRANCH_USER' },
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

  // 3. SEED COMPANIES (Thai Supermarket Chains)
  const companiesData = [
    {
      name: 'บิ๊กซี ซูเปอร์เซ็นเตอร์',
      code: 'BIGC',
      email: 'admin@bigc.co.th',
      tel: '02-655-0666',
      address: '97/11 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330',
      branches: [
        { name: 'บิ๊กซี อ่อนนุช', code: 'BIGC-ON-NUT', address: '590/1 ถนนสุขุมวิท 77 อ่อนนุช กรุงเทพฯ' },
        { name: 'บิ๊กซี แจ้งวัฒนะ', code: 'BIGC-CHAENG', address: '99 ถนนแจ้งวัฒนะ ปากเกร็ด นนทบุรี' },
        { name: 'บิ๊กซี บางนา', code: 'BIGC-BANGNA', address: '777 ถนนบางนา-ตราด (กม.3) บางนา กรุงเทพฯ' },
        { name: 'บิ๊กซี รังสิต', code: 'BIGC-RANGSIT', address: '94 ถนนพหลโยธิน รังสิต ปทุมธานี' },
        { name: 'บิ๊กซี ลาดพร้าว', code: 'BIGC-LADPRAO', address: '3522 ถนนลาดพร้าว วังทองหลาง กรุงเทพฯ' },
      ],
      warehouses: [
        { name: 'คลังสินค้าบิ๊กซี กรุงเทพ', code: 'BIGC-WH-BKK', address: 'นิคมอุตสาหกรรมลาดกระบัง กรุงเทพฯ' },
        { name: 'คลังสินค้าบิ๊กซี รังสิต', code: 'BIGC-WH-RNG', address: 'เขตอุตสาหกรรมนวนคร ปทุมธานี' },
      ],
      categories: [
        'ผักและผลไม้สด', 'เนื้อสัตว์และอาหารทะเล', 'อาหารแช่แข็ง', 'นมและผลิตภัณฑ์นม',
        'เครื่องดื่ม', 'ขนมขบเคี้ยว', 'เครื่องปรุงรส', 'ของใช้ภายในบ้าน', 'บรรจุภัณฑ์', 'สินค้าแห้ง'
      ],
      materials: [
        // ผักและผลไม้สด
        { name: 'มะเขือเทศ', code: 'BIGC-TOM', unit: 'KG', price: 40, cat: 'ผักและผลไม้สด' },
        { name: 'แตงกวา', code: 'BIGC-CUC', unit: 'KG', price: 25, cat: 'ผักและผลไม้สด' },
        { name: 'กะหล่ำปลี', code: 'BIGC-CAB', unit: 'หัว', price: 30, cat: 'ผักและผลไม้สด' },
        { name: 'แครอท', code: 'BIGC-CAR', unit: 'KG', price: 45, cat: 'ผักและผลไม้สด' },
        { name: 'ส้มสายน้ำผึ้ง', code: 'BIGC-ORG', unit: 'KG', price: 55, cat: 'ผักและผลไม้สด' },
        { name: 'กล้วยหอม', code: 'BIGC-BAN', unit: 'หวี', price: 35, cat: 'ผักและผลไม้สด' },
        // เนื้อสัตว์
        { name: 'หมูสามชั้น', code: 'BIGC-PBL', unit: 'KG', price: 180, cat: 'เนื้อสัตว์และอาหารทะเล' },
        { name: 'อกไก่', code: 'BIGC-CHB', unit: 'KG', price: 120, cat: 'เนื้อสัตว์และอาหารทะเล' },
        { name: 'กุ้งแวนนาไม', code: 'BIGC-SHR', unit: 'KG', price: 280, cat: 'เนื้อสัตว์และอาหารทะเล' },
        { name: 'ปลาทับทิม', code: 'BIGC-FSH', unit: 'KG', price: 150, cat: 'เนื้อสัตว์และอาหารทะเล' },
        // อาหารแช่แข็ง
        { name: 'เกี้ยวซ่า', code: 'BIGC-GYZ', unit: 'ถุง', price: 85, cat: 'อาหารแช่แข็ง' },
        { name: 'ลูกชิ้นปลา', code: 'BIGC-FBL', unit: 'ถุง', price: 65, cat: 'อาหารแช่แข็ง' },
        { name: 'มันฝรั่งทอด', code: 'BIGC-FRF', unit: 'ถุง', price: 120, cat: 'อาหารแช่แข็ง' },
        // นม
        { name: 'นมสดโฮโมจีไนส์', code: 'BIGC-MLK', unit: 'ลัง', price: 480, cat: 'นมและผลิตภัณฑ์นม' },
        { name: 'โยเกิร์ตรสธรรมชาติ', code: 'BIGC-YGT', unit: 'ลัง', price: 320, cat: 'นมและผลิตภัณฑ์นม' },
        // เครื่องดื่ม
        { name: 'น้ำดื่มบรรจุขวด', code: 'BIGC-WTR', unit: 'ลัง', price: 120, cat: 'เครื่องดื่ม' },
        { name: 'น้ำอัดลม (โคลา)', code: 'BIGC-CLA', unit: 'ลัง', price: 250, cat: 'เครื่องดื่ม' },
        { name: 'ชาเขียวพร้อมดื่ม', code: 'BIGC-GRT', unit: 'ลัง', price: 280, cat: 'เครื่องดื่ม' },
        // เครื่องปรุง
        { name: 'น้ำปลา', code: 'BIGC-FSC', unit: 'ขวด', price: 35, cat: 'เครื่องปรุงรส' },
        { name: 'ซีอิ๊วดำ', code: 'BIGC-SOY', unit: 'ขวด', price: 28, cat: 'เครื่องปรุงรส' },
        { name: 'น้ำมันพืช', code: 'BIGC-OIL', unit: 'ขวด', price: 75, cat: 'เครื่องปรุงรส' },
        // สินค้าแห้ง
        { name: 'ข้าวสารหอมมะลิ 5 กก.', code: 'BIGC-RIC', unit: 'ถุง', price: 165, cat: 'สินค้าแห้ง' },
        { name: 'บะหมี่กึ่งสำเร็จรูป', code: 'BIGC-NDL', unit: 'ลัง', price: 180, cat: 'สินค้าแห้ง' },
        // บรรจุภัณฑ์
        { name: 'ถุงพลาสติก (ขาวขุ่น)', code: 'BIGC-PBG', unit: 'กล่อง', price: 250, cat: 'บรรจุภัณฑ์' },
        { name: 'กล่องโฟมบรรจุอาหาร', code: 'BIGC-FBX', unit: 'แพ็ค', price: 180, cat: 'บรรจุภัณฑ์' },
      ]
    },
    {
      name: 'โลตัส (โลตัส ซูเปอร์เซ็นเตอร์)',
      code: 'LOTUS',
      email: 'admin@lotuss.co.th',
      tel: '02-830-9999',
      address: '629/1 ถนนนวมินทร์ บึงกุ่ม กรุงเทพฯ 10240',
      branches: [
        { name: 'โลตัส สุขุมวิท 50', code: 'LOTUS-SUK', address: '2942 ถนนสุขุมวิท พระโขนง กรุงเทพฯ' },
        { name: 'โลตัส บางใหญ่', code: 'LOTUS-BNY', address: '9/9 ถนนกาญจนาภิเษก บางใหญ่ นนทบุรี' },
        { name: 'โลตัส สมุทรปราการ', code: 'LOTUS-SPK', address: '39 ถนนศรีนครินทร์ เมือง สมุทรปราการ' },
        { name: 'โลตัส เชียงใหม่', code: 'LOTUS-CNX', address: '55 ถนนช้างคลาน เมือง เชียงใหม่' },
        { name: 'โลตัส ขอนแก่น', code: 'LOTUS-KKN', address: '88 ถนนมิตรภาพ เมือง ขอนแก่น' },
      ],
      warehouses: [
        { name: 'คลังสินค้าโลตัส กรุงเทพ', code: 'LOTUS-WH-BKK', address: 'บางนา-ตราด กม.19 กรุงเทพฯ' },
        { name: 'คลังสินค้าโลตัส เหนือ', code: 'LOTUS-WH-NTH', address: 'นิคมอุตสาหกรรมลำพูน' },
      ],
      categories: [
        'อาหารสด', 'อาหารแปรรูป', 'เบเกอรี่และขนมหวาน', 'เครื่องสำอางและของใช้ส่วนตัว',
        'เครื่องใช้ไฟฟ้า', 'เสื้อผ้าและสิ่งทอ', 'ผลิตภัณฑ์ทำความสะอาด', 'อุปกรณ์ทำครัว',
        'สินค้าเด็กและทารก', 'สัตว์เลี้ยง'
      ],
      materials: [
        // อาหารสด
        { name: 'ผักบุ้งจีน', code: 'LOTUS-MWS', unit: 'KG', price: 30, cat: 'อาหารสด' },
        { name: 'คะน้า', code: 'LOTUS-KAL', unit: 'KG', price: 35, cat: 'อาหารสด' },
        { name: 'ไก่ทั้งตัว', code: 'LOTUS-WCK', unit: 'ตัว', price: 160, cat: 'อาหารสด' },
        { name: 'หมูเนื้อแดง', code: 'LOTUS-PLN', unit: 'KG', price: 185, cat: 'อาหารสด' },
        { name: 'ปูม้า', code: 'LOTUS-CRB', unit: 'KG', price: 350, cat: 'อาหารสด' },
        // อาหารแปรรูป
        { name: 'ไส้กรอกหมูอบ', code: 'LOTUS-SKG', unit: 'ถุง', price: 89, cat: 'อาหารแปรรูป' },
        { name: 'แฮมโบโลญ่า', code: 'LOTUS-HAM', unit: 'ถุง', price: 75, cat: 'อาหารแปรรูป' },
        { name: 'กุนเชียง', code: 'LOTUS-GNJ', unit: 'ถุง', price: 120, cat: 'อาหารแปรรูป' },
        // เบเกอรี่
        { name: 'ขนมปังแซนวิช', code: 'LOTUS-BRD', unit: 'ก้อน', price: 35, cat: 'เบเกอรี่และขนมหวาน' },
        { name: 'เค้กช็อกโกแลต', code: 'LOTUS-CCK', unit: 'ชิ้น', price: 45, cat: 'เบเกอรี่และขนมหวาน' },
        // ของใช้ส่วนตัว
        { name: 'แชมพู (1000ml)', code: 'LOTUS-SHP', unit: 'ขวด', price: 220, cat: 'เครื่องสำอางและของใช้ส่วนตัว' },
        { name: 'สบู่อาบน้ำ (แพ็ค 4)', code: 'LOTUS-SBP', unit: 'แพ็ค', price: 95, cat: 'เครื่องสำอางและของใช้ส่วนตัว' },
        // ทำความสะอาด
        { name: 'น้ำยาล้างจาน (750ml)', code: 'LOTUS-DWL', unit: 'ขวด', price: 49, cat: 'ผลิตภัณฑ์ทำความสะอาด' },
        { name: 'ผงซักฟอก (3 กก.)', code: 'LOTUS-DET', unit: 'ถุง', price: 180, cat: 'ผลิตภัณฑ์ทำความสะอาด' },
        { name: 'กระดาษทิชชู (12 ม้วน)', code: 'LOTUS-TIS', unit: 'แพ็ค', price: 135, cat: 'ผลิตภัณฑ์ทำความสะอาด' },
        // สัตว์เลี้ยง
        { name: 'อาหารสุนัข (15 กก.)', code: 'LOTUS-DGF', unit: 'ถุง', price: 680, cat: 'สัตว์เลี้ยง' },
        { name: 'อาหารแมว (1.8 กก.)', code: 'LOTUS-CTF', unit: 'ถุง', price: 350, cat: 'สัตว์เลี้ยง' },
      ]
    },
    {
      name: 'ท็อปส์ มาร์เก็ต',
      code: 'TOPS',
      email: 'admin@tops.co.th',
      tel: '02-655-9000',
      address: 'CentralFestival Bangkok (เซ็นทรัลพลาซา ลาดพร้าว)',
      branches: [
        { name: 'ท็อปส์ สยาม พารากอน', code: 'TOPS-SYP', address: 'ชั้น G สยามพารากอน ถนนพระรามที่ 1 กรุงเทพฯ' },
        { name: 'ท็อปส์ เซ็นทรัล เวิลด์', code: 'TOPS-CTW', address: 'ชั้น G เซ็นทรัลเวิลด์ ราชประสงค์ กรุงเทพฯ' },
        { name: 'ท็อปส์ เอ็มควอเทียร์', code: 'TOPS-EMQ', address: 'ชั้น LG เอ็มควอเทียร์ ถนนสุขุมวิท 49 กรุงเทพฯ' },
        { name: 'ท็อปส์ ไอคอนสยาม', code: 'TOPS-ICS', address: 'ชั้น LG ไอคอนสยาม เจริญนคร กรุงเทพฯ' },
        { name: 'ท็อปส์ เซ็นทรัล เชียงใหม่', code: 'TOPS-CNX', address: 'เซ็นทรัล เชียงใหม่ แอร์พอร์ต เชียงใหม่' },
      ],
      warehouses: [
        { name: 'คลังสินค้าท็อปส์ กรุงเทพ', code: 'TOPS-WH-BKK', address: 'ลาดกระบัง กรุงเทพฯ' },
      ],
      categories: [
        'อาหารออร์แกนิค', 'ไวน์และเครื่องดื่มแอลกอฮอล์', 'ชีสและเนย', 'อาหารนำเข้า',
        'อาหารญี่ปุ่น', 'ผลิตภัณฑ์สุขภาพ', 'ซีฟู้ดพรีเมี่ยม', 'เนื้อวาก้ยู', 'ของฝาก', 'อาหารเจ'
      ],
      materials: [
        // อาหารออร์แกนิค
        { name: 'เห็ดออร์แกนิค (มิกซ์)', code: 'TOPS-OMU', unit: 'กล่อง', price: 120, cat: 'อาหารออร์แกนิค' },
        { name: 'ผักสลัดออร์แกนิค', code: 'TOPS-OLS', unit: 'ถุง', price: 95, cat: 'อาหารออร์แกนิค' },
        // ชีสและเนย
        { name: 'เนยสด President', code: 'TOPS-BUT', unit: 'กล่อง', price: 185, cat: 'ชีสและเนย' },
        { name: 'ชีสMozzarella', code: 'TOPS-MOZ', unit: 'ก้อน', price: 220, cat: 'ชีสและเนย' },
        { name: 'ชีส Cheddar (สไลซ์)', code: 'TOPS-CHD', unit: 'แพ็ค', price: 195, cat: 'ชีสและเนย' },
        // อาหารนำเข้า
        { name: 'มะกะโรนี Barilla', code: 'TOPS-PST', unit: 'กล่อง', price: 95, cat: 'อาหารนำเข้า' },
        { name: 'ซอสพาสต้า (Tomato)', code: 'TOPS-SPC', unit: 'ขวด', price: 145, cat: 'อาหารนำเข้า' },
        // อาหารญี่ปุ่น
        { name: 'ปลาแซลมอนสด (แล่)', code: 'TOPS-SLM', unit: 'KG', price: 850, cat: 'อาหารญี่ปุ่น' },
        { name: 'ปูอัด (Crab Stick)', code: 'TOPS-CRS', unit: 'แพ็ค', price: 75, cat: 'อาหารญี่ปุ่น' },
        // ซีฟู้ดพรีเมี่ยม
        { name: 'ล็อบสเตอร์มีชีวิต', code: 'TOPS-LBS', unit: 'ตัว', price: 1800, cat: 'ซีฟู้ดพรีเมี่ยม' },
        { name: 'หอยเชลล์แช่แข็ง', code: 'TOPS-SCA', unit: 'KG', price: 550, cat: 'ซีฟู้ดพรีเมี่ยม' },
        // เนื้อวาก้ยู
        { name: 'เนื้อวาก้ยู (ออสเตรเลีย)', code: 'TOPS-WAG', unit: 'KG', price: 2800, cat: 'เนื้อวาก้ยู' },
        // สุขภาพ
        { name: 'โปรตีนเวย์ (Chocolate)', code: 'TOPS-WHE', unit: 'กระปุก', price: 1500, cat: 'ผลิตภัณฑ์สุขภาพ' },
        { name: 'วิตามิน C (1000mg)', code: 'TOPS-VTC', unit: 'กล่อง', price: 350, cat: 'ผลิตภัณฑ์สุขภาพ' },
        // อาหารเจ
        { name: 'เต้าหู้แข็ง', code: 'TOPS-TFU', unit: 'แพ็ค', price: 30, cat: 'อาหารเจ' },
        { name: 'เห็ดหอมแห้ง', code: 'TOPS-DMS', unit: 'ถุง', price: 85, cat: 'อาหารเจ' },
      ]
    },
  ];

  for (const co of companiesData) {
    const company = await prisma.company.upsert({
      where: { CompanyCode: co.code },
      update: {},
      create: {
        CompanyName: co.name,
        CompanyCode: co.code,
        CompanyEmail: co.email,
        CompanyTelNumber: co.tel,
        CompanyAddress: co.address,
        CompanyStatus: 'ACTIVE',
      }
    });

    // Branches
    const branchList = [];
    for (const br of co.branches) {
      const branch = await prisma.branch.upsert({
        where: { BranchCode: br.code },
        update: {},
        create: {
          BranchName: br.name,
          BranchCode: br.code,
          CompanyId: company.CompanyId,
          BranchAddress: br.address,
        }
      });
      branchList.push(branch);
    }

    // Warehouses
    for (const wh of co.warehouses) {
      await prisma.warehouse.upsert({
        where: { WarehouseCode: wh.code },
        update: {},
        create: {
          WarehouseName: wh.name,
          WarehouseCode: wh.code,
          CompanyId: company.CompanyId,
          WarehouseAddress: wh.address,
        }
      });
    }

    // Company Admin User
    if (companyAdminRole && branchList.length > 0) {
      await prisma.user.upsert({
        where: { UserName: `${co.code.toLowerCase()}-admin` },
        update: { RoleId: companyAdminRole.RoleId },
        create: {
          UserName: `${co.code.toLowerCase()}-admin`,
          UserPassword: password,
          CompanyId: company.CompanyId,
          BranchId: branchList[0].BranchId,
          RoleId: companyAdminRole.RoleId,
          Email: co.email,
          UserStatusApprove: 'APPROVED',
          UserStatusActive: 'ACTIVE',
        }
      });
    }

    // Categories
    const categoryMap: Record<string, any> = {};
    for (const catName of co.categories) {
      const catCode = `${co.code}-${catName.replace(/\s+/g, '_').toUpperCase().substring(0, 20)}`;
      const category = await prisma.catagory.upsert({
        where: { CatagoryCode: catCode },
        update: {},
        create: {
          CatagoryName: catName,
          CatagoryCode: catCode,
          CompanyId: company.CompanyId,
        }
      });
      categoryMap[catName] = category;
    }

    // Materials
    for (const mat of co.materials) {
      const category = categoryMap[mat.cat];
      if (category) {
        await prisma.material.upsert({
          where: { MaterialCode: mat.code },
          update: {},
          create: {
            MaterialName: mat.name,
            MaterialCode: mat.code,
            Unit: mat.unit,
            Price: mat.price,
            CatagoryId: category.CatagoryId,
            CompanyId: company.CompanyId,
          }
        });
      }
    }

    // Suppliers
    const suppliersData = [
      { name: `บริษัท ผู้จัดหาสินค้า ${co.name} (ไทย) จำกัด`, code: `${co.code}-SUP1`, tel: '02-111-1001' },
      { name: `ห้างหุ้นส่วนจำกัด โลจิสติกส์ ${co.code}`, code: `${co.code}-SUP2`, tel: '02-222-2002' },
      { name: `บริษัท นำเข้าส่งออก ${co.code} จำกัด (มหาชน)`, code: `${co.code}-SUP3`, tel: '02-333-3003' },
    ];

    for (const sup of suppliersData) {
      await prisma.supplier.upsert({
        where: { SupplierCode: sup.code },
        update: {},
        create: {
          SupplierName: sup.name,
          SupplierCode: sup.code,
          CompanyId: company.CompanyId,
          SupplierTelNumber: sup.tel,
        }
      });
    }

    console.log(`✅ Seeded ${co.name} with ${co.branches.length} branches, ${co.warehouses.length} warehouses, ${co.categories.length} categories, ${co.materials.length} materials`);
  }

  console.log('');
  console.log('🔑 Admin Accounts:');
  console.log('   Platform Admin : platform-admin / admin123');
  console.log('   บิ๊กซี Admin   : bigc-admin / admin123');
  console.log('   โลตัส Admin    : lotus-admin / admin123');
  console.log('   ท็อปส์ Admin   : tops-admin / admin123');
  console.log('');
  console.log('🏁 Seed completed successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());