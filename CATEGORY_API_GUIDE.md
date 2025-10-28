# 📦 คู่มือ API Category (หมวดหมู่วัตถุดิบ)

## 🎯 ฟีเจอร์ที่พร้อมใช้งาน

- ✅ ดูรายการหมวดหมู่ทั้งหมด
- ✅ เพิ่มหมวดหมู่ใหม่
- ✅ แก้ไขหมวดหมู่
- ✅ ลบหมวดหมู่
- ✅ จัดการสิทธิ์ตาม Role (BRANCH ดูได้อย่างเดียว)

---

## 🔌 API Endpoints

### 1. ดูรายการหมวดหมู่ทั้งหมด

```
GET /api/catagory
```

**Response (200):**
```json
[
  {
    "CatagoryId": 1,
    "CatagoryName": "แป้ง",
    "CatagoryCode": "FLOUR",
    "CreatedAt": "2025-10-28T...",
    "CreatedBy": 1,
    "UpdatedAt": "2025-10-28T...",
    "UpdatedBy": null
  },
  {
    "CatagoryId": 2,
    "CatagoryName": "น้ำตาล",
    "CatagoryCode": "SUGAR",
    "CreatedAt": "2025-10-28T...",
    "CreatedBy": 1,
    "UpdatedAt": "2025-10-28T...",
    "UpdatedBy": null
  }
]
```

---

### 2. ดูหมวดหมู่ 1 รายการ

```
GET /api/catagory/:id
```

**Response (200):**
```json
{
  "CatagoryId": 1,
  "CatagoryName": "แป้ง",
  "CatagoryCode": "FLOUR",
  "CreatedAt": "2025-10-28T...",
  "CreatedBy": 1,
  "UpdatedAt": "2025-10-28T...",
  "UpdatedBy": null
}
```

**Response (404):**
```json
{
  "error": "Not found"
}
```

---

### 3. เพิ่มหมวดหมู่ใหม่

```
POST /api/catagory
Content-Type: application/json
```

**Request Body:**
```json
{
  "CatagoryName": "เนย",
  "CatagoryCode": "BUTTER",
  "CreatedBy": 1
}
```

**Response (201):**
```json
{
  "CatagoryId": 3,
  "CatagoryName": "เนย",
  "CatagoryCode": "BUTTER",
  "CreatedAt": "2025-10-28T...",
  "CreatedBy": 1,
  "UpdatedAt": "2025-10-28T...",
  "UpdatedBy": null
}
```

**Response (400) - ข้อมูลไม่ครบ:**
```json
{
  "error": "CatagoryName is required"
}
```

**Response (409) - รหัสซ้ำ:**
```json
{
  "error": "CatagoryCode already exists"
}
```

---

### 4. แก้ไขหมวดหมู่

```
PUT /api/catagory/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "CatagoryName": "เนยสด",
  "CatagoryCode": "BUTTER",
  "UpdatedBy": 1
}
```

**Response (200):**
```json
{
  "CatagoryId": 3,
  "CatagoryName": "เนยสด",
  "CatagoryCode": "BUTTER",
  "CreatedAt": "2025-10-28T...",
  "CreatedBy": 1,
  "UpdatedAt": "2025-10-28T... (updated)",
  "UpdatedBy": 1
}
```

**Response (404):**
```json
{
  "error": "Not found"
}
```

---

### 5. ลบหมวดหมู่

```
DELETE /api/catagory/:id
```

**Response (204):** No Content

**Response (404):**
```json
{
  "error": "Not found"
}
```

---

## 💻 การใช้งานใน Frontend

### 1. Import API Functions

```typescript
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from "@/lib/api";
```

### 2. ดูรายการหมวดหมู่

```typescript
async function loadCategories() {
  try {
    const categories = await getCategories();
    console.log(categories);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
```

### 3. เพิ่มหมวดหมู่ใหม่

```typescript
async function addCategory() {
  try {
    const newCategory = await createCategory({
      CatagoryName: "ไข่",
      CatagoryCode: "EGG"
    });
    console.log("Created:", newCategory);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
```

### 4. แก้ไขหมวดหมู่

```typescript
async function editCategory(id: number) {
  try {
    const updated = await updateCategory(id, {
      CatagoryName: "ไข่ไก่",
      CatagoryCode: "EGG"
    });
    console.log("Updated:", updated);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
```

### 5. ลบหมวดหมู่

```typescript
async function removeCategory(id: number) {
  try {
    await deleteCategory(id);
    console.log("Deleted successfully");
  } catch (error) {
    console.error("Error:", error.message);
  }
}
```

---

## 🎨 หน้า Categories ที่สร้างไว้

### เข้าใช้งาน

```
http://localhost:8080/categories
```

### ฟีเจอร์ใน UI

1. **ดูรายการ** - แสดง categories แบบ grid card
2. **ค้นหา** - ค้นหาด้วยชื่อหรือรหัส
3. **เพิ่ม** - เปิด dialog เพิ่มหมวดหมู่ใหม่
4. **แก้ไข** - คลิกปุ่ม Edit ใน card
5. **ลบ** - คลิกปุ่ม Delete พร้อมยืนยัน

### สิทธิ์การใช้งาน

| Role | สิทธิ์ |
|------|--------|
| **BRANCH** | ✅ ดูได้เท่านั้น (ไม่เห็นปุ่มเพิ่ม/แก้ไข/ลบ) |
| **CENTER** | ✅ ดู, เพิ่ม, แก้ไข, ลบได้ทั้งหมด |
| **ADMIN** | ✅ ดู, เพิ่ม, แก้ไข, ลบได้ทั้งหมด |

---

## 🧪 ทดสอบด้วย Postman/cURL

### ดูรายการ

```bash
curl http://localhost:3000/api/catagory
```

### เพิ่มหมวดหมู่

```bash
curl -X POST http://localhost:3000/api/catagory \
  -H "Content-Type: application/json" \
  -d '{
    "CatagoryName": "เนย",
    "CatagoryCode": "BUTTER",
    "CreatedBy": 1
  }'
```

### แก้ไขหมวดหมู่

```bash
curl -X PUT http://localhost:3000/api/catagory/1 \
  -H "Content-Type: application/json" \
  -d '{
    "CatagoryName": "แป้งเค้ก",
    "CatagoryCode": "FLOUR-CAKE",
    "UpdatedBy": 1
  }'
```

### ลบหมวดหมู่

```bash
curl -X DELETE http://localhost:3000/api/catagory/1
```

---

## 📝 Validation Rules

### CatagoryName (ชื่อหมวดหมู่)
- ✅ Required (จำเป็น)
- ✅ String
- ✅ ตัวอย่าง: "แป้ง", "น้ำตาล", "เนย"

### CatagoryCode (รหัสหมวดหมู่)
- ✅ Required (จำเป็น)
- ✅ Unique (ไม่ซ้ำในระบบ)
- ✅ ตัวพิมพ์ใหญ่, ตัวเลข, เครื่องหมาย - เท่านั้น
- ✅ ตัวอย่าง: "FLOUR", "SUGAR", "BUTTER"

---

## 🐛 Error Codes

| Status | Error | คำอธิบาย |
|--------|-------|----------|
| 400 | CatagoryName is required | ไม่ได้กรอกชื่อหมวดหมู่ |
| 400 | CatagoryCode is required | ไม่ได้กรอกรหัสหมวดหมู่ |
| 404 | Not found | ไม่พบหมวดหมู่ที่ต้องการ |
| 409 | CatagoryCode already exists | รหัสหมวดหมู่ซ้ำกับที่มีอยู่ |
| 500 | Internal server error | เกิดข้อผิดพลาดที่ server |

---

## 🚀 สรุปไฟล์ที่สร้างใหม่

```
frontend/src/
├── lib/
│   └── api.ts                    # API functions สำหรับเรียก Category API
├── pages/
│   └── CategoriesPage.tsx        # หน้าจัดการหมวดหมู่ (CRUD)
└── hooks/
    └── use-permissions.ts        # Hook ตรวจสอบสิทธิ์

backend/src/
├── controllers/
│   └── catagoryController.ts     # มีอยู่แล้ว ✅
└── routes/
    └── catagoryRoute.ts          # มีอยู่แล้ว ✅
```

---

## ✅ เสร็จแล้ว!

ตอนนี้คุณสามารถ:
1. ✅ เข้าหน้า `/categories` จากเมนูด้านซ้าย
2. ✅ ดูรายการหมวดหมู่ทั้งหมด
3. ✅ เพิ่ม แก้ไข ลบหมวดหมู่ (ถ้าเป็น CENTER หรือ ADMIN)
4. ✅ ค้นหาหมวดหมู่
5. ✅ BRANCH จะดูได้อย่างเดียว (ไม่มีปุ่มแก้ไข)

**หมายเหตุ:** ตรวจสอบให้แน่ใจว่า backend ทำงานอยู่ที่ `http://localhost:3000` ✅

