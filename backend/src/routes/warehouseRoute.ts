import { Router } from 'express';
import { createWarehouse, listWarehouses, getWarehouse, updateWarehouse, deleteWarehouse } from '../controllers/warehouseController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.post('/', createWarehouse);
router.get('/', listWarehouses);
router.get('/:id', getWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

export default router;
