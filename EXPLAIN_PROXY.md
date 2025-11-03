# 🔍 อธิบาย Proxy ใน vite.config.ts

## ❌ ไม่ต้องเปลี่ยน `target` เป็น Render URL!

`target: 'http://localhost:3000'` ใน `vite.config.ts` **ไม่ต้องเปลี่ยน** 

---

## 📋 อธิบายการทำงาน

### Development Mode (รันในเครื่อง - `npm run dev`)

เมื่อรัน `npm run dev` ในเครื่อง:

1. **Frontend รันที่:** `http://localhost:8080` (หรือ port อื่น)
2. **Backend รันที่:** `http://localhost:3000` (รันในเครื่องคุณ)
3. **Proxy ทำงาน:**
   - เมื่อ Frontend เรียก `/api/*`
   - Vite จะ proxy ไปที่ `target: 'http://localhost:3000'`
   - ทำให้เรียก Backend ในเครื่องได้โดยไม่ต้องตั้ง `VITE_API_URL`

**ตัวอย่าง:**
```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:3000',  // ✅ ใช้ localhost (ถูกต้อง!)
    changeOrigin: true,
  }
}
```

**เมื่อ Frontend เรียก:**
```typescript
fetch('/api/login')  // → จะไปที่ http://localhost:3000/api/login
```

---

### Production Mode (Deploy บน Render)

เมื่อ deploy บน Render:

1. **Frontend build เป็น static files:**
   - รัน `npm run build` → สร้างไฟล์ static
   - ไม่มี dev server → **Proxy ไม่ทำงาน!**

2. **ใช้ Environment Variable แทน:**
   ```typescript
   // frontend/src/lib/api.ts
   const API_BASE = import.meta.env.VITE_API_URL || "/api";
   ```
   
3. **Frontend เรียก API:**
   ```typescript
   fetch(`${VITE_API_URL}/login`)  // → ไปที่ Render backend URL
   ```

**สรุป:** Production **ไม่ใช้ proxy** จาก `vite.config.ts` เลย!

---

## 🎯 ทำไมไม่ต้องเปลี่ยน?

### ถ้าเปลี่ยนเป็น Render URL:

```typescript
// ❌ ผิด! ไม่ควรทำ
proxy: {
  '/api': {
    target: 'https://your-backend.onrender.com',  // ❌
  }
}
```

**ปัญหา:**
- ✅ Development อาจจะทำงานได้ (แต่ต้อง Backend บน Render รันอยู่)
- ❌ แต่ไม่มีประโยชน์เพราะ Production ไม่ใช้ proxy อยู่แล้ว
- ❌ ทำให้ development สับสน - บางครั้งใช้ localhost บางครั้งใช้ Render

---

## 📋 สรุป

| Mode | ใช้อะไร | target ใน vite.config.ts |
|------|--------|-------------------------|
| **Development** | Proxy (`vite.config.ts`) | `http://localhost:3000` ✅ |
| **Production** | `VITE_API_URL` env var | **ไม่ใช้** (proxy ไม่ทำงาน) |

---

## ✅ การตั้งค่าที่ถูกต้อง

### Development (vite.config.ts):
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',  // ✅ ถูกต้อง - ใช้ localhost
  }
}
```

### Production (Render Environment Variables):
```
VITE_API_URL = https://your-backend.onrender.com/api
```

---

## 💡 หมายเหตุ

- **Development:** ใช้ `localhost:3000` เพื่อรัน Backend ในเครื่อง
- **Production:** ใช้ `VITE_API_URL` เพื่อเรียก Backend บน Render
- **ไม่ต้องเปลี่ยน `target`** ใน `vite.config.ts` เพราะมันใช้แค่ development เท่านั้น

---

## ✅ Checklist

- [x] `vite.config.ts` - target เป็น `localhost:3000` ✅ (ถูกต้องแล้ว!)
- [ ] ตั้งค่า `VITE_API_URL` ใน Frontend Service (Render)
- [ ] Rebuild Frontend Service

---

**สรุป: ไม่ต้องเปลี่ยน `target` ใน `vite.config.ts` - ตั้งค่า `VITE_API_URL` ใน Render แทน!** ✅

