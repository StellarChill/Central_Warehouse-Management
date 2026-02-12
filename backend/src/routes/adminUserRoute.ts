import { Router } from 'express';
import { listUsers, approveUser, deleteUser, updateUser } from '../controllers/adminUserController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/rolesMiddleware';

const router = Router();
// อนุญาตเฉพาะ Platform Admin และ Company Admin
router.use(authenticateToken, requireRoles('COMPANY_ADMIN', 'PLATFORM_ADMIN'));

router.get('/users', listUsers);
router.post('/users/:id/approve', approveUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;