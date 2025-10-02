# Sai Jai Management Backend API

Backend API สำหรับระบบจัดการสาขาสายใจ

## การติดตั้ง

```bash
npm install
```

## การรัน

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ backend:

```env
PORT=3001
NODE_ENV=development
```

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Health Check
```
GET /health
```

### Requisitions API
- `GET /api/requisitions` - ดึงรายการคำขอเบิกทั้งหมด
- `GET /api/requisitions/:id` - ดึงคำขอเบิกตาม ID
- `POST /api/requisitions` - สร้างคำขอเบิกใหม่
- `PUT /api/requisitions/:id/approve` - อนุมัติคำขอเบิก
- `PUT /api/requisitions/:id/reject` - ปฏิเสธคำขอเบิก
- `PUT /api/requisitions/:id/ship` - ทำเครื่องหมายว่าจัดส่งแล้ว
- `GET /api/requisitions/stats/summary` - สถิติคำขอเบิก

### Inventory API
- `GET /api/inventory` - ดึงรายการสินค้าทั้งหมด
- `GET /api/inventory/:id` - ดึงสินค้าตาม ID
- `POST /api/inventory` - เพิ่มสินค้าใหม่
- `PUT /api/inventory/:id` - แก้ไขข้อมูลสินค้า
- `PUT /api/inventory/:id/adjust` - ปรับจำนวนสต็อก
- `GET /api/inventory/stats/summary` - สถิติคลังสินค้า

### Suppliers API
- `GET /api/suppliers` - ดึงรายการผู้จัดจำหน่ายทั้งหมด
- `GET /api/suppliers/:id` - ดึงผู้จัดจำหน่ายตาม ID
- `POST /api/suppliers` - เพิ่มผู้จัดจำหน่ายใหม่
- `PUT /api/suppliers/:id` - แก้ไขข้อมูลผู้จัดจำหน่าย
- `DELETE /api/suppliers/:id` - ลบผู้จัดจำหน่าย
- `GET /api/suppliers/stats/summary` - สถิติผู้จัดจำหน่าย

## ตัวอย่างการใช้งาน

### ดึงรายการคำขอเบิกทั้งหมด
```bash
curl http://localhost:3001/api/requisitions
```

### สร้างคำขอเบิกใหม่
```bash
curl -X POST http://localhost:3001/api/requisitions \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "สาขาลาดพร้าว",
    "requestedBy": "วิชาญ",
    "items": [
      {
        "name": "น้ำดื่ม 600ml",
        "qty": 100,
        "unit": "ขวด"
      }
    ]
  }'
```

### อนุมัติคำขอเบิก
```bash
curl -X PUT http://localhost:3001/api/requisitions/REQ-2024-089/approve
```

## Dependencies

- **express**: Web framework
- **cors**: Cross-Origin Resource Sharing
- **helmet**: Security middleware
- **morgan**: HTTP request logger
- **dotenv**: Environment variables loader

## Development Dependencies

- **nodemon**: Auto-restart server during development
