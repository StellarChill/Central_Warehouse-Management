import { Router } from 'express';
import { createIssueFromRequest, listIssues, getIssue, deleteIssue } from '../controllers/issueController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken);
// ตัดของ (Issue): เฉพาะคนทำงานคลัง
router.use(requireRoles('PLATFORM_ADMIN', 'COMPANY_ADMIN', 'WH_MANAGER', 'WAREHOUSE_ADMIN'));

router.post('/from-request/:requestId', createIssueFromRequest);
router.get('/', listIssues);
router.get('/:id', getIssue);
router.delete('/:id', deleteIssue);

export default router;