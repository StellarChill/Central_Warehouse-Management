import { Router } from 'express';
import { listUsers, approveUser, deleteUser, updateUser } from '../controllers/adminUserController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
router.use(authenticateToken, requireRoles('ADMIN', 'PLATFORM_ADMIN'));

router.get('/users', listUsers);
router.post('/users/:id/approve', approveUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
