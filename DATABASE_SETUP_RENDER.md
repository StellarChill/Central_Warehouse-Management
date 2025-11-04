# 🗄️ เชื่อมต่อ Database บน Render - คู่มือทีละขั้นตอน

## ⚡ Quick Fix - ทำตามนี้เลย!

หากคุณ deploy backend ไปแล้วแต่เชื่อมฐานข้อมูลไม่ได้ ทำตามขั้นตอนนี้:

---

## 📋 ขั้นตอนที่ 1: สร้าง PostgreSQL Database

### 1. สร้าง Database ใหม่

1. ไปที่ [Render Dashboard](https://dashboard.render.com)
2. คลิก **"New +"** → **"PostgreSQL"**
3. กรอกข้อมูล:

```
Name: sai-jai-db
Database: sai_jai_db          (ชื่อ database)
User: sai_jai_user            (username)
Region: Singapore             (เลือกใกล้ที่สุด)
PostgreSQL Version: 16        (ใหม่สุด)
Plan: Free                    (หรือตามที่ต้องการ)
```

4. คลิก **"Create Database"**
5. รอสักครู่ (~1-2 นาที) จน status เป็น **"Available"**

### 2. คัดลอก Database URL

หลังสร้างเสร็จ จะเห็นหน้าแสดงข้อมูล Database:

```
Internal Database URL: postgresql://sai_jai_user:xxxxx@dpg-xxxxx-a/sai_jai_db
External Database URL: postgresql://sai_jai_user:xxxxx@dpg-xxxxx-a.singapore-postgres.render.com/sai_jai_db
```

**สำคัญ**: ใช้ **Internal Database URL** (เร็วกว่าและฟรี)

---

## 📋 ขั้นตอนที่ 2: เชื่อม Backend กับ Database

### 1. ไปที่ Backend Service

1. ไปที่ Dashboard → เลือก Backend Service ของคุณ (เช่น `sai-jai-backend`)
2. คลิกที่ **"Environment"** (เมนูซ้าย)

### 2. เพิ่ม DATABASE_URL

1. คลิก **"Add Environment Variable"**
2. กรอก:

```
Key: DATABASE_URL
Value: <วาง Internal Database URL ที่คัดลอกไว้>
```

ตัวอย่าง:
```
postgresql://sai_jai_user:xxxxx@dpg-xxxxx-a/sai_jai_db
```

3. คลิก **"Save Changes"**
4. Backend จะ **Auto Redeploy** ทันที (รอ 2-3 นาที)

---

## 📋 ขั้นตอนที่ 3: Run Database Migrations

หลัง Deploy เสร็จ ต้อง run migrations เพื่อสร้าง tables:

### วิธีที่ 1: ใช้ Render Shell (แนะนำ)

1. ไปที่ Backend Service → คลิก **"Shell"** (เมนูบน)
2. รันคำสั่ง:

```bash
cd backend
npm run migrate:deploy
```

3. ถ้าสำเร็จจะเห็น:

```
✅ The following migration(s) have been applied:
  20251008023000_init
  20251008035915_
✅ All migrations have been successfully applied.
```

### วิธีที่ 2: ใส่ใน Build Command (Auto)

1. ไปที่ Backend Service → **"Settings"**
2. หา **"Build Command"** แก้เป็น:

```bash
cd backend && npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

3. คลิก **"Save Changes"** → Redeploy

---

## 📋 ขั้นตอนที่ 4: Seed ข้อมูลเริ่มต้น

หลัง migrate เสร็จแล้ว ให้ seed ข้อมูล (Admin user, Roles, Branches):

### Run Seed

1. ที่ Backend Shell รันคำสั่ง:

```bash
cd backend
npm run seed
```

2. ถ้าสำเร็จจะเห็น:

```
🌱 Seeding database...
✅ Role Admin created/updated
✅ Role Center created/updated
✅ Role Branch created/updated
✅ Branch Center A created/updated
✅ Branch Branch B created/updated
✅ Branch Branch C created/updated
✅ Admin user created (username: admin)
🎉 Database seeded successfully!
```

---

## ✅ ทดสอบการเชื่อมต่อ

### 1. เช็ค Health Check

เปิด browser ไปที่:

```
https://your-backend-url.onrender.com/health
```

ถ้าสำเร็จจะเห็น:

```json
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "2025-10-29T..."
}
```

### 2. ทดสอบ Login

ใช้ Postman หรือ curl:

```bash
curl -X POST https://your-backend-url.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

ถ้าสำเร็จจะได้ token กลับมา:

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

## 🐛 แก้ปัญหาที่พบบ่อย

### ❌ Error: "P1001: Can't reach database server"

**สาเหตุ**: DATABASE_URL ไม่ถูกต้อง หรือ database ยังไม่เปิด

**แก้ไข**:
1. เช็คว่า DATABASE_URL ใช้ **Internal URL** ไม่ใช่ External
2. เช็คว่า Database status เป็น **"Available"**
3. Redeploy backend อีกครั้ง

### ❌ Error: "relation 'User' does not exist"

**สาเหตุ**: ยังไม่ได้ run migrations

**แก้ไข**:
```bash
cd backend
npm run migrate:deploy
```

### ❌ Error: "Cannot find module '@prisma/client'"

**สาเหตุ**: ยังไม่ได้ generate Prisma Client

**แก้ไข**:
```bash
cd backend
npx prisma generate
```

### ❌ Error: "Invalid `prisma` invocation"

**สาเหตุ**: Schema ไม่ตรงกับ database

**แก้ไข**:
```bash
cd backend
npx prisma db push  # Force sync schema
```

### ❌ Backend logs แสดง "Database connection failed"

**เช็คที่**:
1. Backend → Environment → มี `DATABASE_URL` หรือไม่?
2. Database → Status เป็น "Available" หรือไม่?
3. ลอง restart Backend Service

---

## 📊 ดูข้อมูลใน Database

### วิธีที่ 1: Prisma Studio (Local)

1. คัดลอก DATABASE_URL จาก Render
2. รันที่เครื่องตัวเอง:

```bash
cd backend
DATABASE_URL="<paste-url-here>" npm run studio
```

3. เปิด browser ที่ `http://localhost:5555`

### วิธีที่ 2: pgAdmin (บน Render)

Render มี built-in pgAdmin:

1. ไปที่ Database → คลิก **"Info"**
2. เลื่อนลงหา **"Connections"**
3. คลิก **"Open pgAdmin"**
4. Login ด้วย credentials ที่แสดง

---

## 🔐 Environment Variables ที่จำเป็น

ตรวจสอบว่า Backend มี ENV variables ครบ:

```bash
DATABASE_URL=postgresql://user:pass@host/db   # ✅ จำเป็น!
JWT_SECRET=your-secret-key                     # ✅ จำเป็น!
FRONTEND_URL=https://your-frontend.onrender.com
PORT=3000
NODE_ENV=production
```

---

## 🎯 Checklist สำเร็จ

- [ ] สร้าง PostgreSQL Database บน Render
- [ ] เพิ่ม DATABASE_URL ใน Backend Environment Variables
- [ ] Run migrations: `npm run migrate:deploy`
- [ ] Seed ข้อมูล: `npm run seed`
- [ ] ทดสอบ `/health` endpoint → status: "OK", database: "Connected"
- [ ] ทดสอบ login → ได้ token กลับมา
- [ ] Frontend สามารถเรียก Backend API ได้

---

## 🚀 คำสั่งที่ใช้บ่อย (Render Shell)

```bash
# เข้า backend directory
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations (สร้าง/อัพเดต tables)
npm run migrate:deploy

# Seed ข้อมูลเริ่มต้น
npm run seed

# ดูข้อมูลใน database (local only)
npm run studio

# Force sync schema กับ database
npm run db:push

# ดู database schema
npx prisma db pull
```

---

## 📞 ยังมีปัญหา?

1. เช็ค Backend Logs: Service → **"Logs"** tab
2. เช็ค Database Logs: Database → **"Logs"** tab
3. ลอง Redeploy: Service → **"Manual Deploy"** → **"Clear build cache & deploy"**

---

**เรียบร้อย! ตอนนี้ Backend เชื่อมกับ Database แล้ว** ✅

