# 🔧 แก้ปัญหา Frontend Build Failed - "vite: Permission denied"

## ❌ ปัญหา

### 1. VITE_API_URL ไม่มี `/api` ตอนท้าย

**ตอนนี้:**
```
VITE_API_URL = https://central-warehouse-management-backend.onrender.com
```

**ต้องเป็น:**
```
VITE_API_URL = https://central-warehouse-management-backend.onrender.com/api
```
(ต้องมี `/api` ตอนท้าย)

---

### 2. Build Failed: `vite: Permission denied`

**Error:**
```
sh: 1: vite: Permission denied
==> Build failed 😞
```

**สาเหตุ:** Root Directory หรือ Build Command ไม่ถูกต้อง

---

## ✅ วิธีแก้ไข

### 1. แก้ไข VITE_API_URL

**ไปที่ Frontend Service** → **Environment Variables**:

1. **แก้ไข `VITE_API_URL`:**
   - คลิกไอคอนแก้ไข (ดินสอ) ที่ `VITE_API_URL`
   - **เปลี่ยนจาก:**
     ```
     https://central-warehouse-management-backend.onrender.com
     ```
   - **เป็น:**
     ```
     https://central-warehouse-management-backend.onrender.com/api
     ```
   - **Save**

---

### 2. แก้ไข Frontend Build Settings

#### ตรวจสอบ Root Directory

**ไปที่ Frontend Service** → **Settings**:

**Root Directory ควรเป็น:**
```
frontend
```

**ถ้ายังไม่ได้ตั้งค่า:**
- ตั้ง Root Directory = `frontend`

---

#### ตรวจสอบ Build Command

**ไปที่ Frontend Service** → **Settings** → **Build Command**:

**ควรเป็น:**
```bash
npm install && npm run build
```

**ถ้ามีปัญหาลองใช้:**
```bash
cd frontend && npm install && npm run build
```

---

#### วิธีแก้ Permission Error

**ถ้ายังมี `vite: Permission denied` ลอง:**

**Option 1: ใช้ npx**
```bash
npm install && npx vite build
```

**Option 2: ใช้ full path**
```bash
cd frontend && npm install && ./node_modules/.bin/vite build
```

**Option 3: ตรวจสอบ node_modules permissions**
```bash
cd frontend && npm install && chmod +x node_modules/.bin/vite && npm run build
```

---

## 📋 Checklist

### Environment Variable:
- [ ] `VITE_API_URL` = `https://central-warehouse-management-backend.onrender.com/api` (มี `/api` ตอนท้าย)

### Frontend Settings:
- [ ] Root Directory = `frontend`
- [ ] Build Command = `npm install && npm run build` (หรือใช้ npx ถ้าจำเป็น)
- [ ] Save และ Deploy ใหม่

---

## 🔧 Build Command ที่แนะนำ

### ถ้า Root Directory = `frontend`:
```bash
npm install && npm run build
```

### ถ้า Root Directory = `/` (root ของ repo):
```bash
cd frontend && npm install && npm run build
```

### ถ้ามี Permission Error:
```bash
npm install && npx vite build
```

---

## ✅ หลังแก้ไขแล้ว

1. **Save** การตั้งค่า
2. **Manual Deploy** Frontend Service
3. **ตรวจสอบ Logs** ว่า build สำเร็จหรือไม่
4. **ทดสอบ login** อีกครั้ง

---

## 🐛 Troubleshooting

### ถ้ายังมี Permission Error

**ลอง:**
1. ตรวจสอบ Root Directory = `frontend`
2. ใช้ `npx vite build` แทน `vite build`
3. หรือใช้ full path: `./node_modules/.bin/vite build`

### ถ้า Build สำเร็จแต่ Login ยังไม่ได้

**ตรวจสอบ:**
1. `VITE_API_URL` มี `/api` ตอนท้ายแล้วหรือยัง
2. Clear browser cache
3. ตรวจสอบ Network Tab ว่าเรียก `/api/login` หรือไม่

---

**แก้ไข `VITE_API_URL` ให้มี `/api` แล้วแก้ Build Command แล้ว Deploy ใหม่!**

