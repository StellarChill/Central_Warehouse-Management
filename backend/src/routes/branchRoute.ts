import { Router } from 'express';
import { createBranch, listBranches, getBranch, updateBranch, deleteBranch } from '../controllers/branchController';

const router = Router();

router.post('/', createBranch);
router.get('/', listBranches);
router.get('/:id', getBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;
