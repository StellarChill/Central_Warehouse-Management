# 🔧 แก้ไข Environment Variables ให้ถูกต้อง

## ❌ สิ่งที่ต้องแก้ไขตอนนี้

### 1. Backend Service - แก้ไข `FRONTEND_URL`

**ตอนนี้:**
```
FRONTEND_URL=http://localhost:5173
```

**ต้องเปลี่ยนเป็น:** URL จริงของ Frontend Service ของคุณ

**วิธีหา Frontend URL:**
1. ไปที่ Frontend Service dashboard (`Central_Warehouse-Management`)
2. ดูที่ URL ของ service (มักจะอยู่ด้านบน)
3. ตัวอย่าง: `https://central-warehouse-management.onrender.com`

**แก้ไข:**
1. ไปที่ Backend Service → Environment Variables
2. คลิกที่ `FRONTEND_URL`
3. เปลี่ยนเป็น: `https://your-frontend-url.onrender.com` (ใช้ URL จริงของคุณ)
4. Save

---

### 2. Backend Service - แก้ไข `JWT_SECRET`

**ตอนนี้:**
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**ต้องเปลี่ยนเป็น:** Secret key ที่ปลอดภัย (random string)

**วิธีสร้าง JWT_SECRET:**

**วิธีที่ 1: ใช้ Online Generator**
- ไปที่: https://generate-secret.vercel.app/32
- คัดลอก secret key ที่ได้

**วิธีที่ 2: ใช้ Terminal (Windows PowerShell)**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**วิธีที่ 3: ใช้ OpenSSL (ถ้ามีติดตั้ง)**
```bash
openssl rand -hex 32
```

**แก้ไข:**
1. ไปที่ Backend Service → Environment Variables
2. คลิกที่ `JWT_SECRET`
3. เปลี่ยนเป็น secret key ที่สร้างใหม่
4. Save

---

### 3. Frontend Service - ตั้งค่า `VITE_API_URL`

**ต้องเพิ่ม Environment Variable:**

**Key:** `VITE_API_URL`
**Value:** `https://your-backend-url.onrender.com/api`

**วิธีหา Backend URL:**
1. ไปที่ Backend Service dashboard (`Central_Warehouse-Management-backend`)
2. ดูที่ URL ของ service
3. ตัวอย่าง: `https://central-warehouse-management-backend.onrender.com`

**ตั้งค่า:**
1. ไปที่ Frontend Service → Environment Variables
2. คลิก "Add Environment Variable"
3. **Key:** `VITE_API_URL`
4. **Value:** `https://your-backend-url.onrender.com/api` (ใช้ URL จริงของคุณ + `/api`)
5. Save

**⚠️ สำคัญ:** หลังตั้งค่าแล้ว ต้อง **Rebuild** Frontend Service!

---

## ✅ สรุป Checklist

### Backend Service:
- [x] `DATABASE_URL` - ถูกต้องแล้ว ✅
- [ ] `FRONTEND_URL` - **ต้องแก้ไข** จาก `localhost:5173` เป็น URL จริง
- [ ] `JWT_SECRET` - **ต้องแก้ไข** จาก placeholder เป็น secret key ที่ปลอดภัย
- [x] `PORT` - ถูกต้องแล้ว ✅

### Frontend Service:
- [ ] `VITE_API_URL` - **ต้องเพิ่ม** ให้ชี้ไปที่ backend URL + `/api`

---

## 📋 หลังแก้ไขแล้ว ต้องทำอะไรต่อ?

1. **Restart Backend Service** (ถ้า platform ไม่ restart อัตโนมัติ)
2. **Rebuild Frontend Service** (สำคัญ! เพื่อให้ compile `VITE_API_URL`)
3. **รัน Database Migrations** (ครั้งแรก):
   ```bash
   npx prisma migrate deploy
   ```
4. **ทดสอบ:**
   - เปิด `https://your-backend-url/health` → ควรเห็น `"database": "connected"`
   - เปิด Frontend → ลอง login → ควรใช้งานได้

---

ดูรายละเอียดเพิ่มเติมใน `POST_DEPLOYMENT_CHECKLIST.md`

