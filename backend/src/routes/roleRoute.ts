import { Router } from 'express';
import { listRoles } from '../controllers/roleController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.get('/', listRoles);

export default router;
