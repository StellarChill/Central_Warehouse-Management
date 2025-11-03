# 🔧 แก้ไข FRONTEND_URL ให้ถูกต้อง

## ❌ ปัญหา

`FRONTEND_URL` ตั้งค่าเป็น URL ของ Backend Service แทน Frontend Service

**ตอนนี้:**
```
FRONTEND_URL = https://central-warehouse-management-backend.onrender.com
```

**ปัญหาที่เจอ:**
- นี่เป็น URL ของ Backend Service เอง (มี `-backend`)
- `FRONTEND_URL` ต้องเป็น URL ของ Frontend Service (ไม่มี `-backend`)

---

## ✅ วิธีแก้ไข

### ขั้นตอน:

1. **ไปที่ Frontend Service**
   - ใน Render Dashboard
   - หา service ชื่อ `Central_Warehouse-Management` (ไม่ใช่ `-backend`)

2. **คัดลอก URL ของ Frontend Service**
   - มักจะอยู่ด้านบนของหน้า service
   - ตัวอย่าง: `https://central-warehouse-management.onrender.com`
   - **สังเกต:** ไม่มี `-backend` ในชื่อ

3. **กลับมาที่ Backend Service**
   - ไปที่ `Central_Warehouse-Management-backend`

4. **แก้ไข `FRONTEND_URL`**
   - Settings → Environment Variables
   - คลิกไอคอนแก้ไข (ดินสอ) ที่ `FRONTEND_URL`
   - เปลี่ยนเป็น URL ของ Frontend Service ที่คัดลอกมา

5. **Save**
   - คลิก "Save, rebuild, and deploy" หรือ "Save"
   - Backend อาจ rebuild อัตโนมัติ

---

## 📋 ตัวอย่าง

### ❌ ผิด:
```
FRONTEND_URL = https://central-warehouse-management-backend.onrender.com
```
(นี่คือ Backend URL - มี `-backend`)

### ✅ ถูก:
```
FRONTEND_URL = https://central-warehouse-management.onrender.com
```
(นี่คือ Frontend URL - ไม่มี `-backend`)

---

## ⚠️ ทำไมต้องแก้ไข?

`FRONTEND_URL` ใช้สำหรับ:
- **CORS settings** - อนุญาตให้ Frontend Service เรียก Backend API ได้
- ถ้าตั้งผิด Frontend จะเรียก API ไม่ได้ (CORS error)

---

## ✅ Checklist

- [ ] หา Frontend Service ใน Render Dashboard
- [ ] คัดลอก URL ของ Frontend Service (ไม่มี `-backend`)
- [ ] ไปที่ Backend Service → Environment Variables
- [ ] แก้ไข `FRONTEND_URL` เป็น URL ของ Frontend Service
- [ ] Save และรอ rebuild (ถ้าจำเป็น)

---

**แก้ไขเสร็จแล้ว Backend จะอนุญาตให้ Frontend เรียก API ได้แล้ว!** ✅

