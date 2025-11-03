# ✅ Deployment Checklist - ตรวจสอบการตั้งค่าทั้งหมด

## 📋 Checklist สำหรับ Deploy - ตรวจสอบทีละส่วน

---

## 🔧 1. Backend Service Settings

### Root Directory
- [ ] **ตั้งค่า:** `backend`
  - ❌ ผิด: `/` หรือว่าง
  - ✅ ถูก: `backend`

### Build Command
- [ ] **ตั้งค่า:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
  - ❌ ผิด: มี `backend/ $` หรือ `cd backend`
  - ❌ ผิด: ไม่มี `&& npm run build`
  - ✅ ถูก: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`

### Start Command
- [ ] **ตั้งค่า:** `npm start` หรือ `node dist/server.js`
  - ❌ ผิด: มี `backend/ $` หรือ `cd backend`
  - ✅ ถูก: `npm start`

---

## 🔑 2. Backend Environment Variables

### DATABASE_URL
- [ ] **ตั้งค่า:** Connection string จาก PostgreSQL service
  - ตัวอย่าง: `postgresql://sai_jaimange_user:password@host/sai_jaimange`
  - ✅ ถูกต้อง

### FRONTEND_URL
- [ ] **ตั้งค่า:** URL ของ **Frontend Service** (ไม่ใช่ Backend!)
  - ❌ ผิด: `https://xxx-backend.onrender.com` (มี `-backend`)
  - ✅ ถูก: `https://xxx.onrender.com` (ไม่มี `-backend`)
  - ✅ ถูก: `https://central-warehouse-management.onrender.com`

### JWT_SECRET
- [ ] **ตั้งค่า:** Secret key ที่ปลอดภัย
  - ❌ ผิด: `your-super-secret-jwt-key-change-this-in-production` (placeholder)
  - ✅ ถูก: Random string ยาวๆ เช่น `dfa2906ee2204fbdf8162f2f0ea981dbaba3dc9b571f287bc436c25779c5c817`

### PORT
- [ ] **ตั้งค่า:** `3000` (หรือใช้ default)
  - ✅ ถูกต้อง

---

## 🌐 3. Frontend Service Settings

### Root Directory
- [ ] **ตั้งค่า:** `frontend`
  - ✅ ถูก: `frontend`

### Build Command
- [ ] **ตั้งค่า:** `npm install && npm run build`
  - ✅ ถูกต้อง

---

## 🔑 4. Frontend Environment Variables

### VITE_API_URL
- [ ] **ตั้งค่า:** URL ของ **Backend Service** + `/api`
  - ✅ ถูก: `https://xxx-backend.onrender.com/api` (มี `-backend` + `/api`)
  - ตัวอย่าง: `https://central-warehouse-management-backend.onrender.com/api`

---

## 📝 5. ไฟล์ Code (ไม่ต้องแก้ไข)

### vite.config.ts
- [x] **ไม่ต้องแก้ไข** ✅
  - `target: 'http://localhost:3000'` ถูกต้องแล้ว
  - ใช้แค่ development mode

### backend/src/server.ts
- [x] **ไม่ต้องแก้ไข** ✅
  - มี `/health` endpoint แล้ว
  - CORS settings ถูกต้อง

---

## ✅ 6. ตรวจสอบหลัง Deploy

### Backend Service
- [ ] **Status:** "Live" หรือ "Running"
- [ ] **Health Check:** `https://your-backend-url.onrender.com/health`
  - ควรเห็น: `{"status":"ok","database":"connected"}`
- [ ] **Root Endpoint:** `https://your-backend-url.onrender.com/`
  - ควรเห็น: `{"message":"Sai Jai Management API",...}`

### Frontend Service
- [ ] **Status:** "Live" หรือ "Running"
- [ ] **เปิดเว็บไซต์:** ไม่มี error
- [ ] **Browser Console (F12):** ไม่มี error
- [ ] **Network Tab:** เห็น API calls ไปที่ backend

---

## 🎯 สรุป - อะไรต้องแก้?

### ✅ ถูกต้องแล้ว (ไม่ต้องแก้):
- [x] `vite.config.ts` - ไม่ต้องแก้ไข
- [x] `backend/src/server.ts` - ไม่ต้องแก้ไข

### 🔧 ต้องตรวจสอบ/แก้ไข:
- [ ] Backend: Root Directory = `backend`
- [ ] Backend: Build Command ถูกต้อง (ไม่มี `backend/ $`)
- [ ] Backend: Start Command ถูกต้อง (ไม่มี `backend/ $`)
- [ ] Backend: `FRONTEND_URL` = URL ของ Frontend (ไม่มี `-backend`)
- [ ] Backend: `JWT_SECRET` = Secret key ที่ปลอดภัย
- [ ] Frontend: `VITE_API_URL` = Backend URL + `/api` (มี `-backend` + `/api`)
- [ ] Frontend: Rebuild หลังตั้งค่า `VITE_API_URL`

---

## 🐛 ปัญหาที่เจอบ่อย

### ❌ Backend Build ล้มเหลว
**สาเหตุ:** Build Command มี `backend/ $` หรือ Root Directory ผิด
**แก้ไข:** ตั้ง Root Directory = `backend` และลบ `backend/ $` ออกจาก commands

### ❌ Backend Start ล้มเหลว - "Missing script: start"
**สาเหตุ:** Root Directory ผิด หรือ Start Command มี `backend/ $`
**แก้ไข:** ตั้ง Root Directory = `backend` และใช้ Start Command = `npm start`

### ❌ Frontend เรียก API แล้วได้ CORS Error
**สาเหตุ:** `FRONTEND_URL` ใน backend ผิด (อาจเป็น Backend URL แทน Frontend URL)
**แก้ไข:** ตั้ง `FRONTEND_URL` = URL ของ Frontend Service (ไม่มี `-backend`)

### ❌ Frontend เรียก API แล้วได้ 404
**สาเหตุ:** `VITE_API_URL` ผิด หรือไม่ได้ rebuild frontend
**แก้ไข:** ตั้ง `VITE_API_URL` = Backend URL + `/api` และ rebuild frontend

### ❌ Backend Health Check แสดง "Not Found"
**สาเหตุ:** ใช้ URL placeholder (`your-backend-url`) แทน URL จริง
**แก้ไข:** ใช้ URL จริงจาก Render Dashboard

---

## 📋 Checklist สั้นๆ

### Backend:
- [ ] Root Directory = `backend`
- [ ] Build Command = `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- [ ] Start Command = `npm start`
- [ ] `DATABASE_URL` = PostgreSQL connection string
- [ ] `FRONTEND_URL` = Frontend service URL (ไม่มี `-backend`)
- [ ] `JWT_SECRET` = Secret key ที่ปลอดภัย

### Frontend:
- [ ] Root Directory = `frontend`
- [ ] `VITE_API_URL` = Backend service URL + `/api` (มี `-backend` + `/api`)
- [ ] Rebuild หลังตั้งค่า `VITE_API_URL`

### ไฟล์ Code:
- [x] `vite.config.ts` - ไม่ต้องแก้ไข ✅
- [x] `backend/src/server.ts` - ไม่ต้องแก้ไข ✅

---

## ✅ ถ้าทุกอย่างถูกต้องแล้ว

1. **Backend Health Check:** `https://your-backend-url/health` → `{"status":"ok","database":"connected"}`
2. **Frontend:** เปิดเว็บไซต์ → ไม่มี error → Login ได้ → ดึงข้อมูลได้
3. **Network Tab:** เห็น API calls สำเร็จ (status 200)

**แสดงว่าระบบทำงานได้แล้ว!** 🎉

---

**ตรวจสอบทีละส่วนตาม checklist นี้ แล้วแก้ไขส่วนที่ยังผิดอยู่!**

