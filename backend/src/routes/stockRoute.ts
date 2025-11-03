import { Router } from 'express';
import { listStocks, getStock, stockSummary } from '../controllers/stockController';

const router = Router();

router.get('/', listStocks);
router.get('/summary', stockSummary);
router.get('/:id', getStock);

export default router;
