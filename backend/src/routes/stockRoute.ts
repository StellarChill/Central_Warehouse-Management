import { Router } from 'express';
import { listStocks, getStock, stockSummary } from '../controllers/stockController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken);
// ดูสต็อกละเอียด: เฉพาะคนทำงานคลัง (Requester ไม่ควรเห็นต้นทุน/Lot)
router.use(requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER', 'WAREHOUSE_ADMIN'));

router.get('/', listStocks);
router.get('/summary', stockSummary);
router.get('/:id', getStock);

export default router;