import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware - อนุญาตให้ frontend เรียก API ได้
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Middleware ที่จำเป็น
app.use(express.json()); // เพื่ออ่าน JSON body
app.use(express.urlencoded({ extended: true })); // เผื่อใช้ form-data

import userRoute from './routes/userRoute';
import catagoryRoute from './routes/catagoryRoute';
import branchRoute from './routes/branchRoute';
import materialRoute from './routes/materialRoute';

// Health check endpoint สำหรับ Render
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sai Jai Management API is running',
    timestamp: new Date().toISOString() 
  });
});

// Health check พร้อมทดสอบ database connection
app.get('/health', async (req, res) => {
  try {
    // ทดสอบเชื่อมต่อ database
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    });
  }
});

app.use('/api', userRoute);
app.use('/api/catagory', catagoryRoute);
app.use('/api/branch', branchRoute);
app.use('/api/material', materialRoute);

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
