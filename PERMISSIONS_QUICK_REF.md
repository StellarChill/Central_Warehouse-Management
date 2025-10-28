# 🔐 สรุปสิทธิ์แบบเร็ว (Quick Reference)

## 🎯 สิทธิ์ตาม Role

```
BRANCH (สาขา) = RoleId: 3
├─ ✅ ดูข้อมูล (Read Only)
├─ ✅ สร้างคำขอเบิก
└─ ❌ อนุมัติ / แก้ไข / ลบ

CENTER (คลัง) = RoleId: 2
├─ ✅ ดูข้อมูลทั้งหมด
├─ ✅ อนุมัติคำขอเบิก
├─ ✅ จัดการคลัง / ผู้จำหน่าย
└─ ❌ จัดการผู้ใช้

ADMIN = RoleId: 1
└─ ✅ ทำได้ทุกอย่าง
```

---

## 🔧 Backend: การใช้ Middleware

### ทุกคนที่ login แล้ว
```typescript
router.get('/api/products', authenticate, getProducts);
```

### CENTER + ADMIN เท่านั้น
```typescript
router.patch('/api/requisitions/:id/approve', 
  authenticate, 
  authorize([ROLES.CENTER, ROLES.ADMIN]), 
  approveRequisition
);
```

### ADMIN เท่านั้น
```typescript
router.delete('/api/users/:id', 
  authenticate, 
  authorize([ROLES.ADMIN]), 
  deleteUser
);
```

---

## 🎨 Frontend: ซ่อน/แสดง UI

### ซ่อนปุ่มสำหรับ BRANCH
```tsx
const { canApproveRequisition } = usePermissions();

{canApproveRequisition && (
  <Button>อนุมัติ</Button>
)}
```

### แสดงข้อความแจ้งเตือน
```tsx
const { isBranch } = usePermissions();

{isBranch && (
  <Alert>คุณสามารถดูได้เท่านั้น</Alert>
)}
```

### ซ่อนเมนู
```tsx
const { canManageUsers } = usePermissions();

{canManageUsers && (
  <NavLink to="/admin/users">จัดการผู้ใช้</NavLink>
)}
```

---

## 📋 Checklist

### Backend
- [ ] `import { authenticate, authorize, ROLES } from '../middlewares/authorize'`
- [ ] เพิ่ม `authenticate` ในทุก protected route
- [ ] เพิ่ม `authorize([ROLES...])` ใน route ที่จำกัดสิทธิ์
- [ ] ใช้ `req.user` เพื่อกรองข้อมูลตาม role

### Frontend  
- [ ] `import { usePermissions } from "@/hooks/use-permissions"`
- [ ] ใช้ `canXXX` เพื่อซ่อน/แสดงปุ่ม
- [ ] ใช้ `isBranch` เพื่อแสดงข้อความแจ้งเตือน
- [ ] ซ่อนเมนูที่ BRANCH ไม่ควรเห็น

---

## 🧪 ทดสอบ

1. สร้าง user ทั้ง 3 role จากหน้า Register
2. Login ด้วยแต่ละ role แล้วดูว่า:
   - BRANCH: ❌ ไม่เห็นปุ่มอนุมัติ, ไม่เห็นเมนูจัดการ
   - CENTER: ✅ เห็นปุ่มอนุมัติ, เห็นเมนูคลัง/ผู้จำหน่าย
   - ADMIN: ✅ เห็นทุกอย่าง

---

## 💡 สรุป 1 บรรทัด

- **Backend**: `authenticate` + `authorize([ROLES...])`
- **Frontend**: `usePermissions()` → `{canXXX && <Button />}`

