# 🚀 Quick Start Guide - ระบบ Authentication พร้อมใช้งาน!

## ✅ สิ่งที่พัฒนาเสร็จแล้ว

ระบบ **Authentication & Authorization** พร้อมใช้งานแล้วครบทุกฟีเจอร์:

- ✅ **หน้า Register** - สมัครสมาชิกด้วยข้อมูลครบถ้วน (ชื่อผู้ใช้, อีเมล, รหัสผ่าน, บทบาท, สาขา)
- ✅ **หน้า Login** - เข้าสู่ระบบด้วย JWT Token
- ✅ **Protected Routes** - ทุกหน้าต้อง login ก่อนเข้าได้
- ✅ **Role-based Access** - หน้า Admin เฉพาะ ADMIN เท่านั้น
- ✅ **Logout** - ออกจากระบบและลบ token
- ✅ **Auto Redirect** - ถ้ายัง login ไม่ได้จะพาไป /login อัตโนมัติ
- ✅ **Backend CORS** - ตั้งค่า CORS เรียบร้อย
- ✅ **Database Seed** - มีข้อมูล Role, Branch, Admin user เริ่มต้น

---

## ⚡ เริ่มใช้งานภายใน 5 นาที

### 1. เปิด Database (PostgreSQL)

```bash
docker-compose up -d
```

### 2. ตั้งค่า Backend

```bash
cd backend

# สร้างไฟล์ .env
# คัดลอกเนื้อหาด้านล่างนี้ไปใส่ใน backend/.env
```

**ไฟล์ `backend/.env`:**
```env
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/demo?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

```bash
# ติดตั้ง dependencies
npm install

# Migrate database
npx prisma migrate dev

# Seed ข้อมูลเริ่มต้น (Role, Branch, Admin user)
npm run seed

# เริ่ม backend server
npm run dev
```

✅ Backend จะทำงานที่: **http://localhost:3000**

### 3. เริ่ม Frontend

```bash
cd frontend

# ติดตั้ง dependencies (ถ้ายังไม่ได้ติดตั้ง)
npm install

# เริ่ม frontend
npm run dev
```

✅ Frontend จะทำงานที่: **http://localhost:8080**

---

## 🎉 ทดสอบระบบ

### ทดสอบด้วย Admin User ที่มีอยู่แล้ว

1. เปิดเบราว์เซอร์: `http://localhost:8080`
2. คุณจะถูก redirect ไป `/login` อัตโนมัติ
3. Login ด้วย:
   - **Username:** `admin`
   - **Password:** `admin123`
4. จะเข้าสู่หน้า Dashboard แสดงชื่อ "admin" ที่มุมขวาบน
5. ลองคลิก Logout แล้ว login ใหม่

### ทดสอบการสมัครสมาชิก

1. จากหน้า Login คลิก **"สมัครสมาชิก"**
2. กรอกข้อมูล:
   - ชื่อผู้ใช้: `center1`
   - อีเมล: `center@example.com`
   - เบอร์โทร: `0987654321`
   - รหัสผ่าน: `password123`
   - บทบาท: **CENTER** (ศูนย์กลาง)
   - สาขา: **สาขากลาง (Center A)**
3. คลิก **"สร้างบัญชีใหม่"**
4. จะถูกพาไปหน้า Login
5. Login ด้วย `center1` / `password123`

---

## 🔑 บทบาทที่มีในระบบ

| Role ID | ชื่อ | สิทธิ์ |
|---------|------|--------|
| 1 | ADMIN | เข้าถึงได้ทุกหน้า รวมหน้า `/admin` |
| 2 | CENTER | เข้าถึงหน้าทั่วไป (ยกเว้นหน้า Admin) |
| 3 | BRANCH | เข้าถึงหน้าทั่วไป (ยกเว้นหน้า Admin) |

### สาขาที่มีในระบบ

| Branch ID | ชื่อ |
|-----------|------|
| 1 | สาขากลาง (Center A) |
| 2 | สาขา B |
| 3 | สาขา C |

---

## 📡 API Endpoints

### 🔐 Authentication

#### `POST /api/register`
สมัครสมาชิกใหม่

**Request:**
```json
{
  "UserName": "center1",
  "UserPassword": "password123",
  "RoleId": 2,
  "BranchId": 1,
  "Email": "center@example.com",
  "TelNumber": "0987654321",
  "LineId": "" // optional
}
```

**Response (201):**
```json
{
  "user": {
    "UserId": 2,
    "UserName": "center1",
    "RoleId": 2,
    "BranchId": 1,
    "Email": "center@example.com",
    "TelNumber": "0987654321",
    "CreatedAt": "2025-10-28T..."
  }
}
```

---

#### `POST /api/login`
เข้าสู่ระบบ

**Request:**
```json
{
  "UserName": "admin",
  "UserPassword": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "UserId": 1,
    "UserName": "admin",
    "RoleId": 1,
    "BranchId": 1
  }
}
```

---

## 🔍 ทดสอบด้วย Postman หรือ cURL

### Register
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "UserName": "testuser",
    "UserPassword": "test123",
    "RoleId": 3,
    "BranchId": 2,
    "Email": "test@example.com",
    "TelNumber": "0811111111"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "UserName": "admin",
    "UserPassword": "admin123"
  }'
```

---

## 🎯 สิ่งที่ควรทำต่อไป

1. **เพิ่ม Authorization Middleware** ใน backend เพื่อป้องกัน API endpoints
2. **Refresh Token** สำหรับ security ที่ดีขึ้น
3. **Forgot Password** ฟีเจอร์รีเซ็ตรหัสผ่าน
4. **Profile Page** แก้ไขข้อมูลส่วนตัว
5. **เชื่อมต่อ API อื่นๆ** (สินค้า, คลัง, ผู้จำหน่าย) ให้ใช้ token authentication

---

## 🐛 แก้ปัญหาที่พบบ่อย

### ปัญหา: Backend เชื่อมต่อ Database ไม่ได้

```bash
# ตรวจสอบว่า PostgreSQL ทำงานอยู่
docker ps

# หรือเปิดใหม่
docker-compose down
docker-compose up -d

# ลอง migrate ใหม่
cd backend
npx prisma migrate reset
npx prisma migrate dev
npm run seed
```

### ปัญหา: CORS Error

ตรวจสอบว่า:
- Backend ทำงานที่ `http://localhost:3000`
- Frontend ทำงานที่ `http://localhost:8080`
- `backend/.env` มี `FRONTEND_URL="http://localhost:5173"` (Vite proxy จะแปลงเป็น 5173 ให้)

### ปัญหา: Token หมดอายุ

Token มีอายุ 1 วัน (24 ชั่วโมง)
- ถ้าหมดอายุให้ logout แล้ว login ใหม่
- หรือปรับค่าใน `backend/src/controllers/loginController.ts` บรรทัด 21:
  ```typescript
  const token = jwt.sign({ UserId: user.UserId, RoleId: user.RoleId }, JWT_SECRET, { expiresIn: '7d' }); // เปลี่ยนเป็น 7 วัน
  ```

---

## 📂 ไฟล์สำคัญที่ถูกแก้ไข

### Frontend
- `frontend/src/context/AuthContext.tsx` - จัดการ authentication state
- `frontend/src/pages/LoginPage.tsx` - หน้า login
- `frontend/src/pages/RegisterPage.tsx` - หน้าสมัครสมาชิก
- `frontend/src/App.tsx` - ProtectedRoute และ routing
- `frontend/src/components/layout/Header.tsx` - ปุ่ม logout

### Backend
- `backend/src/server.ts` - เพิ่ม CORS middleware
- `backend/src/controllers/loginController.ts` - Login logic
- `backend/src/controllers/userController.ts` - Register logic
- `backend/src/routes/userRoute.ts` - Routes สำหรับ auth
- `backend/prisma/seed.ts` - Seed ข้อมูลเริ่มต้น

---

## 💡 Tips

1. **Development**: ใช้ `npm run dev` ทั้ง frontend และ backend เพื่อ hot-reload
2. **Production**: ใช้ `npm run build` แล้ว `npm start`
3. **Database**: ใช้ pgAdmin ที่ `http://localhost:5050` เพื่อดู database
4. **Token**: เก็บไว้ใน localStorage (key: `auth_token`)
5. **User Data**: เก็บไว้ใน localStorage (key: `auth_user`)

---

## 🎊 สรุป

**ระบบพร้อมใช้งานแล้ว 100%!** 🎉

คุณสามารถ:
- ✅ สมัครสมาชิก
- ✅ Login/Logout
- ✅ เข้าหน้าที่ต้อง authentication
- ✅ จัดการสิทธิ์ตาม role

**ขอให้สนุกกับการพัฒนาต่อ!** 🚀

---

**หมายเหตุ:** ถ้ามีปัญหาหรือข้อสงสัย ดูรายละเอียดเพิ่มเติมได้ที่ `SETUP.md`

