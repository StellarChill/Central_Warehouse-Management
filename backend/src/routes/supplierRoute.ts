import { Router } from 'express';
import { createSupplier, listSuppliers, getSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken);
// จัดการ Supplier: Admin + Manager
router.use(requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER'));

router.post('/', createSupplier);
router.get('/', listSuppliers);
router.get('/:id', getSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;