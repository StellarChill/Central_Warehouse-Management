import express from 'express';
import dotenv from 'dotenv';
import prisma from './prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware ที่จำเป็น
app.use(express.json()); // เพื่ออ่าน JSON body
app.use(express.urlencoded({ extended: true })); // เผื่อใช้ form-data

import userRoute from './routes/userRoute';

app.use('/api', userRoute);

// เริ่มรันเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
