import { Router } from 'express';
import { createPurchaseOrder, listPurchaseOrders, getPurchaseOrder, updatePurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder } from '../controllers/purchaseOrderController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.post('/', createPurchaseOrder);
router.get('/', listPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.put('/:id', updatePurchaseOrder);
router.patch('/:id/status', updatePurchaseOrderStatus);
router.delete('/:id', deletePurchaseOrder);

export default router;
