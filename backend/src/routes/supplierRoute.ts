import { Router } from 'express';
import { createSupplier, listSuppliers, getSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController';

const router = Router();

router.post('/', createSupplier);
router.get('/', listSuppliers);
router.get('/:id', getSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
