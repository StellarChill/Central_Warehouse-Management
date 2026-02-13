import { Router } from 'express';
import { createWarehouse, listWarehouses, getWarehouse, updateWarehouse, deleteWarehouse } from '../controllers/warehouseController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken);
// 1. อ่านข้อมูล (List/Get): ให้ WH_MANAGER/WAREHOUSE_ADMIN เข้าได้ด้วย
router.get('/', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER', 'WAREHOUSE_ADMIN'), listWarehouses);
router.get('/:id', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER', 'WAREHOUSE_ADMIN'), getWarehouse);

// 2. จัดการข้อมูล (Create/Update/Delete): เฉพาะ Admin
router.post('/', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN'), createWarehouse);
router.put('/:id', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN'), updateWarehouse);
router.delete('/:id', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN'), deleteWarehouse);

export default router;