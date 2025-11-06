import { Router } from 'express';
import { getUsers, updateUserStatus } from '../controllers/adminController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// All routes in this file are protected and require admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', getUsers);
router.put('/users/:userId/status', updateUserStatus);

export default router;
