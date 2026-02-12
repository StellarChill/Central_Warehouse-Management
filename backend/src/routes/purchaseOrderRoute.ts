import { Router } from 'express';
import { createPurchaseOrder, listPurchaseOrders, getPurchaseOrder, updatePurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder } from '../controllers/purchaseOrderController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken);
// สั่งซื้อ: เฉพาะคนทำงานคลัง
router.use(requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER'));

router.post('/', createPurchaseOrder);
router.get('/', listPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.put('/:id', updatePurchaseOrder);
router.patch('/:id/status', updatePurchaseOrderStatus);
router.delete('/:id', deletePurchaseOrder);

export default router;