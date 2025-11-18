import { Router } from 'express';
import { createBranch, listBranches, getBranch, updateBranch, deleteBranch } from '../controllers/branchController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.post('/', createBranch);
router.get('/', listBranches);
router.get('/:id', getBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;
