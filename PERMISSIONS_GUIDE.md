# 🔐 คู่มือการจัดการสิทธิ์ (Permissions Guide)

## 📋 สรุปสิทธิ์ตาม Role

| ฟีเจอร์ | BRANCH (สาขา) | CENTER (คลัง) | ADMIN |
|---------|---------------|---------------|-------|
| **คำขอเบิกสินค้า** |
| ดูรายการคำขอเบิก | ✅ (เฉพาะของตัวเอง) | ✅ (ทั้งหมด) | ✅ (ทั้งหมด) |
| สร้างคำขอเบิก | ✅ | ✅ | ✅ |
| อนุมัติ/ปฏิเสธคำขอเบิก | ❌ | ✅ | ✅ |
| **คลังสินค้า** |
| ดูสต็อกสินค้า | ✅ (อ่านอย่างเดียว) | ✅ | ✅ |
| แก้ไขสต็อก | ❌ | ✅ | ✅ |
| รับสินค้าเข้าคลัง | ❌ | ✅ | ✅ |
| **ผู้จำหน่าย** |
| ดูรายชื่อผู้จำหน่าย | ✅ (อ่านอย่างเดียว) | ✅ | ✅ |
| เพิ่ม/แก้ไขผู้จำหน่าย | ❌ | ✅ | ✅ |
| **ใบสั่งซื้อ** |
| ดูใบสั่งซื้อ | ✅ (อ่านอย่างเดียว) | ✅ | ✅ |
| สร้างใบสั่งซื้อ | ❌ | ✅ | ✅ |
| **รายงาน** |
| ดูรายงานสาขาตัวเอง | ✅ | ✅ | ✅ |
| ดูรายงานทั้งหมด | ❌ | ✅ | ✅ |
| **จัดการผู้ใช้** |
| ดูรายชื่อผู้ใช้ | ❌ | ❌ | ✅ |
| เพิ่ม/แก้ไข/ลบผู้ใช้ | ❌ | ❌ | ✅ |

---

## 🔧 Backend: วิธีใช้ Middleware

### 1. Import Middleware

```typescript
import { authenticate, authorize, ROLES } from '../middlewares/authorize';
```

### 2. ใช้กับ Routes

#### ตัวอย่าง: ทุกคนที่ login แล้วเข้าได้

```typescript
// ดูรายการคำขอเบิก (ทุก role ที่ login แล้ว)
router.get('/api/requisitions', authenticate, getRequisitions);
```

#### ตัวอย่าง: เฉพาะ CENTER และ ADMIN

```typescript
// อนุมัติคำขอเบิก (CENTER และ ADMIN เท่านั้น)
router.patch(
  '/api/requisitions/:id/approve',
  authenticate,
  authorize([ROLES.CENTER, ROLES.ADMIN]),
  approveRequisition
);
```

#### ตัวอย่าง: เฉพาะ ADMIN

```typescript
// จัดการผู้ใช้ (ADMIN เท่านั้น)
router.post(
  '/api/users',
  authenticate,
  authorize([ROLES.ADMIN]),
  createUser
);
```

### 3. ตัวอย่าง Routes ทั้งหมด

```typescript
// backend/src/routes/requisitionRoute.ts
import { Router } from 'express';
import { authenticate, authorize, ROLES } from '../middlewares/authorize';

const router = Router();

// ทุก route ต้อง authenticate ก่อน
router.use(authenticate);

// ✅ ทุก role: ดูรายการคำขอเบิก
router.get('/', getRequisitions);

// ✅ ทุก role: สร้างคำขอเบิก
router.post('/', createRequisition);

// ⭐ CENTER + ADMIN เท่านั้น: อนุมัติ
router.patch('/:id/approve', authorize([ROLES.CENTER, ROLES.ADMIN]), approveRequisition);

// ⭐ CENTER + ADMIN เท่านั้น: ปฏิเสธ
router.patch('/:id/reject', authorize([ROLES.CENTER, ROLES.ADMIN]), rejectRequisition);

export default router;
```

### 4. ใช้ข้อมูล User ใน Controller

```typescript
import { AuthRequest } from '../middlewares/authorize';

export async function getRequisitions(req: AuthRequest, res: Response) {
  const { UserId, RoleId } = req.user!; // ได้จาก JWT token
  
  // ถ้าเป็น BRANCH (3) ให้เห็นเฉพาะของตัวเอง
  if (RoleId === 3) {
    const requisitions = await prisma.withdrawnRequest.findMany({
      where: { CreatedBy: UserId },
    });
    return res.json(requisitions);
  }
  
  // CENTER (2) และ ADMIN (1) เห็นทั้งหมด
  const requisitions = await prisma.withdrawnRequest.findMany();
  return res.json(requisitions);
}
```

---

## 🎨 Frontend: วิธีซ่อน/แสดงปุ่มตาม Role

### 1. Import Hook

```typescript
import { usePermissions } from "@/hooks/use-permissions";
```

### 2. ตัวอย่างการใช้งาน

#### ซ่อนปุ่มอนุมัติสำหรับ BRANCH

```tsx
export default function RequisitionsPage() {
  const { canApproveRequisition, isBranch } = usePermissions();
  
  return (
    <div>
      {/* BRANCH ดูได้แต่ไม่มีปุ่มอนุมัติ */}
      <Table>
        {/* ... */}
        <TableCell>
          {canApproveRequisition && (
            <>
              <Button>อนุมัติ</Button>
              <Button variant="destructive">ปฏิเสธ</Button>
            </>
          )}
          
          {isBranch && (
            <Badge variant="outline">รออนุมัติ</Badge>
          )}
        </TableCell>
      </Table>
    </div>
  );
}
```

#### ซ่อนเมนูสำหรับ BRANCH

```tsx
export function Sidebar() {
  const { canManageSuppliers, canManageUsers, isAdmin } = usePermissions();
  
  return (
    <nav>
      {/* ทุกคนเห็น */}
      <NavLink to="/">หน้าแรก</NavLink>
      <NavLink to="/requisitions">คำขอเบิก</NavLink>
      
      {/* CENTER และ ADMIN เท่านั้น */}
      {canManageSuppliers && (
        <NavLink to="/suppliers">ผู้จำหน่าย</NavLink>
      )}
      
      {/* ADMIN เท่านั้น */}
      {canManageUsers && (
        <NavLink to="/admin/users">จัดการผู้ใช้</NavLink>
      )}
    </nav>
  );
}
```

#### แสดงข้อความแจ้งเตือนสำหรับ BRANCH

```tsx
export default function InventoryPage() {
  const { canEditProducts, isBranch } = usePermissions();
  
  return (
    <div>
      <h1>คลังสินค้า</h1>
      
      {isBranch && (
        <Alert>
          <AlertDescription>
            คุณสามารถดูข้อมูลได้เท่านั้น ไม่สามารถแก้ไขได้
          </AlertDescription>
        </Alert>
      )}
      
      <Table>
        {/* ... */}
        {canEditProducts && (
          <Button>แก้ไข</Button>
        )}
      </Table>
    </div>
  );
}
```

---

## 📝 Checklist สำหรับทีมพัฒนา

### Backend Developer

- [ ] เพิ่ม `authenticate` middleware ในทุก protected routes
- [ ] เพิ่ม `authorize([ROLES...])` ใน routes ที่ต้องจำกัดสิทธิ์
- [ ] ตรวจสอบ `RoleId` ใน Controller เพื่อกรองข้อมูล
- [ ] ทดสอบด้วย token ของแต่ละ role

### Frontend Developer

- [ ] Import `usePermissions` ในหน้าที่ต้องตรวจสอบสิทธิ์
- [ ] ซ่อนปุ่มที่ BRANCH ไม่ควรเห็น (อนุมัติ, แก้ไข, ลบ)
- [ ] แสดงข้อความแจ้งเตือนสำหรับ BRANCH
- [ ] ซ่อนเมนูที่ BRANCH ไม่ควรเข้าถึง
- [ ] ทดสอบด้วยการ login ด้วย role ต่างๆ

---

## 🧪 การทดสอบ

### 1. สร้าง User แต่ละ Role

```bash
# ใน frontend หน้า Register
- สร้าง user: branch1 / password123 / Role: BRANCH
- สร้าง user: center1 / password123 / Role: CENTER
- ใช้ user: admin / admin123 / Role: ADMIN (มีอยู่แล้ว)
```

### 2. ทดสอบแต่ละ Role

| Role | ทดสอบ |
|------|-------|
| **BRANCH** | - ✅ ดูรายการคำขอเบิก (เฉพาะของตัวเอง)<br>- ✅ สร้างคำขอเบิกใหม่<br>- ❌ ไม่เห็นปุ่มอนุมัติ<br>- ❌ ไม่เห็นเมนู "ผู้จำหน่าย", "จัดการผู้ใช้" |
| **CENTER** | - ✅ ดูคำขอเบิกทั้งหมด<br>- ✅ เห็นปุ่มอนุมัติ/ปฏิเสธ<br>- ✅ แก้ไขคลังสินค้าได้<br>- ❌ ไม่เห็นเมนู "จัดการผู้ใช้" |
| **ADMIN** | - ✅ ทำได้ทุกอย่าง |

---

## 💡 Tips

1. **Backend**: ใช้ `authenticate` ทุก protected route, ใช้ `authorize` เมื่อต้องจำกัดเฉพาะ role
2. **Frontend**: ใช้ `usePermissions` เพื่อซ่อน/แสดง UI ตาม role
3. **Security**: อย่าลืมตรวจสอบสิทธิ์ที่ Backend เสมอ (Frontend แค่ซ่อน UI)
4. **Testing**: ทดสอบด้วยการ login ด้วย user ทั้ง 3 role

---

## 📞 ติดต่อ

หากมีคำถามเกี่ยวกับการจัดการสิทธิ์ ติดต่อทีม Backend/Frontend ได้เลย!

