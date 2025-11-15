import { Router } from 'express';
import { createWarehouse, listWarehouses, getWarehouse, updateWarehouse, deleteWarehouse } from '../controllers/warehouseController';

const router = Router();

router.post('/', createWarehouse);
router.get('/', listWarehouses);
router.get('/:id', getWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

export default router;
