import { Router } from 'express';
import { login } from '../controllers/loginController';
import { register } from '../controllers/userController';

const router = Router();

router.post('/login', login);
router.post('/register', register);

export default router;
