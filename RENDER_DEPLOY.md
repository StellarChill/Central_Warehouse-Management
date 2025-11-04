# 🚀 Deploy บน Render - คู่มือฉบับย่อ

## ⚡ Quick Fix: Permission Denied Error

ปัญหา: Render พยายาม build ที่ root แทนที่จะเข้า `/frontend`

**วิธีแก้**: แยก deploy เป็น 2 services

---

## 📝 ขั้นตอน Deploy (5 นาที)

### 1️⃣ สร้าง PostgreSQL Database ก่อน

1. ไปที่ [Render Dashboard](https://dashboard.render.com)
2. คลิก **New +** → **PostgreSQL**
3. ตั้งค่า:
   - Name: `sai-jai-db`
   - Region: **Singapore**
   - Plan: **Free**
4. คลิก **Create Database**
5. **คัดลอก Internal Database URL** (จะใช้ในขั้นตอนถัดไป)

---

### 2️⃣ Deploy Backend (Web Service)

1. คลิก **New +** → **Web Service**
2. Connect GitHub repo ของคุณ
3. ตั้งค่า:

```
Name: sai-jai-backend
Region: Singapore
Branch: main
Runtime: Node

Build Command:
cd backend && npm install && npx prisma generate && npx prisma migrate deploy

Start Command:
cd backend && npm start
```

4. เพิ่ม **Environment Variables**:

```bash
DATABASE_URL=<วาง Internal Database URL จากขั้นตอนที่ 1>
JWT_SECRET=mySecretKey123456789
FRONTEND_URL=https://sai-jai-frontend.onrender.com
PORT=3000
NODE_ENV=production
```

5. คลิก **Create Web Service**
6. รอ deploy เสร็จ (~5 นาที)
7. **คัดลอก URL** ของ Backend (เช่น `https://sai-jai-backend.onrender.com`)

---

### 3️⃣ Deploy Frontend (Static Site)

1. คลิก **New +** → **Static Site**
2. Connect GitHub repo เดียวกัน
3. ตั้งค่า:

```
Name: sai-jai-frontend
Branch: main

Build Command:
cd frontend && npm install && npm run build

Publish Directory:
frontend/dist
```

4. เพิ่ม **Environment Variables**:

```bash
VITE_API_URL=<วาง Backend URL>/api
```

ตัวอย่าง:
```bash
VITE_API_URL=https://sai-jai-backend.onrender.com/api
```

5. คลิก **Create Static Site**
6. หลัง deploy เสร็จ ไปที่ **Redirects/Rewrites**:
   - คลิก **Add Rule**
   - Source: `/*`
   - Destination: `/index.html`
   - Action: **Rewrite**
   - คลิก **Save**

7. รอ deploy เสร็จ (~3 นาที)

---

### 4️⃣ Seed ข้อมูลเริ่มต้น (Admin User)

1. ไปที่ Backend service → **Shell** tab
2. รันคำสั่ง:

```bash
cd backend
npm run seed
```

3. ตอนนี้มี Admin user แล้ว:
   - Username: `admin`
   - Password: `admin123`

---

## ✅ ทดสอบระบบ

1. เปิด Frontend URL (เช่น `https://sai-jai-frontend.onrender.com`)
2. Login ด้วย:
   - Username: `admin`
   - Password: `admin123`
3. ทดสอบ CRUD สาขา:
   - ไปที่ **ผู้ดูแลระบบ** → **สาขา**
   - เพิ่ม/แก้ไข/ลบสาขา

---

## 🐛 แก้ปัญหาที่พบบ่อย

### ❌ "Cannot GET /" บน Backend
**สาเหตุ**: Backend ไม่มี route `/`
**ไม่ต้องแก้**: ปกติครับ Backend เป็น API เท่านั้น ใช้ `/api/...`

### ❌ "CORS Error" ตอน login
**แก้ไข**:
1. ไปที่ Backend → Environment Variables
2. แก้ `FRONTEND_URL` ให้ตรงกับ Frontend URL จริง
3. Redeploy backend

### ❌ Frontend ขึ้น 404 เมื่อ refresh
**แก้ไข**: เพิ่ม Redirect rule `/* → /index.html` (ตามขั้นตอนที่ 3)

### ❌ "Prisma Client not found"
**แก้ไข**: เพิ่ม `npx prisma generate` ใน Build Command

---

## 🔄 Update Code ใหม่

เมื่อแก้โค้ดแล้ว push ขึ้น GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render จะ **auto-deploy** ให้เองทันที! 🎉

---

## 💡 Tips

1. **Free Plan จะ sleep** → ครั้งแรกใช้งานจะช้า 30 วินาที (ปกติ)
2. **Database backup**: Export ข้อมูลเป็นประจำ (Free plan ลบหลัง 90 วัน)
3. **Logs**: ดูที่ service → **Logs** tab

---

## 📞 ต้องการความช่วยเหลือ?

เช็คไฟล์ `DEPLOY_GUIDE.md` สำหรับคู่มือฉบับเต็ม

