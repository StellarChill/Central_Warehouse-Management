# ⚙️ Render Settings - Copy & Paste

## 🔷 Backend Service (Web Service)

### Basic Settings
```
Name: sai-jai-backend
Runtime: Node
Region: Singapore
Branch: main
Root Directory: (leave blank)
```

### Build & Start Commands

**Build Command**:
```bash
cd backend && npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

**Start Command**:
```bash
cd backend && npm start
```

### Environment Variables

```bash
DATABASE_URL=<your-internal-database-url>
JWT_SECRET=mySecretKey123456789!@#
FRONTEND_URL=https://sai-jai-frontend.onrender.com
PORT=3000
NODE_ENV=production
```

### Health Check Path
```
/health
```

---

## 🔷 Frontend Service (Static Site)

### Basic Settings
```
Name: sai-jai-frontend
Branch: main
Root Directory: (leave blank)
```

### Build Command
```bash
cd frontend && npm install && npm run build
```

### Publish Directory
```
frontend/dist
```

### Environment Variables

```bash
VITE_API_URL=https://sai-jai-backend.onrender.com/api
```

### Redirects/Rewrites Rule

```
Source: /*
Destination: /index.html
Action: Rewrite
```

---

## 🔷 PostgreSQL Database

### Basic Settings
```
Name: sai-jai-db
Database Name: sai_jai_db
User: sai_jai_user
Region: Singapore
PostgreSQL Version: 16
Plan: Free
```

### Connection String

จะได้ URL รูปแบบนี้:
```
Internal: postgresql://sai_jai_user:xxxxx@dpg-xxxxx-a/sai_jai_db
External: postgresql://sai_jai_user:xxxxx@dpg-xxxxx-a.singapore-postgres.render.com/sai_jai_db
```

**ใช้ Internal URL** สำหรับ Backend (ในส่วน DATABASE_URL)

---

## 🚀 หลัง Deploy เสร็จ

### 1. Run Migrations (Backend Shell)
```bash
cd backend
npm run migrate:deploy
```

### 2. Seed ข้อมูล (Backend Shell)
```bash
cd backend
npm run seed
```

### 3. ทดสอบ
```
Backend: https://your-backend.onrender.com/health
Frontend: https://your-frontend.onrender.com
```

### 4. Login ครั้งแรก
```
Username: admin
Password: admin123
```

---

## ⚠️ หมายเหตุสำคัญ

1. **DATABASE_URL** ต้องใช้ **Internal URL** (ไม่ใช่ External)
2. **FRONTEND_URL** ต้องตรงกับ Frontend URL จริงๆ (ไม่มี `/` ท้าย)
3. **VITE_API_URL** ต้องลงท้ายด้วย `/api` (มี `/` ท้าย)
4. **Free plan** backend จะ sleep หลังไม่ใช้งาน 15 นาที (ครั้งแรกจะช้า)
5. **Database** Free plan จะถูกลบหลัง 90 วัน (ควร backup)

---

## 🔧 Commands สำหรับ Render Shell

```bash
# ดู environment
cd backend && node -e "console.log(process.env.DATABASE_URL ? 'DB configured ✓' : 'DB not configured ✗')"

# ทดสอบ Prisma connection
cd backend && npx prisma db execute --sql "SELECT 1"

# ดู migrations ที่ run แล้ว
cd backend && npx prisma migrate status

# Force sync schema (ระวัง: จะลบข้อมูล!)
cd backend && npx prisma db push --force-reset

# Re-seed
cd backend && npm run seed
```

