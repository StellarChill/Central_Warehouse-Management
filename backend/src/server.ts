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
  origin: (origin, callback) => {
    // อนุญาต requests ที่ไม่มี origin (Postman, Mobile apps)
    if (!origin) return callback(null, true);
    
    // อนุญาต localhost ทุก port
    if (origin.includes('localhost')) return callback(null, true);
    
    // ตรวจสอบ allowed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    // Block origin อื่นๆ
    console.warn('🚫 CORS blocked:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Middleware ที่จำเป็น
app.use(express.json()); // เพื่ออ่าน JSON body
app.use(express.urlencoded({ extended: true })); // เผื่อใช้ form-data

// Health check endpoint (สำหรับ deployment platforms)
app.get('/health', async (req, res) => {
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
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Sai Jai Management API', 
    version: '1.0.0',
    endpoints: ['/api', '/health']
  });
});

import userRoute from './routes/userRoute';
import catagoryRoute from './routes/catagoryRoute';
import branchRoute from './routes/branchRoute';
import materialRoute from './routes/materialRoute';

app.use('/api', userRoute);
app.use('/api/catagory', catagoryRoute);
app.use('/api/branch', branchRoute);
app.use('/api/material', materialRoute);

// เริ่มรันเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Allowed CORS origins:`, allowedOrigins);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Not configured'}`);
});
