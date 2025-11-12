import { Router } from 'express';
import { createIssueFromRequest, listIssues, getIssue, deleteIssue } from '../controllers/issueController';

const router = Router();

router.post('/from-request/:requestId', createIssueFromRequest);
router.get('/', listIssues);
router.get('/:id', getIssue);
router.delete('/:id', deleteIssue);

export default router;
