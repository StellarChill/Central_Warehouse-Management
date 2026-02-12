import { Router } from 'express';
import { createWarehouse, listWarehouses, getWarehouse, updateWarehouse, deleteWarehouse } from '../controllers/warehouseController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken);
// จัดการคลัง: ให้เฉพาะ Admin
router.use(requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN'));

router.post('/', createWarehouse);
router.get('/', listWarehouses);
router.get('/:id', getWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

export default router;