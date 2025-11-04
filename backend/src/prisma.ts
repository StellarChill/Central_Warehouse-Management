import { PrismaClient } from "../generated/prisma";

// สร้าง Prisma Client พร้อม config สำหรับ production
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' 
    ? ['error', 'warn'] 
    : ['query', 'info', 'warn', 'error'],
  errorFormat: 'minimal',
});

// Graceful shutdown - ปิด connection เมื่อปิด server
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
