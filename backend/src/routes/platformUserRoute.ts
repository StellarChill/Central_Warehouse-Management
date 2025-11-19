import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';
import { listPendingUsers, setApproval, assignUserCompany, setActiveStatus } from '../controllers/platformUserController';

const router = Router();

// Platform admins/staff only
router.use(authenticateToken, requireRoles('PLATFORM_ADMIN', 'PLATFORM_STAFF'));

router.get('/users/pending', listPendingUsers); // ?status=PENDING|APPROVED|REJECTED
router.post('/users/:id/approve', setApproval); // body { action: 'APPROVE' | 'REJECT' }
router.post('/users/:id/assign', assignUserCompany); // body { CompanyId, BranchId?, RoleId? }
router.post('/users/:id/active', setActiveStatus); // body { status: 'ACTIVE' | 'INACTIVE' }

export default router;
