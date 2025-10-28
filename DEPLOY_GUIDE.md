# 🚀 Deploy Guide - Render.com

## วิธีที่ 1: แยก Deploy (แนะนำ) ⭐

### 📦 1. Deploy Backend (Web Service)

1. ไปที่ [Render Dashboard](https://dashboard.render.com/)
2. คลิก **"New +"** → **"Web Service"**
3. เชื่อมต่อ GitHub repo ของคุณ
4. กรอกข้อมูล:
   ```
   Name: sai-jai-backend
   Region: Singapore
   Branch: main
   Runtime: Node
   Build Command: cd backend && npm install && npx prisma generate
   Start Command: cd backend && npm start
   ```
5. เพิ่ม **Environment Variables**:
   ```
   DATABASE_URL=postgresql://... (จาก Render PostgreSQL)
   JWT_SECRET=your-secret-key-here
   FRONTEND_URL=https://your-frontend-url.onrender.com
   PORT=3000
   NODE_ENV=production
   ```
6. คลิก **"Create Web Service"**

### 🎨 2. Deploy Frontend (Static Site)

1. คลิก **"New +"** → **"Static Site"**
2. เชื่อมต่อ GitHub repo เดียวกัน
3. กรอกข้อมูล:
   ```
   Name: sai-jai-frontend
   Branch: main
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
   ```
4. เพิ่ม **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
5. ไปที่ **Redirects/Rewrites** → เพิ่ม rule:
   ```
   Source: /*
   Destination: /index.html
   Action: Rewrite
   ```
6. คลิก **"Create Static Site"**

### 🗄️ 3. สร้าง PostgreSQL Database (ถ้ายังไม่มี)

1. คลิก **"New +"** → **"PostgreSQL"**
2. กรอก:
   ```
   Name: sai-jai-db
   Region: Singapore
   Plan: Free
   ```
3. คัดลอก **Internal Database URL**
4. นำไปใส่ใน Backend Environment Variables (`DATABASE_URL`)

---

## วิธีที่ 2: Deploy แบบ Monorepo (ซับซ้อนกว่า)

ใช้ root build command:
```bash
npm install && cd backend && npm install && cd ../frontend && npm install && npm run build
```

---

## 🔧 Fix Permission Denied Error

ถ้าเจอ `vite: Permission denied` ให้:

### 1. เพิ่ม script ใน `frontend/package.json`:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 2. ลบ `node_modules/.bin` cache:
ใน Render Dashboard → Settings → เลื่อนลงไปกด **"Clear Build Cache"**

### 3. ตรวจสอบ Build Command:
ต้องเป็น `cd frontend && npm install && npm run build` ไม่ใช่แค่ `npm run build`

---

## 📝 Checklist ก่อน Deploy

### Backend:
- [ ] มี `DATABASE_URL` ใน Environment Variables
- [ ] มี `JWT_SECRET` (ต้องเป็น string ที่ปลอดภัย)
- [ ] มี `FRONTEND_URL` (URL ของ frontend)
- [ ] Run migration: `npx prisma migrate deploy` (ใน Render Shell)
- [ ] Seed data: `npm run seed` (ถ้าต้องการ)

### Frontend:
- [ ] มี `VITE_API_URL` ชี้ไปที่ Backend URL
- [ ] ตั้ง Redirect rule `/* → /index.html`
- [ ] Build command ใช้ `cd frontend && ...`

### Database:
- [ ] สร้าง PostgreSQL instance
- [ ] เชื่อมต่อกับ Backend ผ่าน `DATABASE_URL`

---

## 🐛 Troubleshooting

### ❌ "vite: Permission denied"
**แก้**: ใช้ `cd frontend && npm run build` แทน `npm run build`

### ❌ "Cannot find module 'prisma'"
**แก้**: เพิ่ม `npx prisma generate` ใน Build Command

### ❌ "CORS Error"
**แก้**: ตรวจสอบ `FRONTEND_URL` ใน Backend ENV ต้องตรงกับ Frontend URL

### ❌ "404 when refresh"
**แก้**: เพิ่ม Redirect rule `/* → /index.html` ใน Static Site

---

## 🎯 URLs หลัง Deploy

- **Frontend**: `https://sai-jai-frontend.onrender.com`
- **Backend**: `https://sai-jai-backend.onrender.com`
- **Database**: `postgresql://...` (Internal URL)

---

## ⚠️ ข้อควรระวัง (Free Plan)

1. **Backend จะ sleep** หลังไม่มีการใช้งาน 15 นาที → ครั้งแรกจะช้า (รอ ~30 วินาที)
2. **Database จะถูกลบ** หลัง 90 วัน (Free plan)
3. **Build time** จำกัด 500 ชั่วโมง/เดือน

---

## 🚀 Quick Deploy Commands

```bash
# 1. Build Backend locally เพื่อทดสอบ
cd backend
npm install
npx prisma generate
npm run build

# 2. Build Frontend locally เพื่อทดสอบ
cd frontend
npm install
npm run build
npm run preview  # ทดสอบ production build

# 3. Test production mode locally
cd backend
DATABASE_URL="postgresql://..." npm start
```

---

**ต้องการความช่วยเหลือเพิ่มเติม?**
- [Render Node.js Docs](https://render.com/docs/deploy-node-express-app)
- [Render Static Sites Docs](https://render.com/docs/deploy-static-site)

