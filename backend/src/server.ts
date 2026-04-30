import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware - อนุญาตให้ frontend เรียก API ได้
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://central-warehouse-management.onrender.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // อนุญาต requests ที่ไม่มี origin (เช่น Postman, Mobile apps)
    if (!origin) return callback(null, true);

    // อนุญาต Vercel domains ทั้งหมด (เพื่อแก้ปัญหา Deploy ยุ่งยาก)
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // อนุญาต Localhost และ Domains ที่ระบุไว้
    if (allowedOrigins.indexOf(origin) !== -1 || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    console.warn('🚫 CORS blocked:', origin);
    return callback(null, true); // พยายามอนุญาตไปก่อน ถ้ายังไม่ได้ผล (ชั่วคราว)
  },
  credentials: true,
}));

// Middleware ที่จำเป็น
app.use(express.json()); // เพื่ออ่าน JSON body
app.use(express.urlencoded({ extended: true })); // เผื่อใช้ form-data

// Health check endpoint (สำหรับ deployment platforms)
app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    // ทดสอบการเชื่อมต่อ database
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    message: 'Sai Jai Management API',
    version: '1.0.0',
    endpoints: ['/api', '/health']
  });
});

import userRoute from './routes/userRoute';
import adminUserRoute from './routes/adminUserRoute';
import catagoryRoute from './routes/catagoryRoute';
import branchRoute from './routes/branchRoute';
import materialRoute from './routes/materialRoute';
import supplierRoute from './routes/supplierRoute';
import purchaseOrderRoute from './routes/purchaseOrderRoute';
import receiptRoute from './routes/receiptRoute';
import stockRoute from './routes/stockRoute';
import withdrawnRequestRoute from './routes/withdrawnRequestRoute';
import issueRoute from './routes/issueRoute';
import warehouseRoute from './routes/warehouseRoute';
import companyRoute from './routes/companyRoute';
import platformUserRoute from './routes/platformUserRoute';
import roleRoute from './routes/roleRoute';
// import stockAdjustmentRoute from './routes/stockAdjustmentRoute';



app.use('/api', userRoute);
app.use('/api/admin', adminUserRoute);
app.use('/api/catagory', catagoryRoute);
app.use('/api/branch', branchRoute);
app.use('/api/material', materialRoute);
app.use('/api/supplier', supplierRoute);
app.use('/api/po', purchaseOrderRoute);
app.use('/api/receipt', receiptRoute);
app.use('/api/stock', stockRoute);
app.use('/api/request', withdrawnRequestRoute);
app.use('/api/issue', issueRoute);
app.use('/api/warehouse', warehouseRoute);
app.use('/api/company', companyRoute);
app.use('/api/platform', platformUserRoute);
app.use('/api/role', roleRoute);
// app.use('/api/stock-adjustments', stockAdjustmentRoute);

// เริ่มรันเซิร์ฟเวอร์
app.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // ทดสอบเชื่อมต่อ database ตอนเริ่ม server
  try {
    await prisma.$connect();
    console.log('🗄️  Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('💡 Please check your DATABASE_URL environment variable');
  }
});
