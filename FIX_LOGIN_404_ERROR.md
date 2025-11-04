# 🔧 แก้ปัญหา Login 404 Error

## ❌ ปัญหาที่เจอ

```
central-warehouse-management-backend.onrender.com/login:1  
Failed to load resource: the server responded with a status of 404
```

**สาเหตุ:** Frontend เรียก `/login` โดยตรงไปที่ backend แทนที่จะเรียก `/api/login`

---

## ✅ วิธีแก้ไข

### ปัญหาหลัก: `VITE_API_URL` ไม่ได้ตั้งค่าหรือ Frontend ยังไม่ได้ rebuild

---

## 🔧 ขั้นตอนแก้ไข

### 1. ตรวจสอบ VITE_API_URL ใน Frontend Service

**ไปที่ Render Dashboard:**
1. เข้า **Frontend Service** (`Central_Warehouse-Management`)
2. คลิก **Environment** หรือ **Config Vars**
3. **ตรวจสอบว่ามี `VITE_API_URL` หรือไม่**

**ถ้ายังไม่มี:**
- คลิก **"Add Environment Variable"**
- **Key:** `VITE_API_URL`
- **Value:** `https://central-warehouse-management-backend.onrender.com/api`
  - ใช้ URL ของ Backend Service + `/api`
- **Save**

---

### 2. Rebuild Frontend Service (สำคัญมาก!)

**หลังตั้งค่า `VITE_API_URL` แล้ว:**

1. **Manual Deploy** Frontend Service
   - คลิก **"Manual Deploy"** หรือ **"Deploy latest commit"**
   - หรือรอ Auto Deploy เมื่อ push code ใหม่

2. **รอให้ rebuild เสร็จ**
   - ดู Logs ว่าสำเร็จหรือไม่

---

### 3. Clear Browser Cache

**หลัง rebuild เสร็จแล้ว:**
- กด `Ctrl + Shift + Delete` (Windows) หรือ `Cmd + Shift + Delete` (Mac)
- เลือก "Cached images and files"
- Clear cache
- Reload หน้าเว็บ (`Ctrl + F5`)

---

## 🔍 วิธีตรวจสอบว่าถูกต้อง

### ตรวจสอบ Network Tab:

1. **เปิด Browser → F12 → Network Tab**
2. **ลอง login อีกครั้ง**
3. **ดู request:**

**ควรเห็น:**
```
POST https://central-warehouse-management-backend.onrender.com/api/login
Status: 200 (หรือ 401 ถ้า credentials ผิด)
```

**ถ้ายังเห็น:**
```
POST https://central-warehouse-management-backend.onrender.com/login
Status: 404
```
= Frontend ยังไม่ได้ rebuild หรือ `VITE_API_URL` ไม่ถูกต้อง

---

## 📋 Checklist

- [ ] ตั้งค่า `VITE_API_URL` ใน Frontend Service = `https://central-warehouse-management-backend.onrender.com/api`
- [ ] **Manual Deploy หรือ Rebuild Frontend Service**
- [ ] Clear Browser Cache
- [ ] Reload หน้าเว็บ
- [ ] ทดสอบ login อีกครั้ง
- [ ] ตรวจสอบ Network Tab ว่าเรียก `/api/login` หรือไม่

---

## ⚠️ สำคัญ

**`VITE_API_URL` ต้อง:**
- ✅ มี `/api` ตอนท้าย
- ✅ เป็น Backend URL (มี `-backend`)
- ✅ ต้อง rebuild frontend หลังตั้งค่า (สำคัญมาก!)

---

## 🐛 ถ้ายังไม่ได้

**ตรวจสอบ:**
1. Frontend rebuild สำเร็จหรือไม่ (ดู Logs)
2. `VITE_API_URL` ตั้งค่าถูกต้องหรือไม่ (มี `/api` ตอนท้าย)
3. Clear browser cache แล้วหรือยัง
4. ใช้ Incognito mode ทดสอบ (เพื่อ bypass cache)

---

**ตั้งค่า `VITE_API_URL` แล้ว rebuild frontend แล้วลอง login อีกครั้ง!**

