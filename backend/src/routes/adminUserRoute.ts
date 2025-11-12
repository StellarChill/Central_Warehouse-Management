import { Router } from 'express';
import { listUsers, approveUser, deleteUser, updateUser } from '../controllers/adminUserController';

const router = Router();

router.get('/users', listUsers);
router.post('/users/:id/approve', approveUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
