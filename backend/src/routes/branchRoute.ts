import { Router } from 'express';
import { createBranch, listBranches, getBranch, updateBranch, deleteBranch } from '../controllers/branchController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken);
// จัดการสาขา: ให้เฉพาะ Admin
router.use(requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN'));

router.post('/', createBranch);
router.get('/', listBranches);
router.get('/:id', getBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;