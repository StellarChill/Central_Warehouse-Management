import { Router } from 'express';
import { createMaterial, listMaterials, getMaterial, updateMaterial, deleteMaterial } from '../controllers/materialController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken);

// ดูรายการสินค้า: ให้ทุกคนดูได้ (รวมถึง Requester เพื่อเลือกของเบิก)
router.get('/', listMaterials);
router.get('/:id', getMaterial);

// สร้าง/แก้ไข/ลบ: เฉพาะ Admin + Manager
// สร้าง/แก้ไข/ลบ: เฉพาะ Admin + Manager
router.post('/', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER', 'WAREHOUSE_ADMIN'), createMaterial);
router.put('/:id', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER', 'WAREHOUSE_ADMIN'), updateMaterial);
router.delete('/:id', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER', 'WAREHOUSE_ADMIN'), deleteMaterial);

export default router;