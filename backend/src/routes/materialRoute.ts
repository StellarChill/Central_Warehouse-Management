import { Router } from 'express';
import { createMaterial, listMaterials, getMaterial, updateMaterial, deleteMaterial } from '../controllers/materialController';

const router = Router();

router.post('/', createMaterial);
router.get('/', listMaterials);
router.get('/:id', getMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

export default router;
