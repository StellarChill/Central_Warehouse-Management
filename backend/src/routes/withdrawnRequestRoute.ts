import { Router } from 'express';
import { createWithdrawnRequest, listWithdrawnRequests, getWithdrawnRequest, updateWithdrawnRequest, deleteWithdrawnRequest } from '../controllers/withdrawnRequestController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken);

// 1. สร้างใบเบิก: ให้ทุกคนทำได้ (รวม Requester)
router.post('/', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER', 'REQUESTER'), createWithdrawnRequest);

// 2. ดูใบเบิก: ดูได้ทุกคน (Controller ควรกรองให้ Requester เห็นแค่ของตัวเอง)
router.get('/', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER', 'REQUESTER'), listWithdrawnRequests);
router.get('/:id', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER', 'REQUESTER'), getWithdrawnRequest);

// 3. แก้ไข/ลบ/อนุมัติ: ให้เฉพาะ Admin และ Manager
// (Requester ไม่ควรแก้สถานะเองได้ หรือลบใบเบิกที่ส่งไปแล้วมั่วซั่ว)
router.put('/:id', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER'), updateWithdrawnRequest);
router.delete('/:id', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER'), deleteWithdrawnRequest);

export default router;