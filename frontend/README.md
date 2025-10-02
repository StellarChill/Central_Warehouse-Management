# Sai Jai Management Frontend

React Frontend สำหรับระบบจัดการสาขาสายใจ

## การติดตั้ง

```bash
npm install
```

## การรัน

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## เทคโนโลยีที่ใช้

- **React 18**: Frontend framework
- **TypeScript**: Type safety
- **Vite**: Build tool และ development server
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: UI component library
- **Lucide React**: Icon library

## โครงสร้างโปรเจค

```
src/
├── components/        # Reusable components
│   ├── ui/           # Shadcn/ui components
│   └── layout/       # Layout components
├── context/          # React Context providers
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/            # Page components
└── i18n/             # Internationalization
```

## หน้าหลัก

- **Dashboard**: หน้าหลักแสดงภาพรวม
- **Inventory**: จัดการคลังสินค้า
- **Requisitions**: จัดการการเบิกวัตถุดิบ
- **Suppliers**: จัดการผู้จัดจำหน่าย
- **Products**: จัดการสินค้า
- **Purchase Orders**: จัดการใบสั่งซื้อ
- **Receiving**: จัดการการรับสินค้า

## การเชื่อมต่อกับ Backend

Frontend จะเชื่อมต่อกับ Backend API ที่ `http://localhost:3001`

### ตัวอย่างการเรียก API

```typescript
// ดึงรายการคำขอเบิก
const response = await fetch('http://localhost:3001/api/requisitions');
const data = await response.json();

// สร้างคำขอเบิกใหม่
const response = await fetch('http://localhost:3001/api/requisitions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    branch: 'สาขาลาดพร้าว',
    requestedBy: 'วิชาญ',
    items: [
      {
        name: 'น้ำดื่ม 600ml',
        qty: 100,
        unit: 'ขวด'
      }
    ]
  })
});
```

## การเพิ่ม LINE LIFF

1. ติดตั้ง LINE LIFF SDK:
```bash
npm install @line/liff
```

2. เพิ่ม LIFF ID ใน environment variables:
```env
VITE_LIFF_ID=your_liff_id
```

3. สร้าง LIFF context:
```typescript
// src/context/LiffContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import liff from '@line/liff';

const LiffContext = createContext(null);

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (!context) {
    throw new Error('useLiff must be used within LiffProvider');
  }
  return context;
};
```

## การ Build และ Deploy

### Build สำหรับ Production
```bash
npm run build
```

ไฟล์ที่ build จะอยู่ในโฟลเดอร์ `dist/`

### Deploy ไปยัง Static Hosting
- **Vercel**: `vercel --prod`
- **Netlify**: อัปโหลดโฟลเดอร์ `dist/`
- **GitHub Pages**: ใช้ GitHub Actions

## Scripts

- `npm run dev`: รัน development server
- `npm run build`: build สำหรับ production
- `npm run preview`: preview production build
- `npm run lint`: รัน ESLint
- `npm run type-check`: ตรวจสอบ TypeScript types
