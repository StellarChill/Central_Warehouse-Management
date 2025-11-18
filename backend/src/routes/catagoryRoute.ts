import { Router } from 'express';
import { createCatagory, listCatagories, getCatagory, updateCatagory, deleteCatagory } from '../controllers/catagoryController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.post('/', createCatagory);
router.get('/', listCatagories);
router.get('/:id', getCatagory);
router.put('/:id', updateCatagory);
router.delete('/:id', deleteCatagory);

export default router;
