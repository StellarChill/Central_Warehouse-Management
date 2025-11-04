# 🔧 แก้ปัญหา Login - HTTP 404 Error

## ❌ ปัญหา

เมื่อพยายาม login แล้วเห็น error:
```
Login failed (HTTP 404)
POST https://central-warehouse-management-backend.onrender.com/login → 404
```

**สาเหตุ:** Frontend เรียก `/login` โดยตรง แต่ Backend route คือ `/api/login`

---

## ✅ วิธีแก้ไข

### ตรวจสอบและแก้ไข `VITE_API_URL`

ปัญหามักเกิดจาก:

1. **ไม่ได้ตั้งค่า `VITE_API_URL`** → Frontend ใช้ `/api` (fallback) แต่ไม่ถูกต้อง
2. **ตั้งค่า `VITE_API_URL` ผิด** → ไม่มี `/api` ตอนท้าย
3. **ไม่ได้ Rebuild Frontend** → Environment variable ไม่ถูก compile

---

### วิธีแก้ไข:

#### 1. ตรวจสอบ `VITE_API_URL` ใน Frontend Service

**ไปที่ Frontend Service** → **Environment Variables**

**ต้องตั้งค่า:**
```
VITE_API_URL = https://central-warehouse-management-backend.onrender.com/api
```

**ตรวจสอบ:**
- ✅ ต้องมี `/api` ตอนท้าย
- ✅ ต้องเป็น Backend URL (มี `-backend`)
- ❌ ผิดถ้าไม่มี `/api` ตอนท้าย

---

#### 2. Rebuild Frontend Service

**สำคัญมาก!** หลังตั้งค่า `VITE_API_URL` แล้ว:

1. **Manual Deploy** Frontend Service
2. หรือรอ Auto Deploy เมื่อ push code ใหม่

**ตรวจสอบ:**
- ดู Logs ว่า rebuild สำเร็จหรือไม่
- ตรวจสอบว่าใช้ environment variable ใหม่

---

## 🔍 วิธีตรวจสอบ

### 1. ตรวจสอบ Network Request

เปิด Browser → F12 → Network Tab → ลอง login อีกครั้ง

**ควรเห็น:**
```
POST https://central-warehouse-management-backend.onrender.com/api/login
```

**ถ้าเห็น:**
```
POST https://central-warehouse-management-backend.onrender.com/login  ❌
```
= `VITE_API_URL` ไม่มี `/api` หรือไม่ได้ตั้งค่า

---

### 2. ตรวจสอบ Backend Route

**Backend route ที่ถูกต้อง:**
- `POST /api/login` ✅
- `POST /api/register` ✅

**ไม่ได้มี:**
- `POST /login` ❌
- `POST /register` ❌

---

## 📋 Checklist

- [ ] ตรวจสอบ `VITE_API_URL` ใน Frontend Service
- [ ] ตรวจสอบว่า `VITE_API_URL` มี `/api` ตอนท้าย
- [ ] **Rebuild Frontend Service** (สำคัญ!)
- [ ] ทดสอบ Network request ว่าเรียก `/api/login` หรือไม่
- [ ] ทดสอบ login อีกครั้ง

---

## 🐛 Troubleshooting

### ถ้ายังเห็น 404 หลังตั้งค่าแล้ว

**ตรวจสอบ:**
1. Frontend rebuild สำเร็จหรือไม่ (ดู Logs)
2. `VITE_API_URL` ตั้งค่าถูกต้องหรือไม่ (มี `/api` ตอนท้าย)
3. Backend service รันอยู่หรือไม่ (ทดสอบ `/health` endpoint)
4. Backend route `/api/login` ทำงานหรือไม่

---

## ✅ ตัวอย่างการตั้งค่าที่ถูกต้อง

### Frontend Environment Variables:
```
VITE_API_URL = https://central-warehouse-management-backend.onrender.com/api
```

### Backend Routes:
- `/api/login` ✅
- `/api/register` ✅
- `/api/catagory` ✅
- `/api/branch` ✅
- `/api/material` ✅

---

**แก้ไข `VITE_API_URL` แล้ว rebuild frontend แล้วลอง login อีกครั้ง!**

