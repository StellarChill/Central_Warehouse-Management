# 🗄️ วิธีรัน Database Migrations ใน Production

## ❌ ปัญหาที่เจอ

```
The table `public.User` does not exist in the current database.
```

**สาเหตุ:** ตารางในฐานข้อมูลยังไม่ได้สร้าง ต้องรัน migrations

---

## ✅ วิธีแก้ไข - รัน Migrations

### วิธีที่ 1: ใช้ Render Shell (แนะนำ)

1. **เข้าไปที่ Backend Service dashboard** (`Central_Warehouse-Management-backend`)

2. **คลิกที่ "Shell" หรือ "Console"** 
   - มักจะอยู่ด้านบนหรือในเมนู Settings

3. **รันคำสั่งนี้:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

4. **รอให้เสร็จ** - จะเห็นผลลัพธ์ประมาณนี้:
   ```
   Applying migration `20251008023000_init`
   Applying migration `20251008035915_`
   ...
   All migrations have been successfully applied.
   ```

5. **Restart Backend Service** (ถ้าไม่ได้ restart อัตโนมัติ)

---

### วิธีที่ 2: เพิ่มใน Build Command (สำหรับ auto-deploy)

1. **เข้าไปที่ Backend Service → Settings**

2. **หา "Build Command"** 

3. **เปลี่ยนจาก:**
   ```bash
   npm install
   ```
   
   **เป็น:**
   ```bash
   cd backend && npm install && npx prisma generate && npx prisma migrate deploy
   ```

4. **Save และ Deploy ใหม่**

---

### วิธีที่ 3: รันจาก Local (ถ้าเชื่อมต่อ database ได้)

ถ้า `DATABASE_URL` ใช้ external URL ที่เข้าถึงได้:

```bash
cd backend

# ตั้งค่า DATABASE_URL (ใช้ production database URL)
export DATABASE_URL="postgresql://sai_jaimange_user:password@host:port/sai_jaimange"

# รัน migrations
npx prisma migrate deploy
```

---

## 🔍 ตรวจสอบว่า Migrations สำเร็จ

### 1. ดู Logs ของ Backend

หลังรัน migrations และ restart backend แล้ว ดู logs:
- ✅ ไม่ควรเห็น error `table does not exist` อีก
- ✅ ควรเห็น health check สำเร็จ

### 2. ทดสอบ Health Check

เปิด:
```
https://your-backend-url.onrender.com/health
```

ควรเห็น:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

### 3. ทดสอบ API

ลอง login หรือเรียก API:
```
POST https://your-backend-url.onrender.com/api/login
```

ควรทำงานได้แล้ว ไม่มี error `table does not exist`

---

## 📋 Checklist

- [ ] รัน `npx prisma migrate deploy` ใน Backend Service
- [ ] ตรวจสอบว่า migrations สำเร็จ (ไม่เห็น error)
- [ ] Restart Backend Service (ถ้าจำเป็น)
- [ ] ทดสอบ health check endpoint
- [ ] ทดสอบ login API

---

## 🐛 Troubleshooting

### ถ้า Migration ล้มเหลว

**Error: Migration `xxx` failed to apply**

**แก้ไข:**
1. ตรวจสอบว่า database connection ถูกต้อง
2. ตรวจสอบ logs สำหรับ error ที่เจาะจงกว่า
3. ลองรัน `npx prisma migrate status` เพื่อดูสถานะ migrations

### ถ้ายังเห็น "table does not exist"

**แก้ไข:**
1. ตรวจสอบว่า migrations รันเสร็จแล้วจริงๆ
2. ตรวจสอบว่า `DATABASE_URL` ถูกต้อง
3. ลอง restart backend service อีกครั้ง
4. ตรวจสอบ logs ของ backend ว่ามี error อื่นหรือไม่

---

## ✅ หลัง Migrations สำเร็จ

เมื่อ migrations รันเสร็จแล้ว:
- ✅ ตารางทั้งหมดจะถูกสร้างใน database
- ✅ Backend สามารถ query ข้อมูลได้
- ✅ API endpoints ทำงานได้ปกติ
- ✅ Frontend สามารถ login และดึงข้อมูลได้

---

**คำแนะนำ:** หลังจากรัน migrations แล้ว ลองทดสอบ login หรือดูข้อมูลใน frontend เพื่อยืนยันว่าทุกอย่างทำงานได้ปกติ

