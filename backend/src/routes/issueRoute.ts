import { Router } from 'express';
import { createIssueFromRequest, listIssues, getIssue, deleteIssue } from '../controllers/issueController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.post('/from-request/:requestId', createIssueFromRequest);
router.get('/', listIssues);
router.get('/:id', getIssue);
router.delete('/:id', deleteIssue);

export default router;
