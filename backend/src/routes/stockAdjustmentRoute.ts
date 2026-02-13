
import { Router } from 'express';
import { createStockAdjustment, listStockAdjustments } from '../controllers/stockAdjustmentController';

const router = Router();

// POST /api/stock-adjustments
router.post('/', createStockAdjustment);

// GET /api/stock-adjustments?warehouseId=1&materialId=2
router.get('/', listStockAdjustments);

export default router;
