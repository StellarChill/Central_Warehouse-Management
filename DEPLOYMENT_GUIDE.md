# 📦 คู่มือการ Deploy - ให้เว็บดึงข้อมูลจาก Database

คู่มือนี้จะช่วยให้คุณเข้าใจว่าต้องตั้งค่าอะไรบ้างเพื่อให้เว็บไซต์สามารถดึงข้อมูลจากฐานข้อมูลได้หลังจากการ deploy

## 🎯 สิ่งที่ต้องตั้งค่า

เมื่อ deploy บน platform (เช่น Render, Vercel, Railway) คุณต้องตั้งค่า **Environment Variables** สำหรับ 2 services:

1. **Backend Service** (`Central_Warehouse-Management-backend`)
2. **Frontend Service** (`Central_Warehouse-Management`)

---

## 🔧 1. ตั้งค่า Backend Service

ใน Backend Service (`Central_Warehouse-Management-backend`) ต้องตั้งค่า Environment Variables ต่อไปนี้:

### Environment Variables ที่ต้องตั้ง:

```env
# Database Connection (เชื่อมต่อกับ PostgreSQL service)
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
# ตัวอย่าง:
# DATABASE_URL="postgresql://postgres:yourpassword@sai-jaimange.internal:5432/postgres?schema=public"

# JWT Secret (สำหรับ authentication)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Port (มักจะกำหนดโดย platform เอง)
PORT=3000

# Frontend URL (สำหรับ CORS - ต้องใช้ URL จริงของ frontend service)
FRONTEND_URL="https://central-warehouse-management.onrender.com"
# หรือ URL จริงของ frontend service ของคุณ
```

### ⚠️ วิธีหา DATABASE_URL

จาก PostgreSQL service (`sai-jaimange`) ที่คุณ deploy ไว้:

1. เข้าไปที่ **Settings** หรือ **Configuration** ของ PostgreSQL service
2. ดู **Connection String** หรือ **Database URL**
3. มักจะมีรูปแบบ: `postgresql://username:password@host:port/database`

**สำคัญ:** 
- ถ้าใช้ **Internal Network** (เช่น `sai-jaimange.internal`) จะเร็วกว่าและปลอดภัยกว่า
- ถ้าใช้ **External URL** (เช่น `sai-jaimange.render.com`) ต้องเปิดพอร์ตให้เข้าถึงได้

---

## 🌐 2. ตั้งค่า Frontend Service

ใน Frontend Service (`Central_Warehouse-Management`) ต้องตั้งค่า Environment Variable:

### Environment Variable ที่ต้องตั้ง:

```env
# Backend API URL (ชี้ไปที่ backend service)
VITE_API_URL="https://central-warehouse-management-backend.onrender.com/api"
# หรือ URL จริงของ backend service ของคุณ
```

### ⚠️ สิ่งสำคัญ:

- ต้องขึ้นต้นด้วย `VITE_` เพราะ Vite จะ compile ค่านี้เข้าไปใน build
- ต้องใส่ `/api` ต่อท้าย URL (ถ้า backend route ใช้ `/api`)
- หลังจากตั้งค่าแล้ว ต้อง **Rebuild** frontend service ใหม่

---

## 📋 ขั้นตอนการตั้งค่าทีละขั้น

### Step 1: ตั้งค่า DATABASE_URL ใน Backend

1. ไปที่ Backend Service dashboard (`Central_Warehouse-Management-backend`)
2. คลิก **Environment** หรือ **Config Vars**
3. เพิ่ม variable:
   - Key: `DATABASE_URL`
   - Value: Connection string จาก PostgreSQL service

### Step 2: ตั้งค่าอื่นๆ ใน Backend

เพิ่ม environment variables อื่นๆ:
- `JWT_SECRET` - สร้าง random string ยาวๆ (เช่น `openssl rand -hex 32`)
- `PORT` - มักจะกำหนดโดย platform (มักเป็น 3000 หรือใช้ `process.env.PORT`)
- `FRONTEND_URL` - URL จริงของ frontend service

### Step 3: ตั้งค่า VITE_API_URL ใน Frontend

1. ไปที่ Frontend Service dashboard (`Central_Warehouse-Management`)
2. คลิก **Environment** หรือ **Config Vars**
3. เพิ่ม variable:
   - Key: `VITE_API_URL`
   - Value: URL ของ backend service + `/api` (เช่น `https://your-backend-url.onrender.com/api`)

### Step 4: Rebuild Services

1. **Backend**: รัน Prisma migrations (ถ้ายังไม่ทำ)
   ```bash
   # ใน backend service
   npx prisma migrate deploy
   ```
2. **Frontend**: Rebuild frontend service (เพื่อ compile `VITE_API_URL` เข้าไป)

---

## 🧪 ทดสอบการเชื่อมต่อ

### 1. ทดสอบ Backend เชื่อมต่อ Database

ดู logs ของ backend service:
- ✅ ถ้าสำเร็จจะเห็น: `✅ Server running on http://localhost:3000`
- ❌ ถ้ามี error จะเห็น: `Error: Can't reach database server` หรือ `PrismaClientInitializationError`

### 2. ทดสอบ Frontend เชื่อมต่อ Backend

1. เปิดเว็บไซต์ frontend
2. เปิด Browser Developer Tools (F12)
3. ไปที่ tab **Network**
4. ลอง login หรือดูข้อมูล
5. ตรวจสอบว่ามี request ไปที่ backend API หรือไม่
6. ถ้ามี error:
   - `CORS error` = Backend ต้องเพิ่ม frontend URL ใน CORS settings
   - `404 Not Found` = `VITE_API_URL` ตั้งค่าผิด หรือ backend route ผิด
   - `Connection refused` = Backend service ไม่ได้เปิดอยู่ หรือ URL ผิด

---

## 🔍 ตรวจสอบ Checklist

ก่อน deploy ให้ตรวจสอบว่า:

### Backend:
- [ ] `DATABASE_URL` ตั้งค่าแล้วและถูกต้อง
- [ ] `JWT_SECRET` ตั้งค่าแล้ว
- [ ] `FRONTEND_URL` ตั้งค่าเป็น URL ของ frontend service
- [ ] Prisma migrations รันแล้ว (`npx prisma migrate deploy`)
- [ ] Backend service รันอยู่และเชื่อมต่อ database ได้

### Frontend:
- [ ] `VITE_API_URL` ตั้งค่าแล้วและถูกต้อง (ต้องมี `/api` ตอนท้าย)
- [ ] Frontend service rebuild แล้ว (เพื่อ compile environment variable)
- [ ] Frontend URL ถูกเพิ่มใน CORS ของ backend แล้ว

---

## 🐛 Troubleshooting

### ❌ ปัญหา: Backend เชื่อมต่อ Database ไม่ได้

**สาเหตุ:**
- `DATABASE_URL` ผิด
- Database service ยังไม่ได้เปิด
- Network/Firewall block connection

**แก้ไข:**
1. ตรวจสอบ `DATABASE_URL` ว่า format ถูกต้อง
2. ตรวจสอบว่า PostgreSQL service (`sai-jaimange`) รันอยู่
3. ลองใช้ internal network URL แทน external URL

---

### ❌ ปัญหา: Frontend เรียก Backend ไม่ได้ (CORS Error)

**สาเหตุ:**
- Frontend URL ไม่ได้ถูกเพิ่มใน CORS ของ backend

**แก้ไข:**
1. ตรวจสอบว่า `FRONTEND_URL` ใน backend ตั้งค่าถูกต้อง
2. ตรวจสอบ `backend/src/server.ts` ว่า frontend URL อยู่ใน `allowedOrigins`
3. Rebuild backend service

---

### ❌ ปัญหา: Frontend เรียก API แล้วได้ 404

**สาเหตุ:**
- `VITE_API_URL` ตั้งค่าผิด
- Backend route ไม่ตรง

**แก้ไข:**
1. ตรวจสอบ `VITE_API_URL` ว่าชี้ไปที่ backend service ที่ถูกต้อง
2. ตรวจสอบว่า URL มี `/api` ตอนท้ายหรือไม่
3. Rebuild frontend service ใหม่ (สำคัญ!)

---

### ❌ ปัญหา: Environment Variable ไม่ทำงาน

**สาเหตุ (Frontend):**
- ไม่ได้ rebuild frontend หลังตั้งค่า `VITE_API_URL`
- ชื่อ variable ผิด (ต้องขึ้นต้นด้วย `VITE_`)

**แก้ไข:**
1. ตรวจสอบชื่อ variable ว่าเป็น `VITE_API_URL` (ไม่ใช่ `API_URL`)
2. Rebuild frontend service ใหม่
3. Clear browser cache

---

## 📝 ตัวอย่างการตั้งค่าบน Render.com

### Backend Service:
```env
DATABASE_URL=postgresql://user:pass@sai-jaimange.internal:5432/dbname
JWT_SECRET=your-secret-key-here
PORT=3000
FRONTEND_URL=https://central-warehouse-management.onrender.com
```

### Frontend Service:
```env
VITE_API_URL=https://central-warehouse-management-backend.onrender.com/api
```

---

## ✅ สรุป

**สิ่งที่ต้องทำ:**
1. ✅ ตั้งค่า `DATABASE_URL` ใน backend → เชื่อมต่อ database
2. ✅ ตั้งค่า `FRONTEND_URL` ใน backend → อนุญาต CORS
3. ✅ ตั้งค่า `VITE_API_URL` ใน frontend → เชื่อมต่อ backend
4. ✅ Rebuild ทั้ง backend และ frontend

**Flow การทำงาน:**
```
Frontend → (VITE_API_URL) → Backend → (DATABASE_URL) → PostgreSQL Database
```

ถ้าทุกอย่างตั้งค่าถูกต้อง เว็บไซต์จะสามารถดึงข้อมูลจาก database ได้แล้ว! 🎉

---

**คำถามเพิ่มเติม?** ตรวจสอบ logs ของ services เพื่อดู error messages ที่เจาะจงกว่า

