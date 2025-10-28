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

app.use('/api', userRoute);
app.use('/api/catagory', catagoryRoute);

// เริ่มรันเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
