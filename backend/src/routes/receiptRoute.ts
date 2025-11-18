import { Router } from 'express';
import { createReceipt, listReceipts, getReceipt, updateReceipt, deleteReceipt } from '../controllers/receiptController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.post('/', createReceipt);
router.get('/', listReceipts);
router.get('/:id', getReceipt);
router.put('/:id', updateReceipt);
router.delete('/:id', deleteReceipt);

export default router;
