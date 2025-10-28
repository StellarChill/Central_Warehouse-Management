# คู่มือการตั้งค่าและใช้งานระบบ Inventory Management System

## 🎯 ระบบ Authentication ที่พัฒนาเสร็จแล้ว

ระบบนี้มีการจัดการสิทธิ์การเข้าถึง (Authentication & Authorization) ที่สมบูรณ์แล้ว รวมถึง:

- ✅ **ระบบสมัครสมาชิก (Register)** - สร้างบัญชีผู้ใช้ใหม่พร้อมข้อมูลครบถ้วน
- ✅ **ระบบเข้าสู่ระบบ (Login)** - ใช้ JWT Token authentication
- ✅ **Protected Routes** - ป้องกันการเข้าถึงหน้าที่ต้อง login ก่อน
- ✅ **Role-based Access Control** - จัดการสิทธิ์ตาม role (ADMIN, CENTER, BRANCH)
- ✅ **Logout** - ออกจากระบบและลบ token
- ✅ **Auto-redirect** - ถ้ายัง login ไม่ได้จะ redirect ไปหน้า login อัตโนมัติ

---

## 📋 ขั้นตอนการตั้งค่าระบบ

### 1. ติดตั้ง Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

---

### 2. ตั้งค่า Database

#### เริ่มต้น PostgreSQL ด้วย Docker
```bash
docker-compose up -d
```

ระบบจะเปิด:
- **PostgreSQL**: `localhost:5432`
  - Database: `demo`
  - User: `myuser`
  - Password: `mypassword`
- **pgAdmin**: `http://localhost:5050`
  - Email: `admin@dpu.ac.th`
  - Password: `admin`

---

### 3. สร้างไฟล์ `.env` สำหรับ Backend

สร้างไฟล์ `backend/.env` ด้วยเนื้อหาดังนี้:

```env
# Database URL (ใช้ตามที่กำหนดใน docker-compose.yml)
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/demo?schema=public"

# JWT Secret (เปลี่ยนเป็นค่าอื่นในการใช้งานจริง)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Port
PORT=3000

# Frontend URL (สำหรับ CORS)
FRONTEND_URL="http://localhost:5173"
```

---

### 4. Migrate Database Schema

```bash
cd backend
npx prisma migrate dev --name init
```

---

### 5. (Optional) เพิ่มข้อมูล Seed

ถ้าต้องการข้อมูลเริ่มต้น (Role, Branch) ให้รันคำสั่ง:

```bash
cd backend
npx prisma db seed
```

---

### 6. เริ่มต้นเซิร์ฟเวอร์

#### Backend
```bash
cd backend
npm run dev
# หรือ
npm start
```

ตอนนี้ API จะทำงานที่: `http://localhost:3000`

#### Frontend
```bash
cd frontend
npm run dev
```

ตอนนี้ Frontend จะทำงานที่: `http://localhost:8080`

---

## 🔐 การทดสอบระบบ Authentication

### 1. ทดสอบการสมัครสมาชิก

1. เปิดเบราว์เซอร์ไปที่: `http://localhost:8080`
2. คุณจะถูก redirect ไปที่หน้า **Login** โดยอัตโนมัติ (เพราะยัง login ไม่ได้)
3. คลิก **"สมัครสมาชิก"** 
4. กรอกข้อมูล:
   - ชื่อผู้ใช้: `admin1`
   - อีเมล: `admin@example.com`
   - เบอร์โทร: `0812345678`
   - รหัสผ่าน: `password123`
   - บทบาท: `ADMIN` (RoleId = 1)
   - สาขา: `สาขากลาง` (BranchId = 1)
5. คลิก **"สร้างบัญชีใหม่"**
6. จะถูก redirect ไปหน้า **Login**

### 2. ทดสอบการ Login

1. กรอกข้อมูล:
   - ชื่อผู้ใช้: `admin1`
   - รหัสผ่าน: `password123`
2. คลิก **"เข้าสู่ระบบ"**
3. ถ้าสำเร็จจะเข้าสู่หน้า **Dashboard** พร้อมเห็นชื่อผู้ใช้ที่มุมขวาบน

### 3. ทดสอบ Protected Routes

1. หลังจาก login แล้ว ลองเข้าหน้าต่างๆ เช่น:
   - `/` - Dashboard
   - `/suppliers` - หน้าผู้จำหน่าย
   - `/inventory` - หน้าคลังสินค้า
   - `/admin` - หน้า Admin (ต้องเป็น ADMIN เท่านั้น)
2. ทุกหน้าจะเข้าได้ปกติ

### 4. ทดสอบ Logout

1. คลิกที่ชื่อผู้ใช้มุมขวาบน
2. เลือก **"ออกจากระบบ"**
3. จะถูก redirect กลับไปหน้า **Login**
4. ถ้าพยายามเข้าหน้าอื่นจะถูก redirect กลับมาที่ Login ทันที

---

## 🔧 API Endpoints

### Authentication

#### POST `/api/register`
สมัครสมาชิกใหม่

**Request Body:**
```json
{
  "UserName": "admin1",
  "UserPassword": "password123",
  "RoleId": 1,
  "BranchId": 1,
  "Email": "admin@example.com",
  "TelNumber": "0812345678",
  "LineId": "" // optional
}
```

**Response (201):**
```json
{
  "user": {
    "UserId": 1,
    "UserName": "admin1",
    "RoleId": 1,
    "BranchId": 1,
    "Email": "admin@example.com",
    "TelNumber": "0812345678",
    "CreatedAt": "2025-10-28T..."
  }
}
```

---

#### POST `/api/login`
เข้าสู่ระบบ

**Request Body:**
```json
{
  "UserName": "admin1",
  "UserPassword": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "UserId": 1,
    "UserName": "admin1",
    "RoleId": 1,
    "BranchId": 1
  }
}
```

---

## 📊 Role IDs

ตาม Database Schema มี 3 บทบาทหลัก:

- **1** = ADMIN (ผู้ดูแลระบบ)
- **2** = CENTER (ศูนย์กลาง/คลังสินค้าหลัก)
- **3** = BRANCH (สาขา)

หน้าที่ใช้ได้ตาม Role:
- **ทุกหน้าทั่วไป**: ต้อง login เท่านั้น (ทุก role)
- **หน้า `/admin`**: ต้องเป็น ADMIN เท่านั้น
- **หน้า `/admin/users`**: ต้องเป็น ADMIN เท่านั้น
- **หน้า `/admin/reports`**: ต้องเป็น ADMIN เท่านั้น

---

## 🐛 Troubleshooting

### ปัญหา: Backend เชื่อมต่อ Database ไม่ได้

**แก้ไข:**
1. ตรวจสอบว่า PostgreSQL ทำงานอยู่:
   ```bash
   docker ps
   ```
2. ตรวจสอบ `DATABASE_URL` ใน `backend/.env`
3. ลองรัน migrate ใหม่:
   ```bash
   cd backend
   npx prisma migrate reset
   npx prisma migrate dev
   ```

---

### ปัญหา: CORS Error

**แก้ไข:**
1. ตรวจสอบว่า backend เปิดอยู่ที่ `localhost:3000`
2. ตรวจสอบว่า frontend proxy ตั้งค่าถูกต้องใน `vite.config.ts`
3. ตรวจสอบ CORS middleware ใน `backend/src/server.ts`

---

### ปัญหา: Login แล้วยังเข้าหน้าอื่นไม่ได้

**แก้ไข:**
1. เปิด Developer Tools (F12)
2. ตรวจสอบ Console มี error อะไรไหม
3. ตรวจสอบ Network tab ว่า API `/api/login` response อะไร
4. ตรวจสอบ Local Storage มี `auth_token` และ `auth_user` หรือไม่

---

### ปัญหา: Token หมดอายุ

**แก้ไข:**
Token มีอายุ 1 วัน (ตั้งค่าใน `backend/src/controllers/loginController.ts`)
- ถ้าหมดอายุให้ logout แล้ว login ใหม่
- หรือปรับค่า `expiresIn` ใน JWT config

---

## 📁 โครงสร้างไฟล์สำคัญ

### Frontend
```
frontend/src/
├── context/
│   └── AuthContext.tsx          # จัดการ state และ logic ของ authentication
├── pages/
│   ├── LoginPage.tsx            # หน้า login
│   ├── RegisterPage.tsx         # หน้าสมัครสมาชิก
│   └── ...
├── components/layout/
│   └── Header.tsx               # Header พร้อมปุ่ม logout
└── App.tsx                      # จัดการ routes และ ProtectedRoute
```

### Backend
```
backend/src/
├── controllers/
│   ├── loginController.ts       # Login logic พร้อม JWT
│   └── userController.ts        # Register logic
├── routes/
│   └── userRoute.ts             # Routes สำหรับ /api/login และ /api/register
└── server.ts                    # Express server พร้อม CORS
```

---

## 🎉 สรุป

ตอนนี้ระบบ Authentication & Authorization พร้อมใช้งานแล้ว! 

**คุณสมบัติที่พร้อม:**
- ✅ สมัครสมาชิก
- ✅ เข้าสู่ระบบด้วย JWT
- ✅ Protected routes (ต้อง login ก่อน)
- ✅ Role-based access control
- ✅ Logout
- ✅ Auto-redirect
- ✅ Token stored in localStorage
- ✅ CORS configured

**ขั้นตอนต่อไป:**
- เชื่อมต่อ API อื่นๆ เช่น สินค้า, คลัง, ผู้จำหน่าย
- เพิ่ม Authorization middleware ใน backend เพื่อป้องกัน API endpoints
- เพิ่มระบบ refresh token สำหรับ security ที่ดีขึ้น

---

**พัฒนาโดย:** Sai Jai Management System  
**วันที่:** 28 ตุลาคม 2025

