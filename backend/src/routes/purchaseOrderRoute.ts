import { Router } from 'express';
import { createPurchaseOrder, listPurchaseOrders, getPurchaseOrder, updatePurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder } from '../controllers/purchaseOrderController';

const router = Router();

router.post('/', createPurchaseOrder);
router.get('/', listPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.put('/:id', updatePurchaseOrder);
router.patch('/:id/status', updatePurchaseOrderStatus);
router.delete('/:id', deletePurchaseOrder);

export default router;
