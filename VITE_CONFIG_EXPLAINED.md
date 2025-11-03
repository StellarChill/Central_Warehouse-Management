# 📝 อธิบาย vite.config.ts - ต้องแก้ไขหรือไม่?

## ✅ ไม่ต้องแก้ไข!

ไฟล์ `vite.config.ts` **ถูกต้องแล้ว** ไม่ต้องแก้ไข

---

## 🔍 อธิบาย

### ส่วนที่เห็นใน `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      ...
    }
  }
}
```

**สิ่งนี้ใช้สำหรับอะไร?**
- ✅ **Development mode เท่านั้น** (เมื่อรัน `npm run dev` ในเครื่อง)
- ✅ เมื่อรัน local จะ proxy `/api` ไปที่ `localhost:3000` อัตโนมัติ

**สำหรับ Production:**
- ✅ **ไม่ใช้ proxy นี้** 
- ✅ ใช้ `VITE_API_URL` environment variable แทน

---

## 🔍 ดูว่า Frontend ใช้ API URL อย่างไร

ใน `frontend/src/lib/api.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "/api";
```

**อธิบาย:**
- ถ้ามี `VITE_API_URL` → ใช้ค่าจาก environment variable (Production)
- ถ้าไม่มี → ใช้ `/api` (Development - จะใช้ proxy)

---

## 📋 สรุป

| Mode | ใช้อะไร |
|------|--------|
| **Development** (local) | Proxy ใน `vite.config.ts` → `localhost:3000` |
| **Production** (Render) | `VITE_API_URL` environment variable |

---

## ✅ สิ่งที่ต้องทำต่อไป

### 1. ตั้งค่า `VITE_API_URL` ใน Frontend Service

**วิธีทำ:**
1. ไปที่ **Frontend Service** (`Central_Warehouse-Management`) ใน Render Dashboard
2. Settings → **Environment Variables**
3. คลิก **"+ Add"**
4. **Key:** `VITE_API_URL`
5. **Value:** `https://your-backend-url.onrender.com/api`
   - ใช้ URL ของ Backend Service + `/api`
   - ตัวอย่าง: `https://central-warehouse-management-backend.onrender.com/api`
6. **Save**

---

### 2. Rebuild Frontend Service

**สำคัญมาก!**
- หลังตั้งค่า `VITE_API_URL` แล้ว **ต้อง Rebuild Frontend Service**
- เพราะ Vite ต้อง compile environment variable เข้าไปใน build

**วิธีทำ:**
1. ใน Frontend Service → คลิก **"Manual Deploy"** หรือ **"Deploy latest commit"**
2. หรือปล่อยให้ Auto Deploy เมื่อ push code ใหม่

---

## ✅ Checklist สั้นๆ

- [x] แก้ไข `FRONTEND_URL` ใน Backend Service ✅ (เสร็จแล้ว)
- [ ] ตั้งค่า `VITE_API_URL` ใน Frontend Service
- [ ] Rebuild Frontend Service
- [ ] ทดสอบ login ใน frontend

---

## 🎯 สรุป

**ไม่ต้องแก้ไข `vite.config.ts`** ✅

**ทำต่อไป:**
1. ตั้งค่า `VITE_API_URL` ใน Frontend Service
2. Rebuild Frontend Service
3. ทดสอบระบบ

---

**เริ่มตั้งค่า `VITE_API_URL` ใน Frontend Service ต่อเลย!** 🚀

