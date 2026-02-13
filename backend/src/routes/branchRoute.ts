import { Router } from 'express';
import { createBranch, listBranches, getBranch, updateBranch, deleteBranch } from '../controllers/branchController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken);
// จัดการสาขา: ให้เฉพาะ Admin สำหรับ create/update/delete
// router.use(requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN'));

router.post('/', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN'), createBranch);
router.get('/', listBranches); // Controller filters by CompanyId
router.get('/:id', getBranch);
router.put('/:id', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN'), updateBranch);
router.delete('/:id', requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN'), deleteBranch);

export default router;