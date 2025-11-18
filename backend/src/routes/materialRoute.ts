import { Router } from 'express';
import { createMaterial, listMaterials, getMaterial, updateMaterial, deleteMaterial } from '../controllers/materialController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Require authentication for material operations
router.use(authenticateToken);

router.post('/', createMaterial);
router.get('/', listMaterials);
router.get('/:id', getMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

export default router;
