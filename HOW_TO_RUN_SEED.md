# 🌱 วิธีรัน Database Seed

## ❌ คำสั่งผิด

```bash
npx run seed  # ❌ ผิด! ไม่มีคำสั่ง "run" ใน npx
```

---

## ✅ คำสั่งที่ถูกต้อง

### วิธีที่ 1: ใช้ npm run (แนะนำ)

```bash
cd backend
npm run seed
```

**หมายเหตุ:** ต้อง build ก่อนเพื่อให้มีไฟล์ `dist/prisma/seed.js`

**ถ้ายังไม่ได้ build:**
```bash
cd backend
npm run build
npm run seed
```

---

### วิธีที่ 2: ใช้ Prisma seed โดยตรง

```bash
cd backend
npx prisma db seed
```

**วิธีนี้จะใช้ seed script จาก `package.json` → `prisma.seed`**

---

### วิธีที่ 3: รัน seed file โดยตรง (ถ้า build แล้ว)

```bash
cd backend
node dist/prisma/seed.js
```

---

## 📋 ขั้นตอนที่แนะนำ

### 1. Build ก่อน (ถ้ายังไม่ได้ build)

```bash
cd backend
npm run build
```

### 2. รัน Seed

```bash
npm run seed
```

หรือ

```bash
npx prisma db seed
```

---

## 🔍 ตรวจสอบว่า Seed สำเร็จ

**ควรเห็น:**
```
✅ Seeded successfully!
```

หรือ

```
Role created: ADMIN
Role created: CENTER
Role created: BRANCH
Branch created: สาขากลาง
User created: admin
```

---

## 🐛 Troubleshooting

### ถ้าเห็น "Cannot find module 'dist/prisma/seed.js'"

**สาเหตุ:** ยังไม่ได้ build

**แก้ไข:**
```bash
cd backend
npm run build
npm run seed
```

---

### ถ้าเห็น "Cannot find module" อื่นๆ

**ตรวจสอบ:**
1. อยู่ในโฟลเดอร์ `backend` หรือยัง
2. รัน `npm install` แล้วหรือยัง
3. ไฟล์ `prisma/seed.ts` มีอยู่หรือไม่

---

## ✅ สรุป

**คำสั่งที่ถูกต้อง:**
```bash
cd backend
npm run build    # Build ก่อน (ถ้ายังไม่ได้ build)
npm run seed     # รัน seed
```

หรือ

```bash
cd backend
npx prisma db seed
```

---

**ใช้ `npm run seed` แทน `npx run seed`!** ✅



