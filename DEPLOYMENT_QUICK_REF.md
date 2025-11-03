# ⚡ Quick Reference - การตั้งค่า Deploy

## 🔑 Environment Variables ที่ต้องตั้ง

### Backend Service (`Central_Warehouse-Management-backend`)

```env
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
JWT_SECRET="your-secret-key-here"
PORT=3000
FRONTEND_URL="https://your-frontend-url.onrender.com"
```

**วิธีหา DATABASE_URL:**
- เข้าไปที่ PostgreSQL service (`sai-jaimange`) → Settings → ดู Connection String
- หรือใช้ internal network URL: `postgresql://user:pass@sai-jaimange.internal:5432/dbname`

---

### Frontend Service (`Central_Warehouse-Management`)

```env
VITE_API_URL="https://your-backend-url.onrender.com/api"
```

**สำคัญ:** ต้องมี `/api` ตอนท้าย และต้อง rebuild frontend หลังตั้งค่า

---

## ✅ Checklist

- [ ] Backend: ตั้งค่า `DATABASE_URL` จาก PostgreSQL service
- [ ] Backend: ตั้งค่า `FRONTEND_URL` เป็น URL ของ frontend
- [ ] Backend: รัน `npx prisma migrate deploy` (ครั้งแรก)
- [ ] Frontend: ตั้งค่า `VITE_API_URL` เป็น URL ของ backend + `/api`
- [ ] Frontend: Rebuild service เพื่อ compile `VITE_API_URL`

---

## 🔍 ทดสอบ

1. เปิดเว็บไซต์ frontend
2. เปิด Browser Console (F12)
3. ลอง login หรือดูข้อมูล
4. ตรวจสอบ Network tab ว่า API calls สำเร็จหรือไม่

---

ดูรายละเอียดเต็มใน `DEPLOYMENT_GUIDE.md`

