import { Router } from 'express';
import { listStocks, getStock, stockSummary } from '../controllers/stockController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.get('/', listStocks);
router.get('/summary', stockSummary);
router.get('/:id', getStock);

export default router;
