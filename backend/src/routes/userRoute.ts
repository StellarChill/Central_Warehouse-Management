import { Router } from 'express';
import { login } from '../controllers/loginController';
import { register } from '../controllers/userController';
import { lineLogin } from '../controllers/lineController';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/line-login', lineLogin);

export default router;
