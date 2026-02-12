import { Router } from 'express';
import { createReceipt, listReceipts, getReceipt, updateReceipt, deleteReceipt } from '../controllers/receiptController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken);
// รับของ: เฉพาะคนทำงานคลัง
router.use(requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER'));

router.post('/', createReceipt);
router.get('/', listReceipts);
router.get('/:id', getReceipt);
router.put('/:id', updateReceipt);
router.delete('/:id', deleteReceipt);

export default router;